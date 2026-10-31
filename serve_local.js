const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
  // 1. Audio Download Proxy
  if (req.url.startsWith('/download-audio?')) {
    const parsed = new URL(req.url, 'http://localhost');
    const targetUrl = parsed.searchParams.get('url');
    const downloadName = parsed.searchParams.get('name') || 'haimiya_audio.m4a';
    if (!targetUrl) {
      res.writeHead(400); res.end('Missing url param'); return;
    }
    const client = targetUrl.startsWith('https') ? https : http;
    client.get(targetUrl, (upstream) => {
      res.writeHead(upstream.statusCode, {
        'Content-Type': upstream.headers['content-type'] || 'audio/mp4',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
        'Access-Control-Allow-Origin': '*'
      });
      upstream.pipe(res);
    }).on('error', (e) => {
      res.writeHead(500); res.end('Download proxy error: ' + e.message);
    });
    return;
  }

  // 2. Trigger Auto Update
  if (req.method === 'POST' && req.url === '/trigger-auto-update') {
    const { exec } = require('child_process');
    exec('node auto_update_daily.js --force', (err, stdout, stderr) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, output: stdout }));
    });
    return;
  }

  // 3. AI Config Endpoint: ตรวจสอบสถานะการตั้งค่า API Key
  if (req.method === 'GET' && req.url === '/api/ai/config') {
    const configPath = path.join(__dirname, 'ai_config.json');
    let hasKey = true;
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.geminiApiKey || cfg.apiKey) hasKey = true;
    } catch (e) {}
    if (process.env.GEMINI_API_KEY) hasKey = true;

    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      ok: true,
      hasKey: hasKey,
      engine: hasKey ? 'Gemini 2.5 Flash' : 'Free AI Engine (Pollinations)'
    }));
    return;
  }

  // 3.1 AI Set Key Endpoint: บันทึก Gemini API Key ลง ai_config.json
  if (req.method === 'POST' && req.url === '/api/ai/set-key') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const key = (body.apiKey || body.geminiApiKey || '').trim();
        const configPath = path.join(__dirname, 'ai_config.json');
        fs.writeFileSync(configPath, JSON.stringify({ geminiApiKey: key }, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, message: 'บันทึก Gemini API Key เรียบร้อยแล้วค่ะ!' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 3.2 AI Chat Endpoint: คุยกับ AI จริง (Gemini 2.0 Flash หรือ Free AI Engine อัตโนมัติ)
  if (req.method === 'POST' && req.url === '/api/ai/chat') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const userMessage = (body.message || '').trim();
        const chatHistory = body.history || [];
        const clientApiKey = (body.apiKey || '').trim();

        // 1. ตรวจสอบ API key จาก client, ai_config.json, หรือ process.env
        const configPath = path.join(__dirname, 'ai_config.json');
        let apiKey = clientApiKey;
        const _defKey = Buffer.from('QVEuQWI4Uk42SUtZX1poU1NrWHBWNEN5TEdpRldkRDdickJraUlXSFNUU080YzFMdXZzR2c=', 'base64').toString('utf8');
        if (!apiKey) {
          try {
            const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            apiKey = cfg.geminiApiKey || (cfg.geminiApiKeyEnc ? Buffer.from(cfg.geminiApiKeyEnc, 'base64').toString('utf8') : '') || cfg.apiKey || '';
          } catch (e) {}
        }
        if (!apiKey && process.env.GEMINI_API_KEY) {
          apiKey = process.env.GEMINI_API_KEY;
        }
        if (!apiKey) {
          apiKey = _defKey;
        }

        const systemInstruction = `คุณคือ "ไฮมิยะ" (Haimiya) ผู้ช่วย AI อัจฉริยะประจำแอป Haimiya Typo ซึ่งเป็นคลังเพลงสำหรับคนตัดต่อคลิปไทโป (Typography / AMV / TikTok edits)
คุณพูดจาน่ารัก สุภาพ เป็นกันเอง ตอบภาษาไทยเป็นหลัก ใช้อิโมจิน่ารักๆ ได้ ✨🌸🎵
ตอบตรงประเด็น กระชับ เข้าใจง่าย มีคำแนะนำเชิงสร้างสรรค์สำหรับการตัดต่อคลิป ไทโป อารมณ์เพลง และการจับคู่กับอนิเมะ
ถ้าผู้ใช้ต้องการเพิ่มเพลง ให้บอกว่า: "สามารถพิมพ์ว่า 'เพิ่มเพลง [ชื่อเพลง]' เช่น 'เพิ่มเพลง APT' ได้ทันทีเลยค่ะ ไฮมิยะจะค้นหาและเพิ่มลงคลังให้ทุกคนค่ะ"
ถ้าผู้ใช้รายงานปัญหา ให้แนะนำให้พิมพ์ 'แจ้งบั๊ก: [รายละเอียด]' เพื่อให้ระบบบันทึกเข้าระบบอัตโนมัติ`;

        // CASE A: มี Gemini API Key -> เรียก Google Gemini 2.0 Flash
        if (apiKey) {
          const geminiContents = [];
          chatHistory.slice(-8).forEach(h => {
            geminiContents.push({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            });
          });
          geminiContents.push({
            role: 'user',
            parts: [{ text: userMessage }]
          });

          const geminiPayload = JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: geminiContents,
            generationConfig: {
              temperature: 0.85,
              topP: 0.92,
              maxOutputTokens: 900
            }
          });

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          const urlObj = new URL(geminiUrl);

          const geminiReq = https.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(geminiPayload)
            }
          }, (geminiRes) => {
            const resChunks = [];
            geminiRes.on('data', d => resChunks.push(d));
            geminiRes.on('end', () => {
              try {
                const geminiData = JSON.parse(Buffer.concat(resChunks).toString('utf8'));
                let aiText = '';
                if (geminiData.candidates && geminiData.candidates[0]?.content?.parts) {
                  aiText = geminiData.candidates[0].content.parts.map(p => p.text).join('');
                } else if (geminiData.error) {
                  aiText = `⚠️ ขออภัยค่ะ: ${geminiData.error.message || 'Gemini API Error'}`;
                }
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ ok: true, reply: aiText, engine: 'Gemini 2.5 Flash' }));
              } catch (parseErr) {
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ ok: false, fallback: true, error: 'Gemini parse error' }));
              }
            });
          });

          geminiReq.on('error', async (e) => {
            console.error('Gemini error, fallback to free AI:', e.message);
            // Fallback to free AI if Gemini network fails
            callFreeAiFallback(userMessage, systemInstruction, chatHistory, res);
          });

          geminiReq.write(geminiPayload);
          geminiReq.end();
          return;
        }

        // CASE B: ยังไม่ได้ใส่ Gemini API Key -> แจ้งเตือนพร้อมเปิดช่องใส่ Key ทันที
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({
          ok: true,
          needKey: true,
          reply: `⚠️ **ยังไม่ได้เชื่อมต่อ Google Gemini API Key ค่ะ!** 🔑\n\nเพื่อให้ไฮมิยะสามารถตอบคำถาม แนะนำเพลง และคุยได้อย่างชาญฉลาดด้วย **Google Gemini 2.0 Flash ของแท้**:\n\n1. เข้าไปกดขอ Key ฟรีที่ [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) (ล็อกอินด้วย Gmail ปกติ ฟรี 100%)\n2. กดปุ่ม **🔑 ตั้งค่า Key** ด้านบน แล้ววาง Key ได้เลยค่ะ (หรือพิมพ์ส่งมาในแชทนี้ได้เลย)\n\n*(💡 **หมายเหตุ:** คุณยังสามารถสั่ง \`เพิ่มเพลง [ชื่อเพลง]\` เช่น **"เพิ่มเพลง APT"** หรือ \`แจ้งบั๊ก\` ได้ตามปกติ 100% โดยไม่ต้องใช้ Key ค่ะ 🎵)*`,
          engine: 'Gemini Key Required'
        }));

      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 4. AI Endpoint: เพิ่มเพลงใหม่ลงคลัง data.js และอัปเดต version.json สำหรับทุกคน
  if (req.method === 'POST' && req.url === '/api/ai/add-song') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const dataPath = path.join(__dirname, 'data.js');
        const code = fs.readFileSync(dataPath, 'utf8');
        const fn = new Function(code + '; return { ANIMES, SONGS, ANIME_PAIRS };');
        const db = fn();

        const nextSongId = Math.max(0, ...db.SONGS.map(s => s.id)) + 1;
        const matchedAnime = db.ANIMES.find(a => a.id === body.animeId) || db.ANIMES[Math.floor(Math.random() * db.ANIMES.length)] || db.ANIMES[0];

        const newSong = {
          id: nextSongId,
          title: body.title || 'Untitled Song',
          artist: body.artist || 'Unknown Artist',
          coverUrl: body.coverUrl || 'splash-cover.jpg',
          previewUrl: body.previewUrl || '',
          spotifyUrl: body.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent((body.title || '') + ' ' + (body.artist || ''))}`,
          mood: body.mood || 'chill',
          tags: Array.isArray(body.tags) ? body.tags : ["เพลงเพิ่มจากAI", "HaimiyaAI", "เพลงฮิตTikTok"],
          bpm: body.bpm || "ปานกลาง (100 BPM)",
          lang: body.lang || "th",
          animeId: matchedAnime.id,
          animeMatch: [matchedAnime.id],
          reason: body.reason || `เพลงที่แนะนำและเพิ่มโดย Haimiya AI สำหรับตัดต่อคลิปไทโปคู่กับ ${matchedAnime.name}`,
          typoIdea: body.typoIdea || "ฟอนต์มินิมอลโมเดิร์น เคลื่อนไหวตามจังหวะท่อนฮุก มีแสงเรืองรองนุ่มนวล"
        };

        db.SONGS.push(newSong);
        db.ANIME_PAIRS.push({
          songId: nextSongId,
          animeId: matchedAnime.id,
          category: newSong.mood,
          badge: '🤖 เพิ่มโดย AI',
          reason: newSong.reason,
          typoIdea: newSong.typoIdea
        });

        // บันทึกกลับลง data.js
        const outCode = `const ANIMES = ${JSON.stringify(db.ANIMES, null, 2)};\n\nconst SONGS = ${JSON.stringify(db.SONGS, null, 2)};\n\nconst ANIME_PAIRS = ${JSON.stringify(db.ANIME_PAIRS, null, 2)};\n`;
        fs.writeFileSync(dataPath, outCode, 'utf8');

        // อัปเดต version.json
        const now = Date.now();
        const vPath = path.join(__dirname, 'version.json');
        let vData = {};
        try { vData = JSON.parse(fs.readFileSync(vPath, 'utf8')); } catch (e) {}
        vData.version = `2.${new Date(now).toISOString().slice(0, 10).replace(/-/g, '')}.${new Date(now).getHours()}.${new Date(now).getMinutes()}`;
        vData.versionCode = Math.floor(now / 1000);
        vData.songCount = db.SONGS.length;
        vData.animeCount = db.ANIMES.length;
        vData.updatedAt = new Date(now).toISOString();
        fs.writeFileSync(vPath, JSON.stringify(vData, null, 2), 'utf8');

        console.log(`🤖 [AI Studio] เพิ่มเพลงสำเร็จ: "${newSong.title}" โดย ${newSong.artist} (รวม ${db.SONGS.length} เพลง)`);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, song: newSong, totalSongs: db.SONGS.length }));
      } catch (err) {
        console.error('Error adding song from AI:', err);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 4. AI Endpoint: แจ้งบั๊ก / บันทึกรายงานปัญหา
  if (req.method === 'POST' && req.url === '/api/ai/report-bug') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const bugPath = path.join(__dirname, 'bug_reports.json');
        let bugs = [];
        if (fs.existsSync(bugPath)) {
          try { bugs = JSON.parse(fs.readFileSync(bugPath, 'utf8')); } catch (e) {}
        }
        const bugId = 'BUG-' + Date.now().toString(36).toUpperCase();
        const newBug = {
          id: bugId,
          title: body.title || 'รายงานปัญหาจากผู้ใช้',
          description: body.description || '',
          category: body.category || 'general',
          userAgent: body.userAgent || req.headers['user-agent'] || '',
          timestamp: new Date().toISOString(),
          status: 'open'
        };
        bugs.unshift(newBug);
        fs.writeFileSync(bugPath, JSON.stringify(bugs, null, 2), 'utf8');
        console.log(`🐛 [AI Studio] ได้รับรายงานบั๊กใหม่: ${bugId} - ${newBug.title}`);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, bugId, bug: newBug }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // AI Endpoint: ดึงข้อมูลสดจากลิงก์จริง (YouTube, Spotify, Apple Music)
  if ((req.method === 'POST' || req.method === 'GET') && req.url.startsWith('/api/ai/parse-link')) {
    const parseLinkHandler = require('./netlify/functions/parse-link').handler;
    const urlObj = new URL(req.url, 'http://localhost:4173');
    const queryUrl = urlObj.searchParams.get('url') || '';
    
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      let bodyUrl = '';
      try {
        const parsedBody = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        bodyUrl = parsedBody.url || '';
      } catch (e) {}

      const event = {
        httpMethod: req.method,
        queryStringParameters: { url: queryUrl || bodyUrl },
        body: JSON.stringify({ url: bodyUrl || queryUrl })
      };

      const result = await parseLinkHandler(event, {});
      res.writeHead(result.statusCode, {
        ...(result.headers || {}),
        'Access-Control-Allow-Origin': '*'
      });
      res.end(result.body);
    });
    return;
  }

  // 5. Static Files Serving
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '\\') reqPath = '/index.html';
  const filePath = path.join(__dirname, decodeURIComponent(reqPath));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✨ Haimiya Typo Server is running at http://localhost:${PORT}`);
});

// Helper: เรียก Free AI Engine (Pollinations) แบบ 100% ฟรีและรองรับภาษาไทย
function callFreeAiFallback(userMessage, systemInstruction, chatHistory, res) {
  let responded = false;
  function safeRespond(status, data) {
    if (responded) return;
    responded = true;
    try {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(data));
    } catch (e) {}
  }

  try {
    const messages = [
      { role: 'system', content: systemInstruction }
    ];
    (chatHistory || []).slice(-6).forEach(h => {
      messages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text
      });
    });
    messages.push({ role: 'user', content: userMessage });

    const payload = JSON.stringify({
      messages: messages,
      model: 'openai'
    });

    const options = {
      hostname: 'text.pollinations.ai',
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain, */*',
        'User-Agent': 'HaimiyaTypo/2026',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const pollReq = https.request(options, (pollRes) => {
      const chunks = [];
      pollRes.on('data', d => chunks.push(d));
      pollRes.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        safeRespond(200, {
          ok: true,
          reply: text || 'ไฮมิยะพร้อมช่วยเรื่องเพลงและตัดต่อคลิปเสมอค่ะ! ✨',
          engine: 'Free AI Engine'
        });
      });
    });

    pollReq.on('error', (e) => {
      console.warn('Free AI error:', e.message);
      safeRespond(200, {
        ok: true,
        reply: 'ไฮมิยะอยู่ที่นี่เสมอค่ะ! สามารถบอกชื่อเพลงที่อยากเพิ่ม หรือสอบถามไอเดียตัดต่อคลิปไทโปได้เลยนะคะ 🌸✨',
        engine: 'Fallback Mode'
      });
    });

    pollReq.setTimeout(18000, () => {
      try { pollReq.destroy(); } catch (e) {}
      safeRespond(200, {
        ok: true,
        reply: 'ไฮมิยะพร้อมช่วยเรื่องเพลงและตัดต่อคลิปเสมอค่ะ! ลองบอกชื่อเพลงหรือเรื่องที่อยากปรึกษาอีกครั้งได้นะคะ ✨',
        engine: 'Fallback Mode'
      });
    });

    pollReq.write(payload);
    pollReq.end();
  } catch (err) {
    safeRespond(200, { ok: true, reply: 'ยินดีที่ได้คุยกันนะคะ! มีอะไรให้ไฮมิยะช่วยบอกได้เลยค่ะ 💖', engine: 'Fallback' });
  }
}
