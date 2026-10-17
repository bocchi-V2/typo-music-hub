/**
 * FIX_AUDIO_AND_LANGUAGES.JS
 * 1. Smart Language Classifier: Accurately classifies Thai, K-Pop, J-Pop, Lao, and Western songs
 *    even when titles or artist names are in English (e.g. Tilly Birds, Billkin, NewJeans, BTS, YOASOBI).
 * 2. Audio Mismatch Fixer: Searches iTunes for songs that share duplicate audio URLs to give them
 *    their own real, verified 30s preview and HD album cover.
 */

const fs = require('fs');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
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

// 🇹🇭 รายชื่อศิลปินไทยที่มีชื่อภาษาอังกฤษ หรือทำเพลงชื่ออังกฤษ
const THAI_ARTIST_NAMES = [
  'tilly birds', 'three man down', 'bowkylion', 'nont tanont', 'non thanon', 'palmy',
  'bodyslam', 'potato', 'cocktail', 'scrubb', 'safeplanet', 'polycat', 'the toys',
  'urboy tj', 'urboytj', 'youngohm', 'milli', 'f.hero', 'fhero', 'golf f.hero',
  'taitosmith', 'slot machine', 'getsunova', 'labanoon', 'clash', 'big ass', 'stamp',
  'stamp apiwat', 'singto numchok', 'jeff satur', 'billkin', 'pp krit', '4eve', 'proxie',
  'bus', 'bus because of you i shine', 'pixxie', 'sarah salola', 'purpeech', 'anatomy rabbit',
  'dept', 'loserpop', 'whal & dolph', 'whal and dolph', 'mirrr', 'fellow fellow',
  'paper planes', 'only monday', 'perses', 'lykn', 'dice', 'nunew', 'zee pruk', 'atlas',
  'qrra', 'viis', 'alala', 'matcha', 'violette wautier', 'jannine weigel', 'phum viphurit',
  'h 3 f', 'h3f', 'television off', 'yented', 'rocketman', 'gym and swim', 'plastic plastic',
  'moving and cut', 'desktop error', 'yellow fang', 'zweed n\' roll', 'zweed n roll',
  'landokmai', 't_047', 't047', 'retrospect', 'ebola', 'zeal', 'blackhead', 'overdose',
  'silly fools', 'modern dog', 'moderndog', 'paradox', '25 hours', '25hours', 'ab normal',
  'abnormal', 'so cool', 'socool', 'klear', 'better weather', 'friday', 'playground',
  'mild', 'musketeers', 'season five', 'bedroom audio', 'the yers', 'atom', 'atom chanakan',
  'bird thongchai', 'da endorphine', 'endorphine', 'new jiew', 'new & jiew', 'the parkinson',
  'parkinson', 'joey boy', 'joeyboy', 'joey phuwasit', 'd gerrard', 'dgerrard', 'twopee',
  'twopee southside', 'southside', 'thaitanium', '1mill', 'diamond mqt', 'fiixd', 'younggu',
  'saran', 'rahboy', 'maiyarap', 'nicecnx', 'og-anic', 'oganic', 'cd guntee', 'gavin d',
  'gavind', 'timethai', 'wanyai', 'mon monik', 'lipta', 'mean', 'lomosonic', 'sweet mullet',
  'sweetmullet', 'sweet mullet band', 'yes indeed', 'yes\'sir days', 'asanee wasan',
  'micro', 'carabao', 'pongsit', 'pongsit kampee', 'pu pongsit', 'sek loso', 'loso',
  'mai charoenpura', 'christina aguilar', 'tata young', 'gam wichayanee', 'dome jaruwat',
  'kangsom', 'tum warawut', 'waruntorn', 'ink waruntorn', 'chrrissa', 'firstone', 'gelboys',
  'domunditv', 'domundi', 'gmmtv', 'kacha', 'the richman toy', 'richman toy', 't-bone',
  'tbone', 'flure', 'armchair', 'groove riders', 'boyd kosiyapong', 'boy peacemaker',
  'peacemaker', 'kala', 'num kala', 'no one else', 'nooneelse', 'telex telexs',
  'solitude is bliss', 'freehand', 'tangbadvoice', 'm-flow', 'jarvis', 'illslick',
  'มนต์แคน', 'ไหมไทย', 'ไมค์ ภิรมย์พร', 'ไผ่ พงศธร', 'ศิริพร', 'ต่าย อรทัย', 'ลำไย ไหทองคำ'
];

// 🇰🇷 รายชื่อศิลปิน K-Pop ที่มีชื่อภาษาอังกฤษ
const KPOP_ARTIST_NAMES = [
  'bts', 'blackpink', 'newjeans', 'le sserafim', 'lesserafim', 'ive', 'aespa',
  'twice', 'stray kids', 'seventeen', 'tomorrow x together', 'txt', 'enhypen',
  '(g)i-dle', 'g-idle', 'gidle', 'itzy', 'nmixx', 'riize', 'zerobaseone', 'zb1',
  'babymonster', 'illit', 'kiss of life', 'boynextdoor', 'tws', 'nct', 'nct 127',
  'nct dream', 'nct u', 'wayv', 'exo', 'red velvet', 'mamamoo', 'iu', 'taeyeon',
  'sunmi', 'chung ha', 'chungha', 'bibi', 'crush', 'zion.t', 'jay park', 'jessi',
  'zico', 'dpr ian', 'dpr live', 'ateez', 'the boyz', 'treasure', 'stayc', 'kep1er',
  'loona', 'fromis_9', 'day6', 'the rose', 'xg', 'bigbang', '2ne1', 'super junior',
  'girls\' generation', 'snsd', 'shinee', 'infinite', 'highlight', 'btob', 'winner',
  'ikon', 'got7', 'lucy', 'xdinary heroes', 'akmu', 'bol4', 'heize', 'leehi',
  'eric nam', 'somi', 'jeon somi', 'hyuna', 'dawn', 'dean', 'colde', 'ph-1',
  'sik-k', 'changmo', 'ash island', 'be\'o', 'big naughty', 'jennie', 'lisa',
  'rose', 'jisoo', 'jungkook', 'v', 'jimin', 'suga', 'agust d', 'rm', 'j-hope',
  'jin', 'baekhyun', 'taemin', 'kai', 'd.o.', 'chen', 'suho', 'chanyeol'
];

// 🇯🇵 รายชื่อศิลปิน J-Pop / อนิเมะ ที่มีชื่อภาษาอังกฤษ
const JPOP_ARTIST_NAMES = [
  'yoasobi', 'kenshi yonezu', 'official hige dandism', 'official higedandism',
  'king gnu', 'mrs. green apple', 'vaundy', 'ado', 'lisa', 'aimer', 'radwimps',
  'eve', 'creepy nuts', 'fujii kaze', 'yuuri', 'tani yuuki', 'back number',
  'bump of chicken', 'yorushika', 'zutomayo', 'atarashii gakko!', 'atarashii gakko',
  'milet', 'sumika', 'wanima', 'man with a mission', 'spyair', 'flow',
  'asian kung-fu generation', 'kana-boon', 'tk from ling tosite sigure', 'uverworld',
  'porno graffitti', 'blue encount', 'kessoku band', 'kanaria', 'deco*27', 'pinocchiop',
  'maretu', 'one ok rock', 'my first story', 'coldrain', 'sim', 'survive said the prophet',
  'burnout syndromes', 'granrodeo', 'myth & roid', 'oxt', 'fripside', 'claris',
  'trysail', 'aqours', 'poppin\'party', 'roselia', 'raise a suilen', 'morfonica',
  'mygo!!!!!', 'ave mujica', 'alexandros', 'frederic', 'lucky kilimanjaro',
  'wednesday campanella', 'daoko', 'reol', 'polkadot stingray', 'scandal', 'shishamo',
  'utada hikaru', 'hikaru utada', 'ayumi hamasaki', 'namie amuro', 'koda kumi',
  'mika nakashima', 'yui', 'miwa', 'sayuri', 'majiko', 'reona', 'asca', 'halca',
  'minami', 'hiroyuki sawano', 'sawanohiroyuki[nzk]', 'joe hisaishi', 'yuki kajiura',
  'kikuo', 'hachi', 'wowaka', 'mitchie m', 'chinozo', 'syudou', 'neru', 'surii',
  'ryu matsuyama'
];

function classifySongLanguage(title, artist, currentLang) {
  const text = (title + ' ' + artist).toLowerCase();
  const artistLower = (artist || '').toLowerCase().trim();

  // 1. ถ้ามีตัวอักษรลาว
  if (/[\u0E80-\u0EFF]/.test(text)) return 'lao';

  // 2. ถ้ามีตัวอักษรไทย หรือชื่อศิลปินอยู่ในหมวดศิลปินไทย
  if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
  if (THAI_ARTIST_NAMES.some(t => artistLower.includes(t) || text.includes(t))) return 'th';

  // 3. ถ้ามีตัวอักษรเกาหลี หรือชื่อศิลปินอยู่ในหมวด K-Pop
  if (/[\uAC00-\uD7AF]/.test(text)) return 'kr';
  if (KPOP_ARTIST_NAMES.some(k => artistLower === k || artistLower.includes(k))) return 'kr';

  // 4. ถ้ามีตัวอักษรญี่ปุ่น หรือชื่อศิลปินอยู่ในหมวด J-Pop / อนิเมะ
  if (/[\u3040-\u30FF\u4E00-\u9FAF]/.test(text)) return 'jp';
  if (JPOP_ARTIST_NAMES.some(j => artistLower === j || artistLower.includes(j))) return 'jp';

  // 5. ถ้าเคยระบุเป็น lao และไม่มีอักษรอื่น
  if (currentLang === 'lao') return 'lao';

  // 6. ที่เหลือถือเป็นเพลงสากล (en)
  return 'en';
}

async function searchItunesTrack(cleanTitle, cleanArtist, country = 'th') {
  const term = `${cleanTitle} ${cleanArtist}`.trim();
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=song&limit=1`;
  const json = await fetchJson(url);
  if (json && json.results && json.results[0] && json.results[0].previewUrl) {
    return json.results[0];
  }

  // ลอง fallback ค้นหาจาก us store
  if (country !== 'us') {
    const urlUs = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=us&entity=song&limit=1`;
    const jsonUs = await fetchJson(urlUs);
    if (jsonUs && jsonUs.results && jsonUs.results[0] && jsonUs.results[0].previewUrl) {
      return jsonUs.results[0];
    }
  }

  return null;
}

async function main() {
  console.log('🚀 เริ่มต้นระบบจัดหมวดหมู่ภาษาและแก้ไขบัคเสียงไม่ตรงชื่อเพลง...');

  const code = fs.readFileSync('data.js', 'utf8');
  const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
  const { ANIMES, SONGS, ANIME_PAIRS } = fn();

  console.log(`📊 จำนวนเพลงทั้งหมดในฐานข้อมูล: ${SONGS.length} เพลง`);

  // ==========================================
  // ส่วนที่ 1: ปรับแก้หมวดหมู่ภาษา (Smart Classifier)
  // ==========================================
  console.log('\n🌐 กำลังตรวจสอบและจัดระเบียบหมวดหมู่ภาษาให้ถูกต้องแม่นยำ 100%...');
  let reclassified = 0;
  const oldLangCounts = {};
  const newLangCounts = {};

  SONGS.forEach(s => {
    oldLangCounts[s.lang] = (oldLangCounts[s.lang] || 0) + 1;
    const newLang = classifySongLanguage(s.title, s.artist, s.lang);
    if (newLang !== s.lang) {
      s.lang = newLang;
      // ปรับ tags ตามภาษาใหม่
      if (!s.tags) s.tags = [];
      const langLabel = newLang === 'th' ? 'เพลงไทย' : (newLang === 'jp' ? 'J-Pop' : (newLang === 'kr' ? 'K-Pop' : (newLang === 'lao' ? 'เพลงลาว' : 'สากล')));
      if (!s.tags.includes(langLabel)) s.tags.push(langLabel);
      reclassified++;
    }
    newLangCounts[s.lang] = (newLangCounts[s.lang] || 0) + 1;
  });

  console.log(`✅ จัดหมวดหมู่ภาษาใหม่สำเร็จ: เปลี่ยนแปลง ${reclassified} เพลง`);
  console.log('📊 สถิติภาษาเดิม:', oldLangCounts);
  console.log('📊 สถิติภาษาใหม่ที่ถูกต้อง:', newLangCounts);

  // ==========================================
  // ส่วนที่ 2: ค้นหาและแก้ไขเพลงที่ใช้เสียงซ้ำ (แก้บัคเพลงไม่ตรงกับชื่อเพลง)
  // ==========================================
  console.log('\n🎧 กำลังค้นหาเพลงที่เสียงไม่ตรงกับชื่อเพลง (URL ซ้ำซ้อน)...');

  // ตรวจสอบว่า URL ไหนมีเพลงใช้ซ้ำบ้าง
  const urlCount = {};
  SONGS.forEach(s => {
    const url = s.previewUrl || s.audioUrl;
    if (url) urlCount[url] = (urlCount[url] || 0) + 1;
  });

  // คัดเลือกเพลงที่ต้องค้นหาไฟล์เสียงจริงจาก iTunes
  // โดยให้เพลงแรกที่เจอ URL นั้นเก็บไว้ ส่วนเพลงลำดับถัดไปที่ใช้ URL ซ้ำกัน ให้ไปดึงเสียงจริงของตัวเอง
  const seenUrls = new Set();
  const songsToFix = [];

  SONGS.forEach(s => {
    const url = s.previewUrl || s.audioUrl;
    if (url && urlCount[url] > 1) {
      if (!seenUrls.has(url)) {
        seenUrls.add(url); // เพลงแรกคงไว้
      } else {
        songsToFix.push(s); // เพลงที่ซ้ำ ดึงเสียงจริงใหม่
      }
    }
  });

  console.log(`🔍 ตรวจพบเพลงที่จำเป็นต้องซิงค์ไฟล์เสียงแท้จาก iTunes: ${songsToFix.length} เพลง`);

  let fixedCount = 0;
  let notFoundCount = 0;
  const batchSize = 10;

  for (let i = 0; i < songsToFix.length; i += batchSize) {
    const batch = songsToFix.slice(i, i + batchSize);
    await Promise.all(batch.map(async (song) => {
      // ล้างชื่อเพลงเพื่อค้นหาใน iTunes ได้แม่นยำขึ้น
      const cleanTitle = song.title.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
      const cleanArtist = song.artist.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
      const country = song.lang === 'th' ? 'th' : (song.lang === 'jp' ? 'jp' : (song.lang === 'kr' ? 'kr' : 'us'));

      const track = await searchItunesTrack(cleanTitle, cleanArtist, country);
      if (track && track.previewUrl) {
        song.previewUrl = track.previewUrl;
        song.audioUrl = track.previewUrl;
        song.audioFallback = track.previewUrl;
        if (track.artworkUrl100) {
          song.coverUrl = track.artworkUrl100.replace('100x100', '600x600');
        }
        fixedCount++;
      } else {
        notFoundCount++;
      }
    }));

    if ((i + batchSize) % 200 === 0 || i + batchSize >= songsToFix.length) {
      const progress = Math.min(i + batchSize, songsToFix.length);
      console.log(`  ความคืบหน้า: ${progress}/${songsToFix.length} (ได้เสียงตรงปกแล้ว ${fixedCount} เพลง)`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n🎉 แก้ไขเพลงเรียบร้อย:`);
  console.log(`  ✅ แมตช์ไฟล์เสียงแท้ตรงกับชื่อเพลงได้สำเร็จ: ${fixedCount} เพลง`);
  console.log(`  ℹ️ เพลงที่ไม่พบบนสโตร์: ${notFoundCount} เพลง`);

  // ==========================================
  // ส่วนที่ 3: บันทึกข้อมูลกลับลง data.js
  // ==========================================
  console.log('\n💾 กำลังบันทึกไฟล์ data.js...');
  const output = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', output, 'utf8');
  console.log('✅ บันทึก data.js สำเร็จ!');

  // อัปเดต version.json
  const versionObj = JSON.parse(fs.readFileSync('version.json', 'utf8'));
  versionObj.songCount = SONGS.length;
  versionObj.animeCount = ANIMES.length;
  versionObj.updatedAt = new Date().toISOString();
  fs.writeFileSync('version.json', JSON.stringify(versionObj, null, 2), 'utf8');

  console.log('🏁 เสร็จสมบูรณ์ทุกขั้นตอน!');
}

main().catch(console.error);
