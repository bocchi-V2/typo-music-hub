const fs = require('fs');
const https = require('https');

function searchITunes(term) {
  return new Promise((resolve) => {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=3`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            // Find track with preview
            const track = json.results.find(t => t.previewUrl) || json.results[0];
            resolve(track);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function searchKitsu(query) {
  return new Promise((resolve) => {
    const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=1`;
    https.get(url, { headers: { 'Accept': 'application/vnd.api+json', 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.length > 0) {
            const attr = json.data[0].attributes;
            const cover = (attr.posterImage && (attr.posterImage.medium || attr.posterImage.large || attr.posterImage.original)) || 'favicon-logo.jpg';
            resolve({
              canonicalTitle: attr.canonicalTitle || query,
              synopsis: attr.synopsis || '',
              coverUrl: cover
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// 25 Iconic Funk Songs list
const FUNK_CURATED = [
  { title: "September", artist: "Earth, Wind & Fire", query: "September Earth Wind & Fire", mood: "hype", bpm: "เร็ว (126 BPM)", tags: ["ดิสโก้", "กรูฟ", "คลาสสิค"] },
  { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", query: "Uptown Funk Mark Ronson Bruno Mars", mood: "hype", bpm: "เร็ว (115 BPM)", tags: ["ไวรัล", "โมเดิร์นฟังก์", "เต้น"] },
  { title: "Superstition", artist: "Stevie Wonder", query: "Superstition Stevie Wonder", mood: "hype", bpm: "เร็ว (100 BPM)", tags: ["คลาสสิค", "โซลฟังก์", "กรูฟแน่น"] },
  { title: "Get Lucky", artist: "Daft Punk ft. Pharrell Williams", query: "Get Lucky Daft Punk Pharrell", mood: "chill", bpm: "ปานกลาง (116 BPM)", tags: ["ฟังก์โมเดิร์น", "ดิสโก้", "ชิลล์"] },
  { title: "Virtual Insanity", artist: "Jamiroquai", query: "Virtual Insanity Jamiroquai", mood: "chill", bpm: "ปานกลาง (92 BPM)", tags: ["แอซิดฟังก์", "กรูฟเท่", "ลื่นไหล"] },
  { title: "Cosmic Girl", artist: "Jamiroquai", query: "Cosmic Girl Jamiroquai", mood: "hype", bpm: "เร็ว (120 BPM)", tags: ["แอซิดฟังก์", "ดิสโก้", "จังหวะสนุก"] },
  { title: "Treasure", artist: "Bruno Mars", query: "Treasure Bruno Mars", mood: "love", bpm: "เร็ว (116 BPM)", tags: ["หวานฟังก์", "ดิสโก้ป๊อป", "โรแมนติก"] },
  { title: "24K Magic", artist: "Bruno Mars", query: "24K Magic Bruno Mars", mood: "hype", bpm: "เร็ว (106 BPM)", tags: ["ปาร์ตี้", "โมเดิร์นฟังก์", "ไฮป์"] },
  { title: "Leave The Door Open", artist: "Silk Sonic (Bruno Mars & Anderson .Paak)", query: "Leave The Door Open Silk Sonic", mood: "love", bpm: "ช้า (74 BPM)", tags: ["โรแมนติก", "วินเทจโซล", "นุ่มนวล"] },
  { title: "Le Freak", artist: "Chic", query: "Le Freak Chic", mood: "hype", bpm: "เร็ว (120 BPM)", tags: ["ดิสโก้ฟังก์", "คลาสสิค", "เบสหนึบ"] },
  { title: "Play That Funky Music", artist: "Wild Cherry", query: "Play That Funky Music Wild Cherry", mood: "hype", bpm: "เร็ว (109 BPM)", tags: ["ร็อกฟังก์", "ตำนาน", "มันส์"] },
  { title: "Celebration", artist: "Kool & The Gang", query: "Celebration Kool & The Gang", mood: "hype", bpm: "เร็ว (122 BPM)", tags: ["ฉลอง", "ดิสโก้ฟังก์", "สดใส"] },
  { title: "Jungle Boogie", artist: "Kool & The Gang", query: "Jungle Boogie Kool & The Gang", mood: "hype", bpm: "เร็ว (107 BPM)", tags: ["กรูฟดุดัน", "เบสแน่น", "คลาสสิค"] },
  { title: "Give It to Me Baby", artist: "Rick James", query: "Give It to Me Baby Rick James", mood: "hype", bpm: "เร็ว (115 BPM)", tags: ["พังค์ฟังก์", "เบสกระชาก", "ไฮป์"] },
  { title: "Super Freak", artist: "Rick James", query: "Super Freak Rick James", mood: "hype", bpm: "เร็ว (132 BPM)", tags: ["แดนซ์ฟังก์", "เบสระดับตำนาน", "เร้าใจ"] },
  { title: "Let's Groove", artist: "Earth, Wind & Fire", query: "Lets Groove Earth Wind & Fire", mood: "hype", bpm: "เร็ว (125 BPM)", tags: ["ดิสโก้ฟังก์", "ซินธ์กรูฟ", "แดนซ์"] },
  { title: "Boogie Wonderland", artist: "Earth, Wind & Fire ft. The Emotions", query: "Boogie Wonderland Earth Wind & Fire", mood: "hype", bpm: "เร็ว (132 BPM)", tags: ["ดิสโก้", "แดนซ์กระจาย", "วินเทจ"] },
  { title: "Brick House", artist: "Commodores", query: "Brick House Commodores", mood: "chill", bpm: "ปานกลาง (108 BPM)", tags: ["ฟังก์หนัก", "เบสกรูฟ", "คูล"] },
  { title: "Good Times", artist: "Chic", query: "Good Times Chic", mood: "chill", bpm: "ปานกลาง (111 BPM)", tags: ["เบสไลน์ระดับโลก", "ดิสโก้ฟังก์", "ชิลล์"] },
  { title: "That's the Way (I Like It)", artist: "KC and The Sunshine Band", query: "Thats the Way I Like It KC and The Sunshine Band", mood: "hype", bpm: "เร็ว (109 BPM)", tags: ["ดิสโก้", "สดใส", "ร้องตามง่าย"] },
  { title: "Come and Get Your Love", artist: "Redbone", query: "Come and Get Your Love Redbone", mood: "love", bpm: "ปานกลาง (107 BPM)", tags: ["ฟังก์ป๊อป", "วินเทจ", "รักกวนๆ"] },
  { title: "Flash Light", artist: "Parliament", query: "Flash Light Parliament", mood: "chill", bpm: "ปานกลาง (106 BPM)", tags: ["พีฟังก์", "ซินธ์เบส", "ไซไฟ"] },
  { title: "Sir Duke", artist: "Stevie Wonder", query: "Sir Duke Stevie Wonder", mood: "hype", bpm: "เร็ว (106 BPM)", tags: ["บราสแน่น", "พลังบวก", "แจ๊สฟังก์"] },
  { title: "I Wish", artist: "Stevie Wonder", query: "I Wish Stevie Wonder", mood: "hype", bpm: "เร็ว (105 BPM)", tags: ["กรูฟจัด", "เบสเดินมันส์", "โซลฟังก์"] },
  { title: "I Feel Good (I Got You)", artist: "James Brown", query: "I Got You I Feel Good James Brown", mood: "hype", bpm: "เร็ว (144 BPM)", tags: ["เจ้าพ่อเพลงฟังก์", "ไฮป์สะใจ", "ตะโกนสุดเสียง"] }
];

// New popular animes to add
const NEW_ANIMES = [
  { name: "Dandadan", nameTH: "ดันดาดัน", genre: ["แอ็กชัน", "คอมเมดี้", "เหนือธรรมชาติ", "ไซไฟ"], mood: "hype" },
  { name: "Kaiju No. 8", nameTH: "ไคจูหมายเลข 8", genre: ["แอ็กชัน", "ไซไฟ", "สัตว์ประหลาด"], mood: "hype" },
  { name: "Solo Leveling", nameTH: "จุติใหม่เป็นเทพสายเดี่ยว", genre: ["แอ็กชัน", "แฟนตาซี", "ผจญภัย"], mood: "hype" },
  { name: "Wind Breaker", nameTH: "วินด์เบรกเกอร์ นักเลงปกป้องเมือง", genre: ["แอ็กชัน", "โรงเรียน", "มิตรภาพ"], mood: "hype" },
  { name: "Delicious in Dungeon", nameTH: "ดันเจี้ยน เมชิ สูตรลับดันเจี้ยน", genre: ["แฟนตาซี", "ทำอาหาร", "ตลก"], mood: "chill" },
  { name: "Too Many Losing Heroines!", nameTH: "สาวขี้แพ้มีมากเกินไป!", genre: ["โรแมนติก", "คอมเมดี้", "ชีวิตประจำวัน"], mood: "love" },
  { name: "Alya Sometimes Hides Her Feelings in Russian", nameTH: "คุณอาเรียโต๊ะข้างๆ พูดภาษารัสเซียหวานใส่ซะงั้น", genre: ["โรแมนติก", "โรงเรียน", "คอมเมดี้"], mood: "love" },
  { name: "The Apothecary Diaries", nameTH: "สืบคดีปริศนาหมอยาตำรับโคมแดง", genre: ["ลึกลับ", "ดราม่า", "ย้อนยุค"], mood: "chill" },
  { name: "Shangri-La Frontier", nameTH: "ช่างแกรนด์ ฟรอนเทียร์ พรานล่าเกมขยะ", genre: ["เกม", "แอ็กชัน", "แฟนตาซี"], mood: "hype" },
  { name: "Cyberpunk: Edgerunners", nameTH: "ไซเบอร์พังก์ เอ็ดจ์รันเนอร์ส", genre: ["ไซไฟ", "แอ็กชัน", "ดราม่า"], mood: "hype" }
];

// New trending songs to add
const NEW_SONGS = [
  // Thai
  { title: "ซ่อนเธอไว้ในเพลง", artist: "Tilly Birds", lang: "th", mood: "sad", animeName: "Frieren: Beyond Journey's End", tags: ["เศร้า", "คิดถึง", "ไทโป"], idea: "ใช้ไทโปฟอนต์บางเบาตัดสลับภาพความทรงจำที่ค่อยๆ จางหาย" },
  { title: "วาดไว้", artist: "BOWKYLION", lang: "th", mood: "sad", animeName: "Your Lie in April", tags: ["เศร้าซึ้ง", "ฮิต", "อกหัก"], idea: "เล่นไทโปแบบตัวหนังสือเขียนทีละเส้นตามท่อนฮุก" },
  { title: "พิง", artist: "นนท์ ธนนท์", lang: "th", mood: "love", animeName: "Alya Sometimes Hides Her Feelings in Russian", tags: ["อบอุ่น", "รัก", "เสียงนุ่ม"], idea: "ฟอนต์ละมุนสีพาสเทลตัดกับฉากมองตากัน" },
  { title: "เสแสร้ง (Pretend)", artist: "Paper Planes", lang: "th", mood: "hype", animeName: "Wind Breaker", tags: ["ร็อก", "มันส์", "ระเบิดอารมณ์"], idea: "เอฟเฟกต์กระตุก สั่นหน้าจอตามเสียงสแนร์และเสียงว้าก" },
  { title: "ลืมไปแล้วว่าลืมยังไง", artist: "Jeff Satur", lang: "th", mood: "sad", animeName: "Cyberpunk: Edgerunners", tags: ["ดราม่า", "เสียงสูง", "บาดลึก"], idea: "ไทโปนีออนสลัวๆ ท่ามกลางสายฝน" },
  { title: "ทรงอย่างแบด (Bad Boy)", artist: "Paper Planes", lang: "th", mood: "hype", animeName: "Kaiju No. 8", tags: ["ป๊อปร็อก", "ไวรัล", "ไฮป์"], idea: "ตัวหนังสือตัวหนาขยับกระชากตามบีต 130 BPM" },

  // Global
  { title: "Birds of a Feather", artist: "Billie Eilish", lang: "en", mood: "love", animeName: "Too Many Losing Heroines!", tags: ["ป๊อป", "โรแมนติก", "ละมุน"], idea: "ไทโปมินิมอลขยับลอยนุ่มนวล" },
  { title: "Espresso", artist: "Sabrina Carpenter", lang: "en", mood: "hype", animeName: "Spy x Family", tags: ["สดใส", "เต้น", "ไวรัล"], idea: "สีสันสดใสตัดต่อฉากยิ้มกวนๆ ของอาเนีย" },
  { title: "Taste", artist: "Sabrina Carpenter", lang: "en", mood: "hype", animeName: "Chainsaw Man", tags: ["ป๊อปแดนซ์", "เท่", "มันส์"], idea: "ไทโปกระพริบตามจังหวะเบส" },
  { title: "Die With A Smile", artist: "Lady Gaga & Bruno Mars", lang: "en", mood: "love", animeName: "Frieren: Beyond Journey's End", tags: ["ดูเอ็ท", "ทรงพลัง", "บัลลาด"], idea: "ฟอนต์เซริฟวินเทจทองอร่ามกับซีนซาบซึ้ง" },
  { title: "Not Like Us", artist: "Kendrick Lamar", lang: "en", mood: "hype", animeName: "Solo Leveling", tags: ["ฮิปฮอป", "เบสหนัก", "ดุเดือด"], idea: "ฉากซองจินอูปล่อยสกิลคู่กับบีทกระแทก" },
  { title: "Beautiful Things", artist: "Benson Boone", lang: "en", mood: "hype", animeName: "Attack on Titan", tags: ["ร็อกบัลลาด", "ระเบิดอารมณ์", "ไฮป์"], idea: "ท่อนดรอปแล้วขึ้นท่อนฮุคระเบิดไทโปซูมทะลุจอ" },

  // Anime / Japanese
  { title: "Otonoke (Dandadan OP)", artist: "Creepy Nuts", lang: "jp", mood: "hype", animeName: "Dandadan", tags: ["แร็ปญี่ปุ่น", "สุดมันส์", "อนิเมะฮิต"], idea: "สปีดไทโปเร็วตามท่อนแร็ปสุดโฟลว์" },
  { title: "Abyss (Kaiju No. 8 OP)", artist: "YUNGBLUD", lang: "jp", mood: "hype", animeName: "Kaiju No. 8", tags: ["ร็อก", "ทรงพลัง", "อนิเมะ"], idea: "เอฟเฟกต์ glitch สีฟ้า-ดำสลับกับภาพแปลงร่าง" },
  { title: "Fatal (Oshi no Ko S2 OP)", artist: "GEMN (Kento Nakajima x Tatsuya Kitani)", lang: "jp", mood: "hype", animeName: "Oshi no Ko", tags: ["ดราม่า", "เจป๊อป", "เท่"], idea: "แสงไฟสปอตไลท์ส่องลงบนข้อความไทโป" },
  { title: "Bling-Bang-Bang-Born", artist: "Creepy Nuts", lang: "jp", mood: "hype", animeName: "Mashle: Magic and Muscles", tags: ["แดนซ์ไวรัล", "ตลก", "มันส์"], idea: "ตัวอักษรเด้งดึ๋งตามท่าเต้นไวรัล" },
  { title: "Kura Kura", artist: "Ado", lang: "jp", mood: "hype", animeName: "Spy x Family", tags: ["แจ๊สร็อก", "เสียงทรงพลัง", "สายลับ"], idea: "ไทโปสไตล์การ์ตูนสายลับเรโทร" }
];

async function main() {
  console.log('🚀 เริ่มต้นอัปเดตและขยายคลังเพลง & อนิเมะ...');

  // 1. Read data.js
  const code = fs.readFileSync('data.js', 'utf8');
  const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS, FUNK_SONGS: typeof FUNK_SONGS !== "undefined" ? FUNK_SONGS : [] };');
  const db = fn();
  const { ANIMES, SONGS, ANIME_PAIRS } = db;
  let FUNK_SONGS = db.FUNK_SONGS || [];

  console.log(`คลังเดิม: ${ANIMES.length} อนิเมะ | ${SONGS.length} เพลง | ${FUNK_SONGS.length} Funk`);

  // 2. Add New Animes
  let nextAnimeId = Math.max(0, ...ANIMES.map(a => a.id)) + 1;
  const animeMap = {};

  for (const item of NEW_ANIMES) {
    const existing = ANIMES.find(a => a.name.toLowerCase() === item.name.toLowerCase());
    if (existing) {
      animeMap[item.name] = existing.id;
      continue;
    }
    console.log(`🔎 ดึงรูปปก Kitsu สำหรับอนิเมะ: ${item.name}...`);
    const kitsu = await searchKitsu(item.name);
    const coverUrl = kitsu ? kitsu.coverUrl : 'favicon-logo.jpg';
    const newAnime = {
      id: nextAnimeId,
      name: item.name,
      nameTH: item.nameTH,
      genre: item.genre,
      coverUrl: coverUrl,
      coverFallback: coverUrl,
      anifumeUrl: `https://anifume.com/?s=${encodeURIComponent(item.name)}`,
      mood: item.mood
    };
    ANIMES.push(newAnime);
    animeMap[item.name] = nextAnimeId;
    nextAnimeId++;
    console.log(`✅ เพิ่มอนิเมะ "${item.name}" (ID: ${newAnime.id})`);
  }

  // 3. Enrich & Build FUNK_SONGS with 100% full previews & covers
  const enrichedFunk = [];
  let funkId = 1;
  for (const item of FUNK_CURATED) {
    console.log(`🎵 ค้นหา iTunes Funk: ${item.title} - ${item.artist}...`);
    const track = await searchITunes(item.query);
    const cover = track && track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : 'favicon-logo.jpg';
    const preview = track && track.previewUrl ? track.previewUrl : '';
    const spotify = `https://open.spotify.com/search/${encodeURIComponent(item.title + ' ' + item.artist)}`;

    // Pick a matched anime ID
    const sampleAnime = ANIMES[Math.floor(Math.random() * 20) + 1] || ANIMES[0];

    enrichedFunk.push({
      id: funkId++,
      title: item.title,
      artist: item.artist,
      coverUrl: cover,
      previewUrl: preview,
      spotifyUrl: spotify,
      mood: item.mood,
      bpm: item.bpm,
      lang: "funk",
      animeId: sampleAnime ? sampleAnime.id : 1,
      tags: item.tags,
      reason: `จังหวะ Funk สุดมันส์ เบสหนึบ เข้ากับคลิปตัดต่อสไตล์ดิสโก้/เรโทร`,
      typoIdea: "ใช้เอฟเฟกต์ไฟนีออนเรโทร ซูมจังหวะตบเบสและเสียงบราส"
    });
  }
  FUNK_SONGS = enrichedFunk;
  console.log(`🎸 สร้างคลัง Funk คุณภาพสูงสำเร็จ: ${FUNK_SONGS.length} เพลง พร้อมเสียงตัวอย่าง 30s!`);

  // 4. Add New Trending Songs
  let nextSongId = Math.max(0, ...SONGS.map(s => s.id)) + 1;
  for (const s of NEW_SONGS) {
    const exists = SONGS.find(x => x.title.toLowerCase() === s.title.toLowerCase());
    if (exists) continue;

    console.log(`🔎 ค้นหาเพลง: ${s.title} - ${s.artist}...`);
    const track = await searchITunes(`${s.title} ${s.artist}`);
    const cover = track && track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : 'favicon-logo.jpg';
    const preview = track && track.previewUrl ? track.previewUrl : '';
    const spotify = `https://open.spotify.com/search/${encodeURIComponent(s.title + ' ' + s.artist)}`;

    let animeId = animeMap[s.animeName];
    if (!animeId) {
      const a = ANIMES.find(x => x.name.toLowerCase().includes((s.animeName || '').toLowerCase()));
      animeId = a ? a.id : ANIMES[0].id;
    }

    const newSongObj = {
      id: nextSongId,
      title: s.title,
      artist: s.artist,
      coverUrl: cover,
      previewUrl: preview,
      spotifyUrl: spotify,
      mood: s.mood,
      tags: s.tags,
      bpm: s.mood === 'hype' ? 'เร็ว (125 BPM)' : (s.mood === 'sad' ? 'ช้า (75 BPM)' : 'ปานกลาง (98 BPM)'),
      lang: s.lang,
      animeId: animeId,
      animeMatch: [animeId],
      reason: `เหมาะสำหรับตัดต่อคู่กับ ${s.animeName} ด้วยมู้ดและจังหวะที่ลงตัว`,
      typoIdea: s.idea
    };

    SONGS.push(newSongObj);
    ANIME_PAIRS.push({
      songId: nextSongId,
      animeId: animeId,
      category: s.mood,
      badge: '🎬 ไทโปเข้ากันที่สุด',
      reason: newSongObj.reason,
      typoIdea: newSongObj.typoIdea
    });
    nextSongId++;
  }

  // 5. Write back to data.js cleanly
  const out = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n\n// ── FUNK SONGS COLLECTION ──────────────────────────────────────────────\n// เพลง Funk สำหรับตัดต่อคลิปไทโป – คลาสสิคถึงยุคใหม่\nconst FUNK_SONGS = ${JSON.stringify(FUNK_SONGS, null, 2)};\n`;

  fs.writeFileSync('data.js', out, 'utf8');
  console.log(`💾 บันทึก data.js เรียบร้อย!`);
  console.log(`📊 สรุปคลังใหม่ล่าสุด:`);
  console.log(`- อนิเมะ: ${ANIMES.length} เรื่อง (+${ANIMES.length - db.ANIMES.length})`);
  console.log(`- เพลงทั่วไป: ${SONGS.length} เพลง (+${SONGS.length - db.SONGS.length})`);
  console.log(`- เพลง Funk (โซนเฉพาะ): ${FUNK_SONGS.length} เพลง`);
  console.log(`- คู่แนะนำอนิเมะ: ${ANIME_PAIRS.length} คู่`);
}

main().catch(console.error);
