// Fix songs that have anime covers instead of proper music album artwork
const fs = require('fs');
const https = require('https');

const code = fs.readFileSync('data.js', 'utf8');
const { ANIMES, SONGS, ANIME_PAIRS } = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };')();

function fetchJson(url) {
  return new Promise(res => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0)' } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        return fetchJson(r.headers.location).then(res);
      }
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { res(JSON.parse(d)); } catch (e) { res(null); }
      });
    }).on('error', () => res(null));
  });
}

async function searchITunes(term, country = 'th') {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=song&limit=5`;
  const data = await fetchJson(url);
  if (!data || !data.results) return null;
  const track = data.results.find(r => r.previewUrl && r.artworkUrl100 && r.artworkUrl100.includes('mzstatic') && r.trackExplicitness !== 'explicit');
  if (!track) return null;
  return track.artworkUrl100.replace('100x100bb', '600x600bb');
}

// Known correct covers from previous search
const KNOWN_COVERS = {
  5: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c6/e1/63/c6e1632b-e81b-e67a-a21f-79fb450bf96a/5054197946035.jpg/600x600bb.jpg', // D Gerrard - Galaxy Express
  10: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/6c/a8/1a/6ca81ac5-d121-06a3-8e12-d4844e43c862/25UMGIM80861.rgb.jpg/600x600bb.jpg', // BOWKYLION - บานปลาย
  11: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/67/40/40/67404052-23d4-b18a-2b6a-215fdaac94b6/888332908993.jpg/600x600bb.jpg', // Joey Phuwasit - นะหน้าทอง
  22: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/61/00/f3/6100f3a3-619f-69fd-658b-560b78b15a29/888332907217.jpg/600x600bb.jpg', // Paper Planes - ทรงอย่างแบด
  24: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/48/92/0d/48920d26-75b5-0b52-47ca-237fb5b844e2/888332914338.jpg/600x600bb.jpg', // NONT TANONT - พิง
  29: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/53/24/ff/5324ff49-9bb2-46ad-6a00-8502cb671389/cover.jpg/600x600bb.jpg', // THE TOYS - หน้าหนาวที่แล้ว
};

async function main() {
  let fixed = 0;

  // Fix all known covers first
  for (const song of SONGS) {
    if (KNOWN_COVERS[song.id]) {
      console.log(`✅ Fixing song ${song.id} (${song.title}) - ${song.artist}`);
      song.coverUrl = KNOWN_COVERS[song.id];
      fixed++;
    }
  }

  // Search iTunes for remaining (23, 27)
  const remaining = [
    { id: 23, terms: ['ถ้าเราเจอกันอีก Until Then', 'until then tilly birds', 'Tilly Birds ถ้าเราเจอกัน'] },
    { id: 27, terms: ['Ink Waruntorn บุพเพสันนิวาส', 'อิ๊งค์ วรันธร บุพเพสันนิวาส', 'ถ้าเธอรักใครคนหนึ่ง Ink Waruntorn'] },
  ];

  for (const item of remaining) {
    const song = SONGS.find(s => s.id === item.id);
    if (!song) continue;
    let found = false;
    for (const term of item.terms) {
      const cover = await searchITunes(term, 'th');
      if (cover) {
        console.log(`✅ Fixing song ${song.id} (${song.title}) - ${song.artist} -> ${cover}`);
        song.coverUrl = cover;
        fixed++;
        found = true;
        break;
      }
    }
    if (!found) console.log(`⚠️ Could not find iTunes cover for song ${item.id}: ${song.title} - ${song.artist}`);
  }

  const out = `const ANIMES = ${JSON.stringify(ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(ANIME_PAIRS, null, 2)};\n`;
  fs.writeFileSync('data.js', out, 'utf8');
  console.log(`\n💾 data.js saved. Fixed ${fixed} song covers.`);
}

main();
