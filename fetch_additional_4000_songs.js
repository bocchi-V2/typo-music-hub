/**
 * fetch_additional_4000_songs.js
 * เพิ่มเพลงฮิตอีก 4,000 เพลงให้คลังเพลง Haimiya Typo
 * ยอดรวมทั้งหมดจะแตะ 15,020+ เพลง!
 * เน้นเพลงฮิตติดหู J-Pop, Anime OST, K-Pop, T-Pop, Global Billboard, Phonk, Lofi
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.js');

const FALLBACK_AUDIO_VAULT = [
  "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/56/8d/89/568d89ae-43f0-eef6-8e82-855c3a6c4ca7/mzaf_17650892221996939599.plus.aac.p.m4a",
  "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6c/a8/1a/6ca81ac5-d121-06a3-8e12-d4844e43c862/mzaf_8008041947493223572.plus.aac.p.m4a",
  "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b7/8b/65/b78b658d-f88b-1dd1-30cb-5c79b7648c65/mzaf_14879268220787160222.plus.aac.p.m4a",
  "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/67/40/40/67404052-23d4-b18a-2b6a-215fdaac94b6/mzaf_12856385750372179723.plus.aac.p.m4a",
  "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ce/4e/76/ce4e767e-eaff-7ff6-7ae8-f9e02c42fa97/mzaf_8190763396037790306.plus.aac.p.m4a",
  "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d8/d5/45/d8d545fe-989c-735a-c148-96cb36a4dcbe/mzaf_8008041947493223572.plus.aac.p.m4a",
  "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/15/09/78/15097896-9495-50f1-6f35-f8294cea5787/mzaf_12856385750372179723.plus.aac.p.m4a"
];

const TYPO_IDEAS = {
  sad: [
    "ใช้ฟอนต์ Serif เรียบหรู สีขาวจางๆ ลอยช้าๆ พร้อมเอฟเฟกต์หมอกควันและหยดน้ำตาจางหายตามจังหวะเปียโน",
    "ตัวหนังสือสีเทาเงิน ค่อยๆ เลือนหายแบบ Fade-out ซ้อนทับฉากฝนตกและเงาสะท้อนกระจก",
    "ฟอนต์สไตล์พิมพ์ดีดโบราณ เคาะตามจังหวะช้าๆ พร้อมแสงสลัวโทนน้ำเงินคราม Mono tone",
    "ฟอนต์ลายมือตัดพ้อ สีขาวหม่น ปรากฏทีละประโยคพร้อมภาพเบลอฉากหลังแบบ Dramatic Bokeh"
  ],
  love: [
    "ใช้ฟอนต์ Script สีชมพูทอง แสงเรืองรองนุ่มนวล พร้อมหัวใจดวงเล็กๆ ลอยล้อมรอบตัวอักษร ซูมเข้าช้าๆ ตามเบส",
    "ตัวหนังสือสีพาสเทลไล่เฉด โค้งมนนุ่มนวล แอนิเมชันลอยเข้าหากันเหมือนการโอบกอด",
    "ฟอนต์หวานสไตล์ Modern Calligraphy วางกึ่งกลางฉากดอกไม้บานและแสงแดดอุ่นยามเช้า",
    "ฟอนต์มินิมอลสีครีม สะอาดตา มีประกายแสง Star Sparkle ระยิบระยับตามเสียงร้องท่อนฮุค"
  ],
  happy: [
    "ใช้ฟอนต์ Sans-Serif ตัวหนาสดใส กระโดดตามจังหวะบีท พร้อมละอองแสง Confetti หลากสีหมุนวน",
    "ตัวหนังสือเด้งสปริง Bouncing จังหวะสนุกสนาน พร้อมอีโมจิและเส้นสปีดไลน์พุ่งกระจาย",
    "ฟอนต์การ์ตูนป๊อปโทนสีเหลืองสดใส เคลื่อนไหวสลับซ้ายขวาตามจังหวะกลองและเสียงปรบมือ",
    "ตัวอักษรพองโตมีมิติ 3D Pop-up สีรุ้งสดใส เพิ่มความขี้เล่นให้กับทุกช็อตของคลิป"
  ],
  chill: [
    "ใช้ฟอนต์มินิมอลสีพาสเทล ไหลเอื่อยๆ ดุจสายน้ำ ผสม Grain Texture สไตล์ฟิล์ม Lo-Fi",
    "ตัวหนังสือสไตล์มินิมอลสีขาวนวล เลื่อนช้าๆ ผ่านขอบล่างของหน้าจอ พร้อมแสงไฟนีออนสลัว",
    "ฟอนต์บางเบา Thin Sans สีฟ้าอมเขียว นิ่งสงบ สบายตา เข้ากับฉากท้องฟ้ายามเย็นและคลื่นทะเล",
    "สไตล์กล้องวินเทจพร้อมวันที่ย้อนยุค ตัวหนังสือฟอนต์คลาสสิก ล่องลอยอย่างผ่อนคลาย"
  ],
  hype: [
    "ใช้ฟอนต์ Impact จัดจ้าน สีแดง/ส้มนีออน กระตุกสั่นตามจังหวะกลองและดรอป มี Glitch Effect สะบัด",
    "ตัวหนังสือขยายเต็มจอแบบ Zoom Punch สลับสีขาว-ดำคมชัดตัดกันตามบีทเบสดรอปสุดมันส์",
    "ฟอนต์แนวสตรีทกราฟฟิตี้ มีเปลวไฟและเอฟเฟกต์แฟลช Strobing เพิ่มความเร้าใจระดับสูงสุด",
    "ตัวอักษรเอียงฉวัดเฉวียนพร้อมเส้น Speed Line สีเหลืองนีออน สั่นตามแรงสั่นของซับวูฟเฟอร์"
  ],
  epic: [
    "ใช้ฟอนต์ Cinematic สีทอง มีแสง Lens Flare ส่องผ่านตัวอักษร ค่อยๆ ขยายเต็มจอ พร้อมฝุ่นละอองดวงดาว",
    "ตัวหนังสือสลักหินโบราณสีเงินโครเมียม เรืองแสงอลังการท่ามกลางฉากต่อสู้และท้องฟ้ากว้างใหญ่",
    "ฟอนต์โกธิกหรูหรา อลังการงานสร้าง มีแอนิเมชันเปิดตัวแบบระเบิดแสง Supernova สว่างวาบ",
    "ตัวหนังสือค่อยๆ ปรากฏจากความมืดมิดด้วยแสงออร่าเปล่งประกาย สอดประสานกับวงออร์เคสตรา"
  ]
};

function getTypoIdea(mood) {
  const list = TYPO_IDEAS[mood] || TYPO_IDEAS.chill;
  return list[Math.floor(Math.random() * list.length)];
}

function getRandomAnimeMatch() {
  const pool = [1,2,3,4,5,6,7,8,9,10,12,15,18,20,25,30,40,50,60,70,80,95,100,120,150,180,200,220,250,280,300,320,350,380,400];
  const count = 2 + Math.floor(Math.random() * 2);
  const ids = [];
  while (ids.length < count) {
    const id = pool[Math.floor(Math.random() * pool.length)];
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

// รายการค้นหาเน้นเพลงฮิต J-Pop, Anime, K-Pop, Global Hits และ T-Pop เพิ่มเติม
const HIT_TARGETS = [
  // --- J-POP & ANIME LEGENDS & TRENDING ---
  { term: "YOASOBI", lang: "jp", mood: "hype", country: "jp" },
  { term: "Ado", lang: "jp", mood: "hype", country: "jp" },
  { term: "Kenshi Yonezu", lang: "jp", mood: "epic", country: "jp" },
  { term: "King Gnu", lang: "jp", mood: "epic", country: "jp" },
  { term: "Official HIGE DANdism", lang: "jp", mood: "happy", country: "jp" },
  { term: "Fujii Kaze", lang: "jp", mood: "chill", country: "jp" },
  { term: "Vaundy", lang: "jp", mood: "hype", country: "jp" },
  { term: "LiSA", lang: "jp", mood: "hype", country: "jp" },
  { term: "Aimer", lang: "jp", mood: "sad", country: "jp" },
  { term: "RADWIMPS", lang: "jp", mood: "epic", country: "jp" },
  { term: "Eve", lang: "jp", mood: "hype", country: "jp" },
  { term: "Mrs. GREEN APPLE", lang: "jp", mood: "happy", country: "jp" },
  { term: "Yorushika", lang: "jp", mood: "chill", country: "jp" },
  { term: "ZUTOMAYO", lang: "jp", mood: "chill", country: "jp" },
  { term: "yama", lang: "jp", mood: "chill", country: "jp" },
  { term: "tuki.", lang: "jp", mood: "sad", country: "jp" },
  { term: "natori", lang: "jp", mood: "chill", country: "jp" },
  { term: "imase", lang: "jp", mood: "happy", country: "jp" },
  { term: "back number", lang: "jp", mood: "sad", country: "jp" },
  { term: "Saucy Dog", lang: "jp", mood: "sad", country: "jp" },
  { term: "Yuuri", lang: "jp", mood: "sad", country: "jp" },
  { term: "Aimyon", lang: "jp", mood: "chill", country: "jp" },
  { term: "milet", lang: "jp", mood: "love", country: "jp" },
  { term: "ReoNa", lang: "jp", mood: "sad", country: "jp" },
  { term: "ClariS", lang: "jp", mood: "happy", country: "jp" },
  { term: "HoneyWorks", lang: "jp", mood: "happy", country: "jp" },
  { term: "BABYMETAL", lang: "jp", mood: "hype", country: "jp" },
  { term: "SiM", lang: "jp", mood: "hype", country: "jp" },
  { term: "UVERworld", lang: "jp", mood: "hype", country: "jp" },
  { term: "ONE OK ROCK", lang: "jp", mood: "hype", country: "jp" },
  { term: "MAN WITH A MISSION", lang: "jp", mood: "hype", country: "jp" },
  { term: "SPYAIR", lang: "jp", mood: "hype", country: "jp" },
  { term: "FLOW", lang: "jp", mood: "hype", country: "jp" },
  { term: "ASIAN KUNG-FU GENERATION", lang: "jp", mood: "hype", country: "jp" },
  { term: "BUMP OF CHICKEN", lang: "jp", mood: "epic", country: "jp" },
  { term: "Creepy Nuts", lang: "jp", mood: "hype", country: "jp" },
  { term: "ATARASHII GAKKO!", lang: "jp", mood: "hype", country: "jp" },
  { term: "Kanaria", lang: "jp", mood: "hype", country: "jp" },
  { term: "DECO*27", lang: "jp", mood: "hype", country: "jp" },
  { term: "Kikuo", lang: "jp", mood: "epic", country: "jp" },
  { term: "Maretu", lang: "jp", mood: "hype", country: "jp" },
  { term: "PinocchioP", lang: "jp", mood: "happy", country: "jp" },
  { term: "Jujutsu Kaisen OST", lang: "jp", mood: "hype", country: "jp" },
  { term: "Demon Slayer OST", lang: "jp", mood: "epic", country: "jp" },
  { term: "Attack on Titan OST", lang: "jp", mood: "epic", country: "jp" },
  { term: "Oshi no Ko OST", lang: "jp", mood: "happy", country: "jp" },
  { term: "Chainsaw Man OST", lang: "jp", mood: "hype", country: "jp" },
  { term: "Frieren OST", lang: "jp", mood: "chill", country: "jp" },
  { term: "Spy x Family OST", lang: "jp", mood: "happy", country: "jp" },
  { term: "Tokyo Ghoul Unravel", lang: "jp", mood: "hype", country: "jp" },
  { term: "Sword Art Online OST", lang: "jp", mood: "epic", country: "jp" },
  { term: "Ghibli Lofi Piano", lang: "jp", mood: "chill", country: "jp" },

  // --- K-POP & K-DRAMA OST ---
  { term: "NewJeans", lang: "kr", mood: "happy", country: "kr" },
  { term: "aespa", lang: "kr", mood: "hype", country: "kr" },
  { term: "IVE", lang: "kr", mood: "love", country: "kr" },
  { term: "LE SSERAFIM", lang: "kr", mood: "hype", country: "kr" },
  { term: "BABYMONSTER", lang: "kr", mood: "hype", country: "kr" },
  { term: "ILLIT", lang: "kr", mood: "happy", country: "kr" },
  { term: "(G)I-DLE", lang: "kr", mood: "hype", country: "kr" },
  { term: "TWICE", lang: "kr", mood: "happy", country: "kr" },
  { term: "BLACKPINK", lang: "kr", mood: "hype", country: "kr" },
  { term: "ITZY", lang: "kr", mood: "hype", country: "kr" },
  { term: "NMIXX", lang: "kr", mood: "hype", country: "kr" },
  { term: "STAYC", lang: "kr", mood: "happy", country: "kr" },
  { term: "KISS OF LIFE", lang: "kr", mood: "hype", country: "kr" },
  { term: "QWER", lang: "kr", mood: "happy", country: "kr" },
  { term: "Red Velvet", lang: "kr", mood: "love", country: "kr" },
  { term: "Stray Kids", lang: "kr", mood: "hype", country: "kr" },
  { term: "BTS", lang: "kr", mood: "hype", country: "kr" },
  { term: "SEVENTEEN", lang: "kr", mood: "happy", country: "kr" },
  { term: "TXT", lang: "kr", mood: "love", country: "kr" },
  { term: "ENHYPEN", lang: "kr", mood: "hype", country: "kr" },
  { term: "RIIZE", lang: "kr", mood: "happy", country: "kr" },
  { term: "ZEROBASEONE", lang: "kr", mood: "happy", country: "kr" },
  { term: "BOYNEXTDOOR", lang: "kr", mood: "happy", country: "kr" },
  { term: "TWS", lang: "kr", mood: "happy", country: "kr" },
  { term: "ATEEZ", lang: "kr", mood: "hype", country: "kr" },
  { term: "DAY6", lang: "kr", mood: "sad", country: "kr" },
  { term: "The Rose", lang: "kr", mood: "sad", country: "kr" },
  { term: "IU", lang: "kr", mood: "love", country: "kr" },
  { term: "Taeyeon", lang: "kr", mood: "love", country: "kr" },
  { term: "JENNIE", lang: "kr", mood: "hype", country: "kr" },
  { term: "LISA", lang: "kr", mood: "hype", country: "kr" },
  { term: "ROSÉ", lang: "kr", mood: "love", country: "kr" },
  { term: "Jung Kook", lang: "kr", mood: "love", country: "kr" },
  { term: "Jimin", lang: "kr", mood: "love", country: "kr" },
  { term: "ZICO", lang: "kr", mood: "happy", country: "kr" },
  { term: "Crush", lang: "kr", mood: "chill", country: "kr" },
  { term: "BIBI", lang: "kr", mood: "hype", country: "kr" },
  { term: "AKMU", lang: "kr", mood: "happy", country: "kr" },
  { term: "BOL4", lang: "kr", mood: "love", country: "kr" },
  { term: "10CM", lang: "kr", mood: "chill", country: "kr" },
  { term: "Paul Kim", lang: "kr", mood: "love", country: "kr" },
  { term: "Sam Kim", lang: "kr", mood: "chill", country: "kr" },
  { term: "MeloMance", lang: "kr", mood: "love", country: "kr" },
  { term: "Heize", lang: "kr", mood: "sad", country: "kr" },
  { term: "Punch OST", lang: "kr", mood: "love", country: "kr" },
  { term: "LeeHi", lang: "kr", mood: "love", country: "kr" },
  { term: "Queen of Tears OST", lang: "kr", mood: "love", country: "kr" },
  { term: "Lovely Runner OST", lang: "kr", mood: "love", country: "kr" },
  { term: "Crash Landing on You OST", lang: "kr", mood: "love", country: "kr" },
  { term: "Goblin OST", lang: "kr", mood: "sad", country: "kr" },

  // --- GLOBAL BILLBOARD & VIRAL TYPO ---
  { term: "Taylor Swift", lang: "en", mood: "love", country: "us" },
  { term: "Billie Eilish", lang: "en", mood: "chill", country: "us" },
  { term: "Olivia Rodrigo", lang: "en", mood: "hype", country: "us" },
  { term: "Sabrina Carpenter", lang: "en", mood: "happy", country: "us" },
  { term: "Ariana Grande", lang: "en", mood: "love", country: "us" },
  { term: "Dua Lipa", lang: "en", mood: "hype", country: "us" },
  { term: "Bruno Mars", lang: "en", mood: "love", country: "us" },
  { term: "The Weeknd", lang: "en", mood: "chill", country: "us" },
  { term: "Ed Sheeran", lang: "en", mood: "love", country: "us" },
  { term: "Coldplay", lang: "en", mood: "epic", country: "us" },
  { term: "Imagine Dragons", lang: "en", mood: "epic", country: "us" },
  { term: "Maroon 5", lang: "en", mood: "happy", country: "us" },
  { term: "Justin Bieber", lang: "en", mood: "love", country: "us" },
  { term: "Post Malone", lang: "en", mood: "chill", country: "us" },
  { term: "Charlie Puth", lang: "en", mood: "happy", country: "us" },
  { term: "Shawn Mendes", lang: "en", mood: "love", country: "us" },
  { term: "Harry Styles", lang: "en", mood: "chill", country: "us" },
  { term: "Sam Smith", lang: "en", mood: "sad", country: "us" },
  { term: "Adele", lang: "en", mood: "sad", country: "us" },
  { term: "Lady Gaga", lang: "en", mood: "epic", country: "us" },
  { term: "Katy Perry", lang: "en", mood: "happy", country: "us" },
  { term: "Rihanna", lang: "en", mood: "love", country: "us" },
  { term: "Beyonce", lang: "en", mood: "hype", country: "us" },
  { term: "SZA", lang: "en", mood: "chill", country: "us" },
  { term: "Doja Cat", lang: "en", mood: "hype", country: "us" },
  { term: "Drake", lang: "en", mood: "chill", country: "us" },
  { term: "Kendrick Lamar", lang: "en", mood: "hype", country: "us" },
  { term: "Eminem", lang: "en", mood: "hype", country: "us" },
  { term: "Travis Scott", lang: "en", mood: "hype", country: "us" },
  { term: "Chappell Roan", lang: "en", mood: "happy", country: "us" },
  { term: "Gracie Abrams", lang: "en", mood: "sad", country: "us" },
  { term: "Conan Gray", lang: "en", mood: "sad", country: "us" },
  { term: "Lauv", lang: "en", mood: "love", country: "us" },
  { term: "LANY", lang: "en", mood: "love", country: "us" },
  { term: "Jeremy Zucker", lang: "en", mood: "chill", country: "us" },
  { term: "keshi", lang: "en", mood: "chill", country: "us" },
  { term: "Stephen Sanchez", lang: "en", mood: "love", country: "us" },
  { term: "d4vd", lang: "en", mood: "sad", country: "us" },
  { term: "Benson Boone", lang: "en", mood: "epic", country: "us" },
  { term: "Teddy Swims", lang: "en", mood: "sad", country: "us" },
  { term: "JVKE", lang: "en", mood: "love", country: "us" },
  { term: "Alec Benjamin", lang: "en", mood: "sad", country: "us" },
  { term: "Ruth B", lang: "en", mood: "love", country: "us" },
  { term: "Ruel", lang: "en", mood: "chill", country: "us" },
  { term: "Troye Sivan", lang: "en", mood: "happy", country: "us" },
  { term: "Beabadoobee", lang: "en", mood: "chill", country: "us" },
  { term: "Cigarettes After Sex", lang: "en", mood: "sad", country: "us" },
  { term: "The Neighbourhood", lang: "en", mood: "chill", country: "us" },
  { term: "Arctic Monkeys", lang: "en", mood: "hype", country: "us" },
  { term: "Chase Atlantic", lang: "en", mood: "hype", country: "us" },
  { term: "BoyWithUke", lang: "en", mood: "happy", country: "us" },
  { term: "Wave to Earth", lang: "en", mood: "chill", country: "us" },
  { term: "Mitski", lang: "en", mood: "sad", country: "us" },
  { term: "The Chainsmokers", lang: "en", mood: "happy", country: "us" },
  { term: "Alan Walker", lang: "en", mood: "epic", country: "us" },
  { term: "Marshmello", lang: "en", mood: "happy", country: "us" },
  { term: "Avicii", lang: "en", mood: "happy", country: "us" },
  { term: "Martin Garrix", lang: "en", mood: "hype", country: "us" },
  { term: "Zedd", lang: "en", mood: "hype", country: "us" },
  { term: "Calvin Harris", lang: "en", mood: "happy", country: "us" },
  { term: "David Guetta", lang: "en", mood: "hype", country: "us" },
  { term: "Kygo", lang: "en", mood: "chill", country: "us" },
  { term: "Sia", lang: "en", mood: "epic", country: "us" },
  { term: "OneRepublic", lang: "en", mood: "epic", country: "us" },
  { term: "Twenty One Pilots", lang: "en", mood: "hype", country: "us" },
  { term: "Panic! At The Disco", lang: "en", mood: "hype", country: "us" },
  { term: "5 Seconds of Summer", lang: "en", mood: "happy", country: "us" },
  { term: "The 1975", lang: "en", mood: "chill", country: "us" },
  { term: "Joji", lang: "en", mood: "sad", country: "us" },
  { term: "Rich Brian", lang: "en", mood: "hype", country: "us" },
  { term: "NIKI", lang: "en", mood: "love", country: "us" },
  { term: "Lofi Hip Hop Chill", lang: "en", mood: "chill", country: "us" },
  { term: "Phonk Drift", lang: "en", mood: "hype", country: "us" },
  { term: "Kordhell", lang: "en", mood: "hype", country: "us" },
  { term: "DVRST", lang: "en", mood: "hype", country: "us" },
  { term: "Hensonn", lang: "en", mood: "hype", country: "us" },
  { term: "GHOSTFACE PLAYA", lang: "en", mood: "hype", country: "us" },

  // --- THAI TRENDING & LEGENDS MORE ---
  { term: "DICE T-Pop", lang: "th", mood: "happy", country: "th" },
  { term: "MXFRUIT", lang: "th", mood: "happy", country: "th" },
  { term: "VIIS", lang: "th", mood: "hype", country: "th" },
  { term: "ALALA", lang: "th", mood: "hype", country: "th" },
  { term: "QRRA", lang: "th", mood: "happy", country: "th" },
  { term: "Empress T-Pop", lang: "th", mood: "hype", country: "th" },
  { term: "Pretzelle", lang: "th", mood: "happy", country: "th" },
  { term: "Zom Marie", lang: "th", mood: "sad", country: "th" },
  { term: "Earth Patravee", lang: "th", mood: "love", country: "th" },
  { term: "Ally Achiraya", lang: "th", mood: "happy", country: "th" },
  { term: "Boy Peacemaker", lang: "th", mood: "sad", country: "th" },
  { term: "Da Endorphine", lang: "th", mood: "love", country: "th" },
  { term: "Gam Wichayanee", lang: "th", mood: "epic", country: "th" },
  { term: "Ice Sarunyu", lang: "th", mood: "happy", country: "th" },
  { term: "Singto Numchok", lang: "th", mood: "happy", country: "th" },
  { term: "Wan Thanakrit", lang: "th", mood: "love", country: "th" },
  { term: "Kamikaze Hits", lang: "th", mood: "happy", country: "th" },
  { term: "Four Mod", lang: "th", mood: "happy", country: "th" },
  { term: "Faye Fang Kaew", lang: "th", mood: "love", country: "th" },
  { term: "Waii Kamikaze", lang: "th", mood: "sad", country: "th" },
  { term: "3.2.1", lang: "th", mood: "hype", country: "th" },
  { term: "Timethai", lang: "th", mood: "chill", country: "th" },
  { term: "D2B", lang: "th", mood: "love", country: "th" },
  { term: "K-Otic", lang: "th", mood: "hype", country: "th" },
  { term: "Golf Mike", lang: "th", mood: "happy", country: "th" },
  { term: "Sek Loso", lang: "th", mood: "love", country: "th" },
  { term: "Carabao", lang: "th", mood: "hype", country: "th" },
  { term: "เพลงละคร ช่อง 3", lang: "th", mood: "love", country: "th" },
  { term: "เพลงละคร ช่อง One", lang: "th", mood: "sad", country: "th" },
  { term: "เพลงประกอบซีรีส์ วาย", lang: "th", mood: "love", country: "th" },
  { term: "เพลงร็อคยุค 90 ไทย", lang: "th", mood: "hype", country: "th" },
  { term: "เพลงสตริงยุค 2000", lang: "th", mood: "love", country: "th" }
];

async function fetchItunes(query, country = 'th', limit = 200) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=${country}&media=music&limit=${limit}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    return [];
  }
}

async function fetchDeezer(query, limit = 100) {
  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    return [];
  }
}

function cleanTitle(raw) {
  if (!raw) return '';
  return raw
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/ft\..*$/i, '')
    .replace(/feat\..*$/i, '')
    .trim();
}

async function main() {
  console.log('🚀 เริ่มกระบวนการดึงเพลงฮิตเพิ่ม 4,000 เพลงเข้าคลัง Haimiya Typo...');
  const tStart = Date.now();

  let rawContent = fs.readFileSync(DATA_FILE, 'utf8');
  
  // โหลด existing songs
  const songsStartIdx = rawContent.indexOf('const SONGS = [');
  const songsEndIdx = rawContent.indexOf('const ANIME_PAIRS = [');
  const insertPos = rawContent.lastIndexOf('];', songsEndIdx);

  const songsSnippet = rawContent.slice(songsStartIdx, songsEndIdx) + '; global._EXISTING = SONGS;';
  eval(songsSnippet);
  const existingSongs = global._EXISTING || [];
  console.log(`📊 เพลงเดิมในคลัง: ${existingSongs.length} เพลง`);

  let maxId = existingSongs.reduce((max, s) => Math.max(max, s.id || 0), 0);
  console.log(`สูงสุด ID ปัจจุบัน: ${maxId}`);

  // เก็บ key เพื่อป้องกันเพลงซ้ำ 100%
  const seenKey = new Set();
  existingSongs.forEach(s => {
    const k = `${cleanTitle(s.title).toLowerCase()}|${(s.artist || '').toLowerCase()}`;
    seenKey.add(k);
    seenKey.add(s.title.toLowerCase().trim());
  });

  const TARGET_ADDED = 4000;
  const newSongs = [];

  console.log(`🎯 เป้าหมาย: ดึงเพิ่มอย่างน้อย ${TARGET_ADDED} เพลง (ยอดรวมจะแตะ ${existingSongs.length + TARGET_ADDED} เพลง)\n`);

  for (let i = 0; i < HIT_TARGETS.length; i++) {
    if (newSongs.length >= TARGET_ADDED) break;

    const t = HIT_TARGETS[i];
    process.stdout.write(`[${i + 1}/${HIT_TARGETS.length}] ค้นหา "${t.term}" (${t.country || 'th'})... `);

    // ดึงจาก iTunes
    const itunesTracks = await fetchItunes(t.term, t.country || 'th', 200);
    let addedFromQuery = 0;

    for (const track of itunesTracks) {
      if (newSongs.length >= TARGET_ADDED) break;
      if (!track.trackName || !track.artistName) continue;

      const title = track.trackName.trim();
      const artist = track.artistName.trim();
      const simpleTitle = cleanTitle(title).toLowerCase();
      const key = `${simpleTitle}|${artist.toLowerCase()}`;

      if (seenKey.has(key) || seenKey.has(title.toLowerCase())) continue;
      seenKey.add(key);
      seenKey.add(title.toLowerCase());

      // รูปปก HD 600x600
      let coverUrl = track.artworkUrl100
        ? track.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
        : (track.artworkUrl60 ? track.artworkUrl60.replace('60x60bb.jpg', '600x600bb.jpg') : '');
      
      // ไฟล์เสียงตัวอย่าง
      let previewUrl = track.previewUrl;
      if (!previewUrl) {
        previewUrl = FALLBACK_AUDIO_VAULT[maxId % FALLBACK_AUDIO_VAULT.length];
      }

      maxId++;
      const bpmNum = 70 + (maxId % 70);
      const bpmDesc = bpmNum >= 120 ? `เร็ว (${bpmNum} BPM)` : bpmNum >= 85 ? `ปานกลาง (${bpmNum} BPM)` : `ช้า (${bpmNum} BPM)`;

      const tagGenre = track.primaryGenreName || 'Trending';
      const songTags = ["ฮิตติดชาร์ต", tagGenre, "ตัดคลิปไทโป"];
      if (t.lang === 'th') songTags.push("T-Pop");
      if (t.lang === 'kr') songTags.push("K-Pop");
      if (t.lang === 'jp') songTags.push("J-Pop / Anime");
      if (t.lang === 'lao') songTags.push("เพลงลาว / อีสาน");

      const songObj = {
        id: maxId,
        title: title,
        artist: artist,
        coverUrl: coverUrl,
        previewUrl: previewUrl,
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(title + ' ' + artist)}`,
        mood: t.mood || "chill",
        tags: songTags,
        bpm: bpmDesc,
        lang: t.lang || "th",
        animeId: (maxId % 415) + 1,
        animeMatch: getRandomAnimeMatch(),
        reason: `เพลงฮิต "${title}" โดย ${artist} เมโลดี้และบีทมู้ด ${t.mood} ถ่ายทอดอารมณ์ตัดต่อคลิปไทโปได้อย่างยอดเยี่ยม`,
        typoIdea: getTypoIdea(t.mood),
        audioUrl: previewUrl,
        audioFallback: FALLBACK_AUDIO_VAULT[(maxId + 1) % FALLBACK_AUDIO_VAULT.length]
      };

      newSongs.push(songObj);
      addedFromQuery++;
    }

    // ถ้ายังไม่จุใจ ดึงจาก Deezer เสริม
    if (addedFromQuery < 25 && newSongs.length < TARGET_ADDED) {
      const dzTracks = await fetchDeezer(t.term, 100);
      for (const track of dzTracks) {
        if (newSongs.length >= TARGET_ADDED) break;
        if (!track.title || !track.artist || !track.artist.name) continue;

        const title = track.title.trim();
        const artist = track.artist.name.trim();
        const simpleTitle = cleanTitle(title).toLowerCase();
        const key = `${simpleTitle}|${artist.toLowerCase()}`;

        if (seenKey.has(key) || seenKey.has(title.toLowerCase())) continue;
        seenKey.add(key);
        seenKey.add(title.toLowerCase());

        let coverUrl = track.album && track.album.cover_big ? track.album.cover_big : '';
        if (!coverUrl && track.md5_image) {
          coverUrl = `https://cdn-images.dzcdn.net/images/cover/${track.md5_image}/500x500-000000-80-0-0.jpg`;
        }

        let previewUrl = track.preview;
        if (!previewUrl) {
          previewUrl = FALLBACK_AUDIO_VAULT[maxId % FALLBACK_AUDIO_VAULT.length];
        }

        maxId++;
        const bpmNum = track.bpm && track.bpm > 0 ? track.bpm : (75 + (maxId % 65));
        const bpmDesc = bpmNum >= 120 ? `เร็ว (${bpmNum} BPM)` : bpmNum >= 85 ? `ปานกลาง (${bpmNum} BPM)` : `ช้า (${bpmNum} BPM)`;

        const songObj = {
          id: maxId,
          title: title,
          artist: artist,
          coverUrl: coverUrl,
          previewUrl: previewUrl,
          spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(title + ' ' + artist)}`,
          mood: t.mood || "chill",
          tags: ["ฮิตติดชาร์ต", "Deezer Trending", "ตัดคลิปไทโป"],
          bpm: bpmDesc,
          lang: t.lang || "th",
          animeId: (maxId % 415) + 1,
          animeMatch: getRandomAnimeMatch(),
          reason: `เพลงฮิต "${title}" โดย ${artist} เมโลดี้และบีทมู้ด ${t.mood} เหมาะสำหรับตัดต่อคู่กับฉากอนิเมะ`,
          typoIdea: getTypoIdea(t.mood),
          audioUrl: previewUrl,
          audioFallback: FALLBACK_AUDIO_VAULT[(maxId + 1) % FALLBACK_AUDIO_VAULT.length]
        };

        newSongs.push(songObj);
        addedFromQuery++;
      }
    }

    console.log(`+${addedFromQuery} เพลง (สะสมแล้ว ${newSongs.length}/${TARGET_ADDED})`);
    await new Promise(r => setTimeout(r, 70));
  }

  console.log(`\n🎉 ดึงเพลงใหม่เสร็จสิ้น! ได้เพลงใหม่ทั้งหมด ${newSongs.length} เพลง`);
  const finalAllSongs = [...existingSongs, ...newSongs];
  console.log(`📊 รวมยอดเพลงทั้งหมดในคลัง: ${finalAllSongs.length} เพลง`);

  // บันทึกลง data.js
  console.log('💾 กำลังแปลงและเขียนลง data.js...');
  const updatedSongsJson = finalAllSongs.map(s => {
    return `  ${JSON.stringify(s, null, 2).split('\n').join('\n  ')}`;
  }).join(',\n');

  const newContent = rawContent.substring(0, songsStartIdx) + 'const SONGS = [\n' + updatedSongsJson + '\n' + rawContent.substring(insertPos);
  fs.writeFileSync(DATA_FILE, newContent, 'utf8');
  console.log('✅ บันทึก data.js สำเร็จเรียบร้อย!');

  // อัปเดต version.json
  const vJsonPath = path.join(__dirname, 'version.json');
  const vData = JSON.parse(fs.readFileSync(vJsonPath, 'utf8'));
  vData.songCount = finalAllSongs.length;
  vData.version = `2.${new Date().toISOString().slice(0,10).replace(/-/g,'')}.${finalAllSongs.length}`;
  vData.versionCode = Date.now();
  vData.updatedAt = new Date().toISOString();
  fs.writeFileSync(vJsonPath, JSON.stringify(vData, null, 2), 'utf8');
  console.log(`✅ อัปเดต version.json: ${vData.songCount} เพลง (v${vData.version})`);

  console.log(`⏱️ ใช้เวลาทั้งหมด: ${((Date.now() - tStart)/1000).toFixed(1)} วินาที`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
