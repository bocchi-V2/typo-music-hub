const fs = require('fs');

const content = fs.readFileSync('data.js', 'utf8');
const songs = eval(content.slice(content.indexOf('const SONGS ='), content.indexOf('const ANIME_PAIRS =')) + '; SONGS;');

console.log('Total songs:', songs.length);

const missingPreview = [];
const missingCover = [];
const placeholderCover = [];

songs.forEach(s => {
  if (!s.previewUrl || s.previewUrl.trim() === '' || s.previewUrl === 'null' || s.previewUrl === 'undefined') {
    missingPreview.push(s);
  }
  if (!s.coverUrl || s.coverUrl.trim() === '' || s.coverUrl === 'null' || s.coverUrl === 'undefined') {
    missingCover.push(s);
  } else if (s.coverUrl.includes('favicon-logo') || s.coverUrl.includes('placeholder') || s.coverUrl.includes('dummy')) {
    placeholderCover.push(s);
  }
});

console.log('Missing previewUrl count:', missingPreview.length);
console.log('Missing coverUrl count:', missingCover.length);
console.log('Placeholder coverUrl count:', placeholderCover.length);

fs.writeFileSync('audit_results.json', JSON.stringify({
  missingPreview: missingPreview.map(s => ({ id: s.id, title: s.title, artist: s.artist })),
  missingCover: missingCover.map(s => ({ id: s.id, title: s.title, artist: s.artist })),
  placeholderCover: placeholderCover.map(s => ({ id: s.id, title: s.title, artist: s.artist }))
}, null, 2));

console.log('Sample missing previews:');
missingPreview.slice(0, 15).forEach(s => console.log(`[${s.id}] ${s.title} by ${s.artist}`));
