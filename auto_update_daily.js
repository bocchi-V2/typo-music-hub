/**
 * ============================================================
 *  AUTO_UPDATE_DAILY.JS
 *  ระบบอัปเดตเพลงและอนิเมะอัตโนมัติประจำวันแบบ Real-Time (Live Chart Sync)
 *  ดึงเพลงฮิตสดใหม่จาก iTunes / Apple Music Charts (TH, JP, US) & Kitsu Anime API
 *  รองรับการรันผ่าน GitHub Actions / Windows Task Scheduler / npm run daily
 * ============================================================
 */

const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

const SYNC_FILE = '.daily_sync.json';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function fetchJson(url, headers = {}) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', ...headers } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(12000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

// ค้นหาเพลงละเอียดจาก iTunes Search API เพื่อเอา previewUrl และปก HD 600x600
async function searchITunesSong(term) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=3`;
  const json = await fetchJson(url);
  if (!json || !json.results || !json.results.length) return null;
  const track = json.results.find(t => t.previewUrl && t.trackExplicitness !== 'explicit') || json.results.find(t => t.previewUrl) || json.results[0];
  if (!track || !track.previewUrl) return null;
  return {
    title: track.trackName,
    artist: track.artistName,
    previewUrl: track.previewUrl,
    coverUrl: (track.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(track.trackName + ' ' + track.artistName)}`,
    primaryGenreName: track.primaryGenreName || 'Pop'
  };
}

// ดึงชาร์ตเพลงฮิตจาก Apple Music / iTunes Top Songs RSS
async function fetchChartSongs(country = 'th', limit = 35) {
  const url = `https://itunes.apple.com/${country}/rss/topsongs/limit=${limit}/json`;
  const json = await fetchJson(url);
  if (!json || !json.feed || !json.feed.entry) return [];
  return json.feed.entry.map(e => ({
    title: e['im:name']?.label || '',
    artist: e['im:artist']?.label || '',
    coverUrl: e['im:image']?.[2]?.label || e['im:image']?.[1]?.label || '',
    country
  })).filter(s => s.title && s.artist);
}

// ดึงอนิเมะยอดนิยม / เรื่องใหม่ๆ จาก Kitsu API โดยหมุนเวียน offset เพื่อให้อนิเมะใหม่ไม่ซ้ำ
async function fetchTrendingAnimeCandidates() {
  const candidates = [];
  const offsets = [
    Math.floor(Math.random() * 400) + 20,
    Math.floor(Math.random() * 600) + 100,
    0
  ];
  for (const offset of offsets) {
    const url = `https://kitsu.io/api/edge/anime?sort=-user_count&page[offset]=${offset}&page[limit]=20`;
    const json = await fetchJson(url, { 'Accept': 'application/vnd.api+json' });
    if (json && json.data && json.data.length) {
      const items = json.data.map(item => {
        const attr = item.attributes;
        const cover = (attr.posterImage && (attr.posterImage.medium || attr.posterImage.large || attr.posterImage.original)) || 'favicon-logo.jpg';
        return {
          name: attr.canonicalTitle || '',
          nameTH: (attr.titles && attr.titles.th) || attr.canonicalTitle || '',
          coverUrl: cover,
          genre: ['อนิเมะ', 'ยอดนิยม'],
          synopsis: attr.synopsis || ''
        };
      }).filter(a => a.name);
      candidates.push(...items);
    }
  }
  return candidates;
}

// ตรวจจับภาษาของเพลง
function detectLanguage(title, artist, country) {
  const text = title + ' ' + artist;
  if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return 'jp';
  if (country === 'jp') return 'jp';
  if (country === 'th') return 'th';
  return 'en';
}

// ตรวจจับอารมณ์เพลง (Mood) และแนวทางทำไทโป
function deriveMoodAndTypo(title, artist, genre = '') {
  const lower = (title + ' ' + artist + ' ' + genre).toLowerCase();
  if (lower.includes('rock') || lower.includes('metal') || lower.includes('dance') || lower.includes('edm') || lower.includes('hype') || lower.includes('rap')) {
    return {
      mood: 'hype',
      bpm: 'เร็ว (128 BPM)',
      tags: ['มันส์สะใจ', 'บีทกระแทก', 'ไวรัล'],
      typoIdea: 'เอฟเฟกต์ Glitch กระชากตามจังหวะเบส ตัวหนังสือสีนีออนเข้ม'
    };
  }
  if (lower.includes('sad') || lower.includes('cry') || lower.includes('อกหัก') || lower.includes('เหงา') || lower.includes('เศร้า') || lower.includes('tear') || lower.includes('hurt')) {
    return {
      mood: 'sad',
      bpm: 'ช้า (78 BPM)',
      tags: ['ดิ่งลึก', 'เศร้าซึ้ง', 'อารมณ์ดิ่ง'],
      typoIdea: 'ตัวหนังสือสีควันเทา เลือนหายช้าๆ สไตล์ Minimal Sad'
    };
  }
  if (lower.includes('love') || lower.includes('รัก') || lower.includes('หวาน') || lower.includes('sweet') || lower.includes('cute') || lower.includes('ใจ')) {
    return {
      mood: 'love',
      bpm: 'ปานกลาง (100 BPM)',
      tags: ['หวานละมุน', 'โรแมนติก', 'คลั่งรัก'],
      typoIdea: 'ฟอนต์มนละมุน ขยับเด้งน่ารักตามท่อนฮุก มีประกายหัวใจเบาๆ'
    };
  }
  return {
    mood: 'chill',
    bpm: 'ชิลล์ (92 BPM)',
    tags: ['กรูฟนุ่ม', 'ฟังสบาย', 'สไตล์คาเฟ่'],
    typoIdea: 'ไทโปตัวเขียนสไตล์โมเดิร์นสีขาวโปร่งแสง เลื่อนนุ่มนวล'
  };
}

async function runDailyUpdate() {
  const args = process.argv.slice(2);
  const isForce = args.includes('--force');
  const shouldDeploy = args.includes('--deploy');

  console.log('══════════════════════════════════════════════════════════');
  console.log('☀️  ไทโปมิวสิค – ระบบอัปเดตเพลงและอนิเมะอัตโนมัติประจำวัน (Live Charts)');
  console.log('══════════════════════════════════════════════════════════');

  let syncState = { lastSyncTime: 0, dayCount: 0, history: [] };
  if (fs.existsSync(SYNC_FILE)) {
    try {
      syncState = JSON.parse(fs.readFileSync(SYNC_FILE, 'utf8'));
    } catch (e) {}
  }

  const now = Date.now();
  const todayDateStr = new Date(now).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' });
  const lastSyncDateStr = syncState.lastSyncDateStr || (syncState.history?.[0]?.date ? syncState.history[0].date.split(' ')[0] : '');

  // ตรวจสอบว่าวันนี้ได้รันไปแล้วหรือยัง (ตามวันปฏิทินไทย ข้ามเที่ยงคืน = วันใหม่ทันที)
  if (!isForce && lastSyncDateStr === todayDateStr) {
    console.log(`ℹ️ วันนี้ (${todayDateStr}) ได้รับการอัปเดตเพลงและอนิเมะประจำวันแล้ว`);
    console.log(`⏳ รอบถัดไปจะมาถึงเวลาเที่ยงคืน (00:00 น.)`);
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

  // 1. เพิ่มอนิเมะใหม่ 1-2 เรื่องจาก Kitsu (ถ้ายังไม่มีในคลัง)
  try {
    const animeCandidates = await fetchTrendingAnimeCandidates();
    let nextAnimeId = Math.max(0, ...ANIMES.map(a => a.id)) + 1;
    for (const cand of animeCandidates) {
      if (addedAnimes >= 2) break; // เพิ่มวันละ 1-2 เรื่อง
      const exists = ANIMES.some(a => a.name.toLowerCase() === cand.name.toLowerCase());
      if (!exists && cand.coverUrl) {
        console.log(`🌸 เพิ่มอนิเมะใหม่ประจำวัน: ${cand.name}...`);
        ANIMES.push({
          id: nextAnimeId,
          name: cand.name,
          nameTH: cand.nameTH || cand.name,
          genre: cand.genre,
          coverUrl: cand.coverUrl,
          coverFallback: cand.coverUrl,
          anifumeUrl: `https://anifume.com/?s=${encodeURIComponent(cand.name)}`,
          mood: 'hype'
        });
        nextAnimeId++;
        addedAnimes++;
      }
    }
  } catch (err) {
    console.warn('⚠️ ไม่สามารถดึงอนิเมะใหม่จาก Kitsu ได้ ข้ามไปยังขั้นตอนถัดไป:', err.message);
  }

  // 2. ดึงเพลงฮิตสดใหม่จาก Apple Music / iTunes Charts (ไทย, ญี่ปุ่น, สากล)
  console.log('📡 กำลังดึงชาร์ตเพลงฮิตจาก Apple Music / iTunes (TH, JP, US)...');
  const [chartTH, chartJP, chartUS] = await Promise.all([
    fetchChartSongs('th', 40),
    fetchChartSongs('jp', 40),
    fetchChartSongs('us', 40)
  ]);

  // สลับหมุนเวียนคละชาร์ตเพื่อความหลากหลาย
  const combinedChartCandidates = [];
  const maxLen = Math.max(chartTH.length, chartJP.length, chartUS.length);
  for (let i = 0; i < maxLen; i++) {
    if (chartTH[i]) combinedChartCandidates.push(chartTH[i]);
    if (chartJP[i]) combinedChartCandidates.push(chartJP[i]);
    if (chartUS[i]) combinedChartCandidates.push(chartUS[i]);
  }

  let nextSongId = Math.max(0, ...SONGS.map(s => s.id)) + 1;
  const targetSongsPerDay = 10; // เพิ่มเพลงฮิตคุณภาพสูงวันละ 10 เพลงที่มีตัวอย่างเสียงและปกชัด HD

  for (const cand of combinedChartCandidates) {
    if (addedSongs >= targetSongsPerDay) break;

    // เช็คว่ามีเพลงนี้ในคลังแล้วหรือยัง (เช็คชื่อเพลงและศิลปินแบบ case-insensitive)
    const normTitle = cand.title.toLowerCase().replace(/[\(\[\-].*?[\)\]]/g, '').trim();
    const exists = SONGS.some(s => {
      const existingTitle = s.title.toLowerCase().replace(/[\(\[\-].*?[\)\]]/g, '').trim();
      return existingTitle === normTitle || (existingTitle.includes(normTitle) && normTitle.length > 5);
    });

    if (exists) continue;

    console.log(`🔍 ค้นหาตัวอย่างเสียง & ข้อมูล HD: ${cand.title} - ${cand.artist}...`);
    const track = await searchITunesSong(`${cand.title} ${cand.artist}`);
    if (!track || !track.previewUrl) continue;

    // ตรวจสอบภาษา อารมณ์ และไอเดียไทโป
    const lang = detectLanguage(track.title, track.artist, cand.country);
    const { mood, bpm, tags, typoIdea } = deriveMoodAndTypo(track.title, track.artist, track.primaryGenreName);

    // สุ่มจับคู่อนิเมะที่เข้ากัน
    const matchedAnime = ANIMES[Math.floor(Math.random() * ANIMES.length)] || ANIMES[0];

    const newSong = {
      id: nextSongId,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl || cand.coverUrl,
      previewUrl: track.previewUrl,
      spotifyUrl: track.spotifyUrl,
      mood: mood,
      tags: [...tags, "เพลงใหม่วันนี้", "DailyDrop", `ชาร์ต${cand.country.toUpperCase()}`],
      bpm: bpm,
      lang: lang,
      animeId: matchedAnime.id,
      animeMatch: [matchedAnime.id],
      reason: `เพลงฮิตใหม่ประจำวันจากชาร์ต เหมาะตัดต่อคลิปไทโปคู่กับ ${matchedAnime.name}`,
      typoIdea: typoIdea
    };

    SONGS.push(newSong);
    ANIME_PAIRS.push({
      songId: nextSongId,
      animeId: matchedAnime.id,
      category: mood,
      badge: '✨ ประจำวันใหม่',
      reason: newSong.reason,
      typoIdea: newSong.typoIdea
    });

    console.log(`✅ เพิ่มเพลงสำเร็จ: "${track.title}" โดย ${track.artist} (${lang.toUpperCase()})`);
    nextSongId++;
    addedSongs++;
  }

  // บันทึกกลับลง data.js
  const out = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', out, 'utf8');

  // บันทึก version.json เพื่อให้แอพมือถือและเว็บซิงค์ข้อมูลใหม่ได้อัตโนมัติ (OTA Sync)
  const versionData = {
    version: `2.${new Date(now).toISOString().slice(0, 10).replace(/-/g, '')}.${new Date(now).getHours()}`,
    versionCode: Math.floor(now / 1000),
    songCount: SONGS.length,
    animeCount: ANIMES.length,
    updatedAt: new Date(now).toISOString(),
    appName: "Haimiya Typo",
    releaseUrl: "https://github.com/bocchi-V2/typo-music-hub/releases/latest"
  };
  fs.writeFileSync('version.json', JSON.stringify(versionData, null, 2), 'utf8');

  // บันทึกสถานะการซิงค์
  syncState.lastSyncTime = now;
  syncState.lastSyncDate = new Date(now).toISOString().split('T')[0];
  syncState.lastSyncDateStr = todayDateStr;
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

  console.log(`══════════════════════════════════════════════════════════`);
  console.log(`🎉 บันทึกรอบอัปเดตประจำวันเรียบร้อย! (วันที่ ${syncState.dayCount})`);
  console.log(`📊 เพิ่มเพลงใหม่จากชาร์ตสด: +${addedSongs} เพลง | อนิเมะใหม่: +${addedAnimes} เรื่อง`);
  console.log(`📁 คลังรวมทั้งหมดในเว็บ: ${SONGS.length} เพลง | ${ANIMES.length} เรื่องอนิเมะ`);
  console.log(`══════════════════════════════════════════════════════════`);

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
