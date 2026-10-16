// ============================================
//  AUTO_MAINTENANCE_WEEKLY.JS
//  ระบบบำรุงรักษา UI, แก้บัค, ตรวจสอบ Asset อัตโนมัติทุก 7 วัน
//  ⚠️ ไม่เกี่ยวกับการนำเข้าเพลงหรืออนิเมะ (ใช้ daily-update สำหรับเรื่องนั้น)
//  สามารถรันด้วย: node auto_maintenance_weekly.js
// ============================================

const fs = require('fs');
const path = require('path');
const https = require('https');

const LOG_PREFIX = '🔧 [Weekly Maintenance]';
const MAINTENANCE_LOG_FILE = '.weekly_maintenance.json';

console.log('════════════════════════════════════════════════════');
console.log('🔧 Haimiya Typo – Weekly UI & Bug Maintenance');
console.log('════════════════════════════════════════════════════');
console.log(`📅 ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
console.log('');

// ---- Load maintenance history ----
let maintenanceLog = { lastRun: 0, cycle: 0, fixes: [], history: [] };
if (fs.existsSync(MAINTENANCE_LOG_FILE)) {
  try {
    maintenanceLog = JSON.parse(fs.readFileSync(MAINTENANCE_LOG_FILE, 'utf8'));
  } catch (e) {}
}

const fixes = [];
let totalChanges = 0;

// ============================================
// 1. CACHE BUSTING – ขยับเวอร์ชัน SW Cache
// ============================================
function bumpServiceWorkerCache() {
  console.log(`${LOG_PREFIX} 1️⃣ ตรวจสอบ Service Worker Cache Version...`);
  
  const swPath = 'sw.js';
  if (!fs.existsSync(swPath)) {
    console.log('   ⚠️ ไม่พบ sw.js – ข้ามขั้นตอนนี้');
    return;
  }
  
  let swContent = fs.readFileSync(swPath, 'utf8');
  const cacheMatch = swContent.match(/const CACHE_NAME\s*=\s*'haimiya-typo-v(\d+)'/);
  
  if (cacheMatch) {
    const currentVersion = parseInt(cacheMatch[1]);
    const newVersion = currentVersion + 1;
    swContent = swContent.replace(
      `const CACHE_NAME = 'haimiya-typo-v${currentVersion}'`,
      `const CACHE_NAME = 'haimiya-typo-v${newVersion}'`
    );
    fs.writeFileSync(swPath, swContent, 'utf8');
    console.log(`   ✅ Cache version bumped: v${currentVersion} → v${newVersion}`);
    fixes.push(`SW Cache bumped to v${newVersion}`);
    totalChanges++;
  } else {
    console.log('   ℹ️ Cache version format ไม่ตรง – ข้ามขั้นตอน');
  }
}

// ============================================
// 2. ASSET INTEGRITY CHECK – ตรวจไฟล์สำคัญ
// ============================================
function checkAssetIntegrity() {
  console.log(`${LOG_PREFIX} 2️⃣ ตรวจสอบความสมบูรณ์ของ Asset Files...`);
  
  const criticalAssets = [
    { file: 'index.html', minSize: 5000, desc: 'หน้าเว็บหลัก' },
    { file: 'style.css', minSize: 5000, desc: 'ไฟล์ CSS' },
    { file: 'app.js', minSize: 10000, desc: 'ไฟล์แอปหลัก' },
    { file: 'data.js', minSize: 10000, desc: 'ฐานข้อมูลเพลง/อนิเมะ' },
    { file: 'manifest.json', minSize: 100, desc: 'PWA Manifest' },
    { file: 'sw.js', minSize: 200, desc: 'Service Worker' },
    { file: 'favicon-logo.jpg', minSize: 1000, desc: 'Favicon' },
    { file: 'app-icon.jpg', minSize: 1000, desc: 'App Icon' },
    { file: 'splash-cover.jpg', minSize: 1000, desc: 'Splash Cover' },
    { file: 'bg-hero.jpg', minSize: 1000, desc: 'Background Image' },
    { file: 'loading-chibi.jpg', minSize: 1000, desc: 'Loading Chibi' },
    { file: 'haimiya_yaho.mp3', minSize: 5000, desc: 'Voice Clip' },
    { file: 'dice-roll.mp3', minSize: 1000, desc: 'Dice Roll SFX' },
    { file: 'blue_relax.m4a', minSize: 50000, desc: 'Relaxing Ambient BGM (blue - yung kai)' }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const asset of criticalAssets) {
    if (!fs.existsSync(asset.file)) {
      console.log(`   ❌ ไม่พบไฟล์: ${asset.file} (${asset.desc})`);
      fixes.push(`MISSING: ${asset.file}`);
      failed++;
      continue;
    }
    
    const stat = fs.statSync(asset.file);
    if (stat.size < asset.minSize) {
      console.log(`   ⚠️ ไฟล์เล็กผิดปกติ: ${asset.file} (${stat.size} bytes, ควร > ${asset.minSize})`);
      fixes.push(`SMALL_FILE: ${asset.file} (${stat.size}B)`);
      failed++;
    } else {
      passed++;
    }
  }
  
  console.log(`   📊 ผลตรวจ: ผ่าน ${passed}/${criticalAssets.length} | ไม่ผ่าน ${failed}`);
  if (failed === 0) {
    console.log(`   ✅ Asset ทั้งหมดสมบูรณ์!`);
  }
}

// ============================================
// 3. DATA INTEGRITY – ตรวจสอบฐานข้อมูล
// ============================================
function checkDataIntegrity() {
  console.log(`${LOG_PREFIX} 3️⃣ ตรวจสอบความถูกต้องของฐานข้อมูลเพลง/อนิเมะ...`);
  
  try {
    const content = fs.readFileSync('data.js', 'utf8');
    const fn = new Function(content + '; return { SONGS, ANIMES, ANIME_PAIRS };');
    const { SONGS, ANIMES, ANIME_PAIRS } = fn();
    
    console.log(`   📦 เพลง: ${SONGS.length} | อนิเมะ: ${ANIMES.length} | คู่แนะนำ: ${ANIME_PAIRS.length}`);
    
    // Check for songs with missing critical fields
    let missingCovers = 0;
    let missingPreviews = 0;
    let duplicateIds = 0;
    
    const songIds = new Set();
    const animeIds = new Set();
    
    for (const song of SONGS) {
      if (songIds.has(song.id)) duplicateIds++;
      songIds.add(song.id);
      
      if (!song.coverUrl && !song.coverFallback) missingCovers++;
      if (!song.previewUrl) missingPreviews++;
    }
    
    for (const anime of ANIMES) {
      if (animeIds.has(anime.id)) duplicateIds++;
      animeIds.add(anime.id);
    }
    
    if (missingCovers > 0) {
      console.log(`   ⚠️ เพลงไม่มีปก: ${missingCovers} เพลง`);
      fixes.push(`${missingCovers} songs missing cover`);
    }
    if (missingPreviews > 0) {
      console.log(`   ⚠️ เพลงไม่มีตัวอย่างเสียง: ${missingPreviews} เพลง`);
    }
    if (duplicateIds > 0) {
      console.log(`   ❌ พบ ID ซ้ำ: ${duplicateIds} รายการ`);
      fixes.push(`${duplicateIds} duplicate IDs found`);
    }
    
    if (missingCovers === 0 && duplicateIds === 0) {
      console.log(`   ✅ ฐานข้อมูลสมบูรณ์ ไม่พบบัค!`);
    }
    
    return { SONGS, ANIMES, ANIME_PAIRS };
  } catch (e) {
    console.log(`   ❌ data.js มีข้อผิดพลาด: ${e.message}`);
    fixes.push(`DATA_ERROR: ${e.message}`);
    return null;
  }
}

// ============================================
// 4. HTML SYNTAX CHECK – ตรวจ HTML ว่าไม่พัง
// ============================================
function checkHtmlSyntax() {
  console.log(`${LOG_PREFIX} 4️⃣ ตรวจสอบ HTML Syntax...`);
  
  const html = fs.readFileSync('index.html', 'utf8');
  
  // Basic checks
  const appJs = fs.existsSync('app.js') ? fs.readFileSync('app.js', 'utf8') : '';
  const hasDoctype = html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>');
  const hasHtmlTag = html.includes('<html') && html.includes('</html>');
  const hasHead = html.includes('<head') && html.includes('</head>');
  const hasBody = html.includes('<body') && html.includes('</body>');
  const hasManifestLink = html.includes('manifest.json');
  const hasSWRegistration = html.includes('sw.js') || html.includes('serviceWorker') || appJs.includes('serviceWorker');
  const hasFavicon = html.includes('favicon');
  
  const checks = [
    { name: 'DOCTYPE', pass: hasDoctype },
    { name: 'HTML tags', pass: hasHtmlTag },
    { name: 'HEAD section', pass: hasHead },
    { name: 'BODY section', pass: hasBody },
    { name: 'PWA Manifest link', pass: hasManifestLink },
    { name: 'Service Worker', pass: hasSWRegistration },
    { name: 'Favicon', pass: hasFavicon }
  ];
  
  let allPass = true;
  for (const check of checks) {
    if (!check.pass) {
      console.log(`   ❌ ขาด: ${check.name}`);
      fixes.push(`HTML_MISSING: ${check.name}`);
      allPass = false;
    }
  }
  
  if (allPass) {
    console.log(`   ✅ HTML structure ครบถ้วนสมบูรณ์!`);
  }
}

// ============================================
// 5. CSS HEALTH CHECK – ตรวจ CSS ว่าไม่มีปัญหา
// ============================================
function checkCssHealth() {
  console.log(`${LOG_PREFIX} 5️⃣ ตรวจสอบ CSS Health...`);
  
  const css = fs.readFileSync('style.css', 'utf8');
  
  // Count important metrics
  const ruleCount = (css.match(/\{/g) || []).length;
  const mediaQueries = (css.match(/@media/g) || []).length;
  const keyframes = (css.match(/@keyframes/g) || []).length;
  const cssVars = (css.match(/--[\w-]+\s*:/g) || []).length;
  
  console.log(`   📊 CSS Rules: ${ruleCount} | Media Queries: ${mediaQueries} | Keyframes: ${keyframes} | Variables: ${cssVars}`);
  
  // Check for potential issues
  const hasImportant = (css.match(/!important/g) || []).length;
  if (hasImportant > 350) {
    console.log(`   ⚠️ มีการใช้ !important มากเกินไป: ${hasImportant} ครั้ง`);
    fixes.push(`CSS: ${hasImportant} !important overrides`);
  }
  
  console.log(`   ✅ CSS ทำงานปกติ (${(css.length / 1024).toFixed(1)} KB)`);
}

// ============================================
// 6. UPDATE WEEKLY STATS IN INDEX.HTML
// ============================================
function updateStatCounters(data) {
  console.log(`${LOG_PREFIX} 6️⃣ อัพเดทตัวเลขสถิติใน index.html...`);
  
  if (!data) {
    console.log('   ⚠️ ไม่มีข้อมูลจาก data.js – ข้ามขั้นตอน');
    return;
  }
  
  let html = fs.readFileSync('index.html', 'utf8');
  let changed = false;
  
  // Update song counts in hero section
  const songCount = data.SONGS.length;
  const animeCount = data.ANIMES.length;
  const pairsCount = data.ANIME_PAIRS.length;
  
  // Update hero-song-count
  const heroSongMatch = html.match(/<span id="hero-song-count">\d+<\/span>/);
  if (heroSongMatch) {
    const newHtml = `<span id="hero-song-count">${songCount}</span>`;
    if (heroSongMatch[0] !== newHtml) {
      html = html.replace(heroSongMatch[0], newHtml);
      changed = true;
    }
  }
  
  // Update stat-songs-count
  const statSongsMatch = html.match(/<span class="stat-num" id="stat-songs-count">\d+<\/span>/);
  if (statSongsMatch) {
    const newHtml = `<span class="stat-num" id="stat-songs-count">${songCount}</span>`;
    if (statSongsMatch[0] !== newHtml) {
      html = html.replace(statSongsMatch[0], newHtml);
      changed = true;
    }
  }
  
  // Update stat-anime-count
  const statAnimeMatch = html.match(/<span class="stat-num" id="stat-anime-count">\d+<\/span>/);
  if (statAnimeMatch) {
    const newHtml = `<span class="stat-num" id="stat-anime-count">${animeCount}</span>`;
    if (statAnimeMatch[0] !== newHtml) {
      html = html.replace(statAnimeMatch[0], newHtml);
      changed = true;
    }
  }
  
  // Update stat-pairs-count
  const statPairsMatch = html.match(/<span class="stat-num" id="stat-pairs-count">\d+<\/span>/);
  if (statPairsMatch) {
    const newHtml = `<span class="stat-num" id="stat-pairs-count">${pairsCount}</span>`;
    if (statPairsMatch[0] !== newHtml) {
      html = html.replace(statPairsMatch[0], newHtml);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync('index.html', html, 'utf8');
    console.log(`   ✅ อัพเดทตัวเลขสถิติ: ${songCount} เพลง • ${animeCount} อนิเมะ • ${pairsCount} คู่แนะนำ`);
    fixes.push(`Stats updated: ${songCount} songs, ${animeCount} anime`);
    totalChanges++;
  } else {
    console.log(`   ℹ️ ตัวเลขสถิติเป็นปัจจุบันแล้ว`);
  }
}

// ============================================
// 7. ROTATE WEEKLY ACCENT / THEME HIGHLIGHTS
// ============================================
function rotateWeeklyAccent() {
  console.log(`${LOG_PREFIX} 7️⃣ หมุนเวียน Weekly Accent Theme...`);
  
  // Accent themes ที่จะหมุนเวียนทุกสัปดาห์
  const accentThemes = [
    { name: 'Sakura Pink', primary: '#ff6b9d', glow: 'rgba(255, 107, 157, 0.35)' },
    { name: 'Ocean Blue', primary: '#38bdf8', glow: 'rgba(56, 189, 248, 0.35)' },
    { name: 'Aurora Purple', primary: '#a78bfa', glow: 'rgba(167, 139, 250, 0.35)' },
    { name: 'Emerald Green', primary: '#34d399', glow: 'rgba(52, 211, 153, 0.35)' },
    { name: 'Sunset Gold', primary: '#fbbf24', glow: 'rgba(251, 191, 36, 0.35)' },
    { name: 'Cyber Cyan', primary: '#22d3ee', glow: 'rgba(34, 211, 238, 0.35)' },
    { name: 'Rose Red', primary: '#fb7185', glow: 'rgba(251, 113, 133, 0.35)' },
  ];
  
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const themeIndex = weekNumber % accentThemes.length;
  const theme = accentThemes[themeIndex];
  
  console.log(`   🎨 Theme สัปดาห์นี้: ${theme.name} (${theme.primary})`);
  
  // Update CSS custom property for weekly accent in style.css
  let css = fs.readFileSync('style.css', 'utf8');
  
  // Check if Weekly Accent variables exist, if not add them
  if (!css.includes('--weekly-accent')) {
    // Add weekly accent variables after :root opening
    const rootMatch = css.match(/:root\s*\{/);
    if (rootMatch) {
      const insertPos = css.indexOf(rootMatch[0]) + rootMatch[0].length;
      const accentVars = `
  /* Weekly Rotating Accent – Auto-updated by maintenance bot */
  --weekly-accent: ${theme.primary};
  --weekly-glow: ${theme.glow};`;
      css = css.slice(0, insertPos) + accentVars + css.slice(insertPos);
      fs.writeFileSync('style.css', css, 'utf8');
      console.log(`   ✅ เพิ่ม Weekly Accent CSS Variables`);
      fixes.push(`Added weekly accent: ${theme.name}`);
      totalChanges++;
    }
  } else {
    // Update existing values
    css = css.replace(/--weekly-accent:\s*[^;]+;/, `--weekly-accent: ${theme.primary};`);
    css = css.replace(/--weekly-glow:\s*[^;]+;/, `--weekly-glow: ${theme.glow};`);
    fs.writeFileSync('style.css', css, 'utf8');
    console.log(`   ✅ อัพเดท Weekly Accent: ${theme.name}`);
    fixes.push(`Weekly Accent rotated: ${theme.name}`);
    totalChanges++;
  }

  // Update weekly-sync-status in index.html to showcase theme and cache version
  let html = fs.readFileSync('index.html', 'utf8');
  const swContent = fs.existsSync('sw.js') ? fs.readFileSync('sw.js', 'utf8') : '';
  const swMatch = swContent.match(/const CACHE_NAME\s*=\s*'haimiya-typo-v(\d+)'/);
  const swVer = swMatch ? `v${swMatch[1]}` : 'v5';

  const syncStatusMatch = html.match(/<div class="weekly-sync-right" id="weekly-sync-status">[\s\S]*?<\/div>/);
  if (syncStatusMatch) {
    const newStatus = `<div class="weekly-sync-right" id="weekly-sync-status">\n      ✨ อัปเดต UI & บำรุงรักษา: ธีม ${theme.name} • แคช ${swVer} (รอบถัดไปอีก 7 วัน)\n    </div>`;
    if (syncStatusMatch[0] !== newStatus) {
      html = html.replace(syncStatusMatch[0], newStatus);
      fs.writeFileSync('index.html', html, 'utf8');
      console.log(`   ✅ อัพเดทสถานะธีม & แคชใน index.html: ${theme.name} (${swVer})`);
      fixes.push(`UI Badge updated: Theme ${theme.name}, Cache ${swVer}`);
      totalChanges++;
    }
  }
}

// ============================================
// 8. MANIFEST VERSION BUMP
// ============================================
function bumpManifestVersion() {
  console.log(`${LOG_PREFIX} 8️⃣ อัพเดท Manifest version stamp...`);
  
  try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    
    // Add/update version timestamp for cache busting
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    manifest.version = `2.0.${dateStamp}`;
    
    fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log(`   ✅ Manifest version: ${manifest.version}`);
    fixes.push(`Manifest version: ${manifest.version}`);
    totalChanges++;
  } catch (e) {
    console.log(`   ⚠️ ไม่สามารถอัพเดท manifest: ${e.message}`);
  }
}

// ============================================
// 9. AUTO-FIX COMMON BUGS
// ============================================
function autoFixCommonBugs(data) {
  console.log(`${LOG_PREFIX} 9️⃣ ตรวจสอบและแก้ไขบัคทั่วไป...`);
  
  if (!data) return;
  
  let fixCount = 0;
  const { SONGS, ANIMES, ANIME_PAIRS } = data;
  
  // Fix songs with null/undefined coverUrl – set to fallback
  for (const song of SONGS) {
    if (!song.coverUrl || song.coverUrl === 'null' || song.coverUrl === 'undefined') {
      song.coverUrl = song.coverFallback || 'favicon-logo.jpg';
      fixCount++;
    }
    // Ensure all songs have required fields
    if (!song.tags) song.tags = ['ไทโป'];
    if (!song.mood) song.mood = 'chill';
    if (!song.bpm) song.bpm = 'ปานกลาง (100 BPM)';
  }
  
  // Fix animes with missing coverUrl
  for (const anime of ANIMES) {
    if (!anime.coverUrl || anime.coverUrl === 'null' || anime.coverUrl === 'undefined') {
      anime.coverUrl = anime.coverFallback || 'favicon-logo.jpg';
      fixCount++;
    }
  }
  
  if (fixCount > 0) {
    // Save fixed data
    const output = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
    fs.writeFileSync('data.js', output, 'utf8');

    const vData = {
      version: `2.${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${new Date().getHours()}`,
      versionCode: Math.floor(Date.now() / 1000),
      songCount: SONGS.length,
      animeCount: ANIMES.length,
      updatedAt: new Date().toISOString(),
      appName: "Haimiya Typo",
      releaseUrl: "https://github.com/bocchi-V2/typo-music-hub/releases/latest"
    };
    fs.writeFileSync('version.json', JSON.stringify(vData, null, 2), 'utf8');

    console.log(`   ✅ แก้ไขบัคข้อมูล ${fixCount} รายการ`);
    fixes.push(`Auto-fixed ${fixCount} data bugs`);
    totalChanges++;
  } else {
    console.log(`   ✅ ไม่พบบัคในข้อมูล – สมบูรณ์!`);
  }
}

// ============================================
// 10. GENERATE MAINTENANCE REPORT
// ============================================
function generateReport() {
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('📋 สรุปผลการบำรุงรักษาประจำสัปดาห์');
  console.log('════════════════════════════════════════════════════');
  
  const now = Date.now();
  maintenanceLog.lastRun = now;
  maintenanceLog.lastRunDate = new Date(now).toISOString();
  maintenanceLog.cycle = (maintenanceLog.cycle || 0) + 1;
  maintenanceLog.fixes = fixes;
  maintenanceLog.totalChanges = totalChanges;
  
  // Keep last 10 runs in history
  if (!maintenanceLog.history) maintenanceLog.history = [];
  maintenanceLog.history.unshift({
    date: new Date(now).toISOString(),
    cycle: maintenanceLog.cycle,
    fixes: [...fixes],
    changes: totalChanges
  });
  maintenanceLog.history = maintenanceLog.history.slice(0, 10);
  
  fs.writeFileSync(MAINTENANCE_LOG_FILE, JSON.stringify(maintenanceLog, null, 2), 'utf8');
  
  console.log(`   🔄 รอบบำรุงรักษาที่: ${maintenanceLog.cycle}`);
  console.log(`   📝 จำนวนการเปลี่ยนแปลง: ${totalChanges}`);
  if (fixes.length > 0) {
    console.log(`   📌 รายการที่ดำเนินการ:`);
    for (const fix of fixes) {
      console.log(`      • ${fix}`);
    }
  } else {
    console.log(`   ✨ ไม่มีการเปลี่ยนแปลง – ระบบสมบูรณ์อยู่แล้ว!`);
  }
  console.log('════════════════════════════════════════════════════');
  console.log(`✅ การบำรุงรักษาประจำสัปดาห์เสร็จสมบูรณ์!`);
  console.log('════════════════════════════════════════════════════');
}

// ============================================
// 11. DEPLOY TO WEB (WHEN --deploy FLAG PASSED)
// ============================================
function deployToWeb() {
  console.log(`${LOG_PREFIX} 🚀 เริ่มกระบวนการ Deploy ขึ้นสู่เว็บ...`);
  try {
    const { execSync } = require('child_process');
    console.log('   📦 กำลังดำเนินการ Deploy ผ่าน Netlify CLI...');
    execSync('npx -y netlify-cli deploy --prod --dir .', { stdio: 'inherit' });
    console.log('   🎉 Deploy ขึ้นเว็บสำเร็จเรียบร้อยแล้ว!');
  } catch (e) {
    console.log(`   ℹ️ หมายเหตุการ Deploy: ${e.message}`);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================
function main() {
  bumpServiceWorkerCache();
  checkAssetIntegrity();
  const data = checkDataIntegrity();
  checkHtmlSyntax();
  checkCssHealth();
  updateStatCounters(data);
  rotateWeeklyAccent();
  bumpManifestVersion();
  autoFixCommonBugs(data);
  generateReport();

  if (process.argv.includes('--deploy')) {
    deployToWeb();
  }
}

main();
