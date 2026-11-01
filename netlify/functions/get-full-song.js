// Add debug log to body so we can see what failed on server
const https = require('https');

function httpsGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'th,en;q=0.9',
        'Referer': 'https://ytmp3.gl/',
        'Origin': 'https://ytmp3.gl',
        ...options.headers
      },
      timeout: 12000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location, options).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data, json, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data, headers: res.headers });
        }
      });
    }).on('error', reject);
  });
}

async function searchYouTube(query) {
  try {
    const searchRes = await httpsGet(`https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' official audio')}`);
    const match = searchRes.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

async function getGammaMp3(videoId, query) {
  const debug = [];
  try {
    debug.push('fetching ytmp3.gl');
    const home = await httpsGet('https://ytmp3.gl/');
    debug.push(`ytmp3.gl status: ${home.statusCode}`);
    const m = home.data.match(/apiKey\s*=\s*['"]([^'"]+)['"]/);
    const apiKey = m ? m[1] : null;
    debug.push(`apiKey: ${apiKey ? 'found' : 'missing'}`);
    if (!apiKey) return { directAudioUrl: null, debug };

    debug.push('calling auth');
    const auth = await httpsGet(`https://gamma.gammacloud.net/api/v1/auth?api_key=${apiKey}&_=${Date.now()}`);
    debug.push(`auth status: ${auth.statusCode}, body: ${auth.data.slice(0, 100)}`);
    const token = auth.json?.key;
    if (!token) return { directAudioUrl: null, debug };

    debug.push('calling init');
    const init = await httpsGet(`https://gamma.gammacloud.net/api/v1/init?_=${Date.now()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    debug.push(`init status: ${init.statusCode}`);
    const convertURL = init.json?.convertURL;
    if (!convertURL) return { directAudioUrl: null, debug };

    debug.push('calling convertURL');
    let conv = await httpsGet(`${convertURL}&v=${videoId}&f=mp3&_=${Date.now()}`);
    debug.push(`conv status: ${conv.statusCode}, redirect: ${conv.json?.redirect}`);
    if (conv.json?.redirect === 1 && conv.json?.redirectURL) {
      conv = await httpsGet(`${conv.json.redirectURL}&v=${videoId}&f=mp3&_=${Date.now()}`);
      debug.push(`redirect conv status: ${conv.statusCode}`);
    }

    if (conv.json?.downloadURL) {
      return {
        directAudioUrl: `${conv.json.downloadURL}&v=${videoId}&f=mp3&r=ytmp3.gl`,
        title: conv.json.title || query,
        debug
      };
    }

    if (conv.json?.progressURL) {
      for (let i = 0; i < 7; i++) {
        await new Promise(r => setTimeout(r, 1800));
        const prog = await httpsGet(`${conv.json.progressURL}&_=${Date.now()}`);
        if (prog.json?.status === 'download' || prog.json?.progress >= 3) {
          return {
            directAudioUrl: `${conv.json.downloadURL}&v=${videoId}&f=mp3&r=ytmp3.gl`,
            title: prog.json.title || conv.json.title || query,
            debug
          };
        }
      }
    }
  } catch (err) {
    debug.push(`error: ${err.message}`);
  }
  return { directAudioUrl: null, debug };
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
    let q = (event.queryStringParameters?.q || '').trim();
    if (!q && event.body) {
      try {
        const body = JSON.parse(event.body);
        q = (body.query || `${body.title || ''} ${body.artist || ''}`).trim();
      } catch (e) {}
    }

    if (!q) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ ok: false, error: 'Query required' }) };
    }

    const videoId = await searchYouTube(q);
    if (!videoId) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: 'No YouTube video found', query: q })
      };
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const gammaResult = await getGammaMp3(videoId, q);

    if (gammaResult && gammaResult.directAudioUrl) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          ok: true,
          fullLength: true,
          videoId,
          videoUrl: youtubeUrl,
          directAudioUrl: gammaResult.directAudioUrl,
          title: gammaResult.title,
          query: q
        })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: false,
        videoId,
        videoUrl: youtubeUrl,
        directAudioUrl: null,
        debug: gammaResult?.debug,
        query: q
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
