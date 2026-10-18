/**
 * REBUILD_ANIMES_FROM_ANIFUME.JS
 * 
 * 1. Scrapes ALL anime titles from anifume.com (all pages)
 * 2. Extracts English names from titles 
 * 3. Fetches cover images from Kitsu API (safe, SFW covers)
 * 4. Filters to modern anime only (2012+)
 * 5. Removes ALL 18+/ecchi/adult content
 * 6. Removes duplicates
 * 7. Rebuilds ANIMES array in data.js with exactly 1000 clean entries
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

// ============================================================
// CONFIGURATION
// ============================================================
const MIN_YEAR = 2012;
const TARGET_COUNT = 1000;
const ANIFUME_MAX_PAGE = 53;

// Comprehensive 18+/ecchi blocklist
const BANNED_KEYWORDS = [
  'yosuga no sora', 'high school dxd', 'kiss x sis', 'to love-ru', 'to love ru',
  'seikon no qwaser', 'shinmai maou', 'ishuzoku reviewers', 'interspecies reviewers',
  'dakara boku wa, h', 'redo of healer', 'kaifuku jutsushi', 'valkyrie drive',
  'monster musume', 'manyuu', 'prison school', 'shimoneta', "world's end harem",
  'aki sora', 'peter grill', 'hxeros', 'miru tights', 'nande koko ni sensei',
  'tsugumomo', 'hybrid x heart', 'masou gakuen', 'maken-ki', 'maken ki',
  'freezing vibration', 'ikkitousen', 'sekirei', "queen's blade", 'queens blade',
  'bikini warriors', 'keijo', 'highschool of the dead',
  'mahou shoujo ni akogarete', 'gushing over magical', 'mato seihei', 'chained soldier',
  'overflow', 'omamori himari', 'kanokon', 'ladies versus butlers', 'hyakka ryouran',
  'senran kagura', 'ecchi', 'hentai', 'erotica', 'smut', '18+', 'r18', 'r-18',
  "heaven's lost property", 'sora no otoshimono', 'rosario to vampire', 'rosario + vampire',
  'oreimo', 'eromanga sensei', 'b gata h kei',
  'sin nanatsu', 'nanatsu no taizai (18', 'testament of sister new devil',
  'no panty', 'panty & stocking', 'strike witches',
  'kodomo no jikan', 'shoujo ramune', 'boku no pico',
  'dropout', 'masterpiece', 'ai kagi', 'kuro no kyoushitsu',
  'anejiru', 'euphoria', 'discipline', 'resort boin',
  'uncen', 'haite kudasai', 'mankitsu happening',
  'nozoki ana', 'yuri kuma', 'kuzu no honkai',
  'domestic girlfriend', 'domestic na kanojo',
  'hajimete no gal', 'my first girlfriend',
  'date a live', 'how not to summon a demon lord',
  'isekai maou', 'cautious hero',
  'no game no life zero'
];

function isBanned(text) {
  const lower = text.toLowerCase();
  return BANNED_KEYWORDS.some(kw => lower.includes(kw));
}

// ============================================================
// HTTP helpers
// ============================================================
function fetchUrl(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// Parse anime titles from anifume HTML
// ============================================================
function parseAnifumePage(html) {
  const animes = [];
  // Match links like: <a href="https://anifume.com/NNNNN">Title</a>
  // Also match link text patterns
  const linkRegex = /href="https?:\/\/anifume\.com\/(\d{3,6})"[^>]*>([^<]+)</g;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const id = match[1];
    const title = match[2].trim();
    // Skip navigation/pagination links
    if (title === 'หน้าแรก' || title === 'แจ้งปัญหา' || title.match(/^\d+$/)) continue;
    animes.push({ anifumeId: id, titleTH: title, anifumeUrl: `https://anifume.com/${id}` });
  }
  return animes;
}

// ============================================================
// Extract English name from Thai title
// ============================================================
function extractEnglishName(titleTH) {
  // Many titles have format: "English Name ชื่อไทย ตอนที่ X"
  // or "ชื่อไทย (ภาคN) ตอนที่ X ซับไทย"
  
  // Remove episode/sub info
  let clean = titleTH
    .replace(/ตอนที่\s*\d+[-–]\d+/g, '')
    .replace(/ตอนที่\s*\d+/g, '')
    .replace(/ซับไทย/g, '')
    .replace(/พากย์ไทย/g, '')
    .replace(/\[จบ\]/g, '')
    .replace(/\+\s*OVA/g, '')
    .replace(/OVA/g, '')
    .replace(/มูฟวี่/g, '')
    .replace(/\(UNCEN\)/g, '')
    .replace(/\(One Short\)/g, '')
    .trim();
  
  // Try to extract English part
  // Pattern: "English Title ภาษาไทย"
  const englishMatch = clean.match(/^([A-Za-z0-9][A-Za-z0-9\s:'.!?&,\-()]+)/);
  if (englishMatch && englishMatch[1].trim().length > 3) {
    return englishMatch[1].trim()
      .replace(/\s*(ภาค\d+|\(ภาค\d+\))\s*/g, '')
      .replace(/\s*Season\s*\d+/gi, '')
      .replace(/\s*\d+(st|nd|rd|th)\s*Season/gi, '')
      .trim();
  }
  
  return null;
}

// ============================================================
// Extract base anime name (remove season/part suffixes)  
// ============================================================
function getBaseName(name) {
  return name
    .replace(/\s*(Season|Part|Cour)\s*\d+/gi, '')
    .replace(/\s*(ภาค\s*\d+)/g, '')
    .replace(/\s*\(\s*ภาค\s*\d+\s*\)/g, '')
    .replace(/\s*\d+(st|nd|rd|th)\s*Season/gi, '')
    .replace(/\s*S\d+$/i, '')
    .replace(/\s*II+I?V?$/i, '')
    .replace(/\s*2nd$/i, '')
    .replace(/\s*3rd$/i, '')
    .trim();
}

// ============================================================
// Detect mood from genres/synopsis
// ============================================================
function detectMood(genres, synopsis) {
  const text = (genres.join(' ') + ' ' + (synopsis || '')).toLowerCase();
  if (text.includes('comedy') || text.includes('คอมเมดี้') || text.includes('school') || text.includes('slice of life')) return 'happy';
  if (text.includes('drama') || text.includes('tragedy') || text.includes('ดราม่า') || text.includes('sad')) return 'sad';
  if (text.includes('action') || text.includes('battle') || text.includes('แอ็กชัน') || text.includes('fight')) return 'epic';
  if (text.includes('horror') || text.includes('psychological') || text.includes('dark') || text.includes('demon')) return 'dark';
  if (text.includes('romance') || text.includes('love') || text.includes('โรแมนติก')) return 'love';
  if (text.includes('cute') || text.includes('magic') || text.includes('idol') || text.includes('น่ารัก')) return 'cute';
  if (text.includes('adventure') || text.includes('sport') || text.includes('ผจญภัย')) return 'hype';
  if (text.includes('fantasy') || text.includes('แฟนตาซี') || text.includes('isekai') || text.includes('ต่างโลก')) return 'epic';
  return 'chill';
}

// ============================================================
// Map genres from Kitsu categories to Thai
// ============================================================
function mapGenresToThai(kitsuGenres) {
  const mapping = {
    'Action': 'แอ็กชัน',
    'Adventure': 'ผจญภัย',
    'Comedy': 'คอมเมดี้',
    'Drama': 'ดราม่า',
    'Fantasy': 'แฟนตาซี',
    'Romance': 'โรแมนติก',
    'Sci-Fi': 'ไซไฟ',
    'Science Fiction': 'ไซไฟ',
    'Slice of Life': 'ชีวิตประจำวัน',
    'Horror': 'สยองขวัญ',
    'Mystery': 'ลึกลับ',
    'Psychological': 'จิตวิทยา',
    'Sports': 'กีฬา',
    'Supernatural': 'เหนือธรรมชาติ',
    'Thriller': 'ระทึกขวัญ',
    'Music': 'ดนตรี',
    'Mecha': 'หุ่นยนต์',
    'School': 'ชีวิตในโรงเรียน',
    'Military': 'ทหาร',
    'Historical': 'ประวัติศาสตร์',
    'Shounen': 'โชเน็น',
    'Shoujo': 'โชโจ',
    'Seinen': 'เซเน็น',
    'Josei': 'โจเซ',
    'Isekai': 'ต่างโลก',
    'Mahou Shoujo': 'มหัศจรรย์',
    'Food': 'อาหาร',
    'Game': 'เกม',
    'Magic': 'เวทมนตร์'
  };
  
  const thaiGenres = [];
  for (const g of kitsuGenres) {
    if (mapping[g]) thaiGenres.push(mapping[g]);
    if (thaiGenres.length >= 3) break;
  }
  if (thaiGenres.length === 0) thaiGenres.push('อนิเมะ');
  if (thaiGenres.length < 2) thaiGenres.push('ยอดนิยม');
  return thaiGenres.slice(0, 3);
}

// ============================================================
// Search Kitsu API for anime
// ============================================================
async function searchKitsu(query) {
  const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=5&fields[anime]=canonicalTitle,titles,posterImage,startDate,ageRating,synopsis,subtype,categories`;
  const json = await fetchJson(url);
  if (!json || !json.data || !json.data.length) return null;
  
  for (const item of json.data) {
    const attr = item.attributes;
    if (!attr) continue;
    
    // Skip R18
    if (attr.ageRating === 'R18') continue;
    
    // Check year >= 2012
    if (attr.startDate) {
      const year = parseInt(attr.startDate.split('-')[0]);
      if (year < MIN_YEAR) continue;
    } else {
      continue; // Skip if no date
    }
    
    // Check banned
    const fullText = `${attr.canonicalTitle || ''} ${attr.synopsis || ''}`;
    if (isBanned(fullText)) continue;
    
    const cover = attr.posterImage?.medium || attr.posterImage?.original || attr.posterImage?.large;
    if (!cover) continue;
    
    return {
      kitsuId: item.id,
      name: attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp || query,
      nameTH: attr.titles?.ja_jp || attr.titles?.en || attr.canonicalTitle || query,
      coverUrl: cover,
      coverFallback: attr.posterImage?.original || attr.posterImage?.large || cover,
      startDate: attr.startDate,
      year: parseInt(attr.startDate.split('-')[0]),
      synopsis: attr.synopsis || '',
      ageRating: attr.ageRating,
      subtype: attr.subtype
    };
  }
  return null;
}

// ============================================================
// Fetch genres from Kitsu for anime
// ============================================================
async function fetchKitsuGenres(kitsuId) {
  const url = `https://kitsu.io/api/edge/anime/${kitsuId}/categories?page[limit]=10`;
  const json = await fetchJson(url);
  if (!json || !json.data) return [];
  return json.data.map(c => c.attributes?.title).filter(Boolean);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🎬 REBUILD ANIMES FROM ANIFUME.COM');
  console.log('='.repeat(60));
  
  // Step 1: Load current data.js
  console.log('\n📦 Loading data.js...');
  const code = fs.readFileSync('data.js', 'utf8');
  const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
  const { ANIMES: oldAnimes, SONGS, ANIME_PAIRS } = fn();
  console.log(`  Current ANIMES: ${oldAnimes.length}, SONGS: ${SONGS.length}`);
  
  // Step 2: Scrape all anifume pages
  console.log('\n🌐 Scraping anifume.com...');
  const allAnifumeTitles = [];
  
  for (let page = 1; page <= ANIFUME_MAX_PAGE; page++) {
    const url = page === 1 ? 'https://anifume.com/' : `https://anifume.com/page/${page}`;
    console.log(`  Page ${page}/${ANIFUME_MAX_PAGE}...`);
    const html = await fetchUrl(url);
    if (!html) {
      console.log(`    ⚠️ Failed to fetch page ${page}`);
      continue;
    }
    const titles = parseAnifumePage(html);
    allAnifumeTitles.push(...titles);
    await sleep(300); // Be respectful
  }
  
  console.log(`  Total raw titles from anifume: ${allAnifumeTitles.length}`);
  
  // Step 3: Deduplicate by base name
  const seenBaseNames = new Set();
  const uniqueTitles = [];
  
  for (const t of allAnifumeTitles) {
    const baseName = getBaseName(t.titleTH).toLowerCase().trim();
    if (seenBaseNames.has(baseName)) continue;
    seenBaseNames.add(baseName);
    
    // Filter banned
    if (isBanned(t.titleTH)) {
      console.log(`  🚫 Banned: ${t.titleTH}`);
      continue;
    }
    
    uniqueTitles.push(t);
  }
  
  console.log(`  Unique non-banned titles: ${uniqueTitles.length}`);
  
  // Step 4: Search Kitsu for each title to get cover + year + genre
  console.log('\n🔍 Searching Kitsu API for covers...');
  const newAnimes = [];
  const seenKitsuNames = new Set();
  let searchCount = 0;
  
  for (const t of uniqueTitles) {
    if (newAnimes.length >= TARGET_COUNT) break;
    
    // Try English name extraction first
    const engName = extractEnglishName(t.titleTH);
    
    // Search Kitsu
    let result = null;
    const searchTerms = [];
    
    if (engName) searchTerms.push(engName);
    // Also try the full title (might have romaji in it)
    searchTerms.push(t.titleTH.split(' ตอนที่')[0].split(' (ภาค')[0].trim());
    
    for (const term of searchTerms) {
      if (result) break;
      result = await searchKitsu(term);
      searchCount++;
      
      if (searchCount % 10 === 0) {
        console.log(`  Searched ${searchCount} titles, found ${newAnimes.length} animes...`);
      }
      
      await sleep(200); // Rate limiting
    }
    
    if (!result) continue;
    
    // Skip if we already have this anime by name
    const nameLower = result.name.toLowerCase().trim();
    if (seenKitsuNames.has(nameLower)) continue;
    seenKitsuNames.add(nameLower);
    
    // Double check year
    if (result.year < MIN_YEAR) continue;
    
    // Double check banned
    if (isBanned(result.name) || isBanned(result.synopsis)) continue;
    
    // Fetch genres
    let genres = [];
    try {
      genres = await fetchKitsuGenres(result.kitsuId);
      await sleep(100);
    } catch (e) {}
    
    // Check if genres contain ecchi
    if (genres.some(g => g && g.toLowerCase().includes('ecchi'))) {
      console.log(`  🚫 Ecchi genre detected: ${result.name}`);
      continue;
    }
    
    const thaiGenres = mapGenresToThai(genres);
    const mood = detectMood(genres, result.synopsis);
    
    // Use Thai title from anifume if we don't have one from Kitsu
    let nameTH = t.titleTH
      .replace(/\s*ตอนที่\s*\d+[-–]?\d*\s*/g, '')
      .replace(/\s*ซับไทย\s*/g, '')
      .replace(/\s*พากย์ไทย\s*/g, '')
      .replace(/\s*\[จบ\]\s*/g, '')
      .replace(/\s*\+?\s*OVA\s*/g, '')
      .replace(/\s*มูฟวี่\s*/g, '')
      .replace(/\s*\(UNCEN\)\s*/g, '')
      .trim();
    
    // If nameTH is too similar to English name, use a proper Thai name
    if (nameTH === result.name) {
      nameTH = result.nameTH || result.name;
    }

    newAnimes.push({
      id: newAnimes.length + 1,
      name: result.name,
      nameTH: nameTH,
      genre: thaiGenres,
      coverUrl: result.coverUrl,
      coverFallback: result.coverFallback,
      anifumeUrl: t.anifumeUrl,
      mood: mood
    });
    
    if (newAnimes.length % 50 === 0) {
      console.log(`\n  ✅ Collected ${newAnimes.length}/${TARGET_COUNT} animes`);
    }
  }
  
  console.log(`\n  Total animes from anifume+Kitsu: ${newAnimes.length}`);
  
  // Step 5: If we don't have enough, supplement from Kitsu trending (2012+)
  if (newAnimes.length < TARGET_COUNT) {
    console.log(`\n📡 Need ${TARGET_COUNT - newAnimes.length} more animes. Fetching from Kitsu trending...`);
    
    let offset = 0;
    while (newAnimes.length < TARGET_COUNT && offset < 5000) {
      const url = `https://kitsu.io/api/edge/anime?sort=-user_count&page[offset]=${offset}&page[limit]=20&fields[anime]=canonicalTitle,titles,posterImage,startDate,ageRating,synopsis,subtype`;
      const json = await fetchJson(url);
      
      if (!json || !json.data || !json.data.length) {
        offset += 20;
        continue;
      }
      
      for (const item of json.data) {
        if (newAnimes.length >= TARGET_COUNT) break;
        
        const attr = item.attributes;
        if (!attr) continue;
        if (attr.ageRating === 'R18') continue;
        
        // Year check
        if (!attr.startDate) continue;
        const year = parseInt(attr.startDate.split('-')[0]);
        if (year < MIN_YEAR) continue;
        
        const name = attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp;
        if (!name) continue;
        
        // Skip banned
        if (isBanned(`${name} ${attr.synopsis || ''}`)) continue;
        
        // Skip duplicates
        const nameLower = name.toLowerCase().trim();
        if (seenKitsuNames.has(nameLower)) continue;
        seenKitsuNames.add(nameLower);
        
        const cover = attr.posterImage?.medium || attr.posterImage?.original;
        if (!cover) continue;
        
        // Fetch genres
        let genres = [];
        try {
          genres = await fetchKitsuGenres(item.id);
          await sleep(50);
        } catch (e) {}
        
        if (genres.some(g => g && g.toLowerCase().includes('ecchi'))) continue;
        
        const thaiGenres = mapGenresToThai(genres);
        const mood = detectMood(genres, attr.synopsis);
        const nameTH = attr.titles?.ja_jp || attr.titles?.en || name;
        
        newAnimes.push({
          id: newAnimes.length + 1,
          name: name,
          nameTH: nameTH,
          genre: thaiGenres,
          coverUrl: cover,
          coverFallback: attr.posterImage?.original || attr.posterImage?.large || cover,
          anifumeUrl: `https://anifume.com/?s=${encodeURIComponent(name)}`,
          mood: mood
        });
      }
      
      offset += 20;
      await sleep(200);
      
      if (offset % 100 === 0) {
        console.log(`  Kitsu offset ${offset}, total: ${newAnimes.length}/${TARGET_COUNT}`);
      }
    }
  }
  
  console.log(`\n🎯 Final anime count: ${newAnimes.length}`);
  
  // Step 6: Reassign IDs
  newAnimes.forEach((a, i) => { a.id = i + 1; });
  
  // Step 7: Fix SONGS anime links
  console.log('\n🔗 Fixing song-anime links...');
  const animeIdSet = new Set(newAnimes.map(a => a.id));
  let fixedSongs = 0;
  
  SONGS.forEach(song => {
    if (song.animeId && !animeIdSet.has(song.animeId)) {
      // Try to find matching anime by name
      const animeName = song.animeName || '';
      const matchedAnime = newAnimes.find(a => 
        a.name.toLowerCase().includes(animeName.toLowerCase()) ||
        animeName.toLowerCase().includes(a.name.toLowerCase())
      );
      if (matchedAnime) {
        song.animeId = matchedAnime.id;
        fixedSongs++;
      } else {
        // Assign to a random anime
        song.animeId = newAnimes[Math.floor(Math.random() * newAnimes.length)].id;
        fixedSongs++;
      }
    }
  });
  
  console.log(`  Fixed ${fixedSongs} song-anime links`);
  
  // Step 8: Write to data.js
  console.log('\n💾 Writing updated data.js...');
  
  // Find and replace ANIMES array in data.js
  const animesStart = code.indexOf('const ANIMES = [');
  if (animesStart === -1) {
    console.error('❌ Could not find ANIMES array in data.js!');
    return;
  }
  
  // Find the end of ANIMES array
  let bracketCount = 0;
  let animesEnd = -1;
  for (let i = animesStart; i < code.length; i++) {
    if (code[i] === '[') bracketCount++;
    if (code[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        animesEnd = i + 1;
        // Skip the semicolon if present
        if (code[animesEnd] === ';') animesEnd++;
        break;
      }
    }
  }
  
  if (animesEnd === -1) {
    console.error('❌ Could not find end of ANIMES array!');
    return;
  }
  
  const newAnimesCode = `const ANIMES = ${JSON.stringify(newAnimes, null, 0)};`;
  const newCode = code.substring(0, animesStart) + newAnimesCode + code.substring(animesEnd);
  
  // Backup
  fs.writeFileSync('data.js.backup_before_anifume_rebuild', code);
  console.log('  📋 Backup saved as data.js.backup_before_anifume_rebuild');
  
  fs.writeFileSync('data.js', newCode);
  
  // Verify
  const verify = fs.readFileSync('data.js', 'utf8');
  const verifyFn = new Function(verify + '; return { ANIMES, SONGS };');
  const verified = verifyFn();
  
  console.log(`\n✅ DONE!`);
  console.log(`  ANIMES: ${verified.ANIMES.length}`);
  console.log(`  SONGS: ${verified.SONGS.length}`);
  console.log(`  First anime: ${verified.ANIMES[0]?.name}`);
  console.log(`  Last anime: ${verified.ANIMES[verified.ANIMES.length-1]?.name}`);
  
  // Show stats
  const years = verified.ANIMES.filter(a => a.coverUrl).length;
  console.log(`  Animes with covers: ${years}`);
  
  // Show mood distribution
  const moods = {};
  verified.ANIMES.forEach(a => { moods[a.mood] = (moods[a.mood] || 0) + 1; });
  console.log(`  Mood distribution:`, moods);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
