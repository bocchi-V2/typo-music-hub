// add_animes_batch2.js — adds 50 more anime (IDs 251-300)
const fs = require('fs');

const newAnimes = [
  {
    "id": 251,
    "name": "Oshi no Ko",
    "nameTH": "ดาวในดวงใจ",
    "genre": ["ดราม่า", "ไอดอล", "ลึกลับ"],
    "coverUrl": "https://media.kitsu.app/anime/46925/poster_image/medium-2c21baf9e07d5ddb3d05e6e9a02c4fca.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/55791.jpg",
    "anifumeUrl": "https://anifume.com/?s=Oshi+no+Ko",
    "mood": "hype"
  },
  {
    "id": 252,
    "name": "Chainsaw Man",
    "nameTH": "ชายคนเลื่อยยนต์",
    "genre": ["แอคชั่น", "ดาร์ก", "ปีศาจ"],
    "coverUrl": "https://media.kitsu.app/anime/44511/poster_image/medium-ab72e25cb4a2f5e0f6f63aa13fcdb91e.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/44511.jpg",
    "anifumeUrl": "https://anifume.com/?s=Chainsaw+Man",
    "mood": "hype"
  },
  {
    "id": 253,
    "name": "One Piece",
    "nameTH": "วันพีซ",
    "genre": ["ผจญภัย", "แอคชั่น", "โจรสลัด"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/12/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/21.jpg",
    "anifumeUrl": "https://anifume.com/?s=One+Piece",
    "mood": "hype"
  },
  {
    "id": 254,
    "name": "Naruto Shippuden",
    "nameTH": "นารูโตะ ชิปปุเดน",
    "genre": ["แอคชั่น", "นินจา", "ผจญภัย"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/1555/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/1735.jpg",
    "anifumeUrl": "https://anifume.com/?s=Naruto+Shippuden",
    "mood": "hype"
  },
  {
    "id": 255,
    "name": "Bleach: Thousand-Year Blood War",
    "nameTH": "บลีช: สงครามพันปีแห่งเลือด",
    "genre": ["แอคชั่น", "ซูเปอร์เนเชอรัล", "ซามูไร"],
    "coverUrl": "https://media.kitsu.app/anime/45547/poster_image/medium-ecff21462bacc73bbf9e1a60a6ec3e91.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/41467.jpg",
    "anifumeUrl": "https://anifume.com/?s=Bleach+Thousand-Year+Blood+War",
    "mood": "hype"
  },
  {
    "id": 256,
    "name": "Re:Zero − Starting Life in Another World",
    "nameTH": "รีเซทชีวิตฝ่าวิกฤตต่างโลก",
    "genre": ["แฟนตาซี", "ดราม่า", "อิเซไค"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/11981/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/31240.jpg",
    "anifumeUrl": "https://anifume.com/?s=Re%3AZero",
    "mood": "sad"
  },
  {
    "id": 257,
    "name": "Sword Art Online",
    "nameTH": "ซอร์ดอาร์ตออนไลน์",
    "genre": ["แอคชั่น", "แฟนตาซี", "เกม"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/7936/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/11757.jpg",
    "anifumeUrl": "https://anifume.com/?s=Sword+Art+Online",
    "mood": "hype"
  },
  {
    "id": 258,
    "name": "No Game No Life",
    "nameTH": "โนเกม โนไลฟ์",
    "genre": ["แฟนตาซี", "คอมเมดี้", "เกม"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/8687/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/19815.jpg",
    "anifumeUrl": "https://anifume.com/?s=No+Game+No+Life",
    "mood": "hype"
  },
  {
    "id": 259,
    "name": "Toradora!",
    "nameTH": "โทราโดร่า!",
    "genre": ["โรแมนติก", "คอมเมดี้", "โรงเรียน"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/3853/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/4224.jpg",
    "anifumeUrl": "https://anifume.com/?s=Toradora",
    "mood": "love"
  },
  {
    "id": 260,
    "name": "Clannad: After Story",
    "nameTH": "แคลนนาด: อาฟเตอร์สตอรี่",
    "genre": ["ดราม่า", "โรแมนติก", "ซึ้งกินใจ"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/2286/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/4181.jpg",
    "anifumeUrl": "https://anifume.com/?s=Clannad+After+Story",
    "mood": "sad"
  },
  {
    "id": 261,
    "name": "Angel Beats!",
    "nameTH": "แองเจิลบีทส์!",
    "genre": ["ดราม่า", "แอคชั่น", "ดนตรี", "ซึ้งกินใจ"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/5681/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/6594.jpg",
    "anifumeUrl": "https://anifume.com/?s=Angel+Beats",
    "mood": "sad"
  },
  {
    "id": 262,
    "name": "Fullmetal Alchemist: Brotherhood",
    "nameTH": "แขนกลคนแปรธาตุ: บราเธอร์ฮูด",
    "genre": ["แอคชั่น", "ผจญภัย", "แฟนตาซี"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/6421/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/5114.jpg",
    "anifumeUrl": "https://anifume.com/?s=Fullmetal+Alchemist+Brotherhood",
    "mood": "hype"
  },
  {
    "id": 263,
    "name": "Death Note",
    "nameTH": "เดธโน้ต",
    "genre": ["ลึกลับ", "จิตวิทยา", "ทริลเลอร์"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/1376/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/1535.jpg",
    "anifumeUrl": "https://anifume.com/?s=Death+Note",
    "mood": "hype"
  },
  {
    "id": 264,
    "name": "Code Geass",
    "nameTH": "โค้ด กีอัส",
    "genre": ["แอคชั่น", "หุ่นยนต์", "ดราม่า"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/1434/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/1575.jpg",
    "anifumeUrl": "https://anifume.com/?s=Code+Geass",
    "mood": "hype"
  },
  {
    "id": 265,
    "name": "Steins;Gate",
    "nameTH": "สไตน์สเกท",
    "genre": ["ไซไฟ", "ทริลเลอร์", "ดราม่า"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/5646/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/9253.jpg",
    "anifumeUrl": "https://anifume.com/?s=Steins%3BGate",
    "mood": "sad"
  },
  {
    "id": 266,
    "name": "Neon Genesis Evangelion",
    "nameTH": "อีวานเกเลียน",
    "genre": ["หุ่นยนต์", "จิตวิทยา", "ไซไฟ"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/367/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/30.jpg",
    "anifumeUrl": "https://anifume.com/?s=Neon+Genesis+Evangelion",
    "mood": "sad"
  },
  {
    "id": 267,
    "name": "Hunter x Hunter",
    "nameTH": "ฮันเตอร์ x ฮันเตอร์",
    "genre": ["แอคชั่น", "ผจญภัย", "แฟนตาซี"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/7578/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/11061.jpg",
    "anifumeUrl": "https://anifume.com/?s=Hunter+x+Hunter",
    "mood": "hype"
  },
  {
    "id": 268,
    "name": "Black Clover",
    "nameTH": "แบล็คโคลเวอร์",
    "genre": ["แอคชั่น", "แฟนตาซี", "เวทมนตร์"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/13995/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/34572.jpg",
    "anifumeUrl": "https://anifume.com/?s=Black+Clover",
    "mood": "hype"
  },
  {
    "id": 269,
    "name": "That Time I Got Reincarnated as a Slime",
    "nameTH": "เกิดใหม่ทั้งทีก็เป็นสไลม์ไปซะแล้ว",
    "genre": ["แฟนตาซี", "อิเซไค", "คอมเมดี้"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/14352/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/37430.jpg",
    "anifumeUrl": "https://anifume.com/?s=Slime+Reincarnated",
    "mood": "chill"
  },
  {
    "id": 270,
    "name": "The Rising of the Shield Hero",
    "nameTH": "วีรบุรุษโล่ผู้ถูกทอดทิ้ง",
    "genre": ["แฟนตาซี", "อิเซไค", "แอคชั่น"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/14350/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/35790.jpg",
    "anifumeUrl": "https://anifume.com/?s=Shield+Hero",
    "mood": "hype"
  },
  {
    "id": 271,
    "name": "Made in Abyss",
    "nameTH": "เมดอินอะบิสส์",
    "genre": ["ผจญภัย", "ดาร์ก", "แฟนตาซี"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/13925/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/34599.jpg",
    "anifumeUrl": "https://anifume.com/?s=Made+in+Abyss",
    "mood": "sad"
  },
  {
    "id": 272,
    "name": "Overlord",
    "nameTH": "โอเวอร์ลอร์ด",
    "genre": ["แฟนตาซี", "อิเซไค", "แอคชั่น"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/10356/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/29803.jpg",
    "anifumeUrl": "https://anifume.com/?s=Overlord",
    "mood": "hype"
  },
  {
    "id": 273,
    "name": "Konosuba: God's Blessing on This Wonderful World!",
    "nameTH": "โคโนซูบะ! พรของพระเจ้าสู่โลกมหัศจรรย์",
    "genre": ["คอมเมดี้", "แฟนตาซี", "อิเซไค"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/11902/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/30831.jpg",
    "anifumeUrl": "https://anifume.com/?s=Konosuba",
    "mood": "chill"
  },
  {
    "id": 274,
    "name": "My Hero Academia",
    "nameTH": "มายฮีโร่อคาเดเมีย",
    "genre": ["แอคชั่น", "ซูเปอร์ฮีโร่", "โรงเรียน"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/11469/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/31964.jpg",
    "anifumeUrl": "https://anifume.com/?s=My+Hero+Academia",
    "mood": "hype"
  },
  {
    "id": 275,
    "name": "Fairy Tail",
    "nameTH": "เฟรี่เทล",
    "genre": ["แอคชั่น", "แฟนตาซี", "เวทมนตร์"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/5646/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/6702.jpg",
    "anifumeUrl": "https://anifume.com/?s=Fairy+Tail",
    "mood": "hype"
  },
  {
    "id": 276,
    "name": "Dragon Ball Super",
    "nameTH": "ดราก้อนบอล ซูเปอร์",
    "genre": ["แอคชั่น", "ผจญภัย", "คอมเมดี้"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/11606/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/30694.jpg",
    "anifumeUrl": "https://anifume.com/?s=Dragon+Ball+Super",
    "mood": "hype"
  },
  {
    "id": 277,
    "name": "Tokyo Ghoul",
    "nameTH": "โตเกียวกูล",
    "genre": ["ดาร์ก", "สยองขวัญ", "แอคชั่น"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/8778/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/22319.jpg",
    "anifumeUrl": "https://anifume.com/?s=Tokyo+Ghoul",
    "mood": "hype"
  },
  {
    "id": 278,
    "name": "Parasyte: The Maxim",
    "nameTH": "ปรสิต เดอะ แมกซิม",
    "genre": ["ไซไฟ", "สยองขวัญ", "ดราม่า"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/9018/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/22535.jpg",
    "anifumeUrl": "https://anifume.com/?s=Parasyte",
    "mood": "hype"
  },
  {
    "id": 279,
    "name": "Assassination Classroom",
    "nameTH": "แผนสังหารคุณครูอสูร",
    "genre": ["คอมเมดี้", "แอคชั่น", "โรงเรียน"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/8671/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/24833.jpg",
    "anifumeUrl": "https://anifume.com/?s=Assassination+Classroom",
    "mood": "chill"
  },
  {
    "id": 280,
    "name": "Haikyuu!!",
    "nameTH": "ไฮคิว!! คู่ตบฟ้าประทาน",
    "genre": ["กีฬา", "โรงเรียน", "มิตรภาพ"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/8230/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/20583.jpg",
    "anifumeUrl": "https://anifume.com/?s=Haikyuu",
    "mood": "hype"
  },
  {
    "id": 281,
    "name": "Kuroko's Basketball",
    "nameTH": "คุโรโกะ โนะ บาสเก็ต",
    "genre": ["กีฬา", "โรงเรียน", "แอคชั่น"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/7645/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/11771.jpg",
    "anifumeUrl": "https://anifume.com/?s=Kuroko+Basketball",
    "mood": "hype"
  },
  {
    "id": 282,
    "name": "Blue Lock",
    "nameTH": "บลูล็อค",
    "genre": ["กีฬา", "แอคชั่น", "จิตวิทยา"],
    "coverUrl": "https://media.kitsu.app/anime/45524/poster_image/medium-90c98bf0bf5f10e3a2e7f47ec4fceacf.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/49596.jpg",
    "anifumeUrl": "https://anifume.com/?s=Blue+Lock",
    "mood": "hype"
  },
  {
    "id": 283,
    "name": "Kaiju No. 8",
    "nameTH": "ไคจูหมายเลข 8",
    "genre": ["แอคชั่น", "ไซไฟ", "สัตว์ประหลาด"],
    "coverUrl": "https://media.kitsu.app/anime/47196/poster_image/medium-f1b3a9c68b72af0e02b2b6e3a8dc1c0b.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/55791.jpg",
    "anifumeUrl": "https://anifume.com/?s=Kaiju+No+8",
    "mood": "hype"
  },
  {
    "id": 284,
    "name": "Wind Breaker",
    "nameTH": "วินด์เบรกเกอร์",
    "genre": ["แอคชั่น", "โรงเรียน", "มิตรภาพ"],
    "coverUrl": "https://media.kitsu.app/anime/47899/poster_image/medium-7c2a90df27e51f03bc70a0e86d79d88e.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/55787.jpg",
    "anifumeUrl": "https://anifume.com/?s=Wind+Breaker",
    "mood": "hype"
  },
  {
    "id": 285,
    "name": "The Apothecary Diaries",
    "nameTH": "บันทึกร้านขายยา",
    "genre": ["ดราม่า", "ลึกลับ", "ประวัติศาสตร์"],
    "coverUrl": "https://media.kitsu.app/anime/46945/poster_image/medium-3e8cf2cca6c7c9ad7a93bc4c0d5d6a6b.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/52034.jpg",
    "anifumeUrl": "https://anifume.com/?s=Apothecary+Diaries",
    "mood": "chill"
  },
  {
    "id": 286,
    "name": "A Silent Voice",
    "nameTH": "เสียงจากหัวใจ",
    "genre": ["ดราม่า", "โรแมนติก", "ซึ้งกินใจ"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/13284/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/33352.jpg",
    "anifumeUrl": "https://anifume.com/?s=A+Silent+Voice",
    "mood": "sad"
  },
  {
    "id": 287,
    "name": "I Want to Eat Your Pancreas",
    "nameTH": "อยากกินตับอ่อนของเธอ",
    "genre": ["ดราม่า", "โรแมนติก", "ซึ้งกินใจ"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/14312/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/36098.jpg",
    "anifumeUrl": "https://anifume.com/?s=I+Want+to+Eat+Your+Pancreas",
    "mood": "sad"
  },
  {
    "id": 288,
    "name": "Anohana: The Flower We Saw That Day",
    "nameTH": "อาโนะฮานะ ดอกไม้วันนั้น",
    "genre": ["ดราม่า", "ซึ้งกินใจ", "ซูเปอร์เนเชอรัล"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/6437/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/9756.jpg",
    "anifumeUrl": "https://anifume.com/?s=Anohana",
    "mood": "sad"
  },
  {
    "id": 289,
    "name": "Your Name",
    "nameTH": "ชื่อของเธอ",
    "genre": ["โรแมนติก", "แฟนตาซี", "ดราม่า"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/13054/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/32281.jpg",
    "anifumeUrl": "https://anifume.com/?s=Your+Name",
    "mood": "love"
  },
  {
    "id": 290,
    "name": "Weathering with You",
    "nameTH": "ฝนของเธอและฉัน",
    "genre": ["โรแมนติก", "แฟนตาซี", "ดราม่า"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/45059/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/38826.jpg",
    "anifumeUrl": "https://anifume.com/?s=Weathering+with+You",
    "mood": "love"
  },
  {
    "id": 291,
    "name": "Suzume",
    "nameTH": "ซูซูเมะ",
    "genre": ["แฟนตาซี", "ผจญภัย", "ดราม่า"],
    "coverUrl": "https://media.kitsu.app/anime/46004/poster_image/medium-b5e9b4b5a0e2e4d3d7dc8fd2f7d3af10.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/50594.jpg",
    "anifumeUrl": "https://anifume.com/?s=Suzume",
    "mood": "sad"
  },
  {
    "id": 292,
    "name": "The Boy and the Heron",
    "nameTH": "เด็กชายกับนกกระสา",
    "genre": ["แฟนตาซี", "ผจญภัย", "จิบลิ"],
    "coverUrl": "https://media.kitsu.app/anime/46874/poster_image/medium-77ce4d83e28e24e71cf7fdcbe0df8e28.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/57458.jpg",
    "anifumeUrl": "https://anifume.com/?s=The+Boy+and+the+Heron",
    "mood": "chill"
  },
  {
    "id": 293,
    "name": "Princess Mononoke",
    "nameTH": "เจ้าหญิงจิตวิญญาณแห่งพงไพร",
    "genre": ["แฟนตาซี", "ผจญภัย", "จิบลิ"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/192/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/164.jpg",
    "anifumeUrl": "https://anifume.com/?s=Princess+Mononoke",
    "mood": "hype"
  },
  {
    "id": 294,
    "name": "Howl's Moving Castle",
    "nameTH": "ปราสาทเวทมนตร์ของฮาวล์",
    "genre": ["แฟนตาซี", "โรแมนติก", "จิบลิ"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/419/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/431.jpg",
    "anifumeUrl": "https://anifume.com/?s=Howl%27s+Moving+Castle",
    "mood": "love"
  },
  {
    "id": 295,
    "name": "Bocchi the Rock!",
    "nameTH": "บ็อคจิ เดอะ ร็อค!",
    "genre": ["ดนตรี", "คอมเมดี้", "โรงเรียน"],
    "coverUrl": "https://media.kitsu.app/anime/45580/poster_image/medium-41f685e5cde5e038c0e50c7e5d3e1b9c.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/47917.jpg",
    "anifumeUrl": "https://anifume.com/?s=Bocchi+the+Rock",
    "mood": "chill"
  },
  {
    "id": 296,
    "name": "Spy x Family",
    "nameTH": "สปาย x แฟมิลี่",
    "genre": ["คอมเมดี้", "แอคชั่น", "ครอบครัว"],
    "coverUrl": "https://media.kitsu.app/anime/44936/poster_image/medium-12e4edde8e1e3e6f7e64b62b22df6e8b.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/50265.jpg",
    "anifumeUrl": "https://anifume.com/?s=Spy+x+Family",
    "mood": "chill"
  },
  {
    "id": 297,
    "name": "Mushoku Tensei: Jobless Reincarnation",
    "nameTH": "ชีวิตใหม่ไม่ให้เสียดาย",
    "genre": ["แฟนตาซี", "อิเซไค", "ผจญภัย"],
    "coverUrl": "https://media.kitsu.app/anime/42929/poster_image/medium-c14f69d5c2cdb13e27b0ef03dde95248.jpeg",
    "coverFallback": "https://shikimori.one/system/animes/original/39535.jpg",
    "anifumeUrl": "https://anifume.com/?s=Mushoku+Tensei",
    "mood": "chill"
  },
  {
    "id": 298,
    "name": "Vinland Saga",
    "nameTH": "วินแลนด์ซากา",
    "genre": ["แอคชั่น", "ประวัติศาสตร์", "ดราม่า"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/42438/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/37521.jpg",
    "anifumeUrl": "https://anifume.com/?s=Vinland+Saga",
    "mood": "hype"
  },
  {
    "id": 299,
    "name": "Bungo Stray Dogs",
    "nameTH": "บุงโงะ สเตรย์ ด็อกส์",
    "genre": ["แอคชั่น", "ลึกลับ", "ซูเปอร์เนเชอรัล"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/11492/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/31478.jpg",
    "anifumeUrl": "https://anifume.com/?s=Bungo+Stray+Dogs",
    "mood": "hype"
  },
  {
    "id": 300,
    "name": "Classroom of the Elite",
    "nameTH": "ห้องเรียนของผู้ที่ยิ่งยวด",
    "genre": ["จิตวิทยา", "โรงเรียน", "ดราม่า"],
    "coverUrl": "https://media.kitsu.app/anime/poster_images/13672/medium.jpg",
    "coverFallback": "https://shikimori.one/system/animes/original/35507.jpg",
    "anifumeUrl": "https://anifume.com/?s=Classroom+of+the+Elite",
    "mood": "hype"
  }
];

// Inject into data.js
const raw = fs.readFileSync('./data.js', 'utf8');
const insertPoint = raw.indexOf('];\n\nconst SONGS');
if (insertPoint === -1) { console.error('Cannot find insert point'); process.exit(1); }

const newEntries = newAnimes.map(a => '  ' + JSON.stringify(a, null, 2).replace(/\n/g, '\n  ')).join(',\n');
const updated = raw.slice(0, insertPoint) + ',\n' + newEntries + '\n' + raw.slice(insertPoint);

fs.writeFileSync('./data.js', updated, 'utf8');
console.log(`✅ Added ${newAnimes.length} animes (IDs 251-300). Total should now be 300.`);
