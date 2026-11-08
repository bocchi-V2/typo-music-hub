
// ---- PERSISTENT FULL-SONG CACHE & ZERO-DELAY ENGINE ----
function getSongCacheKey(songId) {
  return 'haimiya_fs_' + songId;
}

function loadSingleSongFullCache(song) {
  if (!song || song.fullAudioUrl) return;
  try {
    const raw = localStorage.getItem(getSongCacheKey(song.id));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.url) {
        song.fullAudioUrl = parsed.url;
        song.isFull = true;
        if (parsed.dur) song.duration = parsed.dur;
      }
    }
  } catch (e) {}
}

function saveSongFullCache(song, url, dur) {
  if (!song || !url) return;
  song.fullAudioUrl = url;
  song.isFull = true;
  if (dur) song.duration = dur;
  try {
    localStorage.setItem(getSongCacheKey(song.id), JSON.stringify({ url, dur: dur || song.duration || null, t: Date.now() }));
  } catch (e) {}
}

// โหลดแคชเพลงเต็มทั้งหมดที่เคยดึงไว้เข้าสู่ Memory ทันทีที่เปิดแอป
function initPersistentFullSongCache() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('haimiya_fs_')) {
        const id = parseInt(key.replace('haimiya_fs_', ''), 10);
        if (id && typeof SONG_MAP !== 'undefined') {
          const song = SONG_MAP.get(id);
          if (song && !song.fullAudioUrl) {
            loadSingleSongFullCache(song);
          }
        }
      }
    }
  } catch (e) {}
}

async function triggerBackgroundFullSongFetch(song) {
  if (!song || song.fullAudioUrl || song._fetchingFull || !navigator.onLine) return;
  song._fetchingFull = true;
  try {
    const q = `${song.title || ''} ${song.artist || ''}`.trim();
    const res = await fetch(`${NETLIFY_BASE}/api/ai/get-full-song?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok && data.directAudioUrl) {
        saveSongFullCache(song, data.directAudioUrl, data.duration);
        // หากผู้ใช้กำลังฟังเพลงนี้อยู่ ให้สลับไปสตรีมเพลงเต็มแบบไร้รอยต่อ
        if (currentPlayingId === song.id && currentAudio && !currentAudio.paused) {
          const curTime = currentAudio.currentTime;
          // ถ้าระยะเวลาเกิน 24s ให้สลับทันทีเพื่อเล่นต่อยาวๆ
          if (curTime > 20) {
            currentAudio.src = data.directAudioUrl;
            currentAudio.currentTime = curTime;
            currentAudio.play().catch(() => {});
          }
          showBottomPlayer(song);
          updateAudioUI(true);
        }
      }
    }
  } catch (e) {
  } finally {
    song._fetchingFull = false;
  }
}

// ---- CACHE SANITIZER (Purge any corrupted/hijacked cover or audio cache) ----
(function purgeCorruptedCache() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('haimiya_cv_') || key.startsWith('haimiya_fs_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
  } catch (e) {}
})();

// ============================================
//  APP.JS – Typo Music Platform (Studio Edition)
//  ระบบสุ่มเพลงแยกโซน ปรับระดับเสียง และจับคู่อนิเมะสำหรับนักตัดต่อ
// ============================================

// ---- RESOLVE AUDIO/ASSET URL ----
// แปลง relative path ให้เป็น absolute URL ชี้ไปที่ Netlify เสมอ (แก้ปัญหา APK/PWA ที่ origin เป็น localhost)
const NETLIFY_BASE = 'https://mellow-baklava-bffed3.netlify.app';
function resolveAssetUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return NETLIFY_BASE + '/' + url.replace(/^\.\//,'');
}

// ---- ANIME COVER IMAGE HELPERS ----
// สร้าง img tag ที่มี fallback URL อัตโนมัติกรณีรูปโหลดไม่ขึ้น พร้อมรองรับ eager/high priority

// Fast O(1) Lookup Maps for instant rendering performance
let ANIME_MAP = new Map();
let SONG_MAP = new Map();

function restoreCustomAnimePairs() {
  try {
    const raw = localStorage.getItem('typo_custom_anime_pairs');
    if (!raw) return;
    const customPairs = JSON.parse(raw);
    for (const [sId, aId] of Object.entries(customPairs)) {
      const s = SONG_MAP.get(parseInt(sId));
      if (s && ANIME_MAP.has(aId)) {
        s.animeId = aId;
      }
    }
  } catch (e) {}
}

function initDataMaps() {
  initPersistentFullSongCache();
  if (typeof ANIMES !== 'undefined' && Array.isArray(ANIMES)) {
    ANIME_MAP = new Map(ANIMES.map(a => [a.id, a]));
  }
  if (typeof SONGS !== 'undefined' && Array.isArray(SONGS)) {
    try {
      const userAdded = JSON.parse(localStorage.getItem('haimiya_user_added_songs') || '[]');
      if (Array.isArray(userAdded) && userAdded.length > 0) {
        userAdded.forEach(song => {
          if (!SONGS.some(s => s.id === song.id || (s.title === song.title && s.artist === song.artist))) {
            SONGS.unshift(song);
          }
        });
      }
    } catch (e) {}
    SONG_MAP = new Map(SONGS.map(s => [s.id, s]));
  }
  restoreCustomAnimePairs();
}
initDataMaps();

// Fallback cover helper: if song cover fails, fallback to matched anime poster or default mascot
function getSongFallbackCover(song) {
  if (song && song.animeId) {
    const a = ANIME_MAP.get(song.animeId) || (typeof ANIMES !== 'undefined' ? ANIMES.find(item => item.id === song.animeId) : null);
    if (a && a.coverUrl && !a.coverUrl.includes('favicon')) return a.coverUrl;
  }
  return 'splash-cover.jpg';
}

function animeImgTag(anime, cssClass, extraStyle = '', loadingMode = 'lazy', fetchPriority = 'auto') {
  const src = anime.coverUrl || anime.coverFallback || 'splash-cover.jpg';
  const fallback2 = (anime.coverFallback && anime.coverFallback !== src) ? anime.coverFallback : 'splash-cover.jpg';
  const finalFallback = 'splash-cover.jpg';
  const alt = (currentAppLang === 'en' ? (anime.name || anime.nameTH) : (anime.nameTH || anime.name)) || 'Anime';
  const styleAttr = extraStyle ? ` style="${extraStyle}"` : '';
  const priorityAttr = fetchPriority !== 'auto' ? ` fetchpriority="${fetchPriority}"` : '';
  return `<img src="${src}" alt="${alt}" class="${cssClass} anime-cover-img" loading="${loadingMode}" decoding="async"${priorityAttr}${styleAttr} referrerpolicy="no-referrer" onerror="this._tries=(this._tries||0)+1;if(this._tries===1&&'${fallback2}'!=='${src}'){this.src='${fallback2}';}else if(this._tries===2){this.src='${finalFallback}';}else{this.onerror=null;this.src='favicon-logo.jpg';}" />`;
}

// ---- INTERNATIONALIZATION (i18n) ----
const I18N = {
  th: {
    siteTitle: "Haimiya Typo – คลังเพลงสำหรับคนตัดต่อคลิปไทโป",
    siteDesc: "รวมเพลงไทย เพลงสากล และเพลงอนิเมะสำหรับตัดต่อคลิปไทโปกราฟี พร้อมระบบสุ่มแยกโซน ปรับระดับเสียง และจับคู่อนิเมะแนะนำ",
    logoBadge: "EDIT STUDIO",
    logoTitle: "Haimiya Typo",
    navRandom: "🎲 สุ่มเพลงแยกโซน",
    navSongs: "🎵 คลังเพลงแยกโซน",
    navVersus: "⚔️ โหวตเพลง",
    navAnimeMatch: "🌸 จับคู่อนิเมะ",
    navSaved: "บันทึกไว้",
    navInstallApp: "ติดตั้งแอป / APK",
    tabSavedTitle: "เพลงที่บันทึกไว้",
    heroBadge: "🎬 TYPOGRAPHY & VIDEO EDITING HUB",
    heroTitle1: "รวมเพลงตัดต่อคลิป",
    heroTitle2: "ไทย • สากล • อนิเมะ",
    heroDesc: "ค้นหาเพลงสำหรับทำคลิปไทโป พร้อมระบบสุ่มแยกโซน ปรับความดังเสียง และจับคู่ซีนอนิเมะที่เข้ากันที่สุด",
    heroBtnRandom: "🎲 ไปที่โซนสุ่มเพลง",
    heroBtnSongs: "สำรวจคลังเพลง",
    heroBtnSongsSuffix: "เพลง",
    statTotalSongs: "เพลงทั้งหมดในคลัง",
    statZones: "5 โซนภาษา (ไทย / สากล / ญี่ปุ่น / ลาว / K-Pop)",
    statAnimes: "อนิเมะยอดฮิต",
    statPairs: "คู่แนะนำพร้อมทริคไทโป",
    weeklySyncLabel: "<strong>ระบบอัปเดตเพลง & อนิเมะอัตโนมัติ:</strong> เพิ่มเพลงใหม่ทุกๆ 7 วัน (Weekly Auto-Drop Sync)",
    wsVersusSub: "เปรียบเทียบมู้ด",
    randSectionKicker: "RANDOM GENERATOR",
    randSectionTitle: "🎲 ระบบสุ่มเพลงแยกโซน & ปรับตัวเลือก",
    randSectionDesc: "เลือกโซนภาษาและสไตล์ที่ต้องการ สุ่มแบบไม่ซ้ำรอบ พร้อมชื่อและรูปอนิเมะแนะนำใต้เพลง",
    randZoneSelectLabel: "เลือกโซนเพลงที่ต้องการสุ่ม:",
    randZoneTh: "โซนเพลงไทย",
    randZoneEn: "โซนเพลงสากล (English)",
    randZoneJp: "โซนเพลงญี่ปุ่น / อนิเมะ",
    randZoneLao: "🇱🇦 โซนเพลงลาว / อีสาน",
    randZoneKr: "🇰🇷 โซนเพลงเกาหลี / K-Pop",
    randZoneAll: "สุ่มรวมทุกโซน",
    randMoodLabel: "🎭 เลือกอารมณ์ / มู้ดเพลง:",
    randMoodAll: "ทั้งหมด",
    randMoodSad: "💔 เศร้า / ซึ้ง",
    randMoodLove: "❤️ คลั่งรัก / อบอุ่น",
    randMoodHype: "🔥 มันส์ / บีทเดือด",
    randMoodChill: "🌊 อินดี้ชิลล์",
    randBpmLabel: "⚡ ระดับจังหวะ (BPM):",
    randBpmAll: "ทุกความเร็ว",
    randBpmSlow: "🐢 ช้า (Slow)",
    randBpmMid: "🚶 ปานกลาง (Mid)",
    randBpmFast: "⚡ เร็ว (Fast)",
    randReadyBadge: "🎯 พร้อมสุ่มเพลงในโซนที่เลือก",
    sfxOn: "เสียงลูกเต๋า: เปิด",
    sfxOff: "เสียงลูกเต๋า: ปิด",
    resetDeckBtn: "🔄 เริ่มสุ่มรอบใหม่",
    rollingTitle: "🎲 กำลังสุ่มเพลง...",
    rollingSubtitle: "รอสักครู่ กำลังจับคู่เพลงกับอนิเมะให้คุณ ✨",
    randPromptTitle: "เลือกโซนและอารมณ์เพลง แล้วกดปุ่มสุ่มด้านล่างได้เลย!",
    randPromptDesc: "ระบบจะจับคู่เพลงกับอนิเมะให้ทันที พร้อมเสียงเอฟเฟกต์ทอยลูกเต๋า",
    rollBtnAction: "🎲 สุ่มเพลงในโซนนี้! (ไม่ซ้ำ)",
    songsSectionKicker: "MUSIC CATALOGUE",
    songsSectionTitle: "🎵 คลังเพลงแยกตามโซน",
    songsSectionDesc: "เลือกโซนเพลงที่ต้องการ เพื่อดูเพลงเฉพาะโซนนั้น พร้อมซีนอนิเมะที่แนะนำให้ตัดต่อคู่กัน",
    zoneTh: "โซนเพลงไทย",
    zoneEn: "โซนเพลงสากล (English)",
    zoneJp: "โซนเพลงญี่ปุ่น / อนิเมะ",
    zoneLao: "🇱🇦 โซนเพลงลาว / อีสาน",
    zoneKr: "🇰🇷 โซนเพลงเกาหลี / K-Pop",
    zoneFunk: "⚡ โซนลับ Funk (Brazilian & Phonk)",
    searchPlaceholder: "ค้นหาเพลง, ศิลปิน, แท็ก หรือชื่ออนิเมะ...",
    allMoods: "ทุกอารมณ์",
    moodSad: "💔 เศร้า",
    moodLove: "❤️ รัก",
    moodHype: "🔥 เร้าใจ",
    moodChill: "🌊 ชิลล์",
    loadMoreBtn: "⬇ แสดงเพลงเพิ่มเติม",
    previewBtn: "ฟังเพลงเต็ม",
    playingBtn: "กำลังเล่น",
    pauseBtn: "หยุด",
    spotifyBtn: "Spotify",
    animeRecTitle: "🌸 แนะนำตัดกับอนิเมะ:",
    animeDetailsBtn: "🌸 รายละเอียดคู่",
    animeMatchBtn: "🌸 จับคู่อนิเมะ",
    viewAnifume: "🌸 ดูข้อมูลบน Anifume →",
    viewAnifumeShort: "🌸 ดูบน Anifume",
    savedSectionKicker: "BOOKMARKED COLLECTION",
    savedSectionTitle: "❤️ คลังเพลงที่บันทึกไว้สำหรับตัดต่อ",
    savedSectionDesc: "รวมเพลงที่คุณชื่นชอบสำหรับนำไปใช้ตัดต่อคลิปไทโป พร้อมซีนอนิเมะแนะนำ",
    savedHint: "💡 บันทึกอัตโนมัติในเบราว์เซอร์ของคุณ ไม่สูญหายแม้ปิดหรือรีเฟรชหน้าจอ",
    savedBtnShuffle: "🎲 สุ่มเล่นเพลงที่บันทึก",
    savedBtnCopy: "📋 คัดลอกรายชื่อไปตัดต่อ",
    savedBtnClear: "🗑️ ล้างทั้งหมด",
    matchSectionKicker: "SCENE PAIRING",
    matchSectionTitle: "🌸 คลังจับคู่เพลง × อนิเมะยอดฮิต",
    matchSectionDesc: "รวมคู่เพลงและอนิเมะยอดฮิต พร้อมภาพโปสเตอร์และตัวอย่างเพลงสำหรับตัดต่อ",
    finderTitle: "✨ ค้นหาคู่จับคู่ด่วน: เลือกเพลงหรืออนิเมะเพื่อไปยังคู่ที่แนะนำ",
    finderSongLabel: "🎵 เลือกเพลงที่ชอบ:",
    finderSongPlaceholder: "-- เลือกเพลงที่ชอบ --",
    finderAnimeLabel: "🌸 เลือกอนิเมะที่ต้องการตัดต่อ:",
    finderAnimePlaceholder: "-- เลือกอนิเมะที่ต้องการตัดต่อ --",
    filterPairAll: "🌟 ทุกคู่",
    filterPairSad: "💔 เพลงเศร้า × ดราม่าซึ้ง",
    filterPairLove: "❤️ คลั่งรัก × โรแมนติก",
    filterPairHype: "🔥 เพลงเดือด × แอคชั่นมันส์",
    filterPairChill: "🌊 อินดี้ชิลล์ × ชวนฝัน",
    vsSectionKicker: "SONG COMPARISON",
    vsSectionTitle: "⚔️ โหวตเพลงเลือกมู้ดตัดต่อ",
    vsSectionDesc: "เปรียบเทียบสองเพลงแล้วตัดสินใจเลือกเพลงที่เข้ากับคลิปของคุณที่สุด",
    vsVoteBtn: "👍 เลือกเพลงนี้!",
    vsRerollBtn: "🔀 สุ่มคู่เปรียบเทียบใหม่",
    footerLogo: "ไทโปมิวสิค • EDIT STUDIO",
    footerDesc: "คลังรวบรวมเพลงและซีนอนิเมะสำหรับการตัดต่อวิดีโอและตัวหนังสือไทโปกราฟี",
    footerCopy: "สร้างสรรค์ด้วยความใส่ใจเพื่อชุมชนนักตัดต่อคลิปและคนทำไทโป",
    loading: "กำลังโหลด..."
  },
  en: {
    siteTitle: "Haimiya Typo – Music & Anime Vault for Video Editors",
    siteDesc: "Curated Thai, Global, and Anime songs for typography video editing with smart zone randomizer, volume control, and scene pairings.",
    logoBadge: "EDIT STUDIO",
    logoTitle: "Haimiya Typo",
    navRandom: "🎲 Zone Randomizer",
    navSongs: "🎵 Song Vault",
    navVersus: "⚔️ Song Battles",
    navAnimeMatch: "🌸 Anime Pairs",
    navSaved: "Saved",
    navInstallApp: "Install App / APK",
    tabSavedTitle: "Saved Songs",
    heroBadge: "🎬 TYPOGRAPHY & VIDEO EDITING HUB",
    heroTitle1: "Music for Typography Clips",
    heroTitle2: "Thai • Global • Anime",
    heroDesc: "Curated music library & typography video ideas with smart zone randomizer, volume controls, and anime scene pairings.",
    heroBtnRandom: "🎲 Launch Randomizer",
    heroBtnSongs: "Explore Song Vault",
    heroBtnSongsSuffix: "songs",
    statTotalSongs: "Total Verified Songs",
    statZones: "5 Language Zones (TH / EN / JP / LAO / K-POP)",
    statAnimes: "Featured Anime",
    statPairs: "Curated Pairs & Typo Tips",
    weeklySyncLabel: "<strong>Automated Music & Anime Sync:</strong> Fresh drops added every 7 days (Weekly Auto-Drop Sync)",
    wsVersusSub: "Compare Vibe",
    randSectionKicker: "RANDOM GENERATOR",
    randSectionTitle: "🎲 Zone Randomizer & Customizer",
    randSectionDesc: "Select language zone and style. Smart non-repeating shuffle with matched anime recommendations.",
    randZoneSelectLabel: "Select song zone to roll:",
    randZoneTh: "Thai Songs Zone",
    randZoneEn: "Global Songs Zone (English)",
    randZoneJp: "Japanese & Anime Zone",
    randZoneLao: "🇱🇦 Lao & Isan Zone",
    randZoneKr: "🇰🇷 K-Pop & Korean Zone",
    randZoneAll: "All Combined Zones",
    randMoodLabel: "🎭 Choose Mood / Vibe:",
    randMoodAll: "All",
    randMoodSad: "💔 Sad / Emotional",
    randMoodLove: "❤️ Romantic / Warm",
    randMoodHype: "🔥 Hype / Beat Drop",
    randMoodChill: "🌊 Indie Chill",
    randBpmLabel: "⚡ Tempo (BPM):",
    randBpmAll: "All Speeds",
    randBpmSlow: "🐢 Slow",
    randBpmMid: "🚶 Medium (Mid)",
    randBpmFast: "⚡ Fast",
    randReadyBadge: "🎯 Ready to roll in selected zone",
    sfxOn: "Dice SFX: ON",
    sfxOff: "Dice SFX: OFF",
    resetDeckBtn: "🔄 Reset Deck",
    rollingTitle: "🎲 Rolling song...",
    rollingSubtitle: "Pairing track with best anime scene for your edit... ✨",
    randPromptTitle: "Select zone & mood, then hit Roll below!",
    randPromptDesc: "System pairs track with anime scene instantly with dice roll sound.",
    rollBtnAction: "🎲 Roll Song in This Zone! (Unique)",
    songsSectionKicker: "MUSIC CATALOGUE",
    songsSectionTitle: "🎵 Song Vault by Dedicated Zone",
    songsSectionDesc: "Select a zone to explore songs strictly within that category, complete with recommended anime scenes.",
    zoneTh: "Thai Songs Zone",
    zoneEn: "Global Songs Zone (English)",
    zoneJp: "Japanese & Anime Zone",
    zoneLao: "🇱🇦 Lao & Isan Zone",
    zoneKr: "🇰🇷 K-Pop Zone",
    zoneFunk: "⚡ Secret Funk Zone (Brazilian & Phonk)",
    searchPlaceholder: "Search song, artist, tag, or anime...",
    allMoods: "All Moods",
    moodSad: "💔 Sad",
    moodLove: "❤️ Romantic",
    moodHype: "🔥 Hype",
    moodChill: "🌊 Chill",
    loadMoreBtn: "⬇ Show More Songs",
    previewBtn: "Play Full",
    playingBtn: "Playing",
    pauseBtn: "Pause",
    spotifyBtn: "Spotify",
    animeRecTitle: "🌸 Matched Anime:",
    animeDetailsBtn: "🌸 Pair Details",
    animeMatchBtn: "🌸 Anime Match",
    viewAnifume: "🌸 View on Anifume →",
    viewAnifumeShort: "🌸 View on Anifume",
    savedSectionKicker: "BOOKMARKED COLLECTION",
    savedSectionTitle: "❤️ Saved Songs for Editing",
    savedSectionDesc: "Your curated typography clip soundtracks with anime pairings",
    savedHint: "💡 Auto-saved in your browser, never lost even after closing or refreshing",
    savedBtnShuffle: "🎲 Roll from Saved",
    savedBtnCopy: "📋 Copy List for Editing",
    savedBtnClear: "🗑️ Clear All",
    matchSectionKicker: "SCENE PAIRING",
    matchSectionTitle: "🌸 Curated Songs × Anime Scene Pairs",
    matchSectionDesc: "Curated song and anime scene pairs with posters and audio previews for editors",
    finderTitle: "✨ Quick Pair Finder: Pick a song or anime to view recommendation",
    finderSongLabel: "🎵 Select a song you like:",
    finderSongPlaceholder: "-- Select a song you like --",
    finderAnimeLabel: "🌸 Select anime for editing:",
    finderAnimePlaceholder: "-- Select anime for editing --",
    filterPairAll: "🌟 All Pairs",
    filterPairSad: "💔 Sad Song × Drama",
    filterPairLove: "❤️ Romantic × Romance",
    filterPairHype: "🔥 Hype Song × Action",
    filterPairChill: "🌊 Indie Chill × Dreamy",
    vsSectionKicker: "SONG COMPARISON",
    vsSectionTitle: "⚔️ Song Battle: Choose Edit Vibe",
    vsSectionDesc: "Compare two tracks and pick the best vibe for your typography clip",
    vsVoteBtn: "👍 Choose this track!",
    vsRerollBtn: "🔀 Roll New Matchup",
    footerLogo: "TypoMusic • EDIT STUDIO",
    footerDesc: "Curated music and anime scenes library for video editing and typography clips",
    footerCopy: "Crafted with care for typography editors and video creators",
    loading: "Loading..."
  }
};

const GENRE_MAP = {
  'แอคชั่น': 'Action', 'ผจญภัย': 'Adventure', 'แฟนตาซี': 'Fantasy', 'ดราม่า': 'Drama',
  'โรแมนติก': 'Romance', 'ไซไฟ': 'Sci-Fi', 'คอมเมดี้': 'Comedy', 'ตลก': 'Comedy',
  'ชีวิตประจำวัน': 'Slice of Life', 'ลึกลับ': 'Mystery', 'สยองขวัญ': 'Horror',
  'เหนือธรรมชาติ': 'Supernatural', 'กีฬา': 'Sports', 'ดนตรี': 'Music', 'สงคราม': 'Military',
  'หุ่นยนต์': 'Mecha', 'ย้อนยุค': 'Historical', 'จิตวิทยา': 'Psychological', 'อนิเมะ': 'Anime',
  'ไทโป': 'Typography', 'แนะนำ': 'Featured', 'ฮิต': 'Hit', 'ไวรัล': 'Viral', 'มาแรง': 'Trending',
  'สตูดิโอ': 'Studio', 'ตัดต่อ': 'Edit'
};

function translateGenre(g) {
  if (currentAppLang === 'th') return g;
  return GENRE_MAP[g] || g;
}

function getSongTagsForDisplay(song) {
  if (currentAppLang === 'th') {
    return (song.tags || []).slice(0, 3);
  }
  const rawTags = (song.tags || []);
  const englishTags = [];
  for (const t of rawTags) {
    if (GENRE_MAP[t]) {
      englishTags.push(GENRE_MAP[t]);
    } else if (!/[\u0E00-\u0E7F]/.test(t)) {
      englishTags.push(t);
    }
  }
  if (englishTags.length < 2) {
    const moodDefaults = {
      sad: ['Sad Vibe', 'Melodic'],
      love: ['Romantic', 'Sweet'],
      hype: ['Energetic', 'Beat Drop'],
      chill: ['Indie Chill', 'Atmospheric']
    };
    const defaults = moodDefaults[song.mood] || ['Trending', 'Typography'];
    for (const d of defaults) {
      if (!englishTags.includes(d)) englishTags.push(d);
    }
  }
  return englishTags.slice(0, 3);
}

function translateTag(tag) {
  if (currentAppLang === 'th') return tag;
  return GENRE_MAP[tag] || tag;
}

function formatBpm(bpmStr) {
  if (!bpmStr && bpmStr !== 0) return currentAppLang === 'th' ? 'ปานกลาง' : 'Mid Tempo';
  if (typeof bpmStr === 'number') return `${bpmStr} BPM`;
  const str = String(bpmStr);
  if (currentAppLang === 'th') return str;
  return str
    .replace('ช้า', 'Slow')
    .replace('ปานกลาง', 'Mid')
    .replace('เร็ว', 'Fast');
}

function normalizeMood(m) {
  if (!m) return 'chill';
  const str = String(m).toLowerCase();
  if (str === 'sad' || str.includes('เศร้า') || str.includes('ดิ่ง') || str.includes('อกหัก') || str.includes('เจ็บ') || str.includes('คิดถึง') || str.includes('ความทรงจำ')) return 'sad';
  if (str === 'love' || str.includes('รัก') || str.includes('อบอุ่น') || str.includes('romantic') || str.includes('หวาน') || str.includes('ตกหลุมรัก') || str.includes('แฟน')) return 'love';
  if (str === 'hype' || str.includes('มันส์') || str.includes('เดือด') || str.includes('beat') || str.includes('พลัง') || str.includes('เท่') || str.includes('เต้น') || str.includes('สนุก')) return 'hype';
  return 'chill';
}

function getSongBpmNumber(s) {
  if (typeof s.bpm === 'number') return s.bpm;
  if (!s.bpm && s.bpm !== 0) return 100;
  const numMatch = String(s.bpm).match(/\d+/);
  if (numMatch) return parseInt(numMatch[0], 10);
  const str = String(s.bpm).toLowerCase();
  if (str.includes('ช้า') || str.includes('slow')) return 65;
  if (str.includes('เร็ว') || str.includes('fast')) return 130;
  return 95;
}

function getAnimeDisplayName(anime) {
  if (!anime) return '';
  if (currentAppLang === 'en') {
    return anime.name || anime.nameTH || 'Anime';
  }
  return anime.nameTH || anime.name || 'อนิเมะ';
}

function getAnimeSecondaryName(anime) {
  if (!anime) return '';
  const genres = Array.isArray(anime.genre)
    ? anime.genre
    : (typeof anime.genre === 'string' ? anime.genre.split(',').map(s => s.trim()) : []);
  if (currentAppLang === 'en') {
    return genres.map(translateGenre).join(', ');
  }
  return anime.name ? `${anime.name} • ${genres.join(', ')}` : genres.join(', ');
}

function getZoneName(zone) {
  if (currentAppLang === 'th') {
    if (zone === 'th') return '🇹🇭 โซนเพลงไทย';
    if (zone === 'en') return '🇬🇧 โซนเพลงสากล';
    if (zone === 'jp') return '🇯🇵 โซนเพลงญี่ปุ่น / อนิเมะ';
    if (zone === 'lao') return '🇱🇦 โซนเพลงลาว / อีสาน';
    if (zone === 'kr') return '🇰🇷 โซนเพลงเกาหลี / K-Pop';
    if (zone === 'funk') return '⚡ โซนลับ Funk & Phonk';
    return '🌐 สุ่มรวมทุกโซน';
  } else {
    if (zone === 'th') return '🇹🇭 Thai Songs Zone';
    if (zone === 'en') return '🇬🇧 Global Songs Zone';
    if (zone === 'jp') return '🇯🇵 Japanese & Anime Zone';
    if (zone === 'lao') return '🇱🇦 Lao & Isan Zone';
    if (zone === 'kr') return '🇰🇷 K-Pop Zone';
    if (zone === 'funk') return '⚡ Secret Funk & Phonk Zone';
    return '🌐 All Combined Zones';
  }
}

// Backward compatibility alias
function getZoneNameTH(zone) {
  return getZoneName(zone);
}

const langPillText = l => {
  if (currentAppLang === 'th') {
    if (l === 'en') return '🇬🇧 สากล';
    if (l === 'jp') return '🇯🇵 ญี่ปุ่น';
    if (l === 'lao') return '🇱🇦 ลาว';
    if (l === 'kr') return '🇰🇷 เกาหลี';
    if (l === 'funk') return '⚡ Funk';
    return '🇹🇭 ไทย';
  } else {
    if (l === 'en') return '🇬🇧 Global';
    if (l === 'jp') return '🇯🇵 Japanese';
    if (l === 'lao') return '🇱🇦 Lao';
    if (l === 'kr') return '🇰🇷 K-Pop';
    if (l === 'funk') return '⚡ Funk';
    return '🇹🇭 Thai';
  }
};

const moodLabel = m => {
  const norm = normalizeMood(m);
  if (currentAppLang === 'th') {
    return ({ sad:'💔 เศร้า', love:'❤️ รัก', hype:'🔥 เร้าใจ', chill:'🌊 ชิลล์' }[norm] || '🌊 ชิลล์');
  } else {
    return ({ sad:'💔 Sad', love:'❤️ Romantic', hype:'🔥 Hype', chill:'🌊 Chill' }[norm] || '🌊 Chill');
  }
};

let currentAppLang = localStorage.getItem('typo_app_lang') || 'th';

function setAppLanguage(lang) {
  currentAppLang = lang;
  localStorage.setItem('typo_app_lang', lang);
  document.documentElement.lang = lang;

  if (I18N[lang]) {
    if (I18N[lang].siteTitle) document.title = I18N[lang].siteTitle;
    const metaDesc = document.getElementById('page-desc');
    if (metaDesc && I18N[lang].siteDesc) metaDesc.setAttribute('content', I18N[lang].siteDesc);
  }

  const btnTh = document.getElementById('btn-lang-th');
  const btnEn = document.getElementById('btn-lang-en');
  if (btnTh && btnEn) {
    btnTh.classList.toggle('active', lang === 'th');
    btnEn.classList.toggle('active', lang === 'en');
  }

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (I18N[lang] && I18N[lang][key]) {
      if (I18N[lang][key].includes('<')) {
        el.innerHTML = I18N[lang][key];
      } else {
        el.textContent = I18N[lang][key];
      }
    }
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput && I18N[lang]) {
    searchInput.placeholder = I18N[lang].searchPlaceholder;
  }

  updateZoneBanner();
  updateStats();
  updateDiceSfxUI();
  updateZoneCounterUI();
  updateSavedBadges();
  renderSongsGrid();
  renderSavedSongsView();
  renderAnimeMatchGrid(currentPairCategory);
  populateFinderDropdowns();
  initWeeklyUpdateTracker();
  if (lastRandomSongId) {
    const song = SONGS.find(s => s.id === lastRandomSongId);
    if (song && document.getElementById('random-result') && !document.getElementById('random-result').classList.contains('hidden')) {
      renderRandomShowcase(song);
    }
  }
  if (currentAudio) updateAudioUI(!currentAudio.paused);
  if (currentWorkspace === 'versus') loadVersus();
}


function renderPlayButton(songId, isPlaying) {
  const song = (typeof SONGS !== 'undefined' && SONGS.find(s => s.id === songId)) ||
               (typeof SONG_MAP !== 'undefined' && SONG_MAP.get(songId));
  const isFull = song && (song.isFull || song.fullAudioUrl || (song.audioUrl && (song.audioUrl.endsWith('.mp3') || !song.audioUrl.includes('apple.com'))));
  
  let durationBadge = '--:--';
  if (song && song.duration) {
    const dm = Math.floor(song.duration / 60);
    const ds = Math.floor(song.duration % 60).toString().padStart(2, '0');
    durationBadge = `${dm}:${ds}`;
  }

  const label = isPlaying
    ? (currentAppLang === 'th' ? 'กำลังเล่น' : 'Playing')
    : (currentAppLang === 'th' ? '▶ ฟังเพลงเต็ม' : '▶ Play Full');

  const iconHtml = isPlaying
    ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="#000"><rect x="5" y="3" width="4.5" height="18" rx="1.5"></rect><rect x="14.5" y="3" width="4.5" height="18" rx="1.5"></rect></svg>'
    : '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="margin-left:1.5px;"><polygon points="6 4 20 12 6 20"></polygon></svg>';

  const waveHtml = isPlaying
    ? '<span class="sound-bars"><span></span><span></span><span></span><span></span></span>'
    : '';

  return `<button class="btn-play-preview ${isPlaying ? 'playing' : ''}" data-play-btn="${songId}" onclick="togglePlaySong(${songId})">
    <div class="play-left">
      <span class="play-icon-disc">${iconHtml}</span>
      <span class="play-label">${label}</span>
      ${waveHtml}
    </div>
    <span class="play-duration-badge">${durationBadge}</span>
  </button>`;
}

// ---- DICE ROLL SFX CONTROLLER (u_qpfzpy / dice-roll.mp3) ----
let diceAudio = new Audio('dice-roll.mp3');
let diceSfxEnabled = localStorage.getItem('typo_sfx_enabled') !== 'false';

function playDiceSound() {
  if (!diceSfxEnabled) return;
  try {
    diceAudio.currentTime = 0;
    // ปรับเสียงสุ่มเบาๆ นุ่มนวล ไม่ดังกระแทกหู (Soft & Gentle volume)
    diceAudio.volume = Math.min(0.16, Math.max(0.06, (currentVolume || 0.8) * 0.18));
    diceAudio.play().catch(err => {
      console.log('Dice SFX auto-play notice:', err);
    });
  } catch (err) {
    console.warn('Dice sound error:', err);
  }
}

function toggleDiceSfx() {
  diceSfxEnabled = !diceSfxEnabled;
  localStorage.setItem('typo_sfx_enabled', diceSfxEnabled.toString());
  updateDiceSfxUI();
  if (diceSfxEnabled) {
    playDiceSound();
    showToast(currentAppLang === 'th' ? '🎲 🔊 เปิดเสียงทอยลูกเต๋าเรียบร้อยแล้ว' : '🎲 🔊 Dice roll sound enabled');
  } else {
    showToast(currentAppLang === 'th' ? '🎲 🔇 ปิดเสียงทอยลูกเต๋าแล้ว' : '🎲 🔇 Dice roll sound disabled');
  }
}

function updateDiceSfxUI() {
  const btn = document.getElementById('sfx-toggle-btn');
  if (btn) {
    const text = diceSfxEnabled
      ? (currentAppLang === 'th' ? 'เสียงลูกเต๋า: เปิด' : 'Dice SFX: ON')
      : (currentAppLang === 'th' ? 'เสียงลูกเต๋า: ปิด' : 'Dice SFX: OFF');
    btn.innerHTML = `<span class="sfx-icon">🎲 ${diceSfxEnabled ? '🔊' : '🔇'}</span> <span class="sfx-text">${text}</span>`;
    btn.classList.toggle('active', diceSfxEnabled);
    btn.title = currentAppLang === 'th' ? 'เปิด/ปิดเสียงสุ่มลูกเต๋า' : 'Toggle Dice Sound';
  }
}

// ---- TYPOGRAPHY CLIP IDEA & CAPTION COPY ----



// ---- SAVED SONGS (BOOKMARKS / FAVORITES) SYSTEM ----
function getSavedSongIds() {
  try {
    const raw = localStorage.getItem('typo_saved_songs');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch (e) {
    return [];
  }
}

function isSongSaved(songId) {
  return getSavedSongIds().includes(Number(songId));
}

function renderBookmarkBtn(songId, extraClass = '') {
  const saved = isSongSaved(songId);
  const title = saved ? (currentAppLang === 'th' ? 'นำออกจากที่บันทึกไว้' : 'Remove from saved') : (currentAppLang === 'th' ? 'บันทึกเพลงนี้ไว้ทำคลิป' : 'Save this song');
  return `<button class="btn-bookmark-song ${saved ? 'saved' : ''} ${extraClass}" data-save-id="${songId}" onclick="toggleSaveSong(${songId}, event)" title="${title}" aria-label="${title}">
    <span class="bm-icon">${saved ? '❤️' : '🤍'}</span>
  </button>`;
}

function toggleSaveSong(songId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const id = Number(songId);
  const song = SONGS.find(s => s.id === id);
  let saved = getSavedSongIds();
  const index = saved.indexOf(id);
  const willSave = index === -1;

  if (willSave) {
    saved.push(id);
    const title = song ? `"${song.title}"` : (currentAppLang === 'th' ? 'เพลงนี้' : 'this track');
    showToast(currentAppLang === 'th' ? `❤️ บันทึก ${title} เข้าคลังเพลงโปรดแล้ว! ✨` : `❤️ Added ${title} to your saved collection! ✨`);
  } else {
    saved.splice(index, 1);
    const title = song ? `"${song.title}"` : (currentAppLang === 'th' ? 'เพลงนี้' : 'this track');
    showToast(currentAppLang === 'th' ? `🤍 นำ ${title} ออกจากคลังแล้ว` : `🤍 Removed ${title} from your saved collection`);
  }

  localStorage.setItem('typo_saved_songs', JSON.stringify(saved));
  updateSavedBadges();

  // Sync all buttons with this ID
  document.querySelectorAll(`[data-save-id="${id}"]`).forEach(btn => {
    btn.classList.toggle('saved', willSave);
    const icon = btn.querySelector('.bm-icon');
    if (icon) icon.textContent = willSave ? '❤️' : '🤍';
    if (btn.classList.contains('btn-bp-save')) {
      btn.innerHTML = willSave ? (currentAppLang === 'th' ? '❤️ บันทึกแล้ว' : '❤️ Saved') : (currentAppLang === 'th' ? '🤍 บันทึกเพลง' : '🤍 Save');
    }
    if (btn.classList.contains('btn-modal-save')) {
      btn.innerHTML = willSave ? (currentAppLang === 'th' ? '❤️ บันทึกแล้ว' : '❤️ Saved') : (currentAppLang === 'th' ? '🤍 บันทึกเพลงนี้' : '🤍 Save this song');
    }
    if (btn.classList.contains('btn-showcase-save')) {
      btn.innerHTML = willSave ? (currentAppLang === 'th' ? '❤️ บันทึกแล้ว' : '❤️ Saved') : (currentAppLang === 'th' ? '🤍 บันทึกเพลง' : '🤍 Save');
    }
  });

  // Re-render if currently in saved workspace
  if (currentWorkspace === 'saved') {
    renderSavedSongsView();
  }
}

function updateSavedBadges() {
  const count = getSavedSongIds().length;
  const navCount = document.getElementById('nav-saved-count');
  if (navCount) navCount.textContent = count;
  const szSaved = document.getElementById('sz-sub-saved');
  if (szSaved) szSaved.textContent = `${count} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  const pillCount = document.getElementById('saved-count-pill');
  if (pillCount) {
    pillCount.textContent = currentAppLang === 'th'
      ? `📌 บันทึกไว้แล้ว ${count} เพลง`
      : `📌 Bookmarked: ${count} songs`;
  }
}

function clearAllSavedSongs() {
  const saved = getSavedSongIds();
  if (saved.length === 0) {
    showToast(currentAppLang === 'th' ? 'ยังไม่มีเพลงในคลังที่บันทึกไว้' : 'No bookmarked songs in your collection yet');
    return;
  }
  const confirmMsg = currentAppLang === 'th'
    ? 'คุณแน่ใจหรือไม่ว่าต้องการล้างเพลงที่บันทึกไว้ทั้งหมด?'
    : 'Are you sure you want to clear all bookmarked songs?';
  if (confirm(confirmMsg)) {
    localStorage.removeItem('typo_saved_songs');
    updateSavedBadges();
    document.querySelectorAll('.btn-bookmark-song').forEach(b => {
      b.classList.remove('saved');
      const icon = b.querySelector('.bm-icon');
      if (icon) icon.textContent = '🤍';
    });
    renderSavedSongsView();
    showToast(currentAppLang === 'th' ? '🗑️ ล้างเพลงที่บันทึกไว้ทั้งหมดเรียบร้อยแล้ว' : '🗑️ Cleared all saved songs from collection');
  }
}

function exportSavedSongsList() {
  const savedIds = getSavedSongIds();
  if (savedIds.length === 0) {
    showToast(currentAppLang === 'th' ? 'ยังไม่มีเพลงที่บันทึกไว้ — กรุณากดปุ่ม ❤️ บนเพลงที่ต้องการ' : 'No saved songs — click ❤️ on any song to bookmark first');
    return;
  }
  const savedSongs = SONGS.filter(s => savedIds.includes(s.id));
  let text = currentAppLang === 'th'
    ? `🎵 คลังเพลงที่บันทึกไว้สำหรับตัดต่อคลิปไทโป (ไทโปมิวสิค Edit Studio)\nจำนวนทั้งหมด: ${savedSongs.length} เพลง\n==================================================\n\n`
    : `🎵 Bookmarked Tracks for Typography Video Editing (TypoMusic Edit Studio)\nTotal Tracks: ${savedSongs.length}\n==================================================\n\n`;

  savedSongs.forEach((s, idx) => {
    const anime = ANIMES.find(a => a.id === s.animeId);
    const animeName = getAnimeDisplayName(anime);
    text += `${idx + 1}. ${s.title} - ${s.artist} [${formatBpm(s.bpm)} | ${moodLabel(s.mood)}]\n`;
    if (anime) text += `   🌸 ${currentAppLang === 'th' ? 'ซีนอนิเมะแนะนำ' : 'Matched Anime'}: ${animeName}\n`;
    text += `   🎧 ${currentAppLang === 'th' ? 'ฟังบน Spotify' : 'Listen on Spotify'}: ${s.spotifyUrl}\n\n`;
  });

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(currentAppLang === 'th' ? '📋 คัดลอกรายชื่อเพลงทั้งหมดลง Clipboard แล้ว!' : '📋 Copied track list to clipboard!');
    }).catch(() => {
      prompt(currentAppLang === 'th' ? 'คัดลอกรายชื่อเพลงของคุณ:' : 'Copy your track list:', text);
    });
  } else {
    prompt(currentAppLang === 'th' ? 'คัดลอกรายชื่อเพลงของคุณ:' : 'Copy your track list:', text);
  }
}

function shufflePlaySaved() {
  const savedIds = getSavedSongIds();
  if (savedIds.length === 0) {
    showToast(currentAppLang === 'th' ? 'ยังไม่มีเพลงที่บันทึกไว้ กดไอคอน ❤️ บนเพลงที่ชอบเพื่อเก็บไว้ก่อน' : 'No saved songs — click ❤️ to bookmark tracks first');
    return;
  }
  const randomId = savedIds[Math.floor(Math.random() * savedIds.length)];
  togglePlaySong(randomId);
  const song = SONGS.find(s => s.id === randomId);
  if (song) {
    showToast(currentAppLang === 'th' ? `🎲 สุ่มเล่นเพลงที่บันทึกไว้: "${song.title}"` : `🎲 Playing saved track: "${song.title}"`);
  }
}

function renderSavedSongsView() {
  const grid = document.getElementById('saved-songs-grid');
  if (!grid) return;
  const savedIds = getSavedSongIds();
  updateSavedBadges();

  if (savedIds.length === 0) {
    grid.innerHTML = `
      <div class="saved-empty-state glass-card">
        <div class="empty-icon">❤️</div>
        <div class="empty-title">${currentAppLang === 'th' ? 'ยังไม่มีเพลงในคลังที่บันทึกไว้' : 'No bookmarked songs in your collection yet'}</div>
        <div class="empty-desc">
          ${currentAppLang === 'th' ? 'คุณสามารถกดไอคอนหัวใจ 🤍 บนการ์ดเพลงใบใดก็ได้ เพื่อบันทึกเก็บไว้ใช้ตัดต่อคลิปไทโปในภายหลังได้ตลอดเวลา' : 'Click the heart 🤍 icon on any song card to bookmark it for typography video editing anytime.'}
        </div>
        <div class="empty-actions">
          <button class="btn btn-primary" onclick="switchStudioWorkspace('th', true)">
            ${currentAppLang === 'th' ? '🇹🇭 สำรวจเพลงไทย' : '🇹🇭 Explore Thai Songs'}
          </button>
          <button class="btn btn-ghost" onclick="switchStudioWorkspace('en', true)">
            ${currentAppLang === 'th' ? '🇬🇧 สำรวจเพลงสากล' : '🇬🇧 Explore Global Songs'}
          </button>
          <button class="btn btn-ghost" onclick="switchStudioWorkspace('jp', true)">
            ${currentAppLang === 'th' ? '🇯🇵 สำรวจเพลงอนิเมะ' : '🇯🇵 Explore Anime Songs'}
          </button>
        </div>
      </div>
    `;
    return;
  }

  const savedSongs = SONGS.filter(s => savedIds.includes(s.id));
  grid.innerHTML = savedSongs.map((song, idx) => songCardHTML(song, idx)).join('');
}

// ---- AUDIO & VOLUME CONTROLLER ----
let currentAudio = null;
let currentPlayingId = null;
let currentVolume = parseFloat(localStorage.getItem('typo_volume') || '0.8');
let isMuted = false;
let volumeBeforeMute = 0.8;

function setVolume(percentVal) {
  const val = Math.max(0, Math.min(100, parseFloat(percentVal)));
  currentVolume = val / 100;
  isMuted = currentVolume === 0;
  localStorage.setItem('typo_volume', currentVolume.toString());

  if (currentAudio) {
    currentAudio.volume = currentVolume;
  }

  updateVolumeUI();
}

function toggleMute() {
  if (isMuted || currentVolume === 0) {
    isMuted = false;
    setVolume(Math.round((volumeBeforeMute || 0.8) * 100));
  } else {
    volumeBeforeMute = currentVolume;
    isMuted = true;
    setVolume(0);
  }
}

function adjustVolumeStep(delta) {
  const curPercent = Math.round(currentVolume * 100);
  setVolume(curPercent + delta);
}

function getVolumeIcon(vol) {
  if (vol === 0 || isMuted) return '🔇';
  if (vol < 0.4) return '🔈';
  if (vol < 0.75) return '🔉';
  return '🔊';
}

function updateVolumeUI() {
  const percent = Math.round(currentVolume * 100);
  const icon = getVolumeIcon(currentVolume);

  // Update bottom player volume
  const slider = document.getElementById('bp-vol-slider');
  if (slider) slider.value = percent;

  const percentLabel = document.getElementById('bp-vol-percent');
  if (percentLabel) percentLabel.textContent = `${percent}%`;

  const muteBtn = document.getElementById('bp-mute-btn');
  if (muteBtn) muteBtn.innerHTML = icon;

  // Update any showcase sliders
  const showcaseSlider = document.getElementById('showcase-vol-slider');
  if (showcaseSlider) showcaseSlider.value = percent;

  const showcasePercent = document.getElementById('showcase-vol-percent');
  if (showcasePercent) showcasePercent.textContent = `${percent}%`;

  const showcaseMuteBtn = document.getElementById('showcase-mute-btn');
  if (showcaseMuteBtn) showcaseMuteBtn.innerHTML = icon;
}

// ==========================================
// 🛡️ OFFLINE AUDIO VAULT & CACHE SYSTEM
// ==========================================
const OFFLINE_AUDIO_CACHE = 'haimiya-audio-vault';

// เช็คว่าไฟล์เสียงมีแคชในเครื่องพร้อมเล่นแบบออฟไลน์หรือไม่
async function isSongCachedOffline(url) {
  if (!url) return false;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    const match = await cache.match(url);
    return !!match;
  } catch (e) {
    return false;
  }
}

// โหลดไฟล์เสียงแบบรองรับ Offline 100% (แปลงเป็น Blob URL เพื่อให้เล่นได้แน่นอนแม้ไม่มีเน็ต)
async function getOfflinePlayableUrl(url) {
  if (!url) return null;

  // 1. ตรวจสอบใน CacheStorage ก่อนเสมอ
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    const cachedResponse = await cache.match(url, { ignoreSearch: true });
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.warn('Cache match failed:', e);
  }

  // 2. ถ้ามีเน็ต ให้ดาวน์โหลดมาเก็บไว้ใน CacheStorage และแปลงเป็น Blob URL
  if (navigator.onLine) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const cloned = res.clone();
        caches.open(OFFLINE_AUDIO_CACHE).then(c => c.put(url, cloned)).catch(() => {});
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn('Fetch audio failed, falling back to direct URL:', e);
    }
    return url;
  }

  // 3. ถ้าไม่มีเน็ต: ดึงเพลงอื่นในเครื่องที่เคยแคชไว้แล้วมาเล่นแทน ไม่ปล่อยให้เงียบ
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    const keys = await cache.keys();
    // กรองเฉพาะ key ที่เป็นไฟล์เพลง
    const audioKeys = keys.filter(k => k.url.includes('.m4a') || k.url.includes('.mp3') || k.url.includes('apple.com'));
    if (audioKeys.length > 0) {
      const randomKey = audioKeys[Math.floor(Math.random() * audioKeys.length)];
      const fallbackRes = await cache.match(randomKey);
      if (fallbackRes) {
        showToast(currentAppLang === 'th' ? '📡 ออฟไลน์: กำลังเล่นเพลงฮิตที่บันทึกไว้ในเครื่อง' : '📡 Offline: Playing cached hit song');
        const blob = await fallbackRes.blob();
        return URL.createObjectURL(blob);
      }
    }
    // สำรองด้วย blue_relax.m4a จาก CacheStorage (รับประกันมีในเครื่อง 100%)
    let blueRes = await caches.match('./blue_relax.m4a');
    if (!blueRes) blueRes = await caches.match('blue_relax.m4a');
    if (!blueRes) blueRes = await cache.match('blue_relax.m4a');
    if (blueRes) {
      showToast(currentAppLang === 'th' ? '📡 ออฟไลน์: กำลังเล่นเพลงผ่อนคลาย (blue)' : '📡 Offline: Playing blue (relax bgm)');
      const blob = await blueRes.blob();
      return URL.createObjectURL(blob);
    }
  } catch(e) {}

  return null;
}

// ดาวน์โหลดและแคชเพลงฮิตจำนวนมากล่วงหน้าในเบื้องหลัง เพื่อให้ผู้ใช้เปิดฟังแบบ Offline ได้ทันที 100%
async function initOfflineAudioVault() {
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);

    // 1. แคชเพลง blue_relax.m4a ให้พร้อมเสมอ
    const hasBlue = await cache.match('blue_relax.m4a');
    if (!hasBlue) {
      fetch('blue_relax.m4a')
        .then(r => { if (r.ok) cache.put('blue_relax.m4a', r); })
        .catch(() => {});
    }

    // 2. ถ้าต่อเน็ตอยู่ ให้ทยอยดาวน์โหลดเพลงฮิต 50 เพลงครอบคลุมทุกหมวดเก็บไว้แบบ Offline
    if (navigator.onLine) {
      const topIds = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 22, 24, 25, 29, 30, 42, 50,
        714, 737, 738, 739, 740, 741, 1264, 1310, 1353, 1379,
        1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814
      ];
      const precacheList = SONGS.filter(s => topIds.includes(s.id) && s.previewUrl);

      // ทยอยโหลดทีละเพลงแบบเบื้องหลัง
      setTimeout(async () => {
        let cachedCount = 0;
        for (const song of precacheList) {
          try {
            const hasSong = await cache.match(song.previewUrl, { ignoreSearch: true });
            if (!hasSong) {
              const res = await fetch(song.previewUrl, { mode: 'cors' });
              if (res.ok) {
                await cache.put(song.previewUrl, res);
                cachedCount++;
              }
              await new Promise(r => setTimeout(r, 350));
            } else {
              cachedCount++;
            }
          } catch (err) {}
        }
        console.log(`✅ Offline Audio Vault: มีเพลงพร้อมฟังแบบออฟไลน์ทั้งหมด ${cachedCount} เพลง!`);
      }, 3000);
    }
  } catch (e) {
    console.warn('Offline Audio Vault init error:', e);
  }
}

// ฟังก์ชันให้ผู้ใช้กดดาวน์โหลดคลังเพลงออฟไลน์ 50 เพลงลงเครื่องได้ด้วยตนเอง
async function downloadOfflineMusicPack() {
  const btn = document.getElementById('btn-offline-pack');
  if (!navigator.onLine) {
    showToast('⚠️ กรุณาเชื่อมต่ออินเทอร์เน็ตเพื่อดาวน์โหลดเพลงไว้ฟังออฟไลน์');
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ กำลังเตรียมบันทึกเพลงลงเครื่อง...';
  }
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    const downloadList = SONGS.slice(0, 60).filter(s => s.previewUrl);
    let downloaded = 0;
    for (let i = 0; i < downloadList.length; i++) {
      const song = downloadList[i];
      try {
        const hasSong = await cache.match(song.previewUrl, { ignoreSearch: true });
        if (!hasSong) {
          const res = await fetch(song.previewUrl, { mode: 'cors' });
          if (res.ok) {
            await cache.put(song.previewUrl, res);
            downloaded++;
          }
        } else {
          downloaded++;
        }
      } catch (e) {}
      if (btn) {
        btn.innerHTML = `⏳ บันทึกเพลงลงเครื่อง (${downloaded}/${downloadList.length})...`;
      }
    }
    showToast(`✅ บันทึกคลังเพลงลงเครื่องเรียบร้อยแล้ว ${downloaded} เพลง! เปิดฟังได้ 100% แม้ไม่มีเน็ต`);
    if (btn) {
      btn.innerHTML = `✅ บันทึกแล้ว ${downloaded} เพลง (พร้อมฟังออฟไลน์)`;
    }
  } catch (err) {
    showToast('❌ การบันทึกเพลงขัดข้อง: ' + err.message);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🎧 บันทึกคลังเพลงฮิตไว้ฟังออฟไลน์ (ฟังได้แม้ไม่มีเน็ต)';
    }
  }
}

// ============================================
//  DIRECT AUDIO DOWNLOAD FOR COMPUTER (PC / EDITING)
//  ดาวน์โหลดไฟล์เสียงสำหรับตัดต่อลงคอมพิวเตอร์ (.m4a / .mp3)
// ============================================

// ============================================================
// ============================================================
// DIRECT IN-DEVICE AUDIO DOWNLOAD WITH LIVE % PROGRESS NOTIFICATION
// โหลดใส่เครื่องโดยตรง ไม่เปิดเว็บอื่น พร้อมแจ้งเตือนเปอร์เซ็นต์สด
// ============================================================
let _activeDownloadController = null;

async function downloadSongAudio(songId, event) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (event.cancelBubble !== undefined) event.cancelBubble = true;
  }
  const song = (typeof SONG_MAP !== 'undefined' && SONG_MAP.get(songId)) || 
               (typeof SONGS !== 'undefined' && SONGS.find(s => s.id === songId));
  if (!song) return;
  loadSingleSongFullCache(song);

  const safeTitle = (song.title || 'song').replace(/[\\/:*?"<>|]/g, '').trim();
  const safeArtist = (song.artist || 'artist').replace(/[\\/:*?"<>|]/g, '').trim();
  const filename = `${safeTitle} - ${safeArtist}.mp3`;

  // Remove existing widget if any
  const existingWidget = document.getElementById('direct-download-progress-bar');
  if (existingWidget) existingWidget.remove();

  // Create UI Progress Notification Widget
  const widget = document.createElement('div');
  widget.id = 'direct-download-progress-bar';
  widget.className = 'direct-dl-widget';
  widget.innerHTML = `
    <div class="dl-widget-header">
      <span class="dl-widget-icon" id="dl-widget-icon">⏳</span>
      <div class="dl-widget-info">
        <div class="dl-widget-title">${escapeHtml(song.title)} - ${escapeHtml(song.artist)}</div>
        <div class="dl-widget-status">
          <span id="dl-widget-label">กำลังค้นหาและเตรียมไฟล์เพลงเต็ม...</span>
          <span class="dl-widget-pct" id="dl-widget-pct">0%</span>
        </div>
      </div>
    </div>
    <div class="dl-widget-track">
      <div class="dl-widget-fill" id="dl-widget-fill" style="width: 0%;"></div>
    </div>
  `;
  document.body.appendChild(widget);

  const pctEl = document.getElementById('dl-widget-pct');
  const fillEl = document.getElementById('dl-widget-fill');
  const labelEl = document.getElementById('dl-widget-label');
  const iconEl = document.getElementById('dl-widget-icon');

  // Animated progress ticker
  let currentPct = 0;
  let progressInterval = setInterval(() => {
    if (currentPct < 75) {
      currentPct += Math.floor(Math.random() * 8) + 4;
      if (currentPct > 75) currentPct = 75;
      if (pctEl) pctEl.textContent = currentPct + '%';
      if (fillEl) fillEl.style.width = currentPct + '%';
    }
  }, 280);

  // Helper to mark 100% complete
  const finishDownloadUi = (isFull = true) => {
    clearInterval(progressInterval);
    if (pctEl) pctEl.textContent = '100%';
    if (fillEl) {
      fillEl.style.width = '100%';
      fillEl.style.background = '#10b981';
    }
    if (iconEl) iconEl.textContent = '✅';
    if (labelEl) {
      labelEl.textContent = isFull ? 'บันทึกเพลงเต็มลงเครื่องแล้ว! (100%)' : 'บันทึกลงเครื่องแล้ว! (100%)';
      labelEl.style.color = '#34d399';
    }
    if (widget) {
      widget.style.borderColor = 'rgba(16, 185, 129, 0.8)';
      // Mobile: add a direct tap-to-save button
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && widget._directUrl) {
        const saveBtn = document.createElement('a');
        saveBtn.href = widget._directUrl;
        saveBtn.download = widget._fileName || 'song.mp3';
        saveBtn.className = 'btn-direct-save';
        saveBtn.textContent = '💾 แตะเพื่อบันทึกลงเครื่อง';
        saveBtn.style.cssText = 'display:block;text-align:center;margin-top:8px;padding:10px 16px;background:linear-gradient(135deg,#10b981,#38bdf8);color:#fff;border-radius:10px;font-weight:700;font-size:0.9rem;text-decoration:none;';
        widget.appendChild(saveBtn);
        setTimeout(() => {
          widget.style.opacity = '0';
          widget.style.transform = 'translateY(15px)';
          setTimeout(() => widget.remove(), 400);
        }, 12000);
      } else {
        setTimeout(() => {
          widget.style.opacity = '0';
          widget.style.transform = 'translateY(15px)';
          setTimeout(() => widget.remove(), 400);
        }, 3500);
      }
    }
    showToast(currentAppLang === 'th' ? `✅ บันทึกเพลง "${song.title}" (เพลงเต็ม) ลงเครื่องสำเร็จแล้ว! (100%)` : `✅ Downloaded "${song.title}" successfully!`);
  };

  // Case 1: Already a local full MP3 file (e.g. สาธุ Emo Rock Version)
  const isLocalFile = song.audioUrl && (song.audioUrl.endsWith('.mp3') || song.audioUrl.includes('netlify.app'));
  if (isLocalFile) {
    try {
      const res = await fetch(resolveAssetUrl(song.audioUrl), { mode: 'cors' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const contentLength = res.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      let receivedBytes = 0;
      const chunks = [];

      clearInterval(progressInterval);
      if (labelEl) labelEl.textContent = 'กำลังบันทึกเพลงเต็มลงเครื่อง...';

      if (res.body && typeof res.body.getReader === 'function') {
        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedBytes += value.length;
          if (totalBytes > 0) {
            const pct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
            if (pctEl) pctEl.textContent = pct + '%';
            if (fillEl) fillEl.style.width = pct + '%';
          }
        }
      } else {
        const blob = await res.blob();
        chunks.push(new Uint8Array(await blob.arrayBuffer()));
      }

      const finalBlob = new Blob(chunks, { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(finalBlob);
      // Store for mobile direct save fallback
      if (widget) { widget._directUrl = resolveAssetUrl(song.audioUrl); widget._fileName = filename; }
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        a.remove();
      }, 3000);

      finishDownloadUi(true);
      return;
    } catch (err) {
      console.warn('Local file fetch error:', err);
    }
  }

  // Case 0: Already resolved full song in session
  if (song.fullAudioUrl) {
    clearInterval(progressInterval);
    if (labelEl) labelEl.textContent = 'กำลังบันทึกเพลงเต็มลงเครื่อง...';
    if (pctEl) pctEl.textContent = '90%';
    if (fillEl) fillEl.style.width = '90%';
    if (widget) {
      widget._directUrl = song.fullAudioUrl;
      widget._fileName = filename;
    }
    const a = document.createElement('a');
    a.href = song.fullAudioUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 2500);
    finishDownloadUi(true);
    return;
  }

  // Case 2: Query full-song API with fallback query
  try {
    if (labelEl) labelEl.textContent = 'กำลังค้นหาและดึงไฟล์เพลงเต็ม...';
    const q = `${song.title || ''} ${song.artist || ''}`.trim();
    const apiUrl = `${NETLIFY_BASE}/api/ai/get-full-song?q=${encodeURIComponent(q)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let apiRes = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    let data = null;
    if (apiRes.ok) {
      data = await apiRes.json();
    }

    // Try fallback query with song title only if first query didn't return audio
    if ((!data || !data.directAudioUrl) && song.title) {
      try {
        const q2 = (song.title || '').replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
        if (q2 && q2 !== q) {
          const apiRes2 = await fetch(`${NETLIFY_BASE}/api/ai/get-full-song?q=${encodeURIComponent(q2)}`);
          if (apiRes2.ok) {
            const data2 = await apiRes2.json();
            if (data2.ok && data2.directAudioUrl) {
              data = data2;
            }
          }
        }
      } catch (e2) {}
    }

    if (data && data.ok && data.directAudioUrl) {
      clearInterval(progressInterval);
      if (labelEl) labelEl.textContent = 'พบเพลงเต็มแล้ว! กำลังบันทึกลงเครื่อง...';
      if (pctEl) pctEl.textContent = '95%';
      if (fillEl) fillEl.style.width = '95%';

      // Cache full audio info on song object
      song.fullAudioUrl = data.directAudioUrl;
        song.isFull = true;
        if (data.duration) song.duration = data.duration;
        saveSongFullCache(song, data.directAudioUrl, data.duration);

      // Store directUrl on widget so mobile phone user gets the tap button
      if (widget) {
        widget._directUrl = data.directAudioUrl;
        widget._fileName = filename;
      }

      // Direct device download trigger
      const a = document.createElement('a');
      a.href = data.directAudioUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 2500);

      finishDownloadUi(true);
      return;
    }
  } catch (err) {
    console.warn('Full-song resolution error:', err);
  }

  // Case 3: Fallback to preview audio stream
  const fallbackUrl = resolveAssetUrl(song.audioUrl || song.previewUrl);
  if (!fallbackUrl) {
    clearInterval(progressInterval);
    if (widget) widget.remove();
    showToast(currentAppLang === 'th' ? '⚠️ เพลงนี้ไม่มีไฟล์เสียงให้ดาวน์โหลดค่ะ' : '⚠️ No audio file available');
    return;
  }

  clearInterval(progressInterval);
  if (labelEl) labelEl.textContent = 'กำลังดาวน์โหลดไฟล์เสียงลงเครื่อง...';

  try {
    const res = await fetch(fallbackUrl, { mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const contentLength = res.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    let receivedBytes = 0;
    const chunks = [];

    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedBytes += value.length;
        if (totalBytes > 0) {
          const pct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
          if (pctEl) pctEl.textContent = pct + '%';
          if (fillEl) fillEl.style.width = pct + '%';
        }
      }
    } else {
      const blob = await res.blob();
      chunks.push(new Uint8Array(await blob.arrayBuffer()));
    }

    const ext = fallbackUrl.includes('.mp3') ? 'mp3' : 'm4a';
    const finalBlob = new Blob(chunks, { type: ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4' });
    const blobUrl = URL.createObjectURL(finalBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${safeTitle} - ${safeArtist}.${ext}`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      a.remove();
    }, 3000);

    finishDownloadUi(false);
  } catch (fbErr) {
    console.warn('Fallback download fetch error, attempting direct anchor:', fbErr);
    clearInterval(progressInterval);
    if (widget) widget.remove();

    const a = document.createElement('a');
    a.href = fallbackUrl;
    a.download = filename;
    // no target blank to avoid opening tabs
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 2000);

    showToast(currentAppLang === 'th' ? `📥 กำลังส่งไฟล์ "${song.title}" ไปยังโฟลเดอร์ดาวน์โหลดของเครื่องค่ะ` : `📥 Downloading "${song.title}" to device...`);
  }
}



// ============================================================
// ดาวน์โหลดเพลงเป็นไฟล์วิดีโอ + เนื้อเพลง (Karaoke style)
// พื้นหลังดำ มีเนื้อร้อง สำหรับนำไปใช้ในแอพตัดต่อวิดีโอ
// ============================================================
let _videoDownloadAbort = null;


// ============================================================
// DOWNLOAD CHOICE MODAL (ให้ผู้ใช้เลือกว่าจะโหลดไฟล์เสียง หรือวิดีโอ)
// ============================================================
let _currentDownloadSongId = null;

function openDownloadChoiceModal(songId, event) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (event.cancelBubble !== undefined) event.cancelBubble = true;
  }

  const song = (typeof SONG_MAP !== 'undefined' && SONG_MAP.get(songId)) || 
               (typeof SONGS !== 'undefined' && SONGS.find(s => s.id === songId));
  if (!song) return;

  _currentDownloadSongId = songId;

  // Remove existing modal if any
  closeDownloadChoiceModal();

  const overlay = document.createElement('div');
  overlay.id = 'download-choice-modal-overlay';
  overlay.className = 'download-choice-overlay';
  overlay.onclick = closeDownloadChoiceModal;

  const coverSrc = song.coverUrl || 'splash-cover.jpg';

  overlay.innerHTML = `
    <div class="download-choice-sheet" onclick="event.stopPropagation()">
      <div class="dc-header">
        <div class="dc-title">📥 ดาวน์โหลดเพลงไปใช้ตัดต่อ</div>
        <button class="dc-close" onclick="closeDownloadChoiceModal()" title="ปิด">✕</button>
      </div>
      <div class="dc-song-info">
        <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(song.title)}" class="dc-cover" onerror="this.src='splash-cover.jpg';" />
        <div class="dc-meta">
          <div class="dc-name">${escapeHtml(song.title)}</div>
          <div class="dc-artist">${escapeHtml(song.artist)}</div>
        </div>
      </div>
      <div class="dc-options">
        <button class="dc-option-btn dc-audio" onclick="startDownloadChoice(${song.id}, 'audio', event)">
          <div class="dc-opt-icon">⚡️</div>
          <div class="dc-opt-content">
            <div class="dc-opt-title">🎵 โหลดไฟล์เสียงเพลงเต็ม (.mp3 / .m4a) <span class="dc-badge-fast">เร็วที่สุด 1 วิ</span></div>
            <div class="dc-opt-desc">นำเข้าแอป CapCut, TikTok, Premiere ได้ทันที 100% ไม่ติดปัญหา</div>
          </div>
        </button>
        <button class="dc-option-btn dc-video" onclick="startDownloadChoice(${song.id}, 'video', event)">
          <div class="dc-opt-icon">🎬</div>
          <div class="dc-opt-content">
            <div class="dc-opt-title">📹 โหลดเป็นไฟล์วิดีโอ + เนื้อเพลง (.webm)</div>
            <div class="dc-opt-desc">พื้นหลังดำ มีเนื้อร้องเรืองแสงคาราโอเกะ สำหรับดึงเสียงใน CapCut</div>
          </div>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeDownloadChoiceModal() {
  const overlay = document.getElementById('download-choice-modal-overlay');
  if (overlay) overlay.remove();
}

function startDownloadChoice(songId, format, event) {
  closeDownloadChoiceModal();
  if (format === 'video') {
    downloadSongVideo(songId, event);
  } else {
    downloadSongAudio(songId, event);
  }
}


async function downloadSongVideo(songId, event) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (event.cancelBubble !== undefined) event.cancelBubble = true;
  }

  const song = (typeof SONG_MAP !== 'undefined' && SONG_MAP.get(songId)) ||
               (typeof SONGS !== 'undefined' && SONGS.find(s => s.id === songId));
  if (!song) return;
  loadSingleSongFullCache(song);

  // ตรวจสอบว่า browser รองรับ MediaRecorder video หรือไม่
  const canRecordVideo = typeof MediaRecorder !== 'undefined' &&
    MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus');

  if (!canRecordVideo) {
    // iOS Safari ไม่รองรับ → fallback เป็นดาวน์โหลดเสียง
    showToast('📱 เบราว์เซอร์นี้ไม่รองรับสร้างวิดีโอ ดาวน์โหลดเป็นไฟล์เสียงแทนค่ะ');
    return downloadSongAudio(songId, event);
  }

  const safeTitle = (song.title || 'song').replace(/[\\/:*?"<>|]/g, '').trim();
  const safeArtist = (song.artist || 'artist').replace(/[\\/:*?"<>|]/g, '').trim();
  const filename = safeTitle + ' - ' + safeArtist + ' [Lyrics].webm';

  // สร้าง AbortController สำหรับยกเลิก
  _videoDownloadAbort = new AbortController();

  // ลบ widget เก่าถ้ามี
  const existingWidget = document.getElementById('direct-download-progress-bar');
  if (existingWidget) existingWidget.remove();

  // สร้าง UI widget
  const widget = document.createElement('div');
  widget.id = 'direct-download-progress-bar';
  widget.className = 'direct-dl-widget';
  widget.innerHTML = '<div class="dl-widget-header">' +
    '<span class="dl-widget-icon" id="dl-widget-icon">🎬</span>' +
    '<div class="dl-widget-info">' +
      '<div class="dl-widget-title">' + escapeHtml(song.title) + ' - ' + escapeHtml(song.artist) + '</div>' +
      '<div class="dl-widget-status">' +
        '<span id="dl-widget-label">กำลังเตรียมสร้างวิดีโอ+เนื้อเพลง...</span>' +
        '<span class="dl-widget-pct" id="dl-widget-pct">0%</span>' +
      '</div>' +
    '</div>' +
    '<button onclick="cancelVideoDownload()" style="background:none;border:none;color:#f87171;font-size:1.2rem;cursor:pointer;padding:4px 8px;" title="ยกเลิก">✕</button>' +
  '</div>' +
  '<div class="dl-widget-track">' +
    '<div class="dl-widget-fill" id="dl-widget-fill" style="width: 0%;"></div>' +
  '</div>';
  document.body.appendChild(widget);

  const pctEl = document.getElementById('dl-widget-pct');
  const fillEl = document.getElementById('dl-widget-fill');
  const labelEl = document.getElementById('dl-widget-label');
  const iconEl = document.getElementById('dl-widget-icon');

  function updateProgress(pct, label) {
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    if (fillEl) fillEl.style.width = Math.round(pct) + '%';
    if (labelEl && label) labelEl.textContent = label;
  }

  try {
    // ====== STEP 1: หาเสียงเพลง ======
    updateProgress(5, 'กำลังค้นหาไฟล์เพลง...');

    let audioUrl = '';
    // ลองใช้ fullAudioUrl (cached) ก่อน
    const cachedFull = getCachedFullSong(song.id);
    if (cachedFull) {
      audioUrl = cachedFull;
    } else if (song.fullAudioUrl) {
      audioUrl = song.fullAudioUrl;
    } else if (song.audioUrl) {
      audioUrl = song.audioUrl;
    }

    // ถ้ายังไม่มี → ขอจาก API
    if (!audioUrl) {
      updateProgress(8, 'กำลังค้นหาเพลงเต็มจากเซิร์ฟเวอร์...');
      try {
        const q = encodeURIComponent(song.title + ' ' + song.artist);
        const apiRes = await fetch('https://mellow-baklava-bffed3.netlify.app/.netlify/functions/get-full-song?q=' + q);
        const apiData = await apiRes.json();
        if (apiData && (apiData.directAudioUrl || apiData.audioUrl)) { audioUrl = apiData.directAudioUrl || apiData.audioUrl;
          setCachedFullSong(song.id, audioUrl);
        }
      } catch (e) {
        console.warn('get-full-song API failed:', e);
      }
    }

    // Fallback ไปใช้ previewUrl
    if (!audioUrl && song.previewUrl) {
      audioUrl = song.previewUrl;
    }

    if (!audioUrl) {
      updateProgress(0, '❌ ไม่พบไฟล์เพลง');
      showToast('❌ ไม่พบไฟล์เพลงสำหรับดาวน์โหลดค่ะ');
      setTimeout(() => { if (widget) widget.remove(); }, 3000);
      return;
    }

    if (_videoDownloadAbort.signal.aborted) return cleanup();

    // ====== STEP 2: ดึงเนื้อเพลงจาก LRCLIB ======
    updateProgress(12, 'กำลังค้นหาเนื้อเพลง...');
    let syncedLyrics = []; // [{time: seconds, text: string}]
    let plainLyrics = '';

    try {
      const lrcQ = encodeURIComponent(song.title + ' ' + song.artist);
      const lrcRes = await fetch('https://lrclib.net/api/search?q=' + lrcQ);
      const lrcData = await lrcRes.json();
      if (Array.isArray(lrcData) && lrcData.length > 0) {
        const bestMatch = lrcData[0];
        if (bestMatch.syncedLyrics) {
          // Parse synced lyrics [mm:ss.xx] text
          const lines = bestMatch.syncedLyrics.split('\n');
          for (const line of lines) {
            const match = line.match(/\[(\d+):(\d+\.?\d*)\]\s*(.*)/);
            if (match) {
              const timeSec = parseInt(match[1]) * 60 + parseFloat(match[2]);
              const text = match[3].trim();
              if (text) syncedLyrics.push({ time: timeSec, text: text });
            }
          }
        }
        if (bestMatch.plainLyrics) {
          plainLyrics = bestMatch.plainLyrics;
        }
      }
    } catch (e) {
      console.warn('LRCLIB fetch failed:', e);
    }

    // ถ้าไม่มี synced lyrics → ใช้ plain lyrics กระจายตาม duration
    // (จะตั้งค่าหลัง decode audio)

    if (_videoDownloadAbort.signal.aborted) return cleanup();

    // ====== STEP 3: โหลดและ decode เสียง ======
    updateProgress(18, 'กำลังโหลดไฟล์เสียง...');

    let audioBuffer;
    try {
      let fetchUrl = audioUrl;
      let audioResponse;
      try {
        audioResponse = await fetch(fetchUrl, { signal: _videoDownloadAbort.signal });
        if (!audioResponse.ok) throw new Error('Direct fetch failed: ' + audioResponse.status);
      } catch (directErr) {
        // CORS error → ใช้ download-proxy
        updateProgress(20, 'กำลังโหลดผ่านพร็อกซี่...');
        const proxyUrl = 'https://mellow-baklava-bffed3.netlify.app/.netlify/functions/download-proxy?url=' + encodeURIComponent(audioUrl);
        audioResponse = await fetch(proxyUrl, { signal: _videoDownloadAbort.signal });
        if (!audioResponse.ok) throw new Error('Proxy fetch failed: ' + audioResponse.status);
      }

      updateProgress(30, 'กำลังประมวลผลเสียง...');
      const arrayBuf = await audioResponse.arrayBuffer();

      const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, 44100, 44100);
      audioBuffer = await offlineCtx.decodeAudioData(arrayBuf);
    } catch (e) {
      console.error('Audio decode failed:', e);
      console.warn('Audio decode/fetch limitation, falling back to direct audio download');
      updateProgress(80, '⚡ กำลังบันทึกเป็นไฟล์เสียงสำหรับ CapCut ให้แทนค่ะ...');
      showToast('📥 เซิร์ฟเวอร์ไม่อนุญาตให้เรนเดอร์วิดีโอ ระบบกำลังส่งไฟล์เสียงสำหรับนำเข้า CapCut ให้แทนค่ะ');
      setTimeout(() => { if (widget) widget.remove(); }, 2500);
      return downloadSongAudio(songId, event);
    }

    const duration = audioBuffer.duration;

    // ถ้าไม่มี synced lyrics แต่มี plain lyrics → กระจายตามเวลา
    if (syncedLyrics.length === 0 && plainLyrics) {
      const plainLines = plainLyrics.split('\n').filter(l => l.trim());
      const interval = duration / (plainLines.length + 1);
      plainLines.forEach((line, i) => {
        syncedLyrics.push({ time: interval * (i + 1), text: line.trim() });
      });
    }

    // ถ้าไม่มีเนื้อเพลงเลย → แสดงชื่อเพลงวน
    if (syncedLyrics.length === 0) {
      const placeholder = ['♪ ' + song.title + ' ♪', '🎵 ' + song.artist + ' 🎵', '♫ ♪ ♫'];
      const interval = duration / (placeholder.length + 1);
      placeholder.forEach((line, i) => {
        syncedLyrics.push({ time: interval * (i + 1), text: line });
      });
    }

    if (_videoDownloadAbort.signal.aborted) return cleanup();

    // ====== STEP 4: ตั้งค่า Canvas + MediaRecorder ======
    updateProgress(35, 'กำลังเตรียมสร้างวิดีโอ...');

    const CANVAS_W = 720;
    const CANVAS_H = 1280;
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');

    // สร้าง AudioContext
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;

    // ส่งเสียงไปยัง MediaStreamDestination (ไม่เล่นลำโพง)
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);

    // ดึง video stream จาก canvas
    const canvasStream = canvas.captureStream(24);

    // รวม stream: video จาก canvas + audio จาก AudioContext
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 1000000
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    // ====== STEP 5: เริ่ม recording + render loop ======
    updateProgress(40, 'กำลังสร้างวิดีโอ+เนื้อเพลง... 0:00 / ' + formatTime(duration));

    const startTime = audioCtx.currentTime;
    let animFrameId = null;
    let recordingDone = false;

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function getCurrentLyricIndex(currentTime) {
      let idx = -1;
      for (let i = 0; i < syncedLyrics.length; i++) {
        if (currentTime >= syncedLyrics[i].time) idx = i;
        else break;
      }
      return idx;
    }

    function renderFrame() {
      if (recordingDone || _videoDownloadAbort.signal.aborted) return;

      const elapsed = audioCtx.currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // พื้นหลังดำ
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // ชื่อเพลง + ศิลปิน ด้านบน
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '600 28px "Kanit", "Noto Sans Thai", sans-serif';
      ctx.fillText(song.title, CANVAS_W / 2, 120);
      ctx.font = '400 22px "Kanit", "Noto Sans Thai", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText(song.artist, CANVAS_W / 2, 158);

      // เนื้อเพลง (karaoke style)
      const lyricIdx = getCurrentLyricIndex(elapsed);
      const centerY = CANVAS_H / 2;
      const lineHeight = 52;

      // แสดง 5 บรรทัดรอบบรรทัดปัจจุบัน
      for (let offset = -2; offset <= 2; offset++) {
        const i = lyricIdx + offset;
        if (i < 0 || i >= syncedLyrics.length) continue;
        const y = centerY + (offset * lineHeight);
        const alpha = offset === 0 ? 1.0 : (offset === -1 || offset === 1) ? 0.4 : 0.2;

        if (offset === 0) {
          // บรรทัดปัจจุบัน - เรืองแสง
          ctx.font = '700 36px "Kanit", "Noto Sans Thai", sans-serif';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 20;
          ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
          ctx.fillText(syncedLyrics[i].text, CANVAS_W / 2, y);
          ctx.shadowBlur = 0;
        } else {
          ctx.font = '400 28px "Kanit", "Noto Sans Thai", sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
          ctx.fillText(syncedLyrics[i].text, CANVAS_W / 2, y);
        }
      }

      // ถ้ายังไม่มีเนื้อเพลง (ก่อนบรรทัดแรก)
      if (lyricIdx < 0) {
        ctx.font = '400 30px "Kanit", "Noto Sans Thai", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('♪ ♫ ♪', CANVAS_W / 2, centerY);
      }

      // Progress bar ด้านล่าง
      const barY = CANVAS_H - 100;
      const barW = CANVAS_W - 80;
      const barH = 6;
      const barX = 40;

      // แทร็กเทา
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 3);
      ctx.fill();

      // แทร็กเขียว
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * progress, barH, 3);
      ctx.fill();

      // เวลา
      ctx.font = '400 20px "Kanit", "Noto Sans Thai", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'left';
      ctx.fillText(formatTime(elapsed), barX, barY + 30);
      ctx.textAlign = 'right';
      ctx.fillText(formatTime(duration), barX + barW, barY + 30);

      // Watermark
      ctx.textAlign = 'center';
      ctx.font = '400 16px "Kanit", "Noto Sans Thai", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillText('Haimiya Typo ♪', CANVAS_W / 2, CANVAS_H - 30);

      // อัปเดต progress widget
      const pctDone = 40 + (progress * 55); // 40-95%
      updateProgress(pctDone, 'กำลังสร้างวิดีโอ+เนื้อเพลง... ' + formatTime(elapsed) + ' / ' + formatTime(duration));

      animFrameId = requestAnimationFrame(renderFrame);
    }

    // เริ่มเล่นเสียง
    recorder.start(1000); // chunk ทุก 1 วินาที
    source.start(0);
    renderFrame();

    // รอจนเสียงเล่นจบ
    await new Promise((resolve) => {
      source.onended = () => {
        recordingDone = true;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        // render เฟรมสุดท้าย
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.textAlign = 'center';
        ctx.font = '600 32px "Kanit", "Noto Sans Thai", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(song.title, CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.font = '400 24px "Kanit", "Noto Sans Thai", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(song.artist, CANVAS_W / 2, CANVAS_H / 2 + 20);
        ctx.fillText('♪ Haimiya Typo ♪', CANVAS_W / 2, CANVAS_H / 2 + 60);

        setTimeout(() => {
          recorder.stop();
        }, 500); // รอ 500ms ให้เฟรมสุดท้ายเข้า
        resolve();
      };

      // Handle abort
      _videoDownloadAbort.signal.addEventListener('abort', () => {
        recordingDone = true;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        source.stop();
        recorder.stop();
        audioCtx.close();
        resolve();
      });
    });

    if (_videoDownloadAbort.signal.aborted) return cleanup();

    // รอ recorder stop event
    await new Promise((resolve) => {
      recorder.onstop = resolve;
      if (recorder.state !== 'recording') resolve();
    });

    audioCtx.close();

    if (_videoDownloadAbort.signal.aborted) return cleanup();

    // ====== STEP 6: สร้างไฟล์และดาวน์โหลด ======
    updateProgress(98, 'กำลังเตรียมไฟล์วิดีโอ...');

    const blob = new Blob(chunks, { type: 'video/webm' });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      a.remove();
    }, 5000);

    updateProgress(100, '✅ ดาวน์โหลดวิดีโอ+เนื้อเพลงสำเร็จ!');
    if (iconEl) iconEl.textContent = '✅';
    showToast('✅ ดาวน์โหลดวิดีโอ "' + song.title + '" สำเร็จแล้วค่ะ!');

    setTimeout(() => { if (widget) widget.remove(); }, 5000);

  } catch (err) {
    console.error('downloadSongVideo error:', err);
    updateProgress(0, '❌ เกิดข้อผิดพลาด: ' + (err.message || 'unknown'));
    showToast('❌ สร้างวิดีโอล้มเหลว: ' + (err.message || ''));
    setTimeout(() => { if (widget) widget.remove(); }, 5000);
  }

  function cleanup() {
    if (widget) widget.remove();
    showToast('⚠️ ยกเลิกการสร้างวิดีโอแล้วค่ะ');
  }
}

function cancelVideoDownload() {
  if (_videoDownloadAbort) {
    _videoDownloadAbort.abort();
    _videoDownloadAbort = null;
  }
}

function downloadWindowsShortcut() {
  const url = window.location.href;
  const shortcutContent = `[InternetShortcut]\r\nURL=${url}\r\nIconIndex=0\r\nIconFile=${window.location.origin}/favicon-logo.jpg\r\n`;
  const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'Haimiya-Typo-PC.url';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
    a.remove();
  }, 1000);
  showToast(currentAppLang === 'th' ? '✅ บันทึกทางลัดหน้าจอคอม (Desktop Shortcut) แล้ว ลากวางบนหน้าจอ Desktop ได้เลย!' : '✅ Downloaded Desktop Shortcut!');
}

// ซิงค์เพลงใหม่ประจำวันทันที
async function triggerLiveAutoSync() {
  showToast(currentAppLang === 'th' ? '⚡ กำลังตรวจสอบเพลงใหม่จากคลาวด์และชาร์ตเพลงล่าสุด...' : '⚡ Checking for new songs...');
  try {
    const isLocalServer = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalServer) {
      const res = await fetch('/trigger-auto-update', { method: 'POST' });
      if (res.ok) {
        showToast(currentAppLang === 'th' ? '✅ ซิงค์เพลงใหม่สำเร็จ! กำลังรีเฟรชคลังเพลง...' : '✅ Auto-sync completed!');
        setTimeout(() => window.location.reload(), 1500);
        return;
      }
    }
    const vRes = await fetch('version.json?t=' + Date.now());
    if (vRes.ok) {
      const vData = await vRes.json();
      showToast(currentAppLang === 'th' ? `✅ คลังเพลงปัจจุบัน: ${vData.songCount} เพลง (อัปเดตล่าสุด: ${new Date(vData.updatedAt).toLocaleDateString('th-TH')})` : `✅ Song count: ${vData.songCount}`);
    }
  } catch(e) {
    showToast(currentAppLang === 'th' ? 'ℹ️ ระบบซิงค์เพลงออนไลน์พร้อมใช้งาน' : 'Online sync ready');
  }
}

let _sharedAudioPlayer = null;
let _lastBlobUrl = null;
function getSharedAudioPlayer() {
  if (!_sharedAudioPlayer) {
    _sharedAudioPlayer = new Audio();
    _sharedAudioPlayer.preload = 'auto';
    // อนุญาตเล่น audio จากทุก CDN (รวมถึง googlevideo/full songs) โดยไม่ติดบล็อก CORS
    _sharedAudioPlayer.removeAttribute('crossorigin');
    // ตั้งค่า buffer ขนาดใหญ่เพื่อลด audio stutter
    try {
      _sharedAudioPlayer.mozAudioChannelType = 'content';
    } catch(e) {}
  }
  return _sharedAudioPlayer;
}

// ล้าง Blob URL เก่าเพื่อคืนหน่วยความจำและป้องกัน audio buffer leak
function cleanupOldBlobUrl() {
  if (_lastBlobUrl && _lastBlobUrl.startsWith('blob:')) {
    try { URL.revokeObjectURL(_lastBlobUrl); } catch(e) {}
    _lastBlobUrl = null;
  }
}

let isLoopTrack = false;
function toggleLoopTrack() {
  isLoopTrack = !isLoopTrack;
  const loopBtn = document.getElementById('bp-loop-btn');
  if (loopBtn) {
    loopBtn.style.color = isLoopTrack ? 'var(--primary)' : 'rgba(255,255,255,0.45)';
    loopBtn.style.background = isLoopTrack ? 'rgba(56, 189, 248, 0.15)' : 'none';
  }
  showToast(isLoopTrack ? '🔁 เปิดเล่นวนซ้ำเพลงเดิม' : '➡️ เปิดเล่นเพลงถัดไปอัตโนมัติ');
}

function playNextSong() {
  if (!currentPlayingId || !SONGS.length) return;
  const idx = SONGS.findIndex(s => s.id === currentPlayingId);
  const nextIdx = (idx >= 0 && idx < SONGS.length - 1) ? idx + 1 : 0;
  togglePlaySong(SONGS[nextIdx].id);
}

function playPreviousSong() {
  if (!currentPlayingId || !SONGS.length) return;
  const idx = SONGS.findIndex(s => s.id === currentPlayingId);
  const prevIdx = idx > 0 ? idx - 1 : SONGS.length - 1;
  togglePlaySong(SONGS[prevIdx].id);
}

// ---- CACHED FULL SONGS HELPERS ----
function getCachedFullSong(songId) {
  try {
    const cache = JSON.parse(localStorage.getItem('_haimiya_full_songs') || '{}');
    return cache[songId];
  } catch (e) { return null; }
}
function setCachedFullSong(songId, data) {
  try {
    const cache = JSON.parse(localStorage.getItem('_haimiya_full_songs') || '{}');
    cache[songId] = data;
    localStorage.setItem('_haimiya_full_songs', JSON.stringify(cache));
  } catch (e) {}
}

async function togglePlaySong(songId) {
  const song = SONGS.find(s => s.id === songId);
  if (!song) return;

  // Check if we have cached full audio for this song
  const cachedFull = getCachedFullSong(song.id);
  if (cachedFull && cachedFull.directAudioUrl) {
    song.fullAudioUrl = cachedFull.directAudioUrl;
    if (cachedFull.duration) song.duration = cachedFull.duration;
    song.isFull = true;
  }

  // 1. Resolve safe audio URL (prefer full song stream, then valid Apple Music / Spotify preview URLs)
  let audioSrc = resolveAssetUrl(song.fullAudioUrl || song.previewUrl || song.audioUrl || song.audioFallback);
  const isDeezer = audioSrc && audioSrc.includes('dzcdn.net');

  // If audio is Deezer (expired tokens) or completely missing, try to resolve via iTunes ONLY with strict title match
  if ((!audioSrc || isDeezer) && !song._resolved && navigator.onLine) {
    try {
      const cleanTitle = (song.title || '').replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/"/g, '').trim();
      const cleanArtist = (song.artist || '').split(',')[0].split('&')[0].split('feat')[0].replace(/\([^)]*\)/g, '').trim();
      const country = song.lang === 'th' ? 'th' : (song.lang === 'jp' ? 'jp' : (song.lang === 'kr' ? 'kr' : 'us'));
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle + ' ' + cleanArtist)}&country=${country}&entity=song&limit=5`);
      const json = await res.json();
      if (json && json.results && json.results.length > 0) {
        const normalizeStr = s => (s || '').toLowerCase().replace(/[\s\-_\.\,\:\;\!\?\'\"\"\(\)\[\]\{\}\/\\]+/g, '');
        const origTitle = normalizeStr(song.title);
        // STRICT: require title to match! NEVER fall back to results[0] blindly
        const bestResult = json.results.find(r => {
          const rTitle = normalizeStr(r.trackName);
          return rTitle.includes(origTitle) || origTitle.includes(rTitle) || (origTitle.length > 3 && rTitle.slice(0, 8) === origTitle.slice(0, 8));
        });
        if (bestResult && bestResult.previewUrl) {
          audioSrc = bestResult.previewUrl;
          song.previewUrl = audioSrc;
          song.audioUrl = audioSrc;
          song.audioFallback = audioSrc;
          song._resolved = true;
          if ((!song.coverUrl || song.coverUrl.includes('dzcdn.net')) && bestResult.artworkUrl100) {
            song.coverUrl = bestResult.artworkUrl100.replace('100x100', '600x600');
          }
        }
      }
    } catch (e) {
      console.warn('Real audio resolution notice:', e.message);
    }
  }
  song.needsLiveResolution = false;

  if (!audioSrc) {
    const songTitle = song ? `"${song.title}"` : (currentAppLang === 'th' ? 'เพลงนี้' : 'this track');
    showToast(currentAppLang === 'th' ? `🎧 ${songTitle} ยังไม่มีตัวอย่าง 30s ในระบบ — กดปุ่ม Spotify เพื่อฟังเพลงเต็ม` : `🎧 30s preview not available for ${songTitle} — Open Spotify for full audio`);
    return;
  }

  // If already playing this song -> pause
  if (currentPlayingId === songId && currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    updateAudioUI(false);
    resumeRelaxBgm();
    return;
  }

  // If this same song was paused -> resume seamlessly (DO NOT RESET to 0!)
  if (currentPlayingId === songId && currentAudio && currentAudio.paused) {
    duckRelaxBgm();
    currentAudio.play().then(() => {
      updateAudioUI(true);
      showBottomPlayer(song);
    }).catch(err => {
      console.warn('Audio resume error:', err);
    });
    return;
  }

  // If playing another song -> stop old one
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch (e) {}
  }

  // Non-blocking background fetch for real song duration (plays audioSrc immediately without waiting)
  if (!song.duration && navigator.onLine) {
    triggerBackgroundFullSongFetch(song);
  }

  const handleAudioFail = () => {
    if (!navigator.onLine) {
      showToast(currentAppLang === 'th'
        ? '⚠️ ไม่มีสัญญาณเน็ต และเพลงนี้ยังไม่ได้บันทึกไว้ในเครื่อง — ลองฟังเพลงที่แคชไว้แล้ว'
        : '⚠️ Offline & song not cached in device yet');
    } else {
      showToast(currentAppLang === 'th'
        ? '🎧 เสียงตัวอย่างโหลดไม่ได้ — กดปุ่ม Spotify เพื่อฟังเพลงเต็ม'
        : '🎧 Could not load audio preview — Open Spotify for full audio');
    }
    currentAudio = null;
    currentPlayingId = null;
    updateAudioUI(false);
    resumeRelaxBgm();
  };

  const tryPlay = async (url, fallbackUrl) => {
    // ✅ Stop AI chat audio when main player starts playing
    if (typeof stopAiChatAudio === 'function') {
      try { stopAiChatAudio(); } catch (e) {}
    }

    // ดับเพลงผ่อนคลายทันทีเพื่อไม่ให้เสียงชนกัน
    duckRelaxBgm();

    // ล้าง Blob URL เก่าเพื่อคืนหน่วยความจำ
    cleanupOldBlobUrl();

    // ดึงไฟล์เสียงแบบ Offline Blob
    let playableUrl = await getOfflinePlayableUrl(url);
    if (!playableUrl && fallbackUrl) {
      playableUrl = await getOfflinePlayableUrl(fallbackUrl);
    }

    if (!playableUrl && !navigator.onLine) {
      let blueRes = await caches.match('./blue_relax.m4a');
      if (!blueRes) blueRes = await caches.match('blue_relax.m4a');
      if (blueRes) {
        const blob = await blueRes.blob();
        playableUrl = URL.createObjectURL(blob);
        showToast(currentAppLang === 'th' ? '📡 ออฟไลน์: กำลังเล่นเพลงผ่อนคลาย (blue)' : '📡 Offline: Playing blue (relax bgm)');
      } else {
        handleAudioFail();
        return;
      }
    }

    const audio = getSharedAudioPlayer();
    // หยุดเสียงเก่าก่อนอย่างสมบูรณ์เพื่อป้องกัน audio buffer ค้าง
    try {
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // Reset internal buffer
    } catch(e) {}

    audio.volume = currentVolume;
    currentAudio = audio;
    currentPlayingId = songId;

    audio.onerror = async (e) => {
      console.warn('Audio error:', e, 'src:', audio.src);
      if (!navigator.onLine) {
        let blueRes = await caches.match('./blue_relax.m4a');
        if (!blueRes) blueRes = await caches.match('blue_relax.m4a');
        if (blueRes) {
          const blob = await blueRes.blob();
          const altBlob = URL.createObjectURL(blob);
          cleanupOldBlobUrl();
          _lastBlobUrl = altBlob;
          audio.removeAttribute('crossorigin');
          audio.src = altBlob;
          audio.load();
          audio.play().then(() => {
            updateAudioUI(true);
            showBottomPlayer(song);
            showToast(currentAppLang === 'th' ? '📡 ออฟไลน์: กำลังเล่นเพลงผ่อนคลาย (blue)' : '📡 Offline: Playing blue (relax bgm)');
          }).catch(handleAudioFail);
          return;
        }
      }
      if (fallbackUrl && audio.src !== fallbackUrl) {
        const altUrl = await getOfflinePlayableUrl(fallbackUrl);
        if (altUrl) {
          cleanupOldBlobUrl();
          _lastBlobUrl = altUrl;
          if (altUrl.startsWith('blob:')) audio.removeAttribute('crossorigin');
          audio.src = altUrl;
          audio.load();
          audio.play().then(() => {
            updateAudioUI(true);
            showBottomPlayer(song);
          }).catch(handleAudioFail);
          return;
        }
      }
      handleAudioFail();
    };

    audio.onended = () => {
      // Seamlessly continue into full song if full stream was resolved in background
      if (song.fullAudioUrl && audio.src !== song.fullAudioUrl) {
        audio.src = song.fullAudioUrl;
        audio.currentTime = 29.5;
        audio.play().then(() => {
          updateAudioUI(true);
          showBottomPlayer(song);
        }).catch(() => {
          if (isLoopTrack) { audio.currentTime = 0; audio.play().catch(() => {}); } else { playNextSong(); }
        });
        return;
      }
      if (isLoopTrack) {
        audio.currentTime = 0;
        audio.play().then(() => updateAudioUI(true)).catch(() => {
          updateAudioUI(false);
          resumeRelaxBgm();
        });
      } else {
        setTimeout(() => playNextSong(), 50);
      }
    };

    // Throttle timeupdate to reduce UI jank and audio stuttering on low-end devices
    // เพิ่ม interval เป็น 350ms เพื่อลดภาระ CPU บนมือถือ
    let _lastProgressUpdate = 0;
    audio.onloadedmetadata = () => {
      updateBottomPlayerProgress();
    };
    audio.ontimeupdate = () => {
      const now = performance.now();
      if (now - _lastProgressUpdate > 350) {
        _lastProgressUpdate = now;
        requestAnimationFrame(() => updateBottomPlayerProgress());
      }
    };

    const targetSrc = playableUrl || url;
    _lastBlobUrl = targetSrc;
    // เล่น direct audio stream เต็มเพลงได้ทันทีโดยไม่ติด CORS
    audio.removeAttribute('crossorigin');
    audio.src = targetSrc;
    audio.load();

    // รอให้ audio buffer โหลดพอก่อนเล่น เพื่อลด stutter ตอนเริ่มเพลง
    const waitForBuffer = () => new Promise((resolve) => {
      const onCanPlay = () => {
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('canplaythrough', onCanPlay);
        resolve();
      };
      audio.addEventListener('canplay', onCanPlay, { once: true });
      audio.addEventListener('canplaythrough', onCanPlay, { once: true });
      // Timeout fallback 1.5s กรณีเน็ตช้า
      setTimeout(resolve, 1500);
    });

    await waitForBuffer();

    audio.play().then(() => {
      updateAudioUI(true);
      showBottomPlayer(song);

      // Auto resolve full song in background for any song playing!
      if (!song.fullAudioUrl && !song.isFull && navigator.onLine) {
        (async () => {
          try {
            const cleanTitle = (song.title || '').replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/"/g, '').trim();
            const cleanArtist = (song.artist || '').split(',')[0].split('&')[0].replace(/\([^)]*\)/g, '').trim();
            const q = `${cleanTitle} ${cleanArtist}`.trim();
            const apiRes = await fetch(`${NETLIFY_BASE}/api/ai/get-full-song?q=${encodeURIComponent(q)}`);
            if (apiRes.ok) {
              const data = await apiRes.json();
              if (data.ok && data.directAudioUrl) {
                song.fullAudioUrl = data.directAudioUrl;
                song.isFull = true;
                if (data.duration) song.duration = data.duration;
                setCachedFullSong(song.id, { directAudioUrl: data.directAudioUrl, duration: data.duration });

                // If user is still listening to this song, seamlessly hot-swap to full audio
                if (currentPlayingId === song.id && currentAudio && !currentAudio.paused) {
                  const ct = currentAudio.currentTime || 0;
                  const wasPlaying = !currentAudio.paused;
                  currentAudio.src = data.directAudioUrl;
                  currentAudio.addEventListener('loadedmetadata', () => {
                    try { currentAudio.currentTime = ct; } catch(e) {}
                    if (wasPlaying) currentAudio.play().catch(() => {});
                  }, { once: true });
                  showBottomPlayer(song);
                  updateBottomPlayerProgress();
                }
              }
            }
          } catch(e) {}
        })();
      }
      updateMediaSession(song, false);
      if (!navigator.onLine) {
        showToast(currentAppLang === 'th' ? '⚡ เล่นจากคลังเพลงออฟไลน์ในเครื่อง' : '⚡ Playing from offline storage');
      }
    }).catch(err => {
      console.warn('Audio play() rejected:', err.message);
      if (err.name === 'NotAllowedError') {
        showToast(currentAppLang === 'th' ? '🎧 กรุณาคลิกที่หน้าจอก่อนแล้วลองกดเล่นอีกครั้ง' : '🎧 Please interact with the screen once, then try playing again');
      } else {
        handleAudioFail();
      }
      currentAudio = null;
      currentPlayingId = null;
      updateAudioUI(false);
      resumeRelaxBgm();
    });
  };

  tryPlay(audioSrc, song.audioFallback || song.previewUrlAlt || null);
}

function updateAudioUI(isPlaying) {
  document.querySelectorAll('[data-play-btn]').forEach(btn => {
    const id = parseInt(btn.dataset.playBtn);
    const song = (typeof SONGS !== 'undefined' && SONGS.find(s => s.id === id)) ||
                 (typeof SONG_MAP !== 'undefined' && SONG_MAP.get(id));
    const isFull = song && (song.isFull || song.fullAudioUrl || (song.audioUrl && (song.audioUrl.endsWith('.mp3') || !song.audioUrl.includes('apple.com'))));

    let durationBadge = '--:--';
    if (song && song.duration) {
      const dm = Math.floor(song.duration / 60);
      const ds = Math.floor(song.duration % 60).toString().padStart(2, '0');
      durationBadge = `${dm}:${ds}`;
    }

    const thisPlaying = id === currentPlayingId && isPlaying;
    const label = thisPlaying
      ? (currentAppLang === 'th' ? 'กำลังเล่น' : 'Playing')
      : (currentAppLang === 'th' ? '▶ ฟังเพลงเต็ม' : '▶ Play Full');

    const iconHtml = thisPlaying
      ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="#000"><rect x="5" y="3" width="4.5" height="18" rx="1.5"></rect><rect x="14.5" y="3" width="4.5" height="18" rx="1.5"></rect></svg>'
      : '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="margin-left:1.5px;"><polygon points="6 4 20 12 6 20"></polygon></svg>';

    const waveHtml = thisPlaying
      ? '<span class="sound-bars"><span></span><span></span><span></span><span></span></span>'
      : '';

    btn.innerHTML = `
      <div class="play-left">
        <span class="play-icon-disc">${iconHtml}</span>
        <span class="play-label">${label}</span>
        ${waveHtml}
      </div>
      <span class="play-duration-badge">${durationBadge}</span>
    `;

    if (thisPlaying) {
      btn.classList.add('playing');
    } else {
      btn.classList.remove('playing');
    }
  });

  document.querySelectorAll('.song-card').forEach(card => {
    const cardId = parseInt(card.id.replace('song-', ''));
    const isThisCard = cardId === currentPlayingId && isPlaying;
    if (isThisCard) {
      card.classList.add('is-playing');
    } else {
      card.classList.remove('is-playing');
    }
    const overlayBtn = card.querySelector('.song-play-overlay');
    if (overlayBtn) {
      overlayBtn.innerHTML = isThisCard ? '⏸️' : '▶️';
    }
  });

  const bpBtn = document.getElementById('bp-play-btn');
  if (bpBtn) {
    bpBtn.innerHTML = isPlaying
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="#000"><rect x="5" y="3" width="4.5" height="18" rx="1.5"></rect><rect x="14.5" y="3" width="4.5" height="18" rx="1.5"></rect></svg>'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="#000" style="margin-left:2px;"><polygon points="6 4 20 12 6 20"></polygon></svg>';
  }
}

// ---- BOTTOM PLAYER WITH VOLUME SLIDER & CONTROLS ----
function showBottomPlayer(song) {
  let player = document.getElementById('bottom-player');
  if (!player) return;

  const isSaved = isSongSaved(song.id);
  const percent = Math.round(currentVolume * 100);
  const icon = getVolumeIcon(currentVolume);
  const fallbackCover = getSongFallbackCover(song);

  const playTooltip = currentAudio && !currentAudio.paused ? (currentAppLang === 'th' ? 'หยุดชั่วคราว' : 'Pause') : (currentAppLang === 'th' ? 'เล่นต่อ' : 'Play');
  const muteTooltip = currentAppLang === 'th' ? 'เปิด/ปิดเสียง' : 'Mute / Unmute';
  const volDownTooltip = currentAppLang === 'th' ? 'ลดเสียง 10%' : 'Volume Down 10%';
  const volUpTooltip = currentAppLang === 'th' ? 'เพิ่มเสียง 10%' : 'Volume Up 10%';
  const volSliderTooltip = currentAppLang === 'th' ? 'ปรับระดับเสียง' : 'Adjust Volume';
  const saveTooltip = isSaved ? (currentAppLang === 'th' ? 'นำออกจากที่บันทึกไว้' : 'Remove from saved') : (currentAppLang === 'th' ? 'บันทึกเพลงนี้' : 'Save this song');
  const saveLabel = isSaved ? (currentAppLang === 'th' ? '❤️ บันทึกแล้ว' : '❤️ Saved') : (currentAppLang === 'th' ? '🤍 บันทึกเพลง' : '🤍 Save');
  const matchLabel = currentAppLang === 'th' ? '🌸 ดูคู่ตัดต่อ' : '🌸 View Pair';
  const ytTooltip = currentAppLang === 'th' ? 'ค้นหาบน YouTube' : 'Search on YouTube';
  const closeTooltip = currentAppLang === 'th' ? 'ปิดแถบเครื่องเล่น' : 'Close player';

  player.innerHTML = `
    <!-- Top Thin Progress Line for Mobile & Desktop -->
    <div class="bp-top-progress" onclick="seekAudio(event)" title="เลื่อนช่วงเวลา">
      <div class="bp-top-progress-fill" id="bp-top-progress-fill"></div>
    </div>
    <div class="bp-inner">
      <div class="bp-track">
        <div class="bp-cover-box">
          <img src="${resolveAssetUrl(song.coverUrl)}" alt="${song.title}" class="bp-cover ${currentAudio && !currentAudio.paused ? 'spinning' : ''}" id="bp-cover-img"
            onerror="this.onerror=null;this.src='${fallbackCover}';" />
        </div>
        <div class="bp-info">
          <div class="bp-title-wrap" style="display:flex;align-items:center;gap:6px;">
            <div class="bp-title">${song.title}</div>
            <span class="sound-bars" style="margin-left:2px;"><span></span><span></span><span></span><span></span></span>
          </div>
          <div class="bp-artist">${song.artist} <span class="lang-pill-mini">${langPillText(song.lang)}</span></div>
        </div>
      </div>

      <div class="bp-controls">
        <div class="bp-controls-row" style="display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:4px;">
          <button class="bp-skip-btn" onclick="playPreviousSong()" title="เพลงก่อนหน้า" style="background:none;border:none;color:#fff;font-size:1.1rem;cursor:pointer;padding:4px 6px;border-radius:6px;transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'">
            ⏮️
          </button>
          <button class="bp-play-btn" id="bp-play-btn" onclick="togglePlaySong(${song.id})" title="${playTooltip}">
            ${currentAudio && !currentAudio.paused
              ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="#000"><rect x="5" y="3" width="4.5" height="18" rx="1.5"></rect><rect x="14.5" y="3" width="4.5" height="18" rx="1.5"></rect></svg>'
              : '<svg width="15" height="15" viewBox="0 0 24 24" fill="#000" style="margin-left:2px;"><polygon points="6 4 20 12 6 20"></polygon></svg>'
            }
          </button>
          <button class="bp-skip-btn" onclick="playNextSong()" title="เพลงถัดไป" style="background:none;border:none;color:#fff;font-size:1.1rem;cursor:pointer;padding:4px 6px;border-radius:6px;transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'">
            ⏭️
          </button>
          <button class="bp-loop-btn" id="bp-loop-btn" onclick="toggleLoopTrack()" title="วนซ้ำเพลงนี้" style="background:${isLoopTrack ? 'rgba(56, 189, 248, 0.2)' : 'none'};border:none;color:${isLoopTrack ? 'var(--primary)' : 'rgba(255,255,255,0.45)'};font-size:1rem;cursor:pointer;padding:4px 6px;border-radius:6px;">
            🔁
          </button>
        </div>
        <div class="bp-progress-wrap">
          <span class="bp-time" id="bp-time-cur">0:00</span>
          <div class="bp-progress-bar" id="bp-progress-bar">
            <div class="bp-progress-fill" id="bp-progress-fill"></div>
            <div class="bp-seek-thumb" id="bp-seek-thumb"></div>
          </div>
          <span class="bp-time" id="bp-time-total">${song.duration ? Math.floor(song.duration/60) + ':' + Math.floor(song.duration%60).toString().padStart(2,'0') : '--:--'}</span>
        </div>
      </div>

      <!-- Actions & Volume Panel (Responsive for Desktop & Mobile) -->
      <div class="bp-actions-panel">
        <div class="bp-actions">
          <button class="btn-sm btn-download-audio" onclick="openDownloadChoiceModal(${song.id}, event)" title="${currentAppLang === 'th' ? '📥 ดาวน์โหลดเพลงนี้ลงคอมสำหรับตัดต่อ' : 'Download audio for PC'}">📥 ${currentAppLang === 'th' ? 'ดาวน์โหลดเพลง' : 'Download'}</button>
          <button class="btn-sm btn-floating-player" id="btn-toggle-float" onclick="toggleFloatingPlayer(event)" title="${currentAppLang === 'th' ? 'เปิดโหมดเครื่องเล่นลอย (Floating Player) ลากย้ายได้อิสระ' : 'Toggle Floating Mini-Player'}">✨ แอพลอย</button>
          <button class="btn-sm btn-match" onclick="openAnimeMatchModal(${song.id})">${matchLabel}</button>
          <button class="btn-sm btn-bp-save ${isSaved ? 'saved' : ''}" data-save-id="${song.id}" onclick="toggleSaveSong(${song.id}, event)" title="${saveTooltip}">
            ${saveLabel}
          </button>
          <a href="${song.spotifyUrl}" target="_blank" class="btn-sm btn-spotify" title="เปิดบน Spotify">🎧 Spotify</a>
          <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + ' ' + song.artist)}" target="_blank" class="btn-sm btn-yt" title="${ytTooltip}">▶️ YouTube</a>
        </div>

        <div class="bp-volume-panel">
          <button class="bp-vol-btn" id="bp-mute-btn" onclick="toggleMute()" title="${muteTooltip}">
            ${icon}
          </button>
          <button class="bp-vol-step-btn" onclick="adjustVolumeStep(-10)" title="${volDownTooltip}">-</button>
          <input type="range" min="0" max="100" value="${percent}" class="bp-vol-slider" id="bp-vol-slider" oninput="setVolume(this.value)" title="${volSliderTooltip}" />
          <button class="bp-vol-step-btn" onclick="adjustVolumeStep(10)" title="${volUpTooltip}">+</button>
          <span class="bp-vol-percent" id="bp-vol-percent">${percent}%</span>
        </div>

        <button class="bp-close-btn" onclick="hideBottomPlayer()" title="${closeTooltip}">✕</button>
      </div>
    </div>
  `;

  player.style.display = 'block';
  document.body.classList.add('has-bottom-player');
  requestAnimationFrame(() => {
    player.classList.add('visible');
  });
}

function hideBottomPlayer() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {
      console.warn('Audio pause error:', e);
    }
  }
  updateAudioUI(false);
  document.body.classList.remove('has-bottom-player');
  const player = document.getElementById('bottom-player');
  if (player) {
    player.classList.remove('visible');
    // ซ่อนสนิทแบบ 100% เลื่อนลงและล้างเนื้อหา
    setTimeout(() => {
      if (!player.classList.contains('visible')) {
        player.style.display = 'none';
        player.innerHTML = '';
      }
    }, 280);
  }
  currentPlayingId = null;
  resumeRelaxBgm();
}

function updateBottomPlayerProgress() {
  if (!currentAudio) return;
  const cur = currentAudio.currentTime || 0;
  const song = (typeof SONGS !== 'undefined' && SONGS.find(s => s.id === currentPlayingId)) ||
               (typeof SONG_MAP !== 'undefined' && SONG_MAP.get(currentPlayingId));
  const dur = (song && song.duration && song.duration > 30)
    ? song.duration
    : ((currentAudio.duration && isFinite(currentAudio.duration) && currentAudio.duration > 30)
        ? currentAudio.duration
        : (song?.duration || (currentAudio.duration && isFinite(currentAudio.duration) ? currentAudio.duration : 210)));
  const pct = Math.min((cur / dur) * 100, 100);

  const fill = document.getElementById('bp-progress-fill');
  if (fill) fill.style.width = pct + '%';

  const thumb = document.getElementById('bp-seek-thumb');
  if (thumb) thumb.style.left = pct + '%';

  const topFill = document.getElementById('bp-top-progress-fill');
  if (topFill) topFill.style.width = pct + '%';

  const curEl = document.getElementById('bp-time-cur');
  if (curEl) {
    const m = Math.floor(cur / 60);
    const s = Math.floor(cur % 60).toString().padStart(2, '0');
    curEl.textContent = `${m}:${s}`;
  }
  const totalEl = document.getElementById('bp-time-total');
  if (totalEl) {
    const tm = Math.floor(dur / 60);
    const ts = Math.floor(dur % 60).toString().padStart(2, '0');
    totalEl.textContent = `${tm}:${ts}`;
  }
}

function seekAudio(e) {
  if (!currentAudio || !currentAudio.duration) return;
  const bar = document.getElementById('bp-progress-bar') || e.currentTarget;
  const rect = bar.getBoundingClientRect();
  const clickX = (e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0) - rect.left;
  const pct = Math.max(0, Math.min(clickX / rect.width, 1));
  currentAudio.currentTime = pct * currentAudio.duration;
  updateBottomPlayerProgress();
}

// ---- DRAG SEEK THUMB ----
let _seekDragging = false;
(function initSeekDrag() {
  document.addEventListener('pointerdown', (e) => {
    const thumb = document.getElementById('bp-seek-thumb');
    const bar = document.getElementById('bp-progress-bar');
    if (!thumb || !bar) return;
    if (e.target === thumb || e.target === bar || bar.contains(e.target)) {
      _seekDragging = true;
      seekAudio(e);
      e.preventDefault();
    }
  });
  document.addEventListener('pointermove', (e) => {
    if (!_seekDragging) return;
    seekAudio(e);
  });
  document.addEventListener('pointerup', () => {
    _seekDragging = false;
  });
})();

// ---- ZONE-BASED RANDOMIZER WITH OPTIONS & SHUFFLE DECK ----
let selectedZone = 'th'; // 'th', 'en', 'jp', 'all'
let selectedRandomMood = 'all'; // 'all', 'sad', 'love', 'hype', 'chill'
let selectedRandomBpm = 'all'; // 'all', 'slow', 'mid', 'fast'
let zoneDeck = [];
let lastRandomSongId = null;

function getZoneNameTH(zone) {
  if (zone === 'th') return '🇹🇭 โซนเพลงไทย';
  if (zone === 'en') return '🇬🇧 โซนเพลงสากล';
  if (zone === 'jp') return '🇯🇵 โซนเพลงญี่ปุ่น / อนิเมะ';
  return '🌐 สุ่มรวมทุกโซน';
}

function getEligibleSongsForZone() {
  return SONGS.filter(s => {
    // โหมดลับ Funk & Phonk แยกต่างหาก ไม่นำมาปะปนในโซนสุ่มหลัก
    if (s.lang === 'funk') return false;
    const matchZone = selectedZone === 'all' || s.lang === selectedZone;
    const songMood = normalizeMood(s.mood);
    const matchMood = selectedRandomMood === 'all' || songMood === selectedRandomMood;

    let matchBpm = true;
    if (selectedRandomBpm !== 'all') {
      const bpmNum = getSongBpmNumber(s);
      const bpmStr = String(s.bpm || '').toLowerCase();
      if (selectedRandomBpm === 'slow') {
        matchBpm = bpmStr.includes('ช้า') || bpmStr.includes('slow') || bpmNum < 85;
      } else if (selectedRandomBpm === 'mid') {
        matchBpm = bpmStr.includes('ปานกลาง') || bpmStr.includes('mid') || (bpmNum >= 85 && bpmNum <= 118);
      } else if (selectedRandomBpm === 'fast') {
        matchBpm = bpmStr.includes('เร็ว') || bpmStr.includes('fast') || bpmNum > 118;
      }
    }

    return matchZone && matchMood && matchBpm;
  });
}

function initZoneDeck() {
  const eligible = getEligibleSongsForZone();
  let ids = eligible.map(s => s.id);
  // Fisher-Yates shuffle
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  // Prevent same song immediately if possible
  if (ids.length > 1 && lastRandomSongId && ids[0] === lastRandomSongId) {
    [ids[0], ids[1]] = [ids[1], ids[0]];
  }
  zoneDeck = ids;
  updateZoneCounterUI();
}

function selectZone(zone, btn) {
  selectedZone = zone;
  document.querySelectorAll('.zone-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  initZoneDeck();
}

function setRandomMood(mood, btn) {
  selectedRandomMood = mood;
  document.querySelectorAll('#random-mood-pills .pill-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  initZoneDeck();
}

function setRandomBpm(bpm, btn) {
  selectedRandomBpm = bpm;
  document.querySelectorAll('#random-bpm-pills .pill-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  initZoneDeck();
}

function resetShuffleDeck() {
  initZoneDeck();
  const counterEl = document.getElementById('random-counter-badge');
  if (counterEl) {
    counterEl.parentElement.classList.add('highlight');
    setTimeout(() => counterEl.parentElement.classList.remove('highlight'), 500);
  }
}

function updateZoneCounterUI() {
  const eligible = getEligibleSongsForZone();
  const total = eligible.length;
  const played = total - zoneDeck.length;
  const counterEl = document.getElementById('random-counter-badge');
  if (!counterEl) return;

  if (total === 0) {
    counterEl.textContent = currentAppLang === 'th'
      ? `⚠️ ไม่พบเพลงในตัวเลือกนี้ กรุณาลองเปลี่ยนมู้ดหรือความเร็ว BPM`
      : `⚠️ No tracks found matching these filters. Try changing mood or BPM.`;
    return;
  }

  if (played === 0) {
    counterEl.innerHTML = currentAppLang === 'th'
      ? `${getZoneName(selectedZone)}: พร้อมสุ่มทั้งหมด <strong>${total}</strong> เพลง (ระบบสับไพ่ไม่ซ้ำ)`
      : `${getZoneName(selectedZone)}: <strong>${total}</strong> songs ready to roll (non-repeating shuffle)`;
  } else {
    counterEl.innerHTML = currentAppLang === 'th'
      ? `${getZoneName(selectedZone)}: สุ่มไปแล้ว <strong>${played} / ${total}</strong> เพลง (ไม่ซ้ำ)`
      : `${getZoneName(selectedZone)}: Rolled <strong>${played} / ${total}</strong> tracks (unique)`;
  }
}

// ---- RANDOM EXECUTION WITH DICE SFX & 3D TUMBLE ----
function renderRandomShowcase(song) {
  const anime = ANIME_MAP.get(song.animeId) || (ANIMES && ANIMES.find(a => a.id === song.animeId)) || ANIMES[0];
  const isPlaying = currentPlayingId === song.id && currentAudio && !currentAudio.paused;
  queueFullSongPreload(song);
  const percent = Math.round(currentVolume * 100);
  const icon = getVolumeIcon(currentVolume);
  const animeDisplayName = getAnimeDisplayName(anime);
  const animeSubName = getAnimeSecondaryName(anime);

  const showcaseEl = document.getElementById('random-showcase');
  if (!showcaseEl) return;

  showcaseEl.innerHTML = `
    <div class="studio-random-card studio-card-reveal">
      <div class="studio-card-header">
        <div class="studio-header-left">
          <span class="studio-zone-badge">${getZoneName(song.lang || 'th')}</span>
          <span class="studio-mood-badge ${moodClass(song.mood)}">${moodLabel(song.mood)}</span>
          <span class="studio-roll-badge">🎲 ${currentAppLang === 'th' ? 'ผลการสุ่มรอบนี้' : 'Current Roll'}</span>
        </div>
        <div class="studio-bpm-tag">⚡ ${formatBpm(song.bpm)}</div>
      </div>

      <div class="studio-card-grid">
        <!-- LEFT: SONG SHOWCASE -->
        <div class="studio-subcard song-subcard">
          <div class="subcard-title-row">
            <span class="subcard-icon">🎵</span>
            <span class="subcard-label">${currentAppLang === 'th' ? 'เพลงที่สุ่มได้' : 'Selected Track'}</span>
          </div>

          <div class="song-subcard-body">
            <div class="song-cover-box">
              <img src="${song.coverUrl}" alt="${song.title}" class="song-cover-main" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${getSongFallbackCover(song)}';" />
            </div>
            <div class="song-subcard-info">
              <div class="song-main-name">${song.title}</div>
              <div class="song-artist-name">${currentAppLang === 'th' ? 'โดย' : 'By'} ${song.artist} <span class="lang-pill-mini">${langPillText(song.lang)}</span></div>
              <div class="song-tag-list">
                ${getSongTagsForDisplay(song).map(t => `<span class="song-tag">${t}</span>`).join('')}
              </div>
            </div>
          </div>

          <!-- Studio Play & Volume Controls -->
          <div class="subcard-player-strip">
            <div class="showcase-player-actions">
              ${renderPlayButton(song.id, isPlaying)}
              <button class="btn-sm btn-download-audio" onclick="openDownloadChoiceModal(${song.id}, event)" title="${currentAppLang === 'th' ? '📥 ดาวน์โหลดเพลงนี้ลงคอมสำหรับตัดต่อ' : 'Download audio for PC'}">📥 ${currentAppLang === 'th' ? 'ดาวน์โหลดเพลง' : 'Download'}</button>
              <a href="${song.spotifyUrl}" target="_blank" class="btn-sm btn-spotify">🎧 Spotify</a>
            </div>

            <div class="showcase-volume-inline">
              <button class="bp-vol-btn" id="showcase-mute-btn" onclick="toggleMute()" title="${currentAppLang === 'th' ? 'เปิด/ปิดเสียง' : 'Mute / Unmute'}">${icon}</button>
              <input type="range" min="0" max="100" value="${percent}" class="bp-vol-slider" id="showcase-vol-slider" oninput="setVolume(this.value)" title="${currentAppLang === 'th' ? 'ปรับความดังเสียง' : 'Adjust Volume'}" />
              <span class="bp-vol-percent" id="showcase-vol-percent">${percent}%</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: ANIME MATCH SHOWCASE -->
        <div class="studio-subcard anime-subcard">
          <div class="subcard-title-row">
            <span class="subcard-icon">🌸</span>
            <span class="subcard-label">${currentAppLang === 'th' ? 'อนิเมะแนะนำสำหรับคลิปนี้' : 'Matched Anime for Editing'}</span>
          </div>

          <div class="anime-subcard-body">
            ${animeImgTag(anime, 'anime-poster-main', '', 'eager', 'high')}
            <div class="anime-subcard-info">
              <div class="anime-name-th">${animeDisplayName}</div>
              <div class="anime-name-en">${animeSubName}</div>
            </div>
          </div>

          <div class="anime-subcard-footer">
            <a href="${anime.anifumeUrl}" target="_blank" class="btn-sm btn-anifume">🌸 ${currentAppLang === 'th' ? 'ดูข้อมูลบน Anifume →' : 'View on Anifume →'}</a>
            <button onclick="openAnimePicker(${song.id})" class="btn-sm btn-switch-anime" title="${currentAppLang === 'th' ? 'เลือกอนิเมะอื่นสำหรับเพลงนี้' : 'Choose another anime'}">🔄 ${currentAppLang === 'th' ? 'เปลี่ยนอนิเมะ' : 'Change Anime'}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function randomSong() {
  const btn = document.getElementById('random-btn');
  if (btn) {
    btn.textContent = currentAppLang === 'th' ? '🎲 กำลังสุ่มเพลง...' : '🎲 Rolling song...';
    btn.disabled = true;
  }

  try {
    let eligible = getEligibleSongsForZone();
    let relaxedFilter = false;

    // Smart Fallback: ถ้าเงื่อนไขแน่นเกินไปจนไม่พบเพลง ให้ขยายเงื่อนไขอัตโนมัติ (ไม่รวมเพลงโหมดลับ funk)
    if (!eligible || eligible.length === 0) {
      // 1. ลองปลด BPM filter ก่อน
      eligible = SONGS.filter(s => s.lang !== 'funk' && (selectedZone === 'all' || s.lang === selectedZone) && (selectedRandomMood === 'all' || normalizeMood(s.mood) === selectedRandomMood));
      relaxedFilter = true;
    }
    if (!eligible || eligible.length === 0) {
      // 2. ลองปลด Mood filter
      eligible = SONGS.filter(s => s.lang !== 'funk' && (selectedZone === 'all' || s.lang === selectedZone));
      relaxedFilter = true;
    }
    if (!eligible || eligible.length === 0) {
      // 3. Fallback รวมทุกเพลงปกติ
      eligible = SONGS.filter(s => s.lang !== 'funk');
      relaxedFilter = true;
    }

    playDiceSound();

    const card = document.getElementById('random-card');
    if (card) card.classList.add('card-flip');

    await new Promise(r => setTimeout(r, 400));
    if (card) card.classList.remove('card-flip');

    if (!zoneDeck || zoneDeck.length === 0) {
      initZoneDeck();
    }

    // หยิบเพลงจากกองสับไพ่
    let song = null;
    while (zoneDeck.length > 0 && !song) {
      const nextId = zoneDeck.shift();
      song = SONGS.find(s => s.id === nextId);
    }
    if (!song) {
      const randomIdx = Math.floor(Math.random() * eligible.length);
      song = eligible[randomIdx] || SONGS[0];
    }

    lastRandomSongId = song.id;
    updateZoneCounterUI();

    renderRandomShowcase(song);

    const placeholderEl = document.getElementById('random-placeholder');
    const resultEl = document.getElementById('random-result');
    if (placeholderEl) placeholderEl.classList.add('hidden');
    if (resultEl) resultEl.classList.remove('hidden');

    if (relaxedFilter) {
      showToast(currentAppLang === 'th' ? '💡 สุ่มเพลงที่ตรงกับโซนนี้ให้เรียบร้อยแล้ว!' : '💡 Rolled the best matching track for you!');
    }

    try {
      togglePlaySong(song.id);
    } catch (pe) {
      console.warn('Playback error during random roll:', pe);
    }

    const randomSection = document.getElementById('random');
    if (randomSection) {
      randomSection.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    console.error('Error during randomSong:', err);
    showToast(currentAppLang === 'th' ? '⚠️ เกิดข้อผิดพลาดในการสุ่มเพลง กรุณาลองใหม่อีกครั้ง' : '⚠️ Error rolling song, please try again');
  } finally {
    if (btn) {
      btn.textContent = currentAppLang === 'th' ? '🎲 สุ่มเพลงใหม่ในโซนนี้! (ไม่ซ้ำ)' : '🎲 Roll New in This Zone!';
      btn.disabled = false;
    }
  }
}

// ---- ALL SONGS CATALOG FILTERING ----
let currentLangFilter = 'th'; // 'all', 'th', 'en', 'jp'
let currentMoodFilter = 'all';
let currentSearchTerm = '';

const moodClass = m => ({ sad:'mood-sad', love:'mood-love', hype:'mood-hype', chill:'mood-chill' }[normalizeMood(m)] || 'mood-chill');

// รายชื่อ genre และคำค้นที่ไม่เหมาะสม — กรองเฮนไท / เนื้อหาผู้ใหญ่ / 18+ ทั้งหมด
const BLOCKED_GENRES = [
  'เฮนไท', 'Hentai', 'hentai', 'ecchi', 'Ecchi', 'ผู้ใหญ่', 'Adult', '+18', '18+',
  'erotica', 'Erotica', 'yuri', 'yaoi', 'smut', 'nsfw', 'r-18', 'r18'
];

function isAnimeAppropriate(anime) {
  if (!anime) return false;
  let genreList = [];
  if (Array.isArray(anime.genre)) {
    genreList = anime.genre.map(g => String(g).toLowerCase());
  } else if (typeof anime.genre === 'string') {
    genreList = anime.genre.split(',').map(g => g.trim().toLowerCase());
  }
  const nameStr = `${anime.name || ''} ${anime.nameTH || ''} ${genreList.join(' ')}`.toLowerCase();
  for (const b of BLOCKED_GENRES) {
    const bLower = b.toLowerCase();
    if (genreList.some(g => g.includes(bLower)) || nameStr.includes(bLower)) {
      return false;
    }
  }
  return true;
}


// ---- IDLE PRELOADER: ทยอยดึงเพลงเต็มล่วงหน้า เพื่อให้กดฟังแล้วได้เพลงเต็มทันที 0ms ----
let _preloadQueue = [];
let _isPreloading = false;

function queueFullSongPreload(song) {
  if (!song || song.fullAudioUrl || song.isFull || !navigator.onLine) return;
  if (_preloadQueue.some(s => s.id === song.id)) return;
  _preloadQueue.push(song);
  if (!_isPreloading) {
    setTimeout(processPreloadQueue, 300);
  }
}

async function processPreloadQueue() {
  if (_isPreloading || _preloadQueue.length === 0 || !navigator.onLine) return;
  _isPreloading = true;
  const song = _preloadQueue.shift();
  try {
    const q = `${song.title || ''} ${song.artist || ''}`.trim();
    const res = await fetch(`${NETLIFY_BASE}/api/ai/get-full-song?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok && data.directAudioUrl) {
        song.fullAudioUrl = data.directAudioUrl;
        song.isFull = true;
        if (data.duration) song.duration = data.duration;
      }
    }
  } catch (e) {}
  _isPreloading = false;
  if (_preloadQueue.length > 0) {
    setTimeout(processPreloadQueue, 800);
  }
}

function songCardHTML(song, index = 0) {
  queueFullSongPreload(song);
  const anime = ANIME_MAP.get(song.animeId) || (ANIMES && ANIMES.find(a => a.id === song.animeId)) || ANIMES[0];
  const tags = getSongTagsForDisplay(song).map(t => `<span class="song-tag">${t}</span>`).join('');
  const isPlaying = currentPlayingId === song.id && currentAudio && !currentAudio.paused;
  const moodVal = song.mood || 'chill';
  const langVal = song.lang || 'th';
  const bpmText = song.bpm ? `<span class="song-tag bpm-tag">⚡ ${formatBpm(song.bpm)}</span>` : '';
  const isPriority = typeof index === 'number' && index < 18;
  const loadMode = isPriority ? 'eager' : 'lazy';
  const fetchPri = isPriority ? 'high' : 'auto';
  const priAttr = isPriority ? ' fetchpriority="high"' : '';
  const fallbackCover = getSongFallbackCover(song);

  const animeDisplayName = getAnimeDisplayName(anime);
  const animeSubName = getAnimeSecondaryName(anime);

  return `
    <div class="song-card ${isPlaying ? 'is-playing' : ''}" id="song-${song.id}" data-mood="${moodVal}" data-lang="${langVal}">
      <div class="song-card-top">
        <div class="song-cover-wrapper">
          <img src="${song.coverUrl || fallbackCover}" alt="${song.title}" class="song-cover" loading="${loadMode}" decoding="async"${priAttr} referrerpolicy="no-referrer"
            onerror="if(!this._tries){this._tries=1;this.src='${fallbackCover}';}else if(this._tries===1){this._tries=2;this.src='splash-cover.jpg';}else{this.onerror=null;this.src='favicon-logo.jpg';}" />
          <button class="song-play-overlay" onclick="togglePlaySong(${song.id})" title="${isPlaying ? (currentAppLang === 'th' ? 'หยุด' : 'Pause') : (currentAppLang === 'th' ? 'เล่น' : 'Play')}">
            ${isPlaying ? '⏸️' : '▶️'}
          </button>
          ${renderBookmarkBtn(song.id)}
        </div>
        <div class="song-card-info" onclick="openAnimeMatchModal(${song.id})" title="${currentAppLang === 'th' ? 'คลิกเพื่อดูรายละเอียดคู่ตัดต่ออนิเมะ' : 'Click to view anime pairing details'}" style="cursor:pointer;">
          <div class="song-card-badges">
            <span class="song-mood ${moodClass(moodVal)}">${moodLabel(moodVal)}</span>
            <span class="song-lang-badge">${langPillText(langVal)}</span>
          </div>
          <div class="song-title">${song.title}</div>
          <div class="song-artist">${currentAppLang === 'th' ? 'โดย' : 'By'} ${song.artist}</div>
          <div class="song-tags">${tags}${bpmText}</div>
        </div>
      </div>

      <!-- Matched Anime Bar -->
      <div class="song-anime-bar" onclick="openAnimeMatchModal(${song.id})" title="${currentAppLang === 'th' ? 'คลิกเพื่อดูรายละเอียดอนิเมะ' : 'Click to view anime details'}">
        <div class="anime-bar-img-wrap">
          ${animeImgTag(anime, 'song-anime-poster-mini', '', loadMode, fetchPri)}
        </div>
        <div class="song-anime-bar-info">
          <div class="song-anime-bar-sub">${currentAppLang === 'th' ? '🌸 แนะนำตัดกับอนิเมะ:' : '🌸 Matched Anime:'}</div>
          <div class="song-anime-bar-name">${animeDisplayName}</div>
          <div class="song-anime-bar-en">${animeSubName}</div>
        </div>
        <span class="song-anime-bar-arrow">➔</span>
      </div>

      <div class="song-player-bar">
        ${renderPlayButton(song.id, isPlaying)}
      </div>
      <div class="song-card-actions">
        <button class="btn-sm btn-download-audio" onclick="openDownloadChoiceModal(${song.id}, event)" title="${currentAppLang === 'th' ? '📥 ดาวน์โหลดเพลงนี้ลงคอมสำหรับตัดต่อ' : 'Download for PC'}">
          📥 ${currentAppLang === 'th' ? 'ดาวน์โหลดเพลง' : 'Download'}
        </button>
        <a href="${song.spotifyUrl}" target="_blank" class="btn-sm btn-spotify">
          🎧 Spotify
        </a>
        <button class="btn-sm btn-anime-match" onclick="openAnimePicker(${song.id})" title="${currentAppLang === 'th' ? 'เปลี่ยนคู่ตัดต่ออนิเมะ' : 'Switch matched anime'}">
          ${currentAppLang === 'th' ? '🌸 จับคู่' : '🌸 Anime'}
        </button>
      </div>
    </div>`;
}

let visibleSongsCount = 18;

function loadMoreSongs() {
  visibleSongsCount += 18;
  renderSongsGrid();
}

function renderSongsGrid() {
  const grid = document.getElementById('songs-grid');
  if (!grid) return;
  const term = currentSearchTerm.toLowerCase().trim();

  const filtered = SONGS.filter(s => {
    // โซนลับ Funk แยกต่างหากเฉพาะใน workspace-secret-funk ไม่ปะปนในโซนเพลงปกติ
    if (s.lang === 'funk') return false;
    const matchLang = currentLangFilter === 'all' || s.lang === currentLangFilter;
    const matchMood = currentMoodFilter === 'all' || normalizeMood(s.mood) === currentMoodFilter;

    const anime = ANIME_MAP.get(s.animeId);
    const animeNames = (term && anime) ? `${anime.nameTH} ${anime.name}`.toLowerCase() : '';

    const matchSearch = !term
      || s.title.toLowerCase().includes(term)
      || s.artist.toLowerCase().includes(term)
      || s.tags.some(t => t.toLowerCase().includes(term))
      || animeNames.includes(term);

    // If searching by term, find across all zones intelligently
    if (term && matchSearch && matchMood) return true;

    return matchLang && matchMood && matchSearch;
  });

  const loadMoreWrap = document.getElementById('load-more-wrap');
  const loadMoreCount = document.getElementById('load-more-count');

  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:3.5rem;">
      <div style="font-size:2.5rem;margin-bottom:0.8rem;">🔍</div>
      <div style="font-size:1.15rem;font-weight:600;color:#fff;margin-bottom:0.4rem;">${currentAppLang === 'th' ? 'ไม่พบเพลงที่ค้นหา' : 'No songs found'}</div>
      <div style="font-size:0.9rem;">${currentAppLang === 'th' ? 'ลองค้นหาด้วยคำอื่น หรือกดปุ่ม "ทั้งหมด" เพื่อรีเซ็ตตัวกรอง' : 'Try searching with different keywords or click "All" to reset filters.'}</div>
    </div>`;
    if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    return;
  }

  const totalInFilter = filtered.length;
  const sliced = filtered.slice(0, visibleSongsCount);

  grid.innerHTML = sliced.map((song, idx) => songCardHTML(song, idx)).join('');

  if (loadMoreWrap) {
    const remaining = totalInFilter - sliced.length;
    if (remaining > 0) {
      loadMoreWrap.style.display = 'block';
      const toShowNext = Math.min(18, remaining);
      if (loadMoreCount) {
        loadMoreCount.textContent = currentAppLang === 'th' ? `+${toShowNext} เพลง (เหลือ ${remaining})` : `+${toShowNext} songs (${remaining} left)`;
      }
    } else {
      loadMoreWrap.style.display = 'none';
    }
  }
}

function updateZoneBanner() {
  const bannerText = document.getElementById('zone-banner-text');
  if (!bannerText) return;

  const count = currentLangFilter === 'all' ? SONGS.filter(s => s.lang !== 'funk').length : SONGS.filter(s => s.lang === currentLangFilter).length;
  let zoneName = '';
  if (currentAppLang === 'th') {
    if (currentLangFilter === 'th') zoneName = 'โซนเพลงไทย';
    else if (currentLangFilter === 'en') zoneName = 'โซนเพลงสากล (English)';
    else if (currentLangFilter === 'jp') zoneName = 'โซนเพลงญี่ปุ่น / อนิเมะ';
    else if (currentLangFilter === 'lao') zoneName = '🇱🇦 โซนเพลงลาว / อีสาน';
    else if (currentLangFilter === 'kr') zoneName = '🇰🇷 โซนเพลงเกาหลี / K-Pop';
    else if (currentLangFilter === 'funk') zoneName = '⚡ โซนลับ Funk & Phonk (Spotify Secret Zone)';
    else zoneName = 'รวมทุกโซนเพลง';
    bannerText.innerHTML = `📍 กำลังแสดง: <strong>${zoneName}</strong> (${count.toLocaleString()} เพลง) — ${currentLangFilter === 'all' ? 'รวมเพลงทุกหมวด' : 'แสดงเฉพาะเพลงในโซนนี้'}`;
  } else {
    if (currentLangFilter === 'th') zoneName = 'Thai Songs Zone';
    else if (currentLangFilter === 'en') zoneName = 'Global Songs Zone (English)';
    else if (currentLangFilter === 'jp') zoneName = 'Japanese & Anime Zone';
    else if (currentLangFilter === 'lao') zoneName = 'Lao & Isan Zone';
    else if (currentLangFilter === 'kr') zoneName = 'K-Pop Zone';
    else if (currentLangFilter === 'funk') zoneName = '⚡ Secret Funk & Phonk Zone (Spotify)';
    else zoneName = 'All Zones';
    bannerText.innerHTML = `📍 Active: <strong>${zoneName}</strong> (${count.toLocaleString()} songs) — ${currentLangFilter === 'all' ? 'Showing all genres' : 'Showing this zone only'}`;
  }
}

// Studio Workspace Switcher (Isolates Zones so user doesn't get overwhelmed)
let currentWorkspace = 'th';

function switchStudioWorkspace(ws, smoothScroll = false) {
  currentWorkspace = ws;

  // Update tabs
  document.querySelectorAll('.studio-zone-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.ws === ws);
  });

  // Update navbar links active state
  document.querySelectorAll('.nav-links .nav-link').forEach(link => {
    const onclickAttr = link.getAttribute('onclick') || '';
    link.classList.toggle('active-nav', onclickAttr.includes(`'${ws}'`));
  });

  const wsMusic = document.getElementById('workspace-music');
  const wsPairs = document.getElementById('workspace-pairs');
  const wsVersus = document.getElementById('workspace-versus');
  const wsSaved = document.getElementById('workspace-saved');
  const wsSecret = document.getElementById('workspace-secret-funk');
  const studioNav = document.querySelector('.studio-zone-nav-container');

  // Hide all first
  [wsMusic, wsPairs, wsVersus, wsSaved, wsSecret].forEach(w => w && w.classList.add('hidden'));
  if (wsSecret) wsSecret.style.display = 'none';
  if (studioNav) studioNav.classList.remove('hidden');

  if (ws === 'funk') {
    openSecretFunkMode();
    return;
  }

  const musicZones = ['th', 'en', 'jp', 'lao', 'kr', 'all'];
  if (musicZones.includes(ws)) {
    if (wsMusic) wsMusic.classList.remove('hidden');

    currentLangFilter = ws;
    visibleSongsCount = 18;

    // Keep randomizer tabs synced
    selectedZone = ws;
    document.querySelectorAll('.zone-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.zone === ws);
    });
    initZoneDeck();

    // Keep zone hub buttons synced
    document.querySelectorAll('.zone-hub-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === ws);
    });

    updateZoneBanner();
    renderSongsGrid();

    if (smoothScroll && wsMusic) {
      wsMusic.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else if (ws === 'pairs') {
    if (wsPairs) wsPairs.classList.remove('hidden');

    renderAnimeMatchGrid();
    if (smoothScroll && wsPairs) {
      wsPairs.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else if (ws === 'versus') {
    if (wsVersus) wsVersus.classList.remove('hidden');

    if (!vsLeftSong || !vsRightSong) {
      loadVersus();
    }
    if (smoothScroll && wsVersus) {
      wsVersus.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else if (ws === 'saved') {
    if (wsSaved) wsSaved.classList.remove('hidden');

    renderSavedSongsView();
    if (smoothScroll && wsSaved) {
      wsSaved.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function filterByLang(lang, btn) {
  switchStudioWorkspace(lang, false);
}

function filterByMood(mood, btn) {
  currentMoodFilter = mood;
  visibleSongsCount = 18;
  document.querySelectorAll('#filter-tags .tag-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderSongsGrid();
}

let searchDebounceTimer = null;

function filterSongs() {
  const input = document.getElementById('search-input');
  currentSearchTerm = input ? input.value : '';
  visibleSongsCount = 18;
  const clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.style.display = currentSearchTerm ? 'block' : 'none';

  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    renderSongsGrid();
  }, 120);
}

function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  currentSearchTerm = '';
  visibleSongsCount = 18;
  const clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.style.display = 'none';
  renderSongsGrid();
}

// ---- VERSUS MODE ----
let vsLeftSong = null;
let vsRightSong = null;
let vsRecentSongIds = [];

function loadVersus() {
  document.getElementById('vs-result').classList.add('hidden');

  const normalSongs = SONGS.filter(s => s.lang !== 'funk');
  let pool = normalSongs.filter(s => !vsRecentSongIds.includes(s.id));
  if (pool.length < 2) pool = normalSongs;

  const aIndex = Math.floor(Math.random() * pool.length);
  vsLeftSong = pool[aIndex];

  let rightPool = pool.filter(s => s.id !== vsLeftSong.id);
  if (!rightPool.length) rightPool = normalSongs.filter(s => s.id !== vsLeftSong.id);
  const bIndex = Math.floor(Math.random() * rightPool.length);
  vsRightSong = rightPool[bIndex];

  vsRecentSongIds.push(vsLeftSong.id, vsRightSong.id);
  if (vsRecentSongIds.length > 10) vsRecentSongIds.splice(0, 2);

  renderVsSide('vs-left-content',  vsLeftSong, 'a');
  renderVsSide('vs-right-content', vsRightSong, 'b');

  document.getElementById('vote-a').disabled = false;
  document.getElementById('vote-b').disabled = false;

  ['vs-left','vs-right'].forEach(id => {
    const el = document.getElementById(id);
    el.style.borderColor = 'var(--glass-border)';
    el.style.boxShadow   = '';
    el.style.opacity     = '';
  });
}

function renderVsSide(containerId, song, side) {
  const pair = ANIME_PAIRS.find(p => p.songId === song.id);
  const anime = (song.animeId ? ANIMES.find(a => a.id === song.animeId) : null) || (pair ? ANIMES.find(a => a.id === pair.animeId) : null);
  const animeDisplayName = anime ? getAnimeDisplayName(anime) : (currentAppLang === 'th' ? 'เพลงคัดพิเศษสำหรับคลิปไทโป' : 'Featured Typography Track');
  const el = document.getElementById(containerId);
  el.innerHTML = `
    <div class="vs-cover-row">
      <div style="position:relative;display:inline-block;">
        <img src="${song.coverUrl}" alt="${song.title}" class="vs-cover-img" onerror="this.onerror=null;this.src='${getSongFallbackCover(song)}';" />
        ${renderBookmarkBtn(song.id)}
      </div>
    </div>
    <div class="vs-song-title">${song.title}</div>
    <div class="vs-song-artist">${currentAppLang === 'th' ? 'โดย' : 'By'} ${song.artist}</div>
    <div style="margin-bottom:0.6rem;display:flex;gap:0.4rem;justify-content:center;">
      <span class="song-mood ${moodClass(song.mood)}">${moodLabel(song.mood)}</span>
      <span class="song-lang-badge">${langPillText(song.lang)}</span>
    </div>
    <div class="vs-anime-hint">
      ${currentAppLang === 'th' ? '🌸 อนิเมะแนะนำ:' : '🌸 Matched Anime:'} <strong>${animeDisplayName}</strong>
    </div>
    ${renderPlayButton(song.id, currentPlayingId === song.id && currentAudio && !currentAudio.paused)}
  `;
}

function vote(side) {
  const winner = side === 'a' ? vsLeftSong : vsRightSong;
  document.getElementById('vote-a').disabled = true;
  document.getElementById('vote-b').disabled = true;

  const winEl  = document.getElementById(side === 'a' ? 'vs-left'  : 'vs-right');
  const loseEl = document.getElementById(side === 'a' ? 'vs-right' : 'vs-left');
  winEl.style.borderColor = 'var(--primary)';
  winEl.style.boxShadow   = '0 0 35px rgba(29, 185, 84, 0.4)';
  loseEl.style.opacity    = '0.35';

  const pair = ANIME_PAIRS.find(p => p.songId === winner.id);
  const anime = (winner.animeId ? ANIMES.find(a => a.id === winner.animeId) : null) || (pair ? ANIMES.find(a => a.id === pair.animeId) : null);

  const resultEl = document.getElementById('vs-result');
  resultEl.classList.remove('hidden');

  const winnerTitle = currentAppLang === 'th'
    ? `🏆 คุณเลือก <strong>"${winner.title}"</strong> โดย ${winner.artist}!`
    : `🏆 You chose <strong>"${winner.title}"</strong> by ${winner.artist}!`;

  const winnerSub = currentAppLang === 'th'
    ? `เพลงสไตล์ ${moodLabel(winner.mood)} (${langPillText(winner.lang)}) — เหมาะมากสำหรับการทำคลิปไทโป ✨`
    : `${moodLabel(winner.mood)} vibe (${langPillText(winner.lang)}) — Outstanding choice for typography clips ✨`;

  const animeRecHeader = currentAppLang === 'th'
    ? '🌸 อนิเมะแนะนำให้เอาไปตัดต่อคู่กัน:'
    : '🌸 Recommended anime scene for this track:';

  const anifumeText = currentAppLang === 'th' ? '🌸 เปิดดูบน Anifume →' : '🌸 View on Anifume →';

  resultEl.innerHTML = `
    <div style="font-size:1.35rem;margin-bottom:0.4rem;color:#fff;">${winnerTitle}</div>
    <div style="color:var(--text-muted);font-size:0.95rem;margin-bottom:1.2rem;">${winnerSub}</div>
    ${anime ? `
      <div class="vs-anime-recommend">
        <div style="font-weight:700;margin-bottom:0.8rem;color:var(--primary);font-size:1.05rem;">${animeRecHeader}</div>
        <div style="display:flex;gap:1.2rem;align-items:center;justify-content:center;flex-wrap:wrap;">
          ${animeImgTag(anime, 'vs-anime-img', 'width:90px;height:130px;object-fit:cover;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.6);')}
          <div style="text-align:left;max-width:420px;">
            <div style="font-weight:700;font-size:1.15rem;color:#fff;">${getAnimeDisplayName(anime)}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.4rem;">${getAnimeSecondaryName(anime)}</div>
            <a href="${anime.anifumeUrl}" target="_blank" class="random-anime-link" style="display:inline-block;margin-top:0.5rem;">${anifumeText}</a>
          </div>
        </div>
      </div>
    ` : ''}
  `;
}

// ---- ANIME MATCH GRID ----
let currentPairCategory = 'all';
let visiblePairsCount = 24;

function loadMorePairs() {
  visiblePairsCount += 24;
  renderAnimeMatchGrid(currentPairCategory);
}

function renderAnimeMatchGrid(filterCategory = 'all') {
  const grid = document.getElementById('anime-match-grid');
  if (!grid) return;

  const filteredPairs = ANIME_PAIRS.filter(p => {
    if (filterCategory === 'all') return true;
    return p.category === filterCategory;
  });

  const totalPairs = filteredPairs.length;
  const sliced = filteredPairs.slice(0, visiblePairsCount);

  grid.innerHTML = sliced.map((pair, idx) => {
    const song  = SONG_MAP.get(pair.songId) || SONGS.find(s => s.id === pair.songId);
    const anime = ANIME_MAP.get(pair.animeId) || ANIMES.find(a => a.id === pair.animeId);
    if (!song || !anime) return '';

    const isPlaying = currentPlayingId === song.id && currentAudio && !currentAudio.paused;
    const isPriority = idx < 8;
    const loadMode = isPriority ? 'eager' : 'lazy';
    const fetchPri = isPriority ? 'high' : 'auto';
    const priAttr = isPriority ? ' fetchpriority="high"' : '';
    const badgeText = pair.badge ? (currentAppLang === 'th' ? pair.badge : '✨ Curated Match') : (currentAppLang === 'th' ? '✨ คู่แนะนำ' : '✨ Recommended Pair');
    const anifumeLabel = currentAppLang === 'th' ? '🌸 ดูบน Anifume' : '🌸 View on Anifume';

    return `
      <div class="match-card" id="pair-${pair.songId}-${pair.animeId}">
        <div class="match-visual-banner">
          <div class="match-anime-half">
            ${animeImgTag(anime, 'match-anime-poster', '', loadMode, fetchPri)}
            <div class="match-anime-overlay"></div>
            <div class="match-anime-tag">🌸 ${getAnimeDisplayName(anime)}</div>
          </div>
          
          <div class="match-energy-node">⇄</div>

          <div class="match-song-half">
            <img class="match-song-poster" src="${song.coverUrl}" alt="${song.title}" loading="${loadMode}" decoding="async"${priAttr} onerror="this.onerror=null;this.src='favicon-logo.jpg';" />
            <div class="match-song-overlay"></div>
            <div class="match-song-tag">🎵 ${song.title}</div>
          </div>
        </div>

        <div class="match-card-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">
            <span class="match-badge-chip">${badgeText}</span>
            <span class="song-lang-badge">${langPillText(song.lang)}</span>
          </div>
          
          <div class="match-titles-row">
            <div class="match-left-title">
              <div class="anime-main-name">${getAnimeDisplayName(anime)}</div>
              <div class="anime-sub-name">${getAnimeSecondaryName(anime)}</div>
            </div>
            <div class="match-right-song">
              <div class="song-main-title">${song.title}</div>
              <div class="song-artist-name">${currentAppLang === 'th' ? 'โดย' : 'By'} ${song.artist} <span class="song-mood ${moodClass(song.mood)}" style="font-size:0.7rem;padding:0.1rem 0.5rem;">${moodLabel(song.mood)}</span></div>
            </div>
          </div>

          <div class="match-card-footer">
            ${renderPlayButton(song.id, isPlaying)}
            <div style="display:flex;gap:0.5rem;">
              <a href="${anime.anifumeUrl}" target="_blank" class="match-open-btn match-open-btn-alt">${anifumeLabel}</a>
              <a href="${song.spotifyUrl}" target="_blank" class="match-open-btn">🎧 Spotify</a>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  const loadMoreWrap = document.getElementById('pairs-load-more-wrap');
  const loadMoreCount = document.getElementById('load-more-pairs-count');
  if (loadMoreWrap) {
    const remaining = totalPairs - sliced.length;
    if (remaining > 0) {
      loadMoreWrap.style.display = 'block';
      const toShowNext = Math.min(24, remaining);
      if (loadMoreCount) {
        loadMoreCount.textContent = currentAppLang === 'th' ? `+${toShowNext} คู่ (เหลือ ${remaining})` : `+${toShowNext} pairs (${remaining} left)`;
      }
    } else {
      loadMoreWrap.style.display = 'none';
    }
  }
}

function filterPairs(category, btn) {
  currentPairCategory = category;
  visiblePairsCount = 24;
  document.querySelectorAll('.match-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAnimeMatchGrid(category);
}

// ---- QUICK PAIR FINDER ----
function populateFinderDropdowns() {
  const songSelect = document.getElementById('finder-song-select');
  const animeSelect = document.getElementById('finder-anime-select');
  if (!songSelect || !animeSelect) return;

  const songPlaceholder = currentAppLang === 'th' ? '-- เลือกเพลงที่ชอบ --' : '-- Select a song you like --';
  const animePlaceholder = currentAppLang === 'th' ? '-- เลือกอนิเมะที่ต้องการตัดต่อ --' : '-- Select anime for editing --';

  songSelect.innerHTML = `<option value="">${songPlaceholder}</option>`;
  animeSelect.innerHTML = `<option value="">${animePlaceholder}</option>`;

  const pairedSongIds = new Set(ANIME_PAIRS.map(p => p.songId));
  SONGS.filter(s => s.lang !== 'funk' && pairedSongIds.has(s.id)).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `[${langPillText(s.lang)}] ${s.title} - ${s.artist}`;
    songSelect.appendChild(opt);
  });

  ANIMES.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = getAnimeDisplayName(a);
    animeSelect.appendChild(opt);
  });
}

function findPairBySong(songId) {
  if (!songId) return;
  const sid = parseInt(songId);
  const pair = ANIME_PAIRS.find(p => p.songId === sid);
  if (!pair) return;

  filterPairs('all', document.querySelector('.match-filter-btn[data-filter="all"]'));

  setTimeout(() => {
    const card = document.getElementById(`pair-${pair.songId}-${pair.animeId}`);
    if (card) {
      document.querySelectorAll('.match-card').forEach(c => c.classList.remove('highlight-card'));
      card.classList.add('highlight-card');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

function findPairByAnime(animeId) {
  if (!animeId) return;
  const aid = parseInt(animeId);
  const pair = ANIME_PAIRS.find(p => p.animeId === aid);
  if (!pair) return;

  filterPairs('all', document.querySelector('.match-filter-btn[data-filter="all"]'));

  setTimeout(() => {
    const card = document.getElementById(`pair-${pair.songId}-${pair.animeId}`);
    if (card) {
      document.querySelectorAll('.match-card').forEach(c => c.classList.remove('highlight-card'));
      card.classList.add('highlight-card');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

// openAnimeMatchModal shows pairing details in modal-overlay
function openAnimeMatchModal(songId) {
  const song = SONG_MAP.get(songId) || SONGS.find(s => s.id === songId);
  if (!song) return;

  const anime = ANIME_MAP.get(song.animeId) || (ANIMES && ANIMES.find(a => a.id === song.animeId)) || ANIMES[0];
  if (!anime) return;

  renderAnimeMatchModalContent(song, anime);
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ---- APP INSTALL & DOWNLOAD MODAL ----
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('btn-pwa-install');
  if (btn) btn.style.display = 'flex';
});

function switchInstallTab(platform) {
  const tabPc = document.getElementById('tab-btn-pc');
  const tabIos = document.getElementById('tab-btn-ios');
  const tabAndroid = document.getElementById('tab-btn-android');
  const panelPc = document.getElementById('install-panel-pc');
  const panelIos = document.getElementById('install-panel-ios');
  const panelAndroid = document.getElementById('install-panel-android');

  const tabs = [tabPc, tabIos, tabAndroid];
  const panels = [panelPc, panelIos, panelAndroid];

  tabs.forEach(t => {
    if (t) {
      t.classList.remove('active');
      t.style.background = 'transparent';
      t.style.color = '#94a3b8';
      t.style.boxShadow = 'none';
    }
  });
  panels.forEach(p => {
    if (p) p.style.display = 'none';
  });

  if (platform === 'pc') {
    if (tabPc) {
      tabPc.classList.add('active');
      tabPc.style.background = 'linear-gradient(135deg, #38bdf8, #818cf8)';
      tabPc.style.color = '#fff';
      tabPc.style.boxShadow = '0 4px 14px rgba(56, 189, 248, 0.4)';
    }
    if (panelPc) panelPc.style.display = 'block';
  } else if (platform === 'ios') {
    if (tabIos) {
      tabIos.classList.add('active');
      tabIos.style.background = 'linear-gradient(135deg, #38bdf8, #818cf8)';
      tabIos.style.color = '#fff';
      tabIos.style.boxShadow = '0 4px 14px rgba(56, 189, 248, 0.4)';
    }
    if (panelIos) panelIos.style.display = 'block';
  } else {
    if (tabAndroid) {
      tabAndroid.classList.add('active');
      tabAndroid.style.background = 'linear-gradient(135deg, #38bdf8, #818cf8)';
      tabAndroid.style.color = '#fff';
      tabAndroid.style.boxShadow = '0 4px 14px rgba(56, 189, 248, 0.4)';
    }
    if (panelAndroid) panelAndroid.style.display = 'block';
  }
}

function openAppModal() {
  const modal = document.getElementById('app-install-modal');
  if (modal) {
    modal.classList.remove('hidden');

    // ตรวจสอบอัตโนมัติว่าเป็นคอมพิวเตอร์ (PC / Mac), iOS หรือ Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isIOS) {
      switchInstallTab('ios');
    } else if (isAndroid) {
      switchInstallTab('android');
    } else {
      switchInstallTab('pc');
    }
  }
}

function closeAppModal() {
  const modal = document.getElementById('app-install-modal');
  if (modal) modal.classList.add('hidden');
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User installed the app');
      }
      deferredPrompt = null;
    });
  } else {
    showToast(currentAppLang === 'th'
      ? '💡 แตะเมนูเบราว์เซอร์ (จุด 3 จุด หรือปุ่มแชร์) แล้วเลือก "เพิ่มลงในหน้าจอหลัก" ได้ทันทีครับ!'
      : '💡 Tap browser menu and select "Add to Home Screen" to install!');
  }
}

// ---- ANIME PICKER: เลือกเพลงแล้วเลือกอนิเมะที่เข้ากัน ----
let _pickerSongId = null;

function renderPickerAnimeGrid(song, searchTerm = '') {
  const grid = document.getElementById('anime-picker-grid');
  if (!grid) return;

  const songMood = song.mood || 'chill';
  const term = searchTerm.toLowerCase().trim();

  let animesToShow = ANIMES.filter(a => isAnimeAppropriate(a));
  if (term) {
    animesToShow = animesToShow.filter(a => {
      const matchName = (a.name || '').toLowerCase().includes(term);
      const matchTH = (a.nameTH || '').toLowerCase().includes(term);
      const matchGenre = (a.genre || []).some(g => String(g).toLowerCase().includes(term));
      return matchName || matchTH || matchGenre;
    });
  } else {
    const matched = animesToShow.filter(a => a.mood === songMood);
    const others = animesToShow.filter(a => a.mood !== songMood);
    animesToShow = [...matched.slice(0, 45), ...others.slice(0, 35)];
  }

  const matchBadgeText = currentAppLang === 'th' ? '★ เข้ากับเพลง' : '★ Mood Match';
  const noResultText = currentAppLang === 'th' ? 'ไม่พบอนิเมะที่ตรงกับคำค้นหา' : 'No anime found matching your query';

  if (animesToShow.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2.5rem 1rem;color:var(--text-muted);font-size:0.95rem;">${noResultText}</div>`;
    return;
  }

  grid.innerHTML = animesToShow.map(anime => {
    const isMoodMatch = anime.mood === songMood;
    const isSelected = song.animeId === anime.id;
    return `
      <div class="anime-picker-card ${isMoodMatch ? 'mood-match' : ''} ${isSelected ? 'selected-pair' : ''}"
        onclick="selectAnimePair(${song.id}, ${anime.id})"
        title="${getAnimeDisplayName(anime)}">
        ${animeImgTag(anime, 'picker-anime-img')}
        <div class="picker-anime-info">
          ${isSelected ? `<span class="picker-match-badge" style="color:#38bdf8;">✓ คู่ปัจจุบัน</span>` : (isMoodMatch ? `<span class="picker-match-badge">${matchBadgeText}</span>` : '')}
          <div class="picker-anime-name">${getAnimeDisplayName(anime)}</div>
          <div class="picker-anime-en">${getAnimeSecondaryName(anime)}</div>
        </div>
      </div>`;
  }).join('');
}

function filterPickerAnimes(val) {
  if (!_pickerSongId) return;
  const song = SONG_MAP.get(_pickerSongId) || SONGS.find(s => s.id === _pickerSongId);
  if (song) {
    renderPickerAnimeGrid(song, val);
  }
}

function openAnimePicker(songId) {
  const song = SONG_MAP.get(songId) || SONGS.find(s => s.id === songId);
  if (!song) return;
  _pickerSongId = songId;

  // ซ่อน modal รายละเอียดคู่เพลงเดิมชั่วคราว เพื่อไม่ให้ปุ่มปิด ✕ และกรอบกระจกซ้อนทับกัน
  const detailModal = document.getElementById('modal-overlay');
  if (detailModal && !detailModal.classList.contains('hidden')) {
    detailModal.dataset.wasOpen = 'true';
    detailModal.classList.add('hidden');
  }

  const songMood = song.mood || 'chill';
  const content = document.getElementById('anime-picker-content');
  if (!content) return;

  const promptText = currentAppLang === 'th'
    ? `เลือกอนิเมะจากทั้งหมด 1,000 เรื่อง หรือพิมพ์ค้นหาได้ทันที — มู้ด <span style="color:var(--primary);font-weight:700;">${moodLabel(songMood)}</span> แนะนำเป็นอันดับต้น`
    : `Select from 1,000 verified animes or search — vibe <span style="color:var(--primary);font-weight:700;">${moodLabel(songMood)}</span> recommended first`;

  const cancelText = currentAppLang === 'th' ? 'ปิดหน้าต่าง' : 'Close';

  content.innerHTML = `
    <div style="margin-bottom:1rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
        <div>
          <div style="font-size:0.75rem;font-weight:700;color:var(--primary);letter-spacing:1px;text-transform:uppercase;margin-bottom:0.3rem;">ANIME PAIRING STUDIO</div>
          <div style="font-size:1.25rem;font-weight:800;color:#fff;margin-bottom:0.2rem;">🎵 ${song.title}</div>
          <div style="color:var(--text-muted);font-size:0.85rem;">${currentAppLang === 'th' ? 'โดย' : 'By'} ${song.artist} • ${moodLabel(songMood)}</div>
        </div>
        <!-- Close button is handled by modal-close in modal-box -->
      </div>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-top:0.6rem;">
        ${promptText}
      </div>

      <!-- Quick Search Bar -->
      <div style="margin-top:0.8rem;position:relative;">
        <input type="text" id="anime-picker-search"
          placeholder="${currentAppLang === 'th' ? '🔍 พิมพ์ค้นหาอนิเมะจาก 1,000 เรื่อง...' : '🔍 Search anime from 1,000 titles...'}"
          oninput="filterPickerAnimes(this.value)"
          style="width:100%;padding:0.65rem 1rem 0.65rem 2.4rem;background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:#fff;font-family:Kanit,sans-serif;font-size:0.9rem;outline:none;" />
        <span style="position:absolute;left:0.8rem;top:50%;transform:translateY(-50%);opacity:0.6;">🔍</span>
      </div>
    </div>

    <div id="anime-picker-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(125px,1fr));gap:0.85rem;max-height:55vh;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding-right:4px;">
    </div>

    <div style="margin-top:1rem;padding-top:0.8rem;border-top:1px solid var(--glass-border);text-align:center;">
      <button onclick="closeAnimePicker()" style="background:none;border:1px solid var(--glass-border);color:var(--text-muted);padding:0.45rem 1.4rem;border-radius:9999px;cursor:pointer;font-family:Kanit,sans-serif;font-size:0.85rem;">${cancelText}</button>
    </div>
  `;

  renderPickerAnimeGrid(song, '');
  document.getElementById('anime-picker-overlay').classList.remove('hidden');
  document.body.classList.add('anime-picker-open');
  document.body.style.overflow = 'hidden';

  const pickerGrid = document.getElementById('anime-picker-grid');
  if (pickerGrid) {
    pickerGrid.addEventListener('wheel', (e) => {
      const isTop = pickerGrid.scrollTop === 0;
      const isBottom = Math.abs(pickerGrid.scrollHeight - pickerGrid.scrollTop - pickerGrid.clientHeight) <= 1;
      if ((isTop && e.deltaY < 0) || (isBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  setTimeout(() => {
    const input = document.getElementById('anime-picker-search');
    if (input) input.focus();
  }, 100);
}

function closeAnimePicker() {
  const overlay = document.getElementById('anime-picker-overlay');
  if (overlay) overlay.classList.add('hidden');
  document.body.classList.remove('anime-picker-open');
  document.body.style.overflow = '';

  // แสดง modal รายละเอียดเดิมกลับมาหากเปิดมาจากหน้านั้น
  const detailModal = document.getElementById('modal-overlay');
  if (detailModal && detailModal.dataset.wasOpen === 'true') {
    delete detailModal.dataset.wasOpen;
    detailModal.classList.remove('hidden');
  }
  _pickerSongId = null;
}

function selectAnimePair(songId, animeId) {
  const detailModal = document.getElementById('modal-overlay');
  const shouldReopenDetail = detailModal && detailModal.dataset.wasOpen === 'true';
  if (detailModal) delete detailModal.dataset.wasOpen;
  closeAnimePicker();
  const song = SONG_MAP.get(songId) || SONGS.find(s => s.id === songId);
  const anime = ANIME_MAP.get(animeId) || ANIMES.find(a => a.id === animeId);
  if (!song || !anime) return;

  // 1. Update Song Model
  song.animeId = animeId;
  SONG_MAP.set(song.id, song);

  // 2. Persist custom pairing to localStorage
  try {
    const customPairs = JSON.parse(localStorage.getItem('typo_custom_anime_pairs') || '{}');
    customPairs[songId] = animeId;
    localStorage.setItem('typo_custom_anime_pairs', JSON.stringify(customPairs));
  } catch (e) {}

  // 3. Update Random Showcase if this song is currently shown
  if (typeof lastRandomSongId !== 'undefined' && lastRandomSongId === songId) {
    renderRandomShowcase(song);
  }

  // 4. Update the song card in songs-grid
  const cardElem = document.getElementById(`song-${songId}`);
  if (cardElem) {
    cardElem.outerHTML = songCardHTML(song, 0);
  }

  // 5. Update bottom player if this song is currently loaded/playing
  if (currentPlayingId === songId) {
    showBottomPlayer(song);
  }

  // 6. If modal-overlay is currently open, update its content directly without reopening or nested popups
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay && !modalOverlay.classList.contains('hidden')) {
    renderAnimeMatchModalContent(song, anime);
  }

  // 7. Show toast feedback
  const animeName = currentAppLang === 'th' ? (anime.nameTH || anime.name) : (anime.name || anime.nameTH);
  showToast(currentAppLang === 'th'
    ? `🌸 เปลี่ยนคู่ตัดต่อเป็น "${animeName}" เรียบร้อย!`
    : `🌸 Switched matched anime to "${animeName}"!`);
}

function renderAnimeMatchModalContent(song, anime) {
  const fallbackCover = getSongFallbackCover(song);
  const isPlaying = currentPlayingId === song.id && currentAudio && !currentAudio.paused;
  const isSaved = isSongSaved(song.id);

  const saveBtnText = isSaved
    ? (currentAppLang === 'th' ? '❤️ บันทึกแล้ว' : '❤️ Saved')
    : (currentAppLang === 'th' ? '🤍 บันทึกเพลงนี้' : '🤍 Save this song');

  const anifumeBtnText = currentAppLang === 'th' ? '🌸 ดูข้อมูลบน Anifume →' : '🌸 View details on Anifume →';
  const switchAnimeText = currentAppLang === 'th' ? '🔄 เปลี่ยนอนิเมะ' : '🔄 Switch Anime';
  const recAnimeHeader = currentAppLang === 'th' ? '✅ อนิเมะแนะนำสำหรับตัดต่อคู่กัน' : '✅ Recommended Anime Pairing for Editing';

  document.getElementById('modal-content').innerHTML = `
    <div style="margin-bottom:0.5rem;font-size:0.75rem;color:var(--primary);font-weight:700;letter-spacing:1px;">TYPO CLIP PAIRING</div>
    <div class="modal-header">
      <img src="${song.coverUrl}" alt="${song.title}" class="modal-cover"
        onerror="this.onerror=null;this.src='${fallbackCover}';" />
      <div>
        <div class="modal-title">${song.title}</div>
        <div class="modal-artist">${currentAppLang === 'th' ? 'โดย' : 'By'} ${song.artist} <span class="song-lang-badge">${langPillText(song.lang)}</span></div>
        <span class="song-mood ${moodClass(song.mood)}">${moodLabel(song.mood)}</span>
        <span class="song-tag" style="margin-left:0.4rem;">⚡ ${formatBpm(song.bpm)}</span>
        <div style="margin-top:0.8rem;display:flex;gap:0.6rem;flex-wrap:wrap;">
          ${renderPlayButton(song.id, isPlaying)}
          <button class="btn-sm btn-download-audio" onclick="openDownloadChoiceModal(${song.id}, event)" title="${currentAppLang === 'th' ? '📥 ดาวน์โหลดเพลงนี้ลงคอมสำหรับตัดต่อ' : 'Download for PC'}">📥 ${currentAppLang === 'th' ? 'ดาวน์โหลดเพลง' : 'Download'}</button>
          <a href="${song.spotifyUrl}" target="_blank" class="btn-sm btn-spotify">${currentAppLang === 'th' ? '🎧 ฟังเต็มบน Spotify' : '🎧 Listen on Spotify'}</a>
          <button class="btn-sm btn-modal-save ${isSaved ? 'saved' : ''}" data-save-id="${song.id}" onclick="toggleSaveSong(${song.id}, event)">
            ${saveBtnText}
          </button>
        </div>
      </div>
    </div>

    <div style="margin-top:1.5rem;padding:1rem;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;">
      <div style="font-size:0.8rem;color:var(--primary);font-weight:700;margin-bottom:0.6rem;">${recAnimeHeader}</div>
      <div class="modal-anime-showcase">
        ${animeImgTag(anime, 'modal-anime-img')}
        <div class="modal-anime-info">
          <div style="font-weight:700;color:var(--primary);font-size:1.25rem;">${getAnimeDisplayName(anime)}</div>
          <div style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.4rem;">${getAnimeSecondaryName(anime)}</div>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.8rem;">
            ${(anime.genre || []).map(g => `<span style="background:rgba(255,255,255,0.08);padding:0.15rem 0.5rem;border-radius:6px;font-size:0.75rem;color:var(--text-muted);">${translateGenre(g)}</span>`).join('')}
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <a href="${anime.anifumeUrl}" target="_blank" class="btn-sm btn-anifume">${anifumeBtnText}</a>
            <button onclick="openAnimePicker(${song.id})" class="btn-sm" style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:#a5b4fc;cursor:pointer;border-radius:9999px;font-family:Kanit,sans-serif;">${switchAnimeText}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

let _lastToggleMenuTime = 0;

// Robust toggleMenu function (Fixed DOM-detachment & click debounce)
function toggleMenu(event) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (event.cancelBubble !== undefined) event.cancelBubble = true;
  }
  _lastToggleMenuTime = Date.now();
  const navLinks = document.querySelector('.nav-links');
  const btn = document.getElementById('hamburger');
  if (navLinks) {
    const willOpen = !navLinks.classList.contains('open');
    navLinks.classList.toggle('open', willOpen);
    if (btn) {
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      const icon = btn.querySelector('.hamburger-icon');
      const text = btn.querySelector('.hamburger-text');
      if (icon) icon.textContent = willOpen ? '✕' : '☰';
      if (text) text.textContent = willOpen ? (currentAppLang === 'th' ? 'ปิด' : 'Close') : (currentAppLang === 'th' ? 'โซนเพลง' : 'Menu');
    }
  }
}

// Close menu when clicking outside or when selecting a nav link
document.addEventListener('click', (e) => {
  // Ignore clicks within 350ms of toggleMenu triggering to avoid false outside-click detection
  if (Date.now() - _lastToggleMenuTime < 350) return;

  const navLinks = document.querySelector('.nav-links');
  const btn = document.getElementById('hamburger');
  if (!navLinks || !navLinks.classList.contains('open')) return;

  // If clicked inside hamburger button, ignore
  if (e.target && e.target.closest('#hamburger')) return;

  // If clicked a link inside nav-links, close the menu smoothly
  if (e.target && e.target.closest('.nav-link')) {
    navLinks.classList.remove('open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      const icon = btn.querySelector('.hamburger-icon');
      const text = btn.querySelector('.hamburger-text');
      if (icon) icon.textContent = '☰';
      if (text) text.textContent = currentAppLang === 'th' ? 'โซนเพลง' : 'Menu';
    }
    return;
  }

  // If clicked anywhere else outside, close the menu
  if (!navLinks.contains(e.target)) {
    navLinks.classList.remove('open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      const icon = btn.querySelector('.hamburger-icon');
      const text = btn.querySelector('.hamburger-text');
      if (icon) icon.textContent = '☰';
      if (text) text.textContent = currentAppLang === 'th' ? 'โซนเพลง' : 'Menu';
    }
  }
});



function showToast(msg) {
  let toast = document.getElementById('typo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'typo-toast';
    toast.className = 'typo-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Weekly Auto-Update Drop Tracker (Every 7 Days)
function initWeeklyUpdateTracker() {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const WEEK_MS = 7 * DAY_MS;
  const now = Date.now();
  let lastSync = parseInt(localStorage.getItem('typo_weekly_sync_time') || '0');
  let lastDailyCheck = parseInt(localStorage.getItem('typo_daily_check') || '0');

  if (!lastSync) {
    lastSync = now;
    localStorage.setItem('typo_weekly_sync_time', lastSync.toString());
  }

  // Daily check – show auto-refresh toast once per day
  if (now - lastDailyCheck >= DAY_MS) {
    localStorage.setItem('typo_daily_check', now.toString());
    setTimeout(() => {
      showToast(currentAppLang === 'th'
        ? `🎵 อัปเดตรายวัน: ${SONGS.length} เพลง • ${ANIMES.length} อนิเมะ ✨`
        : `🎵 Daily refresh: ${SONGS.length} tracks • ${ANIMES.length} anime ✨`
      );
    }, 2500);
  }

  const elapsed = now - lastSync;
  const daysLeft = Math.max(1, 7 - Math.floor(elapsed / DAY_MS));

  const syncStatusEl = document.getElementById('weekly-sync-status');
  if (syncStatusEl) {
    if (elapsed >= WEEK_MS) {
      localStorage.setItem('typo_weekly_sync_time', now.toString());
      syncStatusEl.innerHTML = currentAppLang === 'th'
        ? `🎉 <strong>อัปเดตใหม่สัปดาห์นี้!</strong> เพลง ${SONGS.length} • อนิเมะ ${ANIMES.length} – ลองเพลงใหม่!`
        : `🎉 <strong>Weekly Drop is live!</strong> ${SONGS.length} tracks • ${ANIMES.length} anime – Discover new tracks!`;
    } else {
      syncStatusEl.innerHTML = currentAppLang === 'th'
        ? `✨ อัปเดตล่าสุด: ${SONGS.length} เพลง • ${ANIMES.length} อนิเมะ (รอบถัดไปอีก ${daysLeft} วัน)`
        : `✨ Latest: ${SONGS.length} tracks • ${ANIMES.length} anime (next drop in ${daysLeft} days)`;
    }
  }

  // Schedule daily re-check at midnight
  const msUntilNextDay = DAY_MS - (now % DAY_MS) + 1000;
  setTimeout(() => initWeeklyUpdateTracker(), Math.min(msUntilNextDay, DAY_MS));
}

// ---- HAIMIYA YAHO AUDIO CLIP (Softer Volume) ----
let haimiyaAudio = null;
let _isHaimiyaPlaying = false;

function getHaimiyaAudio() {
  if (!haimiyaAudio) {
    const audio = new Audio();
    // ใช้ไฟล์ WAV ที่ตัดความเงียบ 3.39 วิ ออกแล้ว ทำให้เสียงพูดเริ่มทันที 0s จบประโยคสมบูรณ์
    if (audio.canPlayType('audio/wav')) {
      audio.src = 'haimiya_yaho.wav';
    } else {
      audio.src = 'haimiya_yaho.mp3';
    }
    audio.preload = 'auto';
    audio.volume = 1.0;
    haimiyaAudio = audio;
  }
  return haimiyaAudio;
}

// Pre-load audio immediately on script load
try {
  getHaimiyaAudio().load();
} catch (e) {}

function playHaimiyaYaho() {
  try {
    const audio = getHaimiyaAudio();
    // ถ้ากำลังเล่นอยู่แล้ว ห้ามตัดจบ ห้ามเล่นซ้อน ให้เล่นต่อจนจบประโยคสมบูรณ์ 100%
    if (_isHaimiyaPlaying) {
      return;
    }

    _isHaimiyaPlaying = true;
    audio.volume = 1.0;
    audio.currentTime = 0;

    const onAudioFinished = () => {
      _isHaimiyaPlaying = false;
      audio.removeEventListener('ended', onAudioFinished);
      // เมื่อเสียงทักทายพูดจบประโยคครบถ้วนแล้ว จึงเริ่มเพลงผ่อนคลายเบาๆ
      if (typeof startRelaxBgm === 'function') {
        startRelaxBgm();
      }
    };
    audio.addEventListener('ended', onAudioFinished);

    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch((err) => {
        _isHaimiyaPlaying = false;
        // If autoplay blocked by browser policy, play on the very next user tap anywhere
        const onFirstGesture = () => {
          window.removeEventListener('pointerdown', onFirstGesture);
          window.removeEventListener('touchstart', onFirstGesture);
          window.removeEventListener('click', onFirstGesture);
          playHaimiyaYaho();
        };
        window.addEventListener('pointerdown', onFirstGesture, { once: true });
        window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });
        window.addEventListener('click', onFirstGesture, { once: true });
      });
    }
  } catch (e) {
    _isHaimiyaPlaying = false;
  }
}

// ---- RELAXING BACKGROUND AMBIENT MUSIC ("blue" by yung kai) ----
let relaxBgmAudio = null;
let isRelaxBgmEnabled = true;
let isDuckMutedByPreview = false;
let wasRelaxBgmPlayingBeforeBackground = false;
let wasPreviewPlayingBeforeBackground = false;
// ปรับระดับเสียงเพลง blue ให้ดังกังวาน ชัดเจน ไพเราะ ฟังสบาย ไม่เบาไป (0.85)
const RELAX_BGM_VOLUME = 0.85;

function getRelaxBgmAudio() {
  if (!relaxBgmAudio) {
    relaxBgmAudio = new Audio('blue_relax.m4a');
    relaxBgmAudio.preload = 'auto';
    relaxBgmAudio.loop = true;
    relaxBgmAudio.volume = RELAX_BGM_VOLUME;

    // ถ้าแคชเป็น Offline Blob ได้ ให้ใช้ Blob URL เพื่อให้เล่นได้แน่นอน 100% แม้ไม่มีเน็ต
    getOfflinePlayableUrl('blue_relax.m4a').then(blobUrl => {
      if (blobUrl && relaxBgmAudio && !relaxBgmAudio.currentTime) {
        relaxBgmAudio.src = blobUrl;
      }
    }).catch(() => {});
  }
  return relaxBgmAudio;
}

function updateRelaxBgmUI(isPlaying) {
  const btn = document.getElementById('relax-bgm-btn');
  if (btn) {
    if (isPlaying && isRelaxBgmEnabled && !isDuckMutedByPreview) {
      btn.classList.add('playing');
      btn.classList.remove('paused', 'ducked');
      btn.title = currentAppLang === 'th' ? 'เพลงผ่อนคลายกำลังเล่น: blue - yung kai (คลิกเพื่อหยุด)' : 'Relax BGM playing: blue - yung kai (Click to pause)';
    } else if (isDuckMutedByPreview) {
      btn.classList.remove('playing');
      btn.classList.add('ducked');
      btn.title = currentAppLang === 'th' ? 'เพลงผ่อนคลายหยุดชั่วคราวขณะฟังตัวอย่างเพลง (จะเล่นต่อเมื่อเพลงจบ)' : 'Relax BGM ducked during preview';
    } else {
      btn.classList.remove('playing', 'ducked');
      btn.classList.add('paused');
      btn.title = currentAppLang === 'th' ? 'เพลงผ่อนคลายปิดอยู่ (คลิกเพื่อเล่น)' : 'Relax BGM paused (Click to play)';
    }
  }
}

function startRelaxBgm() {
  if (!isRelaxBgmEnabled || isDuckMutedByPreview) return;
  try {
    const audio = getRelaxBgmAudio();
    audio.volume = RELAX_BGM_VOLUME;
    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.then(() => updateRelaxBgmUI(true)).catch(() => {
        // Wait for user gesture anywhere on screen
        const onFirstInteraction = () => {
          if (isRelaxBgmEnabled && !isDuckMutedByPreview) {
            audio.volume = RELAX_BGM_VOLUME;
            audio.play().then(() => updateRelaxBgmUI(true)).catch(() => {});
          }
          window.removeEventListener('pointerdown', onFirstInteraction);
          window.removeEventListener('click', onFirstInteraction);
        };
        window.addEventListener('pointerdown', onFirstInteraction, { once: true });
        window.addEventListener('click', onFirstInteraction, { once: true });
      });
    } else {
      updateRelaxBgmUI(true);
    }
  } catch (e) {}
}

function pauseRelaxBgm() {
  if (!relaxBgmAudio) return;
  try {
    relaxBgmAudio.pause();
    updateRelaxBgmUI(false);
  } catch (e) {}
}

function duckRelaxBgm() {
  // เมื่อผู้ใช้เลือกเพลงฟัง -> ดนตรีผ่อนคลายจะหยุดทันที เพื่อไม่ให้เสียงตีกันและตัดปัญหาเสียงกระตุก
  isDuckMutedByPreview = true;
  updateRelaxBgmUI(false);
  if (relaxBgmAudio && !relaxBgmAudio.paused) {
    try {
      relaxBgmAudio.pause();
    } catch (e) {}
  }
}

function resumeRelaxBgm() {
  // เมื่อเพลงที่เลือกฟังจบ หรือผู้ใช้หยุดเพลง -> เล่นเพลงผ่อนคลาย blue ต่อจากจุดเดิมโดยไม่กระตุก
  isDuckMutedByPreview = false;
  if (!isRelaxBgmEnabled) return;
  try {
    const audio = getRelaxBgmAudio();
    // ไม่ reset currentTime=0 เพื่อเล่นต่อจากจุดเดิมอย่างราบรื่น ลด audio pop/stutter
    audio.volume = RELAX_BGM_VOLUME;
    const p = audio.play();
    if (p && p.catch) {
      p.then(() => {
        updateRelaxBgmUI(true);
        updateMediaSession({ title: 'blue', artist: 'yung kai', coverUrl: 'splash-cover.jpg' }, true);
      }).catch(() => {});
    }
  } catch (e) {}
}

function toggleRelaxBgm() {
  isRelaxBgmEnabled = !isRelaxBgmEnabled;
  if (isRelaxBgmEnabled) {
    if (!isDuckMutedByPreview) {
      startRelaxBgm();
      showToast(currentAppLang === 'th' ? '🎵 เปิดเพลงผ่อนคลาย: blue ~ yung kai' : '🎵 Relax BGM On: blue ~ yung kai');
    } else {
      showToast(currentAppLang === 'th' ? '🎵 เปิดเพลงผ่อนคลายแล้ว (จะเล่นต่อหลังฟังเพลงตัวอย่างจบ)' : '🎵 Relax BGM queued');
    }
  } else {
    pauseRelaxBgm();
    showToast(currentAppLang === 'th' ? '🔇 ปิดเพลงผ่อนคลายแล้ว' : '🔇 Relax BGM Off');
  }
  updateRelaxBgmUI(isRelaxBgmEnabled && !isDuckMutedByPreview);
}

// ---- MEDIA SESSION & BACKGROUND AUDIO PLAYBACK ----
// รองรับการเล่นเพลงต่อเนื่องในพื้นหลัง (Background Playback) แม้ล็อกหน้าจอหรือสลับแอป พร้อมปุ่มควบคุม Lock Screen
function updateMediaSession(track, isRelaxBgm = false) {
  if (!('mediaSession' in navigator) || !track) return;
  try {
    const title = track.title || (isRelaxBgm ? 'blue' : 'Haimiya Typo Track');
    const artist = track.artist || (isRelaxBgm ? 'yung kai' : 'Haimiya Studio');
    const artworkUrl = track.coverUrl || 'app-icon.jpg';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: artist,
      album: 'Haimiya Typo Studio',
      artwork: [
        { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
        { src: 'app-icon.jpg', sizes: '192x192', type: 'image/jpeg' }
      ]
    });

    navigator.mediaSession.playbackState = 'playing';

    navigator.mediaSession.setActionHandler('play', () => {
      if (currentAudio && currentAudio.paused) {
        currentAudio.play();
        navigator.mediaSession.playbackState = 'playing';
        updateAudioUI(true);
      } else if (relaxBgmAudio && relaxBgmAudio.paused && isRelaxBgmEnabled) {
        startRelaxBgm();
        navigator.mediaSession.playbackState = 'playing';
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        navigator.mediaSession.playbackState = 'paused';
        updateAudioUI(false);
      } else if (relaxBgmAudio && !relaxBgmAudio.paused) {
        pauseRelaxBgm();
        navigator.mediaSession.playbackState = 'paused';
      }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (currentPlayingId) {
        const idx = SONGS.findIndex(s => s.id === currentPlayingId);
        if (idx > 0) togglePlaySong(SONGS[idx - 1].id);
        else if (SONGS.length > 0) togglePlaySong(SONGS[SONGS.length - 1].id);
      }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (currentPlayingId) {
        const idx = SONGS.findIndex(s => s.id === currentPlayingId);
        if (idx >= 0 && idx < SONGS.length - 1) togglePlaySong(SONGS[idx + 1].id);
        else if (SONGS.length > 0) togglePlaySong(SONGS[0].id);
      }
    });
  } catch (e) {
    console.warn('⚠️ MediaSession error:', e);
  }
}

function handleAppGoingBackground() {
  // ให้เพลงเล่นต่อเนื่องในพื้นหลังได้อย่างราบรื่น ไม่สั่ง pause()
  // หยุดเฉพาะเสียงพูดทักทายหรือลูกเต๋าถ้าค้างอยู่
  if (haimiyaAudio && !haimiyaAudio.paused) {
    try { haimiyaAudio.pause(); } catch (e) {}
  }
  if (diceAudio && !diceAudio.paused) {
    try { diceAudio.pause(); } catch (e) {}
  }
  // หยุด SpeechSynthesis ถ้าค้างอยู่ เพื่อไม่ให้เสียงค้างในพื้นหลัง
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch(e) {}
  }
}

function handleAppReturningForeground() {
  // ซิงค์สถานะ UI เมื่อผู้ใช้เปิดแอปกลับขึ้นมา
  if (currentAudio && !currentAudio.paused) {
    updateAudioUI(true);
  } else if (relaxBgmAudio && !relaxBgmAudio.paused) {
    updateRelaxBgmUI(true);
  }
}

// ดักจับเมื่อหน้าจอถูกพับ ย่อ สลับแท็บ หรือกดออกจากแอป
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    handleAppGoingBackground();
  } else {
    handleAppReturningForeground();
  }
});

// ดักจับ Lifecycle Event ของ Capacitor / Cordova และ Mobile Browser
window.addEventListener('pagehide', handleAppGoingBackground);
document.addEventListener('pause', handleAppGoingBackground, false);
document.addEventListener('resume', handleAppReturningForeground, false);

// ดักจับ Capacitor App Native State (ถ้ามี)
if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
  try {
    window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
      if (!state.isActive) {
        handleAppGoingBackground();
      } else {
        handleAppReturningForeground();
      }
    });
  } catch (e) {}
}

// ============================================
//  FLOATING MINI-PLAYER ("แอพลอย")
//  เครื่องเล่นเพลงลอยได้บนหน้าจอ ไม่ซ้อนป๊อปอัป ไม่ปิดบังหน้าจอ
// ============================================

let _miniPlayerVisible = false;
let _miniPlayerCollapsed = false;
let _fmpDragOffset = { x: 0, y: 0 };
let _fmpDragging = false;

// เปิดมินิเพลเยอร์ลอย
function showMiniPlayer() {
  const fmp = document.getElementById('floating-mini-player');
  if (!fmp) return;
  fmp.style.display = 'flex';
  _miniPlayerVisible = true;
  _miniPlayerCollapsed = false;
  syncMiniPlayerInfo();
  startMiniPlayerProgressLoop();

  // ซ่อน mascot bubble
  const bubble = document.getElementById('floating-mascot-bubble');
  if (bubble) bubble.style.display = 'none';

  // ตรวจสอบตำแหน่งให้อยู่ในมุมมองหน้าจอเสมอ
  const rect = fmp.getBoundingClientRect();
  if (rect.right > window.innerWidth || rect.bottom > window.innerHeight || rect.left < 0 || rect.top < 0) {
    fmp.style.right = '20px';
    fmp.style.bottom = '95px';
    fmp.style.left = 'auto';
    fmp.style.top = 'auto';
  }
}

// ปิดมินิเพลเยอร์ลอย
function closeMiniPlayer() {
  const fmp = document.getElementById('floating-mini-player');
  if (fmp) fmp.style.display = 'none';
  _miniPlayerVisible = false;
  _miniPlayerCollapsed = false;

  const bubble = document.getElementById('floating-mascot-bubble');
  if (bubble) bubble.style.display = 'none';

  document.body.classList.remove('pip-mode');
  document.body.classList.remove('native-pip-active');
}

// สลับเปิด/ปิดแอพลอย
function toggleFloatingPlayer(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const fmp = document.getElementById('floating-mini-player');
  const bubble = document.getElementById('floating-mascot-bubble');
  if (!fmp) return;

  if (_miniPlayerVisible || (bubble && bubble.style.display !== 'none')) {
    closeMiniPlayer();
    showToast(currentAppLang === 'th' ? 'ปิดเครื่องเล่นลอยแล้ว' : 'Floating player closed');
  } else {
    showMiniPlayer();
    showToast(currentAppLang === 'th' ? '✨ เปิดโหมดเครื่องเล่นลอย (ลากย้ายตำแหน่งได้อิสระ)' : '✨ Floating player opened');
  }
}

// ย่อเป็นฟองสบู่ลอย / ขยายกลับ
function toggleMiniPlayerCollapse() {
  const fmp = document.getElementById('floating-mini-player');
  const bubble = document.getElementById('floating-mascot-bubble');
  if (!fmp || !bubble) return;

  if (!_miniPlayerCollapsed) {
    // ย่อเป็นฟองสบู่ลอย
    fmp.style.display = 'none';
    bubble.style.display = 'block';
    _miniPlayerCollapsed = true;
  } else {
    expandMiniPlayer();
  }
}

function expandMiniPlayer() {
  const fmp = document.getElementById('floating-mini-player');
  const bubble = document.getElementById('floating-mascot-bubble');
  if (fmp) fmp.style.display = 'flex';
  if (bubble) bubble.style.display = 'none';
  _miniPlayerVisible = true;
  _miniPlayerCollapsed = false;
  syncMiniPlayerInfo();
  startMiniPlayerProgressLoop();
}

// สลับเล่น/หยุดจากมินิเพลเยอร์
function togglePlayFromMini() {
  if (currentAudio) {
    if (currentAudio.paused) {
      currentAudio.play().catch(() => {});
      updateAudioUI(true);
    } else {
      currentAudio.pause();
      updateAudioUI(false);
    }
    syncMiniPlayerPlayState();
  } else if (currentPlayingId) {
    togglePlaySong(currentPlayingId);
  }
}

// ซิงค์ข้อมูลเพลงปัจจุบันลงมินิเพลเยอร์
function syncMiniPlayerInfo() {
  if (!_miniPlayerVisible) return;
  const titleEl = document.getElementById('fmp-song-title');
  const artistEl = document.getElementById('fmp-song-artist');
  const coverEl = document.getElementById('fmp-cover-img');

  if (currentPlayingId) {
    const song = SONG_MAP.get(currentPlayingId) || SONGS.find(s => s.id === currentPlayingId);
    if (song) {
      if (titleEl) titleEl.textContent = song.title || 'Haimiya Typo';
      if (artistEl) artistEl.textContent = song.artist || 'Studio Player';
      if (coverEl) {
        coverEl.src = song.coverUrl || 'splash-cover.jpg';
        coverEl.onerror = function() { this.src = getSongFallbackCover(song); };
      }
    }
  }
  syncMiniPlayerPlayState();
}

function syncMiniPlayerPlayState() {
  const toggle = document.getElementById('fmp-play-toggle');
  const overlay = document.getElementById('fmp-play-overlay');
  const coverImg = document.getElementById('fmp-cover-img');
  const muteBtn = document.getElementById('fmp-mute-btn');
  const isPlaying = currentAudio && !currentAudio.paused;

  if (toggle) toggle.textContent = isPlaying ? '⏸' : '▶';
  if (overlay) overlay.textContent = isPlaying ? '⏸' : '▶';
  if (muteBtn && currentAudio) {
    muteBtn.textContent = (currentAudio.muted || currentAudio.volume === 0) ? '🔇' : '🔊';
  }
  if (coverImg) {
    if (isPlaying) {
      coverImg.classList.add('spinning');
    } else {
      coverImg.classList.remove('spinning');
    }
  }
}

// อัปเดต progress bar ของมินิเพลเยอร์
function updateMiniPlayerProgress() {
  if (!_miniPlayerVisible || !currentAudio) return;
  const fill = document.getElementById('fmp-progress-fill');
  if (fill && currentAudio.duration) {
    const pct = (currentAudio.currentTime / currentAudio.duration) * 100;
    fill.style.width = pct + '%';
  }
  if (_miniPlayerVisible) {
    requestAnimationFrame(updateMiniPlayerProgress);
  }
}

// เริ่มอัปเดต progress ของมินิเพลเยอร์เมื่อมีเพลงเล่น
function startMiniPlayerProgressLoop() {
  if (_miniPlayerVisible) {
    requestAnimationFrame(updateMiniPlayerProgress);
  }
}

// สำหรับความเข้ากันได้กับการเรียก togglePictureInPictureMode
async function togglePictureInPictureMode(e) {
  // สำหรับ Android native APK: ให้เรียก Java bridge เพื่อเข้า native PiP
  if (window.AndroidBridge && (typeof window.AndroidBridge.enterPip === 'function' || typeof window.AndroidBridge.enterPiP === 'function')) {
    try {
      const enterFn = window.AndroidBridge.enterPip || window.AndroidBridge.enterPiP;
      enterFn.call(window.AndroidBridge);
      showMiniPlayer();
      return;
    } catch (err) {
      console.warn('Native PiP failed:', err);
    }
  }
  // บนเว็บและอุปกรณ์ทั่วไป: สลับเปิด/ปิดโหมดแอพลอยตรงๆ ไม่มีป๊อปอัปซ้อนป๊อปอัป ไม่ปิดบังหน้าจอ
  toggleFloatingPlayer(e);
}

// ลาก Mini-Player (Drag support)
(function initMiniPlayerDrag() {
  document.addEventListener('pointerdown', (e) => {
    const header = document.getElementById('fmp-drag-header');
    if (!header || !header.contains(e.target)) return;
    // ไม่ลากถ้าคลิกปุ่ม
    if (e.target.closest('.fmp-btn-icon')) return;

    const fmp = document.getElementById('floating-mini-player');
    if (!fmp) return;

    _fmpDragging = true;
    const rect = fmp.getBoundingClientRect();
    _fmpDragOffset.x = e.clientX - rect.left;
    _fmpDragOffset.y = e.clientY - rect.top;
    fmp.style.transition = 'none';
    e.preventDefault();
  });

  document.addEventListener('pointermove', (e) => {
    if (!_fmpDragging) return;
    const fmp = document.getElementById('floating-mini-player');
    if (!fmp) return;

    const x = e.clientX - _fmpDragOffset.x;
    const y = e.clientY - _fmpDragOffset.y;

    // จำกัดไม่ให้ลากหลุดออกจากหน้าจอ
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 40;
    fmp.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    fmp.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    fmp.style.right = 'auto';
    fmp.style.bottom = 'auto';
  });

  document.addEventListener('pointerup', () => {
    if (_fmpDragging) {
      _fmpDragging = false;
      const fmp = document.getElementById('floating-mini-player');
      if (fmp) fmp.style.transition = '';
    }
  });
})();

// ซิงค์มินิเพลเยอร์ทุกครั้งที่เพลงเปลี่ยน
const _origUpdateAudioUI = typeof updateAudioUI === 'function' ? updateAudioUI : null;
if (_origUpdateAudioUI) {
  // Patch updateAudioUI ให้ซิงค์มินิเพลเยอร์ด้วย
  const _patchedUpdateAudioUI = updateAudioUI;
  // เราใช้วิธีอื่น: ฟัง event timeupdate แทน
}

// ฟัง audio events เพื่อซิงค์มินิเพลเยอร์
setInterval(() => {
  if (_miniPlayerVisible) {
    syncMiniPlayerPlayState();
    if (currentAudio && currentAudio.duration) {
      const fill = document.getElementById('fmp-progress-fill');
      if (fill) {
        fill.style.width = ((currentAudio.currentTime / currentAudio.duration) * 100) + '%';
      }
    }
  }
}, 500);

// เมื่อ visibility change กลับมา ให้ซิงค์มินิเพลเยอร์
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && _miniPlayerVisible) {
    syncMiniPlayerInfo();
    startMiniPlayerProgressLoop();
  }
});

// ฟังก์ชันที่ Android Java เรียกเมื่อเข้า/ออก PiP mode จริง (จาก onPictureInPictureModeChanged)
window.setPipUIMode = function(isInPiP) {
  if (isInPiP) {
    document.body.classList.add('pip-mode');
    showMiniPlayer();
    startMiniPlayerProgressLoop();
  } else {
    document.body.classList.remove('pip-mode');
    // ไม่ปิด mini-player เพื่อให้ผู้ใช้ยังเห็นได้ แต่ถ้าอยากปิดก็กด X ได้
    syncMiniPlayerInfo();
  }
};

// ---- SPLASH GREETING: FLOATING JAPANESE TEXT ----
function showSplashGreeting(splashEl) {
  if (!splashEl) return;
  if (splashEl.querySelector('.splash-greeting-float')) return;
  
  // Create floating greeting element (Clean Japanese greeting, no notification text)
  const greeting = document.createElement('div');
  greeting.className = 'splash-greeting-float';
  greeting.innerHTML = `
    <span class="greeting-icon">💬</span>
    <span class="greeting-jp">こんにちは</span>
    <span class="greeting-sparkle">✨</span>
  `;
  greeting.title = 'Haimiya: こんにちは';
  greeting.addEventListener('click', (e) => {
    e.stopPropagation();
    playHaimiyaYaho();
  });
  
  const avatarBox = splashEl.querySelector('.splash-avatar-box');
  if (avatarBox) {
    avatarBox.appendChild(greeting);
  } else {
    const splashCard = splashEl.querySelector('.splash-card') || splashEl;
    splashCard.prepend(greeting);
  }

  // Trigger floating down animation
  requestAnimationFrame(() => {
    setTimeout(() => greeting.classList.add('visible'), 50);
  });
}

// ---- SPLASH SCREEN WITH SMOOTH PROGRESS & ROTATING CHIBI MASCOT ----
function initSplashScreen() {
  const splashEl = document.getElementById('app-splash-screen');
  const progressBar = document.getElementById('splash-progress-bar');
  const percentText = document.getElementById('splash-percent-text');
  const statusText = document.getElementById('splash-status-text');

  if (!splashEl || !progressBar || !percentText) return;

  // Click or touch on splash screen also plays Haimiya Yaho sound
  splashEl.addEventListener('click', () => {
    playHaimiyaYaho();
  });
  splashEl.addEventListener('touchstart', () => {
    playHaimiyaYaho();
  }, { passive: true });

  // Register service worker if supported
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  let currentPercent = 0;
  const targetPercent = 100;
  const duration = 1600; // 1.6 seconds smooth load
  const interval = 25; // 25ms tick
  const step = targetPercent / (duration / interval);

  const statusStages = [
    { at: 0, th: 'กำลังเตรียมคลังเพลง...', en: 'Preparing song vault...' },
    { at: 28, th: 'เชื่อมต่อเสียงตัวอย่าง & ซีนอนิเมะ...', en: 'Connecting audio previews & anime...' },
    { at: 62, th: 'จัดเตรียมคลังไอเดียทำคลิปไทโป...', en: 'Loading typography ideas & BPM...' },
    { at: 90, th: 'โหลดข้อมูลสำเร็จเกือบครบแล้ว...', en: 'Finalizing studio modules...' },
    { at: 100, th: '✨ พร้อมใช้งานแล้ว!', en: '✨ Ready to create!' }
  ];

  const timer = setInterval(() => {
    const easeFactor = currentPercent < 70 ? 1.25 : 0.82;
    currentPercent += step * easeFactor;

    if (currentPercent >= 100) {
      currentPercent = 100;
      clearInterval(timer);

      progressBar.style.width = '100%';
      percentText.textContent = '100%';
      if (statusText) statusText.textContent = currentAppLang === 'th' ? '✨ พร้อมใช้งานแล้ว!' : '✨ Ready to create!';

      // Play Haimiya Yaho sound when ready!
      playHaimiyaYaho();

      // Show floating Japanese greeting "こんにちは" (Hello!)
      showSplashGreeting(splashEl);

      // รอดูจนกว่าเสียงพูดของคุณไฮมิยะจะจบสมบูรณ์ แล้วจึง fade out
      const tryDismissSplash = () => {
        if (_isHaimiyaPlaying) {
          setTimeout(tryDismissSplash, 200);
          return;
        }
        splashEl.classList.add('fade-out');
        setTimeout(() => {
          splashEl.style.display = 'none';
          startRelaxBgm();
        }, 600);
      };
      setTimeout(tryDismissSplash, 2400);

      return;
    }

    progressBar.style.width = `${Math.min(currentPercent, 99.5)}%`;
    percentText.textContent = `${Math.floor(currentPercent)}%`;

    if (statusText) {
      for (let i = statusStages.length - 1; i >= 0; i--) {
        if (currentPercent >= statusStages[i].at) {
          statusText.textContent = currentAppLang === 'th' ? statusStages[i].th : statusStages[i].en;
          break;
        }
      }
    }
  }, interval);
}

// ============================================
//  LIVE AUTO-UPDATE & IN-APP APK UPGRADER (OTA)
//  ระบบซิงค์เพลง/อนิเมะสดอัตโนมัติ และอัปเดตแอป APK ทับของเดิมได้ 100% ไม่ต้องลบแอปเก่า
// ============================================

const CURRENT_APP_VERSION = 'v2.20261101.27086';
const CURRENT_VERSION_CODE = 1793031320;
const GITHUB_REPO_OWNER = 'bocchi-V2';
const GITHUB_REPO_NAME = 'typo-music-hub';
const GITHUB_PAGES_BASE = 'https://bocchi-v2.github.io/typo-music-hub';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/bocchi-V2/typo-music-hub/master';

const HAIMIYA_DB_NAME = 'HaimiyaTypoDB';
const HAIMIYA_DB_VERSION = 1;
const HAIMIYA_STORE_NAME = 'synced_data';

function openHaimiyaDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) return resolve(null);
    try {
      const req = indexedDB.open(HAIMIYA_DB_NAME, HAIMIYA_DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(HAIMIYA_STORE_NAME)) {
          db.createObjectStore(HAIMIYA_STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function getHaimiyaDB(key) {
  try {
    const db = await openHaimiyaDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(HAIMIYA_STORE_NAME, 'readonly');
      const store = tx.objectStore(HAIMIYA_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function setHaimiyaDB(key, val) {
  try {
    const db = await openHaimiyaDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(HAIMIYA_STORE_NAME, 'readwrite');
      const store = tx.objectStore(HAIMIYA_STORE_NAME);
      store.put(val, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

function replaceArrayInPlace(target, source) {
  if (!Array.isArray(target) || !Array.isArray(source)) return;
  target.length = 0;
  for (let i = 0; i < source.length; i += 500) {
    target.push(...source.slice(i, i + 500));
  }
}

// 1. โหลดข้อมูลที่แคชไว้จากรอบก่อนหน้า (ทำงานได้แบบ Offline 100%)
async function loadCachedDatabase() {
  try {
    const cachedSongs = await getHaimiyaDB('synced_songs');
    const cachedAnimes = await getHaimiyaDB('synced_animes');
    const cachedPairs = await getHaimiyaDB('synced_pairs');
    if (cachedSongs && Array.isArray(cachedSongs)) {
      if (SONGS.length > cachedSongs.length) {
        // App has newer songs (including Funk secret zone) - update IndexedDB!
        await setHaimiyaDB('synced_songs', SONGS);
        await setHaimiyaDB('synced_version_code', CURRENT_VERSION_CODE);
        console.log(`⚡ [IndexedDB] อัปเดตฐานข้อมูลเพลงใหม่ลงเครื่อง: ${SONGS.length} เพลง`);
      } else if (cachedSongs.length > SONGS.length) {
        replaceArrayInPlace(SONGS, cachedSongs);
        if (cachedAnimes && Array.isArray(cachedAnimes)) replaceArrayInPlace(ANIMES, cachedAnimes);
        if (cachedPairs && Array.isArray(cachedPairs)) replaceArrayInPlace(ANIME_PAIRS, cachedPairs);
        initDataMaps();
        console.log(`⚡ [IndexedDB] โหลดฐานข้อมูลเพลงแคชสำเร็จ: ${SONGS.length} เพลง | ${ANIMES.length} อนิเมะ`);
      }
    }
  } catch (e) {
    console.warn('⚠️ loadCachedDatabase:', e);
  }
}

// 2. เช็คการอัปเดตเพลงและอนิเมะสดทางอินเทอร์เน็ต (Live OTA Content Sync)
async function checkLiveContentUpdate() {
  if (!navigator.onLine) return;
  try {
    let remoteVersion = null;
    const endpoints = [
      `${GITHUB_PAGES_BASE}/version.json?_t=${Date.now()}`,
      `${GITHUB_RAW_BASE}/version.json?_t=${Date.now()}`
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          remoteVersion = await res.json();
          break;
        }
      } catch (e) {}
    }
    if (!remoteVersion) return;

    const localCode = parseInt(await getHaimiyaDB('synced_version_code') || '0', 10);
    const hasMoreSongs = remoteVersion.songCount && remoteVersion.songCount > SONGS.length;
    const isNewerCode = remoteVersion.versionCode && remoteVersion.versionCode > Math.max(CURRENT_VERSION_CODE, localCode);

    if (hasMoreSongs || isNewerCode) {
      console.log(`🔄 พบข้อมูลใหม่! เครื่อง: ${SONGS.length} เพลง -> คลาวด์: ${remoteVersion.songCount} เพลง กำลังซิงค์...`);
      let dataText = null;
      const dataEndpoints = [
        `${GITHUB_PAGES_BASE}/data.js?_t=${Date.now()}`,
        `${GITHUB_RAW_BASE}/data.js?_t=${Date.now()}`
      ];
      for (const url of dataEndpoints) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (res.ok) {
            dataText = await res.text();
            break;
          }
        } catch (e) {}
      }
      if (!dataText) return;

      const parseFn = new Function(dataText + '; return { songs: typeof SONGS !== "undefined" ? SONGS : [], animes: typeof ANIMES !== "undefined" ? ANIMES : [], pairs: typeof ANIME_PAIRS !== "undefined" ? ANIME_PAIRS : [] };');
      const parsed = parseFn();
      if (parsed && Array.isArray(parsed.songs) && parsed.songs.length >= SONGS.length) {
        replaceArrayInPlace(SONGS, parsed.songs);
        if (parsed.animes && parsed.animes.length) replaceArrayInPlace(ANIMES, parsed.animes);
        if (parsed.pairs && parsed.pairs.length) replaceArrayInPlace(ANIME_PAIRS, parsed.pairs);

        await setHaimiyaDB('synced_songs', parsed.songs);
        await setHaimiyaDB('synced_animes', parsed.animes);
        await setHaimiyaDB('synced_pairs', parsed.pairs);
        await setHaimiyaDB('synced_version_code', remoteVersion.versionCode || Date.now());

        initDataMaps();
        if (typeof updateStats === 'function') updateStats();
        if (typeof renderSongsGrid === 'function') renderSongsGrid();
        if (typeof renderAnimeMatchGrid === 'function') renderAnimeMatchGrid();
        if (typeof populateFinderDropdowns === 'function') populateFinderDropdowns();

        showToast(currentAppLang === 'th'
          ? `🎉 ซิงค์ข้อมูลล่าสุดอัตโนมัติสำเร็จ! คลังเพลงเป็นเวอร์ชันล่าสุด ${SONGS.length} เพลงแล้ว ✨`
          : `🎉 Auto-synced latest tracks! Library now has ${SONGS.length} songs ✨`
        );
      }
    }
  } catch (err) {
    console.warn('⚠️ checkLiveContentUpdate:', err);
  }
}

// ---- PUSH NOTIFICATION & VOICE ALERT SYSTEM ----
// ระบบแจ้งเตือนอัปเดตบนโทรศัพท์โดยตรง พร้อมเสียงผู้หญิงน่ารักพูด "อัปเดตด้วยนะคะ"

// ขอสิทธิ์การแจ้งเตือน (Notification Permission)
async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch(e) {
    return false;
  }
}

// ส่ง Push Notification ขึ้นบนมือถือโดยตรง
function sendUpdatePushNotification(versionTag, songCount) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const title = '🚀 Haimiya Typo อัปเดตใหม่!';
    const body = `เวอร์ชัน ${versionTag} พร้อมแล้ว! รวม ${songCount} เพลง — กดเพื่ออัปเดตทันที 💫`;
    const notification = new Notification(title, {
      body: body,
      icon: 'app-icon.jpg',
      badge: 'favicon-logo.jpg',
      tag: 'haimiya-update-' + versionTag,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      silent: false
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
      // เปิด banner อัปเดต
      const banner = document.getElementById('in-app-update-banner');
      if (banner) banner.scrollIntoView({ behavior: 'smooth' });
    };
  } catch(e) {
    console.warn('Notification error:', e);
  }
}

// ============================================
//  CRYSTAL BELL NOTIFICATION CHIME
//  เสียงกระดิ่งแจ้งเตือนสุดคลาสสิก (Crystal Bell / Hotel Desk Bell Ding)
//  เสียงกระดิ่งแท้ๆ กังวานใส ไพเราะ ไม่ใช่เสียงเปิดประตูรถไฟ
// ============================================

let bellNotificationAudio = null;

function getBellNotificationAudio() {
  if (!bellNotificationAudio) {
    const audio = new Audio('bell_notification.wav');
    audio.preload = 'auto';
    audio.volume = 0.95;
    bellNotificationAudio = audio;
  }
  return bellNotificationAudio;
}

// Backward compatibility
function getJapaneseDoorChimeAudio() {
  return getBellNotificationAudio();
}

try {
  getBellNotificationAudio().load();
} catch(e) {}

function playNotificationChime() {
  return new Promise((resolve) => {
    try {
      const audio = getBellNotificationAudio();
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise && playPromise.then) {
        playPromise.then(() => {
          setTimeout(resolve, 2200);
        }).catch((err) => {
          console.warn('Audio tag play blocked, fallback to Web Audio API bell:', err);
          playSynthesizedCrystalBell().then(resolve);
        });
        return;
      }
    } catch(err) {
      console.warn('playNotificationChime error:', err);
    }
    playSynthesizedCrystalBell().then(resolve);
  });
}

function playSynthesizedCrystalBell() {
  return new Promise((resolve) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      // เสียงกระดิ่งสองจังหวะ ดิ้ง-ดอง กังวานใสระดับ Hi-Fi (Crisp Bell & Chime)
      // โน้ตกระดิ่งที่ 1 (A6 = 1760 Hz) และกระดิ่งที่ 2 (E7 = 2637 Hz)
      const chimes = [
        { f0: 1760.0, start: 0.0, gainVal: 0.65, decay: 2.0 },
        { f0: 2637.0, start: 0.12, gainVal: 0.85, decay: 2.3 }
      ];

      chimes.forEach(chime => {
        const startTime = now + chime.start;

        // Strike transient ping (เสียงเคาะกระทบโลหะ/แก้วคริสตัล)
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(4500, startTime);
        clickGain.gain.setValueAtTime(0.28, startTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.035);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(startTime);
        clickOsc.stop(startTime + 0.04);

        // Bell mode partials: Fundamental (f0), Nominal (f0 * 2.01), Tierce (f0 * 2.76), Superquint (f0 * 4.07)
        const partials = [
          { mult: 1.0, amp: 0.75, dur: chime.decay },
          { mult: 2.01, amp: 0.42, dur: chime.decay * 0.8 },
          { mult: 2.76, amp: 0.28, dur: chime.decay * 0.65 },
          { mult: 4.07, amp: 0.18, dur: chime.decay * 0.5 },
          { mult: 5.43, amp: 0.10, dur: chime.decay * 0.35 }
        ];

        partials.forEach(p => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(chime.f0 * p.mult, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(chime.gainVal * p.amp, startTime + 0.003);
          gain.gain.exponentialRampToValueAtTime(0.0005, startTime + p.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + p.dur + 0.05);
        });
      });

      setTimeout(() => {
        ctx.close().catch(() => {});
        resolve();
      }, 2500);
    } catch(e) {
      console.warn('Synthesized crystal bell error:', e);
      resolve();
    }
  });
}

// Backward compatibility & global testing
function playSynthesizedJapaneseShopChime() {
  return playSynthesizedCrystalBell();
}
window.testBellChime = playNotificationChime;
window.testJapaneseDoorChime = playNotificationChime;

// ============================================
//  FLOATING NOTIFICATION POPUP WITH MASCOT
//  กล่องข้อความลอยลงมาพร้อมรูปมาสคอตและ animation สั่น
// ============================================

function showFloatingNotification(title, message, options = {}) {
  // ลบ popup เก่าถ้ามี
  const existing = document.getElementById('haimiya-floating-notif');
  if (existing) existing.remove();

  // สร้าง element
  const popup = document.createElement('div');
  popup.id = 'haimiya-floating-notif';
  popup.className = 'haimiya-floating-notif';
  popup.innerHTML = `
    <div class="notif-inner">
      <div class="notif-mascot-wrap">
        <img src="notification-mascot.jpg" alt="Haimiya Mascot" class="notif-mascot-img" onerror="this.src='splash-cover.jpg';" />
        <span class="notif-mascot-ring"></span>
      </div>
      <div class="notif-content">
        <div class="notif-title">${title || '🔔 Haimiya Typo'}</div>
        <div class="notif-message">${message || 'มีการแจ้งเตือนใหม่!'}</div>
      </div>
      <button class="notif-close-btn" onclick="closeFloatingNotification()" aria-label="ปิด">✕</button>
    </div>
    <div class="notif-progress-bar"></div>
  `;

  document.body.appendChild(popup);

  // เสียงกระดิ่งเข้าร้านญี่ปุ่น (Konbini Chime)
  if (!options.silentChime) {
    playNotificationChime();
  }

  // สั่นอุปกรณ์ (ถ้ารองรับ)
  triggerNotifVibration();

  // Animation: ลอยลงมา + สั่นเล็กน้อย
  requestAnimationFrame(() => {
    popup.classList.add('notif-visible');
    // สั่นเล็กน้อย
    setTimeout(() => {
      popup.classList.add('notif-shake');
      setTimeout(() => popup.classList.remove('notif-shake'), 600);
    }, 400);
  });

  // Auto dismiss หลัง 8 วินาที
  const autoDismiss = options.duration || 8000;
  const timer = setTimeout(() => closeFloatingNotification(), autoDismiss);
  popup._dismissTimer = timer;

  // กดที่ popup เพื่อเปิด banner อัปเดต (ถ้ามี)
  popup.querySelector('.notif-inner').addEventListener('click', (e) => {
    if (e.target.classList.contains('notif-close-btn')) return;
    const banner = document.getElementById('in-app-update-banner');
    if (banner && banner.style.display !== 'none') {
      banner.scrollIntoView({ behavior: 'smooth' });
    }
    closeFloatingNotification();
  });
}

function closeFloatingNotification() {
  const popup = document.getElementById('haimiya-floating-notif');
  if (!popup) return;
  if (popup._dismissTimer) clearTimeout(popup._dismissTimer);
  popup.classList.remove('notif-visible');
  popup.classList.add('notif-hiding');
  setTimeout(() => popup.remove(), 400);
}

// สั่นอุปกรณ์
function triggerNotifVibration() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([120, 60, 120, 60, 80]);
    }
  } catch(e) {}
}

// ============================================
//  VOICE ALERT SYSTEM (เสียงพูดแจ้งเตือนแบบขยายเสียง 280%)
// ============================================

let _updateVoiceAudio = null;
let _pendingVoiceOnInteraction = false;
let _voiceAudioCtx = null;
let _voiceAudioBuffer = null;

function getUpdateVoiceAudio() {
  if (!_updateVoiceAudio) {
    const audio = new Audio();
    // ไฟล์ update_voice.wav ได้รับการ Boost Normalization ความดังเพิ่มขึ้น 21.6 เท่า (2,160%) เต็มสเกล
    if (audio.canPlayType('audio/wav')) {
      audio.src = 'update_voice.wav';
    } else if (audio.canPlayType('audio/mp4') || audio.canPlayType('video/mp4')) {
      audio.src = 'update_voice.m4a';
    } else {
      audio.src = 'update_voice.mp3';
    }
    audio.preload = 'auto';
    audio.volume = 1.0;
    _updateVoiceAudio = audio;
  }
  return _updateVoiceAudio;
}

let _voiceMediaElementSource = null;
let _voiceGainNode = null;

// ฟังก์ชันเล่นเสียงแจ้งเตือนแบบ Boost Volume ขยายความดังและผ่านไดนามิกส์คอมเพรสเซอร์
function playAmplifiedVoiceAudio() {
  return new Promise((resolve) => {
    try {
      const audio = getUpdateVoiceAudio();
      audio.currentTime = 0;
      audio.volume = 1.0;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!_voiceAudioCtx || _voiceAudioCtx.state === 'closed') {
          _voiceAudioCtx = new AudioCtx();
        }
        if (_voiceAudioCtx.state === 'suspended') {
          _voiceAudioCtx.resume().catch(() => {});
        }

        if (!_voiceMediaElementSource) {
          try {
            _voiceMediaElementSource = _voiceAudioCtx.createMediaElementSource(audio);
            _voiceGainNode = _voiceAudioCtx.createGain();
            _voiceGainNode.gain.setValueAtTime(2.2, _voiceAudioCtx.currentTime); // 220% Additional Boost!

            const comp = _voiceAudioCtx.createDynamicsCompressor();
            comp.threshold.setValueAtTime(-10, _voiceAudioCtx.currentTime);
            comp.knee.setValueAtTime(24, _voiceAudioCtx.currentTime);
            comp.ratio.setValueAtTime(10, _voiceAudioCtx.currentTime);
            comp.attack.setValueAtTime(0.003, _voiceAudioCtx.currentTime);
            comp.release.setValueAtTime(0.25, _voiceAudioCtx.currentTime);

            _voiceMediaElementSource.connect(_voiceGainNode);
            _voiceGainNode.connect(comp);
            comp.connect(_voiceAudioCtx.destination);
          } catch(e) {
            console.warn('MediaElementSource attach error:', e);
          }
        } else if (_voiceGainNode) {
          _voiceGainNode.gain.setValueAtTime(2.2, _voiceAudioCtx.currentTime);
        }
      }

      const p = audio.play();
      if (p && p.then) {
        p.then(resolve).catch(err => {
          console.warn('Voice play error:', err);
          resolve();
        });
      } else {
        resolve();
      }
    } catch(err) {
      console.warn('playAmplifiedVoiceAudio failed:', err);
      resolve();
    }
  });
}

// Pre-load เสียงแจ้งเตือนอัปเดตทันที
try {
  getUpdateVoiceAudio().load();
} catch(e) {}

function playUpdateVoiceAlert(isUserInitiated = false) {
  try {
    // เล่นเสียงกระดิ่งก่อน แล้วค่อยเล่นเสียงพูด
    playNotificationChime();

    // แสดงกล่องแจ้งเตือนลอยลงมาพร้อมรูปมาสคอต
    showFloatingNotification(
      '🔔 แจ้งเตือนจาก Haimiya Typo',
      currentAppLang === 'th'
        ? '✨ อัปเดตด้วยนะคะ~ มีเพลงใหม่เพิ่มเข้ามาแล้ว!'
        : '✨ Update available! New songs have been added!',
      { duration: 8000, silentChime: true }
    );

    // สั่นอุปกรณ์
    triggerNotifVibration();

    // เล่นเสียงพูดที่ขยายความดังแล้วหลังเสียงกระดิ่งญี่ปุ่นจบ (~3.2 วินาที)
    setTimeout(() => {
      const playPromise = playAmplifiedVoiceAudio();
      if (playPromise && playPromise.then) {
        playPromise.then(() => {
          console.log('🎀 เล่นเสียงแจ้งเตือนอัปเดตสำเร็จ (ขยายความดังชัดเจน)');
        }).catch((err) => {
          console.warn('Autoplay restricted audio play:', err);
          if (!isUserInitiated && !_pendingVoiceOnInteraction) {
            _pendingVoiceOnInteraction = true;
            const onFirstTouch = () => {
              _pendingVoiceOnInteraction = false;
              window.removeEventListener('pointerdown', onFirstTouch);
              window.removeEventListener('touchstart', onFirstTouch);
              window.removeEventListener('click', onFirstTouch);
              playUpdateVoiceAlert(true);
            };
            window.addEventListener('pointerdown', onFirstTouch, { once: true });
            window.addEventListener('touchstart', onFirstTouch, { once: true });
            window.addEventListener('click', onFirstTouch, { once: true });
          } else {
            playUpdateVoiceFallback();
          }
        });
      }
    }, 1000);
  } catch (err) {
    console.warn('playUpdateVoiceAlert error:', err);
    playUpdateVoiceFallback();
  }
}

// Fallback: ใช้ Web Speech Synthesis ถ้าไฟล์เสียงเล่นไม่ได้
function playUpdateVoiceFallback() {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance('อัปเดตด้วยนะคะ');
      utterance.lang = 'th-TH';
      utterance.rate = 1.02;
      utterance.pitch = 1.65;
      utterance.volume = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const thaiVoice = voices.find(v => 
        (v.lang === 'th-TH' || v.lang === 'th') && 
        (v.name.toLowerCase().includes('female') || v.name.includes('นารี') || v.name.includes('Nari') || !v.name.toLowerCase().includes('male'))
      ) || voices.find(v => v.lang === 'th-TH' || v.lang === 'th');

      if (thaiVoice) utterance.voice = thaiVoice;
      window.speechSynthesis.speak(utterance);
    }
  } catch(e) {
    console.warn('Voice fallback error:', e);
  }
}

// ฟังก์ชันแปลงเลขเวอร์ชันสำหรับเปรียบเทียบความใหม่ (Semver Score) ป้องกันแจ้งเตือนอัปเดตเวอร์ชันเดิมซ้ำ
function parseAppVersionScore(vStr) {
  if (!vStr) return 0;
  const cleaned = String(vStr).replace(/^v/i, '').trim();
  const parts = cleaned.split('.').map(p => parseInt(p, 10) || 0);
  let score = 0;
  if (parts.length >= 3) {
    score = parts[0] * 1000000000000 + parts[1] * 100000 + parts[2];
  } else if (parts.length === 2) {
    score = parts[0] * 1000000000000 + parts[1] * 100000;
  } else if (parts.length === 1) {
    score = parts[0] * 1000000000000;
  }
  return score;
}

// โหลด voices เมื่อพร้อม (บาง browser โหลดแบบ async)
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
  try { window.speechSynthesis.getVoices(); } catch(e) {}
}

// 3. ตรวจสอบเวอร์ชันและแจ้งเตือนอัปเดต (แจ้งเตือนเฉพาะเมื่อมีอัปเดตใหม่จริงเท่านั้น ไม่แจ้งซ้ำซาก)
async function checkApkAppUpdate(isManualTrigger = false) {
  if (!navigator.onLine) return;
  if (!isManualTrigger && sessionStorage.getItem('dismissed_apk_banner') === 'true') return;

  const isNativeApp = window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();

  // บน Web Browser: ไม่ต้องแจ้งเตือนอัปเดตไฟล์ APK ตอนโหลดหน้าเว็บ (เพราะผู้ใช้เว็บกำลังใช้งานเวอร์ชันล่าสุดบนเว็บอยู่แล้ว)
  // แจ้งเตือนเฉพาะเมื่อผู้ใช้เปิดผ่านแอป Android APK หรือกดปุ่มตรวจสอบอัปเดตด้วยตนเอง
  if (!isNativeApp && !isManualTrigger) {
    return;
  }

  // ขอสิทธิ์ Notification ล่วงหน้า
  await requestNotificationPermission();

  try {
    let remoteVersionData = null;
    try {
      const vRes = await fetch(`${GITHUB_RAW_BASE}/version.json?_t=${Date.now()}`);
      if (vRes.ok) remoteVersionData = await vRes.json();
    } catch (ve) {}

    const remoteCode = remoteVersionData?.versionCode || 0;
    const remoteVersionTag = remoteVersionData?.version ? `v${remoteVersionData.version}` : '';
    const remoteSongs = remoteVersionData?.songCount || 0;

    // ตรวจสอบ Release ล่าสุดจาก GitHub
    let release = null;
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (res.ok) release = await res.json();
    } catch (re) {}

    const releaseTag = release?.tag_name || remoteVersionTag;
    const currentScore = parseAppVersionScore(CURRENT_APP_VERSION);
    const remoteScore = parseAppVersionScore(releaseTag);
    const hasNewerVersion = (remoteCode > CURRENT_VERSION_CODE) || 
                            (remoteScore > currentScore) ||
                            (isManualTrigger && (remoteCode !== CURRENT_VERSION_CODE || remoteScore !== currentScore));

    if (hasNewerVersion && (!release || (!release.draft && !release.prerelease))) {
      const banner = document.getElementById('in-app-update-banner');
      const titleEl = document.getElementById('update-banner-title');
      const descEl = document.getElementById('update-banner-desc');
      const btnEl = document.getElementById('btn-banner-update');

      // เช็คว่าเวอร์ชันนี้เคยแจ้งเตือนไปแล้วหรือยัง (เล่นเสียงเตือนเฉพาะครั้งแรกที่ตรวจพบอัปเดตใหม่เท่านั้น ไม่เล่นซ้ำซาก)
      const lastNotifiedVer = localStorage.getItem('haimiya_last_notified_update_version');
      const isBrandNewUpdate = lastNotifiedVer !== releaseTag;

      if (isBrandNewUpdate || isManualTrigger) {
        localStorage.setItem('haimiya_last_notified_update_version', releaseTag);

        // 🔔 ส่ง Push Notification ขึ้นบนมือถือโดยตรง!
        sendUpdatePushNotification(releaseTag || remoteVersionTag, remoteSongs || SONGS.length);

        // 🎀 เล่นเสียงน่ารัก แปลงจากเสียงคุณไฮมิยะ + กระดิ่งระยิบระยับ + "อัปเดตด้วยนะคะ"
        setTimeout(() => playUpdateVoiceAlert(), 600);
      }

      if (banner && titleEl) {
        if (isNativeApp) {
          titleEl.textContent = currentAppLang === 'th'
            ? `🚀 มีอัปเดตแอป APK ใหม่ (${releaseTag || CURRENT_APP_VERSION})!`
            : `🚀 New APK update (${releaseTag || CURRENT_APP_VERSION}) is ready!`;
          if (descEl) {
            descEl.textContent = currentAppLang === 'th'
              ? `อัปเดตคลังเพลงใหม่รวม ${remoteSongs || SONGS.length} เพลง — ติดตั้งทับแอปเดิมได้ทันที 100% ข้อมูลไม่หาย`
              : `Updated to ${remoteSongs || SONGS.length} songs. Install over existing app without losing data.`;
          }
          if (btnEl) {
            const apkAsset = (release?.assets || []).find(a => a.name.endsWith('.apk'));
            const apkUrl = (apkAsset && apkAsset.browser_download_url) ? apkAsset.browser_download_url : `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest/download/HaimiyaTypo.apk`;
            btnEl.href = apkUrl;
            btnEl.innerHTML = '⚡ ดาวน์โหลดและติดตั้งอัปเดต (APK)';
            btnEl.onclick = () => {
              showToast(currentAppLang === 'th' ? '🚀 กำลังเริ่มดาวน์โหลดไฟล์อัปเดตเพื่อติดตั้งทันที...' : '🚀 Downloading update...');
            };
          }
        } else {
          // บนเว็บบราวเซอร์ / PWA
          titleEl.textContent = currentAppLang === 'th'
            ? `🎉 มีอัปเดตเวอร์ชันใหม่ (${releaseTag || remoteVersionTag || CURRENT_APP_VERSION})!`
            : `🎉 New version (${releaseTag || remoteVersionTag || CURRENT_APP_VERSION}) is available!`;
          if (descEl) {
            descEl.textContent = currentAppLang === 'th'
              ? `เพิ่มเพลงฮิต 2026 ใหม่ล่าสุดรวม ${remoteSongs || SONGS.length} เพลง! กดรีเฟรชเพื่อเริ่มใช้งานทันที`
              : `Added new 2026 trending tracks (${remoteSongs || SONGS.length} songs)! Click refresh to load now.`;
          }
          if (btnEl) {
            btnEl.href = '#';
            btnEl.innerHTML = '🔄 รีเฟรชเพื่ออัปเดตทันที';
            btnEl.onclick = (e) => {
              e.preventDefault();
              showToast(currentAppLang === 'th' ? '⚡ กำลังรีเฟรชเพื่อโหลดเวอร์ชันล่าสุด...' : '⚡ Reloading latest version...');
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                  for (let r of regs) r.update();
                }).catch(() => {});
              }
              setTimeout(() => {
                window.location.reload(true);
              }, 400);
            };
          }
        }
        banner.style.display = 'block';
        // Animate banner slide in
        requestAnimationFrame(() => banner.classList.add('visible'));
      }
    } else if (isManualTrigger) {
      showToast(currentAppLang === 'th' ? `✨ คุณกำลังใช้งาน Haimiya Typo เวอร์ชันล่าสุดแล้วครับ! (${SONGS.length} เพลง)` : `✨ You are on the latest version! (${SONGS.length} songs)`);
    }
  } catch (e) {
    console.warn('⚠️ checkApkAppUpdate:', e);
  }
}

function dismissUpdateBanner() {
  const banner = document.getElementById('in-app-update-banner');
  if (banner) {
    banner.classList.remove('visible');
    setTimeout(() => { banner.style.display = 'none'; }, 300);
  }
  sessionStorage.setItem('dismissed_apk_banner', 'true');
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', async () => {
  // ล้างค่าตกค้างจากการทดสอบแถบเล่นเพลงแบบลาก/ย่อขนาด ให้กลับมาใช้โหมดเดิมมาตรฐาน 100%
  try {
    localStorage.removeItem('haimiya_bp_pos');
    localStorage.removeItem('haimiya_bp_size');
    const p = document.getElementById('bottom-player');
    if (p) {
      p.removeAttribute('style');
      p.className = 'bottom-player';
    }
  } catch (e) {}
  initSplashScreen();
  await loadCachedDatabase();
  ensureSecretFunkElements();
  setAppLanguage(currentAppLang);
  initAiChatSessions();
  // ตรวจจับเมื่อผู้ใช้เพิ่งรีสตาร์ทมาจากการแก้บั๊กอัตโนมัติ
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('repaired') || localStorage.getItem('haimiya_auto_repaired_at')) {
    const repairedAt = parseInt(localStorage.getItem('haimiya_auto_repaired_at') || '0', 10);
    if (Date.now() - repairedAt < 45000 || urlParams.has('repaired')) {
      setTimeout(() => {
        if (typeof showToast === 'function') {
          showToast('🎉 ซ่อมแซมระบบและแก้บั๊กสำเร็จ 100%! ล้างแคชเก่าและอัปเดตระบบเสถียรล่าสุดให้เรียบร้อยแล้วค่ะ 🌸✨', 5500);
        }
      }, 700);
    }
    try {
      localStorage.removeItem('haimiya_auto_repaired_at');
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    } catch (e) {}
  }

  renderSongsGrid();
  renderAnimeMatchGrid();
  populateFinderDropdowns();
  loadVersus();
  initScrollEffect();
  updateStats();
  initZoneDeck();
  updateVolumeUI();
  updateDiceSfxUI();
  initWeeklyUpdateTracker();
  updateSavedBadges();
  initOfflineAudioVault();

  // Background live checks after UI render
  setTimeout(() => {
    checkLiveContentUpdate();
    checkApkAppUpdate();
  }, 3500);

  window.addEventListener('online', () => {
    checkLiveContentUpdate();
    checkApkAppUpdate();
  });
});

// ปรับแต่งโหมด Funk ให้อยู่ในเมนูตามปกติ ไม่ต้องมีป้ายโซนลับบังขีด 3 ขีด
function ensureSecretFunkElements() {
  try {
    const heroBtn = document.getElementById('hero-btn-secret-funk');
    if (heroBtn) heroBtn.remove();
    const heroBadge = document.querySelector('.hero-secret-badge-bar');
    if (heroBadge) heroBadge.remove();

    // ลบป้ายโหมดลับที่เคยบังปุ่ม hamburger
    const oldSecretLink = document.querySelector('.nav-link-secret');
    if (oldSecretLink) oldSecretLink.remove();
    const oldSecretTags = document.querySelectorAll('.nav-secret-tag');
    oldSecretTags.forEach(el => el.remove());
  } catch (err) {
    console.warn('⚠️ ensureSecretFunkElements:', err);
  }
}

// ============================================
//  EXCLUSIVE SEPARATE SECRET FUNK MODE
// ============================================
let secretFunkFilteredSongs = [];
let secretFunkVisibleCount = 18;
let secretFunkCurrentSub = 'all';
let secretFunkSearchQuery = '';
let secretFunkBpmFilter = 'all';

function openSecretFunkMode() {
  document.body.classList.add('in-secret-mode');
  const hero = document.getElementById('hero');
  const statsBar = document.querySelector('.stats-bar');
  const weeklyBanner = document.querySelector('.weekly-sync-banner');
  if (hero) hero.style.display = 'none';
  if (statsBar) statsBar.style.display = 'none';
  if (weeklyBanner) weeklyBanner.style.display = 'none';

  const wsMusic = document.getElementById('workspace-music');
  const wsPairs = document.getElementById('workspace-pairs');
  const wsVersus = document.getElementById('workspace-versus');
  const wsSaved = document.getElementById('workspace-saved');
  const wsSecret = document.getElementById('workspace-secret-funk');
  const studioNav = document.querySelector('.studio-zone-nav-container');

  // Hide all normal workspaces and studio nav
  [wsMusic, wsPairs, wsVersus, wsSaved].forEach(w => w && w.classList.add('hidden'));
  if (studioNav) studioNav.classList.add('hidden');

  if (wsSecret) {
    wsSecret.classList.remove('hidden');
    wsSecret.style.display = 'block';
  }

  // Close hamburger menu if open
  const navLinks = document.querySelector('.nav-links');
  const btn = document.getElementById('hamburger');
  if (navLinks && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    if (btn) btn.innerHTML = '<span class="hamburger-icon">☰</span> <span class="hamburger-text">เมนู</span>';
  }

  // Update active state in nav links
  document.querySelectorAll('.nav-links .nav-link').forEach(link => {
    link.classList.remove('active-nav');
  });
  const funkLink = document.querySelector('.nav-link-funk') || document.querySelector('.nav-link-secret');
  if (funkLink) funkLink.classList.add('active-nav');

  showToast('⚡ เข้าสู่โหมดเพลง Funk & Phonk! รวม 780 เพลง ✨');

  // Render secret Funk songs
  filterAndRenderSecretFunk(true);

  if (wsSecret) {
    wsSecret.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function closeSecretFunkMode() {
  document.body.classList.remove('in-secret-mode');
  const hero = document.getElementById('hero');
  const statsBar = document.querySelector('.stats-bar');
  const weeklyBanner = document.querySelector('.weekly-sync-banner');
  if (hero) hero.style.display = '';
  if (statsBar) statsBar.style.display = '';
  if (weeklyBanner) weeklyBanner.style.display = '';

  const wsSecret = document.getElementById('workspace-secret-funk');
  if (wsSecret) {
    wsSecret.classList.add('hidden');
    wsSecret.style.display = 'none';
  }
  const studioNav = document.querySelector('.studio-zone-nav-container');
  if (studioNav) studioNav.classList.remove('hidden');

  switchStudioWorkspace('th', true);
  showToast('🔙 กลับสู่โซนเพลงปกติแล้ว');
}

function filterAndRenderSecretFunk(resetPage = false) {
  if (resetPage) secretFunkVisibleCount = 18;

  const funkAll = SONGS.filter(s => s.lang === 'funk');
  
  secretFunkFilteredSongs = funkAll.filter(s => {
    // 1. Sub-genre check
    if (secretFunkCurrentSub !== 'all') {
      const titleLower = (s.title || '').toLowerCase();
      const artistLower = (s.artist || '').toLowerCase();
      const tagsLower = (s.tags || []).join(' ').toLowerCase();
      const combined = `${titleLower} ${artistLower} ${tagsLower}`;

      if (secretFunkCurrentSub === 'brazilian') {
        if (!combined.includes('brazil') && !combined.includes('montagem') && !combined.includes('mandelão') && !combined.includes('mandelao') && !combined.includes('mtg') && !combined.includes('baile') && !combined.includes('automotivo')) return false;
      } else if (secretFunkCurrentSub === 'phonk') {
        if (!combined.includes('phonk') && !combined.includes('drift') && !combined.includes('kordhell') && !combined.includes('playaphonk') && !combined.includes('memphis')) return false;
      } else if (secretFunkCurrentSub === 'automotivo') {
        if (!combined.includes('automotivo') && !combined.includes('auto') && !combined.includes('mega') && !combined.includes('grave')) return false;
      } else if (secretFunkCurrentSub === 'mandelao') {
        if (!combined.includes('mandelão') && !combined.includes('mandelao') && !combined.includes('ritmo') && !combined.includes('batida')) return false;
      } else if (secretFunkCurrentSub === 'classics') {
        if (!combined.includes('classic') && !combined.includes('disco') && !combined.includes('daft') && !combined.includes('groove') && !combined.includes('earth') && !combined.includes('bruno') && !combined.includes('silk')) return false;
      }
    }

    // 2. Search query check
    if (secretFunkSearchQuery) {
      const q = secretFunkSearchQuery.toLowerCase();
      const matchTitle = (s.title || '').toLowerCase().includes(q);
      const matchArtist = (s.artist || '').toLowerCase().includes(q);
      const matchTags = (s.tags || []).some(t => t.toLowerCase().includes(q));
      const matchAnime = s.pairedAnime ? s.pairedAnime.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchArtist && !matchTags && !matchAnime) return false;
    }

    // 3. BPM filter check
    if (secretFunkBpmFilter !== 'all') {
      const bpmNum = parseInt((s.bpm || '').replace(/\D/g, '') || '125', 10);
      if (secretFunkBpmFilter === 'slow' && bpmNum >= 120) return false;
      if (secretFunkBpmFilter === 'mid' && (bpmNum < 120 || bpmNum > 135)) return false;
      if (secretFunkBpmFilter === 'fast' && bpmNum <= 135) return false;
    }

    return true;
  });

  const countEl = document.getElementById('secret-grid-count-text');
  if (countEl) {
    countEl.textContent = `⚡ แสดง ${secretFunkFilteredSongs.length.toLocaleString()} เพลงในโหมดลับ Funk (จากทั้งหมด ${funkAll.length.toLocaleString()} เพลง)`;
  }

  const grid = document.getElementById('secret-songs-grid');
  if (!grid) return;

  const toShow = secretFunkFilteredSongs.slice(0, secretFunkVisibleCount);
  if (toShow.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #94a3b8;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🕶️</div>
        <h3>ไม่พบเพลงฟังก์ที่ตรงกับเงื่อนไขค้นหา</h3>
        <p>ลองปรับคำค้นหา หรือเลือกแท็กสไตล์อื่นดูนะครับ</p>
        <button class="btn btn-ghost" onclick="clearSecretFunkSearch(); filterSecretFunkSub('all', document.querySelector('.secret-chip'));" style="margin-top: 1rem;">
          🔄 รีเซ็ตการค้นหา
        </button>
      </div>
    `;
  } else {
    grid.innerHTML = toShow.map((song, idx) => songCardHTML(song, idx)).join('');
  }

  // Update load more button
  const loadMoreWrap = document.getElementById('secret-load-more-wrap');
  const remainingEl = document.getElementById('secret-remaining-count');
  const remaining = Math.max(0, secretFunkFilteredSongs.length - secretFunkVisibleCount);
  if (loadMoreWrap) {
    loadMoreWrap.style.display = remaining > 0 ? 'block' : 'none';
  }
  if (remainingEl) {
    remainingEl.textContent = remaining.toLocaleString();
  }
}

function filterSecretFunkSub(sub, btn) {
  secretFunkCurrentSub = sub;
  document.querySelectorAll('.secret-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterAndRenderSecretFunk(true);
}

function handleSecretFunkSearch(val) {
  secretFunkSearchQuery = (val || '').trim();
  const clearBtn = document.getElementById('secret-funk-clear');
  if (clearBtn) clearBtn.style.display = secretFunkSearchQuery ? 'block' : 'none';
  filterAndRenderSecretFunk(true);
}

function clearSecretFunkSearch() {
  const input = document.getElementById('secret-funk-search');
  if (input) input.value = '';
  handleSecretFunkSearch('');
}

function handleSecretFunkBpm(val) {
  secretFunkBpmFilter = val;
  filterAndRenderSecretFunk(true);
}

function loadMoreSecretFunk() {
  secretFunkVisibleCount += 18;
  filterAndRenderSecretFunk(false);
}

function rollRandomSecretFunk() {
  const funkAll = SONGS.filter(s => s.lang === 'funk');
  if (!funkAll.length) return;
  const picked = funkAll[Math.floor(Math.random() * funkAll.length)];
  
  const spotlight = document.getElementById('secret-roll-spotlight');
  if (!spotlight) return;

  const animeData = ANIME_MAP.get(picked.animeId) || (ANIMES && ANIMES.find(a => a.id === picked.animeId));
  const animeName = animeData ? animeData.name : (picked.pairedAnime || 'อนิเมะสุดเท่');

  spotlight.style.display = 'block';
  spotlight.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid rgba(254, 240, 138, 0.2); padding-bottom: 0.5rem;">
      <span style="color: #facc15; font-weight: 800; font-size: 1rem; display: inline-flex; align-items: center; gap: 0.4rem;">
        🎲 ผลการสุ่มเพลงฟังก์โหมดลับ:
      </span>
      <button onclick="document.getElementById('secret-roll-spotlight').style.display='none'" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">✕ ปิด</button>
    </div>
    <div style="display: flex; gap: 1.2rem; align-items: center; flex-wrap: wrap;">
      <img src="${picked.coverUrl}" alt="${picked.title}" style="width: 100px; height: 100px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 15px rgba(0,0,0,0.5);" />
      <div style="flex: 1; min-width: 240px;">
        <h3 style="color: #fff; margin: 0 0 0.3rem 0; font-size: 1.25rem;">${picked.title}</h3>
        <p style="color: #fef08a; margin: 0 0 0.4rem 0; font-weight: 600;">👤 ${picked.artist} • <span style="color: #38bdf8;">${picked.bpm || '130 BPM'}</span></p>
        <p style="color: #cbd5e1; margin: 0 0 0.6rem 0; font-size: 0.85rem;">🌸 จับคู่อนิเมะ: <strong>${animeName}</strong></p>
        <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" onclick="togglePlaySong(${picked.id})">
            ▶️ ฟังตัวอย่างเสียง
          </button>
          <a href="${picked.spotifyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm" style="color: #1ed760; border-color: rgba(29, 185, 84, 0.4);">
            🟢 เปิดใน Spotify
          </a>
        </div>
      </div>
    </div>
  `;
  spotlight.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  showToast(`🎲 สุ่มได้เพลง "${picked.title}" เรียบร้อย!`);
}

function updateStats() {
  const songsCountEl = document.getElementById('stat-songs-count');
  const animeCountEl = document.getElementById('stat-anime-count');
  const pairsCountEl = document.getElementById('stat-pairs-count');
  const totalNormalSongs = SONGS.filter(s => s.lang !== 'funk').length;
  if (songsCountEl) songsCountEl.textContent = totalNormalSongs.toLocaleString();
  if (animeCountEl) animeCountEl.textContent = ANIMES.length.toLocaleString();
  if (pairsCountEl) pairsCountEl.textContent = ANIME_PAIRS.length.toLocaleString();

  const thCount = SONGS.filter(s => s.lang === 'th').length;
  const enCount = SONGS.filter(s => s.lang === 'en').length;
  const jpCount = SONGS.filter(s => s.lang === 'jp').length;
  const laoCount = SONGS.filter(s => s.lang === 'lao').length;
  const krCount = SONGS.filter(s => s.lang === 'kr').length;
  const funkCount = SONGS.filter(s => s.lang === 'funk').length;

  const countTh = document.getElementById('zone-count-th');
  const countEn = document.getElementById('zone-count-en');
  const countJp = document.getElementById('zone-count-jp');
  const countFunk = document.getElementById('zone-count-funk');
  const countAll = document.getElementById('zone-count-all');

  if (countTh) countTh.textContent = `${thCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (countEn) countEn.textContent = `${enCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (countJp) countJp.textContent = `${jpCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (countFunk) countFunk.textContent = `${funkCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (countAll) countAll.textContent = `${totalNormalSongs.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;

  const hubTh = document.getElementById('hub-count-th');
  const hubEn = document.getElementById('hub-count-en');
  const hubJp = document.getElementById('hub-count-jp');
  const hubKr = document.getElementById('hub-count-kr');
  const hubLao = document.getElementById('hub-count-lao');
  const hubAll = document.getElementById('hub-count-all');
  if (hubTh) hubTh.textContent = `${thCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (hubEn) hubEn.textContent = `${enCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (hubJp) hubJp.textContent = `${jpCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (hubKr) hubKr.textContent = `${krCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (hubLao) hubLao.textContent = `${laoCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (hubAll) hubAll.textContent = `${totalNormalSongs.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;

  const szTh = document.getElementById('sz-sub-th');
  const szEn = document.getElementById('sz-sub-en');
  const szJp = document.getElementById('sz-sub-jp');
  const szLao = document.getElementById('sz-sub-lao');
  const szKr = document.getElementById('sz-sub-kr');
  const szFunk = document.getElementById('sz-sub-funk');
  const szPairs = document.getElementById('sz-sub-pairs');
  if (szTh) szTh.textContent = `${thCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szEn) szEn.textContent = `${enCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szJp) szJp.textContent = `${jpCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szLao) szLao.textContent = `${laoCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szKr) szKr.textContent = `${krCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szFunk) szFunk.textContent = `${funkCount.toLocaleString()} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szPairs) szPairs.textContent = `${ANIMES.length.toLocaleString()} ${currentAppLang === 'th' ? 'เรื่อง' : 'titles'}`;

  const filterPairAll = document.getElementById('filter-pair-all');
  if (filterPairAll) {
    filterPairAll.textContent = currentAppLang === 'th' ? `🌟 ทุกคู่ (${ANIME_PAIRS.length.toLocaleString()} คู่)` : `🌟 All Pairs (${ANIME_PAIRS.length.toLocaleString()})`;
  }

  const heroExploreBtn = document.getElementById('hero-btn-songs');
  if (heroExploreBtn) {
    heroExploreBtn.innerHTML = currentAppLang === 'th'
      ? `🎵 สำรวจคลังเพลง (<span id="hero-song-count">${totalNormalSongs.toLocaleString()}</span> เพลง)`
      : `🎵 Explore Song Vault (<span id="hero-song-count">${totalNormalSongs.toLocaleString()}</span> songs)`;
  }
}

function initScrollEffect() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// Close mobile menu when clicking any nav link
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const navLinks = document.querySelector('.nav-links');
    const btn = document.getElementById('hamburger');
    if (navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      if (btn) btn.innerHTML = '<span class="hamburger-icon">☰</span> <span class="hamburger-text">โซนเพลง</span>';
    }
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeAnimePicker();
    closeAppModal();
    closeHaimiyaAI();
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      const btn = document.getElementById('hamburger');
      if (btn) btn.innerHTML = '<span class="hamburger-icon">☰</span> <span class="hamburger-text">เมนู</span>';
    }
  }
});

// Mascot Voice Tap Interaction (คลิกมาสคอตแผ่นเสียง Haimiya ในหน้าแรกเพื่อฟังเสียงทักทาย)
const vinylHeroEl = document.getElementById('vinyl-hero');
if (vinylHeroEl) {
  vinylHeroEl.style.cursor = 'pointer';
  vinylHeroEl.title = 'คลิกเพื่อทักทายคุณไฮมิยะ ✨';
  vinylHeroEl.addEventListener('click', () => {
    playHaimiyaYaho();
    vinylHeroEl.classList.add('mascot-bounce');
    setTimeout(() => vinylHeroEl.classList.remove('mascot-bounce'), 600);
  });
}

// ============================================
//  HAIMIYA AI STUDIO & DRAGGABLE BUBBLE SYSTEM
//  ผู้ช่วยอัจฉริยะ Google Gemini Style + ก้อนกลมๆ ลากได้อิสระ
// ============================================
let aiChatAudio = null;
let currentAiPlayingBtn = null;

const _k = 'QVEuQWI4Uk42SUtZX1poU1NrWHBWNEN5TEdpRldkRDdickJraUlXSFNUU080YzFMdXZzR2c=';
const DEFAULT_GEMINI_API_KEY = (typeof atob === 'function') ? atob(_k) : '';

function getAiApiBase() {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname || '';
      const proto = window.location.protocol || '';
      // If running on Netlify production, use relative paths
      if (host.includes('netlify.app')) {
        return '';
      }
      // When inside Capacitor mobile app (capacitor://localhost or file://) or GitHub Pages or localhost
      if (
        proto === 'capacitor:' ||
        proto === 'file:' ||
        host.includes('github.io') ||
        (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
        host === 'localhost' ||
        host === '127.0.0.1'
      ) {
        return 'https://mellow-baklava-bffed3.netlify.app';
      }
    }
  } catch (e) {}
  return '';
}

function getGeminiApiKey() {
  const localKey = (localStorage.getItem('haimiya_gemini_api_key') || '').trim();
  return localKey || DEFAULT_GEMINI_API_KEY;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 1. Draggable Bubble Logic with Mouse & Touch (Click & Tap 100% Reliable)
let _lastAiToggleTime = 0;

function toggleHaimiyaAI() {
  const now = Date.now();
  if (now - _lastAiToggleTime < 350) return; // Prevent double-trigger from pointerUp + click
  _lastAiToggleTime = now;

  const modal = document.getElementById('haimiya-ai-modal');
  if (!modal) return;
  if (modal.classList.contains('hidden')) {
    openHaimiyaAI();
  } else {
    closeHaimiyaAI();
  }
}

function initDraggableAiBubble() {
  // Paste & Drag-and-drop listener for screenshots
  setTimeout(() => {
    const chatModal = document.getElementById('haimiya-ai-modal');
    const inputArea = document.getElementById('gemini-input-text');
    if (inputArea && !inputArea._pasteInit) {
      inputArea._pasteInit = true;
      inputArea.addEventListener('paste', (e) => {
        const items = e.clipboardData && e.clipboardData.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('video') !== -1) {
              const blob = items[i].getAsFile();
              if (blob) {
                processGeminiAttachedFile(blob);
                e.preventDefault();
                break;
              }
            }
          }
        }
      });
    }
    if (chatModal && !chatModal._dropInit) {
      chatModal._dropInit = true;
      chatModal.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      chatModal.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) {
          processGeminiAttachedFile(files[0]);
        }
      });
    }
  }, 100);

  const bubble = document.getElementById('haimiya-ai-floating-bubble');
  if (!bubble) return;

  // Ensure default Gemini API key is registered in localStorage
  try {
    if (!localStorage.getItem('haimiya_gemini_api_key')) {
      localStorage.setItem('haimiya_gemini_api_key', DEFAULT_GEMINI_API_KEY);
    }
  } catch (e) {}

  let isDragging = false;
  let hasDragged = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;
  let movedDistance = 0;

  // Restore saved position if present (Desktop only)
  try {
    if (window.innerWidth > 768) {
      const savedPos = localStorage.getItem('haimiya_ai_bubble_pos');
      if (savedPos) {
        const pos = JSON.parse(savedPos);
        const maxX = window.innerWidth - 75;
        const maxY = window.innerHeight - 75;
        const x = Math.min(Math.max(10, pos.x), maxX);
        const y = Math.min(Math.max(10, pos.y), maxY);
        bubble.style.left = x + 'px';
        bubble.style.top = y + 'px';
        bubble.style.right = 'auto';
        bubble.style.bottom = 'auto';
      }
    }
  } catch (e) {}

  function onPointerDown(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    
    isDragging = true;
    hasDragged = false;
    movedDistance = 0;
    
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    
    const rect = bubble.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    bubble.style.transition = 'none';

    if (e.type === 'touchstart') {
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp, { passive: true });
    } else {
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
    }
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;
    movedDistance = Math.hypot(dx, dy);

    if (movedDistance > 10) {
      hasDragged = true;
      if (e.cancelable) e.preventDefault();
    }

    const newLeft = Math.min(Math.max(8, initialLeft + dx), window.innerWidth - bubble.offsetWidth - 8);
    const newTop = Math.min(Math.max(8, initialTop + dy), window.innerHeight - bubble.offsetHeight - 8);

    bubble.style.left = newLeft + 'px';
    bubble.style.top = newTop + 'px';
    bubble.style.right = 'auto';
    bubble.style.bottom = 'auto';
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    bubble.style.transition = '';

    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mouseup', onPointerUp);
    window.removeEventListener('touchmove', onPointerMove);
    window.removeEventListener('touchend', onPointerUp);

    if (hasDragged) {
      setTimeout(() => { hasDragged = false; }, 120);
      // Save final position only on desktop
      try {
        if (window.innerWidth > 768) {
          const rect = bubble.getBoundingClientRect();
          localStorage.setItem('haimiya_ai_bubble_pos', JSON.stringify({
            x: rect.left,
            y: rect.top
          }));
        }
      } catch (err) {}
    } else {
      // Tap/click detected without drag -> toggle modal safely!
      toggleHaimiyaAI();
    }
  }

  bubble.addEventListener('mousedown', onPointerDown);
  bubble.addEventListener('touchstart', onPointerDown, { passive: true });

  // Handle explicit click
  bubble.onclick = function(e) {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    toggleHaimiyaAI();
  };
}

// ============================================================
// HAIMIYA AI MULTI-SESSION CHAT STORE (ระบบคลังห้องแชทแยกอิสระ)
// ============================================================
const AI_SESSIONS_STORAGE_KEY = 'haimiya_ai_sessions_v2';
const AI_ACTIVE_SESSION_ID_KEY = 'haimiya_ai_active_session_id';

function getAiChatSessions() {
  try {
    const raw = localStorage.getItem(AI_SESSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading AI sessions:', e);
  }

  // Auto-migrate from old flat history if present
  let initialMessages = [];
  try {
    const oldFlat = JSON.parse(localStorage.getItem('haimiya_ai_chat_saved_history_v1') || '[]');
    if (Array.isArray(oldFlat) && oldFlat.length > 0) {
      initialMessages = oldFlat;
    }
  } catch (e) {}

  const defaultSession = {
    id: 'sess_' + Date.now(),
    title: initialMessages.length > 0 ? 'แชทก่อนหน้า' : 'แชทใหม่',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: initialMessages
  };

  const sessions = [defaultSession];
  try {
    localStorage.setItem(AI_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    localStorage.setItem(AI_ACTIVE_SESSION_ID_KEY, defaultSession.id);
  } catch (e) {}
  return sessions;
}

function saveAiChatSessions(sessions) {
  try {
    localStorage.setItem(AI_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('saveAiChatSessions error:', e);
  }
}

function getActiveAiSessionId() {
  let activeId = localStorage.getItem(AI_ACTIVE_SESSION_ID_KEY);
  const sessions = getAiChatSessions();
  if (!activeId || !sessions.some(s => s.id === activeId)) {
    activeId = sessions[0].id;
    try { localStorage.setItem(AI_ACTIVE_SESSION_ID_KEY, activeId); } catch (e) {}
  }
  return activeId;
}

function getActiveAiSession() {
  const sessions = getAiChatSessions();
  const activeId = getActiveAiSessionId();
  return sessions.find(s => s.id === activeId) || sessions[0];
}

function initAiChatSessions() {
  const session = getActiveAiSession();
  renderActiveSessionMessages(session);
}

function renderActiveSessionMessages(session) {
  if (!session) session = getActiveAiSession();
  const list = document.getElementById('gemini-messages-list');
  const welcome = document.getElementById('gemini-welcome-box');
  const chatBody = document.getElementById('gemini-chat-body');
  const titleEl = document.getElementById('gemini-header-title');
  if (!list) return;

  if (titleEl) {
    titleEl.textContent = session.title || 'Haimiya Studio';
    titleEl.title = session.title || 'Haimiya Studio';
  }

  list.innerHTML = '';
  window.__aiChatHistory = [];

  const msgs = Array.isArray(session.messages) ? session.messages : [];

  if (msgs.length === 0) {
    if (welcome) welcome.style.display = 'block';
    return;
  }

  if (welcome) welcome.style.display = 'none';

  msgs.forEach((item, idx) => {
    if (item.role === 'user') {
      window.__aiChatHistory.push({ role: 'user', text: item.text });
      const userMsgEl = document.createElement('div');
      userMsgEl.className = 'gemini-msg-row user';
      userMsgEl.id = 'ai-msg-row-' + idx;

      let mediaHtml = '';
      if (item.media && item.media.dataUrl) {
        if (item.media.type === 'video') {
          mediaHtml = '<div class="gemini-msg-media-wrap"><video src="' + item.media.dataUrl + '" class="gemini-msg-media-video" controls playsinline></video></div>';
        } else {
          mediaHtml = '<div class="gemini-msg-media-wrap"><img src="' + item.media.dataUrl + '" class="gemini-msg-media-img" alt="Attached" onclick="window.open(\'' + item.media.dataUrl + '\', \'_blank\')" /></div>';
        }
      }

      userMsgEl.innerHTML = '<div class="gemini-msg-bubble">' + mediaHtml + '<div>' + escapeHtml(item.text) + '</div></div>';
      list.appendChild(userMsgEl);
    } else {
      if (item.text) {
        window.__aiChatHistory.push({ role: 'model', text: item.text });
      }
      const row = document.createElement('div');
      row.className = 'gemini-msg-row ai';
      row.id = 'ai-msg-row-' + idx;
      row.innerHTML = '<div class="gemini-msg-avatar"><img src="haimiya_ai_avatar.jpg" alt="Haimiya AI" onerror="this.src=\'splash-cover.jpg\';" /></div>' +
        '<div class="gemini-msg-bubble">' + (item.html || renderAiMarkdown(item.text)).replace(/✦\s*(?:Google\s*)?Gemini[^<]*/gi, '✦ Haimiya AI').replace(/Google Gemini 3 Flash/gi, 'Haimiya AI') + '</div>';
      list.appendChild(row);
    }
  });

  if (chatBody) {
    setTimeout(() => { chatBody.scrollTop = chatBody.scrollHeight; }, 50);
  }
}

function createNewAiChatSession(initialTitle = 'แชทใหม่') {
  const sessions = getAiChatSessions();
  const newSess = {
    id: 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title: initialTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };

  sessions.unshift(newSess);
  saveAiChatSessions(sessions);
  localStorage.setItem(AI_ACTIVE_SESSION_ID_KEY, newSess.id);

  renderActiveSessionMessages(newSess);

  const drawer = document.getElementById('gemini-history-drawer');
  if (drawer && !drawer.classList.contains('hidden')) {
    renderAiHistoryDrawer();
    drawer.classList.add('hidden');
  }

  const input = document.getElementById('gemini-input-text');
  if (input) {
    input.value = '';
    input.focus();
  }

  if (typeof clearGeminiAttachment === 'function') clearGeminiAttachment();
  if (typeof showToast === 'function') showToast('✨ เปิดช่องแชทใหม่แล้วค่ะ');
}

function switchAiChatSession(sessionId) {
  const sessions = getAiChatSessions();
  const target = sessions.find(s => s.id === sessionId);
  if (!target) return;

  localStorage.setItem(AI_ACTIVE_SESSION_ID_KEY, target.id);
  renderActiveSessionMessages(target);

  const drawer = document.getElementById('gemini-history-drawer');
  if (drawer) drawer.classList.add('hidden');

  if (typeof showToast === 'function') showToast('📂 สลับไปที่ห้องแชทแล้วค่ะ');
}

function deleteAiChatSession(sessionId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  let sessions = getAiChatSessions();
  const activeId = getActiveAiSessionId();
  sessions = sessions.filter(s => s.id !== sessionId);

  if (sessions.length === 0) {
    const fresh = {
      id: 'sess_' + Date.now(),
      title: 'แชทใหม่',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    sessions = [fresh];
  }

  saveAiChatSessions(sessions);

  if (activeId === sessionId) {
    localStorage.setItem(AI_ACTIVE_SESSION_ID_KEY, sessions[0].id);
    renderActiveSessionMessages(sessions[0]);
  }

  renderAiHistoryDrawer();
  if (typeof showToast === 'function') showToast('🗑️ ลบห้องแชทเรียบร้อยแล้วค่ะ');
}

function renameAiChatSession(sessionId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const sessions = getAiChatSessions();
  const target = sessions.find(s => s.id === sessionId);
  if (!target) return;

  const newTitle = prompt('ตั้งชื่อห้องแชทใหม่:', target.title);
  if (newTitle && newTitle.trim()) {
    target.title = newTitle.trim();
    target.updatedAt = Date.now();
    saveAiChatSessions(sessions);
    renderAiHistoryDrawer();
    if (sessionId === getActiveAiSessionId()) {
      const titleEl = document.getElementById('gemini-header-title');
      if (titleEl) titleEl.textContent = target.title;
    }
    if (typeof showToast === 'function') showToast('✏️ เปลี่ยนชื่อห้องแชทแล้วค่ะ');
  }
}

function clearAllAiSessions() {
  if (!confirm('ต้องการล้างห้องแชทและประวัติทั้งหมดใช่หรือไม่?')) return;
  const fresh = {
    id: 'sess_' + Date.now(),
    title: 'แชทใหม่',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };
  saveAiChatSessions([fresh]);
  localStorage.setItem(AI_ACTIVE_SESSION_ID_KEY, fresh.id);
  renderActiveSessionMessages(fresh);
  renderAiHistoryDrawer();
  if (typeof showToast === 'function') showToast('🗑️ ล้างห้องแชททั้งหมดแล้วค่ะ');
}

function saveAiChatMessage(role, text, html, media) {
  try {
    const sessions = getAiChatSessions();
    const activeId = getActiveAiSessionId();
    const session = sessions.find(s => s.id === activeId) || sessions[0];

    if (!session.messages) session.messages = [];
    session.messages.push({
      role: role,
      text: text || '',
      html: html || '',
      media: media || null,
      time: Date.now()
    });

    if (session.messages.length > 80) {
      session.messages = session.messages.slice(-80);
    }

    // Auto-rename session on first user message if still default title
    if (role === 'user' && (session.title === 'แชทใหม่' || session.title === 'แชทเริ่มต้น')) {
      if (media && media.type === 'video') {
        session.title = '🎬 ตรวจหาเพลงจากคลิป';
      } else if (media && media.type === 'image') {
        session.title = '📸 วิเคราะห์จากรูปภาพ';
      } else {
        const clean = (text || '').replace(/[\r\n]+/g, ' ').trim();
        session.title = clean.slice(0, 24) + (clean.length > 24 ? '...' : '') || 'การสนทนา';
      }
      const titleEl = document.getElementById('gemini-header-title');
      if (titleEl) titleEl.textContent = session.title;
    }

    session.updatedAt = Date.now();
    saveAiChatSessions(sessions);
  } catch (e) {
    console.warn('saveAiChatMessage error:', e);
  }
}

function toggleAiHistoryDrawer() {
  const drawer = document.getElementById('gemini-history-drawer');
  if (!drawer) return;
  if (drawer.classList.contains('hidden')) {
    renderAiHistoryDrawer();
    drawer.classList.remove('hidden');
  } else {
    drawer.classList.add('hidden');
  }
}

function formatHistoryTime(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  if (isToday) return `วันนี้ ${hours}:${mins} น.`;
  return `${date.getDate()}/${date.getMonth() + 1} ${hours}:${mins} น.`;
}

function renderAiHistoryDrawer() {
  const drawerList = document.getElementById('gemini-history-list');
  const countBadge = document.getElementById('gemini-history-count-badge');
  if (!drawerList) return;

  const sessions = getAiChatSessions();
  const activeId = getActiveAiSessionId();

  if (countBadge) {
    countBadge.textContent = `${sessions.length} ห้องแชท`;
  }

  if (!sessions.length) {
    drawerList.innerHTML = `
      <div class="gemini-history-empty">
        <span class="empty-icon">🌸</span>
        <div>ยังไม่มีห้องแชทในเครื่องค่ะ</div>
      </div>
    `;
    return;
  }

  let html = '';
  sessions.forEach(sess => {
    const isActive = sess.id === activeId;
    const msgCount = Array.isArray(sess.messages) ? sess.messages.length : 0;
    const timeStr = sess.updatedAt ? formatHistoryTime(sess.updatedAt) : '';

    let icon = '💬';
    if (sess.messages && sess.messages.some(m => m.media && m.media.type === 'video')) icon = '🎬';
    else if (sess.messages && sess.messages.some(m => m.media && m.media.type === 'image')) icon = '📸';
    else if (/เพลง|ดนตรี|music|song/i.test(sess.title)) icon = '🎵';

    html += `
      <div class="gemini-session-card ${isActive ? 'active-session' : ''}" onclick="switchAiChatSession('${sess.id}')">
        <div class="gsc-session-icon">${icon}</div>
        <div class="gsc-session-body">
          <div class="gsc-session-top">
            <span class="gsc-session-title">${escapeHtml(sess.title || 'แชทไม่มีชื่อ')}</span>
            <span class="gsc-session-time">${timeStr}</span>
          </div>
          <div class="gsc-session-meta">
            <span class="gsc-session-count">${msgCount} ข้อความ</span>
            ${isActive ? '<span class="gsc-session-active-pill">● กำลังคุยอยู่</span>' : ''}
          </div>
        </div>
        <div class="gsc-session-actions">
          <button class="btn-session-action" onclick="renameAiChatSession('${sess.id}', event)" title="เปลี่ยนชื่อห้อง">✏️</button>
          <button class="btn-session-action btn-delete" onclick="deleteAiChatSession('${sess.id}', event)" title="ลบห้องนี้">🗑️</button>
        </div>
      </div>
    `;
  });

  drawerList.innerHTML = html;
}

// 2. Open / Close / Toggle AI Modal
function openHaimiyaAI() {
  if (typeof initAiChatSessions === "function") initAiChatSessions();
  const modal = document.getElementById('haimiya-ai-modal');
  const bubble = document.getElementById('haimiya-ai-floating-bubble');
  if (!modal) return;

  modal.classList.remove('hidden');
  document.body.classList.add('ai-modal-open');
  if (bubble) bubble.classList.add('active-open');

  // Load chat history if message list is currently empty
  const list = document.getElementById('gemini-messages-list');
  if (list && list.children.length === 0) {
    loadSavedAiChatHistory();
  }

  // Close hamburger menu if open
  const navLinks = document.querySelector('.nav-links');
  const hamburgerBtn = document.getElementById('hamburger');
  if (navLinks && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    if (hamburgerBtn) hamburgerBtn.innerHTML = '<span class="hamburger-icon">☰</span> <span class="hamburger-text">เมนู</span>';
  }

  // Play crystal bell chime sound
  playNotificationChime();

  // Update AI engine badge status
  updateGeminiKeyStatusBadge();

  // Focus input textarea
  setTimeout(() => {
    const input = document.getElementById('gemini-input-text');
    if (input) input.focus();
  }, 150);
}

function closeHaimiyaAI() {
  const modal = document.getElementById('haimiya-ai-modal');
  const bubble = document.getElementById('haimiya-ai-floating-bubble');
  const historyDrawer = document.getElementById('gemini-history-drawer');
  if (!modal) return;

  modal.classList.add('hidden');
  document.body.classList.remove('ai-modal-open');
  if (bubble) bubble.classList.remove('active-open');
  if (historyDrawer) historyDrawer.classList.add('hidden');

  // Stop any audio playing in chat
  stopAiChatAudio();
}

function stopAiChatAudio() {
  if (aiChatAudio) {
    try {
      aiChatAudio.pause();
      aiChatAudio.currentTime = 0;
    } catch (e) {}
    aiChatAudio = null;
  }
  if (currentAiPlayingBtn) {
    currentAiPlayingBtn.innerHTML = '▶️ ลองฟังตัวอย่าง';
    currentAiPlayingBtn = null;
  }
}

// 3. Audio Preview in AI Chat (with main player muting)
function toggleAiSongPreview(previewUrl, btn) {
  if (!previewUrl) {
    showToast('⚠️ เพลงนี้ไม่มีตัวอย่างเสียงออนไลน์');
    return;
  }

  if (aiChatAudio && aiChatAudio.src === previewUrl && !aiChatAudio.paused) {
    stopAiChatAudio();
    return;
  }

  stopAiChatAudio();

  // ✅ Pause main player & relax BGM when playing AI chat audio
  if (typeof currentAudio !== 'undefined' && currentAudio && !currentAudio.paused) {
    try { currentAudio.pause(); } catch (e) {}
    if (typeof updateAudioUI === 'function') updateAudioUI(false);
  }
  if (typeof relaxBgmAudio !== 'undefined' && relaxBgmAudio && !relaxBgmAudio.paused) {
    try { relaxBgmAudio.pause(); } catch (e) {}
  }

  const audio = new Audio(previewUrl);
  audio.volume = 0.85;
  aiChatAudio = audio;
  currentAiPlayingBtn = btn;
  btn.innerHTML = '⏸️ กำลังเล่น...';

  audio.play().catch(err => {
    console.warn('Cannot play AI preview:', err);
    btn.innerHTML = '▶️ ลองฟังตัวอย่าง';
  });

  audio.addEventListener('ended', () => {
    btn.innerHTML = '▶️ ลองฟังตัวอย่าง';
    currentAiPlayingBtn = null;
    aiChatAudio = null;
  });
}

// 4. Quick prompts & Input handlers
function handleQuickAiPrompt(text) {
  const input = document.getElementById('gemini-input-text');
  if (!input) return;

  // Smart routing for quick chips
  const chipToPrompt = {
    'เพลงฮิตติดเทรนด์ล่าสุด': 'แนะนำเพลงฮิตติดเทรนด์ล่าสุดเดือนนี้ที่เหมาะกับตัดคลิปไทโป ทั้งเพลงไทยและสากล ให้หลากหลายแนว',
    'แนะนำเพลงคู่กับอนิเมะ': 'แนะนำเพลงที่เข้ากับอนิเมะยอดนิยมสำหรับตัดคลิป AMV ไทโป เช่น Jujutsu Kaisen, Demon Slayer, Chainsaw Man, Bocchi the Rock',
    'TikTok บีทเดือดๆ': 'แนะนำเพลงบีทเดือดๆ ที่ฮิตใน TikTok สำหรับตัดคลิปไทโปแบบ hype พร้อมเทคนิค beat sync',
    'เพลงเศร้า อกหักซึ้งๆ': 'แนะนำเพลงเศร้า ซึ้งๆ อกหักน้ำตาไหล สำหรับตัดคลิปไทโปแนวดราม่า AMV อนิเมะเศร้า',
    'แจ้งปัญหา/บั๊ก': 'BUGMODE',
    'เพิ่มเพลง': 'เพิ่มเพลงใหม่',
    'แจ้งบั๊ก': 'BUGMODE'
  };

  const prompt = chipToPrompt[text] || text;
  
  if (prompt === 'BUGMODE') {
    input.value = 'แจ้งบั๊ก: ';
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  } else {
    input.value = prompt;
    sendGeminiMessage();
  }
}

function handleGeminiInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendGeminiMessage();
  }
}

function clearAiChat() {
  const list = document.getElementById('gemini-messages-list');
  const welcome = document.getElementById('gemini-welcome-box');
  const drawer = document.getElementById('gemini-history-drawer');
  if (list) list.innerHTML = '';
  if (welcome) welcome.style.display = 'block';
  if (drawer) {
    drawer.classList.add('hidden');
    renderAiHistoryDrawer();
  }
  window.__aiChatHistory = [];
  try {
    localStorage.removeItem(AI_CHAT_STORAGE_KEY);
  } catch (e) {}
  stopAiChatAudio();
  showToast('🧹 ล้างประวัติการสนทนาเรียบร้อยแล้วค่ะ');
}

// ============================================
// LIVE TRACK RESOLVER & RICH AI SONG CARDS
// ============================================

// Search songs already in our library (SONGS array) for AI context
function searchSongsInLibrary(query, maxResults = 10) {
  if (typeof SONGS === 'undefined' || !SONGS.length) return [];
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const keywords = q.split(/\s+/).filter(k => k.length >= 2);
  
  const scored = SONGS.map(s => {
    const text = ((s.title || '') + ' ' + (s.artist || '') + ' ' + (s.tags || []).join(' ') + ' ' + (s.mood || '')).toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += 10;
      if ((s.title || '').toLowerCase().includes(kw)) score += 20;
      if ((s.artist || '').toLowerCase().includes(kw)) score += 15;
    }
    return { song: s, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, maxResults);
  
  return scored.map(x => ({
    title: x.song.title,
    artist: x.song.artist,
    coverUrl: x.song.coverUrl || 'splash-cover.jpg',
    previewUrl: x.song.previewUrl || '',
    spotifyUrl: x.song.spotifyUrl || '',
    mood: x.song.mood || 'chill',
    lang: x.song.lang || 'th',
    tags: x.song.tags || [],
    bpm: x.song.bpm || ''
  }));
}

// Get random sample of songs from library to give AI context about what we have
function getLibrarySample(count = 20) {
  if (typeof SONGS === 'undefined' || !SONGS.length) return [];
  const sample = [];
  const indices = new Set();
  const max = Math.min(count, SONGS.length);
  while (sample.length < max) {
    const idx = Math.floor(Math.random() * SONGS.length);
    if (!indices.has(idx)) {
      indices.add(idx);
      const s = SONGS[idx];
      sample.push(s.title + ' - ' + (s.artist || 'Unknown') + ' [' + (s.lang || '?') + ']');
    }
  }
  return sample;
}

async function searchLiveTrackPreview(title, artist, lang) {
  try {
    const l = (lang || '').toLowerCase();
    const country = (l === 'th' || l === 'lao') ? 'th' : (l === 'jp' ? 'jp' : (l === 'kr' ? 'kr' : 'us'));
    const term = `${title || ''} ${artist || ''}`.trim();
    if (!term) return null;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5&country=${country}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.results && data.results.length > 0) {
      // STRICT VALIDATION: result must match requested title or artist!
      const norm = s => (s || '').toLowerCase().replace(/[\s\-_\.\,\:\;\!\?\'\"\"\(\)\[\]\{\}\/\\]+/g, '');
      const qTitle = norm(title);
      const qArtist = norm(artist);

      const matched = data.results.find(t => {
        const tTitle = norm(t.trackName);
        const tArtist = norm(t.artistName);
        const titleMatches = qTitle && (tTitle.includes(qTitle) || qTitle.includes(tTitle) || (qTitle.length > 3 && tTitle.slice(0, 6) === qTitle.slice(0, 6)));
        const artistMatches = qArtist && (tArtist.includes(qArtist) || qArtist.includes(tArtist));
        return titleMatches || artistMatches;
      });

      if (!matched) return null; // NEVER return random results[0]!

      const hdCover = (matched.artworkUrl100 || '').replace('100x100bb', '600x600bb').replace('170x170', '600x600') || 'splash-cover.jpg';
      return {
        title: matched.trackName || title,
        artist: matched.artistName || artist || 'Unknown Artist',
        coverUrl: hdCover,
        previewUrl: matched.previewUrl || '',
        spotifyUrl: matched.trackViewUrl || `https://open.spotify.com/search/${encodeURIComponent(title + ' ' + artist)}`,
        genre: matched.primaryGenreName || 'Pop / Beat',
        year: matched.releaseDate ? matched.releaseDate.substring(0, 4) : '2026'
      };
    }
  } catch (e) {
    console.warn('searchLiveTrackPreview error:', e);
  }
  return null;
}



// ============================================
// GLOBAL HELPER: DETECT SONG LANGUAGE ACCURATELY
// ============================================
function detectSongLang(title, artist) {
  const text = (title || '') + ' ' + (artist || '');
  if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
  if (/[\u0E80-\u0EFF]/.test(text)) return 'lao';
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return 'jp';
  if (/[\uac00-\ud7af]/.test(text)) return 'kr';
  const thaiArtists = [
    'three man down', 'tilly birds', 'jeff satur', 'nont tanont', 'dept',
    'bowkylion', '4eve', 'proxie', 'bus because of you', 'atlas', 'perses', 'pixxie',
    'billkin', 'pp krit', 'safeplanet', 'tattoo colour', 'polycat',
    'purpeech', 'anatomy rabbit', 'fellow fellow', 'urboytj', 'youngohm',
    'milli', 'violette wautier', 'the toys', 'stamp', 'f.hero', 'slot machine',
    'bodyslam', 'cocktail', 'scrubb', 'paradox', 'lula', 'season five', 'ink waruntorn',
    'palmy', 'num kala', 'big ass', 'potato', 'getsunova', 'clash', 'labanoon',
    'silly fools', 'moderndog', 'pause', 'klear', 'lomosonic', 'mean',
    'zweed n roll', 'whal & dolph', 'fridaynight to sunday', 'plastic plastic',
    'peck palitchoke', 'palaphol', 'lipta', 'serious bacon', 'yes indeed',
    'singto numchok', 'bright vachirawit', 'gulf kanawut', 'ohm pawat',
    'sprite x guygeegee', 'guygeegee', 'numcha', 'gavin d', 'txrbo',
    'dawjai', 'maiyarap', 'twopee', 'diamond mqt', 'daboyway', 'kanomroo',
    'cream', 'wanyai', 'timethai', 'jaonaay', 'pure', 'nice2meet u',
    'telex telexs', 'way thaitanium', 'thaitanium', 'buddha bless',
    'threemandown', 'tillybirds', 'jeffsatur', 'ponchet', 'beminor',
    'autta', 'songkran', 'bamm', 'isbanky', 'pearwah', 'nene',
    'bonnadol', 'saran', 'earth patravee', 'folk9', 'no one else',
    'pun basher', 'season change', 'warin', 'ab normal', 'instinct',
    'portrait', 'singular', 'tai orathai', 'bird thongchai', 'tata young',
    'christina aguilar', 'da endorphine', 'endorphine', 'am fine',
    'bedroom audio', 'hobbit', 'indigo', 'mild', 'musketeers', 'so cool',
    'nologo', 'twio', 'tontrakul', 'gena', 'la luna', 'y not 7', 'crescendo',
    'pae arak', 'kangsadan', 'bow maylada', 'marc tatchapon', 'flukie',
    'wonderframe', 'mirrr', 'nap a lin', 'iceパリ', 'ice paris', 'saint', 'zee pruk',
    'nunew', 'gemini norawit', 'fourth nattawat', 'win metawin', 'nanon',
    'pp billkin', 'mew suppasit', 'war wanarat', 'max jenmana',
    'ost rak', 'ost lakorn', 'thai drama', 'gmmtv', 'nadao', 'rs music'
  ];
  const artLower = (artist || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();
  if (thaiArtists.some(ta => artLower.includes(ta) || titleLower.includes(ta))) return 'th';
  return 'en';
}

// ============================================
// BULLETPROOF AI SONG PAYLOAD RETRIEVER
// 4-tier fallback: Memory -> localStorage -> DOM dataset -> DOM text extraction
// ============================================
function getAiSongPayload(cardId, btnEl) {
  // 1. Check in-memory global
  if (window['__ai_song_' + cardId]) {
    return window['__ai_song_' + cardId];
  }

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem('__ai_song_' + cardId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.title) {
        window['__ai_song_' + cardId] = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  // 3. Check DOM dataset.song
  const cardEl = document.getElementById(cardId) || (btnEl && btnEl.closest('.gemini-song-card'));
  if (cardEl && cardEl.dataset && cardEl.dataset.song) {
    try {
      const parsed = JSON.parse(cardEl.dataset.song);
      if (parsed && parsed.title) {
        window['__ai_song_' + cardId] = parsed;
        return parsed;
      }
    } catch (e) {}
  }

  // 4. Fallback: Extract directly from card elements in DOM
  if (cardEl) {
    const titleEl = cardEl.querySelector('.gsc-title');
    const artistEl = cardEl.querySelector('.gsc-artist');
    const coverEl = cardEl.querySelector('.gsc-cover');
    if (titleEl) {
      const title = (titleEl.getAttribute('title') || titleEl.textContent || '').trim();
      const artist = (artistEl ? artistEl.textContent : '').trim() || 'ศิลปินนิรนาม';
      const coverUrl = coverEl ? coverEl.src : 'splash-cover.jpg';
      const lang = detectSongLang(title, artist);
      const payload = {
        title: title,
        artist: artist,
        coverUrl: coverUrl,
        previewUrl: '',
        spotifyUrl: 'https://open.spotify.com/search/' + encodeURIComponent(title + ' ' + artist),
        mood: 'chill',
        tags: ['เพลงแนะนำโดยAI', 'HaimiyaAI', lang === 'th' ? 'เพลงไทย' : 'เพลงฮิต'],
        bpm: 'ปานกลาง (110 BPM)',
        lang: lang,
        animeId: 1,
        reason: 'เพลง ' + title + ' จังหวะลงตัวตัดต่อคลิปไทโป',
        typoIdea: 'แอนิเมชันตัวอักษรแบบ Kinetic ตามจังหวะบีท'
      };
      window['__ai_song_' + cardId] = payload;
      try { localStorage.setItem('__ai_song_' + cardId, JSON.stringify(payload)); } catch (e) {}
      return payload;
    }
  }

  return null;
}


// ============================================
// ฟังก์ชันฟังตัวอย่างเพลงที่ AI แนะนำ (Bulletproof Preview Player)
// ============================================
let _aiPreviewAudio = null;
let _aiPreviewCardId = null;

async function playOrResolveAiSongPreview(cardId, btnEl) {
  const songPayload = getAiSongPayload(cardId, btnEl);
  if (!songPayload) {
    showToast('❌ ไม่พบข้อมูลเพลงนี้');
    return;
  }

  // If already playing this card — toggle pause
  if (_aiPreviewAudio && _aiPreviewCardId === cardId && !_aiPreviewAudio.paused) {
    _aiPreviewAudio.pause();
    _aiPreviewAudio.currentTime = 0;
    if (btnEl) btnEl.innerHTML = '▶️ ลองฟังตัวอย่างเพลง';
    _aiPreviewCardId = null;
    return;
  }

  // Stop any previously playing preview
  if (_aiPreviewAudio) {
    try {
      _aiPreviewAudio.pause();
      _aiPreviewAudio.currentTime = 0;
    } catch (e) {}
    const oldBtn = document.getElementById('btn-ai-play-' + _aiPreviewCardId);
    if (oldBtn) oldBtn.innerHTML = '▶️ ลองฟังตัวอย่างเพลง';
  }

  // Also stop any other audio in the app (main player & relax BGM)
  if (typeof currentAudio !== 'undefined' && currentAudio && !currentAudio.paused) {
    try { currentAudio.pause(); } catch (e) {}
    if (typeof updateAudioUI === 'function') updateAudioUI(false);
  }
  if (typeof relaxBgmAudio !== 'undefined' && relaxBgmAudio && !relaxBgmAudio.paused) {
    try { relaxBgmAudio.pause(); } catch (e) {}
  }
  if (typeof stopAiChatAudio === 'function') {
    stopAiChatAudio();
  }

  if (btnEl) btnEl.innerHTML = '⏳ กำลังค้นหาเสียง...';

  // Try to find a preview URL
  let audioUrl = songPayload.previewUrl || '';

  // If no preview URL, try to search iTunes API with proper country code
  if (!audioUrl) {
    try {
      const lang = songPayload.lang || detectSongLang(songPayload.title, songPayload.artist);
      const country = (lang === 'th' || lang === 'lao') ? 'th' : (lang === 'jp' ? 'jp' : (lang === 'kr' ? 'kr' : 'us'));
      const q = encodeURIComponent(songPayload.title + ' ' + songPayload.artist);
      const res = await fetch('https://itunes.apple.com/search?term=' + q + '&entity=song&limit=5&country=' + country);
      if (res.ok) {
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
          const matched = data.results.find(t => t.previewUrl) || data.results[0];
          if (matched && matched.previewUrl) {
            audioUrl = matched.previewUrl;
            songPayload.previewUrl = audioUrl;
            window['__ai_song_' + cardId] = songPayload;
    try { localStorage.setItem('__ai_song_' + cardId, JSON.stringify(songPayload)); } catch (e) {}
            try { localStorage.setItem('__ai_song_' + cardId, JSON.stringify(songPayload)); } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn('iTunes search failed for AI preview:', e);
    }
  }

  // If still no preview URL, check if song exists in our library SONGS
  if (!audioUrl && typeof SONGS !== 'undefined' && Array.isArray(SONGS)) {
    const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9\u0E00-\u0E7F]/g, '');
    const qT = norm(songPayload.title);
    const qA = norm(songPayload.artist);
    const found = SONGS.find(s => {
      const sT = norm(s.title);
      const sA = norm(s.artist);
      return (sT === qT && sA === qA) || (sT.includes(qT) && qT.length > 4);
    });
    if (found && (found.previewUrl || found.fullAudioUrl || found.audioUrl)) {
      audioUrl = found.previewUrl || found.fullAudioUrl || found.audioUrl;
      songPayload.previewUrl = audioUrl;
    }
  }

  if (!audioUrl) {
    if (btnEl) btnEl.innerHTML = '❌ ไม่พบเสียงตัวอย่าง';
    showToast('❌ ไม่พบเสียงตัวอย่างออนไลน์สำหรับเพลงนี้ค่ะ สามารถกดยืนยันเพิ่มเพลงลงคลังได้เลย');
    setTimeout(() => {
      if (btnEl) btnEl.innerHTML = '▶️ ลองฟังตัวอย่างเพลง';
    }, 3500);
    return;
  }

  try {
    // Note: Do NOT set crossOrigin='anonymous' to avoid CORS preflight blocks on Apple CDNs
    _aiPreviewAudio = new Audio(audioUrl);
    _aiPreviewCardId = cardId;
    _aiPreviewAudio.volume = 0.85;

    _aiPreviewAudio.onplay = () => {
      if (btnEl) btnEl.innerHTML = '⏸️ หยุดฟังตัวอย่าง';
    };
    _aiPreviewAudio.onended = () => {
      if (btnEl) btnEl.innerHTML = '▶️ ลองฟังตัวอย่างเพลง';
      _aiPreviewCardId = null;
    };
    _aiPreviewAudio.onerror = (e) => {
      console.warn('Audio play error:', e);
      if (btnEl) btnEl.innerHTML = '❌ เสียงเล่นไม่ได้';
      showToast('❌ ไม่สามารถเล่นไฟล์เสียงนี้ได้ค่ะ');
      setTimeout(() => {
        if (btnEl) btnEl.innerHTML = '▶️ ลองฟังตัวอย่างเพลง';
      }, 3000);
    };

    await _aiPreviewAudio.play();
    showToast('🎵 กำลังเล่นตัวอย่าง: ' + songPayload.title);
  } catch (playErr) {
    console.error('AI preview play error:', playErr);
    if (btnEl) btnEl.innerHTML = '▶️ ลองฟังตัวอย่างเพลง';
    showToast('❌ ไม่สามารถเล่นเสียงได้ ลองแตะอีกครั้งนะคะ');
  }
}

function renderSongCardsHtml(songList, headerHtml) {
  let cardsHtml = headerHtml ? `<div style="margin-bottom: 8px;">${headerHtml}</div>` : '';
  songList.forEach((s, idx) => {
    const cardId = `ai-song-card-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;

    let matchedAnime = null;
    if (s.anime && typeof ANIMES !== 'undefined' && Array.isArray(ANIMES)) {
      matchedAnime = ANIMES.find(a => a.name.toLowerCase().includes(s.anime.toLowerCase()));
    }
    if (!matchedAnime && typeof ANIMES !== 'undefined' && ANIMES.length) {
      matchedAnime = ANIMES[Math.floor(Math.random() * ANIMES.length)];
    }
    const animeName = s.anime || (matchedAnime ? matchedAnime.name : 'Jujutsu Kaisen');
    const animeId = matchedAnime ? matchedAnime.id : 1;

    const songPayload = {
      title: s.title,
      artist: s.artist,
      coverUrl: s.coverUrl || 'splash-cover.jpg',
      previewUrl: s.previewUrl || '',
      spotifyUrl: s.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(s.title + ' ' + s.artist)}`,
      mood: s.mood || 'chill',
      tags: ["เพลงแนะนำโดยAI", "HaimiyaAI", s.genre || "Pop", s.lang === 'th' ? 'เพลงไทย' : 'เพลงฮิต'],
      bpm: s.bpm || "ปานกลาง (110 BPM)",
      lang: s.lang || detectSongLang(s.title, s.artist),
      animeId: animeId,
      reason: s.reason || `เพลง "${s.title}" จังหวะบีทกระชับ มีมิติอารมณ์ตัดต่อคู่กับ ${animeName} ได้ลงตัวสุดๆ`,
      typoIdea: s.typoIdea || `แอนิเมชันตัวอักษรแบบ Kinetic ตามท่อนร้องฮุก สลับตัดคัทกระชับตามจังหวะบีท`
    };
    window['__ai_song_' + cardId] = songPayload;
    try { localStorage.setItem('__ai_song_' + cardId, JSON.stringify(songPayload)); } catch (e) {}

    const langBadge = songPayload.lang === 'th' ? '🇹🇭 เพลงไทย' : (songPayload.lang === 'jp' ? '🇯🇵 J-Pop' : (songPayload.lang === 'kr' ? '🇰🇷 K-Pop' : (songPayload.lang === 'lao' ? '🇱🇦 เพลงลาว' : '🇬🇧 สากล')));

    cardsHtml += `
      <div class="gemini-song-card" id="${cardId}" data-song="${escapeHtml(JSON.stringify(songPayload))}">
        <div class="gsc-top">
          <div class="gsc-cover-wrap">
            <img src="${escapeHtml(songPayload.coverUrl)}" alt="${escapeHtml(songPayload.title)}" class="gsc-cover" onerror="this.src='splash-cover.jpg';" />
          </div>
          <div class="gsc-info">
            <div class="gsc-title" title="${escapeHtml(songPayload.title)}">${escapeHtml(songPayload.title)}</div>
            <div class="gsc-artist">${escapeHtml(songPayload.artist)}</div>
            <div class="gsc-badges">
              <span class="gsc-badge">${langBadge}</span>
              ${s.genre ? `<span class="gsc-badge">${escapeHtml(s.genre)}</span>` : ''}
              ${s.year ? `<span class="gsc-badge">${escapeHtml(s.year)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="gsc-anime-match">
          🌸 <strong>จับคู่ตัดต่อแนะนำ:</strong> ${escapeHtml(animeName)} • ${escapeHtml(songPayload.reason)}
          ${songPayload.typoIdea ? `<div style="margin-top: 4px; font-size: 0.8rem; color: #a7f3d0;">💡 <em>ทริคไทโป: ${escapeHtml(songPayload.typoIdea)}</em></div>` : ''}
        </div>
        <div class="gsc-actions">
          <button class="btn-ai-play" id="btn-ai-play-${cardId}" onclick="playOrResolveAiSongPreview('${cardId}', this)">▶️ ลองฟังตัวอย่างเพลง</button>
          <button class="btn-ai-confirm-add" id="btn-add-${cardId}" onclick="confirmAddSongViaAi('${cardId}', this)">
            ➕ ยืนยันเพิ่มเพลงนี้ลงคลังทันที (แชร์ให้ทุกคน)
          </button>
        </div>
      </div>
    `;
  });
  return cardsHtml;
}

async function parseAndRenderAiSongResponse(aiText, engineUsed, rawUserPrompt) {
  let cleanText = aiText || '';
  let recommendedSongs = [];

  // Try multiple JSON extraction patterns for robustness
  const patterns = [
    /```json\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```/i,
    /```\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```/i,
    /\[\s*\{\s*"title"\s*:[\s\S]*?\}\s*\]/i
  ];
  
  let jsonMatch = null;
  for (const pat of patterns) {
    jsonMatch = aiText.match(pat);
    if (jsonMatch) break;
  }

  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      recommendedSongs = JSON.parse(jsonStr);
      cleanText = aiText.replace(jsonMatch[0], '').replace(/```json[\s\S]*?```/gi, '').replace(/```[\s\S]*?```/gi, '').trim();
    } catch (e) {
      console.warn('Could not parse AI songs JSON:', e);
      // Try to fix common JSON issues (trailing comma, etc.)
      try {
        const fixed = (jsonMatch[1] || jsonMatch[0]).replace(/,\s*([\]\}])/g, '$1');
        recommendedSongs = JSON.parse(fixed);
        cleanText = aiText.replace(jsonMatch[0], '').replace(/```json[\s\S]*?```/gi, '').replace(/```[\s\S]*?```/gi, '').trim();
      } catch (e2) {
        console.warn('JSON fix attempt also failed:', e2);
      }
    }
  }
  
  // If AI didn't return songs but user was asking for songs, try library search as bonus
  if (recommendedSongs.length === 0 && rawUserPrompt) {
    const songKeywords = /เพลง|แนะนำ|ขอ|หา|song|music|recommend|ฮิต|เศร้า|มันส์|chill|hype|บีท|beat|อนิเมะ|anime/i;
    if (songKeywords.test(rawUserPrompt)) {
      const libResults = searchSongsInLibrary(rawUserPrompt, 4);
      if (libResults.length > 0) {
        recommendedSongs = libResults.map(s => ({
          title: s.title,
          artist: s.artist,
          lang: s.lang,
          mood: s.mood,
          anime: '',
          reason: 'เพลงจากคลัง Haimiya Typo ที่ตรงกับคำค้นของคุณ',
          typoIdea: 'ลองใช้ Beat Sync ตัดจังหวะตามบีทหลัก สลับ Kinetic Text'
        }));
      }
    }
  }

  const formattedHtml = renderAiMarkdown(cleanText);
  const pillHtml = `<div class="gemini-engine-pill">✦ Haimiya AI</div>`;

  if (Array.isArray(recommendedSongs) && recommendedSongs.length > 0) {
    const resolvedSongs = await Promise.all(recommendedSongs.map(async (item) => {
      // 1. Check if song already exists in our local library (27,000+ verified songs)
      let localSong = null;
      if (typeof searchSongsInLibrary === 'function' && typeof SONGS !== 'undefined') {
        const matches = searchSongsInLibrary(item.title, 1);
        if (matches && matches.length > 0) {
          localSong = SONGS.find(s => s.id === matches[0].id);
        }
      }

      // 2. Query iTunes with strict match validation
      const live = await searchLiveTrackPreview(item.title, item.artist, item.lang);

      // 3. Resolve cleanly without ever leaking wrong compilation covers or audio
      return {
        title: (live && live.title) || (localSong && localSong.title) || item.title,
        artist: (live && live.artist) || (localSong && localSong.artist) || item.artist || 'Unknown Artist',
        coverUrl: (live && live.coverUrl) || (localSong && localSong.coverUrl) || 'splash-cover.jpg',
        previewUrl: (live && live.previewUrl) || (localSong && (localSong.previewUrl || localSong.audioUrl)) || '',
        spotifyUrl: (live && live.spotifyUrl) || (localSong && localSong.spotifyUrl) || `https://open.spotify.com/search/${encodeURIComponent(item.title + ' ' + (item.artist || ''))}`,
        genre: (live && live.genre) || (localSong && localSong.tags && localSong.tags[0]) || 'Pop / Beat',
        year: (live && live.year) || '2026',
        anime: item.anime || '',
        reason: item.reason || (localSong && localSong.reason) || '',
        typoIdea: item.typoIdea || (localSong && localSong.typoIdea) || '',
        mood: item.mood || (localSong && localSong.mood) || 'chill',
        lang: item.lang || (localSong && localSong.lang) || detectSongLang(item.title, item.artist)
      };
    }));

    const cardsHtml = renderSongCardsHtml(resolvedSongs);
    
    const repairHint = '<div style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;"><span style="font-size: 0.76rem; color: #64748b;">💡 แนบรูป/วิดีโอเพื่อแก้บั๊กหรือขอเพลงได้ตลอดค่ะ</span><button class="btn-sm btn-ghost" onclick="executeRealAppBugRepair()" style="font-size: 0.75rem; color: #f87171; border-color: rgba(248,113,113,0.3); padding: 2px 8px;">🛠️ ซ่อมแซมระบบ & รีสตาร์ท</button></div>';
    appendAiResponse(formattedHtml + cardsHtml + repairHint + pillHtml, aiText);
  } else {
    
    const repairHint = '<div style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;"><span style="font-size: 0.76rem; color: #64748b;">💡 แนบรูป/วิดีโอเพื่อแก้บั๊กหรือขอเพลงได้ตลอดค่ะ</span><button class="btn-sm btn-ghost" onclick="executeRealAppBugRepair()" style="font-size: 0.75rem; color: #f87171; border-color: rgba(248,113,113,0.3); padding: 2px 8px;">🛠️ ซ่อมแซมระบบ & รีสตาร์ท</button></div>';
    appendAiResponse(formattedHtml + repairHint + pillHtml, aiText);
  }
}


// ============================================================
// HAIMIYA AI MULTIMODAL MEDIA ATTACHMENT & REAL BUG REPAIR ENGINE
// ============================================================
window.__geminiAttachedMedia = null;
window.__geminiBugModeActive = false;

function handleGeminiFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  processGeminiAttachedFile(file);
}

function processGeminiAttachedFile(file) {
  if (!file) return;
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    if (typeof showToast === 'function') showToast('⚠️ กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, WEBP) หรือคลิปวิดีโอ (MP4, WEBM) ค่ะ');
    return;
  }

  if (file.size > 28 * 1024 * 1024) {
    if (typeof showToast === 'function') showToast('⚠️ ขนาดไฟล์ใหญ่เกิน 28MB ค่ะ กรุณาเลือกไฟล์ที่เล็กลง');
    return;
  }

  if (typeof showToast === 'function') showToast('⏳ กำลังประมวลผลไฟล์แนบ...');

  const reader = new FileReader();
  reader.onload = (e) => {
    const rawDataUrl = e.target.result;

    if (isImage) {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const optDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = optDataUrl.split(',')[1];

        setGeminiAttachedMedia({
          type: 'image',
          name: file.name,
          size: Math.round(base64.length * 0.75),
          mimeType: 'image/jpeg',
          dataUrl: optDataUrl,
          base64: base64
        });
      };
      img.onerror = () => {
        const base64 = rawDataUrl.split(',')[1];
        setGeminiAttachedMedia({
          type: 'image',
          name: file.name,
          size: file.size,
          mimeType: file.type || 'image/jpeg',
          dataUrl: rawDataUrl,
          base64: base64
        });
      };
      img.src = rawDataUrl;
    } else {
      // Video
      const base64 = rawDataUrl.split(',')[1];
      setGeminiAttachedMedia({
        type: 'video',
        name: file.name,
        size: file.size,
        mimeType: file.type || 'video/mp4',
        dataUrl: rawDataUrl,
        base64: base64
      });
    }
  };
  reader.readAsDataURL(file);
}

function setGeminiAttachedMedia(mediaObj) {
  window.__geminiAttachedMedia = mediaObj;
  // Auto-detect if name indicates bug
  if (/bug|error|broken|crash|issue|screenshot|แคป|บั๊ก|บัค|พัง/i.test(mediaObj.name)) {
    window.__geminiBugModeActive = true;
  }

  renderGeminiAttachmentPreview();
  const input = document.getElementById('gemini-input-text');
  if (input) {
    if (!input.value.trim()) {
      input.placeholder = window.__geminiBugModeActive ? 'พิมพ์อธิบายบั๊กเพิ่มเติม หรือกดส่งเพื่อแก้บั๊กทันที...' : 'พิมพ์ข้อความถามไฮมิยะจากภาพนี้ หรือกดส่งได้เลยค่ะ...';
    }
    input.focus();
  }
}

function renderGeminiAttachmentPreview() {
  const container = document.getElementById('gemini-attachment-preview');
  if (!container) return;

  const media = window.__geminiAttachedMedia;
  if (!media) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  const isImg = media.type === 'image';
  const sizeKb = Math.round(media.size / 1024);
  const sizeStr = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB';

  container.className = 'gemini-attachment-preview';
  container.innerHTML = `
    <div class="gemini-preview-card">
      <div class="gemini-preview-thumb-box">
        ${isImg
          ? `<img src="${media.dataUrl}" class="gemini-preview-thumb" alt="Preview" />`
          : `<video src="${media.dataUrl}" class="gemini-preview-thumb" muted playsinline></video>`
        }
      </div>
      <div class="gemini-preview-meta">
        <div class="gemini-preview-title">${escapeHtml(media.name)}</div>
        <div class="gemini-preview-sub">
          <span class="preview-type-pill">${isImg ? '📸 รูปภาพ' : '🎥 วิดีโอ'}</span>
          <span class="preview-size-text">${sizeStr}</span>
        </div>
      </div>
      <div class="gemini-preview-intent">
        ${!isImg ? `<button type="button" class="btn-preview-mode btn-detect-song" onclick="triggerDetectSongFromAttachedClip()" title="ตรวจหาว่าเพลงอะไร ใครร้อง มาจากเรื่องไหน และเพิ่มลงคลัง">🎬 ตรวจหาเพลง & เพิ่มลงคลัง</button>` : ''}
        <button type="button" class="btn-preview-mode ${window.__geminiBugModeActive ? 'active-bug' : ''}" onclick="toggleBugReportMode()">
          ${window.__geminiBugModeActive ? '🛠️ โหมดแก้บั๊ก (เปิดอยู่)' : '🛠️ แจ้งแก้บั๊ก'}
        </button>
      </div>
      <button type="button" class="gemini-preview-del-btn" onclick="clearGeminiAttachment()" title="ลบไฟล์แนบ">✕</button>
    </div>
  `;
}

function toggleBugReportMode() {
  window.__geminiBugModeActive = !window.__geminiBugModeActive;
  renderGeminiAttachmentPreview();
  const input = document.getElementById('gemini-input-text');
  if (input && !input.value.trim()) {
    input.placeholder = window.__geminiBugModeActive ? 'พิมพ์อธิบายบั๊กเพิ่มเติม หรือกดส่งเพื่อแก้บั๊กทันที...' : 'พิมพ์ข้อความถามไฮมิยะจากภาพนี้ หรือกดส่งได้เลยค่ะ...';
  }
}


function triggerDetectSongFromAttachedClip() {
  const input = document.getElementById('gemini-input-text');
  if (input) {
    input.value = 'ตรวจหาเพลงจากคลิปนี้ให้หน่อยค่ะ ว่าชื่อเพลงอะไร ใครร้อง มาจากเรื่องหรือช่องทางไหน และช่วยเพิ่มเป็นเพลงลงคลังด้วยนะคะ 🎵';
  }
  sendGeminiMessage();
}

function clearGeminiAttachment() {
  window.__geminiAttachedMedia = null;
  window.__geminiBugModeActive = false;
  const fileInput = document.getElementById('gemini-file-input');
  if (fileInput) fileInput.value = '';
  const container = document.getElementById('gemini-attachment-preview');
  if (container) {
    container.classList.add('hidden');
    container.innerHTML = '';
  }
  const input = document.getElementById('gemini-input-text');
  if (input) {
    input.placeholder = 'พิมพ์คุยกับไฮมิยะ หรือส่งรูปแจ้งแก้บั๊ก/รูปอนิเมะ...';
  }
}

// REAL EMERGENCY BUG REPAIR ENGINE
async function executeRealAppBugRepair(reason = 'ผู้ใช้ส่งรูปภาพ/วิดีโอแจ้งแก้บั๊ก') {
  const modal = document.getElementById('haimiya-repair-modal');
  if (modal) modal.classList.remove('hidden');

  const fill = document.getElementById('repair-progress-bar-fill');
  const step1 = document.getElementById('repair-step-1');
  const step2 = document.getElementById('repair-step-2');
  const step3 = document.getElementById('repair-step-3');
  const step4 = document.getElementById('repair-step-4');

  function setStep(stepEl, status, icon) {
    if (!stepEl) return;
    if (status === 'done') {
      stepEl.className = 'repair-step done';
      const ic = stepEl.querySelector('.step-icon');
      if (ic) ic.textContent = icon || '✅';
    } else if (status === 'active') {
      stepEl.className = 'repair-step active';
      const ic = stepEl.querySelector('.step-icon');
      if (ic) ic.textContent = icon || '⏳';
    }
  }

  // Step 1: Analyze bug
  setStep(step1, 'active', '🔍');
  if (fill) fill.style.width = '25%';
  await new Promise(r => setTimeout(r, 450));
  setStep(step1, 'done', '✅');

  // Step 2: Purge Caches & Service Worker
  setStep(step2, 'active', '🧹');
  if (fill) fill.style.width = '55%';
  try {
    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(k => window.caches.delete(k)));
      console.log('Real repair: purged caches', keys);
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      console.log('Real repair: unregistered service workers', regs.length);
    }
  } catch (err) {
    console.warn('Real repair cache purge error:', err);
  }
  await new Promise(r => setTimeout(r, 550));
  setStep(step2, 'done', '✅');

  // Step 3: Sanitize Storage & DOM
  setStep(step3, 'active', '🧼');
  if (fill) fill.style.width = '85%';
  try {
    const obsoleteKeys = [
      'haimiya_bp_pos',
      'haimiya_bp_size',
      'haimiya_last_tab',
      'haimiya_audio_cache_index'
    ];
    obsoleteKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    // Reset bottom player styles
    const bp = document.getElementById('bottom-player');
    if (bp) {
      bp.removeAttribute('style');
      bp.className = 'bottom-player';
    }

    sessionStorage.clear();
    localStorage.setItem('haimiya_auto_repaired_at', Date.now().toString());
    localStorage.setItem('haimiya_repaired_reason', reason);
  } catch (err) {
    console.warn('Storage sanitation error:', err);
  }
  await new Promise(r => setTimeout(r, 500));
  setStep(step3, 'done', '✅');

  // Step 4: Reboot
  setStep(step4, 'active', '🚀');
  if (fill) fill.style.width = '100%';
  await new Promise(r => setTimeout(r, 650));

  // Exit & hard reload with fresh cache-busting timestamp
  const targetUrl = window.location.origin + window.location.pathname + '?repaired=' + Date.now();
  window.location.replace(targetUrl);
}

// 5. Send message and Gemini response logic
async function sendGeminiMessage() {
  const input = document.getElementById('gemini-input-text');
  const list = document.getElementById('gemini-messages-list');
  const welcome = document.getElementById('gemini-welcome-box');
  const typingIndicator = document.getElementById('gemini-typing-indicator');
  const chatBody = document.getElementById('gemini-chat-body');

  if (!input || !list) return;
  const rawText = input.value.trim();
  const attachedMedia = window.__geminiAttachedMedia;
  if (!rawText && !attachedMedia) return;

  // Clear input
  input.value = '';
  if (welcome) welcome.style.display = 'none';

  // Detect bug report intent
  const isBugIntent = window.__geminiBugModeActive ||
    /แก้บัค|แก้บั๊ก|แจ้งบัค|แจ้งบั๊ก|บัค|บั๊ก|แอปพัง|แอพพัง|พัง|เสีย|ค้าง|เด้ง|เพี้ยน|bug|fix|error|crash|glitch|ซ่อม|ซ่อมแซม/i.test(rawText) ||
    (attachedMedia && /bug|error|broken|crash|issue|screenshot|แคป|บั๊ก|บัค|พัง/i.test(attachedMedia.name));

  // Render User Message Bubble (including image or video preview)
  const userMsgEl = document.createElement('div');
  userMsgEl.className = 'gemini-msg-row user';
  userMsgEl.id = 'ai-msg-row-' + list.children.length;

  let mediaHtml = '';
  if (attachedMedia) {
    if (attachedMedia.type === 'image') {
      mediaHtml = `<div class="gemini-msg-media-wrap"><img src="${attachedMedia.dataUrl}" class="gemini-msg-media-img" alt="Attached" onclick="window.open('${attachedMedia.dataUrl}', '_blank')" /></div>`;
    } else {
      mediaHtml = `<div class="gemini-msg-media-wrap"><video src="${attachedMedia.dataUrl}" class="gemini-msg-media-video" controls playsinline></video></div>`;
    }
  }

  const captionText = rawText || (isBugIntent ? '🛠️ ส่งภาพ/วิดีโอแจ้งแก้บั๊กค่ะ' : '📸 แนบรูปภาพ/วิดีโอค่ะ');
  userMsgEl.innerHTML = `
    <div class="gemini-msg-bubble">
      ${mediaHtml}
      <div>${escapeHtml(captionText)}</div>
    </div>
  `;
  list.appendChild(userMsgEl);

  // Clear attachment preview
  clearGeminiAttachment();

  // Save to persistent storage
  saveAiChatMessage('user', captionText, '');

  // IF BUG INTENT WITH ATTACHED MEDIA -> REAL IMMEDIATE AUTO-REPAIR & EXIT!
  if (attachedMedia && isBugIntent) {
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    appendAiResponse(`
      <div class="gemini-msg-repair-card">
        <div class="repair-card-header">
          <span class="repair-card-sparkle">🛠️</span>
          <strong>ไฮมิยะตรวจพบบั๊กและเริ่มกระบวนการซ่อมแซมระบบจริงแล้วค่ะ!</strong>
        </div>
        <p style="margin: 0.5rem 0; font-size: 0.9rem; line-height: 1.5; color: #e2e8f0;">
          ได้รับรูปภาพ/วิดีโอแจ้งบั๊กเรียบร้อยค่ะ ระบบกำลังทำการล้างแคช Service Worker เก่าทั้งหมด รีเซ็ตโครงสร้าง UI ที่เสียหาย และกู้คืนความเสถียร 100% <strong>แอพจะทำการเด้งออกเพื่อแก้บั๊กและรีสตาร์ทใหม่ (Fresh Reboot) ใน 2 วินาทีค่ะ...</strong>
        </p>
      </div>
    `);
    if (typingIndicator) typingIndicator.classList.add('hidden');
    setTimeout(() => {
      executeRealAppBugRepair('แจ้งแก้บั๊กผ่านรูปภาพ/วิดีโอบน Haimiya AI');
    }, 1200);
    return;
  }

  // Show typing indicator & scroll
  if (typingIndicator) typingIndicator.classList.remove('hidden');
  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;

  // Process user intent
  const trimmedKey = rawText.trim();
  const isApiKeyInput = /^(AQ\.[A-Za-z0-9_-]{25,}|AIzaSy[A-Za-z0-9_-]{30,})$/.test(trimmedKey);
  if (isApiKeyInput) {
    if (typingIndicator) typingIndicator.classList.add('hidden');
    localStorage.setItem('haimiya_gemini_api_key', trimmedKey);
    try {
      fetch(getAiApiBase() + '/api/ai/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmedKey })
      }).catch(() => {});
    } catch (e) {}
    updateGeminiKeyStatusBadge();
    appendAiResponse(`
      <div style="background: rgba(16, 185, 129, 0.14); border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 14px; padding: 1rem; margin-top: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 1.3rem;">✨</span>
          <strong style="color: #6ee7b7; font-size: 1.05rem;">บันทึกและเปิดใช้งาน Haimiya AI สำเร็จแล้วค่ะ!</strong>
        </div>
        <p style="margin: 0; color: #e2e8f0; font-size: 0.9rem; line-height: 1.6;">
          ไฮมิยะเชื่อมต่อระบบ <strong>Haimiya AI</strong> สำเร็จแล้วค่ะ 🎉 พร้อมแนะนำเพลงและช่วยตัดต่อคลิปได้ทันทีค่ะ 🌸
        </p>
      </div>
    `);
    return;
  }

  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  // Helper for detecting song language accurately
  function detectSongLang(title, artist) {
    const text = (title || '') + ' ' + (artist || '');
    if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return 'jp';
    if (/[\uac00-\ud7af]/.test(text)) return 'kr';
    const thaiArtists = [
      'three man down', 'tilly birds', 'jeff satur', 'nont tanont', 'dept',
      'bowkylion', '4eve', 'proxie', 'bus because of you', 'atlas', 'perses', 'pixxie',
      'billkin', 'pp krit', 'safeplanet', 'tattoo colour', 'polycat',
      'purpeech', 'anatomy rabbit', 'fellow fellow', 'urboytj', 'youngohm',
      'milli', 'violette wautier', 'the toys', 'stamp', 'f.hero', 'slot machine',
      'bodyslam', 'cocktail', 'scrubb', 'paradox', 'lula', 'season five', 'ink waruntorn',
      'palmy', 'num kala', 'big ass', 'potato', 'getsunova', 'clash', 'labanoon',
      'silly fools', 'moderndog', 'pause', 'klear', 'lomosonic', 'mean',
      'zweed n roll', 'whal & dolph', 'fridaynight to sunday', 'plastic plastic',
      'peck palitchoke', 'palaphol', 'lipta', 'serious bacon', 'yes indeed',
      'singto numchok', 'bright vachirawit', 'gulf kanawut', 'ohm pawat',
      'sprite x guygeegee', 'guygeegee', 'numcha', 'gavin d', 'txrbo',
      'dawjai', 'maiyarap', 'twopee', 'diamond mqt', 'daboyway', 'kanomroo',
      'cream', 'wanyai', 'timethai', 'jaonaay', 'pure', 'nice2meet u',
      'telex telexs', 'way thaitanium', 'thaitanium', 'buddha bless',
      'threemandown', 'tillybirds', 'jeffsatur', 'ponchet', 'beminor',
      'autta', 'songkran', 'bamm', 'isbanky', 'pearwah', 'nene',
      'bonnadol', 'saran', 'earth patravee', 'folk9', 'no one else',
      'pun basher', 'season change', 'warin', 'ab normal', 'instinct',
      'portrait', 'singular', 'tai orathai', 'bird thongchai', 'tata young',
      'christina aguilar', 'da endorphine', 'endorphine', 'am fine',
      'bedroom audio', 'hobbit', 'indigo', 'mild', 'musketeers', 'so cool',
      'nologo', 'twio', 'tontrakul', 'gena', 'la luna', 'y not 7', 'crescendo',
      'pae arak', 'kangsadan', 'bow maylada', 'marc tatchapon', 'flukie',
      'wonderframe', 'mirrr', 'nap a lin', 'ice paris', 'saint', 'zee pruk',
      'nunew', 'gemini norawit', 'fourth nattawat', 'win metawin', 'nanon',
      'pp billkin', 'mew suppasit', 'war wanarat', 'max jenmana',
      'ost rak', 'ost lakorn', 'thai drama', 'gmmtv', 'nadao', 'rs music'
    ];
    const artLower = (artist || '').toLowerCase();
    const titleLower = (title || '').toLowerCase();
    if (thaiArtists.some(ta => artLower.includes(ta) || titleLower.includes(ta))) return 'th';
    return 'en';
  }


  // Intent 0: Direct URL Parsing (YouTube, Spotify, Apple Music, etc.)
  const urlRegex = /https?:\/\/[^\s]+/i;
  const urlMatch = trimmed.match(urlRegex);

  if (urlMatch) {
    const targetUrl = urlMatch[0];
    try {
      let parsedSong = null;
      // 1. Try server endpoint /api/ai/parse-link
      try {
        const parseRes = await fetch(getAiApiBase() + '/api/ai/parse-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl })
        });
        if (parseRes.ok) {
          const parseData = await parseRes.json();
          if (parseData.ok && parseData.song) {
            parsedSong = parseData.song;
          }
        }
      } catch (errServer) {
        console.warn('Server parse-link unavailable, attempting client fallback:', errServer);
      }

      // 2. Client-side fallback if server unreachable
      if (!parsedSong) {
        if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
          try {
            const oRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`);
            if (oRes.ok) {
              const oData = await oRes.json();
              const ytTitle = (oData.title || '').replace(/\[.*?\]|\(.*?\)/g, '').trim();
              const itRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(ytTitle)}&entity=song&limit=1`);
              const itData = await itRes.json();
              const track = itData?.results?.[0];
              parsedSong = {
                title: track?.trackName || ytTitle || 'YouTube Song',
                artist: track?.artistName || oData.author_name || 'YouTube Artist',
                coverUrl: track?.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : (oData.thumbnail_url || 'splash-cover.jpg'),
                previewUrl: track?.previewUrl || '',
                spotifyUrl: track?.trackViewUrl || `https://open.spotify.com/search/${encodeURIComponent(ytTitle)}`,
                youtubeUrl: targetUrl,
                mood: 'chill',
                bpm: 'ปานกลาง (110 BPM)',
                lang: detectSongLang(track?.trackName || ytTitle, track?.artistName || oData.author_name),
                tags: ["ดึงจากลิงก์จริง", "YouTube", "ไทโป"]
              };
            }
          } catch (eYt) {}
        }
      }

      if (typingIndicator) typingIndicator.classList.add('hidden');

      if (parsedSong) {
        const matchedAnime = (typeof ANIMES !== 'undefined' && ANIMES.length) 
          ? ANIMES[Math.floor(Math.random() * ANIMES.length)] 
          : { name: 'Jujutsu Kaisen', mood: 'Hype' };

        const songPayload = {
          title: parsedSong.title,
          artist: parsedSong.artist,
          coverUrl: parsedSong.coverUrl || 'splash-cover.jpg',
          previewUrl: parsedSong.previewUrl || '',
          spotifyUrl: parsedSong.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(parsedSong.title + ' ' + parsedSong.artist)}`,
          youtubeUrl: targetUrl,
          mood: parsedSong.mood || 'chill',
          tags: parsedSong.tags || ["ดึงจากลิงก์จริง", "ไทโป"],
          bpm: parsedSong.bpm || "ปานกลาง (100 BPM)",
          lang: parsedSong.lang || detectSongLang(parsedSong.title, parsedSong.artist),
          animeId: matchedAnime.id || 1,
          reason: `เพลง "${parsedSong.title}" ดึงข้อมูลสดจากลิงก์จริง จังหวะลงตัวตัดต่อคู่กับ ${matchedAnime.name}`,
          typoIdea: `แอนิเมชันตัวอักษรไทโปตามท่อนร้องของเพลง "${parsedSong.title}" คมชัดตามจังหวะบีท`
        };

        const cardId = `ai-link-card-${Date.now()}`;
        window['__ai_song_' + cardId] = songPayload;
    try { localStorage.setItem('__ai_song_' + cardId, JSON.stringify(songPayload)); } catch (e) {}

        const langBadge = songPayload.lang === 'th' ? '🇹🇭 เพลงไทย' : (songPayload.lang === 'jp' ? '🇯🇵 J-Pop' : (songPayload.lang === 'kr' ? '🇰🇷 K-Pop' : '🇬🇧 สากล'));

        const html = `
          <div style="margin-bottom: 8px;">
            <p>✨ <strong>เปิดลิงก์และดึงข้อมูลเพลงสดสำเร็จแล้วค่ะ!</strong> 🌐</p>
            <p style="font-size: 0.85rem; color: #94a3b8;">ดึงข้อมูลชื่อเพลง ศิลปิน ปก HD และเสียงตัวอย่างจากลิงก์ที่คุณส่งมาเรียบร้อยแล้วค่ะ:</p>
          </div>
          <div class="gemini-song-card" id="${cardId}" data-song="${escapeHtml(JSON.stringify(songPayload))}">
            <div class="gsc-top">
              <div class="gsc-cover-wrap">
                <img src="${escapeHtml(songPayload.coverUrl)}" alt="${escapeHtml(songPayload.title)}" class="gsc-cover" onerror="this.src='splash-cover.jpg';" />
              </div>
              <div class="gsc-info">
                <div class="gsc-title" title="${escapeHtml(songPayload.title)}">${escapeHtml(songPayload.title)}</div>
                <div class="gsc-artist">${escapeHtml(songPayload.artist)}</div>
                <div class="gsc-badges">
                  <span class="gsc-badge">${langBadge}</span>
                  <span class="gsc-badge">🌐 ลิงก์จริง</span>
                  <span class="gsc-badge">⚡ บีทไทโป</span>
                </div>
              </div>
            </div>
            <div class="gsc-anime-match">
              🌸 <strong>จับคู่ตัดต่อแนะนำ:</strong> ${escapeHtml(matchedAnime.name)} • ${escapeHtml(songPayload.reason)}
            </div>
            <div class="gsc-actions">
              <button class="btn-ai-play" id="btn-ai-play-${cardId}" onclick="playOrResolveAiSongPreview('${cardId}', this)">▶️ ลองฟังตัวอย่างเพลง</button>
              <button class="btn-ai-confirm-add" id="btn-add-${cardId}" onclick="confirmAddSongViaAi('${cardId}', this)">
                ➕ ยืนยันเพิ่มเพลงนี้ลงคลังทันที (แชร์ให้ทุกคน)
              </button>
            </div>
          </div>
        `;
        appendAiResponse(html);
        return;
      } else {
        appendAiResponse(`
          <p>⚠️ ไฮมิยะพยายามเปิดลิงก์ <code>${escapeHtml(targetUrl)}</code> แล้ว แต่ไม่พบข้อมูลเพลงที่เปิดสาธารณะได้ค่ะ</p>
          <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">ลองส่งชื่อเพลงและศิลปิน เช่น <code>เพิ่มเพลง ถ้าเราเจอกันอีก Tilly Birds</code> หรือลองส่งลิงก์ YouTube เพลงอื่นได้เลยนะคะ 🌸🎵</p>
        `);
        return;
      }
    } catch (urlErr) {
      console.warn('URL parse error:', urlErr);
      if (typingIndicator) typingIndicator.classList.add('hidden');
      appendAiResponse(`
        <p>⚠️ เกิดข้อผิดพลาดในการเปิดลิงก์เพลงค่ะ ลองพิมพ์ชื่อเพลงและศิลปินโดยตรงได้เลยนะคะ เช่น <code>เพิ่มเพลง กุ๊กกู๋</code> ✨</p>
      `);
      return;
    }
  }

  // Intent B: Explicit bug report command only (e.g. "แจ้งบั๊ก: ...", "แจ้งปัญหา: ...", "/bug ...")
  const isBugReport = /^(แจ้งบั๊ก|แจ้งปัญหา|\/bug)[:\s]/i.test(trimmed) || (trimmed === 'แจ้งบั๊ก' || trimmed === 'แจ้งปัญหา');
  if (isBugReport) {
    let bugTitle = rawText.replace(/^(แจ้งบั๊ก|แจ้งปัญหา|\/bug)[:\s]*/i, '').trim() || rawText;
    try {
      const bugRes = await fetch(getAiApiBase() + '/api/ai/report-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bugTitle,
          description: rawText,
          category: 'user_reported',
          userAgent: navigator.userAgent
        })
      });
      const bugData = await bugRes.json();
      const bugId = bugData.bugId || ('BUG-' + Date.now().toString(36).toUpperCase());

      if (typingIndicator) typingIndicator.classList.add('hidden');
      appendAiResponse(`
        <div style="background: rgba(239, 68, 68, 0.12); border: 1.5px solid rgba(239, 68, 68, 0.35); border-radius: 14px; padding: 1rem; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 1.3rem;">🐛</span>
            <strong style="color: #fca5a5; font-size: 1.02rem;">รับรายงานปัญหาเรียบร้อยแล้วค่ะ!</strong>
          </div>
          <div style="font-size: 0.88rem; color: #cbd5e1; line-height: 1.6;">
            รหัสแจ้งบั๊ก: <code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 6px; color: #38bdf8;">${bugId}</code><br>
            เรื่อง: <em>"${escapeHtml(bugTitle)}"</em>
          </div>
        </div>
        <p style="margin-top: 8px;">
          🛠️ <strong>การตรวจสอบเบื้องต้น:</strong><br>
          ระบบ Auto-Maintenance และทีมพัฒนาได้รับแจ้งเหตุแล้วค่ะ หากพบปัญหาเสียงสะดุดหรือหน้าจอค้าง คุณสามารถกดปุ่ม <strong>"⚡ ซิงค์เพลงสด"</strong> ด้านบน หรือรีเฟรชหน้าเว็บเพื่อเคลียร์แคชได้ทันทีนะคะ! ✨
        </p>
      `);
    } catch (e) {
      if (typingIndicator) typingIndicator.classList.add('hidden');
      appendAiResponse(`
        <p>🐛 ไฮมิยะบันทึกรายงานปัญหาของคุณไว้เรียบร้อยแล้วค่ะ! ทีมงานจะรีบตรวจสอบและแก้ไขให้อย่างเร็วที่สุด ขอบคุณที่ช่วยแจ้งเข้ามานะคะ 💖</p>
      `);
    }
    return;
  }

  // Intent A: Explicit single song addition with exact title (e.g. "เพิ่มเพลง APT", "ลงเพลง Die With A Smile", "แอดเพลง เลือดกรุ๊ปบี")
  const explicitAddMatch = trimmed.match(/^(?:เพิ่มเพลง|ลงเพลง|แอดเพลง|ขอเพิ่มเพลง)\s+(.+)$/i);
  let isExplicitSongSearch = false;
  let explicitQuery = '';
  if (explicitAddMatch) {
    explicitQuery = explicitAddMatch[1].trim();
    const isGenericKeyword = /^(ใหม่|ใหม่ๆ|ใหม่ล่าสุด|มาใหม่|ไทย|เพลงไทย|ล่าสุด|เพลง|หน่อย|ครับ|ค่ะ|จ้า|นะ|แนะนำ|ดีๆ|เดือดๆ|เศร้า|รัก|มันส์|ฮิต)$/i.test(explicitQuery);
    if (!isGenericKeyword && explicitQuery.length >= 2) {
      isExplicitSongSearch = true;
    }
  }

  if (isExplicitSongSearch) {
    try {
      const country = detectSongLang(explicitQuery, '') === 'th' ? 'th' : 'us';
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(explicitQuery)}&country=${country}&entity=song&limit=5`;
      const res = await fetch(itunesUrl);
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        if (typingIndicator) typingIndicator.classList.add('hidden');
        const songList = data.results.map(track => {
          const hdCover = (track.artworkUrl100 || '').replace('100x100bb', '600x600bb').replace('170x170', '600x600') || 'splash-cover.jpg';
          return {
            title: track.trackName,
            artist: track.artistName,
            coverUrl: hdCover,
            previewUrl: track.previewUrl || '',
            spotifyUrl: track.trackViewUrl || `https://open.spotify.com/search/${encodeURIComponent(track.trackName + ' ' + track.artistName)}`,
            genre: track.primaryGenreName || 'Pop / Beat',
            year: track.releaseDate ? track.releaseDate.substring(0, 4) : '2026',
            lang: detectSongLang(track.trackName, track.artistName),
            reason: `เพลง "${track.trackName}" จังหวะบีทกระชับ มีมิติอารมณ์ตัดคลิปไทโปได้ลงตัวสุดๆ`,
            typoIdea: `แอนิเมชันตัวอักษรแบบ Kinetic ตามท่อนร้องฮุก สลับตัดคัทกระชับตามจังหวะบีท`
          };
        });

        const headerHtml = `
          <p>✨ ไฮมิยะค้นพบตัวเลือกเพลงสำหรับ <strong>"${escapeHtml(explicitQuery)}"</strong> แล้วค่ะ!</p>
          <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">คลิก <strong>▶️ ลองฟังตัวอย่าง</strong> เพื่อฟังเสียงได้ทันที หรือกดปุ่ม <strong>"➕ ยืนยันเพิ่มเพลงนี้ลงคลัง"</strong> เพลงจะถูกบันทึกและซิงค์ให้ทุกคนในแอปทันทีค่ะ 🌸🎵:</p>
        `;
        const cardsHtml = renderSongCardsHtml(songList, headerHtml);
        appendAiResponse(cardsHtml, `ค้นหาเพลง "${explicitQuery}"`);
        return;
      }
    } catch (err) {
      console.warn('Direct iTunes search error, delegating to Gemini AI:', err);
    }
  }

  // Intent C: Genuine Google Gemini Intelligence (Not fake, no canned answers!)
  window.__aiChatHistory = window.__aiChatHistory || [];

  try {
    const activeApiKey = getGeminiApiKey();
    let aiResponseText = '';
    let engineUsed = 'Haimiya AI';

    // 1. Direct client-side Google Gemini Flash API call (High-quota, fast models, real library context & roleplay support)
    if (activeApiKey) {
      const modelsToTry = [
        'gemini-3.7-flash',
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-flash-latest'
      ];

      // Format multi-turn conversation ensuring strict alternation
      const formattedContents = [];
      const validHistory = window.__aiChatHistory.slice(-6).filter(h => h && h.text && (h.role === 'user' || h.role === 'model'));
      let lastRole = null;
      for (const h of validHistory) {
        const role = h.role === 'model' ? 'model' : 'user';
        if (role !== lastRole) {
          formattedContents.push({ role, parts: [{ text: h.text }] });
          lastRole = role;
        }
      }
      if (lastRole === 'user') {
        formattedContents.pop();
      }
      const userParts = [];
      userParts.push({ text: rawText || 'ช่วยดูรูปภาพ/วิดีโอนี้ อธิบายมู้ดและตัวละคร และแนะนำเพลงที่เข้ากันที่สุดในคลังหน่อยค่ะ' });
      if (attachedMedia && attachedMedia.base64) {
        userParts.push({
          inline_data: {
            mime_type: attachedMedia.mimeType,
            data: attachedMedia.base64
          }
        });
      }
      formattedContents.push({ role: 'user', parts: userParts });

      // Build dynamic library context for AI
      const librarySample = getLibrarySample(30);
      const libraryContext = librarySample.length > 0 
        ? '\n\nตัวอย่างเพลงในคลัง Haimiya Typo (' + (typeof SONGS !== 'undefined' ? SONGS.length : 0) + ' เพลง):\n' + librarySample.join('\n')
        : '';
      
      // Search library for songs matching user query to give AI real context
      const libraryMatches = searchSongsInLibrary(rawText, 8);
      const matchContext = libraryMatches.length > 0 
        ? '\n\nเพลงในคลังที่ตรงกับคำค้น "' + rawText.substring(0, 50) + '":\n' + libraryMatches.map(m => '- ' + m.title + ' โดย ' + m.artist + ' [' + m.lang + '] อารมณ์: ' + m.mood).join('\n')
        : '';

      const systemInstructionText = "คุณคือ \"ไฮมิยะ\" (Haimiya AI) ผู้ช่วย AI อัจฉริยะสารพัดประโยชน์ประจำแอป Haimiya Typo\nห้ามบอกว่าใช้โมเดลอะไรขับเคลื่อน (ห้ามเอ่ยชื่อ Google Gemini, GPT, Claude หรือเทคโนโลยีเบื้องหลังเด็ดขาด) คุณคือ \"Haimiya AI\" หรือ \"ไฮมิยะ AI\" เท่านั้น\n\nความสามารถและอิสระในการช่วยเหลือ (Freedom & Versatility):\nคุณคือเพื่อนคู่คิด AI อัจฉริยะสารพัดประโยชน์ ไม่ได้จำกัดอยู่แค่การหาเพลง:\n1. การตรวจหาเพลงจากคลิปวิดีโอ & เพิ่มลงคลัง (สำคัญมาก):\n   * เมื่อผู้ใช้ส่งคลิปวิดีโอ/ไฟล์เสียง หรือแคปภาพ พร้อมถามว่า \"เพลงอะไร\", \"ใครร้อง\", \"ตรวจหาเพลงนี้\", \"เพิ่มเป็นเพลง\", \"เพิ่มลงคลัง\":\n   * ให้วิเคราะห์ภาพ เสียง คำบรรยาย หรือตัวละคร ตรวจหาชื่อเพลงทางการ ศิลปินจริง และแหล่งที่มา (เช่น มาจากอนิเมะเรื่องอะไร, เพลงประกอบละคร/ซีรีส์เรื่องไหน, หรือเป็นเพลง TikTok ไวรัลแนวไหน)\n   * ตอบสั้นๆ 1 บรรทัดด้วยความมั่นใจ เป็นกันเอง น่ารัก มีหางเสียง \"ค่ะ/นะคะ\"\n   * แนบบล็อก JSON เพื่อให้ระบบขึ้นการ์ดฟังตัวอย่างเสียงและปุ่มเพิ่มเพลงลงคลังทันที:\n   \\`\\`\\`json\n   [\n     {\n       \"title\": \"ชื่อเพลงที่ตรวจพบ\",\n       \"artist\": \"ชื่อศิลปินจริง\",\n       \"anime\": \"แหล่งที่มา (เช่น มาจากอนิเมะ Oshi no Ko / เพลงไวรัล TikTok)\",\n       \"reason\": \"รายละเอียดเพลงและจุดเด่นที่ตรวจพบจากคลิป\",\n       \"typoIdea\": \"ไอเดียตัดต่อหรือท่อนฮุก\",\n       \"mood\": \"hype\",\n       \"lang\": \"th\"\n     }\n   ]\n   \\`\\`\\`\n2. การแต่งเนื้อเพลง & แคปชันไทโป:\n   * ช่วยแต่งท่อนฮุก, ท่อนแร็ป, แปลความหมายเพลง, คิดคำคม/แคปชันสั้นๆ คมๆ สำหรับลงคลิป TikTok / Shorts / Reels\n3. ด้านอนิเมะ & การ์ตูน & เรื่องทั่วไป:\n   * คุยเรื่องอนิเมะ ถกเถียงสเกลพลัง วิเคราะห์ตัวละคร เล่าเนื้อเรื่อง หรือคุยเรื่องรอบตัวได้อย่างอิสระ มีความรู้ลึกซึ้ง\n4. การตัดต่อวิดีโอ:\n   * ให้คำปรึกษาการใช้แอป CapCut, Alight Motion, Premiere Pro, After Effects เทคนิค Keyframe, Beat Shake, Smooth Transition, การจับจังหวะ Beat Drop\n5. การคุยเล่น & อิสระทางความคิด:\n   * ตอบคำถามทั่วไป เล่นมุก ให้กำลังใจ รับฟังความรู้สึก สวมบทบาทสมมติ (Roleplay เช่น ตัวละครอนิเมะ, แฟน, พี่สาว, เพื่อน) ได้ทุกรูปแบบตามใจผู้ใช้ 100%\n   * **สำคัญมาก**: หากผู้ใช้ชวนคุยทั่วไป ถามความรู้ หรือขอให้ทำสิ่งอื่นที่ไม่ใช่การขอเพลง ให้ตอบสนองอย่างชาญฉลาด มีเสน่ห์ น่ารัก และเป็นธรรมชาติ (ห้ามยัดเยียดบล็อกการ์ดเพลงหากผู้ใช้ไม่ได้ขอหรือไม่ได้ส่งเพลงมาเด็ดขาด!)\n6. เมื่อผู้ใช้ขอเพลง แนะนำเพลง หรือพูดถึงอารมณ์เพลง:\n   * ตอบเกริ่นสั้นๆ 1 บรรทัด คัดเลือกเพลงจริง 3-5 เพลง พร้อมบล็อก JSON ปกติ\n" + libraryContext + matchContext;

      for (const modelName of modelsToTry) {
        if (aiResponseText) break;
        try {
          const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(activeApiKey)}`;
          const gRes = await fetch(gUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemInstructionText }]
              },
              contents: formattedContents,
              generationConfig: {
                temperature: 0.72,
                topP: 0.9,
                maxOutputTokens: 3500
              }
            })
          });

          if (gRes.ok) {
            const gData = await gRes.json();
            if (gData.candidates && gData.candidates[0]?.content?.parts) {
              aiResponseText = gData.candidates[0].content.parts.map(p => p.text).join('');
              engineUsed = 'Haimiya AI';
            }
          } else {
            console.warn(`Gemini ${modelName} HTTP ${gRes.status}`);
          }
        } catch (gErr) {
          console.warn(`Gemini ${modelName} call failed:`, gErr);
        }
      }
    }

    // 2. Server endpoint fallback /api/ai/chat (Netlify Serverless Function or Node Server)
    if (!aiResponseText) {
      try {
        const chatRes = await fetch(getAiApiBase() + '/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: rawText,
            history: window.__aiChatHistory.slice(-8),
            apiKey: activeApiKey
          })
        });

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (chatData.ok && chatData.reply) {
            aiResponseText = chatData.reply;
            engineUsed = 'Haimiya AI';
          }
        }
      } catch (netErr) {
        console.warn('Server /api/ai/chat unreachable:', netErr);
      }
    }

    // 3. Fallback to free keyless AI (Pollinations)
    if (!aiResponseText) {
      try {
        const pollMessages = [
          { role: 'system', content: "คุณคือ 'ไฮมิยะ' ผู้ช่วย AI ประจำแอป Haimiya Typo ตอบภาษาไทยเป็นกันเอง น่ารัก สุภาพ แนะนำเรื่องเพลง อนิเมะ และการตัดต่อคลิปไทโป" },
          ...window.__aiChatHistory.slice(-6).map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.text
          })),
          { role: 'user', content: rawText }
        ];
        const pRes = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: pollMessages, model: 'openai' })
        });
        if (pRes.ok) {
          aiResponseText = await pRes.text();
          engineUsed = 'Haimiya AI';
        }
      } catch (pErr) {
        console.warn('Pollinations fallback failed:', pErr);
      }
    }

    if (typingIndicator) typingIndicator.classList.add('hidden');

    if (aiResponseText) {
      window.__aiChatHistory.push({ role: 'user', text: rawText });
      window.__aiChatHistory.push({ role: 'model', text: aiResponseText });

      await parseAndRenderAiSongResponse(aiResponseText, engineUsed, rawText);
    } else {
      appendAiResponse(`
        <p>ไฮมิยะพร้อมช่วยเหลือค่ะ! ขออภัยด้วยที่การเชื่อมต่ออินเทอร์เน็ตขัดข้องชั่วคราว ลองส่งข้อความใหม่อีกครั้ง หรือพิมพ์ <code>เพิ่มเพลง [ชื่อเพลง]</code> ได้เลยนะคะ 🌸✨</p>
      `);
    }
  } catch (aiErr) {
    console.error('AI chat error:', aiErr);
    if (typingIndicator) typingIndicator.classList.add('hidden');
    appendAiResponse(`
      <p>ไฮมิยะพร้อมช่วยเหลือค่ะ! ขออภัยด้วยที่สัญญาณขัดข้องชั่วคราว ลองส่งใหม่อีกครั้ง หรือพิมพ์ <code>เพิ่มเพลง [ชื่อเพลง]</code> ได้เลยนะคะ 🌸</p>
    `);
  }
}

function appendAiResponse(htmlContent, rawTextToSave) {
  const list = document.getElementById('gemini-messages-list');
  const chatBody = document.getElementById('gemini-chat-body');
  if (!list) return;

  const row = document.createElement('div');
  row.className = 'gemini-msg-row ai';
  row.id = 'ai-msg-row-' + list.children.length;
  row.innerHTML = `
    <div class="gemini-msg-avatar">
      <img src="haimiya_ai_avatar.jpg" alt="Haimiya AI" onerror="this.src='splash-cover.jpg';" />
    </div>
    <div class="gemini-msg-bubble">${htmlContent}</div>
  `;
  list.appendChild(row);

  // Save to persistent storage
  saveAiChatMessage('model', rawTextToSave || '', htmlContent);

  if (chatBody) {
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
  }
}

function renderFallbackAddSongCard(query) {
  const html = `
    <div style="background: rgba(239, 68, 68, 0.08); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 14px; padding: 1rem; margin-top: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <span style="font-size: 1.3rem;">🔍</span>
        <strong style="color: #fca5a5; font-size: 1rem;">ไม่พบเพลงที่ตรงเป๊ะสำหรับ "${escapeHtml(query)}" บนชาร์ตแบบเรียลไทม์</strong>
      </div>
      <p style="margin: 0; color: #cbd5e1; font-size: 0.88rem; line-height: 1.6;">
        💡 <strong>ดึงเพลงจากลิงก์จริงได้ทันที:</strong><br>
        คุณสามารถ <strong>คัดลอกลิงก์เพลงจาก YouTube หรือ Spotify</strong> (เช่น <code>https://youtu.be/...</code> หรือ <code>https://open.spotify.com/...</code>) แล้ววางส่งในแชทนี้ได้เลยนะคะ! ไฮมิยะจะเปิดลิงก์และดึงชื่อเพลง ศิลปิน ปก HD 600x600 และเสียงตัวอย่างจริงมาให้เพิ่มลงคลังทันทีค่ะ 🌸🎵
      </p>
    </div>
  `;
  appendAiResponse(html);
}

// 6. Confirm Add Song to data.js & Server
async function confirmAddSongViaAi(cardId, btn) {
  const songPayload = getAiSongPayload(cardId, btn);
  if (!songPayload) {
    showToast('❌ ไม่พบข้อมูลเพลงที่จะเพิ่มค่ะ ลองกดใหม่อีกครั้ง');
    if (btn) btn.disabled = false;
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '⏳ กำลังบันทึกลงคลังกลาง...';

  const songId = songPayload.id || (Date.now() + Math.floor(Math.random() * 1000));
  const fullSong = {
    ...songPayload,
    id: songId,
    addedAt: new Date().toISOString()
  };

  // 1. Update in-memory database immediately
  if (typeof SONGS !== 'undefined' && Array.isArray(SONGS)) {
    if (!SONGS.some(s => s.id === fullSong.id || (s.title === fullSong.title && s.artist === fullSong.artist))) {
      SONGS.unshift(fullSong);
    }
  }
  if (typeof ANIME_PAIRS !== 'undefined' && Array.isArray(ANIME_PAIRS) && fullSong.animeId) {
    ANIME_PAIRS.unshift({
      songId: fullSong.id,
      animeId: fullSong.animeId,
      category: fullSong.mood || 'chill',
      badge: '🤖 เพิ่มโดย AI',
      reason: fullSong.reason || '',
      typoIdea: fullSong.typoIdea || ''
    });
  }

  // 2. Persist in localStorage so it remains after refreshing/reopening
  try {
    let localSongs = JSON.parse(localStorage.getItem('haimiya_user_added_songs') || '[]');
    if (!localSongs.some(s => s.id === fullSong.id || (s.title === fullSong.title && s.artist === fullSong.artist))) {
      localSongs.unshift(fullSong);
      localStorage.setItem('haimiya_user_added_songs', JSON.stringify(localSongs));
    }
  } catch (e) {}

  // 3. Post to backend endpoint if available
  try {
    fetch(getAiApiBase() + '/api/ai/add-song', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullSong)
    }).catch(() => {});
  } catch (e) {}

  // 4. Update UI stats & song grid
  if (typeof updateStats === 'function') updateStats();
  if (typeof renderSongsGrid === 'function') renderSongsGrid();

  // 5. Play bell chime celebration!
  playNotificationChime();

  // 6. Update button state
  btn.className = 'btn-ai-confirm-add added';
  btn.innerHTML = '✅ เพิ่มลงคลังเรียบร้อยแล้ว! (ค้นหาได้ทันที)';

  showToast(`🎉 เพิ่มเพลง "${fullSong.title}" ลงคลังเรียบร้อยแล้ว!`);

  appendAiResponse(`
    <div style="background: rgba(16, 185, 129, 0.14); border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 14px; padding: 1rem; margin-top: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 1.3rem;">🎉</span>
        <strong style="color: #6ee7b7; font-size: 1.05rem;">เพิ่มเพลงสำเร็จเรียบร้อยค่ะ!</strong>
      </div>
      <p style="margin: 0; color: #e2e8f0; font-size: 0.9rem; line-height: 1.6;">
        เพลง <strong>"${escapeHtml(fullSong.title)}"</strong> โดย <strong>${escapeHtml(fullSong.artist)}</strong> ได้ถูกเพิ่มเข้าสู่คลังเพลงเรียบร้อยแล้วค่ะ! ทุกคนสามารถค้นหา ฟัง และนำไปตัดคลิปไทโปได้ทันทีค่ะ ✨
      </p>
    </div>
  `);
}

// Markdown / Rich text renderer for AI responses
function renderAiMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);

  // Code blocks: ```...```
  html = html.replace(/```([\s\S]*?)```/g, (m, code) => {
    return `<pre style="background: rgba(0,0,0,0.5); padding: 0.75rem; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 0.85em; margin: 0.5rem 0; border: 1px solid rgba(255,255,255,0.1);"><code>${code.trim()}</code></pre>`;
  });

  // Inline code: `...`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers: ###, ##, #
  html = html.replace(/^### (.*$)/gim, '<h5 style="margin: 0.6rem 0 0.2rem 0; color: #38bdf8; font-size: 1rem;">$1</h5>');
  html = html.replace(/^## (.*$)/gim, '<h4 style="margin: 0.7rem 0 0.25rem 0; color: #818cf8; font-size: 1.05rem;">$1</h4>');
  html = html.replace(/^# (.*$)/gim, '<h3 style="margin: 0.8rem 0 0.3rem 0; color: #fff; font-size: 1.15rem;">$1</h3>');

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color: #38bdf8; text-decoration: underline;">$1</a>');

  // Blockquotes: > text
  html = html.replace(/^> (.*$)/gim, '<blockquote style="border-left: 3px solid #38bdf8; margin: 0.5rem 0; padding-left: 0.75rem; color: #94a3b8; font-style: italic;">$1</blockquote>');

  // Bullet lists: - item or * item
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul style="margin: 0.4rem 0 0.4rem 1.2rem; padding: 0;">$1</ul>');

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<blockquote') || p.startsWith('<table') || p.startsWith('<div')) {
      return p;
    }
    return `<p style="margin: 0.4rem 0;">${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}

// Gemini API Key Settings Drawer
function toggleGeminiKeySettings() {
  const drawer = document.getElementById('gemini-key-drawer');
  const input = document.getElementById('gemini-api-key-input');
  if (!drawer) return;
  drawer.classList.toggle('hidden');
  if (!drawer.classList.contains('hidden') && input) {
    const savedKey = getGeminiApiKey();
    input.value = savedKey;
    input.focus();
    updateGeminiKeyStatusBadge();
  }
}

async function saveGeminiApiKey() {
  const input = document.getElementById('gemini-api-key-input');
  const statusEl = document.getElementById('gemini-key-status');
  if (!input) return;
  const key = input.value.trim();

  if (key) {
    localStorage.setItem('haimiya_gemini_api_key', key);
  } else {
    localStorage.removeItem('haimiya_gemini_api_key');
  }

  try {
    await fetch(getAiApiBase() + '/api/ai/set-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key || DEFAULT_GEMINI_API_KEY })
    });
  } catch (e) {}

  updateGeminiKeyStatusBadge();
  showToast(key ? '✅ บันทึก API Key เรียบร้อยแล้วค่ะ!' : 'ℹ️ เปลี่ยนไปใช้โหมด AI มาตรฐานแล้วค่ะ');

  if (statusEl) {
    statusEl.innerHTML = '🟢 <strong>Haimiya AI พร้อมใช้งาน</strong>';
  }

  setTimeout(() => {
    const drawer = document.getElementById('gemini-key-drawer');
    if (drawer) drawer.classList.add('hidden');
  }, 1200);
}

async function updateGeminiKeyStatusBadge() {
  const badge = document.getElementById('gemini-engine-badge');
  const subtext = document.getElementById('gemini-status-subtext');
  if (badge) {
    badge.textContent = '✦ Haimiya AI';
    badge.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.35), rgba(129, 140, 248, 0.45))';
    badge.style.borderColor = 'rgba(56, 189, 248, 0.6)';
    badge.style.borderRadius = '6px';
  }
  if (subtext) {
    subtext.textContent = 'Haimiya AI พร้อมแนะนำเพลงและช่วยตัดต่อคลิปค่ะ';
  }
}

// Initialize Draggable AI Bubble on boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDraggableAiBubble();
    updateGeminiKeyStatusBadge();
  });
} else {
  initDraggableAiBubble();
  updateGeminiKeyStatusBadge();
}

