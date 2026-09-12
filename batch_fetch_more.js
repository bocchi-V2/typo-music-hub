const fs = require('fs');
const https = require('https');

// Read current data
const code = fs.readFileSync('data.js', 'utf8');
const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
const { ANIMES, SONGS, ANIME_PAIRS } = fn();

console.log(`Current DB: ${ANIMES.length} animes, ${SONGS.length} songs, ${ANIME_PAIRS.length} pairs`);

const existingAnimeNames = new Set(ANIMES.map(a => a.name.toLowerCase().trim()));
const existingSongKeys = new Set(SONGS.map(s => `${s.title.toLowerCase().trim()}_${s.artist.toLowerCase().trim()}`));

// 30+ top tier, 100% clean SFW popular anime
const CANDIDATE_ANIMES = [
  {
    name: "Kaiju No. 8",
    nameTH: "ไคจูหมายเลข 8",
    genre: ["แอคชั่น", "ไซไฟ", "สัตว์ประหลาด"],
    mood: "hype",
    coverUrl: "https://media.kitsu.app/anime/46487/poster_image/medium-650a300227181f08e4585c54c30c8dc2.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/52588.jpg"
  },
  {
    name: "Dandadan",
    nameTH: "ดันดาดัน",
    genre: ["แอคชั่น", "คอมเมดี้", "เอเลี่ยน", "ผี"],
    mood: "hype",
    coverUrl: "https://media.kitsu.app/anime/48197/poster_image/medium-9908cf906cfa024a1bfa82117bf20980.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/57334.jpg"
  },
  {
    name: "Wind Breaker",
    nameTH: "วินด์เบรกเกอร์ นักเลงเพื่อพิทักษ์",
    genre: ["แอคชั่น", "นักเลง", "โรงเรียน"],
    mood: "hype",
    coverUrl: "https://media.kitsu.app/anime/47372/poster_image/medium-95a9ff738012bb9b7cbe326eeffbfd73.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/54900.jpg"
  },
  {
    name: "Delicious in Dungeon",
    nameTH: "สูตรลับดันเจี้ยน",
    genre: ["แฟนตาซี", "ทำอาหาร", "ผจญภัย"],
    mood: "chill",
    coverUrl: "https://media.kitsu.app/anime/46294/poster_image/medium-f6ef7d373111b15743bcf225026dfa3c.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/52701.jpg"
  },
  {
    name: "Mashle: Magic and Muscles",
    nameTH: "ศึกโลกเวทมนตร์คนพลังกล้าม",
    genre: ["แอคชั่น", "คอมเมดี้", "เวทมนตร์"],
    mood: "hype",
    coverUrl: "https://media.kitsu.app/anime/46229/poster_image/medium-94f481beba30960d37803a6da9b8f2c0.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/52211.jpg"
  },
  {
    name: "The Apothecary Diaries",
    nameTH: "สืบคดีปริศนาหมอยาตำรับโคมแดง",
    genre: ["สืบสวน", "ดราม่า", "ประวัติศาสตร์"],
    mood: "chill",
    coverUrl: "https://media.kitsu.app/anime/47035/poster_image/medium-72bf62fc238e8ae9fcb90c0b70d50711.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/54492.jpg"
  },
  {
    name: "Shangri-La Frontier",
    nameTH: "เมื่อนักล่าเกมขยะท้าสู้ในเกมเทพ",
    genre: ["แอคชั่น", "เกม", "แฟนตาซี"],
    mood: "hype",
    coverUrl: "https://media.kitsu.app/anime/46241/poster_image/medium-4f107f905c1283d58ef86b9767fc36ad.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/52347.jpg"
  },
  {
    name: "The Dangers in My Heart",
    nameTH: "เธอผู้อันตรายต่อหัวใจ",
    genre: ["โรแมนติก", "โรงเรียน", "คอมเมดี้"],
    mood: "love",
    coverUrl: "https://media.kitsu.app/anime/46369/poster_image/medium-5cb52467ebef35967ee352f205eb384c.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/52578.jpg"
  },
  {
    name: "Skip and Loafer",
    nameTH: "จังหวะวัยรุ่น ว้าวุ่นหัวใจ",
    genre: ["สไลซ์ออฟไลฟ์", "โรแมนติก", "โรงเรียน"],
    mood: "chill",
    coverUrl: "https://media.kitsu.app/anime/45517/poster_image/medium-55342a19ef9eb98db5dfd17c9b83b38c.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/50416.jpg"
  },
  {
    name: "Buddy Daddies",
    nameTH: "บัดดี้ แดดดี้ส์",
    genre: ["แอคชั่น", "คอมเมดี้", "ครอบครัว"],
    mood: "love",
    coverUrl: "https://media.kitsu.app/anime/46577/poster_image/medium-8ef6409549f257f8623b0dfb2f293933.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/53411.jpg"
  },
  {
    name: "Hell's Paradise",
    nameTH: "สุขาวดีอเวจี",
    genre: ["แอคชั่น", "นินจา", "ดาร์กแฟนตาซี"],
    mood: "hype",
    coverUrl: "https://media.kitsu.app/anime/44240/poster_image/medium-811c757c2c31e9c52fe1c0282b9ceb21.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/46569.jpg"
  },
  {
    name: "Zom 100: Bucket List of the Dead",
    nameTH: "ซอม 100: 100 สิ่งที่อยากทำก่อนจะกลายเป็นซอมบี้",
    genre: ["แอคชั่น", "คอมเมดี้", "ซอมบี้"],
    mood: "hype",
    coverUrl: "https://media.kitsu.app/anime/46857/poster_image/medium-4f810148ad4a0d922a901bf9e62fe46d.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/54112.jpg"
  },
  {
    name: "Bocchi the Rock!",
    nameTH: "บ็อจจิเดอะร็อก!",
    genre: ["ดนตรี", "คอมเมดี้", "สไลซ์ออฟไลฟ์"],
    mood: "hype",
    coverUrl: "https://media.kitsu.app/anime/44501/poster_image/medium-fba93b3f2f8194adca58a1ee6d6d84a7.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/47917.jpg"
  },
  {
    name: "Blue Lock: Episode Nagi",
    nameTH: "ขังดวลแข้ง เอพิโซด นางิ",
    genre: ["กีฬา", "ฟุตบอล", "ดราม่า"],
    mood: "hype",
    coverUrl: "https://media.kitsu.app/anime/47099/poster_image/medium-7c87c0a9616e4be0bbda9ca5c65f97bc.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/54865.jpg"
  },
  {
    name: "Haikyu!! The Dumpster Battle",
    nameTH: "ไฮคิว!! คู่ตบฟ้าประทาน ตอน ศึกกองขยะ",
    genre: ["กีฬา", "วอลเลย์บอล", "มิตรภาพ"],
    mood: "hype",
    coverUrl: "https://media.kitsu.app/anime/46485/poster_image/medium-fc2424cf37ffce3b7ba88a5aa87b7a6e.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/52742.jpg"
  },
  {
    name: "Insomniacs After School",
    nameTH: "ค่ำคืนนี้มีเราสองคน",
    genre: ["โรแมนติก", "ดาราศาสตร์", "โรงเรียน"],
    mood: "love",
    coverUrl: "https://media.kitsu.app/anime/45598/poster_image/medium-c9bf66231c51a0a552fbce2d91bb3a20.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/50796.jpg"
  },
  {
    name: "Tengoku Daimakyo",
    nameTH: "ถ้ำสวรรค์แดนอเวจี",
    genre: ["ไซไฟ", "ผจญภัย", "ลึกลับ"],
    mood: "chill",
    coverUrl: "https://media.kitsu.app/anime/46603/poster_image/medium-c71c4c11b6099b25be248eb847326ea0.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/53393.jpg"
  },
  {
    name: "My Love Story with Yamada-kun at Lv999",
    nameTH: "รักสุดฟินเลเวล 999 กับยามาดะคุง",
    genre: ["โรแมนติก", "เกม", "คอมเมดี้"],
    mood: "love",
    coverUrl: "https://media.kitsu.app/anime/46571/poster_image/medium-ea8832a82d6fa830d9cbff53f56eb72f.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/53126.jpg"
  },
  {
    name: "Pluto",
    nameTH: "พลูโต",
    genre: ["ไซไฟ", "สืบสวน", "หุ่นยนต์"],
    mood: "sad",
    coverUrl: "https://media.kitsu.app/anime/13768/poster_image/medium-09d59265f212f0e0f3d790d56561f238.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/35637.jpg"
  },
  {
    name: "Frieren: Beyond Journey's End",
    nameTH: "คำอธิษฐานในวันที่จากลา",
    genre: ["แฟนตาซี", "ผจญภัย", "ดราม่า"],
    mood: "chill",
    coverUrl: "https://media.kitsu.app/anime/46474/poster_image/medium-01869e9442031da294c77ea41448b1aa.jpeg",
    coverFallback: "https://shikimori.one/system/animes/original/52991.jpg"
  }
];

// Add unique candidate animes
let nextAnimeId = Math.max(0, ...ANIMES.map(a => a.id)) + 1;
const addedAnimes = [];

for (const a of CANDIDATE_ANIMES) {
  if (!existingAnimeNames.has(a.name.toLowerCase().trim())) {
    const item = {
      id: nextAnimeId++,
      name: a.name,
      nameTH: a.nameTH,
      genre: a.genre,
      coverUrl: a.coverUrl,
      coverFallback: a.coverFallback || a.coverUrl,
      anifumeUrl: `https://anifume.com/?s=${encodeURIComponent(a.name)}`,
      mood: a.mood
    };
    ANIMES.push(item);
    existingAnimeNames.add(a.name.toLowerCase().trim());
    addedAnimes.push(item);
  }
}
console.log(`✅ Added ${addedAnimes.length} new clean animes.`);

// Candidates for trending clean songs
const SONG_SEARCHES = [
  // Thai Trending
  { term: "ซ่อนเธอไว้ในเพลง Three Man Down", mood: "sad", lang: "th", animeName: "Frieren", bpm: "ช้า (72 BPM)", tags: ["คิดถึง", "อดีต", "ซ่อน"], reason: "เมโลดี้ละมุนกับเรื่องราวความทรงจำที่ตราตรึง", typoIdea: "ใช้ฟอนต์บางโทนอบอุ่น เฟดตัวอักษรช้าๆ พร้อมแสงแดดยามเย็น" },
  { term: "รักแรก นนท์ ธนนท์", mood: "love", lang: "th", animeName: "The Dangers in My Heart", bpm: "ปานกลาง (85 BPM)", tags: ["รักแรก", "อบอุ่น", "ใจฟู"], reason: "เพลงหวานสื่อความรู้สึกของรักครั้งแรกที่ไม่มีวันลืม", typoIdea: "ฟอนต์ลายมือสีพาสเทล ลอยตามจังหวะเดินของตัวละคร" },
  { term: "พิจารณา Musketeers", mood: "chill", lang: "th", animeName: "Skip and Loafer", bpm: "ปานกลาง (92 BPM)", tags: ["สบาย", "สายลม", "ปล่อยวาง"], reason: "จังหวะชิลล์ฟังสบาย เหมาะกับซีนชีวิตประจำวัน", typoIdea: "ตัวอักษรเคลื่อนไหวนุ่มนวลเหมือนคลื่นน้ำ" },
  { term: "จำนนนนท์ ธนนท์", mood: "sad", lang: "th", animeName: "Pluto", bpm: "ช้า (66 BPM)", tags: ["ยอมแพ้", "ดราม่า", "เจ็บปวด"], reason: "อารมณ์ตัดพ้อที่ยอมแพ้ให้กับโชคชะตาอย่างหมดใจ", typoIdea: "ฟอนต์คมตัดกับเงาดำ สลับควันสีเทาจางๆ" },
  { term: "โคตรพิเศษ Billkin", mood: "love", lang: "th", animeName: "My Love Story with Yamada-kun at Lv999", bpm: "ช้า (78 BPM)", tags: ["พิเศษ", "รัก", "รอยยิ้ม"], reason: "ความรู้สึกที่มองคนตรงหน้าแล้วรู้สึกว่าเขาคือคนพิเศษที่สุด", typoIdea: "แสงไฟนีออนนุ่มๆ พร้อมตัวหนังสือเด้งกระพริบเบาๆ" },
  { term: "วาดไว้ BOWKYLION", mood: "sad", lang: "th", animeName: "Frieren", bpm: "ช้า (70 BPM)", tags: ["วาดไว้", "ความทรงจำ", "สัญญา"], reason: "การวาดภาพฝันที่ไม่มีวันเป็นจริงเข้ากับความทรงจำนับพันปี", typoIdea: "ตัวหนังสือสลายเป็นละอองฝุ่นทองคำตามสายลม" },
  { term: "เลือดกรุ๊ปบี B Blood", mood: "chill", lang: "th", animeName: "Buddy Daddies", bpm: "ปานกลาง (100 BPM)", tags: ["ขำๆ", "น่ารัก", "เหงา"], reason: "ความน่ารักปนตลกของคนเหงาที่โทษดวงดาว", typoIdea: "สติ๊กเกอร์ป๊อปอัพตัวการ์ตูนกระโดดไปมาคู่กับเนื้อเพลง" },
  { term: "ทรงอย่างแบด Paper Planes", mood: "hype", lang: "th", animeName: "Wind Breaker", bpm: "เร็ว (145 BPM)", tags: ["ร็อก", "มันส์", "วัยรุ่น"], reason: "จังหวะร็อกพังค์ดุดันกับฉากต่อสู้ของเหล่านักเรียนนักเลง", typoIdea: "ฟอนต์กราฟิตี้กระแทกตามจังหวะเบสดรัมสีแดงไฟ" },
  { term: "ยินดี Tilly Birds", mood: "sad", lang: "th", animeName: "Insomniacs After School", bpm: "ช้า (74 BPM)", tags: ["ยินดี", "ปล่อยไป", "เศร้า"], reason: "การยินดีที่เห็นเขามีความสุขแม้ไม่มีเราอีกต่อไป", typoIdea: "ฟอนต์สไตล์เรียบหรู ค่อยๆ จมหายไปในเงามืด" },
  { term: "สลักจิต ป๊อบ ปองกูล ดา เอ็นโดรฟิน", mood: "sad", lang: "th", animeName: "Frieren", bpm: "ช้า (68 BPM)", tags: ["คิดถึง", "สลักจิต", "ดนตรีไทย"], reason: "ความรักที่ถูกสลักลึกไว้ในก้นบึ้งของหัวใจตลอดกาล", typoIdea: "ฟอนต์คลาสสิกเรืองแสงบางเบาบนผิวน้ำ" },
  { term: "ถ้าเราเจอกันอีก Tilly Birds", mood: "sad", lang: "th", animeName: "Pluto", bpm: "ปานกลาง (84 BPM)", tags: ["เจอกัน", "คิดถึง", "อวกาศ"], reason: "คำถามว่าหากได้พบกันอีกในสักมิติเวลาจะบอกอะไร", typoIdea: "ตัวหนังสือลอยเคว้งคว้างท่ามกลางดวงดาว" },
  { term: "กลิ่นดอกไม้ Newery", mood: "chill", lang: "th", animeName: "The Apothecary Diaries", bpm: "ช้า (75 BPM)", tags: ["ดอกไม้", "โบราณ", "หอม"], reason: "เสียงร้องนุ่มนวลและทำนองที่หอมหวานราวกับกลิ่นสมุนไพร", typoIdea: "ตัวอักษรพริ้วไหวตามกลีบดอกไม้ที่ร่วงหล่น" },
  { term: "เพื่อนสัมพันธ์ HYBS", mood: "chill", lang: "th", animeName: "Skip and Loafer", bpm: "ปานกลาง (96 BPM)", tags: ["ซิตี้ป๊อป", "ชิลล์", "เพื่อน"], reason: "ดนตรีซิตี้ป๊อปฟังสบาย เหมาะกับบรรยากาศในโรงเรียนยามเย็น", typoIdea: "ตัวอักษรนีออนสีชมพู-ฟ้า สไตล์เรโทร 80s" },
  { term: "ลืมไปแล้วว่าลืมยังไง Jeff Satur", mood: "sad", lang: "th", animeName: "Tengoku Daimakyo", bpm: "ช้า (72 BPM)", tags: ["ลืม", "ความจำ", "เศร้า"], reason: "ความเจ็บปวดจากการพยายามลืมแต่ยิ่งจำได้ชัดเจน", typoIdea: "ตัวอักษรแตกกระจายเหมือนกระจกแตกร้าว" },
  { term: "สุขสันต์วันคิดถึง Three Man Down", mood: "sad", lang: "th", animeName: "Insomniacs After School", bpm: "ปานกลาง (88 BPM)", tags: ["คิดถึง", "วันเกิด", "คืนเหงา"], reason: "การส่งความยินดีผ่านสายลมในคืนที่เหงาที่สุด", typoIdea: "ฟอนต์โมเดิร์นสีขาวเรียบ เรืองแสงสีฟ้าอ่อนบนท้องฟ้ากลางคืน" },

  // English Hits
  { term: "Birds of a Feather Billie Eilish", mood: "love", lang: "en", animeName: "The Dangers in My Heart", bpm: "ปานกลาง (105 BPM)", tags: ["billie", "love", "dreamy"], reason: "A dreamy melody about unconditional connection and loyalty", typoIdea: "Ethereal floating letters with soft glow and feathered blur effects" },
  { term: "Espresso Sabrina Carpenter", mood: "hype", lang: "en", animeName: "Bocchi the Rock!", bpm: "เร็ว (120 BPM)", tags: ["pop", "dance", "catchy"], reason: "Punchy retro dance-pop beat that makes any highlight reel bounce", typoIdea: "Vintage pop magazine bold typography with bounce easing" },
  { term: "Die With A Smile Lady Gaga Bruno Mars", mood: "love", lang: "en", animeName: "Frieren", bpm: "ช้า (72 BPM)", tags: ["ballad", "vocal", "epic"], reason: "Epic emotional duet with soaring vocals fit for timeless cinematic scenes", typoIdea: "Golden serif typography expanding on dramatic vocal peaks" },
  { term: "Golden Hour JVKE", mood: "love", lang: "en", animeName: "Your Name", bpm: "ปานกลาง (94 BPM)", tags: ["piano", "sunset", "golden"], reason: "Cascading piano arpeggios that match golden hour sunset scenery perfectly", typoIdea: "Shimmering gold particles outlining each lyric stroke" },
  { term: "Glimpse of Us Joji", mood: "sad", lang: "en", animeName: "5 Centimeters per Second", bpm: "ช้า (70 BPM)", tags: ["piano", "rain", "heartbreak"], reason: "Haunting melancholic piano chords depicting memories of a lost love", typoIdea: "Raindrop distortion behind subtle minimalist white text" },
  { term: "Daylight David Kushner", mood: "sad", lang: "en", animeName: "Hell's Paradise", bpm: "ช้า (65 BPM)", tags: ["dark", "deep", "hymn"], reason: "Deep gothic cinematic vocals matching dark fantasy encounters", typoIdea: "Dark stone carved typography fading into ominous smoke" },
  { term: "As It Was Harry Styles", mood: "chill", lang: "en", animeName: "Skip and Loafer", bpm: "เร็ว (174 BPM)", tags: ["indie", "retro", "nostalgia"], reason: "Brisk nostalgic 80s synth riff suited for youthful carefree montages", typoIdea: "Kinetic typography sliding horizontally with chromatic aberration" },
  { term: "Until I Found You Stephen Sanchez", mood: "love", lang: "en", animeName: "My Love Story with Yamada-kun at Lv999", bpm: "ช้า (72 BPM)", tags: ["50s", "retro", "romance"], reason: "Classic doo-wop romantic slow dance track", typoIdea: "Script calligraphy font drawing itself across romantic confession scenes" },
  { term: "Night Dancer imase", mood: "chill", lang: "jp", animeName: "Zom 100", bpm: "ปานกลาง (115 BPM)", tags: ["groove", "citypop", "night"], reason: "Funky infectious groove for late night city adventures", typoIdea: "Vibrant neon purple and green typography bouncing to the slap bass" },
  { term: "Bling-Bang-Bang-Born Creepy Nuts", mood: "hype", lang: "jp", animeName: "Mashle: Magic and Muscles", bpm: "เร็ว (150 BPM)", tags: ["hiphop", "energy", "viral"], reason: "Hyper-energetic jersey club beat from Mashle opening", typoIdea: "Bold distorted text shaking vigorously on 808 bass drops" },
  { term: "Abyss YUNGBLUD", mood: "hype", lang: "en", animeName: "Kaiju No. 8", bpm: "เร็ว (140 BPM)", tags: ["rock", "kaiju", "anthem"], reason: "Heavy rock theme capturing colossal kaiju showdowns", typoIdea: "Heavy distressed metal letters slamming down with screen shake" },
  { term: "Otonoke Creepy Nuts", mood: "hype", lang: "jp", animeName: "Dandadan", bpm: "เร็ว (155 BPM)", tags: ["dandadan", "turbo", "fast"], reason: "Insane vocal speed and drum work from Dandadan theme", typoIdea: "Neon lightning trails outlining fast-scrolling punchy words" },
  { term: "Orange SPYAIR", mood: "hype", lang: "jp", animeName: "Haikyu!! The Dumpster Battle", bpm: "เร็ว (138 BPM)", tags: ["haikyuu", "volleyball", "orange"], reason: "Passionate arena rock celebrating rival friendship and match point drama", typoIdea: "Sunset orange font streaking like a spike across the net" },
  { term: "Anytime Anywhere milet", mood: "sad", lang: "jp", animeName: "Frieren", bpm: "ช้า (75 BPM)", tags: ["milet", "frieren", "ending"], reason: "Heart-piercing emotional ending theme capturing the essence of time", typoIdea: "Feather-light flowing fonts disappearing like starlight" },
  { term: "Idol YOASOBI", mood: "hype", lang: "jp", animeName: "Oshi no Ko", bpm: "เร็ว (166 BPM)", tags: ["yoasobi", "idol", "star"], reason: "Maximalist J-pop masterpiece detailing the dark glittering idol world", typoIdea: "Sparkling diamond stars and glowing magenta typography" }
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

async function run() {
  console.log(`Starting to fetch iTunes previews for ${SONG_SEARCHES.length} candidate songs...`);
  let nextSongId = Math.max(0, ...SONGS.map(s => s.id)) + 1;
  let addedCount = 0;

  for (const item of SONG_SEARCHES) {
    const track = await searchITunes(item.term, item.lang);
    if (!track) {
      console.log(`⚠️ Could not find preview for "${item.term}"`);
      continue;
    }

    const key = `${track.title.toLowerCase().trim()}_${track.artist.toLowerCase().trim()}`;
    if (existingSongKeys.has(key)) {
      console.log(`⏩ Song already exists: ${track.title} by ${track.artist}`);
      continue;
    }

    // Match anime
    let matchedAnime = ANIMES.find(a => a.name.toLowerCase().includes(item.animeName.toLowerCase()) || (a.nameTH && a.nameTH.includes(item.animeName)));
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
    addedCount++;
    console.log(`🎵 [${newSong.id}] Added: ${track.title} - ${track.artist} (Anime: ${matchedAnime.name})`);
  }

  console.log(`\n🎉 Finished adding content! Total added: ${addedCount} songs.`);
  console.log(`New DB Stats: ${ANIMES.length} animes, ${SONGS.length} songs, ${ANIME_PAIRS.length} pairs`);

  // Write cleanly back to data.js
  const out = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', out, 'utf8');
  console.log('✅ data.js saved successfully!');
}

run();
