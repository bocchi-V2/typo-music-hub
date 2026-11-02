const https = require('https');
const http = require('http');

function httpsGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'http:' ? http : https;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'th,en;q=0.9',
        ...options.headers
      },
      timeout: options.timeout || 8000
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).href;
        return httpsGet(nextUrl, options).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers, finalUrl: url }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function resolveRedirectLocation(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === 'http:' ? http : https;
      const req = client.request(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 6000
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(res.headers.location);
        } else {
          resolve(url);
        }
      });
      req.on('error', () => resolve(url));
      req.on('timeout', () => { req.destroy(); resolve(url); });
      req.end();
    } catch (e) {
      resolve(url);
    }
  });
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    let q = '';
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      q = (body.query || `${body.title || ''} ${body.artist || ''}`).trim();
    } else {
      q = (event.queryStringParameters?.q || '').trim();
    }

    if (!q) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Query required' }) };
    }

    // Step 1: Search YouTube for Video ID
    const searchQueries = [
      `${q} official audio`,
      `${q} official mv`,
      q
    ];

    let videoId = null;
    let videoTitle = null;

    for (const sq of searchQueries) {
      if (videoId) break;
      try {
        const searchRes = await httpsGet(`https://www.youtube.com/results?search_query=${encodeURIComponent(sq)}`);
        // Find video ID from search results
        const match = searchRes.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (match) {
          videoId = match[1];
        }
      } catch (e) {
        console.warn('YouTube search query failed:', sq, e.message);
      }
    }

    if (!videoId) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: 'No video found', searchQuery: q })
      };
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    let directAudioUrl = null;
    let duration = null;

    // Step 2: Try Invidious Instances (Fastest, direct high quality audio formats)
    const invidiousInstances = [
      'https://yt.chocolatemoo53.com',
      'https://invidious.nerdvpn.de',
      'https://inv.nadeko.net'
    ];

    for (const base of invidiousInstances) {
      if (directAudioUrl) break;
      try {
        const invRes = await httpsGet(`${base}/api/v1/videos/${videoId}`, { timeout: 6000 });
        if (invRes.statusCode === 200) {
          const invData = JSON.parse(invRes.data);
          videoTitle = invData.title || videoTitle;
          duration = invData.lengthSeconds || duration;

          const adaptiveFormats = invData.adaptiveFormats || [];
          const audioFormats = adaptiveFormats.filter(f => f.type && f.type.includes('audio'));
          if (audioFormats.length > 0) {
            // Prefer audio/mp4 (AAC), then highest bitrate
            const mp4Audio = audioFormats.find(f => f.type.includes('audio/mp4'));
            const chosen = mp4Audio || audioFormats.sort((a, b) => (parseInt(b.bitrate, 10) || 0) - (parseInt(a.bitrate, 10) || 0))[0];
            if (chosen && chosen.url) {
              directAudioUrl = chosen.url;
            }
          }
        }
      } catch (e) {
        console.warn(`Invidious ${base} failed:`, e.message);
      }
    }

    // Step 3: Try Invidious latest_version proxy (itag 140 = 128kbps AAC audio)
    if (!directAudioUrl) {
      try {
        const proxyStreamUrl = `https://yt.chocolatemoo53.com/latest_version?id=${videoId}&itag=140`;
        const resolved = await resolveRedirectLocation(proxyStreamUrl);
        if (resolved && resolved !== proxyStreamUrl) {
          directAudioUrl = resolved;
        }
      } catch (e) {
        console.warn('latest_version proxy failed:', e.message);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        videoId,
        title: videoTitle,
        duration: duration ? parseInt(duration, 10) : null,
        videoUrl: youtubeUrl,
        directAudioUrl: directAudioUrl || null,
        searchQuery: q
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
