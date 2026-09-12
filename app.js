// ============================================
//  APP.JS – Typo Music Platform (Studio Edition)
//  ระบบสุ่มเพลงแยกโซน ปรับระดับเสียง และจับคู่อนิเมะสำหรับนักตัดต่อ
// ============================================

// ---- ANIME COVER IMAGE HELPERS ----
// สร้าง img tag ที่มี fallback URL อัตโนมัติกรณีรูปโหลดไม่ขึ้น พร้อมรองรับ eager/high priority

// Fallback cover helper: if song cover fails, fallback to matched anime poster or default mascot
function getSongFallbackCover(song) {
  if (song && song.animeId && typeof ANIMES !== 'undefined' && Array.isArray(ANIMES)) {
    const a = ANIMES.find(item => item.id === song.animeId);
    if (a && a.coverUrl) return a.coverUrl;
  }
  return 'favicon-logo.jpg';
}

function animeImgTag(anime, cssClass, extraStyle = '', loadingMode = 'lazy', fetchPriority = 'auto') {
  const src = anime.coverUrl || anime.coverFallback || 'favicon-logo.jpg';
  const fallback2 = (anime.coverFallback && anime.coverFallback !== src) ? anime.coverFallback : 'favicon-logo.jpg';
  const finalFallback = 'favicon-logo.jpg';
  const alt = anime.nameTH || anime.name || 'Anime';
  const styleAttr = extraStyle ? ` style="${extraStyle}"` : '';
  const priorityAttr = fetchPriority !== 'auto' ? ` fetchpriority="${fetchPriority}"` : '';
  return `<img src="${src}" alt="${alt}" class="${cssClass} anime-cover-img" loading="${loadingMode}" decoding="async"${priorityAttr}${styleAttr} referrerpolicy="no-referrer" onerror="this._tries=(this._tries||0)+1;if(this._tries===1&&'${fallback2}'!=='${src}'){this.src='${fallback2}';}else if(this._tries===2){this.src='${finalFallback}';}" />`;
}

// ---- INTERNATIONALIZATION (i18n) ----
const I18N = {
  th: {
    navRandom: "🎲 สุ่มเพลงแยกโซน",
    navSongs: "🎵 คลังเพลงแยกโซน",
    navVersus: "⚔️ โหวตเพลง",
    navAnimeMatch: "🌸 จับคู่อนิเมะ",
    heroTitle1: "รวมเพลงตัดต่อคลิป",
    heroTitle2: "ไทย • สากล • อนิเมะ",
    heroDesc: "ค้นหาเพลงและไอเดียทำคลิปไทโป พร้อมระบบสุ่มแยกโซน ปรับความดังเสียง และจับคู่ซีนอนิเมะที่เข้ากันที่สุด",
    heroBtnRandom: "🎲 ไปที่โซนสุ่มเพลง",
    heroBtnSongs: "🎵 สำรวจคลังเพลง",
    statTotalSongs: "เพลงทั้งหมดในคลัง",
    statZones: "โซนภาษา (ไทย / สากล / ญี่ปุ่น)",
    statAnimes: "อนิเมะยอดฮิต",
    statPairs: "คู่แนะนำพร้อมทริคไทโป",
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
    previewBtn: "ฟังตัวอย่าง 30s",
    playingBtn: "กำลังเล่น",
    pauseBtn: "หยุด",
    spotifyBtn: "Spotify",
    animeRecTitle: "🌸 แนะนำตัดกับอนิเมะ:",
    animeDetailsBtn: "🌸 รายละเอียดคู่",
    rollBtn: "🎲 สุ่มเพลงใหม่ในโซนนี้!",
    resetDeckBtn: "🔄 เริ่มสุ่มรอบใหม่",
    viewAnifume: "🌸 ดูข้อมูลบน Anifume →",
    matchSectionDesc: "รวมคู่เพลงและอนิเมะยอดฮิต พร้อมภาพโปสเตอร์และตัวอย่างเพลงสำหรับตัดต่อ",
    navSaved: "บันทึกไว้",
    tabSavedTitle: "เพลงที่บันทึกไว้",
    savedSectionKicker: "BOOKMARKED COLLECTION",
    savedSectionDesc: "รวมเพลงที่คุณชื่นชอบสำหรับนำไปใช้ตัดต่อคลิปไทโป พร้อมซีนอนิเมะแนะนำ"
  },
  en: {
    navRandom: "🎲 Zone Randomizer",
    navSongs: "🎵 Song Vault",
    navVersus: "⚔️ Song Battles",
    navAnimeMatch: "🌸 Anime Pairs",
    heroTitle1: "Music for Typography Clips",
    heroTitle2: "Thai • Global • Anime",
    heroDesc: "Curated music library & typography video ideas with smart zone randomizer, volume controls, and anime scene pairings.",
    heroBtnRandom: "🎲 Launch Randomizer",
    heroBtnSongs: "🎵 Explore Song Vault",
    statTotalSongs: "Total Verified Songs",
    statZones: "Language Zones (TH / EN / JP)",
    statAnimes: "Featured Anime",
    statPairs: "Curated Pairs & Typo Tips",
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
    previewBtn: "Preview 30s",
    playingBtn: "Playing",
    pauseBtn: "Pause",
    spotifyBtn: "Spotify",
    animeRecTitle: "🌸 Matched Anime Scene:",
    animeDetailsBtn: "🌸 Pair Details",
    rollBtn: "🎲 Roll New in This Zone!",
    resetDeckBtn: "🔄 Reset Deck",
    viewAnifume: "🌸 View on Anifume →",
    matchSectionDesc: "Curated song and anime scene pairs with posters and audio previews for editors",
    navSaved: "Saved",
    tabSavedTitle: "Saved Songs",
    savedSectionKicker: "BOOKMARKED COLLECTION",
    savedSectionDesc: "Your curated typography clip soundtracks with anime pairings"
  }
};

let currentAppLang = localStorage.getItem('typo_app_lang') || 'th';

function setAppLanguage(lang) {
  currentAppLang = lang;
  localStorage.setItem('typo_app_lang', lang);

  const btnTh = document.getElementById('btn-lang-th');
  const btnEn = document.getElementById('btn-lang-en');
  if (btnTh && btnEn) {
    btnTh.classList.toggle('active', lang === 'th');
    btnEn.classList.toggle('active', lang === 'en');
  }

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (I18N[lang] && I18N[lang][key]) {
      el.textContent = I18N[lang][key];
    }
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.placeholder = I18N[lang].searchPlaceholder;
  }

  updateZoneBanner();
  renderSongsGrid();
  updateStats();
  initWeeklyUpdateTracker();
  if (currentAudio) updateAudioUI(!currentAudio.paused);
}

// Helper: Hardware Studio Play Button
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
    diceAudio.volume = Math.min(1, Math.max(0.35, currentVolume || 0.8));
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
    showToast('🎲 🔊 เปิดเสียงทอยลูกเต๋า (u_qpfzpy) เรียบร้อยแล้ว');
  } else {
    showToast('🎲 🔇 ปิดเสียงทอยลูกเต๋าแล้ว');
  }
}

function updateDiceSfxUI() {
  const btn = document.getElementById('sfx-toggle-btn');
  if (btn) {
    btn.innerHTML = diceSfxEnabled
      ? '<span class="sfx-icon">🎲 🔊</span> <span class="sfx-text">เสียงลูกเต๋า: เปิด</span>'
      : '<span class="sfx-icon">🎲 🔇</span> <span class="sfx-text">เสียงลูกเต๋า: ปิด</span>';
    btn.classList.toggle('active', diceSfxEnabled);
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
    const title = song ? `"${song.title}"` : 'เพลงนี้';
    showToast(`❤️ บันทึก ${title} เข้าคลังเพลงโปรดแล้ว! ✨`);
  } else {
    saved.splice(index, 1);
    const title = song ? `"${song.title}"` : 'เพลงนี้';
    showToast(`🤍 นำ ${title} ออกจากคลังแล้ว`);
  }

  localStorage.setItem('typo_saved_songs', JSON.stringify(saved));
  updateSavedBadges();

  // Sync all buttons with this ID
  document.querySelectorAll(`[data-save-id="${id}"]`).forEach(btn => {
    btn.classList.toggle('saved', willSave);
    const icon = btn.querySelector('.bm-icon');
    if (icon) icon.textContent = willSave ? '❤️' : '🤍';
    if (btn.classList.contains('btn-bp-save')) {
      btn.innerHTML = willSave ? '❤️ บันทึกแล้ว' : '🤍 บันทึกเพลง';
    }
    if (btn.classList.contains('btn-modal-save')) {
      btn.innerHTML = willSave ? '❤️ บันทึกแล้ว' : '🤍 บันทึกเพลงนี้';
    }
    if (btn.classList.contains('btn-showcase-save')) {
      btn.innerHTML = willSave ? '❤️ บันทึกแล้ว' : '🤍 บันทึกเพลง';
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
    showToast('ยังไม่มีเพลงในคลังที่บันทึกไว้');
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
    showToast('🗑️ ล้างเพลงที่บันทึกไว้ทั้งหมดเรียบร้อยแล้ว');
  }
}

function exportSavedSongsList() {
  const savedIds = getSavedSongIds();
  if (savedIds.length === 0) {
    showToast('ยังไม่มีเพลงที่บันทึกไว้ — กรุณากดปุ่ม ❤️ บนเพลงที่ต้องการ');
    return;
  }
  const savedSongs = SONGS.filter(s => savedIds.includes(s.id));
  let text = `🎵 คลังเพลงที่บันทึกไว้สำหรับตัดต่อคลิปไทโป (ไทโปมิวสิค Edit Studio)\n`;
  text += `จำนวนทั้งหมด: ${savedSongs.length} เพลง\n`;
  text += `==================================================\n\n`;

  savedSongs.forEach((s, idx) => {
    const anime = ANIMES.find(a => a.id === s.animeId);
    text += `${idx + 1}. ${s.title} - ${s.artist} [${s.bpm || 'BPM ปานกลาง'} | ${moodLabel(s.mood)}]\n`;
    if (anime) text += `   🌸 ซีนอนิเมะแนะนำ: ${anime.nameTH} (${anime.name})\n`;
    text += `   🎧 ฟังบน Spotify: ${s.spotifyUrl}\n\n`;
  });

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 คัดลอกรายชื่อเพลงทั้งหมดลง Clipboard แล้ว!');
    }).catch(() => {
      prompt('คัดลอกรายชื่อเพลงของคุณ:', text);
    });
  } else {
    prompt('คัดลอกรายชื่อเพลงของคุณ:', text);
  }
}

function shufflePlaySaved() {
  const savedIds = getSavedSongIds();
  if (savedIds.length === 0) {
    showToast('ยังไม่มีเพลงที่บันทึกไว้ กดไอคอน ❤️ บนเพลงที่ชอบเพื่อเก็บไว้ก่อน');
    return;
  }
  const randomId = savedIds[Math.floor(Math.random() * savedIds.length)];
  togglePlaySong(randomId);
  const song = SONGS.find(s => s.id === randomId);
  if (song) {
    showToast(`🎲 สุ่มเล่นเพลงที่บันทึกไว้: "${song.title}"`);
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
        <div class="empty-title">ยังไม่มีเพลงในคลังที่บันทึกไว้</div>
        <div class="empty-desc">
          คุณสามารถกดไอคอนหัวใจ 🤍 บนการ์ดเพลงใบใดก็ได้ เพื่อบันทึกเก็บไว้ใช้ตัดต่อคลิปไทโปในภายหลังได้ตลอดเวลา
        </div>
        <div class="empty-actions">
          <button class="btn btn-primary" onclick="switchStudioWorkspace('th', true)">
            🇹🇭 สำรวจเพลงไทย
          </button>
          <button class="btn btn-ghost" onclick="switchStudioWorkspace('en', true)">
            🇬🇧 สำรวจเพลงสากล
          </button>
          <button class="btn btn-ghost" onclick="switchStudioWorkspace('jp', true)">
            🇯🇵 สำรวจเพลงอนิเมะ
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
    const songTitle = song ? `"${song.title}"` : 'เพลงนี้';
    showToast(`🎧 ${songTitle} ยังไม่มีตัวอย่าง 30s ในระบบ — กดปุ่ม Spotify เพื่อฟังเพลงเต็ม`);
    return;
  }

  // If already playing this song -> pause
  if (currentPlayingId === songId && currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    updateAudioUI(false);
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
          updateAudioUI(true);
          showBottomPlayer(song);
        }).catch(() => {
          showToast(`🎧 เสียงตัวอย่างโหลดไม่ได้ — กดปุ่ม Spotify เพื่อฟังเพลงเต็ม`);
          currentAudio = null;
          currentPlayingId = null;
          updateAudioUI(false);
        });
        return;
      }
      showToast(`🎧 เสียงตัวอย่างโหลดไม่ได้ — กดปุ่ม Spotify เพื่อฟังเพลงเต็ม`);
      currentAudio = null;
      currentPlayingId = null;
      updateAudioUI(false);
    };

    audio.onended = () => {
      updateAudioUI(false);
    };

    audio.ontimeupdate = () => {
      updateBottomPlayerProgress();
    };

    audio.src = url;
    audio.load();
    audio.play().then(() => {
      updateAudioUI(true);
      showBottomPlayer(song);
    }).catch(err => {
      console.warn('Audio play() rejected:', err.message);
      if (err.name === 'NotAllowedError') {
        showToast('🎧 กรุณาคลิกที่หน้าจอก่อนแล้วลองกดเล่นอีกครั้ง');
      } else {
        showToast(`🎧 ไม่สามารถเล่นเสียงได้ — กดปุ่ม Spotify เพื่อฟังเพลงเต็ม`);
      }
      currentAudio = null;
      currentPlayingId = null;
      updateAudioUI(false);
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
  if (!player) {
    player = document.createElement('div');
    player.id = 'bottom-player';
    player.className = 'bottom-player';
    document.body.appendChild(player);
  }

  const percent = Math.round(currentVolume * 100);
  const icon = getVolumeIcon(currentVolume);
  const isSaved = isSongSaved(song.id);
  const fallbackCover = getSongFallbackCover(song);

  player.innerHTML = `
    <div class="bp-content">
      <div class="bp-track-box">
        <img src="${song.coverUrl}" alt="${song.title}" class="bp-cover ${currentAudio && !currentAudio.paused ? 'spinning' : ''}" onerror="this.onerror=null;this.src='${fallbackCover}';" />
        <div class="bp-info">
          <div class="bp-title-wrap" style="display:flex;align-items:center;gap:6px;">
            <div class="bp-title">${song.title}</div>
            <span class="sound-bars" style="margin-left:2px;"><span></span><span></span><span></span><span></span></span>
          </div>
          <div class="bp-artist">${song.artist} <span class="lang-pill-mini">${langPillText(song.lang)}</span></div>
        </div>
      </div>

      <div class="bp-controls">
        <button class="bp-play-btn" id="bp-play-btn" onclick="togglePlaySong(${song.id})" title="${currentAudio && !currentAudio.paused ? 'หยุดชั่วคราว' : 'เล่นต่อ'}">
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

      <!-- Volume Controls -->
      <div class="bp-volume-panel">
        <button class="bp-vol-btn" id="bp-mute-btn" onclick="toggleMute()" title="เปิด/ปิดเสียง">
          ${icon}
        </button>
        <button class="bp-vol-step-btn" onclick="adjustVolumeStep(-10)" title="ลดเสียง 10%">-</button>
        <input type="range" min="0" max="100" value="${percent}" class="bp-vol-slider" id="bp-vol-slider" oninput="setVolume(this.value)" title="ปรับระดับเสียง" />
        <button class="bp-vol-step-btn" onclick="adjustVolumeStep(10)" title="เพิ่มเสียง 10%">+</button>
        <span class="bp-vol-percent" id="bp-vol-percent">${percent}%</span>
      </div>

      <div class="bp-actions">
        <button class="btn-sm btn-bp-save ${isSaved ? 'saved' : ''}" data-save-id="${song.id}" onclick="toggleSaveSong(${song.id}, event)" title="${isSaved ? 'นำออกจากที่บันทึกไว้' : 'บันทึกเพลงนี้'}">
          ${isSaved ? '❤️ บันทึกแล้ว' : '🤍 บันทึกเพลง'}
        </button>
        <button class="btn-sm btn-match" onclick="openAnimeMatchModal(${song.id})">🌸 ดูคู่ตัดต่อ</button>
        <a href="${song.spotifyUrl}" target="_blank" class="btn-sm btn-spotify">🎧 Spotify</a>
        <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + ' ' + song.artist)}" target="_blank" class="btn-sm btn-yt" title="ค้นหาบน YouTube">▶️ YouTube</a>
        <button class="bp-close-btn" onclick="hideBottomPlayer()" title="ปิดแถบเครื่องเล่น">✕</button>
      </div>
    </div>
  `;

  player.classList.add('visible');
}

function hideBottomPlayer() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  updateAudioUI(false);
  const player = document.getElementById('bottom-player');
  if (player) player.classList.remove('visible');
  currentPlayingId = null;
}

function updateBottomPlayerProgress() {
  if (!currentAudio) return;
  const cur = currentAudio.currentTime || 0;
  const dur = currentAudio.duration || 30;
  const pct = (cur / dur) * 100;

  const fill = document.getElementById('bp-progress-fill');
  if (fill) fill.style.width = pct + '%';

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
    if (selectedRandomBpm === 'slow') {
      matchBpm = s.bpm.includes('ช้า') || parseInt(s.bpm.match(/\d+/)?.[0] || '100') < 78;
    } else if (selectedRandomBpm === 'mid') {
      matchBpm = s.bpm.includes('ปานกลาง') || (parseInt(s.bpm.match(/\d+/)?.[0] || '100') >= 78 && parseInt(s.bpm.match(/\d+/)?.[0] || '100') <= 108);
    } else if (selectedRandomBpm === 'fast') {
      matchBpm = s.bpm.includes('เร็ว') || parseInt(s.bpm.match(/\d+/)?.[0] || '100') > 108;
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
    counterEl.textContent = `⚠️ ไม่พบเพลงในตัวเลือกนี้ กรุณาลองเปลี่ยนมู้ดหรือความเร็ว BPM`;
    return;
  }

  if (played === 0) {
    counterEl.innerHTML = `${getZoneNameTH(selectedZone)}: พร้อมสุ่มทั้งหมด <strong>${total}</strong> เพลง (ระบบสับไพ่ไม่ซ้ำ)`;
  } else {
    counterEl.innerHTML = `${getZoneNameTH(selectedZone)}: สุ่มไปแล้ว <strong>${played} / ${total}</strong> เพลง (ไม่ซ้ำ)`;
  }
}

// ---- RANDOM EXECUTION WITH DICE SFX & 3D TUMBLE ----
async function randomSong() {
  const eligible = getEligibleSongsForZone();
  if (eligible.length === 0) {
    alert('ไม่พบเพลงที่ตรงกับตัวเลือกของคุณ กรุณาปรับเปลี่ยนมู้ดหรือความเร็ว BPM');
    return;
  }

  const btn = document.getElementById('random-btn');
  btn.textContent = '🎲 กำลังสุ่มเพลง...';
  btn.disabled = true;

  // Play dice sound (u_qpfzpy / dice-roll.mp3)
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

  const pair = ANIME_PAIRS.find(p => p.songId === song.id);
  const anime = ANIMES.find(a => a.id === song.animeId) || (pair ? ANIMES.find(a => a.id === pair.animeId) : ANIMES[0]);

  const isPlaying = currentPlayingId === song.id && currentAudio && !currentAudio.paused;
  const percent = Math.round(currentVolume * 100);
  const icon = getVolumeIcon(currentVolume);

  // Render Dual Showcase Display with Typography Ideas & 1-Click Copy
  const showcaseEl = document.getElementById('random-showcase');
  showcaseEl.innerHTML = `
    <div class="studio-random-card studio-card-reveal">
      <div class="studio-card-header">
        <div class="studio-header-left">
          <span class="studio-zone-badge">${getZoneNameTH(song.lang || 'th')}</span>
          <span class="studio-mood-badge ${moodClass(song.mood)}">${moodLabel(song.mood)}</span>
          <span class="studio-roll-badge">🎲 ผลการสุ่มรอบนี้</span>
        </div>
        <div class="studio-bpm-tag">⚡ ${song.bpm || 'ปานกลาง'}</div>
      </div>

      <div class="studio-card-grid">
        <!-- LEFT: SONG SHOWCASE -->
        <div class="studio-subcard song-subcard">
          <div class="subcard-title-row">
            <span class="subcard-icon">🎵</span>
            <span class="subcard-label">เพลงที่สุ่มได้</span>
          </div>

          <div class="song-subcard-body">
            <div class="song-cover-box">
              <img src="${song.coverUrl}" alt="${song.title}" class="song-cover-main" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${getSongFallbackCover(song)}';" />
            </div>
            <div class="song-subcard-info">
              <div class="song-main-name">${song.title}</div>
              <div class="song-artist-name">โดย ${song.artist} <span class="lang-pill-mini">${langPillText(song.lang)}</span></div>
              <div class="song-tag-list">
                ${(song.tags || []).map(t => `<span class="song-tag">${t}</span>`).join('')}
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
              <button class="bp-vol-btn" id="showcase-mute-btn" onclick="toggleMute()" title="เปิด/ปิดเสียง">${icon}</button>
              <input type="range" min="0" max="100" value="${percent}" class="bp-vol-slider" id="showcase-vol-slider" oninput="setVolume(this.value)" title="ปรับความดังเสียง" />
              <span class="bp-vol-percent" id="showcase-vol-percent">${percent}%</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: ANIME MATCH SHOWCASE -->
        <div class="studio-subcard anime-subcard">
          <div class="subcard-title-row">
            <span class="subcard-icon">🌸</span>
            <span class="subcard-label">อนิเมะแนะนำสำหรับคลิปนี้</span>
          </div>

          <div class="anime-subcard-body">
            ${animeImgTag(anime, 'anime-poster-main', '', 'eager', 'high')}
            <div class="anime-subcard-info">
              <div class="anime-name-th">${anime.nameTH}</div>
              <div class="anime-name-en">${anime.name} • ${(anime.genre || []).join(', ')}</div>
            </div>
          </div>

          <div class="anime-subcard-footer">
            <a href="${anime.anifumeUrl}" target="_blank" class="btn-sm btn-anifume">🌸 ดูข้อมูลบน Anifume →</a>
            <button onclick="openAnimePicker(${song.id})" class="btn-sm btn-switch-anime" title="เลือกอนิเมะอื่นสำหรับเพลงนี้">🔄 เปลี่ยนอนิเมะ</button>
          </div>
        </div>
      </div>


    </div>
  `;

  document.getElementById('random-placeholder').classList.add('hidden');
  document.getElementById('random-result').classList.remove('hidden');

  btn.textContent = '🎲 สุ่มเพลงใหม่ในโซนนี้!';
  btn.disabled = false;

  // Auto-play preview
  togglePlaySong(song.id);
  document.getElementById('random').scrollIntoView({ behavior: 'smooth' });
}

// ---- ALL SONGS CATALOG FILTERING ----
let currentLangFilter = 'th'; // 'all', 'th', 'en', 'jp'
let currentMoodFilter = 'all';
let currentSearchTerm = '';

function langPillText(l) {
  if (l === 'en') return '🇬🇧 สากล';
  if (l === 'jp') return '🇯🇵 ญี่ปุ่น';
  return '🇹🇭 ไทย';
}

const moodClass = m => ({ sad:'mood-sad', love:'mood-love', hype:'mood-hype', chill:'mood-chill' }[m] || 'mood-chill');
const moodLabel = m => ({ sad:'💔 เศร้า', love:'❤️ รัก', hype:'🔥 เร้าใจ', chill:'🌊 ชิลล์' }[m] || m);

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
  const tags = (song.tags || []).map(t => `<span class="song-tag">${t}</span>`).join('');
  const isPlaying = currentPlayingId === song.id && currentAudio && !currentAudio.paused;
  const moodVal = song.mood || 'chill';
  const langVal = song.lang || 'th';
  const bpmText = song.bpm ? `<span class="song-tag bpm-tag">⚡ ${song.bpm}</span>` : '';
  const isPriority = typeof index === 'number' && index < 18;
  const loadMode = isPriority ? 'eager' : 'lazy';
  const fetchPri = isPriority ? 'high' : 'auto';
  const priAttr = isPriority ? ' fetchpriority="high"' : '';
  const fallbackCover = getSongFallbackCover(song);

  return `
    <div class="song-card ${isPlaying ? 'is-playing' : ''}" id="song-${song.id}" data-mood="${moodVal}" data-lang="${langVal}">
      <div class="song-card-top">
        <div class="song-cover-wrapper">
          <div class="img-skeleton"></div>
          <img src="${song.coverUrl || fallbackCover}" alt="${song.title}" class="song-cover" loading="${loadMode}" decoding="async"${priAttr} referrerpolicy="no-referrer"
            onload="this.previousElementSibling.style.display='none';this.style.opacity='1';"
            onerror="this.previousElementSibling.style.display='none';this.onerror=null;this.src='${fallbackCover}';this.style.opacity='1';" style="opacity:0;transition:opacity 0.3s;" />
          <button class="song-play-overlay" onclick="togglePlaySong(${song.id})">
            ${isPlaying ? '⏸️' : '▶️'}
          </button>
          ${renderBookmarkBtn(song.id)}
        </div>
        <div class="song-card-info" onclick="openAnimeMatchModal(${song.id})" title="คลิกเพื่อดูรายละเอียดคู่ตัดต่ออนิเมะ" style="cursor:pointer;">
          <div class="song-card-badges">
            <span class="song-mood ${moodClass(moodVal)}">${moodLabel(moodVal)}</span>
            <span class="song-lang-badge">${langPillText(langVal)}</span>
          </div>
          <div class="song-title">${song.title}</div>
          <div class="song-artist">${song.artist}</div>
          <div class="song-tags">${tags}${bpmText}</div>
        </div>
      </div>

      <!-- Matched Anime Bar -->
      <div class="song-anime-bar" onclick="openAnimeMatchModal(${song.id})" title="คลิกเพื่อดูรายละเอียดอนิเมะ">
        <div class="anime-bar-img-wrap">
          <div class="img-skeleton img-skeleton-mini"></div>
          ${animeImgTag(anime, 'song-anime-poster-mini', 'opacity:0;transition:opacity 0.3s;', loadMode, fetchPri).replace('/>', ' onload="this.previousElementSibling.style.display=\'none\';this.style.opacity=\'1\';" onerror="this.previousElementSibling.style.display=\'none\';" />')}
        </div>
        <div class="song-anime-bar-info">
          <div class="song-anime-bar-sub">🌸 แนะนำตัดกับอนิเมะ:</div>
          <div class="song-anime-bar-name">${anime.nameTH}</div>
          <div class="song-anime-bar-en">${anime.name}</div>
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
        <button class="btn-sm btn-anime-match" onclick="openAnimePicker(${song.id})" title="เปลี่ยนคู่ตัดต่ออนิเมะ">
          🌸 จับคู่อนิเมะ
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

    const anime = ANIMES.find(a => a.id === s.animeId);
    const animeNames = anime ? `${anime.nameTH} ${anime.name}`.toLowerCase() : '';

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
      <div style="font-size:1.15rem;font-weight:600;color:#fff;margin-bottom:0.4rem;">ไม่พบเพลงที่ค้นหา</div>
      <div style="font-size:0.9rem;">ลองค้นหาด้วยคำอื่น หรือกดปุ่ม "ทั้งหมด" เพื่อรีเซ็ตตัวกรอง</div>
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

  if (ws === 'th' || ws === 'en' || ws === 'jp') {
    if (wsMusic) wsMusic.classList.remove('hidden');
    if (wsPairs) wsPairs.classList.add('hidden');
    if (wsVersus) wsVersus.classList.add('hidden');
    if (wsSaved) wsSaved.classList.add('hidden');

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
    if (wsMusic) wsMusic.classList.add('hidden');
    if (wsPairs) wsPairs.classList.remove('hidden');
    if (wsVersus) wsVersus.classList.add('hidden');
    if (wsSaved) wsSaved.classList.add('hidden');

    renderAnimeMatchGrid();
    if (smoothScroll && wsPairs) {
      wsPairs.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else if (ws === 'versus') {
    if (wsMusic) wsMusic.classList.add('hidden');
    if (wsPairs) wsPairs.classList.add('hidden');
    if (wsVersus) wsVersus.classList.remove('hidden');
    if (wsSaved) wsSaved.classList.add('hidden');

    if (!vsLeftSong || !vsRightSong) {
      loadVersus();
    }
    if (smoothScroll && wsVersus) {
      wsVersus.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else if (ws === 'saved') {
    if (wsMusic) wsMusic.classList.add('hidden');
    if (wsPairs) wsPairs.classList.add('hidden');
    if (wsVersus) wsVersus.classList.add('hidden');
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

function filterSongs() {
  const input = document.getElementById('search-input');
  currentSearchTerm = input.value;
  visibleSongsCount = 18;
  const clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.style.display = currentSearchTerm ? 'block' : 'none';
  renderSongsGrid();
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
  const el = document.getElementById(containerId);
  el.innerHTML = `
    <div class="vs-cover-row">
      <div style="position:relative;display:inline-block;">
        <img src="${song.coverUrl}" alt="${song.title}" class="vs-cover-img" onerror="this.onerror=null;this.src='${getSongFallbackCover(song)}';" />
        ${renderBookmarkBtn(song.id)}
      </div>
    </div>
    <div class="vs-song-title">${song.title}</div>
    <div class="vs-song-artist">${song.artist}</div>
    <div style="margin-bottom:0.6rem;display:flex;gap:0.4rem;justify-content:center;">
      <span class="song-mood ${moodClass(song.mood)}">${moodLabel(song.mood)}</span>
      <span class="song-lang-badge">${langPillText(song.lang)}</span>
    </div>
    <div class="vs-anime-hint">
      🌸 อนิเมะแนะนำ: <strong>${anime.nameTH}</strong>
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
  resultEl.innerHTML = `
    <div style="font-size:1.35rem;margin-bottom:0.4rem;color:#fff;">🏆 คุณเลือก <strong>"${winner.title}"</strong> โดย ${winner.artist}!</div>
    <div style="color:var(--text-muted);font-size:0.95rem;margin-bottom:1.2rem;">
      เพลงสไตล์ ${moodLabel(winner.mood)} (${langPillText(winner.lang)}) — เหมาะมากสำหรับการทำคลิปไทโป ✨
    </div>
    ${anime ? `
      <div class="vs-anime-recommend">
        <div style="font-weight:700;margin-bottom:0.8rem;color:var(--primary);font-size:1.05rem;">🌸 อนิเมะแนะนำให้เอาไปตัดต่อคู่กัน:</div>
        <div style="display:flex;gap:1.2rem;align-items:center;justify-content:center;flex-wrap:wrap;">
          ${animeImgTag(anime, 'vs-anime-img', 'width:90px;height:130px;object-fit:cover;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.6);')}
          <div style="text-align:left;max-width:420px;">
            <div style="font-weight:700;font-size:1.15rem;color:#fff;">${anime.nameTH}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.4rem;">${anime.name} • ${anime.genre.join(', ')}</div>
            <a href="${anime.anifumeUrl}" target="_blank" class="random-anime-link" style="display:inline-block;margin-top:0.5rem;">🌸 เปิดดูบน Anifume →</a>
          </div>
        </div>
      </div>
    ` : ''}
  `;
}

// ---- ANIME MATCH GRID ----
let currentPairCategory = 'all';

function renderAnimeMatchGrid(filterCategory = 'all') {
  const grid = document.getElementById('anime-match-grid');
  if (!grid) return;

  const filteredPairs = ANIME_PAIRS.filter(p => {
    if (filterCategory === 'all') return true;
    return p.category === filterCategory;
  });

  grid.innerHTML = filteredPairs.map((pair, idx) => {
    const song  = SONGS.find(s => s.id === pair.songId);
    const anime = ANIMES.find(a => a.id === pair.animeId);
    if (!song || !anime) return '';

    const isPlaying = currentPlayingId === song.id && currentAudio && !currentAudio.paused;
    const isPriority = idx < 12;
    const loadMode = isPriority ? 'eager' : 'lazy';
    const fetchPri = isPriority ? 'high' : 'auto';
    const priAttr = isPriority ? ' fetchpriority="high"' : '';

    return `
      <div class="match-card" id="pair-${pair.songId}-${pair.animeId}">
        <div class="match-visual-banner">
          <div class="match-anime-half">
            ${animeImgTag(anime, 'match-anime-poster', '', loadMode, fetchPri)}
            <div class="match-anime-overlay"></div>
            <div class="match-anime-tag">🌸 ${anime.nameTH}</div>
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
            <span class="match-badge-chip">${pair.badge || '✨ คู่แนะนำ'}</span>
            <span class="song-lang-badge">${langPillText(song.lang)}</span>
          </div>
          
          <div class="match-titles-row">
            <div class="match-left-title">
              <div class="anime-main-name">${anime.nameTH}</div>
              <div class="anime-sub-name">${anime.name} • ${anime.genre.join(', ')}</div>
            </div>
            <div class="match-right-song">
              <div class="song-main-title">${song.title}</div>
              <div class="song-artist-name">โดย ${song.artist} <span class="song-mood ${moodClass(song.mood)}" style="font-size:0.7rem;padding:0.1rem 0.5rem;">${moodLabel(song.mood)}</span></div>
            </div>
          </div>

          <div class="match-card-footer">
            ${renderPlayButton(song.id, isPlaying)}
            <div style="display:flex;gap:0.5rem;">
              <a href="${anime.anifumeUrl}" target="_blank" class="match-open-btn match-open-btn-alt">🌸 ดูบน Anifume</a>
              <a href="${song.spotifyUrl}" target="_blank" class="match-open-btn">🎧 Spotify</a>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function filterPairs(category, btn) {
  currentPairCategory = category;
  document.querySelectorAll('.match-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAnimeMatchGrid(category);
}

// ---- QUICK PAIR FINDER ----
function populateFinderDropdowns() {
  const songSelect = document.getElementById('finder-song-select');
  const animeSelect = document.getElementById('finder-anime-select');
  if (!songSelect || !animeSelect) return;

  songSelect.innerHTML = '<option value="">-- เลือกเพลงที่ชอบ --</option>';
  animeSelect.innerHTML = '<option value="">-- เลือกอนิเมะที่ต้องการตัดต่อ --</option>';

  SONGS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `[${langPillText(s.lang)}] ${s.title} - ${s.artist}`;
    songSelect.appendChild(opt);
  });

  ANIMES.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.nameTH} (${a.name})`;
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

// ---- ANIME PICKER: เลือกเพลงแล้วเลือกอนิเมะที่เข้ากัน ----
let _pickerSongId = null;

function openAnimePicker(songId) {
  const song = SONGS.find(s => s.id === songId);
  if (!song) return;
  _pickerSongId = songId;

  // Find matching moods from this song to suggest animes (กรองเนื้อหาไม่เหมาะสมออก)
  const songMood = song.mood || 'chill';
  const safeAnimes = ANIMES.filter(a => isAnimeAppropriate(a));
  const matchedAnimes = safeAnimes.filter(a => a.mood === songMood).slice(0, 30);
  const otherAnimes = safeAnimes.filter(a => a.mood !== songMood).slice(0, 20);
  const suggestedAnimes = [...matchedAnimes, ...otherAnimes];

  const content = document.getElementById('anime-picker-content');
  if (!content) return;

  content.innerHTML = `
    <div style="margin-bottom:1.4rem;">
      <div style="font-size:0.78rem;font-weight:700;color:var(--primary);letter-spacing:1px;text-transform:uppercase;margin-bottom:0.5rem;">ANIME PAIRING STUDIO</div>
      <div style="font-size:1.3rem;font-weight:800;color:#fff;margin-bottom:0.3rem;">🎵 ${song.title}</div>
      <div style="color:var(--text-muted);font-size:0.9rem;margin-bottom:0.8rem;">โดย ${song.artist} • ${moodLabel(songMood)}</div>
      <div style="font-size:0.95rem;color:var(--text-muted);">
        เลือกอนิเมะที่เข้ากับอารมณ์เพลงนี้ — อนิเมะมู้ด <span style="color:var(--primary);font-weight:700;">${moodLabel(songMood)}</span> แนะนำเป็นอันดับต้น
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:0.9rem;max-height:55vh;overflow-y:auto;padding-right:4px;">
      ${suggestedAnimes.map(anime => {
        const isMoodMatch = anime.mood === songMood;
        return `
          <div class="anime-picker-card ${isMoodMatch ? 'mood-match' : ''}" onclick="selectAnimePair(${song.id}, ${anime.id})" title="${anime.nameTH}">
            ${animeImgTag(anime, 'picker-anime-img')}
            <div class="picker-anime-info">
              ${isMoodMatch ? '<span class="picker-match-badge">★ เข้ากัน</span>' : ''}
              <div class="picker-anime-name">${anime.nameTH}</div>
              <div class="picker-anime-en">${anime.name}</div>
            </div>
          </div>`;
      }).join('')}
    </div>

    <div style="margin-top:1.2rem;padding-top:1rem;border-top:1px solid var(--glass-border);text-align:center;">
      <button onclick="closeAnimePicker()" style="background:none;border:1px solid var(--glass-border);color:var(--text-muted);padding:0.5rem 1.5rem;border-radius:9999px;cursor:pointer;font-family:Kanit,sans-serif;">ยกเลิก</button>
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

  // Show the full detail modal with this specific pairing (ไม่แสดง typoIdea)
  document.getElementById('modal-content').innerHTML = `
    <div style="margin-bottom:0.5rem;font-size:0.75rem;color:var(--primary);font-weight:700;letter-spacing:1px;">TYPO CLIP PAIRING</div>
    <div class="modal-header">
      <img src="${song.coverUrl}" alt="${song.title}" class="modal-cover"
        onerror="this.onerror=null;this.src='${fallbackCover}';" />
      <div>
        <div class="modal-title">${song.title}</div>
        <div class="modal-artist">โดย ${song.artist} <span class="song-lang-badge">${langPillText(song.lang)}</span></div>
        <span class="song-mood ${moodClass(song.mood)}">${moodLabel(song.mood)}</span>
        <span class="song-tag" style="margin-left:0.4rem;">⚡ ${song.bpm}</span>
        <div style="margin-top:0.8rem;display:flex;gap:0.6rem;flex-wrap:wrap;">
          ${renderPlayButton(song.id, isPlaying)}
          <a href="${song.spotifyUrl}" target="_blank" class="btn-sm btn-spotify">🎧 ฟังเต็มบน Spotify</a>
          <button class="btn-sm btn-modal-save ${isSongSaved(song.id) ? 'saved' : ''}" data-save-id="${song.id}" onclick="toggleSaveSong(${song.id}, event)">
            ${isSongSaved(song.id) ? '❤️ บันทึกแล้ว' : '🤍 บันทึกเพลงนี้'}
          </button>
        </div>
      </div>
    </div>

    <div style="margin-top:1.5rem;padding:1rem;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;">
      <div style="font-size:0.8rem;color:var(--primary);font-weight:700;margin-bottom:0.6rem;">✅ อนิเมะแนะนำสำหรับตัดต่อคู่กัน</div>
      <div class="modal-anime-showcase">
        ${animeImgTag(anime, 'modal-anime-img')}
        <div class="modal-anime-info">
          <div style="font-weight:700;color:var(--primary);font-size:1.25rem;">${anime.nameTH}</div>
          <div style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.4rem;">${anime.name}</div>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.8rem;">
            ${(anime.genre || []).map(g => `<span style="background:rgba(255,255,255,0.08);padding:0.15rem 0.5rem;border-radius:6px;font-size:0.75rem;color:var(--text-muted);">${g}</span>`).join('')}
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <a href="${anime.anifumeUrl}" target="_blank" class="btn-sm btn-anifume">🌸 ดูข้อมูลและตอนที่ Anifume →</a>
            <button onclick="openAnimePicker(${song.id})" class="btn-sm" style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:#a5b4fc;cursor:pointer;border-radius:9999px;font-family:Kanit,sans-serif;">🔄 เปลี่ยนอนิเมะ</button>
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
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let lastSync = parseInt(localStorage.getItem('typo_weekly_sync_time') || '0');

  if (!lastSync) {
    lastSync = now;
    localStorage.setItem('typo_weekly_sync_time', lastSync.toString());
  }

  const elapsed = now - lastSync;
  const daysLeft = Math.max(1, 7 - Math.floor(elapsed / (24 * 60 * 60 * 1000)));

  const syncStatusEl = document.getElementById('weekly-sync-status');
  if (syncStatusEl) {
    if (elapsed >= WEEK_MS) {
      syncStatusEl.innerHTML = currentAppLang === 'th'
        ? `🎉 <strong>ถึงรอบอัปเดต 7 วันแล้ว!</strong> มีเพลง & อนิเมะชุดใหม่พร้อมใช้งาน`
        : `🎉 <strong>Weekly Drop is live!</strong> Fresh songs & anime ready for typography editing`;
    } else {
      syncStatusEl.innerHTML = currentAppLang === 'th'
        ? `✨ อัปเดตล่าสุด: ${SONGS.length} เพลง • ${ANIMES.length} เรื่อง (รอบถัดไปอีก ${daysLeft} วัน)`
        : `✨ Latest Update: ${SONGS.length} tracks • ${ANIMES.length} anime (next drop in ${daysLeft} days)`;
    }
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
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
  updateSavedBadges();
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

  if (countTh) countTh.textContent = `${thCount} เพลง`;
  if (countEn) countEn.textContent = `${enCount} เพลง`;
  if (countJp) countJp.textContent = `${jpCount} เพลง`;
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
  const heroExploreBtn = document.querySelector('a[href="#songs"].btn-ghost');
  if (heroExploreBtn) {
    heroExploreBtn.innerHTML = currentAppLang === 'th'
      ? `🎵 สำรวจคลังเพลง (<span id="hero-song-count">${SONGS.length}</span> เพลง)`
      : `🎵 Explore Music (<span id="hero-song-count">${SONGS.length}</span> tracks)`;
  }

  const zoneTabAll = document.querySelector('.zone-tab-btn[data-zone="all"] .zone-tab-count');
  if (zoneTabAll) zoneTabAll.textContent = `${SONGS.length} เพลง`;

  const langAllBtn = document.querySelector('.lang-tab-btn[data-lang="all"]');
  const langThBtn = document.querySelector('.lang-tab-btn[data-lang="th"]');
  const langEnBtn = document.querySelector('.lang-tab-btn[data-lang="en"]');
  const langJpBtn = document.querySelector('.lang-tab-btn[data-lang="jp"]');

  if (langAllBtn) langAllBtn.textContent = `🌐 ทั้งหมด (${SONGS.length})`;
  if (langThBtn) langThBtn.textContent = `🇹🇭 เพลงไทย (${thCount})`;
  if (langEnBtn) langEnBtn.textContent = `🇬🇧 เพลงสากล English (${enCount})`;
  if (langJpBtn) langJpBtn.textContent = `🇯🇵 ญี่ปุ่น & อนิเมะ (${jpCount})`;

  const matchFilterAll = document.querySelector('.match-filter-btn[data-filter="all"]');
  if (matchFilterAll) matchFilterAll.textContent = `🌟 ทุกคู่ (${ANIME_PAIRS.length} คู่)`;

  const matchDesc = document.getElementById('match-section-desc');
  if (matchDesc) {
    matchDesc.textContent = currentAppLang === 'th'
      ? `รวม ${ANIME_PAIRS.length} คู่เพลง และอนิเมะ ${ANIMES.length} เรื่อง พร้อมภาพโปสเตอร์และตัวอย่างเพลงสำหรับตัดต่อ`
      : `Total ${ANIME_PAIRS.length} Song & Anime Pairs across ${ANIMES.length} titles with posters and music previews for editing`;
  }
}

function initScrollEffect() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  });
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
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      const btn = document.getElementById('hamburger');
      if (btn) btn.textContent = '☰';
    }
  }
});
