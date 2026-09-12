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

// Candidates for 251 - 300
const candidates = [
  // 1-15: Anime Mega Anthems & Viral TikTok/Lofi
  { query: "Fly Me to the Moon Claire Littley", title: "Fly Me to the Moon", artist: "Claire Littley", category: "vibe", animeId: 18, badge: "🌕 ชิลล์คลาสสิก ล่องลอย" },
  { query: "Blue Bird Ikimonogakari", title: "Blue Bird", artist: "Ikimonogakari", category: "hype", animeId: 10, badge: "⚡ พลังใจ ฮาร์ดคัตเท่ๆ" },
  { query: "Sign FLOW Naruto", title: "Sign", artist: "FLOW", category: "sad", animeId: 10, badge: "💔 น้ำตาซึม ดิ่งลึก" },
  { query: "Again YUI Fullmetal Alchemist", title: "Again", artist: "YUI", category: "hype", animeId: 9, badge: "🔥 สปีดรัน บีทหนักแน่น" },
  { query: "Gurenge LiSA", title: "Gurenge", artist: "LiSA", category: "hype", animeId: 5, badge: "⚡ แอคชั่นระเบิด ฟันดาบเป๊ะ" },
  { query: "Homura LiSA Demon Slayer", title: "Homura", artist: "LiSA", category: "sad", animeId: 5, badge: "🥀 อาลัยอาวรณ์ ซึ้งกินใจ" },
  { query: "Akuma no Ko Ai Higuchi", title: "Akuma no Ko", artist: "Ai Higuchi", category: "sad", animeId: 4, badge: "💔 โลกที่โหดร้ายแต่ยังรักเธอ" },
  { query: "Shinzou wo Sasageyo Linked Horizon", title: "Shinzou wo Sasageyo!", artist: "Linked Horizon", category: "hype", animeId: 4, badge: "⚔️ พลีชีพเพื่ออิสรภาพ" },
  { query: "Red Swan YOSHIKI feat. HYDE", title: "Red Swan", artist: "YOSHIKI feat. HYDE", category: "vibe", animeId: 4, badge: "🕊️ บินสู่นภา กว้างใหญ่" },
  { query: "Mephisto Queen Bee", title: "Mephisto", artist: "Queen Bee", category: "hype", animeId: 15, badge: "🎭 ดาร์กอลังการ ทวิสต์สะเทือน" },
  { query: "odoriko Vaundy", title: "odoriko", artist: "Vaundy", category: "vibe", animeId: 81, badge: "✨ โฟลว์ชิลล์ โคตรมีสไตล์" },
  { query: "Kaijuu no Hanauta Vaundy", title: "Kaijuu no Hanauta", artist: "Vaundy", category: "hype", animeId: 81, badge: "⚡ ร้องตะโกน ความเยาว์วัย" },
  { query: "Sweater Weather The Neighbourhood", title: "Sweater Weather", artist: "The Neighbourhood", category: "vibe", animeId: 2, badge: "🧥 หนาวใจแต่มีเธอ โรแมนติก" },
  { query: "Night Changes One Direction", title: "Night Changes", artist: "One Direction", category: "love", animeId: 2, badge: "🕰️ กาลเวลาเปลี่ยนแต่ใจไม่เปลี่ยน" },
  { query: "Duvet boa", title: "Duvet", artist: "bôa", category: "vibe", animeId: 104, badge: "🌀 เวิ้งว้าง ดำดิ่งจิตวิทยา" },

  // 16-30: Thai Viral Indie & Love Typography
  { query: "ลบไม่ได้ช่วยให้ลืม Ink Waruntorn", title: "ลบไม่ได้ช่วยให้ลืม (Erase)", artist: "Ink Waruntorn", category: "sad", animeId: 1, badge: "🥀 พยายามลบแต่ยิ่งจำ" },
  { query: "สายตาหลอกกันไม่ได้ Ink Waruntorn", title: "สายตาหลอกกันไม่ได้", artist: "Ink Waruntorn", category: "love", animeId: 3, badge: "👀 สบตาแล้วใจเต้นรัว" },
  { query: "เก่งแต่เรื่องคนอื่น Ink Waruntorn", title: "เก่งแต่เรื่องคนอื่น", artist: "Ink Waruntorn feat. Sprite", category: "vibe", animeId: 44, badge: "💬 สอนคนอื่นเก่ง เรื่องตัวเองพัง" },
  { query: "แฟนเก่าคนโปรด SLAPKISS", title: "แฟนเก่าคนโปรด", artist: "SLAPKISS", category: "sad", animeId: 14, badge: "💔 คนที่ลืมไม่ลงตลอดกาล" },
  { query: "ให้เค้าดูแลเธอ Three Man Down", title: "ให้เค้าดูแลเธอ", artist: "Three Man Down", category: "sad", animeId: 1, badge: "🌧️ ยอมปล่อยให้เธอไปมีความสุข" },
  { query: "เวลาเธอยิ้ม POLYCAT", title: "เวลาเธอยิ้ม", artist: "POLYCAT", category: "love", animeId: 13, badge: "💖 โลกสดใสเมื่อเห็นเธอยิ้ม" },
  { query: "อาวรณ์ POLYCAT", title: "อาวรณ์ (I Want You)", artist: "POLYCAT", category: "sad", animeId: 8, badge: "🍷 ฉันยังคงคิดถึงเธอเสมอ" },
  { query: "พบกันใหม่ POLYCAT", title: "พบกันใหม่? (So Long)", artist: "POLYCAT", category: "sad", animeId: 2, badge: "👋 ลาก่อนแม้ใจยังรัก" },
  { query: "เพื่อนรัก The Parkinson", title: "เพื่อนรัก (Dear Friend)", artist: "The Parkinson", category: "sad", animeId: 14, badge: "🥀 รักเพื่อนแต่พูดไม่ได้" },
  { query: "หมดแก้ว The Parkinson", title: "หมดแก้ว (Cheers)", artist: "The Parkinson", category: "sad", animeId: 24, badge: "🍻 ดื่มย้อมใจให้ความทรงจำ" },
  { query: "บานปลาย Bowkylion", title: "บานปลาย (Best Wishes)", artist: "Bowkylion", category: "love", animeId: 43, badge: "🌸 แอบชอบจนเลยเถิด" },
  { query: "ทราบแล้วเปลี่ยน Bowkylion", title: "ทราบแล้วเปลี่ยน (Post-it)", artist: "Bowkylion", category: "love", animeId: 3, badge: "💌 ข้อความบอกรักน่ารักๆ" },
  { query: "เจ้าของที่ Mirrr", title: "เจ้าของที่", artist: "Mirrr", category: "love", animeId: 44, badge: "🏡 หัวใจฉันมีเธอเป็นเจ้าของ" },
  { query: "เลือดกรุ๊ปบี B Blood Chrrissa", title: "เลือดกรุ๊ปบี", artist: "Chrrissa Chot", category: "vibe", animeId: 44, badge: "🩸 โสดเพราะเลือดกรุ๊ปบีแน่ๆ" },
  { query: "ยินดี Sarah Salola", title: "ยินดี (Happy For You)", artist: "Sarah Salola", category: "sad", animeId: 8, badge: "🙂 ยิ้มส่งทั้งน้ำตา" },

  // 31-45: Thai Hype, Chill, Modern Hits
  { query: "เอาปากกามาวง Bell Warisara", title: "เอาปากกามาวง", artist: "Bell Warisara", category: "love", animeId: 43, badge: "🖊️ ตรงไหนไม่ชอบให้วง" },
  { query: "คนหรือไมโครเวฟ Bell Warisara", title: "คนหรือไมโครเวฟ (Microwave)", artist: "Bell Warisara", category: "love", animeId: 44, badge: "☀️ อบอุ่นจนใจละลาย" },
  { query: "กอดในใจ Billkin Jaylerr", title: "กอดในใจ (One Ok)", artist: "Billkin feat. Jaylerr", category: "love", animeId: 14, badge: "🫂 คิดถึงจึงกอดไว้ในใจ" },
  { query: "แปลไม่ออก Billkin", title: "แปลไม่ออก", artist: "Billkin", category: "sad", animeId: 1, badge: "❓ การกระทำที่เธอไม่เคยชัดเจน" },
  { query: "โคตรพิเศษ Billkin", title: "โคตรพิเศษ", artist: "Billkin", category: "love", animeId: 2, badge: "✨ คนที่พิเศษที่สุดในชีวิต" },
  { query: "Mr. Everything Billkin", title: "Mr. Everything", artist: "Billkin", category: "love", animeId: 13, badge: "🎁 เป็นทุกอย่างให้เธอแล้ว" },
  { query: "พิง NONT TANONT", title: "พิง", artist: "NONT TANONT", category: "love", animeId: 8, badge: "🛋️ เหนื่อยเมื่อไหร่ก็มาพิงฉัน" },
  { query: "ทุกนาทีที่สวยงาม NONT TANONT", title: "ทุกนาทีที่สวยงาม (Always With Me)", artist: "NONT TANONT", category: "love", animeId: 3, badge: "⏳ ทุกวินาทีมีค่าเมื่อมีเธอ" },
  { query: "จำนน NONT TANONT", title: "จำนน (White Flag)", artist: "NONT TANONT", category: "sad", animeId: 14, badge: "🏳️ ยอมแพ้ต่อความรักของเธอ" },
  { query: "เจ็บจริง NONT TANONT", title: "เจ็บจริง", artist: "NONT TANONT", category: "sad", animeId: 1, badge: "💔 เจ็บจริงไม่ได้แกล้งทำ" },
  { query: "เสแสร้ง Paper Planes", title: "เสแสร้ง (Pretend)", artist: "Paper Planes feat. MOON", category: "hype", animeId: 3, badge: "🎸 ร็อคเจ็บลึก บีทหนักสะใจ" },
  { query: "ทรงอย่างแบด Paper Planes", title: "ทรงอย่างแบด (Bad Boy)", artist: "Paper Planes", category: "hype", animeId: 6, badge: "⚡ เพลงชาติวัยรุ่นฟันน้ำนม" },
  { query: "ดวงเดือน JOEY PHUWASIT", title: "ดวงเดือน", artist: "JOEY PHUWASIT", category: "sad", animeId: 1, badge: "🌙 มองจันทร์ดวงเดียวกัน" },
  { query: "สาริกาลิ้นทอง Paper Planes Joey Phuwasit", title: "สาริกาลิ้นทอง", artist: "Paper Planes x Joey Phuwasit", category: "hype", animeId: 7, badge: "🔥 ฟังก์ร็อคไทยร่วมสมัยสุดมันส์" },
  { query: "คนละชั้น Jaonaay", title: "คนละชั้น", artist: "Jaonaay", category: "vibe", animeId: 14, badge: "🪜 อยู่ไกลเกินเอื้อมถึง" },

  // 46-50: Modern Grand Masterpieces
  { query: "พูดทำไม ตู่ ภพธร", title: "พูดทำไม", artist: "ตู่ ภพธร", category: "sad", animeId: 2, badge: "🥀 จะพูดทำไมถ้าไม่ได้รัก" },
  { query: "โปรดเถอะ แพรว คณิตกุล", title: "โปรดเถอะ", artist: "แพรว คณิตกุล", category: "love", animeId: 3, badge: "🥺 ขอร้องให้เธอหันมามอง" },
  { query: "มีใจก็ทักมา Jeff Satur", title: "มีใจก็ทักมา", artist: "Jeff Satur", category: "vibe", animeId: 44, badge: "📱 อย่าปล่อยให้รอตอบแชท" },
  { query: "ลืมแทบไม่ไหว SARAN", title: "ลืมแทบไม่ไหว", artist: "SARAN feat. Maimhon", category: "sad", animeId: 1, badge: "🎙️ โฟลว์แร็ปบาดลึกถึงกระดูก" },
  { query: "สลักจิต ป๊อบ ปองกูล ดา เอ็นโดรฟิน", title: "สลักจิต", artist: "Pop Pongkool x Da Endorphine", category: "sad", animeId: 8, badge: "🖤 สลักไว้ในหัวใจชั่วนิรันดร์" }
];

async function run() {
  console.log('Searching iTunes for 50 candidates...');
  const results = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const items = await itunesSearch(c.query);
    let best = items[0];
    if (!best && c.artist) {
      const fallbackItems = await itunesSearch(c.title);
      best = fallbackItems[0];
    }

    let previewUrl = best ? best.previewUrl : '';
    let cover = best ? best.artworkUrl100.replace('100x100bb', '600x600bb') : '';
    let duration = best ? Math.floor(best.trackTimeMillis / 1000) : 210;

    results.push({
      id: 251 + i,
      title: c.title,
      artist: c.artist,
      category: c.category,
      duration: duration,
      previewUrl: previewUrl,
      coverUrl: cover,
      animeId: c.animeId,
      badge: c.badge
    });
    console.log(`[${i + 1}/${candidates.length}] ${c.title} -> ${previewUrl ? 'OK' : 'MISSING PREVIEW'}`);
  }

  fs.writeFileSync('batch5_songs_raw.json', JSON.stringify(results, null, 2));
  console.log('Done searching! Saved to batch5_songs_raw.json');
}

run();
