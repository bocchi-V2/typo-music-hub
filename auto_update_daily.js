/**
 * ============================================================
 *  AUTO_UPDATE_DAILY.JS (v2 - Mega Expansion)
 *  ระบบอัปเดตเพลงและอนิเมะอัตโนมัติประจำวันแบบ Real-Time (Live Chart Sync)
 *  ดึงเพลงฮิตสดใหม่จาก iTunes / Apple Music Charts ทุกโซน
 *  รองรับการรันผ่าน GitHub Actions / Windows Task Scheduler / npm run daily
 * ============================================================
 *  v2 Changes:
 *  - เพิ่มประเทศจาก 3 → 15+ ประเทศ (TH, JP, KR, US, GB, AU, DE, FR, BR, IN, PH, ID, VN, TW, MX)
 *  - เพิ่มเพลงต่อวัน 10 → 50 เพลง
 *  - เพิ่ม genre RSS feeds (Pop, Hip-Hop, Rock, K-Pop, J-Pop, Anime, R&B, Latin, Country)
 *  - เพิ่มลาว (Lao) detection
 *  - Retry logic สำหรับ iTunes Search API
 *  - Rate limit protection (delay between API calls)
 * ============================================================
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const SYNC_FILE = '.daily_sync.json';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', ...headers } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location, headers).then(resolve);
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
    });
    req.on('error', () => resolve(null));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

// ค้นหาเพลงจาก iTunes Search API พร้อม retry
async function searchITunesSong(term, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5`;
      const json = await fetchJson(url);
      if (!json || !json.results) {
        if (attempt < retries) { await sleep(2000); continue; }
        return null;
      }
      if (!json.results.length) return null;
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
    } catch (e) {
      if (attempt < retries) await sleep(2000);
    }
  }
  return null;
}

// ดึงชาร์ตเพลงฮิตจาก Apple Music / iTunes Top Songs RSS
async function fetchChartSongs(country = 'th', limit = 50) {
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

// ดึงเพลงตามแนวเพลง (genre) จาก iTunes RSS
async function fetchGenreSongs(country, genreId, limit = 30) {
  // Genre IDs: 14=Pop, 18=Hip-Hop, 21=Rock, 6=Country, 15=R&B/Soul, 12=Latin, 29=Anime
  const url = `https://itunes.apple.com/${country}/rss/topsongs/limit=${limit}/genre=${genreId}/json`;
  const json = await fetchJson(url);
  if (!json || !json.feed || !json.feed.entry) return [];
  return json.feed.entry.map(e => ({
    title: e['im:name']?.label || '',
    artist: e['im:artist']?.label || '',
    coverUrl: e['im:image']?.[2]?.label || e['im:image']?.[1]?.label || '',
    country,
    genre: genreId
  })).filter(s => s.title && s.artist);
}

// ดึงอนิเมะยอดนิยม / เรื่องใหม่ๆ จาก Kitsu API
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
  const text = (title || '') + ' ' + (artist || '');
  if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
  if (/[\u0E80-\u0EFF]/.test(text)) return 'lao'; // ลาว
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return 'jp';
  if (/[\uac00-\ud7af]/.test(text)) return 'kr';

  const thaiArtists = [
    'three man down', 'tilly birds', 'jeff satur', 'nont tanont', 'dept',
    'bowkylion', '4eve', 'proxie', 'bus because of you', 'atlas', 'perses', 'pixxie',
    'billkin', 'pp krit', 'safeplanet', 'tattoo colour', 'polycat',
    'purpeech', 'anatomy rabbit', 'fellow fellow', 'urboytj', 'youngohm',
    'milli', 'violette wautier', 'the toys', 'stamp', 'f.hero', 'slot machine',
    'bodyslam', 'cocktail', 'scrubb', 'paradox', 'lula', 'season five', 'ink waruntorn',
    'palmy', 'num kala', 'big ass', 'potato', 'getsunova', 'clash', 'labanoon',
    'silly fools', 'moderndog', 'pause', 'klear', 'lomosonic', 'mean',
    'zweed n roll', 'whal & dolph', 'fridaynight to sunday', 'plastic plastic',
    'peck palitchoke', 'palaphol', 'lipta', 'serious bacon', 'yes indeed',
    'singto numchok', 'bright vachirawit', 'gulf kanawut', 'ohm pawat',
    'sprite x guygeegee', 'guygeegee', 'numcha', 'gavin d', 'txrbo',
    'dawjai', 'maiyarap', 'twopee', 'diamond mqt', 'daboyway', 'kanomroo',
    'cream', 'wanyai', 'timethai', 'jaonaay', 'pure', 'nice2meet u',
    'telex telexs', 'way thaitanium', 'thaitanium', 'buddha bless',
    'threemandown', 'tillybirds', 'jeffsatur', 'ponchet', 'beminor',
    'autta', 'songkran', 'bamm', 'isbanky', 'pearwah', 'nene',
    'bonnadol', 'saran', 'earth patravee', 'folk9', 'no one else',
    'pun basher', 'season change', 'warin', 'ab normal', 'instinct',
    'portrait', 'singular', 'tai orathai', 'bird thongchai', 'tata young',
    'christina aguilar', 'da endorphine', 'endorphine', 'am fine',
    'bedroom audio', 'hobbit', 'indigo', 'mild', 'musketeers', 'so cool',
    'nologo', 'twio', 'tontrakul', 'gena', 'la luna', 'y not 7', 'crescendo',
    'pae arak', 'kangsadan', 'bow maylada', 'marc tatchapon', 'flukie',
    'wonderframe', 'mirrr', 'nap a lin', 'ice paris', 'saint', 'zee pruk',
    'nunew', 'gemini norawit', 'fourth nattawat', 'win metawin', 'nanon',
    'pp billkin', 'mew suppasit', 'war wanarat', 'max jenmana',
    'ost rak', 'ost lakorn', 'thai drama', 'gmmtv', 'nadao', 'rs music'
  ];
  const artLower = (artist || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();
  if (thaiArtists.some(ta => artLower.includes(ta) || titleLower.includes(ta))) return 'th';

  // Country-based language detection
  const countryLangMap = { 'jp': 'jp', 'kr': 'kr', 'th': 'th', 'tw': 'jp', 'vn': 'en', 'la': 'lao' };
  if (countryLangMap[country]) return countryLangMap[country];
  
  return 'en';
}

// ตรวจจับอารมณ์เพลง (Mood) และแนวทางทำไทโป
function deriveMoodAndTypo(title, artist, genre = '') {
  const lower = (title + ' ' + artist + ' ' + genre).toLowerCase();
  if (lower.includes('rock') || lower.includes('metal') || lower.includes('dance') || lower.includes('edm') || lower.includes('hype') || lower.includes('rap') || lower.includes('hip-hop') || lower.includes('trap')) {
    return {
      mood: 'hype',
      bpm: 'เร็ว (128 BPM)',
      tags: ['มันส์สะใจ', 'บีทกระแทก', 'ไวรัล'],
      typoIdea: 'เอฟเฟกต์ Glitch กระชากตามจังหวะเบส ตัวหนังสือสีนีออนเข้ม'
    };
  }
  if (lower.includes('sad') || lower.includes('cry') || lower.includes('อกหัก') || lower.includes('เหงา') || lower.includes('เศร้า') || lower.includes('tear') || lower.includes('hurt') || lower.includes('broken') || lower.includes('lonely')) {
    return {
      mood: 'sad',
      bpm: 'ช้า (78 BPM)',
      tags: ['ดิ่งลึก', 'เศร้าซึ้ง', 'อารมณ์ดิ่ง'],
      typoIdea: 'ตัวหนังสือสีควันเทา เลือนหายช้าๆ สไตล์ Minimal Sad'
    };
  }
  if (lower.includes('love') || lower.includes('รัก') || lower.includes('หวาน') || lower.includes('sweet') || lower.includes('cute') || lower.includes('ใจ') || lower.includes('heart') || lower.includes('kiss')) {
    return {
      mood: 'love',
      bpm: 'ปานกลาง (100 BPM)',
      tags: ['หวานละมุน', 'โรแมนติก', 'คลั่งรัก'],
      typoIdea: 'ฟอนต์มนละมุน ขยับเด้งน่ารักตามท่อนฮุก มีประกายหัวใจเบาๆ'
    };
  }
  if (lower.includes('anime') || lower.includes('アニメ') || lower.includes('opening') || lower.includes('ending')) {
    return {
      mood: 'hype',
      bpm: 'เร็ว (140 BPM)',
      tags: ['อนิเมะ', 'OP/ED', 'เปิดเรื่อง'],
      typoIdea: 'ไทโปสไตล์อนิเมะ OP ตัวอักษรกระเด้งตามจังหวะ เฟดอินเท่ๆ'
    };
  }
  if (lower.includes('funk') || lower.includes('montagem') || lower.includes('phonk') || lower.includes('brazilian')) {
    return {
      mood: 'hype',
      bpm: 'เร็วมาก (150 BPM)',
      tags: ['Funk', 'Phonk', 'บราซิลบีท'],
      typoIdea: 'เอฟเฟกต์สั่นแรงตามเบส ตัวหนังสือสีเรดนีออน กระพริบตามจังหวะ'
    };
  }
  if (lower.includes('latin') || lower.includes('reggaeton') || lower.includes('bachata') || lower.includes('salsa')) {
    return {
      mood: 'chill',
      bpm: 'ปานกลาง (105 BPM)',
      tags: ['ลาติน', 'Reggaeton', 'สนุก'],
      typoIdea: 'ฟอนต์สีสันสดใส ลูกเล่นเลื่อนนุ่มนวลตามจังหวะ'
    };
  }
  if (lower.includes('country') || lower.includes('folk') || lower.includes('acoustic')) {
    return {
      mood: 'chill',
      bpm: 'ปานกลาง (95 BPM)',
      tags: ['คันทรี่', 'อะคูสติก', 'อบอุ่น'],
      typoIdea: 'ฟอนต์สไตล์คราฟต์ สีอุ่นน้ำตาล เลื่อนนุ่มนวล'
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
  console.log('☀️  ไทโปมิวสิค – ระบบอัปเดตเพลง MEGA ประจำวัน (v2 - 15+ ประเทศ)');
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

  // ตรวจสอบว่าวันนี้ได้รันไปแล้วหรือยัง
  if (!isForce && lastSyncDateStr === todayDateStr) {
    console.log(`ℹ️ วันนี้ (${todayDateStr}) ได้รับการอัปเดตเพลงประจำวันแล้ว`);
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
  let skippedDuplicates = 0;
  let failedSearches = 0;

  // 1. เพิ่มอนิเมะใหม่ 3-5 เรื่องจาก Kitsu
  try {
    const animeCandidates = await fetchTrendingAnimeCandidates();
    let nextAnimeId = Math.max(0, ...ANIMES.map(a => a.id)) + 1;
    for (const cand of animeCandidates) {
      if (addedAnimes >= 5) break;
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
    console.warn('⚠️ ไม่สามารถดึงอนิเมะใหม่จาก Kitsu ได้:', err.message);
  }

  // 2. ดึงเพลงฮิตจากหลายประเทศ + หลาย genre
  console.log('📡 กำลังดึงชาร์ตเพลงฮิตจาก Apple Music / iTunes (15+ ประเทศ + แนวเพลง)...');

  // ชาร์ตรวมจากหลายประเทศ
  const countries = [
    { code: 'th', name: 'ไทย', limit: 50 },
    { code: 'jp', name: 'ญี่ปุ่น', limit: 50 },
    { code: 'kr', name: 'เกาหลี', limit: 50 },
    { code: 'us', name: 'อเมริกา', limit: 50 },
    { code: 'gb', name: 'อังกฤษ', limit: 40 },
    { code: 'au', name: 'ออสเตรเลีย', limit: 30 },
    { code: 'de', name: 'เยอรมัน', limit: 30 },
    { code: 'fr', name: 'ฝรั่งเศส', limit: 30 },
    { code: 'br', name: 'บราซิล', limit: 40 },
    { code: 'mx', name: 'เม็กซิโก', limit: 30 },
    { code: 'in', name: 'อินเดีย', limit: 30 },
    { code: 'ph', name: 'ฟิลิปปินส์', limit: 30 },
    { code: 'id', name: 'อินโดนีเซีย', limit: 30 },
    { code: 'tw', name: 'ไต้หวัน', limit: 30 },
    { code: 'vn', name: 'เวียดนาม', limit: 30 },
  ];

  // ดึงชาร์ตรวมทุกประเทศพร้อมกัน (แบ่ง batch เพื่อไม่ให้ overload)
  const allCharts = [];
  const batchSize = 5;
  
  for (let i = 0; i < countries.length; i += batchSize) {
    const batch = countries.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(c => fetchChartSongs(c.code, c.limit)));
    results.forEach((songs, idx) => {
      console.log(`  📊 ${batch[idx].name} (${batch[idx].code.toUpperCase()}): ${songs.length} เพลง`);
      allCharts.push(...songs);
    });
    if (i + batchSize < countries.length) await sleep(1000); // Rate limit protection
  }

  // ดึงเพลงตามแนวเพลง (genre) เพิ่มเติม
  console.log('📡 กำลังดึงเพลงตามแนวเพลง (Genre RSS)...');
  const genreFeeds = [
    { country: 'us', genreId: 14, name: 'Pop US' },
    { country: 'us', genreId: 18, name: 'Hip-Hop US' },
    { country: 'us', genreId: 21, name: 'Rock US' },
    { country: 'us', genreId: 15, name: 'R&B US' },
    { country: 'jp', genreId: 27, name: 'J-Pop' },
    { country: 'jp', genreId: 29, name: 'Anime JP' },
    { country: 'kr', genreId: 51, name: 'K-Pop' },
    { country: 'br', genreId: 14, name: 'Pop BR' },
    { country: 'mx', genreId: 12, name: 'Latin MX' },
    { country: 'th', genreId: 14, name: 'Pop TH' },
  ];

  for (let i = 0; i < genreFeeds.length; i += 3) {
    const batch = genreFeeds.slice(i, i + 3);
    const results = await Promise.all(batch.map(g => fetchGenreSongs(g.country, g.genreId, 25)));
    results.forEach((songs, idx) => {
      console.log(`  🎵 ${batch[idx].name}: ${songs.length} เพลง`);
      allCharts.push(...songs);
    });
    if (i + 3 < genreFeeds.length) await sleep(800);
  }

  console.log(`📊 รวมได้ ${allCharts.length} เพลงจากชาร์ตทั้งหมด`);

  // สลับคละเพลงจากทุกแหล่ง
  const combinedChartCandidates = allCharts.sort(() => Math.random() - 0.5);

  // สร้าง lookup set สำหรับเช็คซ้ำแบบเร็ว
  const existingTitles = new Set();
  SONGS.forEach(s => {
    const norm = (s.title || '').toLowerCase().replace(/[\(\[\-].*?[\)\]]/g, '').trim();
    existingTitles.add(norm);
    // เพิ่ม key แบบ title+artist ด้วย
    existingTitles.add(norm + '|' + (s.artist || '').toLowerCase().trim());
  });

  let nextSongId = Math.max(0, ...SONGS.map(s => s.id)) + 1;
  const targetSongsPerDay = 50; // เพิ่มเป็น 50 เพลง/วัน

  for (const cand of combinedChartCandidates) {
    if (addedSongs >= targetSongsPerDay) break;

    // เช็คซ้ำแบบเร็ว
    const normTitle = cand.title.toLowerCase().replace(/[\(\[\-].*?[\)\]]/g, '').trim();
    const normKey = normTitle + '|' + cand.artist.toLowerCase().trim();
    
    if (existingTitles.has(normTitle) || existingTitles.has(normKey)) {
      skippedDuplicates++;
      continue;
    }

    // Rate limit: delay ระหว่าง iTunes search calls
    await sleep(300);

    console.log(`🔍 [${addedSongs + 1}/${targetSongsPerDay}] ค้นหา: ${cand.title} - ${cand.artist}...`);
    const track = await searchITunesSong(`${cand.title} ${cand.artist}`);
    if (!track || !track.previewUrl) {
      failedSearches++;
      continue;
    }

    const lang = detectLanguage(track.title, track.artist, cand.country);
    const { mood, bpm, tags, typoIdea } = deriveMoodAndTypo(track.title, track.artist, track.primaryGenreName);

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
      reason: `เพลงฮิตใหม่ประจำวันจากชาร์ต ${cand.country.toUpperCase()} เหมาะตัดต่อคลิปไทโปคู่กับ ${matchedAnime.name}`,
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

    // เพิ่มเข้า lookup set เพื่อไม่ให้เพลงซ้ำในรอบเดียวกัน
    existingTitles.add(normTitle);
    existingTitles.add(normKey);

    console.log(`  ✅ เพิ่มสำเร็จ: "${track.title}" โดย ${track.artist} (${lang.toUpperCase()}) [${cand.country.toUpperCase()}]`);
    nextSongId++;
    addedSongs++;
  }

  // บันทึกกลับลง data.js
  console.log('💾 กำลังบันทึก data.js...');
  const out = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', out, 'utf8');

  // บันทึก version.json
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

  // อัปเดต sw.js (cache buster) เพื่อให้มือถือและเบราว์เซอร์รับเพลงใหม่ทันที
  if (fs.existsSync('sw.js')) {
    let sw = fs.readFileSync('sw.js', 'utf8');
    const newCacheName = `haimiya-typo-${versionData.version}.${versionData.versionCode}`;
    sw = sw.replace(/const CACHE_NAME\s*=\s*['"][^'"]+['"];/, `const CACHE_NAME = '${newCacheName}';`);
    fs.writeFileSync('sw.js', sw, 'utf8');
    console.log(`⚡ อัปเดต Service Worker Cache: ${newCacheName}`);
  }

  // อัปเดต index.html query string เพื่อบังคับรีเฟรชไฟล์ data.js
  if (fs.existsSync('index.html')) {
    let html = fs.readFileSync('index.html', 'utf8');
    const newV = `${versionData.version}.${versionData.versionCode}`;
    html = html.replace(/data\.js\?v=[^"']+/g, `data.js?v=${newV}`);
    html = html.replace(/app\.js\?v=[^"']+/g, `app.js?v=${newV}`);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log(`⚡ อัปเดต version query string ใน index.html: ?v=${newV}`);
  }

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
    skippedDuplicates,
    failedSearches,
    totalSongs: SONGS.length,
    totalAnimes: ANIMES.length
  });
  if (syncState.history.length > 60) syncState.history.pop();

  fs.writeFileSync(SYNC_FILE, JSON.stringify(syncState, null, 2), 'utf8');

  console.log(`══════════════════════════════════════════════════════════`);
  console.log(`🎉 บันทึกรอบอัปเดต MEGA ประจำวันเรียบร้อย! (วันที่ ${syncState.dayCount})`);
  console.log(`📊 สรุปผล:`);
  console.log(`   🎵 เพลงใหม่: +${addedSongs} เพลง`);
  console.log(`   🌸 อนิเมะใหม่: +${addedAnimes} เรื่อง`);
  console.log(`   ⏭️  ข้ามเพลงซ้ำ: ${skippedDuplicates} เพลง`);
  console.log(`   ❌ ค้นหาไม่พบ: ${failedSearches} เพลง`);
  console.log(`   📁 คลังรวมทั้งหมด: ${SONGS.length} เพลง | ${ANIMES.length} อนิเมะ`);
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
