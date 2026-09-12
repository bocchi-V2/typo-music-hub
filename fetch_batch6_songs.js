const fs = require('fs');
const https = require('https');

function itunesSearch(term) {
  return new Promise((resolve) => {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results || []);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

const songCandidates = [
  // JAPANESE & ANIME (20)
  {
    query: "Bling-Bang-Bang-Born Creepy Nuts",
    title: "Bling-Bang-Bang-Born",
    artist: "Creepy Nuts",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (156 BPM)",
    tags: ["ไวรัลทั่วโลก", "แดนซ์สับ", "พลังกล้าม"],
    animeId: 245, // Mashle
    reason: "เพลงไวรัลเปิดโลกเวทมนตร์ด้วยจังหวะเจอร์ซีย์คลับ เหมาะกับฉากโชว์พลังหรือเต้นกวนๆ",
    typoIdea: "ใช้ฟอนต์สไตล์ Bold Pop เด้งตามบีทกลองซอยยี่ แอนิเมชัน Zoom Shake"
  },
  {
    query: "Otonoke Creepy Nuts Dandadan",
    title: "Otonoke",
    artist: "Creepy Nuts",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (160 BPM)",
    tags: ["ดันดาดัน", "ไซคิก", "โฟลว์ดุ"],
    animeId: 231, // Dandadan
    reason: "เพลงเปิดสุดไฮป์แห่งปี จังหวะสับและลื่นไหล เข้ากับฉากวิ่งหนีผีเอเลี่ยนแบบสุดโต่ง",
    typoIdea: "ตัวอักษรแนวกลิตช์นีออนสีม่วง-เขียว สลับสีสโตรกตามสปีดการแร็ป"
  },
  {
    query: "Yuusha YOASOBI Frieren",
    title: "The Brave (Yuusha)",
    artist: "YOASOBI",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (130 BPM)",
    tags: ["ผู้กล้า", "การเดินทาง", "ความทรงจำ"],
    animeId: 233, // Frieren
    reason: "บทเพลงสรรเสริญผู้กล้าฮิมเมล ความเร็วและเมโลดี้ทรงพลังสะท้อนการผจญภัย",
    typoIdea: "ฟอนต์แนว Serif โบราณ เรืองแสงสีทอง สลับคัตติ้งซีนต่อสู้กับฉากยิ้มอบอุ่น"
  },
  {
    query: "Anytime Anywhere milet Frieren",
    title: "Anytime Anywhere",
    artist: "milet",
    lang: "jp",
    mood: "sad",
    bpm: "ช้า (74 BPM)",
    tags: ["ซึ้งกินใจ", "อบอุ่น", "น้ำตาซึม"],
    animeId: 233, // Frieren
    reason: "เสียงร้องที่โอบกอดหัวใจและความรู้สึกที่คงอยู่ตลอดไป แม้กาลเวลาจะผ่านไปนับร้อยปี",
    typoIdea: "ตัวหนังสือสลายเป็นละอองดาว ค่อยๆ ปรากฏและเลือนหายตามลมหายใจ"
  },
  {
    query: "Abyss YUNGBLUD Kaiju No 8",
    title: "Abyss",
    artist: "YUNGBLUD",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (140 BPM)",
    tags: ["ไคจู", "ร็อคสะเทือน", "แปลงร่าง"],
    animeId: 232, // Kaiju No. 8
    reason: "เพลงร็อคระเบิดพลังแห่งการต่อสู้เพื่อความฝันในวัยผู้ใหญ่ เข้ากับไคจูหมายเลข 8 เต็มพิกัด",
    typoIdea: "สไตล์ Heavy Grunge ตัวหนังสือแตกกระจาย มีประกายสายฟ้าและเอฟเฟกต์เบสบูสต์"
  },
  {
    query: "Nobody OneRepublic Kaiju No 8",
    title: "Nobody",
    artist: "OneRepublic",
    lang: "jp",
    mood: "chill",
    bpm: "ปานกลาง (115 BPM)",
    tags: ["ฟีลกู้ด", "มิตรภาพ", "กวนๆ"],
    animeId: 232, // Kaiju No. 8
    reason: "เพลงจบสุดชิลล์ มู้ดสดใสของเหล่าหน่วยปราบไคจูในยามพักผ่อน",
    typoIdea: "ตัวอักษร Pop Art มี Drop Shadow สดใส เลื่อนไหลตามจังหวะเดินสบายๆ"
  },
  {
    query: "LEveL SawanoHiroyuki TXT Solo Leveling",
    title: "LEveL",
    artist: "SawanoHiroyuki[nZk]:TOMORROW X TOGETHER",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (138 BPM)",
    tags: ["อัปเลเวล", "จุติเทพ", "ดาร์กแอคชั่น"],
    animeId: 236, // Solo Leveling
    reason: "ซาวด์ดนตรีสไตล์ซาวาโนะผนวกกับเสียงร้องเร้าใจ เข้ากับฉากซองจินอูตื่นขึ้นมาผงาด",
    typoIdea: "เอฟเฟกต์หน้าต่างสถานะสีน้ำเงิน เรืองแสง ตัวหนังสือคมกริบแบบมีดสั้น"
  },
  {
    query: "Hana ni Natte Ryokuoushoku Shakai",
    title: "Hana ni Natte",
    artist: "Ryokuoushoku Shakai",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (148 BPM)",
    tags: ["ยาพิษ", "เสน่ห์ล้น", "เฉลียวฉลาด"],
    animeId: 237, // Kusuriya no Hitorigoto
    reason: "เมโลดี้ทรงเสน่ห์น่าค้นหา เปี่ยมด้วยไหวพริบเข้ากับตัวตนของเหมาเหมาในวังหลวง",
    typoIdea: "ตัวอักษรพริ้วไหวแซมกลีบดอกไม้และควันยาพิษสีม่วง คัตติ้งรวดเร็วตามเสียงเปียโน"
  },
  {
    query: "Fatal GEMN Oshi no Ko",
    title: "Fatal",
    artist: "GEMN",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (132 BPM)",
    tags: ["เกิดใหม่เป็นลูกโอชิ", "ล้างแค้น", "โรงละคร"],
    animeId: 238, // Oshi no Ko S2
    reason: "ความลับและไฟแค้นที่ปะทุบนเวทีการแสดง เสียงประสานทรงพลังดุดัน",
    typoIdea: "ดวงตาดาวสีขาวสลับดำ ฟอนต์คมสองเฉดสี ตัดกับแสงไฟสปอตไลท์โรงละคร"
  },
  {
    query: "Orange SPYAIR Haikyu",
    title: "Orange",
    artist: "SPYAIR",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (135 BPM)",
    tags: ["วอลเลย์บอล", "มิตรภาพคู่แค้น", "น้ำตาลูกผู้ชาย"],
    animeId: 242, // Haikyu Movie
    reason: "เพลงประกอบศึกกองขยะ คาราสึโนะปะทะเนโกมะ สื่อถึงมิตรภาพและการแข่งขันที่ไม่อยากให้จบ",
    typoIdea: "แสงแดดสีส้มตกกระทบพื้นคอร์ท ตัวหนังสือสไตล์ Brush สาดหมึกอย่างมีพลัง"
  },
  {
    query: "Shinunoga E-Wa Fujii Kaze",
    title: "Shinunoga E-Wa",
    artist: "Fujii Kaze",
    lang: "jp",
    mood: "chill",
    bpm: "ปานกลาง (83 BPM)",
    tags: ["ไวรัลคลาสสิก", "คลั่งรัก", "เสน่ห์สะกด"],
    animeId: 243, // Alya / Anime romance
    reason: "ยอมตายดีกว่าต้องพรากจากเธอ เมโลดี้สไตล์ R&B ญี่ปุ่นที่สะกดคนฟังทั้งโลก",
    typoIdea: "ฟอนต์แนว Mincho คลาสสิก ย้อมโทนสีซีเปียอบอุ่น มีเกรนฟิล์มเบาๆ"
  },
  {
    query: "Matsuri Fujii Kaze",
    title: "Matsuri",
    artist: "Fujii Kaze",
    lang: "jp",
    mood: "chill",
    bpm: "ปานกลาง (94 BPM)",
    tags: ["เทศกาล", "ปล่อยวาง", "เบาสบาย"],
    animeId: 234, // Dungeon Meshi / Chill
    reason: "บทเพลงแห่งการเฉลิมฉลองชีวิตและปล่อยวางความทุกข์ เหมือนนั่งล้อมวงกินอาหารในดันเจี้ยน",
    typoIdea: "ตัวหนังสือสไตล์งานวัดญี่ปุ่น โทนสีทองและแดง ค่อยๆ หมุนคลายความตึงเครียด"
  },
  {
    query: "Kura Kura Ado Spy x Family",
    title: "Kura Kura",
    artist: "Ado",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (165 BPM)",
    tags: ["สปาย", "หมุนติ้ว", "สดใสป่วน"],
    animeId: 240, // Makeine / Comedy
    reason: "เพลงเปิดสุดป่วนสดใสที่ทำให้เวียนหัวด้วยความน่ารักและความวุ่นวายของครอบครัวฟอร์เจอร์",
    typoIdea: "ข้อความกระโดดดึ๋งไปมา หมุน 360 องศา พร้อมไอคอนหน้าตกใจน่ารักๆ"
  },
  {
    query: "Show Ado",
    title: "Show",
    artist: "Ado",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (130 BPM)",
    tags: ["เร้าใจสุดขีด", "ระเบิดพลัง", "แดนซ์ผี"],
    animeId: 244, // Chainsaw Man
    reason: "บีท EDM เดือดสะบัดและลูกคอสุดคลั่งของ Ado เข้ากับฉากบู๊ระเบิดเมือง",
    typoIdea: "ฟอนต์นีออนสีชมพูกระพริบไฟสโตรบ แอนิเมชันปาดคำซ้อนกันอย่างรวดเร็ว"
  },
  {
    query: "Suzume RADWIMPS Toaka",
    title: "Suzume",
    artist: "RADWIMPS feat. Toaka",
    lang: "jp",
    mood: "sad",
    bpm: "ช้า (78 BPM)",
    tags: ["ผนึกประตู", "เสียงฮัมสะกด", "ความสูญเสีย"],
    animeId: 239, // Look Back
    reason: "เสียงฮัมเปิดเพลงที่เป็นเอกลักษณ์ สื่อถึงความทรงจำที่ไม่อาจลืมเลือนและการเยียวยาจิตใจ",
    typoIdea: "ฟอนต์มินิมอลสีขาวสะท้อนแสงน้ำ คลื่นเสียงสั่นตามจังหวะ รูรู รูรูรูรู"
  },
  {
    query: "A Cruel Angel's Thesis Yoko Takahashi",
    title: "A Cruel Angel's Thesis",
    artist: "Yoko Takahashi",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (128 BPM)",
    tags: ["ตำนานคลาสสิก", "อีวานเกเลียน", "เพลงชาติโอตาคุ"],
    animeId: 248, // Bleach / Epic
    reason: "เพลงอนิเมะระดับตำนานที่ทุกคนต้องรู้จัก ท่อนคอรัสทรงพลังที่เข้ากับทุกฉากไคลแม็กซ์",
    typoIdea: "ข้อความจัดกึ่งกลางสไตล์ Evangelion typography ฟอนต์ Serif ตัวหนาแถบดำ"
  },
  {
    query: "Work millenium parade Sheena Ringo",
    title: "W●RK",
    artist: "millennium parade & Sheena Ringo",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (142 BPM)",
    tags: ["สุขาวดีอเวจี", "สไตล์ล้ำ", "คู่หูเดือด"],
    animeId: 250, // Jigokuraku
    reason: "ความผสมผสานระหว่างดนตรีอว็อง-การ์ดกับเสียงร้องอันเป็นเอกลักษณ์ในเกาะมรณะ",
    typoIdea: "ตัวอักษรสีแดงชาดตัดดำ มีรอยป้ายพู่กันจีนและเอฟเฟกต์เบลอโมชัน"
  },
  {
    query: "Bling-Bang-Bang-Born Instrumental",
    title: "Bling-Bang-Bang-Born (Sped Up)",
    artist: "Creepy Nuts",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (170 BPM)",
    tags: ["ติ๊กต็อก", "สปีดอัพ", "เต้นยับ"],
    animeId: 235, // Wind Breaker
    reason: "เวอร์ชันความเร็วพิเศษยอดฮิตบน TikTok เหมาะกับคลิปไทโปตัดต่อกระชับฉับไว",
    typoIdea: "ตัวหนังสือสับสเกลขึ้นลงอย่างบ้าคลั่ง สลับซูมเข้าหน้าตัวละครตามจังหวะเตะต่อย"
  },
  {
    query: "Haru Yorushika Frieren",
    title: "Haru (Sunny)",
    artist: "Yorushika",
    lang: "jp",
    mood: "chill",
    bpm: "ปานกลาง (105 BPM)",
    tags: ["ฤดูใบไม้ผลิ", "สดใส", "กวี"],
    animeId: 233, // Frieren
    reason: "เพลงเปิดซีซั่นสองของโยรุชิกะ ให้ความรู้สึกถึงแสงแดดอันอบอุ่นและการก้าวต่อไปข้างหน้า",
    typoIdea: "โทนสีพาสเทลเขียวมิ้นต์และชมพูดอกไม้ ตัวหนังสือลอยไปทางขวาตามสายลม"
  },
  {
    query: "Specialz King Gnu",
    title: "SPECIALZ",
    artist: "King Gnu",
    lang: "jp",
    mood: "hype",
    bpm: "เร็ว (120 BPM)",
    tags: ["ชิบูย่า", "ความโกลาหล", "เท่ดุดัน"],
    animeId: 244, // Chainsaw Man / JJK
    reason: "บีทสุดหน่วงและท่อน 'You are my special' สำหรับฉากต่อสู้ในเมืองอันมืดมิด",
    typoIdea: "ตัวหนังสือตัวเอียงขอบคมกริบ สีแดงนีออนปนควันดำ มีการซ้อนทับภาพสั่นไหว"
  },

  // THAI VIRAL & HITS (15)
  {
    query: "ดาวหางฮัลเลย์ fellow fellow",
    title: "ดาวหางฮัลเลย์ (Halley's Comet)",
    artist: "fellow fellow",
    lang: "th",
    mood: "love",
    bpm: "ช้า (76 BPM)",
    tags: ["ขอให้ได้รักเธอ", "75ปีเจอกันที", "โรแมนติกซึ้ง"],
    animeId: 239, // Look Back / Your Name vibe
    reason: "เพลงรักอภิมหาฮิตที่สื่อถึงความรักที่รอคอยได้ แม้จะนานเท่าวงโคจรดาวหาง",
    typoIdea: "ตัวหนังสือลากเส้นแสงประกายดาวหาง ตัวอักษรโค้งมนละมุนตาบนท้องฟ้าราตรี"
  },
  {
    query: "ไม่เปลี่ยนใจเธอคนเดิม fellow fellow",
    title: "ไม่เปลี่ยนใจ (Just You)",
    artist: "fellow fellow",
    lang: "th",
    mood: "love",
    bpm: "ปานกลาง (82 BPM)",
    tags: ["รักเดียวใจเดียว", "มั่นคง", "ฟังสบาย"],
    animeId: 241, // Blue Box
    reason: "ไม่ว่าเวลาจะผ่านไปนานแค่ไหน ใจก็ยังเลือกเธอคนเดิมเสมอ เหมาะกับซีนสคูลไลฟ์",
    typoIdea: "ตัวพิมพ์ลายมือน่ารัก มีไฮไลท์สีพาสเทลขีดเน้นคำสำคัญแบบสมุดไดอารี่"
  },
  {
    query: "โต๊ะริม NONT TANONT",
    title: "โต๊ะริม (Melt)",
    artist: "NONT TANONT",
    lang: "th",
    mood: "love",
    bpm: "ปานกลาง (90 BPM)",
    tags: ["ละลาย", "ตกหลุมรัก", "เสียงหวาน"],
    animeId: 243, // Alya
    reason: "ความน่ารักที่ทำให้ใจละลายเหมือนโดนสะกดจิต เพียงแค่เห็นเธอนั่งอยู่ตรงโต๊ะริม",
    typoIdea: "คำว่า 'ละลาย' ค่อยๆ ไหลเยิ้มลงมาเป็นเอฟเฟกต์นุ่มนวล พร้อมอิโมจิหัวใจสีชมพู"
  },
  {
    query: "รักแรก NONT TANONT",
    title: "รักแรก (First Love)",
    artist: "NONT TANONT",
    lang: "th",
    mood: "sad",
    bpm: "ช้า (70 BPM)",
    tags: ["รักแรก", "ย้อนวัย", "คิดถึง"],
    animeId: 239, // Look Back
    reason: "ความทรงจำของรักแรกที่ไม่เคยจางหายไปจากใจ เรียกน้ำตาและรอยยิ้มได้พร้อมกัน",
    typoIdea: "ฟอนต์มีหัวสไตล์วินเทจ เคลื่อนที่ช้าๆ ซ้อนทับฉากฝนตกหรือแสงแดดส่องยามเย็น"
  },
  {
    query: "วาดไว้ BOWKYLION",
    title: "วาดไว้ (Recall)",
    artist: "BOWKYLION",
    lang: "th",
    mood: "sad",
    bpm: "ช้า (72 BPM)",
    tags: ["ภาพวาด", "คิดถึงคนบนฟ้า", "โศกเศร้า"],
    animeId: 239, // Look Back
    reason: "ภาพที่เคยวาดไว้ด้วยกันในวันวาน เพลงระดับปรากฏการณ์ที่บีบหัวใจทุกคนที่เคยสูญเสีย",
    typoIdea: "ตัวอักษรปรากฏเหมือนปลายพู่กันวาดลงบนกระดาษ แล้วค่อยๆ โดนสีน้ำชะล้าง"
  },
  {
    query: "ลืมไปแล้วว่าลืมยังไง Jeff Satur",
    title: "ลืมไปแล้วว่าลืมยังไง (Fade)",
    artist: "Jeff Satur",
    lang: "th",
    mood: "sad",
    bpm: "ช้า (75 BPM)",
    tags: ["เจฟซาเตอร์", "เสียงสูงสะกดใจ", "ลืมไม่ได้"],
    animeId: 249, // NieR Automata
    reason: "เสียงร้องทรงพลังที่ถ่ายทอดความเจ็บปวดของการติดอยู่ในวังวนความคิดถึง",
    typoIdea: "ตัวหนังสือสลายตัวแบบ Glitch & Dissolve พร้อมเรนจ์สีขาว-ครามเย็นชา"
  },
  {
    query: "ดอกไม้ไฟ Mirrr",
    title: "ดอกไม้ไฟ (Firework)",
    artist: "Mirrr",
    lang: "th",
    mood: "love",
    bpm: "ปานกลาง (85 BPM)",
    tags: ["สวยงามแต่งดงาม", "ชั่วขณะ", "อบอุ่น"],
    animeId: 241, // Blue Box
    reason: "ความรักที่เปรียบดั่งประกายดอกไม้ไฟ แม้จะเป็นช่วงเวลาสั้นๆ แต่งดงามที่สุดในความทรงจำ",
    typoIdea: "ตัวหนังสือแตกประกายไฟสีทองและส้ม มีอนุภาคสะเก็ดไฟระยิบระยับ"
  },
  {
    query: "ซ่อนกลิ่น Palmy",
    title: "ซ่อนกลิ่น",
    artist: "Palmy",
    lang: "th",
    mood: "sad",
    bpm: "ช้า (78 BPM)",
    tags: ["กลิ่นหอมในใจ", "บทกวี", "คิดถึงลึกซึ้ง"],
    animeId: 233, // Frieren
    reason: "เพลงแห่งความคิดถึงที่หอมหวลแต่แฝงความเหงา สอดคล้องกับการรำลึกอดีตของเอลฟ์ผู้ยืนยาว",
    typoIdea: "ตัวหนังสือพริ้วไหวเหมือนควันกำยาน ค่อยๆ จางลงตามระนาดและสายลม"
  },
  {
    query: "ถ้าเธอรักใครคนหนึ่ง INK WARUNTORN",
    title: "ถ้าเธอรักใครคนหนึ่ง",
    artist: "INK WARUNTORN",
    lang: "th",
    mood: "love",
    bpm: "ช้า (74 BPM)",
    tags: ["บุพเพ", "รักแท้", "เสียงใส"],
    animeId: 243, // Alya
    reason: "บทเพลงรักแสนหวานที่บอกว่าหากรักใครสักคน ก็ขอให้รักหมดหัวใจและดูแลเขาให้ดีที่สุด",
    typoIdea: "ตัวหนังสือฟอนต์หวานสไตล์ Modern Calligraphy ลอยประดับด้วยกลีบดอกไม้ขาว"
  },
  {
    query: "ยินดีด้วยนะ INK WARUNTORN",
    title: "ยินดีด้วยนะ (Glad)",
    artist: "INK WARUNTORN",
    lang: "th",
    mood: "sad",
    bpm: "ปานกลาง (88 BPM)",
    tags: ["งานแต่งเธอ", "ยิ้มทั้งน้ำตา", "เจ็บลึก"],
    animeId: 240, // Makeine
    reason: "การอวยพรให้คนที่เรารักได้มีความสุขกับคนที่เขาเลือก แม้คนข้างกายจะไม่ใช่เรา",
    typoIdea: "ข้อความแบ่งสองฝั่ง 'ยินดีด้วยนะ' ชัดเจน แต่ข้อความซ่อนเบื้องหลังเบลอจาง"
  },
  {
    query: "คนไม่คุย PROXIE",
    title: "คนไม่คุย (Silent Mode)",
    artist: "PROXIE",
    lang: "th",
    mood: "love",
    bpm: "เร็ว (120 BPM)",
    tags: ["บอยแบนด์ไทย", "น่ารักขี้เล่น", "แดนซ์"],
    animeId: 243, // Alya
    reason: "เพลงป๊อปสุดน่ารัก อาการเขินเมื่ออยู่ใกล้คนที่ชอบจนกลายเป็นคนไม่พูดไม่จา",
    typoIdea: "กล่องแชทข้อความเด้ง Typing Bubble สลับกับสติ๊กเกอร์เครื่องหมายคำถามน่ารัก"
  },
  {
    query: "พิจารณา Musketeers MAIYARAP",
    title: "พิจารณา (Consider)",
    artist: "Musketeers feat. MAIYARAP",
    lang: "th",
    mood: "sad",
    bpm: "ปานกลาง (92 BPM)",
    tags: ["ตัดพ้อ", "โปรดพิจารณา", "ดนตรีเท่"],
    animeId: 244, // Chainsaw Man
    reason: "การขอความชัดเจนในความสัมพันธ์ ท่อนแร็ปของ MAIYARAP เสริมอารมณ์ตัดพ้อได้อย่างเจ็บแสบ",
    typoIdea: "แอนิเมชันปั๊มตรายางคำว่า 'พิจารณา' ลงบนพื้นหลังเอกสารคัตติ้งดุดัน"
  },
  {
    query: "ติดฝน PiXXiE",
    title: "ติดฝน (rain)",
    artist: "PiXXiE",
    lang: "th",
    mood: "chill",
    bpm: "ปานกลาง (95 BPM)",
    tags: ["ติดฝนกับเธอ", "ร่มคันเดียว", "T-POP"],
    animeId: 241, // Blue Box
    reason: "โมเมนต์แอบหวังให้ฝนตกนานๆ เพื่อจะได้ยืนติดฝนอยู่ใต้ร่มคันเดียวกันกับเธอ",
    typoIdea: "หยดน้ำฝนไหลเกาะกระจก ตัวหนังสือใสสะท้อนแสงไฟนีออนริมถนนยามเย็น"
  },
  {
    query: "มูเตลู PiXXiE",
    title: "มูเตลู (MUTELU)",
    artist: "PiXXiE",
    lang: "th",
    mood: "hype",
    bpm: "เร็ว (125 BPM)",
    tags: ["สายมู", "ร่ายมนตร์รัก", "สนุกสนาน"],
    animeId: 231, // Dandadan
    reason: "ขอพรสิ่งศักดิ์สิทธิ์ให้เธอหันมารัก จังหวะสนุก ท่อนฮุคติดหู เต้นตามได้ทันที",
    typoIdea: "ยันต์สายมูและประกายเวทมนตร์สีชมพู ตัวหนังสือหมุนวนเหมือนกำลังร่ายคาถา"
  },
  {
    query: "ฉลามชอบงับคุณ Bonnadol",
    title: "ฉลามชอบงับคุณ",
    artist: "Bonnadol feat. IIVY B",
    lang: "th",
    mood: "love",
    bpm: "ปานกลาง (100 BPM)",
    tags: ["ฉลามงับ", "น่ารักเกินต้าน", "มุกจีบ"],
    animeId: 240, // Makeine
    reason: "เพลงจีบสุดน่ารักที่เป็นไวรัลเต้นทั่วบ้านทั่วเมือง 'ถ้าหากฉลามชอบงับคุณ ผมก็ชอบคุณงับ'",
    typoIdea: "ไอคอนครีบฉลามแหวกว่าย ตัวหนังสือกัดงับเด้งไปมาอย่างขี้เล่น"
  },

  // GLOBAL VIRAL & HITS (15)
  {
    query: "Die With A Smile Lady Gaga Bruno Mars",
    title: "Die With A Smile",
    artist: "Lady Gaga & Bruno Mars",
    lang: "en",
    mood: "love",
    bpm: "ช้า (79 BPM)",
    tags: ["เพลงรักระดับโลก", "คอรัสสะกดโลก", "ถ้าโลกจะแตก"],
    animeId: 244, // Chainsaw Man / Romance
    reason: "เพลงดูเอทแห่งทศวรรษ ถ้าโลกจะต้องอวสาน ขอแค่ได้ตายเคียงข้างเธอด้วยรอยยิ้ม",
    typoIdea: "สไตล์เรโทร 70s ไฟนีออนสีน้ำเงินอมส้ม ฟอนต์คลาสสิกตัวหนาพุ่งตามเสียงเปียโน"
  },
  {
    query: "Birds of a Feather Billie Eilish",
    title: "BIRDS OF A FEATHER",
    artist: "Billie Eilish",
    lang: "en",
    mood: "love",
    bpm: "ปานกลาง (105 BPM)",
    tags: ["บิลลี่ไอลิช", "รักจนวันตาย", "นุ่มนวลติดหู"],
    animeId: 241, // Blue Box
    reason: "ความรักที่ผูกพันกันเหมือนนกที่บินไปด้วยกันจนกว่าจะถึงวันสิ้นลมหายใจ",
    typoIdea: "ขนนกลอยละล่อง ตัวหนังสือมินิมอลสีครีม สะอาดตาและมีแสงฟุ้งอบอุ่น"
  },
  {
    query: "Espresso Sabrina Carpenter",
    title: "Espresso",
    artist: "Sabrina Carpenter",
    lang: "en",
    mood: "hype",
    bpm: "เร็ว (120 BPM)",
    tags: ["ซัมเมอร์ไวรัล", "มั่นใจตัวแม่", "คาเฟอีน"],
    animeId: 243, // Alya
    reason: "เพลงแดนซ์ป๊อปไวรัลอันดับหนึ่งของโลก เสน่ห์ที่ทำให้ใครๆ ก็นอนไม่หลับเหมือนดื่มเอสเปรสโซ",
    typoIdea: "แก้วกาแฟและแว่นกันแดดยุค 80s สไตล์ฟอนต์ลายมือสนุกสนานพร้อมจังหวะเบสหนึบ"
  },
  {
    query: "Golden Hour JVKE",
    title: "golden hour",
    artist: "JVKE",
    lang: "en",
    mood: "love",
    bpm: "ปานกลาง (94 BPM)",
    tags: ["แสงสีทอง", "เปียโนพริ้ว", "วินาทีหยุดโลก"],
    animeId: 239, // Look Back
    reason: "ท่อนเปียโนพริ้วไหวที่พาผู้ฟังล่องลอยสู่ช่วงเวลาทองคำแห่งการตกหลุมรัก",
    typoIdea: "แสงอาทิตย์สีทองทะลุผ่านละอองฝุ่น ตัวหนังสือสีทองคำเรืองรองระยับตา"
  },
  {
    query: "Until I Found You Stephen Sanchez",
    title: "Until I Found You",
    artist: "Stephen Sanchez",
    lang: "en",
    mood: "love",
    bpm: "ช้า (68 BPM)",
    tags: ["ดูว็อปยุค50s", "รักแท้", "อบอุ่นหัวใจ"],
    animeId: 241, // Blue Box
    reason: "บทเพลงดูว็อปกลิ่นอายคลาสสิกที่ทำให้รู้สึกว่าโลกใบนี้มีความหมายขึ้นมาเมื่อเจอเธอ",
    typoIdea: "สไตล์โปสเตอร์หนังรักยุค 1950s ฟอนต์ Script หรูหราและขอบเฟรมสีงาช้าง"
  },
  {
    query: "Glimpse of Us Joji",
    title: "Glimpse of Us",
    artist: "Joji",
    lang: "en",
    mood: "sad",
    bpm: "ช้า (72 BPM)",
    tags: ["ยังลืมเขาไม่ได้", "เปียโนเศร้า", "ดิ่งสุดขั้ว"],
    animeId: 249, // NieR Automata
    reason: "อยู่กับคนใหม่แต่ในแววตายังเห็นเพียงภาพเงาของเธอคนเก่า บาดลึกเข้าขั้วหัวใจ",
    typoIdea: "ภาพซ้อนโปร่งแสงของความทรงจำ ตัวหนังสือสีขาวหม่นซีดจาง ค่อยๆ ละลายหายไป"
  },
  {
    query: "Daylight David Kushner",
    title: "Daylight",
    artist: "David Kushner",
    lang: "en",
    mood: "sad",
    bpm: "ช้า (65 BPM)",
    tags: ["เสียงทุ้มกังวาน", "ดาร์กโกธิค", "บาปและแสงสว่าง"],
    animeId: 236, // Solo Leveling
    reason: "เสียงเบสทุ้มต่ำและเปียโนมืดหม่น ดั่งการวิ่งหนีความมืดมิดในใจไปสู่แสงตะวัน",
    typoIdea: "ตัวหนังสือสไตล์โบสถ์กอธิค ละอองหมอกสีเทาดำ และแสงลำส่องลงมาจากเบื้องบน"
  },
  {
    query: "Romantic Homicide d4vd",
    title: "Romantic Homicide",
    artist: "d4vd",
    lang: "en",
    mood: "sad",
    bpm: "ช้า (66 BPM)",
    tags: ["ตัดใจ", "ดาร์กอินดี้", "ความตายของรัก"],
    animeId: 244, // Chainsaw Man
    reason: "'In the back of my mind, I killed you' การบอกลาความรู้สึกเก่าแบบเด็ดขาดแต่เจ็บปวด",
    typoIdea: "โทนสีแดงเลือดหมูตัดดำ ตัวหนังสือแนว Typewriter กระตุกตามคอร์ดกีตาร์โปร่ง"
  },
  {
    query: "Here With Me d4vd",
    title: "Here With Me",
    artist: "d4vd",
    lang: "en",
    mood: "love",
    bpm: "ปานกลาง (84 BPM)",
    tags: ["อยู่ด้วยกันจนแก่", "โรแมนติกอินดี้", "ภาพยนตร์"],
    animeId: 233, // Frieren
    reason: "ความหวังที่จะได้อยู่เคียงข้างเธอจนกระทั่งแก่เฒ่า เข้ากับเรื่องราวของเวลาและความทรงจำ",
    typoIdea: "เกรนฟิล์ม 8mm แอนิเมชันตัวอักษรลายมือ เขียนลงบนกระดาษจดหมายเก่า"
  },
  {
    query: "Dandelions Ruth B",
    title: "Dandelions",
    artist: "Ruth B.",
    lang: "en",
    mood: "love",
    bpm: "ปานกลาง (118 BPM)",
    tags: ["ดอกแดนดิไลออน", "อธิษฐาน", "สดใสฟุ้งฝัน"],
    animeId: 233, // Frieren
    reason: "เป่าเกสรดอกแดนดิไลออนเพื่ออธิษฐานให้ได้รักเธอ เมโลดี้สดใสเปี่ยมความหวัง",
    typoIdea: "เกสรดอกไม้สีขาวปลิวว่อน ตัวหนังสือพริ้วละมุนมีแสงสะท้อนระยิบระยับ"
  },
  {
    query: "Ghost Justin Bieber",
    title: "Ghost",
    artist: "Justin Bieber",
    lang: "en",
    mood: "sad",
    bpm: "เร็ว (154 BPM)",
    tags: ["ถ้ากอดไม่ได้ขอกอดเงา", "คิดถึงคนไกล", "อะคูสติกป๊อป"],
    animeId: 239, // Look Back
    reason: "ถ้าหากแตะต้องตัวจริงไม่ได้ ขอเก็บเพียงเงาความทรงจำไว้กอดก็ยังดี",
    typoIdea: "ฟิลเตอร์กระจกฝ้ามัว ตัวหนังสือซ้อนทับภาพความทรงจำที่วิ่งผ่านไปอย่างรวดเร็ว"
  },
  {
    query: "As It Was Harry Styles",
    title: "As It Was",
    artist: "Harry Styles",
    lang: "en",
    mood: "chill",
    bpm: "เร็ว (174 BPM)",
    tags: ["ซินธ์ป๊อป", "ไม่มีอะไรเหมือนเดิม", "เต้นเหงาๆ"],
    animeId: 234, // Dungeon Meshi
    reason: "จังหวะซินธ์ป๊อปเต้นรำแต่เนื้อหากล่าวถึงการเปลี่ยนแปลงและความโดดเดี่ยว",
    typoIdea: "ตัวอักษรกลมมินิมอล หมุนตามแป้นหมุนเสียงดนตรี คุมโทนสีฟ้า แดง และเหลืองสดใส"
  },
  {
    query: "Another Love Tom Odell",
    title: "Another Love",
    artist: "Tom Odell",
    lang: "en",
    mood: "sad",
    bpm: "ช้า (62 BPM)",
    tags: ["หมดแรงจะรักใคร", "เปียโนทรงพลัง", "น้ำตาไหล"],
    animeId: 248, // Bleach / Sad
    reason: "ความเหนื่อยล้าจนแทบไม่มีแรงจะรักใครได้อีก บทเพลงที่ยอดนิยมในการตัดคลิปสะเทือนอารมณ์",
    typoIdea: "ตัวหนังสือสั่นไหวและแตกกระจายเมื่อเสียงกลองไคลแม็กซ์ระเบิดขึ้น"
  },
  {
    query: "Mockingbird Eminem",
    title: "Mockingbird",
    artist: "Eminem",
    lang: "en",
    mood: "sad",
    bpm: "ปานกลาง (84 BPM)",
    tags: ["ความรักครอบครัว", "กล่องดนตรี", "แร็ปบาดลึก"],
    animeId: 235, // Wind Breaker
    reason: "เสียงกล่องดนตรีกล่อมเด็กกับไรม์แร็ปสุดจริงใจของผู้เป็นพ่อ ไวรัลตลอดกาลสำหรับซีนปกป้องคนสำคัญ",
    typoIdea: "ฟอนต์แบบสตรีทแต่มีเส้นแสงนุ่มนวล ค่อยๆ พิมพ์ขึ้นตามความเร็วในการเล่าเรื่อง"
  },
  {
    query: "Can't Hold Us Macklemore",
    title: "Can't Hold Us",
    artist: "Macklemore & Ryan Lewis feat. Ray Dalton",
    lang: "en",
    mood: "hype",
    bpm: "เร็ว (146 BPM)",
    tags: ["ไม่มีอะไรหยุดเราได้", "พลังเต็มร้อย", "ฮาร์ดคัต"],
    animeId: 242, // Haikyu
    reason: "เพลงพลังบวกสุดมันส์ จังหวะตบมือและเปียโนสปีดสูง เหมาะกับช็อตชิงชัยชนะในวินาทีสุดท้าย",
    typoIdea: "ตัวหนังสือ Extra Bold กระแทกตามจังหวะปรบมือ หมุนมุมกล้อง 3D กระตุ้นอะดรีนาลีน"
  }
];

async function run() {
  console.log(`Searching iTunes for ${songCandidates.length} songs...`);
  const finalSongs = [];
  let songId = 501;

  for (let i = 0; i < songCandidates.length; i++) {
    const sc = songCandidates[i];
    console.log(`[${i + 1}/${songCandidates.length}] Searching: ${sc.query}`);
    let results = await itunesSearch(sc.query);
    let best = results[0];
    if (!best) {
      console.log(`  Fallback searching for title: ${sc.title}`);
      results = await itunesSearch(`${sc.title} ${sc.artist}`);
      best = results[0] || {};
    }

    const coverUrl = best.artworkUrl100
      ? best.artworkUrl100.replace('100x100bb', '600x600bb')
      : 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/bf/16/9d/bf169dae-40dc-5431-7fb1-c30c1be7847c/886445592816.jpg/600x600bb.jpg';

    const previewUrl = best.previewUrl || '';
    const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(sc.title + ' ' + sc.artist)}`;

    finalSongs.push({
      id: songId++,
      title: sc.title,
      artist: sc.artist,
      coverUrl: coverUrl,
      previewUrl: previewUrl,
      spotifyUrl: spotifyUrl,
      mood: sc.mood,
      tags: sc.tags,
      bpm: sc.bpm,
      lang: sc.lang,
      animeId: sc.animeId,
      animeMatch: [sc.animeId],
      reason: sc.reason,
      typoIdea: sc.typoIdea
    });
  }

  fs.writeFileSync('new_songs_batch.json', JSON.stringify(finalSongs, null, 2));
  console.log(`✅ Saved ${finalSongs.length} songs to new_songs_batch.json`);
}

run();
