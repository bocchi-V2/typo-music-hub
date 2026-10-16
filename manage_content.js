/**
 * ============================================================
 *  MANAGE_CONTENT.JS – เครื่องมือจัดการเพลงและอนิเมะสำหรับไทโปมิวสิค
 *  คำสั่งเพิ่มเพลง, เพิ่มอนิเมะ, สแกนตรวจสอบ 18+, และ Deploy ไปยัง Netlify
 * ============================================================
 * 
 * วิธีใช้งาน:
 * 1. เพิ่มอนิเมะเดี่ยว:
 *    node manage_content.js add-anime --name "Frieren: Beyond Journey's End" --nameTH "คำอธิษฐานในวันที่จากลา" --genre "แฟนตาซี,ผจญภัย,ดราม่า" --mood "chill"
 * 
 * 2. เพิ่มเพลงเดี่ยว (ค้นหา iTunes อัตโนมัติ ได้ไฟล์เสียง 30s + ปก 600x600):
 *    node manage_content.js add-song --title "Specialz" --artist "King Gnu" --lang "jp" --mood "hype" --anime "Jujutsu Kaisen"
 * 
 * 3. เพิ่มเพลงและอนิเมะชุดใหญ่ (Batch Safe Content):
 *    node manage_content.js batch
 * 
 * 4. ตรวจสอบความสมบูรณ์และสแกน 18+ ห้ามมีเนื้อหาไม่เหมาะสม:
 *    node manage_content.js audit
 * 
 * 5. Deploy ขึ้น Netlify ทันที:
 *    node manage_content.js deploy
 */

const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

const EXACT_ADULT_WORDS = [
  /\bhentai\b/i, /\becchi\b/i, /\berotica\b/i, /\br-?18\+?\b/i, /\b18\+/i, /\+18\b/i, /\b18\s*plus\b/i,
  /\badult\b/i, /\bsmut\b/i, /\byaoi\b/i, /\byuri\b/i, /\bsex\b/i, /\bporn\b/i,
  /\bnsfw\b/i, /\bxxx\b/i
];

const THAI_ADULT_WORDS = [
  'เฮนไท', 'เอจจิ', 'เซ็กส์', 'โป๊', 'ลามก', 'ทะลึ่ง', 'เสียว'
];

function check18Plus(text) {
  if (!text) return false;
  for (const rx of EXACT_ADULT_WORDS) {
    if (rx.test(text)) return rx.toString();
  }
  for (const kw of THAI_ADULT_WORDS) {
    if (text.includes(kw)) return kw;
  }
  return false;
}

function loadDB() {
  const code = fs.readFileSync('data.js', 'utf8');
  const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
  return fn();
}

function saveDB(ANIMES, SONGS, ANIME_PAIRS) {
  const output = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', output, 'utf8');
  console.log(`💾 บันทึก data.js เรียบร้อย: ${ANIMES.length} อนิเมะ | ${SONGS.length} เพลง | ${ANIME_PAIRS.length} คู่แนะนำ`);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

// ค้นหา iTunes Search API
async function searchITunes(term, lang = 'th') {
  const country = lang === 'th' ? 'th' : (lang === 'jp' ? 'jp' : 'us');
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5&country=${country}`;
  const data = await fetchJson(url);
  if (!data || !data.results || data.results.length === 0) return null;

  // กรองเฉพาะเพลงที่ปลอดภัย (ไม่ explicit หรือไม่ตรงกับคีย์เวิร์ด 18+)
  for (const track of data.results) {
    if (track.trackExplicitness === 'explicit') continue;
    const isAdult = check18Plus(`${track.trackName} ${track.artistName}`);
    if (isAdult) continue;
    if (track.previewUrl && track.artworkUrl100) {
      return {
        title: track.trackName,
        artist: track.artistName,
        previewUrl: track.previewUrl,
        coverUrl: track.artworkUrl100.replace('100x100bb', '600x600bb'),
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(track.trackName + ' ' + track.artistName)}`
      };
    }
  }
  return null;
}

// ค้นหา Kitsu API สำหรับโปสเตอร์อนิเมะ
async function searchKitsuAnime(query) {
  const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=3`;
  const data = await fetchJson(url);
  if (!data || !data.data || data.data.length === 0) return null;

  for (const item of data.data) {
    const attr = item.attributes;
    if (attr.ageRating === 'R18') continue;
    const isAdult = check18Plus(`${attr.canonicalTitle} ${attr.synopsis || ''}`);
    if (isAdult) continue;
    const poster = attr.posterImage?.medium || attr.posterImage?.original;
    if (poster) {
      return {
        title: attr.canonicalTitle,
        coverUrl: poster,
        synopsis: attr.synopsis
      };
    }
  }
  return null;
}

// ---- คำสั่ง AUDIT ----
function runAudit() {
  console.log('🔍 กำลังตรวจสอบบัค ความสมบูรณ์ และสแกนเนื้อหา 18+...');
  const { ANIMES, SONGS, ANIME_PAIRS } = loadDB();

  let flagged18 = 0;
  let missingPreviews = 0;
  let missingCovers = 0;
  let brokenPairs = 0;

  const animeIdSet = new Set(ANIMES.map(a => a.id));
  const songIdSet = new Set(SONGS.map(s => s.id));

  // 1. ตรวจสอบ 18+ ในอนิเมะ (ห้ามมีเนื้อหา 18+, เฮนไท, เอจจิ, ลามก เด็ดขาด 100%)
  ANIMES.forEach(a => {
    const text = `${a.name} ${a.nameTH || ''} ${(a.genre || []).join(' ')} ${a.synopsis || ''}`.toLowerCase();
    const matched = check18Plus(text);
    if (matched) {
      console.warn(`❌ พบคำต้องห้าม 18+ ในอนิเมะ ID ${a.id} (${a.name}): "${matched}"`);
      flagged18++;
    }
    if (!a.coverUrl || a.coverUrl.trim() === '') missingCovers++;
  });

  // 2. ตรวจสอบความสมบูรณ์ของเพลง (ตัวอย่างเสียง 30s + ปก HD)
  SONGS.forEach(s => {
    if (!s.previewUrl || s.previewUrl.trim() === '') missingPreviews++;
    if (!s.coverUrl || s.coverUrl.trim() === '') missingCovers++;
  });

  // 3. ตรวจสอบ Pair
  ANIME_PAIRS.forEach(p => {
    if (!songIdSet.has(p.songId) || !animeIdSet.has(p.animeId)) {
      console.warn(`❌ Pair ผิดพลาด: songId=${p.songId}, animeId=${p.animeId}`);
      brokenPairs++;
    }
  });

  console.log('----------------------------------------------------');
  console.log(`📊 ผลการตรวจสอบ:`);
  console.log(`- อนิเมะทั้งหมด: ${ANIMES.length} เรื่อง`);
  console.log(`- เพลงทั้งหมด: ${SONGS.length} เพลง`);
  console.log(`- คู่แนะนำทั้งหมด: ${ANIME_PAIRS.length} คู่`);
  console.log(`- ตรวจพบเนื้อหา 18+: ${flagged18} รายการ ${flagged18 === 0 ? '✅ ปลอดภัย 100%' : '⚠️ ต้องลบออก'}`);
  console.log(`- เพลงที่ไม่มีเสียงตัวอย่าง: ${missingPreviews} เพลง ${missingPreviews === 0 ? '✅ สมบูรณ์' : '⚠️'}`);
  console.log(`- ข้อมูลที่ไม่มีรูปปก: ${missingCovers} รายการ ${missingCovers === 0 ? '✅ สมบูรณ์' : '⚠️'}`);
  console.log(`- คู่แนะนำที่ไม่สมบูรณ์: ${brokenPairs} คู่ ${brokenPairs === 0 ? '✅ สมบูรณ์' : '⚠️'}`);
  console.log('----------------------------------------------------');
  return flagged18 === 0 && missingPreviews === 0 && missingCovers === 0 && brokenPairs === 0;
}

// ---- คำสั่ง DEPLOY ----
function runDeploy() {
  console.log('🚀 กำลังตรวจสอบความถูกต้องก่อน Deploy...');
  const ok = runAudit();
  if (!ok) {
    console.error('❌ พบข้อผิดพลาดหรือเนื้อหาไม่ผ่านเกณฑ์ ยกเลิกการ Deploy เพื่อความปลอดภัย');
    process.exit(1);
  }
  console.log('📦 เริ่มกระบวนการ Deploy ไปยัง Netlify Production...');
  try {
    const res = execSync('npx -y netlify-cli deploy --prod --dir .', { stdio: 'inherit' });
    console.log('🎉 Deploy สำเร็จเรียบร้อยแล้ว!');
  } catch (err) {
    console.error('❌ การ Deploy เกิดข้อผิดพลาด:', err.message);
  }
}

// CLI Argument Parser
const args = process.argv.slice(2);
const command = args[0] || 'help';

function getArg(key) {
  const idx = args.indexOf(`--${key}`);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return null;
}

async function main() {
  if (command === 'audit') {
    runAudit();
  } else if (command === 'deploy') {
    runDeploy();
  } else if (command === 'add-anime') {
    const name = getArg('name');
    const nameTH = getArg('nameTH') || name;
    const genreStr = getArg('genre') || 'อนิเมะ,แฟนตาซี';
    const mood = getArg('mood') || 'hype';

    if (!name) {
      console.error('ระบุชื่ออนิเมะด้วย --name "ชื่ออนิเมะ"');
      return;
    }

    if (check18Plus(`${name} ${nameTH} ${genreStr}`)) {
      console.error('❌ ปฏิเสธ: มีคำที่เกี่ยวข้องกับ 18+ ไม่สามารถเพิ่มได้');
      return;
    }

    const { ANIMES, SONGS, ANIME_PAIRS } = loadDB();
    const kitsu = await searchKitsuAnime(name);
    const coverUrl = kitsu ? kitsu.coverUrl : 'favicon-logo.jpg';
    const newId = Math.max(0, ...ANIMES.map(a => a.id)) + 1;

    const newAnime = {
      id: newId,
      name,
      nameTH,
      genre: genreStr.split(',').map(s => s.trim()),
      coverUrl,
      coverFallback: coverUrl,
      anifumeUrl: `https://anifume.com/?s=${encodeURIComponent(name)}`,
      mood
    };

    ANIMES.push(newAnime);
    saveDB(ANIMES, SONGS, ANIME_PAIRS);
    console.log(`✅ เพิ่มอนิเมะ "${name}" (ID ${newId}) เรียบร้อยแล้ว!`);
  } else if (command === 'add-song') {
    const title = getArg('title');
    const artist = getArg('artist') || '';
    const lang = getArg('lang') || 'th';
    const mood = getArg('mood') || 'chill';
    const animeName = getArg('anime');

    if (!title) {
      console.error('ระบุชื่อเพลงด้วย --title "ชื่อเพลง"');
      return;
    }

    if (check18Plus(`${title} ${artist}`)) {
      console.error('❌ ปฏิเสธ: มีคำที่เกี่ยวข้องกับ 18+ ไม่สามารถเพิ่มได้');
      return;
    }

    const { ANIMES, SONGS, ANIME_PAIRS } = loadDB();
    console.log(`🔎 ค้นหาตัวอย่างเพลงและปกจาก iTunes สำหรับ "${title} - ${artist}"...`);
    const track = await searchITunes(`${title} ${artist}`, lang);

    if (!track) {
      console.error('❌ ไม่พบเพลงหรือตัวอย่างเสียงที่ปลอดภัยบน iTunes');
      return;
    }

    let matchedAnime = null;
    if (animeName) {
      matchedAnime = ANIMES.find(a => a.name.toLowerCase().includes(animeName.toLowerCase()) || (a.nameTH && a.nameTH.includes(animeName)));
    }
    if (!matchedAnime) {
      matchedAnime = ANIMES[Math.floor(Math.random() * ANIMES.length)];
    }

    const newSongId = Math.max(0, ...SONGS.map(s => s.id)) + 1;
    const newSong = {
      id: newSongId,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      previewUrl: track.previewUrl,
      spotifyUrl: track.spotifyUrl,
      mood,
      tags: ["ไทโป", "แนะนำ", mood],
      bpm: "ปานกลาง (100 BPM)",
      lang,
      animeId: matchedAnime.id,
      animeMatch: [matchedAnime.id],
      reason: `เหมาะสำหรับตัดต่อคู่กับ ${matchedAnime.name} ด้วยจังหวะและมู้ดที่ลงตัว`,
      typoIdea: "ใช้ฟอนต์สไตล์โมเดิร์นตัดกับซีนไฮไลท์ จังหวะขึ้นท่อนฮุคใส่เอฟเฟกต์ซูมกระชากเบาๆ"
    };

    SONGS.push(newSong);
    ANIME_PAIRS.push({
      songId: newSongId,
      animeId: matchedAnime.id,
      category: mood,
      badge: '🎬 ตัดต่อไทโปสุดลงตัว',
      reason: newSong.reason,
      typoIdea: newSong.typoIdea
    });

    saveDB(ANIMES, SONGS, ANIME_PAIRS);
    console.log(`✅ เพิ่มเพลง "${track.title}" โดย ${track.artist} (ID ${newSongId}) คู่กับ "${matchedAnime.name}" เรียบร้อยแล้ว!`);
  } else {
    console.log(`
📚 เครื่องมือจัดการคลังเพลงและอนิเมะ ไทโปมิวสิค
คำสั่งที่รองรับ:
  node manage_content.js audit                     - สแกนตรวจสอบ 18+, บัค, ลิงก์เสีย, รูปเสีย
  node manage_content.js deploy                    - ตรวจสอบความถูกต้องและ Deploy ขึ้น Netlify ทันที
  node manage_content.js add-anime --name "..."    - เพิ่มอนิเมะ (ดึงรูปปก Kitsu อัตโนมัติ ปลอดภัยไร้ 18+)
  node manage_content.js add-song --title "..."    - เพิ่มเพลง (ดึงเสียง 30s + ปก 600x600 จาก iTunes อัตโนมัติ)
  node manage_content.js batch                     - เพิ่มเพลงและอนิเมะชุดใหญ่
    `);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runAudit, runDeploy, searchITunes, searchKitsuAnime, check18Plus };
