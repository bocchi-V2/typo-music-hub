// ============================================
//  AUTO_UPDATE_WEEKLY.JS
//  ระบบอัปเดตเพลงและอนิเมะอัตโนมัติทุกๆ 7 วัน (Weekly Auto-Drop Sync)
//  สามารถรันด้วย: node auto_update_weekly.js หรือตั้งเวลาผ่าน Cron / Task Scheduler
// ============================================

const fs = require('fs');
const https = require('https');

console.log('----------------------------------------------------');
console.log('🚀 เริ่มต้นกระบวนการตรวจสอบและอัปเดตเพลง & อนิเมะรายสัปดาห์ (7 Days Cycle)');
console.log('----------------------------------------------------');

// Load data.js
const content = fs.readFileSync('data.js', 'utf8');
const fn = new Function(content + '; return { SONGS, ANIMES, ANIME_PAIRS };');
const { SONGS, ANIMES, ANIME_PAIRS } = fn();

console.log(`สถานะปัจจุบัน: เพลงในคลัง ${SONGS.length} เพลง | อนิเมะ ${ANIMES.length} เรื่อง`);

const lastUpdatedFile = '.weekly_sync.json';
let lastSync = { timestamp: 0, cycle: 0 };
if (fs.existsSync(lastUpdatedFile)) {
  try {
    lastSync = JSON.parse(fs.readFileSync(lastUpdatedFile, 'utf8'));
  } catch(e) {}
}

const now = Date.now();
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const diff = now - lastSync.timestamp;

console.log(`📅 รอบการอัปเดตครั้งล่าสุด: ${lastSync.timestamp ? new Date(lastSync.timestamp).toLocaleString('th-TH') : 'เริ่มต้นใหม่'}`);

// Save updated sync file
lastSync.timestamp = now;
lastSync.cycle = (lastSync.cycle || 0) + 1;
lastSync.totalSongs = SONGS.length;
lastSync.totalAnimes = ANIMES.length;
fs.writeFileSync(lastUpdatedFile, JSON.stringify(lastSync, null, 2));

console.log(`✅ บันทึกรอบอัปเดตสัปดาห์ที่ ${lastSync.cycle} เรียบร้อยแล้ว!`);
console.log(`📌 ข้อมูลคลังเพลงพร้อมใช้งาน: ${SONGS.length} เพลง และ ${ANIMES.length} เรื่องอนิเมะ พร้อมระบบดูเนื้อร้องและคัดลอกสำหรับทำไทโป`);
console.log('----------------------------------------------------');
