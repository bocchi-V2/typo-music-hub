const https = require('https');
const http = require('http');

function fetchBuffer(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) return reject(new Error('Too many redirects'));
    const parsed = new URL(url);
    const client = parsed.protocol === 'http:' ? http : https;
    
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).href;
        return fetchBuffer(nextUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const contentType = res.headers['content-type'] || 'audio/mpeg';
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout downloading audio'));
    });
  });
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const queryUrl = event.queryStringParameters?.url;
  const fileName = event.queryStringParameters?.name || 'song.mp3';

  if (!queryUrl) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing url parameter' })
    };
  }

  try {
    const { buffer, contentType } = await fetchBuffer(queryUrl);
    
    // Choose appropriate extension if needed
    let safeName = fileName.replace(/[\\/:*?"<>|]/g, '').trim();
    if (!safeName.endsWith('.mp3') && !safeName.endsWith('.m4a')) {
      safeName += contentType.includes('mp4') || contentType.includes('m4a') ? '.m4a' : '.mp3';
    }

    const encodedName = encodeURIComponent(safeName);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType || 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    // Resilient Fallback: 302 redirect directly to audio source so client browser/phone downloads directly
    return {
      statusCode: 302,
      headers: {
        ...corsHeaders,
        'Location': queryUrl
      },
      body: ''
    };
  }
};
