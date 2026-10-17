/**
 * EXPAND_ANIMES_TO_1000.JS
 * Adds popular, non-18+ animes from Kitsu API until total ANIMES count is exactly 1,000.
 */

const fs = require('fs');
const https = require('https');
const { check18Plus } = require('./manage_content');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'Accept': 'application/vnd.api+json', 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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

function detectAnimeMood(title, synopsis) {
  const text = (title + ' ' + (synopsis || '')).toLowerCase();
  if (text.includes('comedy') || text.includes('school') || text.includes('slice of life') || text.includes('fun')) return 'happy';
  if (text.includes('drama') || text.includes('tragedy') || text.includes('death') || text.includes('sad')) return 'sad';
  if (text.includes('action') || text.includes('battle') || text.includes('shounen') || text.includes('fight')) return 'epic';
  if (text.includes('horror') || text.includes('psychological') || text.includes('dark') || text.includes('demon')) return 'dark';
  if (text.includes('romance') || text.includes('love') || text.includes('shoujo') || text.includes('couple')) return 'love';
  if (text.includes('cute') || text.includes('magic') || text.includes('idol')) return 'cute';
  if (text.includes('adventure') || text.includes('sport') || text.includes('energy')) return 'hype';
  return 'chill';
}

function mapGenre(synopsis, title) {
  const text = (title + ' ' + (synopsis || '')).toLowerCase();
  const genres = ['อนิเมะ'];
  if (text.includes('action') || text.includes('fight') || text.includes('battle')) genres.push('แอ็กชัน');
  if (text.includes('comedy') || text.includes('funny')) genres.push('คอมเมดี้');
  if (text.includes('romance') || text.includes('love')) genres.push('โรแมนติก');
  if (text.includes('fantasy') || text.includes('magic')) genres.push('แฟนตาซี');
  if (text.includes('drama')) genres.push('ดราม่า');
  if (text.includes('school')) genres.push('ชีวิตในโรงเรียน');
  if (text.includes('adventure')) genres.push('ผจญภัย');
  if (text.includes('sci-fi') || text.includes('mecha')) genres.push('ไซไฟ');
  if (genres.length === 1) genres.push('ยอดนิยม', 'แฟนตาซี');
  return genres.slice(0, 3);
}

async function main() {
  console.log('🎬 กำลังโหลด data.js เพื่อตรวจสอบจำนวนอนิเมะ...');
  const code = fs.readFileSync('data.js', 'utf8');
  const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
  const { ANIMES, SONGS, ANIME_PAIRS } = fn();

  console.log(`📊 จำนวนอนิเมะปัจจุบัน: ${ANIMES.length} เรื่อง (เป้าหมาย: 1,000 เรื่อง)`);
  if (ANIMES.length >= 1000) {
    console.log('✅ จำนวนอนิเมะครบ 1,000 เรื่องหรือมากกว่าแล้ว!');
    return;
  }

  const existingAnimeNames = new Set(ANIMES.map(a => a.name.toLowerCase().trim()));
  const targetNeeded = 1000 - ANIMES.length;
  console.log(`🎯 ต้องเพิ่มอนิเมะใหม่อีก: ${targetNeeded} เรื่อง`);

  let currentId = Math.max(0, ...ANIMES.map(a => a.id));
  const newAnimes = [];

  let offset = 400; // Start after top 400 to avoid duplicates
  while (newAnimes.length < targetNeeded && offset < 3000) {
    const url = `https://kitsu.io/api/edge/anime?sort=-user_count&page[offset]=${offset}&page[limit]=20`;
    console.log(`  Fetching offset ${offset}... (เก็บได้แล้ว ${newAnimes.length}/${targetNeeded})`);
    const json = await fetchJson(url);
    if (!json || !json.data || !json.data.length) {
      offset += 20;
      continue;
    }

    for (const item of json.data) {
      const attr = item.attributes;
      if (!attr) continue;

      if (attr.ageRating === 'R18') continue;
      const isAdult = check18Plus(`${attr.canonicalTitle} ${attr.synopsis || ''}`);
      if (isAdult) continue;

      const name = attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp;
      if (!name) continue;

      const nameLower = name.toLowerCase().trim();
      if (existingAnimeNames.has(nameLower)) continue;
      existingAnimeNames.add(nameLower);

      const cover = attr.posterImage?.medium || attr.posterImage?.original || attr.posterImage?.large;
      if (!cover) continue;

      const nameTH = attr.titles?.th || attr.titles?.en || name;
      const mood = detectAnimeMood(name, attr.synopsis);
      const genre = mapGenre(attr.synopsis, name);

      currentId++;
      newAnimes.push({
        id: currentId,
        name,
        nameTH,
        genre,
        coverUrl: cover,
        coverFallback: cover,
        anifumeUrl: `https://anifume.com/?s=${encodeURIComponent(name)}`,
        mood
      });

      if (newAnimes.length >= targetNeeded) break;
    }

    offset += 20;
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`✨ ดึงอนิเมะใหม่สำเร็จ: ${newAnimes.length} เรื่อง`);
  ANIMES.push(...newAnimes);
  console.log(`🎉 จำนวนอนิเมะรวมทั้งหมด: ${ANIMES.length} เรื่อง!`);

  // บันทึก data.js
  const output = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', output, 'utf8');

  // อัปเดต version.json
  const versionObj = JSON.parse(fs.readFileSync('version.json', 'utf8'));
  versionObj.animeCount = ANIMES.length;
  versionObj.updatedAt = new Date().toISOString();
  fs.writeFileSync('version.json', JSON.stringify(versionObj, null, 2), 'utf8');

  console.log('✅ บันทึก data.js และ version.json เรียบร้อยแล้ว!');
}

main().catch(console.error);
