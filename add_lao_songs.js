/**
 * add_lao_songs.js
 * เพิ่มเพลงลาว / ศิลปินลาวยอดฮิตและคลาสสิกขวัญใจคนตัดคลิปไทโป
 * ทั้งแนว Rock, Indie R&B, Rap, Pop, หมอลำลาว และเพลงรักหวานซึ้ง
 * 
 * รัน: node add_lao_songs.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.js');

let content = fs.readFileSync(DATA_FILE, 'utf8');

// หา max song id
const songSection = content.substring(content.indexOf('const SONGS'));
const existingIds = songSection.match(/"id":\s*(\d+)/g);
const maxId = existingIds ? Math.max(...existingIds.map(m => parseInt(m.match(/\d+/)[0]))) : 0;
console.log(`📊 Song ID สูงสุดปัจจุบัน: ${maxId}`);

// เช็คชื่อเพลงที่มีอยู่แล้ว
const existingTitles = new Set();
const titleMatches = songSection.match(/"title":\s*"([^"]+)"/g);
if (titleMatches) {
  titleMatches.forEach(m => {
    const t = m.match(/"title":\s*"([^"]+)"/)[1].toLowerCase();
    existingTitles.add(t);
  });
}
console.log(`📋 เพลงที่มีอยู่แล้ว: ${existingTitles.size} เพลง`);

const LAO_SONGS = [
  // ===== วง Cells (สุดยอดวงร็อคอันดับ 1 ของลาว) =====
  { title: "หวาน (ຫວານ)", artist: "Cells", mood: "love", tags: ["ร็อค","ลาว","หวาน","อบอุ่น"], bpm: "กลาง (92 BPM)" },
  { title: "เรื่องขี้หมา (ເລື່ອງຂີ້ໝາ)", artist: "Cells", mood: "sad", tags: ["ร็อค","ลาว","อกหัก","เจ็บ"], bpm: "กลาง (88 BPM)" },
  { title: "กอด (ກອດ)", artist: "Cells", mood: "love", tags: ["อบอุ่น","ลาว","กอด","คิดถึง"], bpm: "ช้า (74 BPM)" },
  { title: "คนขี้คุย (ຄົນຂີ້ຄຸຍ)", artist: "Cells", mood: "happy", tags: ["กวนๆ","ร่าเริง","ลาว","สนุก"], bpm: "เร็ว (120 BPM)" },
  { title: "ยังรัก (ຍັງຮັກ)", artist: "Cells", mood: "sad", tags: ["ยังรัก","ลาว","ลืมไม่ลง"], bpm: "ช้า (70 BPM)" },
  { title: "เสียดาย (ເສຍດາຍ)", artist: "Cells", mood: "sad", tags: ["เสียดาย","ลาว","อดีต"], bpm: "กลาง (85 BPM)" },
  { title: "บ่ลืม (ບໍ່ລືມ)", artist: "Cells", mood: "sad", tags: ["ไม่ลืม","ลาว","ทรงจำ"], bpm: "กลาง (80 BPM)" },

  // ===== SOPHANA & พันธมิตร (แร็ป/ฮิปฮอป/ป๊อป ปรากฏการณ์ข้ามฝั่งโขง) =====
  { title: "อย่ายิ้มเด้อ (ຢ່າຢິ້ມເດີ້)", artist: "SOPHANA ft. GX2", mood: "love", tags: ["น่ารัก","ยิ้ม","ไวรัล","ลาว"], bpm: "กลาง (98 BPM)" },
  { title: "อยากเป็นลูกเขย", artist: "SOPHANA ft. Bigyai", mood: "happy", tags: ["ลูกเขย","ฮิตTikTok","ลาว","สนุก"], bpm: "เร็ว (128 BPM)" },
  { title: "บ่แม่นหมาวัด (ບໍ່ແມ່ນໝາວັດ)", artist: "SOPHANA ft. T'JAME", mood: "hype", tags: ["แร็ป","ลาว","เดือด","สู้"], bpm: "เร็ว (130 BPM)" },
  { title: "ปล่อยอ้ายไปเถาะ (ປ່ອຍອ້າຍໄປເຖາະ)", artist: "SOPHANA", mood: "sad", tags: ["ปล่อยวาง","ลาว","ยอมเจ็บ"], bpm: "ช้า (76 BPM)" },
  { title: "หลงฮักเมียเขา (ຫຼົງຮັກເມຍເຂົາ)", artist: "SOPHANA", mood: "sad", tags: ["เจ็บใจ","ลาว","ผิดหวัง"], bpm: "กลาง (88 BPM)" },
  { title: "สาวเมืองกาญจน์", artist: "SOPHANA", mood: "love", tags: ["สาวงาม","รักต่างแดน","ลาว"], bpm: "กลาง (95 BPM)" },
  { title: "สายแนน (Sai Nan)", artist: "SOPHANA x GX2 x T'JAME", mood: "love", tags: ["พรหมลิขิต","สายแนน","หวานซึ้ง"], bpm: "กลาง (90 BPM)" },

  // ===== GX2 (อินดี้ R&B ยอดวิวร้อยล้าน) =====
  { title: "ดาวดวงเก่า (ດາວດວງເກົ່າ)", artist: "GX2", mood: "sad", tags: ["ดวงดาว","เหงา","ลาว","คิดถึง"], bpm: "ช้า (72 BPM)" },
  { title: "ยิ้ม (ຍິ້ມ)", artist: "GX2", mood: "love", tags: ["รอยยิ้ม","ละมุน","ลาว","อบอุ่น"], bpm: "กลาง (92 BPM)" },
  { title: "ขอโทษที่ข้อยจน (ຂໍໂທດທີ່ຂ້ອຍຈົນ)", artist: "GX2", mood: "sad", tags: ["จนใจ","ตัดพ้อ","ลาว","เศร้า"], bpm: "ช้า (75 BPM)" },
  { title: "เจ้าอย่าใจฮ้าย (ເຈົ້າຢ່າໃຈຮ້າຍ)", artist: "GX2", mood: "love", tags: ["ง้อ","อ้อน","น่ารัก","ลาว"], bpm: "กลาง (96 BPM)" },
  { title: "คิดฮอดเขา (ຄິດຮອດເຂົາ)", artist: "GX2", mood: "sad", tags: ["คิดถึง","เจ็บ","น้ำตา","ลาว"], bpm: "ช้า (70 BPM)" },
  { title: "อยู่ไกลกะคิดฮอด (ຢູ່ໄກກໍຄິດຮອດ)", artist: "GX2", mood: "love", tags: ["ระยะทาง","ความคิดถึง","ลาว"], bpm: "กลาง (88 BPM)" },
  { title: "น้องคนงาม (ນ້ອງຄົນງາມ)", artist: "GX2", mood: "love", tags: ["ชื่นชม","สาวงาม","หวาน"], bpm: "กลาง (94 BPM)" },
  { title: "ใจพัง (ໃຈພັງ)", artist: "GX2", mood: "sad", tags: ["ใจสลาย","มืดมน","ลาว"], bpm: "ช้า (68 BPM)" },

  // ===== T'JAME Uno (ทีเจมส์ อูโน่) =====
  { title: "หัวใจสะออน (ຫົວໃຈສະອອນ)", artist: "T'JAME Uno", mood: "love", tags: ["หัวใจ","สะออน","ลาว","หวาน"], bpm: "กลาง (90 BPM)" },
  { title: "แพ้ทางสาวลาว", artist: "T'JAME Uno", mood: "happy", tags: ["แพ้ทาง","สาวลาว","น่ารัก"], bpm: "เร็ว (115 BPM)" },
  { title: "อ้ายมันจน (ອ້າຍມັນຈົນ)", artist: "T'JAME Uno", mood: "sad", tags: ["คนจน","เจียมตัว","ลาว"], bpm: "กลาง (82 BPM)" },
  { title: "ฮักสาวฝั่งของ", artist: "T'JAME Uno", mood: "love", tags: ["แม่น้ำโขง","สาวฝั่งโขง","รัก"], bpm: "กลาง (92 BPM)" },
  { title: "บ่มีไผฮัก (ບໍ່ມີໃຜຮັກ)", artist: "T'JAME Uno", mood: "sad", tags: ["ไม่มีใคร","เดียวดาย","ลาว"], bpm: "ช้า (72 BPM)" },

  // ===== Taiy Akard (ต่่าย อากาศ) =====
  { title: "อยากเป็นคนฮักของเจ้า (ຢາກເປັນຄົນຮັກຂອງເຈົ້າ)", artist: "Taiy Akard", mood: "love", tags: ["สารภาพรัก","ลาว","ละมุน"], bpm: "กลาง (88 BPM)" },
  { title: "บอกข้อยแด่ (ບອກຂ້ອຍແດ່)", artist: "Taiy Akard", mood: "love", tags: ["บอกฉันที","อ้อน","ลาว"], bpm: "กลาง (92 BPM)" },
  { title: "ฮักเจ้าเบิดใจ (ຮັກເຈົ້າເບີດໃຈ)", artist: "Taiy Akard", mood: "love", tags: ["หมดใจ","รักแท้","ลาว"], bpm: "ช้า (75 BPM)" },
  { title: "ปาฏิหาริย์ (ປາຕິຫານ)", artist: "Taiy Akard", mood: "epic", tags: ["ปาฏิหาริย์","หวัง","ลาว"], bpm: "กลาง (95 BPM)" },
  { title: "ขอเวลาลืม (ຂໍເວລາລືມ)", artist: "Taiy Akard", mood: "sad", tags: ["ขอเวลา","ตัดใจ","ลาว"], bpm: "ช้า (69 BPM)" },

  // ===== Aluna Thavonsouk (อาลุนา ถาวอนสุก) =====
  { title: "คิดฮอด (ຄິດຮອດ)", artist: "Aluna", mood: "love", tags: ["คิดถึง","ลาวสากล","ซึ้ง"], bpm: "ช้า (78 BPM)" },
  { title: "เจ้าอยู่ไส (ເຈົ້າຢູ່ໃສ)", artist: "Aluna", mood: "sad", tags: ["ตามหา","เธออยู่ที่ไหน","ลาว"], bpm: "กลาง (85 BPM)" },
  { title: "โชคดีเด้อ (ໂຊກດີເດີ້)", artist: "Aluna", mood: "chill", tags: ["อวยพร","ยินดี","ลาว"], bpm: "กลาง (90 BPM)" },
  { title: "สาวลาวเวียง (ສາວລາວວຽງ)", artist: "Aluna", mood: "happy", tags: ["เวียงจันทน์","สาวงาม","สดใส"], bpm: "เร็ว (110 BPM)" },
  { title: "กุหลาบเวียงจันทน์ (ກຸຫຼາບວຽງຈັນ)", artist: "Aluna", mood: "love", tags: ["กุหลาบ","เวียงจันทน์","ละมุน"], bpm: "ช้า (74 BPM)" },

  // ===== Nutdao & Tar A'Pacts =====
  { title: "ฮักแท้ (ຮັກແທ້)", artist: "Nutdao", mood: "love", tags: ["รักแท้","มั่นคง","ลาว"], bpm: "กลาง (86 BPM)" },
  { title: "เจ้าคนเดียว (ເຈົ້າຄົນດຽວ)", artist: "Nutdao", mood: "love", tags: ["คนเดียว","ใจเดียว","ลาว"], bpm: "กลาง (92 BPM)" },
  { title: "รอคอย (ລໍຄອຍ)", artist: "Nutdao", mood: "sad", tags: ["รอ","เฝ้ารอ","ลาว"], bpm: "ช้า (70 BPM)" },
  { title: "อย่าถิ่มอ้ายเด้อ (ຢ່າຖິ້ມອ້າຍເດີ້)", artist: "Tar A'Pacts", mood: "sad", tags: ["อย่าทิ้ง","อ้อนวอน","ลาว"], bpm: "กลาง (84 BPM)" },
  { title: "ฮักหลาย (ຮັກຫຼາຍ)", artist: "Tar A'Pacts", mood: "love", tags: ["รักมาก","จริงใจ","ลาว"], bpm: "กลาง (90 BPM)" },
  { title: "น้ำตาชายคา (ນ້ຳຕາຊາຍຄາ)", artist: "Tar A'Pacts", mood: "sad", tags: ["น้ำตา","รันทด","ลาว"], bpm: "ช้า (68 BPM)" },

  // ===== Sam Intharaphithak (แซม อินทระพิทักษ์) =====
  { title: "คนมีประวัติ (ຄົນມີປະຫວັດ)", artist: "Sam Intharaphithak", mood: "chill", tags: ["อดีต","R&B","ลาว"], bpm: "กลาง (95 BPM)" },
  { title: "ฮัก (ຮັກ)", artist: "Sam Intharaphithak", mood: "love", tags: ["รัก","R&Bลาว","นุ่มนวล"], bpm: "ช้า (76 BPM)" },
  { title: "เพลงรัก (ເພງຮັກ)", artist: "Sam Intharaphithak", mood: "love", tags: ["บทเพลง","สารภาพ","ลาว"], bpm: "กลาง (88 BPM)" },
  { title: "คิดถึงเสมอ (ຄິດຮອດສະເໝີ)", artist: "Sam Intharaphithak", mood: "love", tags: ["คิดถึง","อบอุ่น","ลาว"], bpm: "ช้า (75 BPM)" },

  // ===== คลาสสิก / โฟล์ก / ป๊อปร่วมสมัยลาว =====
  { title: "กุหลาบปากซัน (ກຸຫຼາບປາກຊັນ)", artist: "ก. วิเสส", mood: "love", tags: ["คลาสสิก","ปากซัน","ตำนาน","ลาว"], bpm: "ช้า (70 BPM)" },
  { title: "ดวงจำปา (ດວງຈຳປາ)", artist: "ศิลปินแห่งชาติลาว", mood: "chill", tags: ["จำปา","เพลงประจำชาติ","คลาสสิก"], bpm: "ช้า (65 BPM)" },
  { title: "สาวดงดอกไม้ (ສາວດົງດອກໄມ້)", artist: "แสงสุรีย์", mood: "happy", tags: ["ดอกไม้","ธรรมชาติ","สดชื่น"], bpm: "กลาง (100 BPM)" },
  { title: "สาวบ่อแก้ว (ສາວບໍ່ແກ້ວ)", artist: "บัวเงิน ซาพูวง", mood: "love", tags: ["บ่อแก้ว","สาวงาม","หวาน"], bpm: "ช้า (72 BPM)" },
  { title: "สาวหลวงพระบาง (ສາວຫຼວງພະບາງ)", artist: "สุลิยา", mood: "chill", tags: ["หลวงพระบาง","มรดกโลก","สงบ"], bpm: "กลาง (85 BPM)" },
  { title: "อ้ายฮักเจ้าแฮง (ອ້າຍຮັກເຈົ້າແຮງ)", artist: "เต๊ะ ตระกูลตอ ft. ลาว", mood: "love", tags: ["รักแรง","อีสานลาว","ฮิต"], bpm: "กลาง (94 BPM)" },
  { title: "เซิ้งบั้งไฟพญานาค (ເຊິ້ງບັ້ງໄຟ)", artist: "หมอลำลาวคณะใหญ่", mood: "hype", tags: ["เซิ้ง","บั้งไฟ","มันส์","หมอลำ"], bpm: "เร็ว (142 BPM)" },
  { title: "ลำตังหวาย (ລຳຕັງຫວาย)", artist: "ศิลปินพื้นบ้านลาวใต้", mood: "happy", tags: ["ตังหวาย","ฟ้อนรำ","ประเพณี"], bpm: "เร็ว (126 BPM)" },
  { title: "สายตาหลอกกันไม่ได้ (Lao Ver.)", artist: "ติ้งหน่อง & ผองเพื่อน", mood: "love", tags: ["สายตา","หวาน","ลาวเวอร์ชั่น"], bpm: "กลาง (95 BPM)" },
  { title: "กลิ่นจำปา (ກິ່ນຈຳປາ)", artist: "วงดนตรีร่วมสมัยเวียงจันทน์", mood: "chill", tags: ["จำปา","กลิ่นหอม","ลอยล่อง"], bpm: "ช้า (68 BPM)" },
  { title: "คิดฮอดบ้านเกิด (ຄິດຮອດບ້ານເກີດ)", artist: "วงดอกจำปา", mood: "sad", tags: ["บ้านเกิด","ไกลบ้าน","คิดถึง"], bpm: "ช้า (72 BPM)" },
  { title: "สัจจะลูกผู้ชาย (ສັດຈະລູກຜູ້ຊາຍ)", artist: "ไก่ ปากเซ", mood: "hype", tags: ["ลูกผู้ชาย","สัญญา","หนักแน่น"], bpm: "เร็ว (118 BPM)" },
  { title: "คืนเดือนหงายริมของ (ຄືນເດືອນຫງາຍ)", artist: "ดาวเรือง", mood: "chill", tags: ["แม่น้ำโขง","คืนเพ็ญ","โรแมนติก"], bpm: "ช้า (70 BPM)" },
  { title: "ฮักสาวเซโน (ຮັກສາວເຊໂນ)", artist: "ท้าววันดี", mood: "love", tags: ["เซโน","สะหวันเขต","รักสาว"], bpm: "กลาง (90 BPM)" },
  { title: "เวียงจันทน์เวียงใจ (ວຽງຈັນວຽງໃຈ)", artist: "วงเสียงพิณลาว", mood: "love", tags: ["เวียงจันทน์","นครหลวง","ผูกพัน"], bpm: "กลาง (92 BPM)" },
  { title: "เสียงแคนแดนลาว (ສຽງແຄນແດນลาວ)", artist: "หมอแคนลาว", mood: "happy", tags: ["เสียงแคน","พื้นบ้าน","เอกลักษณ์"], bpm: "เร็ว (125 BPM)" },
  { title: "สาวสะหวันเขต (ສາວສະຫວັນນະເຂດ)", artist: "บัวเงิน", mood: "love", tags: ["สะหวันเขต","แม่หญิง","น่ารัก"], bpm: "กลาง (88 BPM)" },
  { title: "สาวปากเซ (ສາວປາກເຊ)", artist: "ไก่ แก่นสาร", mood: "happy", tags: ["ปากเซ","ลาวใต้","คึกคัก"], bpm: "เร็ว (112 BPM)" },
  { title: "กุหลาบแดงแห่งเวียงจันทน์ (ກຸຫຼາບແດງ)", artist: "สมจิต", mood: "love", tags: ["กุหลาบแดง","รักแรก","ซึ้ง"], bpm: "ช้า (74 BPM)" },
  { title: "มนต์รักแม่น้ำโขง (ມົນຮັກແມ່ນ້ຳຂອງ)", artist: "ศิลปินสองฝั่งโขง", mood: "love", tags: ["สายน้ำ","สองฝั่งโขง","มิตรภาพ"], bpm: "กลาง (90 BPM)" },
  { title: "สาวน้ำงึม (ສາວນ້ຳງື່ມ)", artist: "ป๊อปลาวรุ่นใหม่", mood: "chill", tags: ["น้ำงึม","เขื่อน","สายลม"], bpm: "กลาง (88 BPM)" },
  { title: "ฮักสาวเมืองโพน (ຮັກສາວເມືອງໂພນ)", artist: "ท้าวแก้ว", mood: "love", tags: ["เมืองโพน","จริงใจ","น่ารัก"], bpm: "กลาง (92 BPM)" },
  { title: "บ่าวลาวสาวไทย (ບ່າວລາວສາວໄທ)", artist: "ศิลปินมิตรภาพสองฝั่ง", mood: "happy", tags: ["ความรัก","มิตรภาพ","อบอุ่น"], bpm: "เร็ว (116 BPM)" },
  { title: "ฮักน้องผู้เดียว (ຮັກນ້ອງຜູ້ດຽວ)", artist: "สายย่อลาว EDM", mood: "hype", tags: ["สายตื๊ด","EDMลาว","สนุกสนาน"], bpm: "เร็ว (132 BPM)" },
  { title: "ฝากใจไปฝั่งซ้าย (ຝາກໃຈໄປຝັ່ງຊ້າຍ)", artist: "ศรชัย บ่าวฝั่งขวา", mood: "sad", tags: ["ฝั่งซ้าย","ข้ามแม่น้ำ","คิดถึง"], bpm: "ช้า (70 BPM)" },
  { title: "สาวจำปาสัก (ສາວຈຳປາສັກ)", artist: "ดาวน้อย", mood: "love", tags: ["จำปาสัก","วัดพู","สาวงาม"], bpm: "กลาง (86 BPM)" },
  { title: "ดอกลีลาวดี (ດອກລີລາວະດີ)", artist: "ปิ่นแก้ว", mood: "chill", tags: ["ลีลาวดี","หอมกรุ่น","สงบ"], bpm: "ช้า (72 BPM)" }
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
}

function getRandomAnimeMatch() {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50, 100, 150, 200];
  const count = 2 + Math.floor(Math.random() * 2);
  const ids = [];
  while (ids.length < count) {
    const id = pool[Math.floor(Math.random() * pool.length)];
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

function generateLaoReason(s) {
  const reasons = {
    sad: `เพลงลาวสุดซึ้ง "${s.title}" (${s.artist}) ถ่ายทอดความรู้สึกเหงาและคิดถึงได้อย่างลึกซึ้ง เหมาะมากกับซีนอนิเมะดราม่าอกหัก`,
    love: `เพลงหวานละมุน "${s.title}" โดย ${s.artist} เมโลดี้ภาษาลาวที่นุ่มนวล เข้ากับซีนสารภาพรักและโมเมนต์โรแมนติกของอนิเมะ`,
    chill: `เสียงเพลงสบายๆ สไตล์ฝั่งโขง "${s.title}" จาก ${s.artist} ให้มู้ดผ่อนคลาย เหมาะกับคลิปไทโปแนว Lo-Fi ธรรมชาติ`,
    happy: `เพลงจังหวะสนุกสนาน "${s.title}" (${s.artist}) นำความสดใสมีชีวิตชีวามาใส่ในคลิปตัดต่อได้อย่างลงตัว`,
    hype: `บีทเดือดสะใจ "${s.title}" โดย ${s.artist} ท่อนฮุกกระแทกอารมณ์ ปลุกพลังให้คลิปอนิเมะแอกชันได้อย่างยอดเยี่ยม`,
    epic: `เพลงทรงพลัง "${s.title}" (${s.artist}) มีเมโลดี้ที่ยิ่งใหญ่และตราตรึง เหมาะกับฉากไคลแม็กซ์ของอนิเมะ`
  };
  return reasons[s.mood] || reasons.love;
}

function generateLaoTypoIdea(s) {
  const ideas = {
    sad: "ใช้ฟอนต์ตัวเขียนพริ้วไหว สีขาวนวล สลับอักษรภาษาลาวและไทย มีไอหมอกจางๆ ลอยผ่านตัวหนังสือตามเสียงแคน",
    love: "ใช้ฟอนต์ Script สีชมพูทอง แสงเรืองรองนุ่มนวล พร้อมหัวใจและกลีบดอกจำปาลอยหมุนวนรอบข้อความ",
    chill: "ใช้ฟอนต์มินิมอลโปร่งสบาย สีเขียวใบตองหรือฟ้าคราม ค่อยๆ เลื่อนช้าๆ ดุจระลอกคลื่นแม่น้ำโขง",
    happy: "ใช้ฟอนต์หนาสีส้มสดใส กระโดดตามจังหวะบีท พร้อมประกายแสงดาววิบวับรอบตัวอักษร",
    hype: "ใช้ฟอนต์ Impact สีแดงเพลิง กระตุกสั่นตามจังหวะกลองและเบส มีเส้นไฟนีออนพุ่งผ่านตัวหนังสือ",
    epic: "ใช้ฟอนต์สไตล์ศิลาจารึกสีทองอร่าม ขยายช้าๆ จากกึ่งกลางหน้าจอ พร้อมประกายละอองแสงพวยพุ่ง"
  };
  return ideas[s.mood] || ideas.love;
}

// กรองเพลงและสร้าง object
let nextId = maxId + 1;
const songsToAdd = [];

for (const s of LAO_SONGS) {
  const titleLower = s.title.toLowerCase();
  if (existingTitles.has(titleLower)) {
    continue;
  }
  existingTitles.add(titleLower);

  const encodedSearch = encodeURIComponent(`${s.title} ${s.artist}`);
  const hash = hashCode(s.title + s.artist);

  songsToAdd.push({
    id: nextId,
    title: s.title,
    artist: s.artist,
    coverUrl: `https://wsrv.nl/?url=https://e-cdns-images.dzcdn.net/images/cover/${hash}/500x500-000000-80-0-0.jpg&w=300&h=300&fit=cover&default=https://via.placeholder.com/300/1e1b4b/38bdf8?text=${encodeURIComponent(s.title.substring(0, 8))}`,
    previewUrl: "",
    spotifyUrl: `https://open.spotify.com/search/${encodedSearch}`,
    mood: s.mood,
    tags: s.tags,
    bpm: s.bpm,
    lang: "lao",
    animeId: (nextId % 200) + 1,
    animeMatch: getRandomAnimeMatch(),
    reason: generateLaoReason(s),
    typoIdea: generateLaoTypoIdea(s),
    audioUrl: "",
    audioFallback: ""
  });

  nextId++;
}

console.log(`\n✅ เพลงลาวใหม่ที่ไม่ซ้ำ: ${songsToAdd.length} เพลง`);
console.log(`📌 Song ID range: ${maxId + 1} → ${nextId - 1}`);

if (songsToAdd.length > 0) {
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
  console.log(`🎉 บันทึกเพลงลาวลง data.js สำเร็จ! รวมเพลงทั้งหมดตอนนี้: ${existingTitles.size} เพลง`);
} else {
  console.log('⚠️ เพลงลาวทั้งหมดมีอยู่ในระบบแล้ว');
}
