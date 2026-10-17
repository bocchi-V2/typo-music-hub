// ============================================
//  APP.JS – Typo Music Platform (Studio Edition)
//  ระบบสุ่มเพลงแยกโซน ปรับระดับเสียง และจับคู่อนิเมะสำหรับนักตัดต่อ
// ============================================

// ---- ANIME COVER IMAGE HELPERS ----
// สร้าง img tag ที่มี fallback URL อัตโนมัติกรณีรูปโหลดไม่ขึ้น พร้อมรองรับ eager/high priority

// Fast O(1) Lookup Maps for instant rendering performance
let ANIME_MAP = new Map();
let SONG_MAP = new Map();

function initDataMaps() {
  if (typeof ANIMES !== 'undefined' && Array.isArray(ANIMES)) {
    ANIME_MAP = new Map(ANIMES.map(a => [a.id, a]));
  }
  if (typeof SONGS !== 'undefined' && Array.isArray(SONGS)) {
    SONG_MAP = new Map(SONGS.map(s => [s.id, s]));
  }
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
    searchPlaceholder: "ค้นหาเพลง, ศิลปิน, แท็ก หรือชื่ออนิเมะ...",
    allMoods: "ทุกอารมณ์",
    moodSad: "💔 เศร้า",
    moodLove: "❤️ รัก",
    moodHype: "🔥 เร้าใจ",
    moodChill: "🌊 ชิลล์",
    loadMoreBtn: "⬇ แสดงเพลงเพิ่มเติม",
    previewBtn: "ฟังตัวอย่าง 30s",
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
    searchPlaceholder: "Search song, artist, tag, or anime...",
    allMoods: "All Moods",
    moodSad: "💔 Sad",
    moodLove: "❤️ Romantic",
    moodHype: "🔥 Hype",
    moodChill: "🌊 Chill",
    loadMoreBtn: "⬇ Show More Songs",
    previewBtn: "Preview 30s",
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
  if (currentAppLang === 'en') {
    return (anime.genre || []).map(translateGenre).join(', ');
  }
  return anime.name ? `${anime.name} • ${(anime.genre || []).join(', ')}` : (anime.genre || []).join(', ');
}

function getZoneName(zone) {
  if (currentAppLang === 'th') {
    if (zone === 'th') return '🇹🇭 โซนเพลงไทย';
    if (zone === 'en') return '🇬🇧 โซนเพลงสากล';
    if (zone === 'jp') return '🇯🇵 โซนเพลงญี่ปุ่น / อนิเมะ';
    if (zone === 'lao') return '🇱🇦 โซนเพลงลาว / อีสาน';
    if (zone === 'kr') return '🇰🇷 โซนเพลงเกาหลี / K-Pop';
    return '🌐 สุ่มรวมทุกโซน';
  } else {
    if (zone === 'th') return '🇹🇭 Thai Songs Zone';
    if (zone === 'en') return '🇬🇧 Global Songs Zone';
    if (zone === 'jp') return '🇯🇵 Japanese & Anime Zone';
    if (zone === 'lao') return '🇱🇦 Lao & Isan Zone';
    if (zone === 'kr') return '🇰🇷 K-Pop Zone';
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
    return '🇹🇭 ไทย';
  } else {
    if (l === 'en') return '🇬🇧 Global';
    if (l === 'jp') return '🇯🇵 Japanese';
    if (l === 'lao') return '🇱🇦 Lao';
    if (l === 'kr') return '🇰🇷 K-Pop';
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
  const label = isPlaying
    ? (currentAppLang === 'th' ? 'กำลังเล่น' : 'Playing')
    : (currentAppLang === 'th' ? 'ฟังตัวอย่าง 30s' : 'Preview 30s');

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
    <span class="play-duration-badge">0:30</span>
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

let _sharedAudioPlayer = null;
let _lastBlobUrl = null;
function getSharedAudioPlayer() {
  if (!_sharedAudioPlayer) {
    _sharedAudioPlayer = new Audio();
    _sharedAudioPlayer.preload = 'auto';
    // ตั้งค่า crossOrigin เพื่อลดปัญหา CORS audio stutter
    _sharedAudioPlayer.crossOrigin = 'anonymous';
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

function togglePlaySong(songId) {
  const song = SONGS.find(s => s.id === songId);
  const audioSrc = song ? (song.previewUrl || song.audioUrl || song.audioFallback) : null;
  if (!song || !audioSrc) {
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
      if (isLoopTrack) {
        audio.currentTime = 0;
        audio.play().then(() => updateAudioUI(true)).catch(() => {
          updateAudioUI(false);
          resumeRelaxBgm();
        });
      } else {
        // ใช้ setTimeout เล็กน้อยเพื่อให้ audio buffer ล้างก่อนเปลี่ยนเพลง ลด stutter
        setTimeout(() => playNextSong(), 50);
      }
    };

    // Throttle timeupdate to reduce UI jank and audio stuttering on low-end devices
    // เพิ่ม interval เป็น 350ms เพื่อลดภาระ CPU บนมือถือ
    let _lastProgressUpdate = 0;
    audio.ontimeupdate = () => {
      const now = performance.now();
      if (now - _lastProgressUpdate > 350) {
        _lastProgressUpdate = now;
        requestAnimationFrame(() => updateBottomPlayerProgress());
      }
    };

    const targetSrc = playableUrl || url;
    _lastBlobUrl = targetSrc;
    if (targetSrc.startsWith('blob:') || targetSrc.startsWith('data:')) {
      audio.removeAttribute('crossorigin');
    } else {
      audio.crossOrigin = 'anonymous';
    }
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
    const thisPlaying = id === currentPlayingId && isPlaying;
    const label = thisPlaying
      ? (currentAppLang === 'th' ? 'กำลังเล่น' : 'Playing')
      : (currentAppLang === 'th' ? 'ฟังตัวอย่าง 30s' : 'Preview 30s');

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
      <span class="play-duration-badge">0:30</span>
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
          <img src="${song.coverUrl}" alt="${song.title}" class="bp-cover ${currentAudio && !currentAudio.paused ? 'spinning' : ''}" id="bp-cover-img"
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
          <div class="bp-progress-bar" onclick="seekAudio(event)">
            <div class="bp-progress-fill" id="bp-progress-fill"></div>
          </div>
          <span class="bp-time" id="bp-time-total">0:30</span>
        </div>
      </div>

      <!-- Actions & Volume Panel (Responsive for Desktop & Mobile) -->
      <div class="bp-actions-panel">
        <div class="bp-actions">
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
  const dur = currentAudio.duration || 30;
  const pct = Math.min((cur / dur) * 100, 100);

  const fill = document.getElementById('bp-progress-fill');
  if (fill) fill.style.width = pct + '%';

  const topFill = document.getElementById('bp-top-progress-fill');
  if (topFill) topFill.style.width = pct + '%';

  const curEl = document.getElementById('bp-time-cur');
  if (curEl) {
    const m = Math.floor(cur / 60);
    const s = Math.floor(cur % 60).toString().padStart(2, '0');
    curEl.textContent = `${m}:${s}`;
  }
}

function seekAudio(e) {
  if (!currentAudio || !currentAudio.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const pct = clickX / rect.width;
  currentAudio.currentTime = pct * currentAudio.duration;
}

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
  const pair = ANIME_PAIRS.find(p => p.songId === song.id);
  const anime = ANIMES.find(a => a.id === song.animeId) || (pair ? ANIMES.find(a => a.id === pair.animeId) : null) ||
                { name: song.title || '', nameTH: song.artist || '', coverUrl: song.coverUrl || '', coverFallback: 'favicon-logo.jpg', genre: [], anifumeUrl: '#' };
  const isPlaying = currentPlayingId === song.id && currentAudio && !currentAudio.paused;
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

    // Smart Fallback: ถ้าเงื่อนไขแน่นเกินไปจนไม่พบเพลง ให้ขยายเงื่อนไขอัตโนมัติ
    if (!eligible || eligible.length === 0) {
      // 1. ลองปลด BPM filter ก่อน
      eligible = SONGS.filter(s => (selectedZone === 'all' || s.lang === selectedZone) && (selectedRandomMood === 'all' || normalizeMood(s.mood) === selectedRandomMood));
      relaxedFilter = true;
    }
    if (!eligible || eligible.length === 0) {
      // 2. ลองปลด Mood filter
      eligible = SONGS.filter(s => selectedZone === 'all' || s.lang === selectedZone);
      relaxedFilter = true;
    }
    if (!eligible || eligible.length === 0) {
      // 3. Fallback รวมทุกเพลง
      eligible = SONGS;
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
  const genreList = (anime.genre || []).map(g => String(g).toLowerCase());
  const nameStr = `${anime.name || ''} ${anime.nameTH || ''}`.toLowerCase();
  for (const b of BLOCKED_GENRES) {
    const bLower = b.toLowerCase();
    if (genreList.some(g => g.includes(bLower)) || nameStr.includes(bLower)) {
      return false;
    }
  }
  return true;
}

function songCardHTML(song, index = 0) {
  // ค้นหาอนิเมะจาก animeId ของเพลง ถ้าไม่เจอให้แสดงข้อมูลเปล่า ไม่ fallback ไปใช้อนิเมะอื่นที่ไม่เกี่ยวข้อง
  const anime = (ANIMES && song.animeId && ANIMES.find(a => a.id === song.animeId)) ||
                { name: song.title || '', nameTH: song.artist || '', coverUrl: song.coverUrl || '', coverFallback: 'favicon-logo.jpg', genre: [] };
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
        <a href="${song.spotifyUrl}" target="_blank" class="btn-sm btn-spotify">
          🎧 Spotify
        </a>
        <button class="btn-sm btn-anime-match" onclick="openAnimePicker(${song.id})" title="${currentAppLang === 'th' ? 'เปลี่ยนคู่ตัดต่ออนิเมะ' : 'Switch matched anime'}">
          ${currentAppLang === 'th' ? '🌸 จับคู่อนิเมะ' : '🌸 Anime Match'}
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
    const matchLang = s.lang === currentLangFilter;
    const matchMood = currentMoodFilter === 'all' || normalizeMood(s.mood) === currentMoodFilter;

    const anime = ANIME_MAP.get(s.animeId);
    const animeNames = (term && anime) ? `${anime.nameTH} ${anime.name}`.toLowerCase() : '';

    const matchSearch = !term
      || s.title.toLowerCase().includes(term)
      || s.artist.toLowerCase().includes(term)
      || s.tags.some(t => t.toLowerCase().includes(term))
      || animeNames.includes(term);

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

  const count = SONGS.filter(s => s.lang === currentLangFilter).length;
  let zoneName = '';
  if (currentAppLang === 'th') {
    if (currentLangFilter === 'th') zoneName = 'โซนเพลงไทย';
    else if (currentLangFilter === 'en') zoneName = 'โซนเพลงสากล (English)';
    else if (currentLangFilter === 'jp') zoneName = 'โซนเพลงญี่ปุ่น / อนิเมะ';
    else if (currentLangFilter === 'lao') zoneName = '🇱🇦 โซนเพลงลาว / อีสาน';
    else if (currentLangFilter === 'kr') zoneName = '🇰🇷 โซนเพลงเกาหลี / K-Pop';
    else zoneName = 'ทุกลำดับเพลง';
    bannerText.innerHTML = `📍 กำลังแสดง: <strong>${zoneName}</strong> (${count} เพลง) — แสดงเฉพาะเพลงในโซนนี้`;
  } else {
    if (currentLangFilter === 'th') zoneName = 'Thai Songs Zone';
    else if (currentLangFilter === 'en') zoneName = 'Global Songs Zone (English)';
    else if (currentLangFilter === 'jp') zoneName = 'Japanese & Anime Zone';
    else if (currentLangFilter === 'lao') zoneName = 'Lao & Isan Zone';
    else if (currentLangFilter === 'kr') zoneName = 'K-Pop Zone';
    else zoneName = 'All Tracks';
    bannerText.innerHTML = `📍 Active: <strong>${zoneName}</strong> (${count} songs) — Showing this zone only`;
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

  // Hide all first
  [wsMusic, wsPairs, wsVersus, wsSaved].forEach(w => w && w.classList.add('hidden'));

  const musicZones = ['th', 'en', 'jp', 'lao', 'kr'];
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

  let pool = SONGS.filter(s => !vsRecentSongIds.includes(s.id));
  if (pool.length < 2) pool = SONGS;

  const aIndex = Math.floor(Math.random() * pool.length);
  vsLeftSong = pool[aIndex];

  let rightPool = pool.filter(s => s.id !== vsLeftSong.id);
  if (!rightPool.length) rightPool = SONGS.filter(s => s.id !== vsLeftSong.id);
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

  SONGS.forEach(s => {
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

// openAnimeMatchModal now shows default pairing directly
function openAnimeMatchModal(songId) {
  const song = SONGS.find(s => s.id === songId);
  if (!song) return;

  const pairs = ANIME_PAIRS.filter(p => p.songId === songId);
  const anime = ANIMES.find(a => a.id === song.animeId) || (pairs.length ? ANIMES.find(a => a.id === pairs[0].animeId) : ANIMES[0]);

  if (!anime) {
    openAnimePicker(songId);
    return;
  }
  // Show pair detail directly
  selectAnimePair(songId, anime.id);
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
  const tabIos = document.getElementById('tab-btn-ios');
  const tabAndroid = document.getElementById('tab-btn-android');
  const panelIos = document.getElementById('install-panel-ios');
  const panelAndroid = document.getElementById('install-panel-android');

  if (platform === 'ios') {
    if (tabIos) {
      tabIos.classList.add('active');
      tabIos.style.background = 'linear-gradient(135deg, #38bdf8, #818cf8)';
      tabIos.style.color = '#fff';
      tabIos.style.boxShadow = '0 4px 14px rgba(56, 189, 248, 0.4)';
    }
    if (tabAndroid) {
      tabAndroid.classList.remove('active');
      tabAndroid.style.background = 'transparent';
      tabAndroid.style.color = '#94a3b8';
      tabAndroid.style.boxShadow = 'none';
    }
    if (panelIos) panelIos.style.display = 'block';
    if (panelAndroid) panelAndroid.style.display = 'none';
  } else {
    if (tabAndroid) {
      tabAndroid.classList.add('active');
      tabAndroid.style.background = 'linear-gradient(135deg, #38bdf8, #818cf8)';
      tabAndroid.style.color = '#fff';
      tabAndroid.style.boxShadow = '0 4px 14px rgba(56, 189, 248, 0.4)';
    }
    if (tabIos) {
      tabIos.classList.remove('active');
      tabIos.style.background = 'transparent';
      tabIos.style.color = '#94a3b8';
      tabIos.style.boxShadow = 'none';
    }
    if (panelAndroid) panelAndroid.style.display = 'block';
    if (panelIos) panelIos.style.display = 'none';
  }
}

function openAppModal() {
  const modal = document.getElementById('app-install-modal');
  if (modal) {
    modal.classList.remove('hidden');

    // ตรวจสอบอัตโนมัติว่าเป็นเครื่อง iOS (iPhone / iPad) หรือ Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      switchInstallTab('ios');
    } else {
      switchInstallTab('android');
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

function openAnimePicker(songId) {
  const song = SONGS.find(s => s.id === songId);
  if (!song) return;
  _pickerSongId = songId;

  const songMood = song.mood || 'chill';
  const safeAnimes = ANIMES.filter(a => isAnimeAppropriate(a));
  const matchedAnimes = safeAnimes.filter(a => a.mood === songMood).slice(0, 30);
  const otherAnimes = safeAnimes.filter(a => a.mood !== songMood).slice(0, 20);
  const suggestedAnimes = [...matchedAnimes, ...otherAnimes];

  const content = document.getElementById('anime-picker-content');
  if (!content) return;

  const promptText = currentAppLang === 'th'
    ? `เลือกอนิเมะที่เข้ากับอารมณ์เพลงนี้ — อนิเมะมู้ด <span style="color:var(--primary);font-weight:700;">${moodLabel(songMood)}</span> แนะนำเป็นอันดับต้น`
    : `Select an anime matching this song's vibe — <span style="color:var(--primary);font-weight:700;">${moodLabel(songMood)}</span> anime recommended first`;

  const matchBadgeText = currentAppLang === 'th' ? '★ เข้ากัน' : '★ Match';
  const cancelText = currentAppLang === 'th' ? 'ยกเลิก' : 'Cancel';

  content.innerHTML = `
    <div style="margin-bottom:1.4rem;">
      <div style="font-size:0.78rem;font-weight:700;color:var(--primary);letter-spacing:1px;text-transform:uppercase;margin-bottom:0.5rem;">ANIME PAIRING STUDIO</div>
      <div style="font-size:1.3rem;font-weight:800;color:#fff;margin-bottom:0.3rem;">🎵 ${song.title}</div>
      <div style="color:var(--text-muted);font-size:0.9rem;margin-bottom:0.8rem;">${currentAppLang === 'th' ? 'โดย' : 'By'} ${song.artist} • ${moodLabel(songMood)}</div>
      <div style="font-size:0.95rem;color:var(--text-muted);">
        ${promptText}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:0.9rem;max-height:55vh;overflow-y:auto;padding-right:4px;">
      ${suggestedAnimes.map(anime => {
        const isMoodMatch = anime.mood === songMood;
        return `
          <div class="anime-picker-card ${isMoodMatch ? 'mood-match' : ''}" onclick="selectAnimePair(${song.id}, ${anime.id})" title="${getAnimeDisplayName(anime)}">
            ${animeImgTag(anime, 'picker-anime-img')}
            <div class="picker-anime-info">
              ${isMoodMatch ? `<span class="picker-match-badge">${matchBadgeText}</span>` : ''}
              <div class="picker-anime-name">${getAnimeDisplayName(anime)}</div>
              <div class="picker-anime-en">${getAnimeSecondaryName(anime)}</div>
            </div>
          </div>`;
      }).join('')}
    </div>

    <div style="margin-top:1.2rem;padding-top:1rem;border-top:1px solid var(--glass-border);text-align:center;">
      <button onclick="closeAnimePicker()" style="background:none;border:1px solid var(--glass-border);color:var(--text-muted);padding:0.5rem 1.5rem;border-radius:9999px;cursor:pointer;font-family:Kanit,sans-serif;">${cancelText}</button>
    </div>
  `;

  document.getElementById('anime-picker-overlay').classList.remove('hidden');
}

function closeAnimePicker() {
  const overlay = document.getElementById('anime-picker-overlay');
  if (overlay) overlay.classList.add('hidden');
  _pickerSongId = null;
}

function selectAnimePair(songId, animeId) {
  closeAnimePicker();
  const song = SONGS.find(s => s.id === songId);
  const anime = ANIMES.find(a => a.id === animeId);
  if (!song || !anime) return;

  const fallbackCover = getSongFallbackCover(song);
  const isPlaying = currentPlayingId === song.id && currentAudio && !currentAudio.paused;
  const isSaved = isSongSaved(song.id);

  const saveBtnText = isSaved
    ? (currentAppLang === 'th' ? '❤️ บันทึกแล้ว' : '❤️ Saved')
    : (currentAppLang === 'th' ? '🤍 บันทึกเพลงนี้' : '🤍 Save this song');

  const anifumeBtnText = currentAppLang === 'th' ? '🌸 ดูข้อมูลและตอนที่ Anifume →' : '🌸 View details on Anifume →';
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

  document.getElementById('modal-overlay').classList.remove('hidden');
}

// Only one toggleMenu function
function toggleMenu() {
  const navLinks = document.querySelector('.nav-links');
  const btn = document.getElementById('hamburger');
  if (navLinks) {
    navLinks.classList.toggle('open');
    if (btn) btn.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
  }
}



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

const CURRENT_APP_VERSION = 'v2.20261017.19020';
const CURRENT_VERSION_CODE = 1792248572897;
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
    if (cachedSongs && Array.isArray(cachedSongs) && cachedSongs.length > SONGS.length) {
      replaceArrayInPlace(SONGS, cachedSongs);
      if (cachedAnimes && Array.isArray(cachedAnimes)) replaceArrayInPlace(ANIMES, cachedAnimes);
      if (cachedPairs && Array.isArray(cachedPairs)) replaceArrayInPlace(ANIME_PAIRS, cachedPairs);
      initDataMaps();
      console.log(`⚡ [IndexedDB] โหลดฐานข้อมูลเพลงแคชสำเร็จ: ${SONGS.length} เพลง | ${ANIMES.length} อนิเมะ`);
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
//  NOTIFICATION CHIME SOUND (Web Audio API)
//  เสียงแจ้งเตือนกระดิ่งหวานๆ ก่อนเล่นเสียงพูด
// ============================================

function playNotificationChime() {
  return new Promise((resolve) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      // สร้างเสียงกระดิ่ง 3 โน้ต (C5, E5, G5) ทำนองน่ารัก
      const notes = [
        { freq: 523.25, start: 0, dur: 0.18 },     // C5
        { freq: 659.25, start: 0.15, dur: 0.18 },   // E5
        { freq: 783.99, start: 0.30, dur: 0.25 },   // G5
        { freq: 1046.5, start: 0.50, dur: 0.35 },   // C6 (ยาวหน่อย)
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.start);
        gain.gain.setValueAtTime(0, now + n.start);
        gain.gain.linearRampToValueAtTime(0.85, now + n.start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.start);
        osc.stop(now + n.start + n.dur + 0.05);
      });

      // เสียง shimmer / sparkle ระยิบระยับ
      for (let i = 0; i < 3; i++) {
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2000 + i * 500, now + 0.6 + i * 0.08);
        g2.gain.setValueAtTime(0, now + 0.6 + i * 0.08);
        g2.gain.linearRampToValueAtTime(0.35, now + 0.62 + i * 0.08);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.75 + i * 0.08);
        osc2.connect(g2);
        g2.connect(ctx.destination);
        osc2.start(now + 0.6 + i * 0.08);
        osc2.stop(now + 0.85 + i * 0.08);
      }

      setTimeout(() => {
        ctx.close().catch(() => {});
        resolve();
      }, 1100);
    } catch(e) {
      console.warn('Chime error:', e);
      resolve();
    }
  });
}

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

  // เสียงกระดิ่ง
  playNotificationChime();

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
      { duration: 8000 }
    );

    // สั่นอุปกรณ์
    triggerNotifVibration();

    // เล่นเสียงพูดที่ขยายความดังแล้วหลังเสียงกระดิ่งจบ (~1.0 วินาที)
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
  initSplashScreen();
  await loadCachedDatabase();
  setAppLanguage(currentAppLang);
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

function updateStats() {
  const songsCountEl = document.getElementById('stat-songs-count');
  const animeCountEl = document.getElementById('stat-anime-count');
  const pairsCountEl = document.getElementById('stat-pairs-count');
  if (songsCountEl) songsCountEl.textContent = SONGS.length;
  if (animeCountEl) animeCountEl.textContent = ANIMES.length;
  if (pairsCountEl) pairsCountEl.textContent = ANIME_PAIRS.length;

  const thCount = SONGS.filter(s => s.lang === 'th').length;
  const enCount = SONGS.filter(s => s.lang === 'en').length;
  const jpCount = SONGS.filter(s => s.lang === 'jp').length;
  const laoCount = SONGS.filter(s => s.lang === 'lao').length;
  const krCount = SONGS.filter(s => s.lang === 'kr').length;

  const countTh = document.getElementById('zone-count-th');
  const countEn = document.getElementById('zone-count-en');
  const countJp = document.getElementById('zone-count-jp');
  const countAll = document.getElementById('zone-count-all');

  if (countTh) countTh.textContent = `${thCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (countEn) countEn.textContent = `${enCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (countJp) countJp.textContent = `${jpCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (countAll) countAll.textContent = `${SONGS.length} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;

  const hubTh = document.getElementById('hub-count-th');
  const hubEn = document.getElementById('hub-count-en');
  const hubJp = document.getElementById('hub-count-jp');
  if (hubTh) hubTh.textContent = `${thCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (hubEn) hubEn.textContent = `${enCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (hubJp) hubJp.textContent = `${jpCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;

  const szTh = document.getElementById('sz-sub-th');
  const szEn = document.getElementById('sz-sub-en');
  const szJp = document.getElementById('sz-sub-jp');
  const szLao = document.getElementById('sz-sub-lao');
  const szKr = document.getElementById('sz-sub-kr');
  const szPairs = document.getElementById('sz-sub-pairs');
  if (szTh) szTh.textContent = `${thCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szEn) szEn.textContent = `${enCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szJp) szJp.textContent = `${jpCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szLao) szLao.textContent = `${laoCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szKr) szKr.textContent = `${krCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szPairs) szPairs.textContent = `${ANIMES.length} ${currentAppLang === 'th' ? 'เรื่อง' : 'titles'}`;

  const filterPairAll = document.getElementById('filter-pair-all');
  if (filterPairAll) {
    filterPairAll.textContent = currentAppLang === 'th' ? `🌟 ทุกคู่ (${ANIME_PAIRS.length} คู่)` : `🌟 All Pairs (${ANIME_PAIRS.length})`;
  }

  const heroExploreBtn = document.getElementById('hero-btn-songs');
  if (heroExploreBtn) {
    heroExploreBtn.innerHTML = currentAppLang === 'th'
      ? `🎵 สำรวจคลังเพลง (<span id="hero-song-count">${SONGS.length}</span> เพลง)`
      : `🎵 Explore Song Vault (<span id="hero-song-count">${SONGS.length}</span> songs)`;
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
      if (btn) btn.textContent = '☰';
    }
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeAnimePicker();
    closeAppModal();
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      const btn = document.getElementById('hamburger');
      if (btn) btn.textContent = '☰';
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
