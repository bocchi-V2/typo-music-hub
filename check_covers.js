// check_covers.js
const fs = require('fs');

const raw = fs.readFileSync('./data.js', 'utf8');

// Extract SONGS array
const songsMatch = raw.match(/const SONGS\s*=\s*(\[[\s\S]*?\]);\s*\n/);
if (!songsMatch) { console.error('Cannot find SONGS'); process.exit(1); }

let SONGS;
try { SONGS = eval(songsMatch[1]); } catch(e) { console.error('eval error', e.message); process.exit(1); }

console.log('Total songs:', SONGS.length);
const broken = SONGS.filter(s => !s.coverUrl || s.coverUrl.trim() === '');
console.log('Missing coverUrl:', broken.length);
broken.forEach(s => console.log(' ', s.id, '|', s.title, '|', s.artist));
