const fs = require('fs');

const content = fs.readFileSync('data.js', 'utf8');
const songs = eval(content.slice(content.indexOf('const SONGS ='), content.indexOf('const ANIME_PAIRS =')) + '; SONGS;');

console.log('Testing', songs.length, 'songs...');

async function checkUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return { ok: false, status: 0 };
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    // If HEAD fails, try GET with range or simple GET
    try {
      const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-10' }, signal: AbortSignal.timeout(4000) });
      return { ok: res.ok || res.status === 206, status: res.status };
    } catch (e2) {
      return { ok: false, status: 500, err: e2.message };
    }
  }
}

async function run() {
  const badPreviews = [];
  const badCovers = [];
  
  // We check in batches of 15
  const concurrency = 15;
  for (let i = 0; i < songs.length; i += concurrency) {
    const batch = songs.slice(i, i + concurrency);
    await Promise.all(batch.map(async s => {
      const pCheck = await checkUrl(s.previewUrl);
      if (!pCheck.ok) {
        badPreviews.push({ id: s.id, title: s.title, artist: s.artist, previewUrl: s.previewUrl, status: pCheck.status });
      }
      
      if (!s.coverUrl || s.coverUrl.includes('favicon-logo') || s.coverUrl.includes('placeholder')) {
        badCovers.push({ id: s.id, title: s.title, artist: s.artist, coverUrl: s.coverUrl, reason: 'placeholder' });
      } else {
        const cCheck = await checkUrl(s.coverUrl);
        if (!cCheck.ok) {
          badCovers.push({ id: s.id, title: s.title, artist: s.artist, coverUrl: s.coverUrl, status: cCheck.status });
        }
      }
    }));
    process.stdout.write(`\rChecked ${Math.min(i + concurrency, songs.length)} / ${songs.length}... (Bad Previews: ${badPreviews.length}, Bad Covers: ${badCovers.length})`);
  }
  console.log('\n\n--- RESULTS ---');
  console.log('Bad previews total:', badPreviews.length);
  console.log('Bad covers total:', badCovers.length);
  
  fs.writeFileSync('bad_urls.json', JSON.stringify({ badPreviews, badCovers }, null, 2), 'utf8');
  console.log('Wrote bad_urls.json');
}

run();
