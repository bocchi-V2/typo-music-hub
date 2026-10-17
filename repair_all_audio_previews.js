/**
 * REPAIR_ALL_AUDIO_PREVIEWS.JS
 * 1. Cleans all cross-song false audio fallbacks so NO song ever plays someone else's song.
 * 2. Replaces expired Deezer (dzcdn.net) URLs with permanent Apple CDN audio preview URLs from iTunes.
 * 3. Sets needsLiveResolution on any track that needs live matching so the browser resolves it on click.
 */

const fs = require('fs');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function searchItunes(title, artist, lang = 'en') {
  const cleanTitle = title.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  const cleanArtist = artist.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  const term = `${cleanTitle} ${cleanArtist}`.trim();
  const country = lang === 'th' ? 'th' : (lang === 'jp' ? 'jp' : (lang === 'kr' ? 'kr' : 'us'));

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=song&limit=1`;
  const json = await fetchJson(url);
  if (json && json.results && json.results[0] && json.results[0].previewUrl) {
    return json.results[0];
  }

  // Fallback to US store if not found
  if (country !== 'us') {
    const urlUs = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=us&entity=song&limit=1`;
    const jsonUs = await fetchJson(urlUs);
    if (jsonUs && jsonUs.results && jsonUs.results[0] && jsonUs.results[0].previewUrl) {
      return jsonUs.results[0];
    }
  }

  return null;
}

async function main() {
  console.log('🔧 กำลังตรวจสอบและซ่อมแซมไฟล์เสียงทั้งหมดใน data.js...');

  const code = fs.readFileSync('data.js', 'utf8');
  const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
  const { ANIMES, SONGS, ANIME_PAIRS } = fn();

  console.log(`📊 จำนวนเพลงทั้งหมด: ${SONGS.length} เพลง`);

  // 1. ล้าง false fallbacks ทั้งหมด: ห้ามไม่ให้ audioFallback ชี้ไปที่เพลงอื่นเด็ดขาด!
  let clearedFallbacks = 0;
  SONGS.forEach(s => {
    // ถ้า audioFallback ไม่เหมือน previewUrl ให้ตั้งค่า audioFallback = previewUrl เพื่อป้องกันการเล่นเสียงมั่วของเพลงอื่น
    if (s.audioFallback && s.audioFallback !== s.previewUrl) {
      s.audioFallback = s.previewUrl;
      clearedFallbacks++;
    }
  });
  console.log(`🛡️ ล้างเสียงสำรองที่ไม่ตรงกับชื่อเพลงทิ้งทั้งหมด: ${clearedFallbacks} เพลง`);

  // 2. ค้นหาเพลงที่มี URL ของ Deezer (dzcdn.net) ซึ่งโทเค็นหมดอายุ
  const dzSongs = SONGS.filter(s => (s.previewUrl && s.previewUrl.includes('dzcdn.net')) || (s.audioUrl && s.audioUrl.includes('dzcdn.net')));
  console.log(`🔍 ตรวจพบเพลงที่ใช้ลิงก์ Deezer หมดอายุ: ${dzSongs.length} เพลง`);

  let replacedDz = 0;
  let notFoundDz = 0;
  const batchSize = 10;

  for (let i = 0; i < dzSongs.length; i += batchSize) {
    const batch = dzSongs.slice(i, i + batchSize);
    await Promise.all(batch.map(async (song) => {
      const track = await searchItunes(song.title, song.artist, song.lang);
      if (track && track.previewUrl) {
        song.previewUrl = track.previewUrl;
        song.audioUrl = track.previewUrl;
        song.audioFallback = track.previewUrl;
        if (track.artworkUrl100) {
          song.coverUrl = track.artworkUrl100.replace('100x100', '600x600');
        }
        song.needsLiveResolution = false;
        replacedDz++;
      } else {
        song.needsLiveResolution = true; // มาร์กไว้ให้เบราว์เซอร์ดึงแบบสดตอนกดฟัง
        notFoundDz++;
      }
    }));

    if ((i + batchSize) % 100 === 0 || i + batchSize >= dzSongs.length) {
      const prog = Math.min(i + batchSize, dzSongs.length);
      console.log(`  ความคืบหน้าซิงค์ Deezer -> iTunes: ${prog}/${dzSongs.length} (ได้เสียง Apple CDN ถาวรแล้ว ${replacedDz} เพลง)`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n🎉 สรุปการซ่อมแซม:`);
  console.log(`  ✅ แปลงเป็นเสียง Apple CDN แท้สำเร็จ: ${replacedDz} เพลง`);
  console.log(`  ⚡ ตั้งค่า Live Resolution สำหรับเพลงที่เหลือ: ${notFoundDz} เพลง`);

  // บันทึกลง data.js
  console.log('\n💾 กำลังบันทึกไฟล์ data.js...');
  const output = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', output, 'utf8');
  console.log('✅ บันทึก data.js เรียบร้อยแล้ว!');

  // อัปเดต version.json
  const versionObj = JSON.parse(fs.readFileSync('version.json', 'utf8'));
  versionObj.updatedAt = new Date().toISOString();
  fs.writeFileSync('version.json', JSON.stringify(versionObj, null, 2), 'utf8');
}

main().catch(console.error);
