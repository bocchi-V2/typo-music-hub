/**
 * ============================================================
 *  AUTO_UPDATE_DAILY.JS
 *  ระบบอัปเดตเพลงและอนิเมะอัตโนมัติประจำวัน (Daily Auto-Drop System)
 *  รองรับการรันผ่าน Cron / Windows Task Scheduler / npm run daily
 * ============================================================
 * 
 * วิธีใช้งาน:
 * 1. ตรวจสอบและอัปเดตประจำวันตามปกติ:
 *    node auto_update_daily.js
 * 
 * 2. บังคับอัปเดตทันที (Force Update):
 *    node auto_update_daily.js --force
 * 
 * 3. อัปเดตเสร็จแล้ว Deploy ขึ้น Netlify ทันที:
 *    node auto_update_daily.js --deploy
 */

const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

const SYNC_FILE = '.daily_sync.json';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function fetchJson(url, headers = {}) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', ...headers } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function searchITunesSong(term) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=3`;
  const json = await fetchJson(url);
  if (!json || !json.results || !json.results.length) return null;
  const track = json.results.find(t => t.previewUrl && t.trackExplicitness !== 'explicit') || json.results[0];
  if (!track || !track.previewUrl) return null;
  return {
    title: track.trackName,
    artist: track.artistName,
    previewUrl: track.previewUrl,
    coverUrl: track.artworkUrl100.replace('100x100bb', '600x600bb'),
    spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(track.trackName + ' ' + track.artistName)}`
  };
}

async function searchKitsuAnime(query) {
  const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=1`;
  const json = await fetchJson(url, { 'Accept': 'application/vnd.api+json' });
  if (!json || !json.data || !json.data.length) return null;
  const attr = json.data[0].attributes;
  const cover = (attr.posterImage && (attr.posterImage.medium || attr.posterImage.large || attr.posterImage.original)) || 'favicon-logo.jpg';
  return {
    name: attr.canonicalTitle || query,
    nameTH: (attr.titles && attr.titles.th) || attr.canonicalTitle || query,
    coverUrl: cover,
    genre: ['อนิเมะ', 'ยอดนิยม']
  };
}

// Daily pool candidates
const DAILY_ANIME_POOL = [
  { name: "Blue Box", nameTH: "กล่องรักวัยใส", genre: ["กีฬา", "โรแมนติก", "โรงเรียน"], mood: "love" },
  { name: "Ranma 1/2 (2024)", nameTH: "รันม่า 1/2 ฉบับรีเมค", genre: ["คอมเมดี้", "ต่อสู้", "โรแมนติก"], mood: "hype" },
  { name: "Bleach: Thousand-Year Blood War", nameTH: "บลีช เทพมรณะ สงครามเลือดพันปี", genre: ["แอ็กชัน", "ต่อสู้", "เหนือธรรมชาติ"], mood: "hype" },
  { name: "Dragon Ball Daima", nameTH: "ดราก้อนบอล ไดมะ", genre: ["แอ็กชัน", "ผจญภัย", "ตลก"], mood: "hype" },
  { name: "Re:ZERO -Starting Life in Another World- Season 3", nameTH: "รีเซทชีวิต ฝ่าวิกฤติต่างโลก ซีซั่น 3", genre: ["ดราม่า", "แฟนตาซี", "ระทึกขวัญ"], mood: "hype" },
  { name: "Sakamoto Days", nameTH: "ซากาโมโตะเดย์ส", genre: ["แอ็กชัน", "คอมเมดี้", "นักฆ่า"], mood: "hype" },
  { name: "Lord of the Mysteries", nameTH: "ราชันเร้นลับ", genre: ["แฟนตาซี", "ลึกลับ", "สตีมพังก์"], mood: "hype" }
];

const DAILY_SONG_POOL = [
  { title: "Gotta Be", artist: "BUMKEY", lang: "en", mood: "chill", animeName: "Blue Box", tags: ["อาร์แอนด์บี", "กรูฟนุ่ม", "โรแมนติก"], typoIdea: "ไทโปตัวเขียนสไตล์โมเดิร์นสีขาวโปร่งแสง" },
  { title: "Daylight", artist: "David Kushner", lang: "en", mood: "sad", animeName: "Re:ZERO -Starting Life in Another World- Season 3", tags: ["ดาร์กบัลลาด", "อารมณ์หนัก", "ทรงพลัง"], typoIdea: "ตัวหนังสือสลายเป็นหมอกควันสีเทา" },
  { title: "ซ่อนกลิ่น", artist: "Palmy", lang: "th", mood: "love", animeName: "Frieren: Beyond Journey's End", tags: ["อินดี้ไทย", "คลาสสิค", "คิดถึง"], typoIdea: "ข้อความไทโปละลายกลีบดอกไม้ตามท่อนฮุก" },
  { title: "โต๊ะริม (melt)", artist: "NONT TANONT", lang: "th", mood: "love", animeName: "Blue Box", tags: ["น่ารัก", "ละมุน", "คลั่งรัก"], typoIdea: "ฟอนต์น่ารักขยับขึ้นลงตามจังหวะเดินเบส" },
  { title: "SPECIALZ", artist: "King Gnu", lang: "jp", mood: "hype", animeName: "Jujutsu Kaisen", tags: ["มันส์จัด", "ร็อกอัลเทอร์เนทีฟ", "ไวรัล"], typoIdea: "ตัวหนังสือแดง-ดำ ซูมกระชากตามบีทเพลง 119 BPM" },
  { title: "アイドル (Idol)", artist: "YOASOBI", lang: "jp", mood: "hype", animeName: "Oshi no Ko", tags: ["เจป๊อป", "ไฮป์สะใจ", "ตำนาน"], typoIdea: "เอฟเฟกต์แสงไฟดิสโก้และดาวระยิบระยับ" }
];

async function runDailyUpdate() {
  const args = process.argv.slice(2);
  const isForce = args.includes('--force');
  const shouldDeploy = args.includes('--deploy');

  console.log('══════════════════════════════════════════════════════════');
  console.log('☀️  ไทโปมิวสิค – ระบบอัปเดตเพลงและอนิเมะอัตโนมัติประจำวัน');
  console.log('══════════════════════════════════════════════════════════');

  let syncState = { lastSyncTime: 0, dayCount: 0, history: [] };
  if (fs.existsSync(SYNC_FILE)) {
    try {
      syncState = JSON.parse(fs.readFileSync(SYNC_FILE, 'utf8'));
    } catch (e) {}
  }

  const now = Date.now();
  const timeSinceLast = now - (syncState.lastSyncTime || 0);

  if (!isForce && timeSinceLast < ONE_DAY_MS) {
    const hoursLeft = Math.ceil((ONE_DAY_MS - timeSinceLast) / (1000 * 60 * 60));
    console.log(`ℹ️ วันนี้ได้รับการอัปเดตเพลงประจำวันแล้ว`);
    console.log(`⏳ รอบถัดไปจะมาถึงในอีกประมาณ ${hoursLeft} ชั่วโมง`);
    console.log(`💡 ใช้คำสั่ง 'node auto_update_daily.js --force' หากต้องการบังคับอัปเดตทันที`);
    return;
  }

  // Load data.js
  const code = fs.readFileSync('data.js', 'utf8');
  const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
  const db = fn();
  const { ANIMES, SONGS, ANIME_PAIRS } = db;

  console.log(`📥 โหลดข้อมูลสำเร็จ: ${ANIMES.length} อนิเมะ | ${SONGS.length} เพลง`);

  let addedAnimes = 0;
  let addedSongs = 0;

  // Add 1-2 new animes from pool
  let nextAnimeId = Math.max(0, ...ANIMES.map(a => a.id)) + 1;
  for (const item of DAILY_ANIME_POOL) {
    const exists = ANIMES.some(a => a.name.toLowerCase() === item.name.toLowerCase());
    if (exists) continue;

    console.log(`🌸 เพิ่มอนิเมะประจำวัน: ${item.name}...`);
    const kitsu = await searchKitsuAnime(item.name);
    const coverUrl = kitsu ? kitsu.coverUrl : 'favicon-logo.jpg';
    ANIMES.push({
      id: nextAnimeId++,
      name: item.name,
      nameTH: item.nameTH,
      genre: item.genre,
      coverUrl: coverUrl,
      coverFallback: coverUrl,
      anifumeUrl: `https://anifume.com/?s=${encodeURIComponent(item.name)}`,
      mood: item.mood
    });
    addedAnimes++;
    if (addedAnimes >= 2) break; // Limit per daily drop
  }

  // Add 2-3 new songs from pool
  let nextSongId = Math.max(0, ...SONGS.map(s => s.id)) + 1;
  for (const s of DAILY_SONG_POOL) {
    const exists = SONGS.some(x => x.title.toLowerCase() === s.title.toLowerCase());
    if (exists) continue;

    console.log(`🎵 ค้นหาและดึงเสียงตัวอย่างเพลงประจำวัน: ${s.title} - ${s.artist}...`);
    const track = await searchITunesSong(`${s.title} ${s.artist}`);
    if (!track) continue;

    const matchedAnime = ANIMES.find(a => a.name.toLowerCase().includes((s.animeName || '').toLowerCase())) || ANIMES[0];

    const newSong = {
      id: nextSongId,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      previewUrl: track.previewUrl,
      spotifyUrl: track.spotifyUrl,
      mood: s.mood,
      tags: [...(s.tags || []), "เพลงใหม่วันนี้", "DailyDrop"],
      bpm: s.mood === 'hype' ? 'เร็ว (120 BPM)' : 'ปานกลาง (100 BPM)',
      lang: s.lang,
      animeId: matchedAnime.id,
      animeMatch: [matchedAnime.id],
      reason: `เพลงใหม่ประจำวัน เหมาะตัดต่อคู่กับ ${matchedAnime.name}`,
      typoIdea: s.typoIdea
    };

    SONGS.push(newSong);
    ANIME_PAIRS.push({
      songId: nextSongId,
      animeId: matchedAnime.id,
      category: s.mood,
      badge: '✨ ประจำวันใหม่',
      reason: newSong.reason,
      typoIdea: newSong.typoIdea
    });

    nextSongId++;
    addedSongs++;
    if (addedSongs >= 3) break;
  }

  // Save data.js
  const out = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', out, 'utf8');

  // Update sync state
  syncState.lastSyncTime = now;
  syncState.lastSyncDate = new Date(now).toISOString().split('T')[0];
  syncState.dayCount = (syncState.dayCount || 0) + 1;
  syncState.totalSongs = SONGS.length;
  syncState.totalAnimes = ANIMES.length;
  syncState.history = syncState.history || [];
  syncState.history.unshift({
    date: new Date(now).toLocaleString('th-TH'),
    addedSongs,
    addedAnimes,
    totalSongs: SONGS.length,
    totalAnimes: ANIMES.length
  });
  if (syncState.history.length > 30) syncState.history.pop();

  fs.writeFileSync(SYNC_FILE, JSON.stringify(syncState, null, 2), 'utf8');

  console.log(`✅ บันทึกรอบอัปเดตประจำวันเรียบร้อย! (วันที่ ${syncState.dayCount})`);
  console.log(`📊 เพลงเพิ่มใหม่: +${addedSongs} | อนิเมะเพิ่มใหม่: +${addedAnimes}`);
  console.log(`📁 คลังรวมปัจจุบัน: ${SONGS.length} เพลง | ${ANIMES.length} อนิเมะ`);

  if (shouldDeploy) {
    console.log('🚀 กำลังดำเนินการ Deploy ไปยัง Netlify...');
    try {
      execSync('npx -y netlify-cli deploy --prod --dir .', { stdio: 'inherit' });
      console.log('🎉 Deploy อัปเดตประจำวันขึ้น Netlify สำเร็จแล้ว!');
    } catch (e) {
      console.error('⚠️ การ Deploy เกิดข้อผิดพลาด:', e.message);
    }
  }
}

if (require.main === module) {
  runDailyUpdate().catch(console.error);
}

module.exports = { runDailyUpdate };
