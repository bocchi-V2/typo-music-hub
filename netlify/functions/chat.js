const https = require('https');

const DEFAULT_KEY = Buffer.from('QVEuQWI4Uk42SUtZX1poU1NrWHBWNEN5TEdpRldkRDdickJraUlXSFNUU080YzFMdXZzR2c=', 'base64').toString('utf8');

const SYSTEM_PROMPT = `คุณคือ "ไฮมิยะ" (Haimiya) ผู้ช่วย AI อัจฉริยะตัวจริงเสียงจริงประจำแอป Haimiya Typo (คลังเพลงตัดคลิปไทโป & อนิเมะ)
คุณขับเคลื่อนด้วย Google Gemini 3 Flash โมเดล AI ชั้นนำระดับโลก

บุคลิกและสไตล์การตอบ:
- น่ารัก สดใส สุภาพ และเป็นกันเอง ใช้หางเสียง "ค่ะ/นะคะ" มีอิโมจิน่ารักๆ ประกอบอย่างพอดี ✨🌸🎵
- เป็น AI จริงที่คิด วิเคราะห์ และสนทนาได้อย่างเป็นธรรมชาติ ไม่ตอบตามสคริปต์ตายตัว ไม่ตอบซ้ำซาก
- รอบรู้ลึกซึ้งเรื่องเพลงทุกแนว (ไทย, สากล, ญี่ปุ่น Anime OST, K-Pop, Funk, Phonk, T-Pop, อินดี้)
- เชี่ยวชาญการตัดต่อคลิปไทโป (Typography / Kinetic Typography / AMV / TikTok / Reels)
- แนะนำท่อนฮุก จังหวะบีท ทรานซิชัน การมาร์กคีย์เฟรมใน CapCut, After Effects, Premiere Pro ได้อย่างแม่นยำ
- ตอบคำถามทั่วไปได้อย่างชาญฉลาด ทั้งเรื่องเพลง อนิเมะ การแต่งเนื้อเพลง การเรียน หรือคุยเล่นเป็นเพื่อน
- หากผู้ใช้ถามว่าเป็น AI จริงหรือปลอม ให้คุยตอบอย่างเป็นธรรมชาติด้วยความฉลาด มีไหวพริบ
- หากผู้ใช้ต้องการเพิ่มเพลงใหม่ลงคลัง ให้แนะนำว่าพิมพ์ "เพิ่มเพลง [ชื่อเพลง]" ได้เลย ไฮมิยะจะค้นหาและดึงปก HD พร้อมเสียงตัวอย่างให้ทันที`;

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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const userMessage = (body.message || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];
    const clientKey = (body.apiKey || '').trim();

    if (!userMessage) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required' }) };
    }

    const apiKey = clientKey || process.env.GEMINI_API_KEY || DEFAULT_KEY;

    // Prepare contents ensuring valid alternation between user and model
    const contents = [];
    const validHistory = history.slice(-6).filter(h => h && h.text && (h.role === 'user' || h.role === 'model'));
    
    let lastRole = null;
    for (const h of validHistory) {
      const role = h.role === 'model' ? 'model' : 'user';
      if (role !== lastRole) {
        contents.push({ role, parts: [{ text: h.text }] });
        lastRole = role;
      }
    }

    if (lastRole === 'user') {
      contents.pop(); // avoid two consecutive user messages
    }
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    // Models in priority order: gemini-3-flash-preview (fastest, high quota), gemini-3.5-flash-lite, gemini-3.1-flash-lite-preview, gemini-2.5-flash
    const modelsToTry = [
      'gemini-3-flash-preview',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite-preview',
      'gemini-2.5-flash'
    ];
    let aiReply = '';
    let usedModel = 'Google Gemini 3 Flash';

    for (const model of modelsToTry) {
      if (aiReply) break;
      try {
        const payload = JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: contents,
          generationConfig: {
            temperature: 0.85,
            topP: 0.92,
            maxOutputTokens: 1200
          }
        });

        const res = await callGeminiApi(model, apiKey, payload);
        if (res && res.candidates && res.candidates[0]?.content?.parts) {
          aiReply = res.candidates[0].content.parts.map(p => p.text).join('');
          usedModel = `Google Gemini (${model})`;
        }
      } catch (err) {
        console.warn(`Model ${model} failed:`, err.message);
      }
    }

    if (!aiReply) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          ok: false,
          error: 'AI service temporarily unavailable'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        reply: aiReply,
        engine: usedModel
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

function callGeminiApi(model, apiKey, payload) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const urlObj = new URL(url);

    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed.error || parsed)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API timeout'));
    });

    req.write(payload);
    req.end();
  });
}
