const fs = require('fs');

function merge() {
  if (!fs.existsSync('new_animes_batch.json') || !fs.existsSync('new_songs_batch.json')) {
    console.error('Files not ready');
    return;
  }

  const newAnimes = JSON.parse(fs.readFileSync('new_animes_batch.json', 'utf8'));
  const newSongs = JSON.parse(fs.readFileSync('new_songs_batch.json', 'utf8'));

  console.log(`Loaded ${newAnimes.length} animes and ${newSongs.length} songs.`);

  // Read data.js
  let dataContent = fs.readFileSync('data.js', 'utf8');

  // We can load data.js using new Function
  const fn = new Function(dataContent + '; return { ANIMES, SONGS, ANIME_PAIRS };');
  const { ANIMES, SONGS, ANIME_PAIRS } = fn();

  console.log(`Original: ${ANIMES.length} animes, ${SONGS.length} songs, ${ANIME_PAIRS.length} pairs`);

  // Add new animes if not already present
  const existingAnimeIds = new Set(ANIMES.map(a => a.id));
  for (const na of newAnimes) {
    if (!existingAnimeIds.has(na.id)) {
      ANIMES.push(na);
      existingAnimeIds.add(na.id);
    }
  }

  // Add new songs
  const existingSongIds = new Set(SONGS.map(s => s.id));
  for (const ns of newSongs) {
    if (!existingSongIds.has(ns.id)) {
      SONGS.push(ns);
      existingSongIds.add(ns.id);

      ANIME_PAIRS.push({
        songId: ns.id,
        animeId: ns.animeId,
        category: ns.mood,
        badge: '🎬 ตัดต่อไทโปสุดลงตัว'
      });
    }
  }

  console.log(`Updated: ${ANIMES.length} animes, ${SONGS.length} songs, ${ANIME_PAIRS.length} pairs`);

  // Re-serialize data.js cleanly
  const output = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;

  fs.writeFileSync('data.js', output, 'utf8');
  console.log('✅ data.js successfully updated!');
}

merge();
