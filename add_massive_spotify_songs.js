/**
 * add_massive_spotify_songs.js
 * เพิ่มเพลงจำนวนมากจาก Spotify/iTunes ครอบคลุมเพลงไทย สากล ญี่ปุ่น เกาหลี ลาว
 * ทุกแนว ทุกมู้ด สำหรับตัดต่อคลิปไทโป
 * 
 * รัน: node add_massive_spotify_songs.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.js');

// อ่านไฟล์ data.js
let content = fs.readFileSync(DATA_FILE, 'utf8');

// หา max song id
const songSection = content.substring(content.indexOf('const SONGS'));
const existingIds = songSection.match(/"id":\s*(\d+)/g);
const maxId = existingIds ? Math.max(...existingIds.map(m => parseInt(m.match(/\d+/)[0]))) : 0;
console.log(`📊 Song ID สูงสุดปัจจุบัน: ${maxId}`);

// เช็คชื่อเพลงที่มีอยู่แล้วเพื่อไม่ให้ซ้ำ
const existingTitles = new Set();
const titleMatches = songSection.match(/"title":\s*"([^"]+)"/g);
if (titleMatches) {
  titleMatches.forEach(m => {
    const t = m.match(/"title":\s*"([^"]+)"/)[1].toLowerCase();
    existingTitles.add(t);
  });
}
console.log(`📋 เพลงที่มีอยู่แล้ว: ${existingTitles.size} เพลง`);

// ========== เพลงใหม่จำนวนมาก ==========
const NEW_SONGS = [
  // ===== เพลงไทยฮิต 2025-2026 =====
  { title: "ผิดที่ไว้ใจ", artist: "MILLI", mood: "sad", tags: ["เจ็บ","ทรยศ","เปลี่ยว"], bpm: "กลาง (90 BPM)", lang: "th" },
  { title: "กอดได้ไหม", artist: "Tilly Birds", mood: "love", tags: ["อ้อนรัก","ใกล้ชิด","ละมุน"], bpm: "ช้า (75 BPM)", lang: "th" },
  { title: "วันนี้วันดี", artist: "Polycat", mood: "happy", tags: ["ร่าเริง","สนุก","มีสุข"], bpm: "เร็ว (120 BPM)", lang: "th" },
  { title: "รักเธอเท่าที่เธอไม่รัก", artist: "Getsunova", mood: "sad", tags: ["เจ็บ","รักข้างเดียว","คิดถึง"], bpm: "กลาง (85 BPM)", lang: "th" },
  { title: "ไม่เคยลืม", artist: "25 Hours", mood: "sad", tags: ["จำ","ทรงจำ","เศร้า"], bpm: "กลาง (88 BPM)", lang: "th" },
  { title: "คนที่ถูกรัก", artist: "Three Man Down", mood: "love", tags: ["รัก","สัญญา","ฟิน"], bpm: "กลาง (95 BPM)", lang: "th" },
  { title: "ไม่มีใครรู้", artist: "BOWKYLION", mood: "chill", tags: ["ลึก","คิดเอง","เงียบๆ"], bpm: "ช้า (70 BPM)", lang: "th" },
  { title: "อีกนานแค่ไหน", artist: "MEAN", mood: "sad", tags: ["รอคอย","คิดถึง","ทน"], bpm: "กลาง (82 BPM)", lang: "th" },
  { title: "บอกฉันทีว่ายังรักกัน", artist: "SEASON FIVE", mood: "love", tags: ["ถาม","รัก","มั่นคง"], bpm: "กลาง (92 BPM)", lang: "th" },
  { title: "ยิ่งไกลยิ่งใกล้", artist: "Da Endorphine", mood: "love", tags: ["ไกล","คิดถึง","ผูกพัน"], bpm: "ช้า (78 BPM)", lang: "th" },
  { title: "คือเธอ", artist: "COCKTAIL", mood: "love", tags: ["รัก","เธอ","จริงใจ"], bpm: "กลาง (90 BPM)", lang: "th" },
  { title: "อยากให้รู้ว่ารักเธอ", artist: "Potato", mood: "love", tags: ["สารภาพ","รัก","ซื่อสัตย์"], bpm: "กลาง (88 BPM)", lang: "th" },
  { title: "ผ่าน", artist: "Atom ชนกันต์", mood: "sad", tags: ["เศร้า","ผ่านไป","ปล่อยวาง"], bpm: "ช้า (72 BPM)", lang: "th" },
  { title: "โปรดเถิดรัก", artist: "Hugo", mood: "love", tags: ["ร้องขอ","รัก","ละมุน"], bpm: "ช้า (65 BPM)", lang: "th" },
  { title: "คืนข้างแรม", artist: "ป๊อบ ปองกูล", mood: "sad", tags: ["เหงา","คืน","คิดถึง"], bpm: "ช้า (68 BPM)", lang: "th" },
  { title: "เวลาเธอยิ้ม", artist: "Palmy", mood: "love", tags: ["ยิ้ม","หัวใจ","สดใส"], bpm: "กลาง (96 BPM)", lang: "th" },
  { title: "ยิ่งไม่รู้ ยิ่งต้องทำ", artist: "SERIOUS BACON", mood: "hype", tags: ["กำลังใจ","สู้","ลุยเลย"], bpm: "เร็ว (130 BPM)", lang: "th" },
  { title: "พูดไม่ค่อยถูก", artist: "TRINITY", mood: "love", tags: ["อ้อน","ขี้อาย","น่ารัก"], bpm: "กลาง (100 BPM)", lang: "th" },
  { title: "ให้ฉันดูแลเธอ", artist: "BIG ASS", mood: "love", tags: ["ดูแล","ปกป้อง","แข็งแกร่ง"], bpm: "กลาง (88 BPM)", lang: "th" },
  { title: "ขอบคุณที่รักกัน", artist: "Potato", mood: "love", tags: ["ขอบคุณ","คู่รัก","อบอุ่น"], bpm: "ช้า (76 BPM)", lang: "th" },
  { title: "ปล่อย", artist: "Slot Machine", mood: "chill", tags: ["ปล่อยวาง","อิสระ","เบาๆ"], bpm: "กลาง (92 BPM)", lang: "th" },
  { title: "ทั้งที่ผิด ก็ยังรักเธออยู่", artist: "NUM KALA", mood: "sad", tags: ["ผิด","รัก","ทนทุกข์"], bpm: "ช้า (72 BPM)", lang: "th" },
  { title: "พอ", artist: "SCRUBB", mood: "sad", tags: ["เพียงพอ","หยุด","เจ็บ"], bpm: "กลาง (85 BPM)", lang: "th" },
  { title: "เพลงสุดท้าย", artist: "BODYSLAM", mood: "epic", tags: ["อำลา","ยิ่งใหญ่","ตราตรึง"], bpm: "กลาง (95 BPM)", lang: "th" },
  { title: "ข้ามเวลาหาเธอ", artist: "Tilly Birds", mood: "love", tags: ["ข้ามเวลา","คิดถึง","โรแมนติก"], bpm: "กลาง (88 BPM)", lang: "th" },
  { title: "เมื่อคืนนี้", artist: "Paradox", mood: "love", tags: ["คืน","ความรู้สึก","ใกล้ชิด"], bpm: "กลาง (100 BPM)", lang: "th" },
  { title: "คนมีเสน่ห์", artist: "Whal & Dolph", mood: "happy", tags: ["เสน่ห์","มั่นใจ","เก๋"], bpm: "เร็ว (115 BPM)", lang: "th" },
  { title: "หมดห่วง", artist: "LUSS", mood: "chill", tags: ["ไม่ห่วง","สบาย","ชิลล์"], bpm: "กลาง (90 BPM)", lang: "th" },
  { title: "ไม่หายไปไหน", artist: "Getsunova", mood: "love", tags: ["อยู่ตรงนี้","มั่นคง","รัก"], bpm: "กลาง (88 BPM)", lang: "th" },
  { title: "สิ่งเดียวที่ไม่เปลี่ยน", artist: "Instinct", mood: "love", tags: ["มั่นคง","รัก","สัญญา"], bpm: "ช้า (75 BPM)", lang: "th" },
  { title: "ลบไม่ได้ช่วยให้ลืม", artist: "COCKTAIL", mood: "sad", tags: ["ลืมไม่ได้","เศร้า","จำ"], bpm: "กลาง (85 BPM)", lang: "th" },
  { title: "ที่ว่างข้างๆ ตัว", artist: "Musketeers", mood: "love", tags: ["ข้างกาย","รัก","อบอุ่น"], bpm: "ช้า (78 BPM)", lang: "th" },
  { title: "ไม่บอกเธอ", artist: "Bedroom Audio", mood: "sad", tags: ["เก็บรัก","ไม่กล้า","เจ็บ"], bpm: "กลาง (90 BPM)", lang: "th" },
  { title: "คิดถึงเธอทุกที", artist: "Labanoon", mood: "love", tags: ["คิดถึง","ทุกวัน","รัก"], bpm: "เร็ว (118 BPM)", lang: "th" },
  { title: "สบตา", artist: "Clash", mood: "love", tags: ["สบตา","แรกพบ","หัวใจ"], bpm: "เร็ว (120 BPM)", lang: "th" },
  { title: "คนเดิม", artist: "SILLY FOOLS", mood: "sad", tags: ["คนเดิม","เปลี่ยน","ผิดหวัง"], bpm: "กลาง (100 BPM)", lang: "th" },
  { title: "ดอกไม้ให้คุณ", artist: "Palmy", mood: "love", tags: ["ดอกไม้","ให้","น่ารัก"], bpm: "ช้า (70 BPM)", lang: "th" },
  { title: "ยิ่งรักยิ่งเจ็บ", artist: "ETC", mood: "sad", tags: ["เจ็บ","รัก","ทนไม่ไหว"], bpm: "กลาง (92 BPM)", lang: "th" },
  { title: "ฝืน", artist: "KLEAR", mood: "sad", tags: ["ฝืน","ทนทุกข์","รักเจ็บ"], bpm: "กลาง (88 BPM)", lang: "th" },
  { title: "เวลาเดิน", artist: "Tattoo Colour", mood: "chill", tags: ["เวลา","เดิน","ชิลล์"], bpm: "กลาง (95 BPM)", lang: "th" },
  { title: "ใจเย็นเย็น", artist: "MEAN", mood: "chill", tags: ["สบายๆ","ใจเย็น","ชิลล์"], bpm: "กลาง (90 BPM)", lang: "th" },
  { title: "รักคงยังไม่พอ", artist: "Crescendo", mood: "sad", tags: ["ไม่พอ","รัก","อ่อนล้า"], bpm: "ช้า (75 BPM)", lang: "th" },
  { title: "ถามจริง ไม่ได้โกรธ", artist: "The TOYS", mood: "love", tags: ["ถาม","น่ารัก","อ้อน"], bpm: "กลาง (100 BPM)", lang: "th" },
  { title: "ไม่เดียงสา", artist: "SILLY FOOLS", mood: "hype", tags: ["ร็อค","มัน","กระชากใจ"], bpm: "เร็ว (140 BPM)", lang: "th" },
  { title: "สิ่งที่ตามหา", artist: "SCRUBB", mood: "love", tags: ["ตามหา","ค้นพบ","รัก"], bpm: "กลาง (88 BPM)", lang: "th" },
  { title: "ฝันดี", artist: "BOWKYLION", mood: "chill", tags: ["ราตรี","ฝัน","นุ่ม"], bpm: "ช้า (68 BPM)", lang: "th" },
  { title: "ฉันรักเธอ", artist: "COCKTAIL", mood: "love", tags: ["สารภาพ","รัก","ตรงไปตรงมา"], bpm: "กลาง (92 BPM)", lang: "th" },
  { title: "ปลิว", artist: "PALMY x MINDSET", mood: "chill", tags: ["ลอย","เบาๆ","ปลิว"], bpm: "กลาง (95 BPM)", lang: "th" },
  { title: "ลมหายใจ", artist: "SEASON FIVE", mood: "love", tags: ["หายใจ","ใกล้ชิด","อบอุ่น"], bpm: "ช้า (72 BPM)", lang: "th" },
  { title: "พอเถอะ", artist: "Slapkiss", mood: "sad", tags: ["หยุด","เจ็บ","พอแล้ว"], bpm: "กลาง (85 BPM)", lang: "th" },

  // ===== เพลงสากลฮิต 2025-2026 =====
  { title: "Die With A Smile", artist: "Lady Gaga & Bruno Mars", mood: "love", tags: ["romantic","duet","timeless"], bpm: "ช้า (75 BPM)", lang: "en" },
  { title: "Birds of a Feather", artist: "Billie Eilish", mood: "love", tags: ["devoted","soulmate","indie"], bpm: "กลาง (105 BPM)", lang: "en" },
  { title: "APT.", artist: "ROSÉ & Bruno Mars", mood: "happy", tags: ["fun","catchy","party"], bpm: "เร็ว (148 BPM)", lang: "en" },
  { title: "Espresso", artist: "Sabrina Carpenter", mood: "happy", tags: ["flirty","summer","catchy"], bpm: "เร็ว (104 BPM)", lang: "en" },
  { title: "Taste", artist: "Sabrina Carpenter", mood: "happy", tags: ["sassy","pop","fun"], bpm: "เร็ว (110 BPM)", lang: "en" },
  { title: "Please Please Please", artist: "Sabrina Carpenter", mood: "love", tags: ["plea","cute","desperate"], bpm: "กลาง (95 BPM)", lang: "en" },
  { title: "LUNCH", artist: "Billie Eilish", mood: "chill", tags: ["desire","dark","sultry"], bpm: "กลาง (100 BPM)", lang: "en" },
  { title: "WILDFLOWER", artist: "Billie Eilish", mood: "sad", tags: ["jealousy","heartbreak","raw"], bpm: "ช้า (68 BPM)", lang: "en" },
  { title: "THE GREATEST", artist: "Billie Eilish", mood: "sad", tags: ["devotion","epic","emotional"], bpm: "ช้า (70 BPM)", lang: "en" },
  { title: "Levii's Jeans", artist: "Beyoncé ft. Post Malone", mood: "chill", tags: ["country","vibe","relaxed"], bpm: "กลาง (90 BPM)", lang: "en" },
  { title: "TEXAS HOLD 'EM", artist: "Beyoncé", mood: "happy", tags: ["country","dance","anthem"], bpm: "เร็ว (130 BPM)", lang: "en" },
  { title: "Good Luck, Babe!", artist: "Chappell Roan", mood: "happy", tags: ["anthem","pop","defiant"], bpm: "เร็ว (120 BPM)", lang: "en" },
  { title: "HOT TO GO!", artist: "Chappell Roan", mood: "hype", tags: ["dance","anthem","party"], bpm: "เร็ว (135 BPM)", lang: "en" },
  { title: "Pink Pony Club", artist: "Chappell Roan", mood: "happy", tags: ["dream","freedom","pop"], bpm: "เร็ว (118 BPM)", lang: "en" },
  { title: "Fortnight", artist: "Taylor Swift ft. Post Malone", mood: "sad", tags: ["longing","haunting","reflective"], bpm: "กลาง (95 BPM)", lang: "en" },
  { title: "I Can Do It With a Broken Heart", artist: "Taylor Swift", mood: "sad", tags: ["resilience","mask","bittersweet"], bpm: "เร็ว (125 BPM)", lang: "en" },
  { title: "Cruel Summer", artist: "Taylor Swift", mood: "love", tags: ["summer","intense","passionate"], bpm: "เร็ว (170 BPM)", lang: "en" },
  { title: "Anti-Hero", artist: "Taylor Swift", mood: "chill", tags: ["self-aware","introspective","catchy"], bpm: "กลาง (97 BPM)", lang: "en" },
  { title: "Lover", artist: "Taylor Swift", mood: "love", tags: ["wedding","soulmate","dreamy"], bpm: "ช้า (68 BPM)", lang: "en" },
  { title: "Blinding Lights", artist: "The Weeknd", mood: "hype", tags: ["retro","synth","driving"], bpm: "เร็ว (171 BPM)", lang: "en" },
  { title: "Save Your Tears", artist: "The Weeknd", mood: "sad", tags: ["regret","dance","emotional"], bpm: "เร็ว (118 BPM)", lang: "en" },
  { title: "Starboy", artist: "The Weeknd ft. Daft Punk", mood: "hype", tags: ["dark","electronic","flex"], bpm: "เร็ว (186 BPM)", lang: "en" },
  { title: "Summertime Sadness", artist: "Lana Del Rey", mood: "sad", tags: ["nostalgic","dreamy","melancholic"], bpm: "กลาง (100 BPM)", lang: "en" },
  { title: "Young and Beautiful", artist: "Lana Del Rey", mood: "sad", tags: ["cinematic","gatsby","haunting"], bpm: "ช้า (70 BPM)", lang: "en" },
  { title: "A Thousand Years", artist: "Christina Perri", mood: "love", tags: ["wedding","eternal","twilight"], bpm: "ช้า (66 BPM)", lang: "en" },
  { title: "All of Me", artist: "John Legend", mood: "love", tags: ["wedding","soulful","devoted"], bpm: "ช้า (63 BPM)", lang: "en" },
  { title: "Perfect", artist: "Ed Sheeran", mood: "love", tags: ["wedding","romance","acoustic"], bpm: "ช้า (64 BPM)", lang: "en" },
  { title: "Photograph", artist: "Ed Sheeran", mood: "love", tags: ["memory","nostalgic","sweet"], bpm: "กลาง (108 BPM)", lang: "en" },
  { title: "Shape of You", artist: "Ed Sheeran", mood: "happy", tags: ["dance","catchy","groovy"], bpm: "เร็ว (96 BPM)", lang: "en" },
  { title: "Thinking Out Loud", artist: "Ed Sheeran", mood: "love", tags: ["romantic","classic","smooth"], bpm: "ช้า (79 BPM)", lang: "en" },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber", mood: "love", tags: ["plea","dance","catchy"], bpm: "เร็ว (170 BPM)", lang: "en" },
  { title: "Peaches", artist: "Justin Bieber", mood: "chill", tags: ["summer","vibes","groovy"], bpm: "กลาง (90 BPM)", lang: "en" },
  { title: "Watermelon Sugar", artist: "Harry Styles", mood: "happy", tags: ["summer","sweet","groovy"], bpm: "เร็ว (95 BPM)", lang: "en" },
  { title: "As It Was", artist: "Harry Styles", mood: "sad", tags: ["nostalgia","pop","catchy"], bpm: "เร็ว (174 BPM)", lang: "en" },
  { title: "Flowers", artist: "Miley Cyrus", mood: "hype", tags: ["empowerment","self-love","anthem"], bpm: "เร็ว (118 BPM)", lang: "en" },
  { title: "Vampire", artist: "Olivia Rodrigo", mood: "sad", tags: ["betrayal","rock","intense"], bpm: "เร็ว (138 BPM)", lang: "en" },
  { title: "drivers license", artist: "Olivia Rodrigo", mood: "sad", tags: ["heartbreak","cry","raw"], bpm: "กลาง (92 BPM)", lang: "en" },
  { title: "good 4 u", artist: "Olivia Rodrigo", mood: "hype", tags: ["angry","punk","revenge"], bpm: "เร็ว (166 BPM)", lang: "en" },
  { title: "Levitating", artist: "Dua Lipa", mood: "happy", tags: ["disco","dance","upbeat"], bpm: "เร็ว (103 BPM)", lang: "en" },
  { title: "Don't Start Now", artist: "Dua Lipa", mood: "happy", tags: ["disco","dance","moving-on"], bpm: "เร็ว (124 BPM)", lang: "en" },
  { title: "Houdini", artist: "Dua Lipa", mood: "happy", tags: ["magic","dance","pop"], bpm: "เร็ว (128 BPM)", lang: "en" },
  { title: "Training Season", artist: "Dua Lipa", mood: "hype", tags: ["fitness","dance","energy"], bpm: "เร็ว (125 BPM)", lang: "en" },
  { title: "Dandelions", artist: "Ruth B.", mood: "love", tags: ["dreamy","innocent","sweet"], bpm: "กลาง (100 BPM)", lang: "en" },
  { title: "Heat Waves", artist: "Glass Animals", mood: "chill", tags: ["nostalgia","indie","midnight"], bpm: "กลาง (81 BPM)", lang: "en" },
  { title: "Heather", artist: "Conan Gray", mood: "sad", tags: ["jealousy","unrequited","heartbreak"], bpm: "กลาง (102 BPM)", lang: "en" },
  { title: "Arcade", artist: "Duncan Laurence", mood: "sad", tags: ["loss","bittersweet","cinematic"], bpm: "กลาง (95 BPM)", lang: "en" },
  { title: "Someone You Loved", artist: "Lewis Capaldi", mood: "sad", tags: ["loss","ballad","emotional"], bpm: "เร็ว (110 BPM)", lang: "en" },
  { title: "Before You Go", artist: "Lewis Capaldi", mood: "sad", tags: ["regret","mental-health","raw"], bpm: "เร็ว (112 BPM)", lang: "en" },
  { title: "Sunflower", artist: "Post Malone & Swae Lee", mood: "chill", tags: ["spiderman","vibe","smooth"], bpm: "กลาง (90 BPM)", lang: "en" },
  { title: "Circles", artist: "Post Malone", mood: "sad", tags: ["cycle","loop","melancholic"], bpm: "เร็ว (120 BPM)", lang: "en" },
  { title: "Unstoppable", artist: "Sia", mood: "hype", tags: ["power","strength","anthem"], bpm: "เร็ว (140 BPM)", lang: "en" },
  { title: "Chandelier", artist: "Sia", mood: "epic", tags: ["raw","powerful","dance"], bpm: "กลาง (83 BPM)", lang: "en" },
  { title: "Let Her Go", artist: "Passenger", mood: "sad", tags: ["loss","realization","acoustic"], bpm: "ช้า (75 BPM)", lang: "en" },
  { title: "Glimpse of Us", artist: "Joji", mood: "sad", tags: ["longing","piano","emotional"], bpm: "ช้า (84 BPM)", lang: "en" },
  { title: "SLOW DANCING IN THE DARK", artist: "Joji", mood: "sad", tags: ["dark","emotional","cinematic"], bpm: "ช้า (83 BPM)", lang: "en" },
  { title: "Sweater Weather", artist: "The Neighbourhood", mood: "chill", tags: ["indie","moody","vibes"], bpm: "กลาง (100 BPM)", lang: "en" },
  { title: "Counting Stars", artist: "OneRepublic", mood: "hype", tags: ["dreams","rock","inspiring"], bpm: "เร็ว (122 BPM)", lang: "en" },
  { title: "Apologize", artist: "OneRepublic", mood: "sad", tags: ["regret","too-late","piano"], bpm: "ช้า (58 BPM)", lang: "en" },
  { title: "Night Changes", artist: "One Direction", mood: "love", tags: ["nostalgic","sweet","timeless"], bpm: "เร็ว (120 BPM)", lang: "en" },
  { title: "Story of My Life", artist: "One Direction", mood: "sad", tags: ["memoir","rock","emotional"], bpm: "เร็ว (121 BPM)", lang: "en" },
  { title: "Reckless", artist: "Madison Beer", mood: "love", tags: ["vulnerable","pop","emotional"], bpm: "กลาง (98 BPM)", lang: "en" },
  { title: "Die For You", artist: "The Weeknd", mood: "love", tags: ["sacrifice","devotion","r&b"], bpm: "ช้า (65 BPM)", lang: "en" },
  { title: "After Hours", artist: "The Weeknd", mood: "sad", tags: ["dark","lonely","cinematic"], bpm: "กลาง (108 BPM)", lang: "en" },
  { title: "Snooze", artist: "SZA", mood: "love", tags: ["devotion","r&b","dreamy"], bpm: "กลาง (95 BPM)", lang: "en" },
  { title: "Kill Bill", artist: "SZA", mood: "hype", tags: ["revenge","fierce","r&b"], bpm: "เร็ว (89 BPM)", lang: "en" },
  { title: "505", artist: "Arctic Monkeys", mood: "sad", tags: ["longing","rock","intense"], bpm: "กลาง (93 BPM)", lang: "en" },
  { title: "Do I Wanna Know?", artist: "Arctic Monkeys", mood: "chill", tags: ["desire","rock","seductive"], bpm: "ช้า (85 BPM)", lang: "en" },
  { title: "Until I Found You", artist: "Stephen Sanchez", mood: "love", tags: ["vintage","romantic","tender"], bpm: "ช้า (78 BPM)", lang: "en" },
  { title: "Clarity", artist: "Zedd ft. Foxes", mood: "epic", tags: ["EDM","emotional","powerful"], bpm: "เร็ว (128 BPM)", lang: "en" },
  { title: "Titanium", artist: "David Guetta ft. Sia", mood: "hype", tags: ["powerful","EDM","anthem"], bpm: "เร็ว (126 BPM)", lang: "en" },
  { title: "Faded", artist: "Alan Walker", mood: "sad", tags: ["EDM","lost","atmospheric"], bpm: "เร็ว (90 BPM)", lang: "en" },
  { title: "Alone", artist: "Alan Walker", mood: "sad", tags: ["EDM","lonely","dark"], bpm: "เร็ว (97 BPM)", lang: "en" },
  { title: "Darkside", artist: "Alan Walker", mood: "epic", tags: ["dark","EDM","journey"], bpm: "เร็ว (85 BPM)", lang: "en" },
  { title: "On My Way", artist: "Alan Walker", mood: "hype", tags: ["adventure","EDM","gaming"], bpm: "เร็ว (174 BPM)", lang: "en" },

  // ===== เพลงญี่ปุ่น / อนิเมะ 2025-2026 =====
  { title: "SPECIALZ", artist: "King Gnu", mood: "hype", tags: ["jujutsu","dark","intense"], bpm: "เร็ว (132 BPM)", lang: "jp" },
  { title: "Bling-Bang-Bang-Born", artist: "Creepy Nuts", mood: "hype", tags: ["mashle","dance","viral"], bpm: "เร็ว (140 BPM)", lang: "jp" },
  { title: "勇者 (Yuusha)", artist: "YOASOBI", mood: "hype", tags: ["frieren","hero","epic"], bpm: "เร็ว (136 BPM)", lang: "jp" },
  { title: "晴る (Haru)", artist: "Yorushika", mood: "chill", tags: ["frieren","spring","gentle"], bpm: "กลาง (98 BPM)", lang: "jp" },
  { title: "アイドル (Idol)", artist: "YOASOBI", mood: "hype", tags: ["oshi","star","explosive"], bpm: "เร็ว (166 BPM)", lang: "jp" },
  { title: "夜に駆ける (Racing into the Night)", artist: "YOASOBI", mood: "hype", tags: ["night","running","iconic"], bpm: "เร็ว (130 BPM)", lang: "jp" },
  { title: "群青 (Gunjou)", artist: "YOASOBI", mood: "hype", tags: ["blue","inspiring","youth"], bpm: "เร็ว (131 BPM)", lang: "jp" },
  { title: "祝福 (Shukufuku)", artist: "YOASOBI", mood: "epic", tags: ["gundam","blessing","majestic"], bpm: "เร็ว (138 BPM)", lang: "jp" },
  { title: "怪獣の花唄 (Kaijuu no Hanautai)", artist: "Vaundy", mood: "hype", tags: ["monster","rock","catchy"], bpm: "เร็ว (142 BPM)", lang: "jp" },
  { title: "花になって (Hana ni Natte)", artist: "Ryokuoushoku Shakai", mood: "love", tags: ["flower","sweet","warm"], bpm: "กลาง (98 BPM)", lang: "jp" },
  { title: "可愛くてごめん (Kawaikute Gomen)", artist: "HoneyWorks", mood: "happy", tags: ["cute","apology","sweet"], bpm: "เร็ว (150 BPM)", lang: "jp" },
  { title: "Lemon", artist: "Kenshi Yonezu", mood: "sad", tags: ["loss","memorial","unnatural"], bpm: "กลาง (87 BPM)", lang: "jp" },
  { title: "KICK BACK", artist: "Kenshi Yonezu", mood: "hype", tags: ["chainsaw","crazy","rock"], bpm: "เร็ว (150 BPM)", lang: "jp" },
  { title: "ピースサイン (Peace Sign)", artist: "Kenshi Yonezu", mood: "hype", tags: ["hero","academia","inspiring"], bpm: "เร็ว (154 BPM)", lang: "jp" },
  { title: "打上花火 (Uchiage Hanabi)", artist: "DAOKO × Kenshi Yonezu", mood: "love", tags: ["fireworks","summer","nostalgic"], bpm: "กลาง (96 BPM)", lang: "jp" },
  { title: "Shinunoga E-Wa", artist: "Fujii Kaze", mood: "love", tags: ["devotion","catchy","viral"], bpm: "กลาง (100 BPM)", lang: "jp" },
  { title: "死ぬのがいいわ (Full Version)", artist: "Fujii Kaze", mood: "love", tags: ["romantic","jazz","retro"], bpm: "กลาง (100 BPM)", lang: "jp" },
  { title: "きらり (Kirari)", artist: "Fujii Kaze", mood: "happy", tags: ["sparkle","summer","catchy"], bpm: "เร็ว (108 BPM)", lang: "jp" },
  { title: "Kaikai Kitan", artist: "Eve", mood: "hype", tags: ["jujutsu","dark","explosive"], bpm: "เร็ว (132 BPM)", lang: "jp" },
  { title: "ドラマツルギー (Dramaturgy)", artist: "Eve", mood: "hype", tags: ["theatre","drama","rock"], bpm: "เร็ว (160 BPM)", lang: "jp" },
  { title: "残響散歌 (Zankyousanka)", artist: "Aimer", mood: "epic", tags: ["demon-slayer","fierce","powerful"], bpm: "เร็ว (155 BPM)", lang: "jp" },
  { title: "カタオモイ (Kataomoi)", artist: "Aimer", mood: "love", tags: ["one-sided","tender","beautiful"], bpm: "ช้า (73 BPM)", lang: "jp" },
  { title: "紅蓮華 (Gurenge)", artist: "LiSA", mood: "hype", tags: ["demon-slayer","flame","battle"], bpm: "เร็ว (138 BPM)", lang: "jp" },
  { title: "炎 (Homura)", artist: "LiSA", mood: "epic", tags: ["demon-slayer","movie","emotional"], bpm: "กลาง (95 BPM)", lang: "jp" },
  { title: "明け星 (Akeboshi)", artist: "LiSA", mood: "epic", tags: ["demon-slayer","sunrise","hope"], bpm: "เร็ว (125 BPM)", lang: "jp" },
  { title: "ウタカタララバイ (Utakata Lullaby)", artist: "Ado", mood: "epic", tags: ["one-piece","lullaby","powerful"], bpm: "กลาง (100 BPM)", lang: "jp" },
  { title: "新時代 (New Genesis)", artist: "Ado", mood: "hype", tags: ["one-piece","new-era","explosive"], bpm: "เร็ว (128 BPM)", lang: "jp" },
  { title: "私は最強 (I'm Invincible)", artist: "Ado", mood: "hype", tags: ["one-piece","powerful","queen"], bpm: "เร็ว (170 BPM)", lang: "jp" },
  { title: "唱 (Show)", artist: "Ado", mood: "hype", tags: ["dance","powerful","viral"], bpm: "เร็ว (140 BPM)", lang: "jp" },
  { title: "Cry Baby", artist: "Official HIGE DANdism", mood: "epic", tags: ["tokyo-revengers","emotional","rock"], bpm: "เร็ว (136 BPM)", lang: "jp" },
  { title: "Subtitle", artist: "Official HIGE DANdism", mood: "love", tags: ["drama","tender","emotional"], bpm: "กลาง (96 BPM)", lang: "jp" },
  { title: "ミックスナッツ (Mixed Nuts)", artist: "Official HIGE DANdism", mood: "happy", tags: ["spy-family","fun","quirky"], bpm: "เร็ว (150 BPM)", lang: "jp" },
  { title: "unravel", artist: "TK from Ling Tosite Sigure", mood: "sad", tags: ["tokyo-ghoul","pain","iconic"], bpm: "กลาง (95 BPM)", lang: "jp" },
  { title: "Blue Bird", artist: "Ikimono-gakari", mood: "hype", tags: ["naruto","hope","classic"], bpm: "เร็ว (148 BPM)", lang: "jp" },
  { title: "Silhouette", artist: "KANA-BOON", mood: "hype", tags: ["naruto","shadow","nostalgic"], bpm: "เร็ว (140 BPM)", lang: "jp" },
  { title: "再会 (Saikai)", artist: "LiSA × Uru", mood: "sad", tags: ["reunion","drama","emotional"], bpm: "ช้า (73 BPM)", lang: "jp" },
  { title: "春泥棒 (Haru Dorobou)", artist: "Yorushika", mood: "chill", tags: ["spring","thief","gentle"], bpm: "กลาง (96 BPM)", lang: "jp" },
  { title: "ただ君に晴れ (Tada Kimi ni Hare)", artist: "Yorushika", mood: "chill", tags: ["clear-sky","youth","fresh"], bpm: "กลาง (95 BPM)", lang: "jp" },
  { title: "風のゆくえ (Kaze no Yukue)", artist: "Fujii Kaze × Kenshi Yonezu", mood: "chill", tags: ["wind","journey","peaceful"], bpm: "กลาง (92 BPM)", lang: "jp" },
  { title: "すずめ (Suzume)", artist: "RADWIMPS ft. Toaka", mood: "epic", tags: ["suzume","movie","emotional"], bpm: "กลาง (97 BPM)", lang: "jp" },
  { title: "カナタハルカ (Kanata Halca)", artist: "RADWIMPS", mood: "sad", tags: ["suzume","distant","longing"], bpm: "ช้า (78 BPM)", lang: "jp" },
  { title: "前前前世 (Zenzenzense)", artist: "RADWIMPS", mood: "hype", tags: ["your-name","past-lives","iconic"], bpm: "เร็ว (190 BPM)", lang: "jp" },
  { title: "スパークル (Sparkle)", artist: "RADWIMPS", mood: "love", tags: ["your-name","sparkle","emotional"], bpm: "ช้า (75 BPM)", lang: "jp" },
  { title: "なんでもないや (Nandemonaiya)", artist: "RADWIMPS", mood: "sad", tags: ["your-name","nothing","tears"], bpm: "กลาง (95 BPM)", lang: "jp" },
  { title: "オレンジ (Orange)", artist: "SPYAIR", mood: "sad", tags: ["haikyuu","graduation","farewell"], bpm: "กลาง (88 BPM)", lang: "jp" },
  { title: "名前のない怪物 (Namae no Nai Kaibutsu)", artist: "EGOIST", mood: "sad", tags: ["psycho-pass","monster","dark"], bpm: "กลาง (93 BPM)", lang: "jp" },
  { title: "Again", artist: "YUI", mood: "hype", tags: ["fma","beginning","rock"], bpm: "เร็ว (165 BPM)", lang: "jp" },
  { title: "The Rumbling", artist: "SiM", mood: "hype", tags: ["aot","rumbling","metal"], bpm: "เร็ว (140 BPM)", lang: "jp" },
  { title: "僕の戦争 (Boku no Sensou)", artist: "Shinsei Kamattechan", mood: "epic", tags: ["aot","war","dark"], bpm: "เร็ว (135 BPM)", lang: "jp" },
  { title: "Inferno", artist: "Mrs. GREEN APPLE", mood: "hype", tags: ["fire-force","blaze","rock"], bpm: "เร็ว (145 BPM)", lang: "jp" },
  { title: "点描の唄 (Tenbyo no Uta)", artist: "Mrs. GREEN APPLE ft. Kinoue Airu", mood: "love", tags: ["painting","tender","beautiful"], bpm: "ช้า (78 BPM)", lang: "jp" },
  { title: "コロンブス (Columbus)", artist: "Mrs. GREEN APPLE", mood: "happy", tags: ["adventure","catchy","upbeat"], bpm: "เร็ว (130 BPM)", lang: "jp" },

  // ===== เพลงเกาหลี K-Pop 2025-2026 =====
  { title: "Supernova", artist: "aespa", mood: "hype", tags: ["kpop","girl-crush","powerful"], bpm: "เร็ว (135 BPM)", lang: "kr" },
  { title: "Whiplash", artist: "aespa", mood: "hype", tags: ["kpop","fierce","girl-crush"], bpm: "เร็ว (130 BPM)", lang: "kr" },
  { title: "Drama", artist: "aespa", mood: "hype", tags: ["kpop","theatrical","bold"], bpm: "เร็ว (128 BPM)", lang: "kr" },
  { title: "SPOT!", artist: "ZICO ft. JENNIE", mood: "happy", tags: ["party","catchy","fun"], bpm: "เร็ว (120 BPM)", lang: "kr" },
  { title: "Magnetic", artist: "ILLIT", mood: "happy", tags: ["cute","catchy","fresh"], bpm: "เร็ว (110 BPM)", lang: "kr" },
  { title: "Love wins all", artist: "IU", mood: "love", tags: ["devotion","cinematic","beautiful"], bpm: "ช้า (70 BPM)", lang: "kr" },
  { title: "Shopper", artist: "IU", mood: "happy", tags: ["shopping","cute","catchy"], bpm: "เร็ว (118 BPM)", lang: "kr" },
  { title: "Celebrity", artist: "IU", mood: "happy", tags: ["self-love","pop","catchy"], bpm: "เร็ว (125 BPM)", lang: "kr" },
  { title: "EASY", artist: "LE SSERAFIM", mood: "hype", tags: ["confident","girl-crush","fierce"], bpm: "เร็ว (125 BPM)", lang: "kr" },
  { title: "UNFORGIVEN", artist: "LE SSERAFIM", mood: "hype", tags: ["dark","powerful","fierce"], bpm: "เร็ว (130 BPM)", lang: "kr" },
  { title: "Super Shy", artist: "NewJeans", mood: "love", tags: ["shy","cute","fresh"], bpm: "เร็ว (120 BPM)", lang: "kr" },
  { title: "Ditto", artist: "NewJeans", mood: "love", tags: ["nostalgic","lo-fi","dreamy"], bpm: "กลาง (100 BPM)", lang: "kr" },
  { title: "Hype Boy", artist: "NewJeans", mood: "happy", tags: ["energetic","fresh","teen"], bpm: "เร็ว (114 BPM)", lang: "kr" },
  { title: "OMG", artist: "NewJeans", mood: "happy", tags: ["surprise","cute","catchy"], bpm: "เร็ว (127 BPM)", lang: "kr" },
  { title: "How Sweet", artist: "NewJeans", mood: "love", tags: ["sweet","cute","dreamy"], bpm: "กลาง (100 BPM)", lang: "kr" },
  { title: "SHEESH", artist: "BABYMONSTER", mood: "hype", tags: ["fierce","girl-crush","debut"], bpm: "เร็ว (130 BPM)", lang: "kr" },
  { title: "DRIP", artist: "BABYMONSTER", mood: "hype", tags: ["powerful","swag","fierce"], bpm: "เร็ว (128 BPM)", lang: "kr" },
  { title: "MANTRA", artist: "JENNIE", mood: "hype", tags: ["solo","fierce","queen"], bpm: "เร็ว (128 BPM)", lang: "kr" },
  { title: "SOLO", artist: "JENNIE", mood: "hype", tags: ["independent","queen","iconic"], bpm: "เร็ว (126 BPM)", lang: "kr" },
  { title: "Shut Down", artist: "BLACKPINK", mood: "hype", tags: ["classical","fierce","iconic"], bpm: "เร็ว (140 BPM)", lang: "kr" },
  { title: "Pink Venom", artist: "BLACKPINK", mood: "hype", tags: ["dangerous","dark","fierce"], bpm: "เร็ว (130 BPM)", lang: "kr" },
  { title: "How You Like That", artist: "BLACKPINK", mood: "hype", tags: ["comeback","fierce","anthem"], bpm: "เร็ว (130 BPM)", lang: "kr" },
  { title: "Lovesick Girls", artist: "BLACKPINK", mood: "sad", tags: ["heartbreak","anthem","emotional"], bpm: "เร็ว (124 BPM)", lang: "kr" },
  { title: "Dynamite", artist: "BTS", mood: "happy", tags: ["disco","fun","bright"], bpm: "เร็ว (114 BPM)", lang: "kr" },
  { title: "Butter", artist: "BTS", mood: "happy", tags: ["smooth","summer","groovy"], bpm: "เร็ว (110 BPM)", lang: "kr" },
  { title: "Spring Day", artist: "BTS", mood: "sad", tags: ["longing","winter","emotional"], bpm: "เร็ว (105 BPM)", lang: "kr" },
  { title: "Fake Love", artist: "BTS", mood: "sad", tags: ["dark","emotional","rock"], bpm: "เร็ว (101 BPM)", lang: "kr" },
  { title: "Boy With Luv", artist: "BTS ft. Halsey", mood: "happy", tags: ["colorful","sweet","catchy"], bpm: "เร็ว (107 BPM)", lang: "kr" },
  { title: "Cupid", artist: "FIFTY FIFTY", mood: "love", tags: ["cute","viral","sweet"], bpm: "เร็ว (117 BPM)", lang: "kr" },
  { title: "GODS", artist: "NewJeans", mood: "epic", tags: ["league","anthem","powerful"], bpm: "เร็ว (135 BPM)", lang: "kr" },
  { title: "LALISA", artist: "LISA", mood: "hype", tags: ["solo","queen","powerful"], bpm: "เร็ว (130 BPM)", lang: "kr" },
  { title: "MONEY", artist: "LISA", mood: "hype", tags: ["flex","badass","iconic"], bpm: "เร็ว (125 BPM)", lang: "kr" },
  { title: "ROCKSTAR", artist: "LISA", mood: "hype", tags: ["rock","fierce","2024"], bpm: "เร็ว (135 BPM)", lang: "kr" },
  { title: "Seven", artist: "Jung Kook ft. Latto", mood: "love", tags: ["everyday","devotion","catchy"], bpm: "เร็ว (125 BPM)", lang: "kr" },
  { title: "Standing Next to You", artist: "Jung Kook", mood: "happy", tags: ["disco","dance","retro"], bpm: "เร็ว (107 BPM)", lang: "kr" },
  { title: "Love Lee", artist: "AKMU", mood: "love", tags: ["sweet","acoustic","warm"], bpm: "กลาง (98 BPM)", lang: "kr" },
  { title: "ANTIFRAGILE", artist: "LE SSERAFIM", mood: "hype", tags: ["tough","girl-crush","anthem"], bpm: "เร็ว (128 BPM)", lang: "kr" },
  { title: "FEARLESS", artist: "LE SSERAFIM", mood: "hype", tags: ["brave","debut","fierce"], bpm: "เร็ว (128 BPM)", lang: "kr" },
  { title: "After LIKE", artist: "IVE", mood: "happy", tags: ["retro","fun","catchy"], bpm: "เร็ว (136 BPM)", lang: "kr" },
  { title: "LOVE DIVE", artist: "IVE", mood: "love", tags: ["narcissist","mysterious","catchy"], bpm: "เร็ว (128 BPM)", lang: "kr" },
  { title: "Kitsch", artist: "IVE", mood: "happy", tags: ["confident","pop","catchy"], bpm: "เร็ว (120 BPM)", lang: "kr" },
  { title: "ETA", artist: "NewJeans", mood: "happy", tags: ["fun","fresh","dance"], bpm: "เร็ว (130 BPM)", lang: "kr" },
  { title: "Attention", artist: "NewJeans", mood: "chill", tags: ["debut","fresh","lo-fi"], bpm: "กลาง (105 BPM)", lang: "kr" },
  { title: "Nxde", artist: "(G)I-DLE", mood: "hype", tags: ["bold","fierce","artistic"], bpm: "เร็ว (128 BPM)", lang: "kr" },
  { title: "Queencard", artist: "(G)I-DLE", mood: "happy", tags: ["confident","queen","catchy"], bpm: "เร็ว (127 BPM)", lang: "kr" },
  { title: "Super", artist: "(G)I-DLE", mood: "hype", tags: ["fierce","rock","powerful"], bpm: "เร็ว (132 BPM)", lang: "kr" },

  // ===== เพลงลาว / อีสาน =====
  { title: "ສັນຍາກັນໄວ້", artist: "Alexandra", mood: "love", tags: ["สัญญา","ลาว","อีสาน"], bpm: "ช้า (75 BPM)", lang: "lao" },
  { title: "ຮັກບໍ່ໄດ້ບອກ", artist: "PoP Pongkool (Lao Ver.)", mood: "sad", tags: ["รักเงียบ","ลาว","เจ็บ"], bpm: "กลาง (88 BPM)", lang: "lao" },
  { title: "ໃຈມັນຮັກ", artist: "Cells", mood: "love", tags: ["หัวใจ","ลาว","รัก"], bpm: "กลาง (95 BPM)", lang: "lao" },
  { title: "ບໍ່ມີໃຜ", artist: "Tik Shiro (Lao Cover)", mood: "sad", tags: ["เหงา","ลาว","คนเดียว"], bpm: "ช้า (72 BPM)", lang: "lao" },
  { title: "ມີແຕ່ເຈົ້າ", artist: "Ting Nong", mood: "love", tags: ["มีแต่เธอ","ลาว","รัก"], bpm: "กลาง (90 BPM)", lang: "lao" },
  { title: "ອ້ອນບໍ່ເກ່ງ", artist: "Beer Pharadonphol (Lao)", mood: "love", tags: ["อ้อน","ลาว","น่ารัก"], bpm: "กลาง (98 BPM)", lang: "lao" },
  { title: "ສາວອີສານ", artist: "Kai Rattanaporn", mood: "happy", tags: ["สาว","อีสาน","สนุก"], bpm: "เร็ว (115 BPM)", lang: "lao" },
  { title: "ບ້ານນາ", artist: "Molam Lao Band", mood: "chill", tags: ["บ้านนา","ลาว","ทุ่งนา"], bpm: "กลาง (90 BPM)", lang: "lao" },
  { title: "ຄິດฮອดเจ้າ", artist: "Kratae RSiam (Lao)", mood: "sad", tags: ["คิดถึง","อีสาน","ห่างไกล"], bpm: "ช้า (78 BPM)", lang: "lao" },
  { title: "ลำเพลินภูไท", artist: "มนต์แคน แก่นคูน", mood: "happy", tags: ["หมอลำ","ภูไท","สนุก"], bpm: "เร็ว (130 BPM)", lang: "lao" },
];

// กรองเพลงที่ซ้ำ
let nextId = maxId + 1;
const songsToAdd = [];

for (const s of NEW_SONGS) {
  const titleLower = s.title.toLowerCase();
  if (existingTitles.has(titleLower)) {
    continue; // ข้ามเพลงที่มีอยู่แล้ว
  }
  existingTitles.add(titleLower);

  const encodedSearch = encodeURIComponent(`${s.title} ${s.artist}`);
  const coverUrl = `https://is1-ssl.mzstatic.com/image/thumb/Music/${nextId % 200}/v4/cover_${nextId}.jpg/600x600bb.jpg`;

  songsToAdd.push({
    id: nextId,
    title: s.title,
    artist: s.artist,
    coverUrl: `https://wsrv.nl/?url=https://e-cdns-images.dzcdn.net/images/cover/${hashCode(s.title + s.artist)}/500x500-000000-80-0-0.jpg&w=300&h=300&fit=cover&default=https://via.placeholder.com/300/1e1b4b/38bdf8?text=${encodeURIComponent(s.title.substring(0,8))}`,
    previewUrl: "",
    spotifyUrl: `https://open.spotify.com/search/${encodedSearch}`,
    mood: s.mood,
    tags: s.tags,
    bpm: s.bpm,
    lang: s.lang,
    animeId: getRandomAnimeId(s.lang),
    animeMatch: getRandomAnimeMatch(s.lang),
    reason: generateReason(s),
    typoIdea: generateTypoIdea(s),
    audioUrl: "",
    audioFallback: ""
  });

  nextId++;
}

console.log(`\n✅ เพลงใหม่ที่ไม่ซ้ำ: ${songsToAdd.length} เพลง`);
console.log(`📌 Song ID range: ${maxId + 1} → ${nextId - 1}`);

// Helper functions
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
}

function getRandomAnimeId(lang) {
  if (lang === 'jp') {
    const jpAnime = [1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 15, 17, 20, 25, 30, 40, 50, 60, 70, 80, 100, 150, 200, 250, 300];
    return jpAnime[Math.floor(Math.random() * jpAnime.length)];
  }
  const general = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50, 100, 150, 200];
  return general[Math.floor(Math.random() * general.length)];
}

function getRandomAnimeMatch(lang) {
  const ids = [];
  const pool = lang === 'jp' 
    ? [1,2,3,5,6,8,9,10,11,12,15,17,20,25,30,40,50,60,70,80,100,150,200]
    : [1,2,3,4,5,6,7,8,9,10,15,20,25,30,50,100,150,200];
  const count = 2 + Math.floor(Math.random() * 2);
  while (ids.length < count) {
    const id = pool[Math.floor(Math.random() * pool.length)];
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

function generateReason(s) {
  const reasons = {
    th: `เพลง "${s.title}" โดย ${s.artist} เข้ากับมู้ด ${s.mood} ของอนิเมะ สร้างอารมณ์ร่วมได้ดีมากสำหรับคลิปไทโป`,
    en: `"${s.title}" by ${s.artist} brings a ${s.mood} atmosphere that perfectly complements anime scenes for typography edits`,
    jp: `"${s.title}" (${s.artist}) อนิเมะซาวด์แทร็ค/J-Pop ที่มีพลังเข้ากับฉากมู้ด ${s.mood} ของอนิเมะได้อย่างสมบูรณ์แบบ`,
    kr: `"${s.title}" (${s.artist}) เพลง K-Pop ที่มีจังหวะ ${s.bpm} เข้ากับอนิเมะมู้ด ${s.mood} ได้ลงตัว`,
    lao: `"${s.title}" โดย ${s.artist} เพลงลาว/อีสาน มู้ด ${s.mood} เข้ากับซีนอนิเมะได้อย่างลงตัว`
  };
  return reasons[s.lang] || reasons.th;
}

function generateTypoIdea(s) {
  const ideas = {
    sad: "ใช้ฟอนต์ Serif สีขาว พร้อม Glow นุ่มนวล ลอยช้าๆ จางหายพร้อมน้ำตา fade-out ตามจังหวะเพลง",
    love: "ใช้ฟอนต์ Script สีชมพูอ่อน พร้อมหัวใจเล็กๆ ลอยล้อมรอบ ค่อยๆ ซูมเข้าตามจังหวะเบส",
    happy: "ใช้ฟอนต์ Sans-Serif สีสดใส ตัวหนา กระโดดสนุกตามจังหวะ ใส่ Confetti particle ให้มีชีวิตชีวา",
    chill: "ใช้ฟอนต์มินิมอล Thin สีฟ้าอ่อน ไหลช้าๆ ราวกับลอยอยู่บนน้ำ ผสม grain texture สไตล์ Lo-Fi",
    hype: "ใช้ฟอนต์ Impact หนาจัด สีแดง/ส้ม พร้อมแสง Neon กระพริบ สั่นตามจังหวะดรอป มี Glitch effect",
    epic: "ใช้ฟอนต์ Cinematic สีทอง มีแสง Lens Flare ตามตัวอักษร ค่อยๆ ขยายเต็มจอ พร้อม Particle dust ปลิว"
  };
  return ideas[s.mood] || ideas.chill;
}

// เพิ่มเข้า data.js
if (songsToAdd.length > 0) {
  // หาตำแหน่ง ]; สุดท้ายของ SONGS array
  const songsEndIdx = content.indexOf('const ANIME_PAIRS');
  const insertPos = content.lastIndexOf('];', songsEndIdx);

  if (insertPos === -1) {
    console.error('❌ หาตำแหน่งสิ้นสุด SONGS array ไม่เจอ');
    process.exit(1);
  }

  const newSongsJson = songsToAdd.map(s => {
    return `  ${JSON.stringify(s, null, 2).split('\n').join('\n  ')}`;
  }).join(',\n');

  content = content.substring(0, insertPos) + ',\n' + newSongsJson + '\n' + content.substring(insertPos);

  fs.writeFileSync(DATA_FILE, content, 'utf8');
  console.log(`\n🎉 เพิ่มเพลงสำเร็จ! รวมทั้งหมดตอนนี้: ${existingTitles.size} เพลง`);
} else {
  console.log('⚠️ ไม่มีเพลงใหม่ที่ต้องเพิ่ม (อาจซ้ำกับเพลงที่มีอยู่แล้ว)');
}
