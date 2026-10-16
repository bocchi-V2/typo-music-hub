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
    if (a && a.coverUrl) return a.coverUrl;
  }
  return 'favicon-logo.jpg';
}

function animeImgTag(anime, cssClass, extraStyle = '', loadingMode = 'lazy', fetchPriority = 'auto') {
  const src = anime.coverUrl || anime.coverFallback || 'favicon-logo.jpg';
  const fallback2 = (anime.coverFallback && anime.coverFallback !== src) ? anime.coverFallback : 'favicon-logo.jpg';
  const finalFallback = 'favicon-logo.jpg';
  const alt = (currentAppLang === 'en' ? (anime.name || anime.nameTH) : (anime.nameTH || anime.name)) || 'Anime';
  const styleAttr = extraStyle ? ` style="${extraStyle}"` : '';
  const priorityAttr = fetchPriority !== 'auto' ? ` fetchpriority="${fetchPriority}"` : '';
  return `<img src="${src}" alt="${alt}" class="${cssClass} anime-cover-img" loading="${loadingMode}" decoding="async"${priorityAttr}${styleAttr} referrerpolicy="no-referrer" onerror="this._tries=(this._tries||0)+1;if(this._tries===1&&'${fallback2}'!=='${src}'){this.src='${fallback2}';}else if(this._tries===2){this.src='${finalFallback}';}" />`;
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
    statZones: "โซนภาษา (ไทย / สากล / ญี่ปุ่น)",
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
    statZones: "Language Zones (TH / EN / JP)",
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
  if (!bpmStr) return currentAppLang === 'th' ? 'ปานกลาง' : 'Mid Tempo';
  if (currentAppLang === 'th') return bpmStr;
  return bpmStr
    .replace('ช้า', 'Slow')
    .replace('ปานกลาง', 'Mid')
    .replace('เร็ว', 'Fast');
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
    return '🌐 สุ่มรวมทุกโซน';
  } else {
    if (zone === 'th') return '🇹🇭 Thai Songs Zone';
    if (zone === 'en') return '🇬🇧 Global Songs Zone';
    if (zone === 'jp') return '🇯🇵 Japanese & Anime Zone';
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
    return '🇹🇭 ไทย';
  } else {
    if (l === 'en') return '🇬🇧 Global';
    if (l === 'jp') return '🇯🇵 Japanese';
    return '🇹🇭 Thai';
  }
};

const moodLabel = m => {
  if (currentAppLang === 'th') {
    return ({ sad:'💔 เศร้า', love:'❤️ รัก', hype:'🔥 เร้าใจ', chill:'🌊 ชิลล์' }[m] || m);
  } else {
    return ({ sad:'💔 Sad', love:'❤️ Romantic', hype:'🔥 Hype', chill:'🌊 Chill' }[m] || m);
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

function togglePlaySong(songId) {
  const song = SONGS.find(s => s.id === songId);
  if (!song || !song.previewUrl) {
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
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  const tryPlay = (url, fallbackUrl) => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = currentVolume;
    currentAudio = audio;
    currentPlayingId = songId;

    audio.onerror = (e) => {
      console.warn('Audio error:', e, 'src:', audio.src);
      // ลอง fallback URL ถ้ายังไม่ได้ลอง
      if (fallbackUrl && audio.src !== fallbackUrl) {
        audio.src = fallbackUrl;
        audio.load();
        audio.play().then(() => {
          duckRelaxBgm();
          updateAudioUI(true);
          showBottomPlayer(song);
        }).catch(() => {
          showToast(currentAppLang === 'th' ? '🎧 เสียงตัวอย่างโหลดไม่ได้ — กดปุ่ม Spotify เพื่อฟังเพลงเต็ม' : '🎧 Could not load audio preview — Open Spotify for full audio');
          currentAudio = null;
          currentPlayingId = null;
          updateAudioUI(false);
          resumeRelaxBgm();
        });
        return;
      }
      showToast(currentAppLang === 'th' ? '🎧 เสียงตัวอย่างโหลดไม่ได้ — กดปุ่ม Spotify เพื่อฟังเพลงเต็ม' : '🎧 Could not load audio preview — Open Spotify for full audio');
      currentAudio = null;
      currentPlayingId = null;
      updateAudioUI(false);
      resumeRelaxBgm();
    };

    audio.onended = () => {
      // เมื่อเพลงเล่นต่อจนจบ ให้เริ่มเล่นใหม่ทันทีแบบลูป (Seamless Auto-Restart)
      audio.currentTime = 0;
      audio.play().then(() => {
        updateAudioUI(true);
      }).catch(() => {
        updateAudioUI(false);
        resumeRelaxBgm();
      });
    };

    audio.ontimeupdate = () => {
      updateBottomPlayerProgress();
    };

    audio.src = url;
    audio.load();
    audio.play().then(() => {
      duckRelaxBgm();
      updateAudioUI(true);
      showBottomPlayer(song);
    }).catch(err => {
      console.warn('Audio play() rejected:', err.message);
      if (err.name === 'NotAllowedError') {
        showToast(currentAppLang === 'th' ? '🎧 กรุณาคลิกที่หน้าจอก่อนแล้วลองกดเล่นอีกครั้ง' : '🎧 Please interact with the screen once, then try playing again');
      } else {
        showToast(currentAppLang === 'th' ? '🎧 ไม่สามารถเล่นเสียงได้ — กดปุ่ม Spotify เพื่อฟังเพลงเต็ม' : '🎧 Unable to play audio preview — Open Spotify for full audio');
      }
      currentAudio = null;
      currentPlayingId = null;
      updateAudioUI(false);
      resumeRelaxBgm();
    });
  };

  // ลองเล่น previewUrl แรก, ถ้าไม่ได้ลอง spotifyPreviewUrl (ถ้ามี)
  tryPlay(song.previewUrl, song.previewUrlAlt || null);
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
        <button class="bp-play-btn" id="bp-play-btn" onclick="togglePlaySong(${song.id})" title="${playTooltip}">
          ${currentAudio && !currentAudio.paused
            ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="#000"><rect x="5" y="3" width="4.5" height="18" rx="1.5"></rect><rect x="14.5" y="3" width="4.5" height="18" rx="1.5"></rect></svg>'
            : '<svg width="15" height="15" viewBox="0 0 24 24" fill="#000" style="margin-left:2px;"><polygon points="6 4 20 12 6 20"></polygon></svg>'
          }
        </button>
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
    const matchMood = selectedRandomMood === 'all' || s.mood === selectedRandomMood;

    let matchBpm = true;
    const bpmStr = s.bpm || '';
    if (selectedRandomBpm === 'slow') {
      matchBpm = bpmStr.includes('ช้า') || parseInt(bpmStr.match(/\d+/)?.[0] || '100') < 78;
    } else if (selectedRandomBpm === 'mid') {
      matchBpm = bpmStr.includes('ปานกลาง') || (parseInt(bpmStr.match(/\d+/)?.[0] || '100') >= 78 && parseInt(bpmStr.match(/\d+/)?.[0] || '100') <= 108);
    } else if (selectedRandomBpm === 'fast') {
      matchBpm = bpmStr.includes('เร็ว') || parseInt(bpmStr.match(/\d+/)?.[0] || '100') > 108;
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
  const anime = ANIMES.find(a => a.id === song.animeId) || (pair ? ANIMES.find(a => a.id === pair.animeId) : ANIMES[0]);
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
  const eligible = getEligibleSongsForZone();
  if (eligible.length === 0) {
    alert(currentAppLang === 'th' ? 'ไม่พบเพลงที่ตรงกับตัวเลือกของคุณ กรุณาปรับเปลี่ยนมู้ดหรือความเร็ว BPM' : 'No songs match your filter. Please adjust mood or BPM.');
    return;
  }

  const btn = document.getElementById('random-btn');
  btn.textContent = currentAppLang === 'th' ? '🎲 กำลังสุ่มเพลง...' : '🎲 Rolling song...';
  btn.disabled = true;

  playDiceSound();

  const card = document.getElementById('random-card');
  card.classList.add('card-flip');

  await new Promise(r => setTimeout(r, 450));
  card.classList.remove('card-flip');

  if (!zoneDeck || zoneDeck.length === 0) {
    initZoneDeck();
  }

  const nextId = zoneDeck.shift();
  const song = SONGS.find(s => s.id === nextId) || eligible[0];
  lastRandomSongId = song.id;
  updateZoneCounterUI();

  renderRandomShowcase(song);

  document.getElementById('random-placeholder').classList.add('hidden');
  document.getElementById('random-result').classList.remove('hidden');

  btn.textContent = currentAppLang === 'th' ? '🎲 สุ่มเพลงใหม่ในโซนนี้!' : '🎲 Roll New in This Zone!';
  btn.disabled = false;

  togglePlaySong(song.id);
  document.getElementById('random').scrollIntoView({ behavior: 'smooth' });
}

// ---- ALL SONGS CATALOG FILTERING ----
let currentLangFilter = 'th'; // 'all', 'th', 'en', 'jp'
let currentMoodFilter = 'all';
let currentSearchTerm = '';

const moodClass = m => ({ sad:'mood-sad', love:'mood-love', hype:'mood-hype', chill:'mood-chill' }[m] || 'mood-chill');

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
  const anime = (ANIMES && ANIMES.find(a => a.id === song.animeId && isAnimeAppropriate(ANIMES.find(x => x.id === song.animeId)))) ||
                (ANIMES && ANIMES.find(a => a.id === song.animeId)) ||
                (ANIMES && ANIMES.find(a => isAnimeAppropriate(a))) ||
                (ANIMES && ANIMES[0]) || { name: '', nameTH: '', coverUrl: '', coverFallback: '', genre: [] };
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
          <div class="img-skeleton"></div>
          <img src="${song.coverUrl || fallbackCover}" alt="${song.title}" class="song-cover" loading="${loadMode}" decoding="async"${priAttr} referrerpolicy="no-referrer"
            onload="this.previousElementSibling.style.display='none';this.style.opacity='1';"
            onerror="this.previousElementSibling.style.display='none';this.onerror=null;this.src='${fallbackCover}';this.style.opacity='1';" style="opacity:0;transition:opacity 0.3s;" />
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
          <div class="img-skeleton img-skeleton-mini"></div>
          ${animeImgTag(anime, 'song-anime-poster-mini', 'opacity:0;transition:opacity 0.3s;', loadMode, fetchPri).replace('/>', ' onload="this.previousElementSibling.style.display=\'none\';this.style.opacity=\'1\';" onerror="this.previousElementSibling.style.display=\'none\';" />')}
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
    const matchMood = currentMoodFilter === 'all' || s.mood === currentMoodFilter;

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
  if (currentAppLang === 'th') {
    if (currentLangFilter === 'th') zoneName = 'โซนเพลงไทย';
    else if (currentLangFilter === 'en') zoneName = 'โซนเพลงสากล (English)';
    else if (currentLangFilter === 'jp') zoneName = 'โซนเพลงญี่ปุ่น / อนิเมะ';
    bannerText.innerHTML = `📍 กำลังแสดง: <strong>${zoneName}</strong> (${count} เพลง) — แสดงเฉพาะเพลงในโซนนี้`;
  } else {
    if (currentLangFilter === 'th') zoneName = 'Thai Songs Zone';
    else if (currentLangFilter === 'en') zoneName = 'Global Songs Zone (English)';
    else if (currentLangFilter === 'jp') zoneName = 'Japanese & Anime Zone';
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

  if (ws === 'th' || ws === 'en' || ws === 'jp') {
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
  const anime = ANIMES.find(a => a.id === song.animeId) || ANIMES[0];
  const animeDisplayName = getAnimeDisplayName(anime);
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
  const anime = ANIMES.find(a => a.id === winner.animeId) || (pair ? ANIMES.find(a => a.id === pair.animeId) : ANIMES[0]);

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

function openAppModal() {
  const modal = document.getElementById('app-install-modal');
  if (modal) modal.classList.remove('hidden');
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
    alert(currentAppLang === 'th'
      ? '💡 วิธีติดตั้งลงหน้าจอมือถือทันที:\n1. กดปุ่มตัวเลือก (จุด 3 จุด หรือปุ่มแชร์) ในเบราว์เซอร์\n2. เลือก "เพิ่มลงในหน้าจอหลัก" (Add to Home screen / Install App)\n3. เข้าใช้งานได้จากไอคอนหน้าจอมือถือได้ทันทีครับ!'
      : '💡 How to install on mobile:\n1. Tap the browser menu (3 dots or Share icon)\n2. Select "Add to Home screen" or "Install App"\n3. Launch directly from your home screen!');
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

function getHaimiyaAudio() {
  if (!haimiyaAudio) {
    haimiyaAudio = new Audio('haimiya_yaho.mp3');
    haimiyaAudio.preload = 'auto';
    // ปรับระดับเสียงให้เบาลง นุ่มนวล สบายหู ไม่ตกใจ
    haimiyaAudio.volume = 0.22;
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
    audio.volume = 0.22;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch((err) => {
        // If autoplay blocked by browser policy, play on the very next user tap anywhere
        const onFirstGesture = () => {
          audio.currentTime = 0;
          audio.volume = 0.22;
          audio.play().catch(() => {});
          window.removeEventListener('pointerdown', onFirstGesture);
          window.removeEventListener('touchstart', onFirstGesture);
          window.removeEventListener('click', onFirstGesture);
        };
        window.addEventListener('pointerdown', onFirstGesture, { once: true });
        window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });
        window.addEventListener('click', onFirstGesture, { once: true });
      });
    }
  } catch (e) {}
}

// ---- RELAXING BACKGROUND AMBIENT MUSIC ("blue" by yung kai) ----
let relaxBgmAudio = null;
let isRelaxBgmEnabled = true;
let isDuckMutedByPreview = false;
let wasRelaxBgmPlayingBeforeBackground = false;
let wasPreviewPlayingBeforeBackground = false;
// ปรับระดับเสียงให้ชัดเจน ฟังสบาย ผ่อนคลายกำลังดี (0.35) ไม่อู้อี้หรือเบาเกินไป
const RELAX_BGM_VOLUME = 0.35;

function getRelaxBgmAudio() {
  if (!relaxBgmAudio) {
    relaxBgmAudio = new Audio('blue_relax.m4a');
    relaxBgmAudio.preload = 'auto';
    relaxBgmAudio.loop = true;
    relaxBgmAudio.volume = RELAX_BGM_VOLUME;
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
  // เมื่อผู้ใช้เลือกเพลงฟัง -> ดนตรีผ่อนคลายจะเงียบไป
  isDuckMutedByPreview = true;
  updateRelaxBgmUI(false);
  if (relaxBgmAudio && !relaxBgmAudio.paused) {
    let vol = relaxBgmAudio.volume;
    const fadeTimer = setInterval(() => {
      vol -= 0.04;
      if (vol <= 0.02) {
        clearInterval(fadeTimer);
        relaxBgmAudio.pause();
        relaxBgmAudio.volume = RELAX_BGM_VOLUME;
      } else {
        relaxBgmAudio.volume = Math.max(0, vol);
      }
    }, 25);
  }
}

function resumeRelaxBgm() {
  // เมื่อเพลงที่เลือกฟังจบ หรือผู้ใช้หยุดเพลง -> เริ่มเล่นเพลงผ่อนคลายขึ้นมาใหม่
  isDuckMutedByPreview = false;
  if (!isRelaxBgmEnabled) return;
  try {
    const audio = getRelaxBgmAudio();
    audio.currentTime = 0; // เริ่มเพลงใหม่ขึ้นมาเลย
    audio.volume = 0.02;
    const p = audio.play();
    if (p && p.catch) {
      p.then(() => {
        let vol = 0.02;
        const fadeTimer = setInterval(() => {
          vol += 0.03;
          if (vol >= RELAX_BGM_VOLUME) {
            clearInterval(fadeTimer);
            audio.volume = RELAX_BGM_VOLUME;
          } else {
            audio.volume = vol;
          }
        }, 40);
        updateRelaxBgmUI(true);
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

// ---- APP LIFECYCLE & BACKGROUND AUDIO SUPPRESSION ----
// ป้องกันปัญหาเสียงเล่นค้างหรือกระตุกติดๆ ขัดๆ เมื่อผู้ใช้กดออกจากแอป หรือสลับไปหน้าจออื่น (Android WebView / Browser)
function handleAppGoingBackground() {
  // 1. หยุดเพลง BGM ผ่อนคลายถ้ากำลังเล่นอยู่
  if (relaxBgmAudio && !relaxBgmAudio.paused) {
    wasRelaxBgmPlayingBeforeBackground = true;
    try {
      relaxBgmAudio.pause();
    } catch (e) {}
    updateRelaxBgmUI(false);
  } else {
    wasRelaxBgmPlayingBeforeBackground = false;
  }

  // 2. หยุดเพลงตัวอย่าง (preview audio) ทันทีถ้ากำลังเล่นอยู่ เพื่อไม่ให้เสียงกระตุกในพื้นหลัง
  if (currentAudio && !currentAudio.paused) {
    wasPreviewPlayingBeforeBackground = true;
    try {
      currentAudio.pause();
    } catch (e) {}
    updateAudioUI(false);
  } else {
    wasPreviewPlayingBeforeBackground = false;
  }

  // 3. หยุดเสียงเอฟเฟกต์อื่นๆ ถ้ามี
  if (haimiyaAudio && !haimiyaAudio.paused) {
    try { haimiyaAudio.pause(); } catch (e) {}
  }
}

function handleAppReturningForeground() {
  // เมื่อผู้ใช้เปิดแอปกลับขึ้นมา
  // ถ้าเดิมเพลงผ่อนคลายเปิดเล่นอยู่ และไม่ได้มีเพลงตัวอย่างค้างอยู่ ให้เล่นต่ออย่างราบรื่น
  if (wasRelaxBgmPlayingBeforeBackground && isRelaxBgmEnabled && !isDuckMutedByPreview) {
    try {
      const audio = getRelaxBgmAudio();
      audio.volume = RELAX_BGM_VOLUME;
      audio.play().then(() => updateRelaxBgmUI(true)).catch(() => {});
    } catch (e) {}
  }
  wasRelaxBgmPlayingBeforeBackground = false;
  wasPreviewPlayingBeforeBackground = false;
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

      // Hold for 3 seconds then smoothly fade out
      setTimeout(() => {
        splashEl.classList.add('fade-out');
        setTimeout(() => {
          splashEl.style.display = 'none';
          startRelaxBgm();
        }, 700);
      }, 3000);

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

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initSplashScreen();
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
  const szPairs = document.getElementById('sz-sub-pairs');
  if (szTh) szTh.textContent = `${thCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szEn) szEn.textContent = `${enCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
  if (szJp) szJp.textContent = `${jpCount} ${currentAppLang === 'th' ? 'เพลง' : 'songs'}`;
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
