const fs = require('fs');
const https = require('https');

const code = fs.readFileSync('data.js', 'utf8');
const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
const { ANIMES, SONGS, ANIME_PAIRS } = fn();

const existingSongKeys = new Set(SONGS.map(s => `${s.title.toLowerCase().trim()}_${s.artist.toLowerCase().trim()}`));
const existingTitles = new Set(SONGS.map(s => s.title.toLowerCase().trim()));

const CANDIDATES = [
  // Thai Hits
  { term: "พิง นนท์ ธนนท์", mood: "love", lang: "th", anime: "Your Name", bpm: "ช้า (70 BPM)", tags: ["พิง", "อบอุ่น", "รัก"], reason: "เพลงบัลลาดสุดซึ้งที่พร้อมจะคอยเป็นที่พักพิงให้หัวใจ", typoIdea: "ฟอนต์มินิมอลสีขาวนวล ค่อยๆ ลอยเข้ามารวมกันที่กึ่งกลาง" },
  { term: "โต๊ะริม นนท์ ธนนท์", mood: "love", lang: "th", anime: "Kaguya-sama", bpm: "ปานกลาง (88 BPM)", tags: ["โต๊ะริม", "จีบ", "เขิน"], reason: "จังหวะน่ารักสดใสที่มองใครบางคนจากโต๊ะริมจนใจละลาย", typoIdea: "ฟอนต์สีชมพูพาสเทลกระโดดดึ๋งๆ ตามจังหวะเบส" },
  { term: "ไม่เปลี่ยนใจ PURPEECH", mood: "chill", lang: "th", anime: "Skip and Loafer", bpm: "ปานกลาง (95 BPM)", tags: ["ชิลล์", "อินดี้", "สบาย"], reason: "เมโลดี้อินดี้ป๊อปฟังสบาย เหมาะกับซีนเพื่อนและความผูกพัน", typoIdea: "ตัวอักษรลายมือพริ้วไหวคล้ายลมพัดใบไม้ปลิว" },
  { term: "ต่อจากนี้เพลงรักทุกเพลงจะเป็นของเธอเท่านั้น No One Else", mood: "love", lang: "th", anime: "Horimiya", bpm: "ปานกลาง (90 BPM)", tags: ["คลั่งรัก", "หวาน", "แต่งงาน"], reason: "เพลงชาติของคนคลั่งรักที่มองเห็นแต่เธอคนเดียว", typoIdea: "แสงสะท้อน Prism หลากสีลอดผ่านตัวหนังสือที่สว่างวาบ" },
  { term: "แค่มีเธอไปเดินเตะคลื่นทะเลด้วยกัน No One Else", mood: "chill", lang: "th", anime: "Weathering with You", bpm: "ปานกลาง (92 BPM)", tags: ["ทะเล", "คลื่น", "ความสุข"], reason: "ฟีลลิ่งเดินเล่นริมหาดทรายยามพระอาทิตย์ตกดิน", typoIdea: "คลื่นน้ำซัดผ่านตัวอักษรแล้วจางหายไป" },
  { term: "ลานบิน Safeplanet", mood: "chill", lang: "th", anime: "A Silent Voice", bpm: "ปานกลาง (98 BPM)", tags: ["safeplanet", "บิน", "ความฝัน"], reason: "กีตาร์โปร่งและริฟฟ์อินดี้อันเป็นเอกลักษณ์ของ Safeplanet", typoIdea: "เส้นสายแสงสีพาสเทลวิ่งคู่ไปกับชื่อเพลง" },
  { term: "ห้องกระจก Safeplanet", mood: "chill", lang: "th", anime: "Suzume", bpm: "ปานกลาง (100 BPM)", tags: ["กระจก", "สะท้อน", "อินดี้"], reason: "บรรยากาศล่องลอยเหมือนอยู่ในมิติกระจกสะท้อนเงา", typoIdea: "เอฟเฟกต์กระจกสะท้อน Mirror ซ้อนเงาสามมิติ" },
  { term: "คำตอบ Safeplanet", mood: "chill", lang: "th", anime: "Weathering with You", bpm: "ปานกลาง (94 BPM)", tags: ["คำตอบ", "ตามหา", "สบาย"], reason: "ดนตรีฟังสบายที่สื่อถึงการค้นพบคำตอบของชีวิตและหัวใจ", typoIdea: "ตัวอักษรค่อยๆ ชัดขึ้นจากการเบลอละมุนตา" },
  { term: "นะหน้าทอง โจอี้ ภูวศิษฐ์", mood: "love", lang: "th", anime: "Kimetsu no Yaiba", bpm: "ปานกลาง (96 BPM)", tags: ["นะหน้าทอง", "มนต์รัก", "ไทย"], reason: "มนต์เสน่ห์ความรักสไตล์ลูกทุ่งป๊อปโมเดิร์นดนตรีไทยผสมสากล", typoIdea: "ประกายทองคำระยิบระยับล้อมรอบฟอนต์สีทองเข้ม" },
  { term: "ดวงเดือน โจอี้ ภูวศิษฐ์", mood: "sad", lang: "th", anime: "Frieren: Beyond Journey's End", bpm: "ช้า (72 BPM)", tags: ["ดวงจันทร์", "คิดถึงบ้าน", "เหงา"], reason: "การมองดวงจันทร์ดวงเดียวกันเพื่อส่งความคิดถึงกลับไปหาคนไกล", typoIdea: "แสงจันทร์สีเงินสาดส่องลงบนตัวอักษรบนท้องฟ้าราตรี" },
  { term: "ถ้าเธอรักฉันจริง Three Man Down", mood: "sad", lang: "th", anime: "Chainsaw Man", bpm: "เร็ว (130 BPM)", tags: ["ร็อก", "อกหัก", "ตัดพ้อ"], reason: "ดนตรีอัลเทอร์เนทีฟร็อกบิ้วอารมณ์ตัดพ้อสุดทรงพลัง", typoIdea: "ตัวอักษรสีแดงนีออนกระพริบตามจังหวะริฟฟ์กีตาร์" },
  { term: "เดาไม่เก่ง Three Man Down", mood: "chill", lang: "th", anime: "Kaguya-sama", bpm: "ปานกลาง (108 BPM)", tags: ["เดา", "น่ารัก", "กวนๆ"], reason: "ความในใจของคนที่ดูไม่ออกว่าเธอคิดยังไงกันแน่", typoIdea: "เครื่องหมายคำถาม (?) ปรากฏเด้งรอบๆ ตัวอักษรอย่างน่ารัก" },
  { term: "ข้างกัน Three Man Down", mood: "love", lang: "th", anime: "Horimiya", bpm: "ช้า (75 BPM)", tags: ["ข้างกัน", "อบอุ่น", "คืนเหงา"], reason: "ความสุขเรียบง่ายเพียงแค่มีใครสักคนนั่งอยู่ข้างๆ", typoIdea: "ตัวอักษรสองฝั่งเลื่อนเข้ามาประกบคู่กันพอดี" },
  { term: "ฝนตกไหม Three Man Down", mood: "sad", lang: "th", anime: "Weathering with You", bpm: "ช้า (70 BPM)", tags: ["ฝนตก", "คิดถึง", "เหงา"], reason: "เสียงสายฝนที่ทำให้ความคิดถึงทำงานหนักกว่าปกติ", typoIdea: "หยดน้ำฝนไหลเกาะบนตัวหนังสือสีขาวซีด" },
  { term: "คิด(แต่ไม่)ถึง Tilly Birds", mood: "sad", lang: "th", anime: "5 Centimeters per Second", bpm: "ช้า (74 BPM)", tags: ["คิดถึง", "ย้อนเวลา", "อดีต"], reason: "เพลงฮิตตลอดกาลที่คิดถึงแค่ไหนก็ส่งไปไม่ถึงอีกแล้ว", typoIdea: "คำว่า (แต่ไม่) กะพริบจางๆ สลับกับคำว่า คิดถึง" },
  { term: "เพื่อนเล่น ไม่เล่นเพื่อน Tilly Birds", mood: "love", lang: "th", anime: "Toradora!", bpm: "ปานกลาง (102 BPM)", tags: ["เฟรนด์โซน", "เพื่อน", "สนุก"], reason: "การแอบรักเพื่อนสนิทที่ไม่อยากเป็นแค่เพื่อนอีกต่อไป", typoIdea: "ฟอนต์สีสันจัดจ้าน เด้งสลับไปมาระหว่างสองขั้วอารมณ์" },

  // English Hits
  { term: "Good Luck, Babe! Chappell Roan", mood: "hype", lang: "en", anime: "Oshi no Ko", bpm: "เร็ว (118 BPM)", tags: ["synthpop", "retro", "anthem"], reason: "Infectious 80s synth-pop anthem about regretting what could have been", typoIdea: "Vintage 80s neon chrome lettering glowing vividly against dark backgrounds" },
  { term: "Please Please Please Sabrina Carpenter", mood: "chill", lang: "en", anime: "Kaguya-sama", bpm: "ปานกลาง (107 BPM)", tags: ["disco", "pop", "playful"], reason: "Acoustic disco earworm full of charm and witty self-deprecation", typoIdea: "Retro magazine headline fonts sliding in with subtle bounce effects" },
  { term: "Taste Sabrina Carpenter", mood: "hype", lang: "en", anime: "Chainsaw Man", bpm: "เร็ว (113 BPM)", tags: ["rock-pop", "sassy", "catchy"], reason: "Sassy guitar riffs that inject instant adrenaline into action cuts", typoIdea: "Edgy stencil lettering with spray paint textures on beat drops" },
  { term: "Too Sweet Hozier", mood: "chill", lang: "en", anime: "Hell's Paradise", bpm: "ปานกลาง (117 BPM)", tags: ["blues", "bass", "whiskey"], reason: "Heavy dark blues-rock bassline tailored for cool bad-attitude protagonists", typoIdea: "Distressed copper-metallic fonts moving to the heavy rhythm bass" },
  { term: "Beautiful Things Benson Boone", mood: "hype", lang: "en", anime: "Jujutsu Kaisen", bpm: "เร็ว (105 BPM)", tags: ["explosive", "vocal", "screaming"], reason: "A quiet folk opening exploding into a stadium-shaking rock chorus", typoIdea: "Whisper-thin text violently magnifying into bold glowing fractures" },
  { term: "Lose Control Teddy Swims", mood: "sad", lang: "en", anime: "Tokyo Ghoul", bpm: "ช้า (79 BPM)", tags: ["soul", "gospel", "raw"], reason: "Raw raspy soul vocals showcasing unbearable heartbreak and despair", typoIdea: "Smoky ember letters disintegrating into swirling ash" },
  { term: "Cruel Summer Taylor Swift", mood: "hype", lang: "en", anime: "Attack on Titan", bpm: "เร็ว (170 BPM)", tags: ["bridge", "synthpop", "fever"], reason: "The legendary bridge scream matched with desperate climactic battles", typoIdea: "Rapid kinetic typography exploding precisely on the bridge drop" },
  { term: "Flowers Miley Cyrus", mood: "hype", lang: "en", anime: "Delicious in Dungeon", bpm: "เร็ว (118 BPM)", tags: ["self-love", "disco", "empowerment"], reason: "Uplifting self-love anthem for solo journeys and recovery arcs", typoIdea: "Golden blooming botanical typography with smooth shimmer animations" },
  { term: "Vampire Olivia Rodrigo", mood: "sad", lang: "en", anime: "Death Note", bpm: "เร็ว (138 BPM)", tags: ["piano", "punk", "fury"], reason: "Creepy piano ballad turning into a roaring pop-punk breakdown", typoIdea: "Blood-crimson typography sharp as fangs with glitch distortions" },

  // Japanese Hits
  { term: "SPECIALZ King Gnu", mood: "hype", lang: "jp", anime: "Jujutsu Kaisen", bpm: "เร็ว (130 BPM)", tags: ["shibuya", "jjk", "curse"], reason: "Iconic Shibuya Incident opening that exudes menacing hype energy", typoIdea: "Distorted brutalist red-and-black typography shaking violently" },
  { term: "KICK BACK Kenshi Yonezu", mood: "hype", lang: "jp", anime: "Chainsaw Man", bpm: "เร็ว (150 BPM)", tags: ["chainsaw", "chaos", "punk"], reason: "Chaotic punk-rock bassline from the wild opening of Chainsaw Man", typoIdea: "Sawtooth serrated letters tearing through the screen" },
  { term: "New Genesis Ado", mood: "hype", lang: "jp", anime: "One Piece", bpm: "เร็ว (128 BPM)", tags: ["onepiece", "uta", "diva"], reason: "Uta's show-stopping vocal performance from One Piece Film Red", typoIdea: "Holographic multi-color luminous lettering radiating music waves" },
  { term: "Chikyugi Spinning Globe Kenshi Yonezu", mood: "chill", lang: "jp", anime: "The Boy and the Heron", bpm: "ช้า (76 BPM)", tags: ["ghibli", "nostalgia", "piano"], reason: "Gentle philosophical masterpiece celebrating life and youth", typoIdea: "Soft watercolor strokes forming quiet comforting words" },
  { term: "Kaibutsu Monster YOASOBI", mood: "hype", lang: "jp", anime: "Beastars", bpm: "เร็ว (130 BPM)", tags: ["yoasobi", "beast", "electro"], reason: "Driving electro-pop thrill ride exploring inner duality", typoIdea: "Sharp claw-slash typography slicing across dark neon scenes" },
  { term: "Gunjou Blue YOASOBI", mood: "hype", lang: "jp", anime: "Blue Period", bpm: "เร็ว (135 BPM)", tags: ["art", "passion", "choir"], reason: "Massive gospel-choir climax praising passionate artistic creation", typoIdea: "Deep ultramarine blue paintbrush typography splashing boldly" },
  { term: "Yusha The Brave YOASOBI", mood: "hype", lang: "jp", anime: "Frieren: Beyond Journey's End", bpm: "เร็ว (140 BPM)", tags: ["hero", "frieren", "adventure"], reason: "Electrifying tribute to Himmel the Hero and timeless adventure", typoIdea: "Gleaming silver sword typography slicing on beat drops" }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function searchITunes(term, lang) {
  const country = lang === 'th' ? 'th' : (lang === 'jp' ? 'jp' : 'us');
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5&country=${country}`;
  const data = await fetchJson(url);
  if (!data || !data.results || data.results.length === 0) return null;

  for (const track of data.results) {
    if (track.trackExplicitness === 'explicit') continue;
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

async function start() {
  let nextSongId = Math.max(0, ...SONGS.map(s => s.id)) + 1;
  let added = 0;

  for (const item of CANDIDATES) {
    const track = await searchITunes(item.term, item.lang);
    if (!track) {
      console.log(`⚠️ Not found: ${item.term}`);
      continue;
    }

    const key = `${track.title.toLowerCase().trim()}_${track.artist.toLowerCase().trim()}`;
    if (existingSongKeys.has(key) || existingTitles.has(track.title.toLowerCase().trim())) {
      console.log(`⏩ Already exists: ${track.title} by ${track.artist}`);
      continue;
    }

    let matchedAnime = ANIMES.find(a => a.name.toLowerCase().includes(item.anime.toLowerCase()) || (a.nameTH && a.nameTH.includes(item.anime)));
    if (!matchedAnime) {
      matchedAnime = ANIMES[Math.floor(Math.random() * ANIMES.length)];
    }

    const newSong = {
      id: nextSongId++,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      previewUrl: track.previewUrl,
      spotifyUrl: track.spotifyUrl,
      mood: item.mood,
      tags: item.tags,
      bpm: item.bpm,
      lang: item.lang,
      animeId: matchedAnime.id,
      animeMatch: [matchedAnime.id],
      reason: item.reason,
      typoIdea: item.typoIdea
    };

    SONGS.push(newSong);
    ANIME_PAIRS.push({
      songId: newSong.id,
      animeId: matchedAnime.id,
      category: item.mood,
      badge: item.mood === 'hype' ? '🔥 ท่อนฮิตสายตัดต่อ' : (item.mood === 'sad' ? '💔 อารมณ์ซึ้งกินใจ' : '🎬 ตัดต่อไทโปสุดลงตัว'),
      reason: item.reason,
      typoIdea: item.typoIdea
    });

    existingSongKeys.add(key);
    existingTitles.add(track.title.toLowerCase().trim());
    added++;
    console.log(`✅ [${newSong.id}] Added: "${track.title}" by ${track.artist} (Anime: ${matchedAnime.name})`);
  }

  console.log(`\n🎉 Successfully added ${added} new unique songs!`);
  console.log(`Updated totals: ${ANIMES.length} animes, ${SONGS.length} songs, ${ANIME_PAIRS.length} pairs`);

  const out = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', out, 'utf8');
  console.log('💾 data.js updated successfully!');
}

start();
