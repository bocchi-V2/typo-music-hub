/**
 * add_funk_secret_zone.js
 * ดึงเพลงโซน Funk จาก Spotify / iTunes (ครอบคลุม Brazilian Funk, Phonk Funk, Funk Hits, Classic Funk)
 * และเพิ่มเข้าไปใน data.js เป็นภาษา/โซน 'funk'
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_FILE = path.join(__dirname, 'data.js');

function itunesSearch(term, limit = 50) {
  return new Promise((resolve) => {
    const url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(term) + '&entity=song&limit=' + limit;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
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

const queries = [
  'funk',
  'brazilian funk',
  'funk brasil',
  'funk carioca',
  'montagem funk',
  'funk mandelao',
  'funk automotivo',
  'baile funk',
  'funk phonk',
  'drift funk',
  'uptown funk mark ronson',
  'funk hits',
  'classic funk',
  'earth wind and fire',
  'silk sonic',
  'daft punk get lucky',
  'kool and the gang funk',
  'tuca donka cursedevil',
  'saravia funk',
  'automotivo bibi fogosa',
  'mtg funk',
  'mc fioti bum bum tam tam',
  'mc kevinho',
  'mc poze do rodo',
  'mc ryan sp',
  'mc hariel',
  'mc ig',
  'kordhell phonk',
  'dvrst close eyes',
  'interworld metamorphosis',
  'hensonn sahara',
  'stevie wonder superstition',
  'rick james super freak',
  'jamiroquai canned heat',
  'thundercat them changes',
  'vulfpeck 1612',
  'anderson paak come down',
  'parliament give up the funk',
  'funk pop',
  'pedro sampaio dancarina',
  'anitta vai malandra',
  'l7nnon ai preto',
  'dj topo quem nao quer sou eu',
  'dj lk da escocia tubarao te amo'
];

async function main() {
  console.log('🎵 กำลังดึงเพลง Funk จาก iTunes & Spotify queries...');
  
  // โหลด data.js
  let content = fs.readFileSync(DATA_FILE, 'utf8');
  const songSection = content.substring(content.indexOf('const SONGS'));
  const existingIds = songSection.match(/"id":\s*(\d+)/g);
  const maxId = existingIds ? Math.max(...existingIds.map(m => parseInt(m.match(/\d+/)[0]))) : 0;
  console.log(`📊 Song ID สูงสุดปัจจุบัน: ${maxId}`);

  // โหลดชื่อเพลงเดิมเพื่อกันซ้ำ
  const existingKeys = new Set();
  const titleMatches = songSection.match(/"title":\s*"([^"]+)"/g);
  if (titleMatches) {
    titleMatches.forEach(m => {
      const t = m.match(/"title":\s*"([^"]+)"/)[1].toLowerCase().trim();
      existingKeys.add(t);
    });
  }

  // โหลดอนิเมะทั้งหมดเพื่อสุ่มคู่
  const animeIds = [];
  const animeMatches = content.match(/"id":\s*(\d+)/g) || [];
  // เอาเฉพาะ 1000 ID แรก
  for (let i = 1; i <= 1000; i++) {
    animeIds.push(i);
  }

  const collected = new Map();

  for (const q of queries) {
    console.log(`🔍 ค้นหา: "${q}"...`);
    const results = await itunesSearch(q, 45);
    for (const item of results) {
      if (!item.trackName || !item.artistName || !item.previewUrl) continue;

      const cleanTitle = item.trackName.trim();
      const cleanArtist = item.artistName.trim();
      const normKey = (cleanTitle + ' ' + cleanArtist).toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/[^a-z0-9]/g, '');

      if (existingKeys.has(cleanTitle.toLowerCase()) || collected.has(normKey)) {
        continue;
      }

      // ตรวจสอบแนวเพลงว่าเป็น Funk / Phonk / Dance / Electronic / R&B / Pop
      const genre = (item.primaryGenreName || '').toLowerCase();
      const lowerTitle = cleanTitle.toLowerCase();
      const lowerArtist = cleanArtist.toLowerCase();
      
      const isFunkRelated = lowerTitle.includes('funk') || 
                            lowerTitle.includes('montagem') || 
                            lowerTitle.includes('automotivo') || 
                            lowerTitle.includes('phonk') || 
                            lowerTitle.includes('mtg') || 
                            lowerTitle.includes('baile') || 
                            lowerArtist.includes('mc ') || 
                            lowerArtist.includes('dj ') || 
                            lowerArtist.includes('s3bzs') || 
                            lowerArtist.includes('kordhell') || 
                            lowerArtist.includes('dvrst') || 
                            lowerArtist.includes('silk sonic') || 
                            lowerArtist.includes('earth, wind') || 
                            lowerArtist.includes('kool & the gang') || 
                            lowerArtist.includes('bruno mars') || 
                            lowerArtist.includes('daft punk') || 
                            genre.includes('dance') || 
                            genre.includes('latin') || 
                            genre.includes('electronic') || 
                            genre.includes('r&b') || 
                            genre.includes('pop');

      if (!isFunkRelated) continue;

      collected.set(normKey, item);
    }
  }

  console.log(`\n✨ รวบรวมเพลง Funk ที่ผ่านเกณฑ์ได้ทั้งหมด: ${collected.size} เพลง`);

  // กำหนด Mood, Tags, BPM, และ Typo Idea สำหรับ Funk
  function determineMood(trackName, artistName, genre) {
    const t = (trackName + ' ' + artistName).toLowerCase();
    if (t.includes('slowed') || t.includes('chill') || t.includes('leave the door') || t.includes('changes') || t.includes('reverb')) {
      return 'chill';
    }
    if (t.includes('september') || t.includes('celebration') || t.includes('treasure') || t.includes('get lucky') || t.includes('dancarina')) {
      return 'happy';
    }
    if (t.includes('phonk') || t.includes('murder') || t.includes('metamorphosis') || t.includes('sahara') || t.includes('destruidor')) {
      return 'epic';
    }
    return 'hype';
  }

  function getFunkTags(trackName, artistName, mood) {
    const t = (trackName + ' ' + artistName).toLowerCase();
    const tags = ['Funk'];
    if (t.includes('montagem') || t.includes('automotivo') || t.includes('brazilian') || t.includes('brasil') || t.includes('mtg') || t.includes('baile')) {
      tags.push('บราซิล', 'เบสหนัก', 'สับๆ');
    } else if (t.includes('phonk') || t.includes('kordhell') || t.includes('dvrst')) {
      tags.push('Phonk', 'ดริฟต์', 'สายดาร์ก');
    } else if (t.includes('uptown') || t.includes('bruno') || t.includes('silk sonic') || t.includes('september')) {
      tags.push('กรู๊ฟแน่น', 'ดิสโก้', 'ไวรัล');
    } else {
      tags.push('จังหวะสับ', 'เบสแน่น', 'แดนซ์');
    }
    if (mood === 'hype') tags.push('เดือดไฟลุก');
    if (mood === 'chill') tags.push('สมูทลอยๆ');
    return tags.slice(0, 4);
  }

  function getFunkBpm(mood) {
    if (mood === 'hype') return 'เร็ว (130-145 BPM)';
    if (mood === 'epic') return 'เร็ว (138-160 BPM)';
    if (mood === 'chill') return 'ปานกลาง (85-105 BPM)';
    return 'เร็ว (115-128 BPM)';
  }

  function getTypoIdea(mood, title, artist) {
    if (mood === 'hype' || mood === 'epic') {
      return `ตัวหนังสือหนาสไตล์ Bold Chrome หรือ Cyberpunk Glitch สีม่วงนีออน-เขียวนีออน ขยายสลับกระตุกสั่นตามเสียง Bass Drop และจังหวะกลองสับแบบบราซิลเลียนฟังก์`;
    }
    if (mood === 'happy') {
      return `ฟอนต์ Retro Disco สไตล์ 70s-80s สีส้มทอง มีแสงไฟนีออนวิบวับและแอนิเมชันเด้ง Pop-up ลื่นไหลตามกรู๊ฟกีตาร์และเบส`;
    }
    return `ฟอนต์มินิมอลโมเดิร์นสีขาวนวล สลับเบลอนุ่มนวล ลอยไหลเอื่อยๆ มีประกายละอองแสงตามเสียงเครื่องเป่าและคีย์บอร์ดนุ่มๆ`;
  }

  function getReason(title, artist) {
    return `เพลงสไตล์ Funk & Phonk จังหวะเบสแน่นตึ้บและกลองสับละเอียด เหมาะอย่างยิ่งกับคลิปไทโปสายตัดต่อซีนแอคชั่น แดนซ์ หรือสลับภาพเร็วๆ (Fast-cut beat sync)`;
  }

  // สร้าง Song Objects
  let nextId = maxId + 1;
  const newSongs = [];

  for (const [key, item] of collected.entries()) {
    const title = item.trackName.trim();
    const artist = item.artistName.trim();
    const coverUrl = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '';
    const mood = determineMood(title, artist, item.primaryGenreName);
    const tags = getFunkTags(title, artist, mood);
    const bpm = getFunkBpm(mood);
    const primaryAnimeId = ((nextId * 7) % 1000) + 1;
    const secondaryAnimeId = (((nextId * 13) + 37) % 1000) + 1;

    const song = {
      id: nextId,
      title: title,
      artist: artist,
      coverUrl: coverUrl,
      previewUrl: item.previewUrl,
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(title + ' ' + artist)}`,
      mood: mood,
      tags: tags,
      bpm: bpm,
      lang: 'funk',
      animeId: primaryAnimeId,
      animeMatch: [primaryAnimeId, secondaryAnimeId],
      reason: getReason(title, artist),
      typoIdea: getTypoIdea(mood, title, artist),
      audioUrl: item.previewUrl,
      audioFallback: null
    };

    newSongs.push(song);
    nextId++;
  }

  console.log(`\n🎉 เตรียมเพิ่มเพลง Funk ใหม่: ${newSongs.length} เพลง (ID: ${maxId + 1} -> ${nextId - 1})`);

  // บันทึกลง data.js
  const songsEndIdx = content.indexOf('const ANIME_PAIRS');
  const insertPos = content.lastIndexOf('];', songsEndIdx);

  if (insertPos === -1) {
    console.error('❌ หาตำแหน่งสิ้นสุด SONGS array ไม่เจอ');
    process.exit(1);
  }

  const newSongsJson = newSongs.map(s => {
    return `  ${JSON.stringify(s, null, 2).split('\n').join('\n  ')}`;
  }).join(',\n');

  content = content.substring(0, insertPos) + ',\n' + newSongsJson + '\n' + content.substring(insertPos);

  fs.writeFileSync(DATA_FILE, content, 'utf8');
  console.log(`✅ สำเร็จ! เพิ่มเพลง Funk จำนวน ${newSongs.length} เพลงลงใน data.js เรียบร้อยแล้ว!`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
