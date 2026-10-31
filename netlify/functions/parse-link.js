const https = require('https');
const http = require('http');

function fetchJson(url, headers = {}) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...headers
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location, headers).then(resolve);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(9000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function fetchHtml(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.setTimeout(9000, () => {
      req.destroy();
      resolve('');
    });
  });
}

// Clean video titles from YouTube
function cleanVideoTitle(rawTitle) {
  if (!rawTitle) return { title: '', artist: '' };
  
  let cleaned = rawTitle
    .replace(/\[(Official\s*(Music\s*)?(Video|MV|Audio|Visualizer|Lyric\s*Video|Lyrics)?|MV|Audio|Visualizer|HD|4K)\]/gi, '')
    .replace(/\((Official\s*(Music\s*)?(Video|MV|Audio|Visualizer|Lyric\s*Video|Lyrics)?|MV|Audio|Visualizer|HD|4K|Remaster(ed)?)\)/gi, '')
    .replace(/\|\s*(Official\s*(Music\s*)?(Video|MV|Audio|Visualizer)|MV|Lyrics?).*$/gi, '')
    .replace(/【(Official\s*MV|MV|Music\s*Video)】/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  let artist = '';
  let title = cleaned;

  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (cleaned.includes(' – ')) {
    const parts = cleaned.split(' – ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' – ').trim();
  } else if (cleaned.includes(' : ')) {
    const parts = cleaned.split(' : ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' : ').trim();
  }

  // Remove trailing quotes or punctuation
  title = title.replace(/^["'“]|["'”]$/g, '').trim();
  artist = artist.replace(/^["'“]|["'”]$/g, '').trim();

  return { title: title || cleaned, artist: artist };
}

// Search iTunes for live audio preview and HD 600x600 artwork
async function searchITunesTrack(query, country = 'th') {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=3&country=${country}`;
  const data = await fetchJson(url);
  if (data && data.results && data.results.length > 0) {
    const track = data.results.find(t => t.previewUrl) || data.results[0];
    return {
      title: track.trackName,
      artist: track.artistName,
      previewUrl: track.previewUrl || '',
      coverUrl: (track.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
      genre: track.primaryGenreName || 'Pop',
      year: track.releaseDate ? track.releaseDate.substring(0, 4) : '2026',
      spotifyUrl: track.trackViewUrl || `https://open.spotify.com/search/${encodeURIComponent(track.trackName + ' ' + track.artistName)}`
    };
  }
  return null;
}

// Language detection
function detectLang(title, artist) {
  const text = (title || '') + ' ' + (artist || '');
  if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return 'jp';
  if (/[\uac00-\ud7af]/.test(text)) return 'kr';
  return 'en';
}

// Mood derivation
function deriveMood(title, artist, genre = '') {
  const text = ((title || '') + ' ' + (artist || '') + ' ' + genre).toLowerCase();
  if (text.includes('rock') || text.includes('metal') || text.includes('beat') || text.includes('hype') || text.includes('dance') || text.includes('มันส์')) {
    return { mood: 'hype', bpm: 'เร็ว (130 BPM)' };
  }
  if (text.includes('sad') || text.includes('cry') || text.includes('เศร้า') || text.includes('เหงา') || text.includes('อกหัก') || text.includes('เจ็บ')) {
    return { mood: 'sad', bpm: 'ช้า (78 BPM)' };
  }
  if (text.includes('love') || text.includes('รัก') || text.includes('ใจ') || text.includes('หวาน') || text.includes('sweet')) {
    return { mood: 'love', bpm: 'ปานกลาง (100 BPM)' };
  }
  return { mood: 'chill', bpm: 'ชิลล์ (95 BPM)' };
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let targetUrl = '';
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      targetUrl = (body.url || '').trim();
    } catch (e) {}
  } else if (event.queryStringParameters && event.queryStringParameters.url) {
    targetUrl = event.queryStringParameters.url.trim();
  }

  if (!targetUrl) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'URL parameter is required' })
    };
  }

  try {
    let source = 'web';
    let extractedTitle = '';
    let extractedArtist = '';
    let extractedCover = '';
    let extractedPreview = '';
    let originalUrl = targetUrl;
    let isYouTube = false;

    // 1. YouTube URL detection
    const ytMatch = targetUrl.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch) {
      isYouTube = true;
      source = 'youtube';
      const videoId = ytMatch[1];
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
      const oembed = await fetchJson(oembedUrl);

      if (oembed && oembed.title) {
        const { title, artist } = cleanVideoTitle(oembed.title);
        extractedTitle = title;
        extractedArtist = artist || oembed.author_name || 'YouTube Music';
        extractedCover = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }
    }

    // 2. Spotify URL detection
    if (!extractedTitle && targetUrl.includes('open.spotify.com')) {
      source = 'spotify';
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(targetUrl)}`;
      const oembed = await fetchJson(oembedUrl);
      if (oembed && oembed.title) {
        extractedTitle = oembed.title;
        extractedArtist = oembed.author_name || 'Spotify';
        extractedCover = oembed.thumbnail_url || '';
      }
    }

    // 3. Generic OpenGraph HTML parsing fallback
    if (!extractedTitle) {
      const html = await fetchHtml(targetUrl);
      if (html) {
        const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
        const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
        const titleTag = html.match(/<title>(.*?)<\/title>/i);

        const raw = (ogTitle ? ogTitle[1] : (titleTag ? titleTag[1] : '')).trim();
        if (raw) {
          const { title, artist } = cleanVideoTitle(raw);
          extractedTitle = title;
          extractedArtist = artist;
          extractedCover = ogImage ? ogImage[1] : '';
        }
      }
    }

    if (!extractedTitle) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ ok: false, error: 'Could not extract metadata from this link' })
      };
    }

    // 4. Enrich with iTunes Search API for genuine 30s audio sample & HD artwork
    const lang = detectLang(extractedTitle, extractedArtist);
    const country = lang === 'th' ? 'th' : (lang === 'jp' ? 'jp' : 'us');
    
    let itunesTrack = null;
    if (extractedArtist) {
      itunesTrack = await searchITunesTrack(`${extractedTitle} ${extractedArtist}`, country);
    }
    if (!itunesTrack) {
      itunesTrack = await searchITunesTrack(extractedTitle, country);
    }

    const finalTitle = (itunesTrack && itunesTrack.title) || extractedTitle;
    const finalArtist = (itunesTrack && itunesTrack.artist) || extractedArtist || 'Various Artists';
    const finalCover = (itunesTrack && itunesTrack.coverUrl) || extractedCover || 'splash-cover.jpg';
    const finalPreview = (itunesTrack && itunesTrack.previewUrl) || '';
    const finalGenre = (itunesTrack && itunesTrack.genre) || 'Music';
    const { mood, bpm } = deriveMood(finalTitle, finalArtist, finalGenre);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        source: source,
        originalUrl: originalUrl,
        song: {
          title: finalTitle,
          artist: finalArtist,
          coverUrl: finalCover,
          previewUrl: finalPreview,
          spotifyUrl: (itunesTrack && itunesTrack.spotifyUrl) || `https://open.spotify.com/search/${encodeURIComponent(finalTitle + ' ' + finalArtist)}`,
          youtubeUrl: isYouTube ? originalUrl : `https://www.youtube.com/results?search_query=${encodeURIComponent(finalTitle + ' ' + finalArtist)}`,
          mood: mood,
          bpm: bpm,
          lang: lang,
          genre: finalGenre,
          tags: ["ดึงจากลิงก์จริง", source === 'youtube' ? 'YouTube' : 'Streaming', lang === 'th' ? 'เพลงไทย' : (lang === 'jp' ? 'J-Pop' : 'สากล'), "ไทโป"],
          reason: `เพลง "${finalTitle}" ดึงข้อมูลสดจากลิงก์ ${source.toUpperCase()} จังหวะ ${bpm} เหมาะสำหรับนำไปตัดต่อคลิปไทโป`,
          typoIdea: `แอนิเมชันตัวอักษรไทโปตามท่อนร้องของเพลง "${finalTitle}" ขยับและเปลี่ยนคัทซีนตามจังหวะบีท`
        }
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
