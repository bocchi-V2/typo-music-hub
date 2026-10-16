const fs = require('fs');
const https = require('https');

function loadDB() {
  const code = fs.readFileSync('data.js', 'utf8');
  const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
  return fn();
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function searchITunes(term, country = 'th') {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&country=${country}&limit=5`;
  const json = await fetchJson(url);
  if (!json || !json.results || !json.results.length) return null;
  const track = json.results.find(t => t.previewUrl && t.trackExplicitness !== 'explicit') || json.results.find(t => t.previewUrl) || json.results[0];
  if (!track || !track.previewUrl) return null;
  return {
    title: track.trackName,
    artist: track.artistName,
    previewUrl: track.previewUrl,
    coverUrl: (track.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(track.trackName + ' ' + track.artistName)}`,
    genre: track.primaryGenreName || 'Pop'
  };
}

const NEW_ANIMES = [
  {
    name: "Dan Da Dan",
    nameTH: "ดันดาดัน",
    genres: ["แอ็กชัน", "เหนือธรรมชาติ", "ไซไฟ", "คอมเมดี้"],
    mood: "hype",
    bestPairs: ["Otonoke", "SPECIALZ"],
    synopsis: "โมโมะ สาวมัธยมที่เชื่อเรื่องผี และโอคารุน หนุ่มเนิร์ดที่เชื่อเรื่องเอเลี่ยน ต้องร่วมมือกันต่อสู้กับสิ่งลี้ลับสุดพิศดาร",
    coverUrl: "https://media.kitsu.app/anime/poster_images/47833/original.jpg"
  },
  {
    name: "Cyberpunk: Edgerunners",
    nameTH: "ไซเบอร์พังก์: อาชญากรแดนเถื่อน",
    genres: ["ไซไฟ", "แอ็กชัน", "ดราม่า", "ไซเบอร์พังก์"],
    mood: "sad",
    bestPairs: ["I Really Want to Stay at Your House"],
    synopsis: "เดวิด มาร์ติเนซ เด็กหนุ่มข้างถนนในเมืองไนท์ซิตี้ที่ต้องสูญเสียทุกอย่างและก้าวเข้าสู่เส้นทางของเอดจ์รันเนอร์เพื่อเอาชีวิตรอด",
    coverUrl: "https://media.kitsu.app/anime/poster_images/43225/original.jpg"
  },
  {
    name: "Lycoris Recoil",
    nameTH: "ไลโคริส รีคอยล์",
    genres: ["แอ็กชัน", "มิตรภาพ", "คอมเมดี้", "ชีวิตประจำวัน"],
    mood: "hype",
    bestPairs: ["ALIVE", "Kura Kura"],
    synopsis: "จิซาโตะและทาคินะ สองเจ้าหน้าที่สาวลับองค์กร DA ที่ปฏิบัติการลับเพื่อรักษาความสงบสุขของโตเกียวภายใต้คาเฟ่บังหน้า",
    coverUrl: "https://media.kitsu.app/anime/poster_images/45598/original.jpg"
  }
];

const NEW_CANDIDATES = [
  { term: "I Really Want to Stay at Your House Rosa Walton", country: "us", mood: "sad", lang: "en", anime: "Cyberpunk: Edgerunners", bpm: "ปานกลาง (115 BPM)", tags: ["cyberpunk", "tragedy", "synthpop"], reason: "The tragic cyberpunk anthem of Moon dreams and lost love that broke everyone's hearts", typoIdea: "Neon teal and crimson hologram lettering glitching across city skyline" },
  { term: "Otonoke Creepy Nuts", country: "jp", mood: "hype", lang: "jp", anime: "Dan Da Dan", bpm: "เร็ว (150 BPM)", tags: ["dandadan", "hiphop", "crazy"], reason: "Wild chaotic hip-hop and electronic drop from Dan Da Dan that hypes up action edits instantly", typoIdea: "Trippy warping lettering pulsing violently to heavy 808 bass slides" },
  { term: "Orange SPYAIR", country: "jp", mood: "hype", lang: "jp", anime: "Haikyu!!", bpm: "เร็ว (138 BPM)", tags: ["haikyu", "sports", "sunset"], reason: "Emotional movie theme for Haikyu!! The Dumpster Battle soaring with passionate youth energy", typoIdea: "Warm sunset orange calligraphy soaring upward like a volleyball spike" },
  { term: "ALIVE ClariS", country: "jp", mood: "hype", lang: "jp", anime: "Lycoris Recoil", bpm: "เร็ว (144 BPM)", tags: ["lycoris", "action", "dynamic"], reason: "High-octane energetic opening matching gun-fu action and heartwarming teamwork", typoIdea: "Dual red and blue laser streaks carving sharp sleek typography" },
  { term: "17 Dept", country: "th", mood: "chill", lang: "th", anime: "Skip and Loafer", bpm: "ปานกลาง (96 BPM)", tags: ["17", "dept", "วัยรุ่น", "สดใส"], reason: "เพลงอินดี้ป๊อปฟังสบายที่ชวนนึกถึงช่วงวัย 17 อันแสนสดใสและไร้เดียงสา", typoIdea: "ตัวเลข 17 ลอยเด่นล้อมรอบด้วยดอกไม้และลมพัดเอื่อยๆ" },
  { term: "ซ่อนหา Tattoo Colour", country: "th", mood: "sad", lang: "th", anime: "Weathering with You", bpm: "ช้า (70 BPM)", tags: ["ซ่อนหา", "เหงา", "คิดถึง"], reason: "เพลงช้าทรงคุณค่าที่เปรียบเทียบการตามหาใครสักคนที่ไม่รู้ว่าซ่อนอยู่ที่ไหน", typoIdea: "คำว่า 'ซ่อน' เลื่อนหลบหลังหมอกควันสีเทาอ่อน" },
  { term: "Super Carcare Tattoo Colour", country: "th", mood: "hype", lang: "th", anime: "Bocchi the Rock!", bpm: "เร็ว (128 BPM)", tags: ["สนุก", "ร็อกป๊อป", "กวนๆ"], reason: "ดนตรีฟังก์ร็อกสุดมันส์ที่เพิ่มเอเนอร์จี้ให้คลิปตัดต่อสนุกสนานเป็นทวีคูณ", typoIdea: "ฟอนต์ซิ่งติดสปีดพุ่งทะยานจากซ้ายไปขวาพร้อมควันล้อรถ" },
  { term: "จำเก่ง F.HERO Tilly Birds", country: "th", mood: "sad", lang: "th", anime: "5 Centimeters per Second", bpm: "ปานกลาง (85 BPM)", tags: ["จำเก่ง", "แร็ป", "ความจำ"], reason: "ท่อนฮุกติดหูคู่กับท่อนแร็ปสะเทือนใจเรื่องความทรงจำที่ลืมไม่ลง", typoIdea: "ฟิล์มภาพถ่ายเก่าๆ หมุนวนรอบข้อความตัวพิมพ์ดีด" }
];

async function run() {
  const { ANIMES, SONGS, ANIME_PAIRS } = loadDB();
  const existingSongKeys = new Set(SONGS.map(s => `${s.title.toLowerCase().trim()}_${s.artist.toLowerCase().trim()}`));
  const existingAnimeNames = new Set(ANIMES.map(a => a.name.toLowerCase().trim()));

  let addedAnimes = 0;
  for (const an of NEW_ANIMES) {
    if (!existingAnimeNames.has(an.name.toLowerCase().trim())) {
      const newId = ANIMES.length > 0 ? Math.max(...ANIMES.map(a => a.id || 0)) + 1 : 1;
      ANIMES.push({
        id: newId,
        name: an.name,
        nameTH: an.nameTH,
        genre: an.genres.join(', '),
        mood: an.mood,
        desc: an.synopsis,
        coverUrl: an.coverUrl
      });
      existingAnimeNames.add(an.name.toLowerCase().trim());
      addedAnimes++;
      console.log(`🌸 เพิ่มอนิเมะใหม่: ${an.name} (${an.nameTH})`);
    }
  }

  let addedSongs = 0;
  let nextId = SONGS.length > 0 ? Math.max(...SONGS.map(s => s.id || 0)) + 1 : 1;

  for (const cand of NEW_CANDIDATES) {
    const it = await searchITunes(cand.term, cand.country);
    if (!it) {
      console.log(`⚠️ ค้นหาไม่พบ: ${cand.term}`);
      continue;
    }
    const key = `${it.title.toLowerCase().trim()}_${it.artist.toLowerCase().trim()}`;
    if (existingSongKeys.has(key)) {
      console.log(`⏩ มีเพลงนี้แล้ว: "${it.title}" - ${it.artist}`);
      continue;
    }

    const newSong = {
      id: nextId++,
      title: it.title,
      artist: it.artist,
      lang: cand.lang,
      mood: cand.mood,
      bpm: cand.bpm,
      tags: cand.tags,
      previewUrl: it.previewUrl,
      coverUrl: it.coverUrl,
      spotifyUrl: it.spotifyUrl,
      matchingAnime: cand.anime,
      reason: cand.reason,
      typoIdea: cand.typoIdea
    };

    SONGS.push(newSong);
    existingSongKeys.add(key);
    addedSongs++;
    console.log(`✅ [${newSong.id}] เพิ่มเพลงสำเร็จ: "${newSong.title}" โดย ${newSong.artist} (Anime: ${cand.anime})`);

    ANIME_PAIRS.push({
      id: ANIME_PAIRS.length + 1,
      anime: cand.anime,
      songTitle: newSong.title,
      songArtist: newSong.artist,
      mood: cand.mood,
      bpm: cand.bpm,
      reason: cand.reason,
      typoIdea: cand.typoIdea,
      previewUrl: newSong.previewUrl,
      coverUrl: newSong.coverUrl
    });
  }

  const output = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', output, 'utf8');
  console.log(`\n🎉 สรุปการอัปเดต: เพิ่ม ${addedAnimes} อนิเมะ | เพิ่ม ${addedSongs} เพลง`);
  console.log(`📊 ยอดรวมในระบบ: อนิเมะ ${ANIMES.length} เรื่อง | เพลงทั้งหมด ${SONGS.length} เพลง | คู่แนะนำ ${ANIME_PAIRS.length} คู่`);
}

run();
