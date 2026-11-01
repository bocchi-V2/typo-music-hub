const https = require('https');

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

  try {
    let q = '';
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      q = (body.query || `${body.title || ''} ${body.artist || ''}`).trim();
    } else {
      q = (event.queryStringParameters?.q || '').trim();
    }

    if (!q) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Query is required' }) };
    }

    const searchQuery = `${q} official audio`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

    const videoId = await new Promise((resolve) => {
      const req = https.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'th,en-US;q=0.9,en;q=0.8'
        },
        timeout: 6000
      }, (res) => {
        let html = '';
        res.on('data', chunk => html += chunk);
        res.on('end', () => {
          const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
          resolve(match ? match[1] : null);
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });

    const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const y2mateUrl = videoId ? `https://y2mate.is/watch?v=${videoId}` : `https://y2mate.is/`;
    const ytmp3Url = videoId ? `https://ytmp3.nu/?url=https://www.youtube.com/watch?v=${videoId}` : `https://ytmp3.nu/?url=${encodeURIComponent(searchUrl)}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        videoId,
        videoUrl,
        downloadUrl: y2mateUrl,
        backupDownloadUrl: ytmp3Url,
        searchQuery: q
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
