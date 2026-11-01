const https = require('https');

function httpsGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'th,en;q=0.9',
        ...options.headers
      },
      timeout: 8000
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, options).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function httpsPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = typeof body === 'string' ? body : JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      },
      timeout: 12000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(postData);
    req.end();
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

    // Step 1: Search YouTube for the video ID
    const searchQuery = `${q} official audio`;
    let videoId = null;
    try {
      const searchRes = await httpsGet(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`);
      const match = searchRes.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (match) videoId = match[1];
    } catch (e) {
      console.warn('YouTube search failed:', e.message);
    }

    if (!videoId) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: 'No video found', searchQuery: q })
      };
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Step 2: Try Cobalt API to get direct audio download URL
    let directAudioUrl = null;

    // Try cobalt.tools API (primary)
    const cobaltInstances = [
      'https://api.cobalt.tools',
      'https://cobalt-api.hyper.lol'
    ];

    for (const cobaltBase of cobaltInstances) {
      if (directAudioUrl) break;
      try {
        const cobaltRes = await httpsPost(`${cobaltBase}/`, {
          url: youtubeUrl,
          downloadMode: 'audio',
          audioFormat: 'mp3'
        }, {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });

        if (cobaltRes.statusCode === 200) {
          const cobaltData = JSON.parse(cobaltRes.data);
          if (cobaltData.url) {
            directAudioUrl = cobaltData.url;
          } else if (cobaltData.audio) {
            directAudioUrl = cobaltData.audio;
          }
        }
      } catch (e) {
        console.warn(`Cobalt ${cobaltBase} failed:`, e.message);
      }
    }

    // Step 3: Try alternative - piped.video API
    if (!directAudioUrl) {
      const pipedInstances = [
        'pipedapi.kavin.rocks',
        'api.piped.projectsegfau.lt'
      ];
      for (const pipedHost of pipedInstances) {
        if (directAudioUrl) break;
        try {
          const pipedRes = await httpsGet(`https://${pipedHost}/streams/${videoId}`);
          if (pipedRes.statusCode === 200) {
            const pipedData = JSON.parse(pipedRes.data);
            // Get audio-only stream with highest quality
            if (pipedData.audioStreams && pipedData.audioStreams.length > 0) {
              const sorted = pipedData.audioStreams
                .filter(s => s.mimeType && s.mimeType.includes('audio'))
                .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
              if (sorted.length > 0) {
                directAudioUrl = sorted[0].url;
              }
            }
          }
        } catch (e) {
          console.warn(`Piped ${pipedHost} failed:`, e.message);
        }
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: true,
        videoId,
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
