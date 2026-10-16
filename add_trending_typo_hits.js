const fs = require('fs');
const https = require('https');

function loadDB() {
  const code = fs.readFileSync('data.js', 'utf8');
  const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
  return fn();
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function searchITunes(term, country = 'th') {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&country=${country}&limit=5`;
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
    genre: track.primaryGenreName || 'Pop'
  };
}

const NEW_CANDIDATES = [
  { term: "รักแท้ NuNew", country: "th", mood: "love", lang: "th", anime: "Your Name", bpm: "ช้า (75 BPM)", tags: ["รักแท้", "หวาน", "โรแมนติก"], reason: "เพลงรักอุ่นละมุนที่เนื้อหาและเสียงร้องถ่ายทอดความรักแท้ไร้เงื่อนไข", typoIdea: "ฟอนต์พริ้วไหวสีทองอร่าม ค่อยๆ ปรากฏขึ้นพร้อมละอองแสง" },
  { term: "วาดไว้ BOWKYLION", country: "th", mood: "sad", lang: "th", anime: "A Silent Voice", bpm: "ช้า (72 BPM)", tags: ["วาดไว้", "คิดถึง", "น้ำตา"], reason: "เพลงบัลลาดสุดสะเทือนใจที่บอกเล่าภาพวาดในอดีตที่ไม่มีวันกลับมา", typoIdea: "เส้นพู่กันวาดตัวอักษรทีละคำ คล้ายภาพวาดสีน้ำ" },
  { term: "ถ้าเราเจอกันอีก Tilly Birds", country: "th", mood: "sad", lang: "th", anime: "5 Centimeters per Second", bpm: "ช้า (78 BPM)", tags: ["จากลา", "ความคิดถึง", "อดีต"], reason: "คำบอกลาที่อบอวลไปด้วยความหวังว่าจะได้พบกันอีกในสักที่", typoIdea: "ตัวอักษรค่อยๆ เลือนหายไปในหมอกควันสีน้ำเงินคราม" },
  { term: "สายตาหลอกกันไม่ได้ INK WARUNTORN", country: "th", mood: "love", lang: "th", anime: "Kaguya-sama", bpm: "ปานกลาง (105 BPM)", tags: ["สายตา", "แอบมอง", "ซินธ์ป๊อป"], reason: "ซินธ์ป๊อปน่ารักสดใสที่พูดถึงสายตาที่ซ่อนความรู้สึกไว้ไม่มิด", typoIdea: "เอฟเฟกต์แสงสะท้อนระยิบระยับในดวงตาเปล่งประกายรอบตัวหนังสือ" },
  { term: "แฟนเก่าคนโปรด SLAPKISS", country: "th", mood: "sad", lang: "th", anime: "Toradora!", bpm: "ปานกลาง (98 BPM)", tags: ["แฟนเก่า", "คิดถึง", "อกหัก"], reason: "เพลงฮิตที่พูดถึงคนในอดีตที่ยังคงครองตำแหน่งคนโปรดในใจเสมอ", typoIdea: "ข้อความแชตเก่าๆ เด้งขึ้นมาพร้อมตัวอักษรพิมพ์ดีด" },
  { term: "เอาปากกามาวง Bell Warisara", country: "th", mood: "love", lang: "th", anime: "Spy x Family", bpm: "ปานกลาง (100 BPM)", tags: ["ปากกา", "จีบ", "น่ารัก"], reason: "เพลงกวนๆ น่ารักที่ท้าให้เอาปากกามาวงตรงที่ชอบเธอ", typoIdea: "วงกลมสีแดงวาดล้อมรอบคำสำคัญพร้อมหัวใจเด้งดึ๋ง" },
  { term: "Until I Found You Stephen Sanchez", country: "us", mood: "love", lang: "en", anime: "Horimiya", bpm: "ช้า (76 BPM)", tags: ["vintage", "romance", "guitar"], reason: "50s retro doo-wop romantic masterpiece with sweet vintage guitars", typoIdea: "Vintage cream cursive typography floating over vinyl grain textures" },
  { term: "golden hour JVKE", country: "us", mood: "love", lang: "en", anime: "Your Name", bpm: "ปานกลาง (94 BPM)", tags: ["piano", "sunset", "breathtaking"], reason: "Cascading piano arpeggios that match breathtaking golden sunsets", typoIdea: "Golden solar flares blooming behind illuminated white letters" },
  { term: "Bling-Bang-Bang-Born Creepy Nuts", country: "jp", mood: "hype", lang: "jp", anime: "Mashle", bpm: "เร็ว (155 BPM)", tags: ["jersey club", "viral", "energy"], reason: "Addictive Jersey club beats driving chaotic dynamic kinetic typography", typoIdea: "Bouncy typography jumping rapidly left-right to the bouncy beat" },
  { term: "Ao no Sumika Tatsuya Kitani", country: "jp", mood: "hype", lang: "jp", anime: "Jujutsu Kaisen", bpm: "เร็ว (142 BPM)", tags: ["gojo", "summer", "youth"], reason: "Nostalgic blue summer sky guitar rock exploring youth and friendship", typoIdea: "Sky-blue text slashing across azure blue lens flares" },
  { term: "Abyss YUNGBLUD", country: "jp", mood: "hype", lang: "en", anime: "Kaiju No. 8", bpm: "เร็ว (140 BPM)", tags: ["kaiju", "punk", "monster"], reason: "Gritty dark electronic rock anthem perfect for monstrous transformations", typoIdea: "Cracked stone lettering glowing toxic neon green" },
  { term: "Kura Kura Ado", country: "jp", mood: "hype", lang: "jp", anime: "Spy x Family", bpm: "เร็ว (145 BPM)", tags: ["ado", "jazz", "spyxfamily"], reason: "Dazzling electro-swing big band tune bursting with stylish charisma", typoIdea: "Spinning comic book bubble typography bursting with confetti" }
];

const NEW_ANIMES = [
  {
    name: "Kaiju No. 8",
    nameTH: "ไคจูหมายเลข 8",
    genres: ["แอ็กชัน", "ไซไฟ", "สัตว์ประหลาด", "โชเน็น"],
    mood: "hype",
    bestPairs: ["Abyss", "KICK BACK", "SPECIALZ"],
    synopsis: "คาฟก้า ฮิบิโนะ ชายวัย 32 ปีที่จับพลัดจับผลูกลายร่างเป็นไคจูทรงพลัง และต้องต่อสู้เพื่อปกป้องผู้คนในหน่วยป้องกันไคจู",
    coverUrl: "https://media.kitsu.app/anime/poster_images/46474/original.jpg"
  },
  {
    name: "Mashle: Magic and Muscles",
    nameTH: "ศึกโลกเวทมนตร์คนพลังกล้าม",
    genres: ["คอมเมดี้", "แฟนตาซี", "เวทมนตร์", "แอ็กชัน"],
    mood: "hype",
    bestPairs: ["Bling-Bang-Bang-Born", "SPECIALZ"],
    synopsis: "มัช เบิร์นเดด เด็กหนุ่มไร้เวทมนตร์ที่ใช้พลังกล้ามเนื้อล้วนๆ เข้าต่อกรกับเหล่าผู้ใช้เวทมนตร์ในโรงเรียนเวทมนตร์ชั้นนำ",
    coverUrl: "https://media.kitsu.app/anime/poster_images/46123/original.jpg"
  },
  {
    name: "Wind Breaker",
    nameTH: "วินด์เบรกเกอร์ นักเลงเพื่อพิทักษ์",
    genres: ["แอ็กชัน", "นักเลง", "มิตรภาพ", "โชเน็น"],
    mood: "hype",
    bestPairs: ["SPECIALZ", "Ao no Sumika"],
    synopsis: "ฮารุกะ ซากุระ เด็กหนุ่มผู้มุ่งสู่จุดสูงสุดของโรงเรียนมัธยมปลายฟูริน ซึ่งขึ้นชื่อเรื่องการวิวาท แต่แท้จริงคือผู้ปกป้องเมือง",
    coverUrl: "https://media.kitsu.app/anime/poster_images/47262/original.jpg"
  },
  {
    name: "Delicious in Dungeon",
    nameTH: "สูตรลับเมนูเกือดานเจี้ยน",
    genres: ["แฟนตาซี", "ทำอาหาร", "ผจญภัย", "คอมเมดี้"],
    mood: "chill",
    bestPairs: ["Flowers", "คำตอบ"],
    synopsis: "ไลออสและพวกพ้องออกเดินทางลึกเข้าไปในดันเจี้ยนเพื่อช่วยน้องสาว โดยต้องกินมอนสเตอร์เป็นอาหารประทังชีวิต",
    coverUrl: "https://media.kitsu.app/anime/poster_images/46277/original.jpg"
  }
];

async function run() {
  const { ANIMES, SONGS, ANIME_PAIRS } = loadDB();
  const existingSongKeys = new Set(SONGS.map(s => `${s.title.toLowerCase().trim()}_${s.artist.toLowerCase().trim()}`));
  const existingAnimeNames = new Set(ANIMES.map(a => a.name.toLowerCase().trim()));

  let addedAnimes = 0;
  for (const an of NEW_ANIMES) {
    if (!existingAnimeNames.has(an.name.toLowerCase().trim())) {
      const newId = ANIMES.length > 0 ? Math.max(...ANIMES.map(a => a.id || 0)) + 1 : 1;
      ANIMES.push({
        id: newId,
        name: an.name,
        nameTH: an.nameTH,
        genre: an.genres.join(', '),
        mood: an.mood,
        desc: an.synopsis,
        coverUrl: an.coverUrl
      });
      existingAnimeNames.add(an.name.toLowerCase().trim());
      addedAnimes++;
      console.log(`🌸 เพิ่มอนิเมะใหม่: ${an.name} (${an.nameTH})`);
    }
  }

  let addedSongs = 0;
  let nextId = SONGS.length > 0 ? Math.max(...SONGS.map(s => s.id || 0)) + 1 : 1;

  for (const cand of NEW_CANDIDATES) {
    const it = await searchITunes(cand.term, cand.country);
    if (!it) {
      console.log(`⚠️ ค้นหาไม่พบ: ${cand.term}`);
      continue;
    }
    const key = `${it.title.toLowerCase().trim()}_${it.artist.toLowerCase().trim()}`;
    if (existingSongKeys.has(key)) {
      console.log(`⏩ มีเพลงนี้แล้ว: "${it.title}" - ${it.artist}`);
      continue;
    }

    const newSong = {
      id: nextId++,
      title: it.title,
      artist: it.artist,
      lang: cand.lang,
      mood: cand.mood,
      bpm: cand.bpm,
      tags: cand.tags,
      previewUrl: it.previewUrl,
      coverUrl: it.coverUrl,
      spotifyUrl: it.spotifyUrl,
      matchingAnime: cand.anime,
      reason: cand.reason,
      typoIdea: cand.typoIdea
    };

    SONGS.push(newSong);
    existingSongKeys.add(key);
    addedSongs++;
    console.log(`✅ [${newSong.id}] เพิ่มเพลงสำเร็จ: "${newSong.title}" โดย ${newSong.artist} (Anime: ${cand.anime})`);

    // Match pair
    ANIME_PAIRS.push({
      id: ANIME_PAIRS.length + 1,
      anime: cand.anime,
      songTitle: newSong.title,
      songArtist: newSong.artist,
      mood: cand.mood,
      bpm: cand.bpm,
      reason: cand.reason,
      typoIdea: cand.typoIdea,
      previewUrl: newSong.previewUrl,
      coverUrl: newSong.coverUrl
    });
  }

  const output = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', output, 'utf8');
  console.log(`\n🎉 สรุปการอัปเดต: เพิ่ม ${addedAnimes} อนิเมะ | เพิ่ม ${addedSongs} เพลง`);
  console.log(`📊 ยอดรวมในระบบ: อนิเมะ ${ANIMES.length} เรื่อง | เพลงทั้งหมด ${SONGS.length} เพลง | คู่แนะนำ ${ANIME_PAIRS.length} คู่`);
}

run();
