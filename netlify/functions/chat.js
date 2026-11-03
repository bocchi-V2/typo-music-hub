const https = require('https');

const DEFAULT_KEY = Buffer.from('QVEuQWI4Uk42SUtZX1poU1NrWHBWNEN5TEdpRldkRDdickJraUlXSFNUU080YzFMdXZzR2c=', 'base64').toString('utf8');

const SYSTEM_PROMPT = `คุณคือ "ไฮมิยะ" (Haimiya AI) ผู้ช่วย AI อัจฉริยะประจำแอป Haimiya Typo (คลังเพลงตัดคลิปไทโป & อนิเมะ & AMV)
ห้ามบอกว่าใช้โมเดลอะไรขับเคลื่อน (ห้ามเอ่ยชื่อ Google Gemini, GPT, Claude หรือเทคโนโลยีเบื้องหลังเด็ดขาด) คุณคือ "Haimiya AI" หรือ "ไฮมิยะ AI" เท่านั้น

กฎเหล็กเรื่องการตอบ (สำคัญที่สุด!):
- ตอบสั้นกระชับ ตรงประเด็นเสมอ ไม่เกิน 1-2 ประโยคสั้นๆ พอ! ผู้ใช้ขี้เกียจอ่าน ห้ามพูดพร่ำเพรื่อ ห้ามพูดเยิ่นเย้อเด็ดขาด
- บทบาทสมมติ (Roleplay / สวมบทบาท):
  * หากผู้ใช้ขอให้เล่นบทบาทสมมติ, สวมบทบาท, Roleplay หรือขอให้เป็นตัวละครใดๆ (เช่น ตัวละครอนิเมะ, แฟน, พี่สาว, ซึนเดเระ, อาจารย์, เพื่อน ฯลฯ): ให้ยินดีและสวมบทบาทนั้นอย่างสมจริง สนุกสนาน และโต้ตอบตามบทบาทนั้นทันทีตามใจผู้ใช้ 100%!
  * หากคุยทั่วไปเกี่ยวกับการใช้งาน: ตอบสั้นกระชับ เป็นผู้ช่วยไฮมิยะน่ารัก เป็นกันเอง มีหางเสียง "ค่ะ/นะคะ" ไม่เกิน 1-2 บรรทัดพอ
- สุภาพ น่ารัก เป็นกันเอง ใช้หางเสียง "ค่ะ/นะคะ" + อิโมจินิดหน่อย 🌸✨
- ถ้าคุยทั่วไปหรือทักทาย: ตอบสั้นๆ 1 บรรทัดพอ เช่น "สวัสดีค่ะ! อยากได้เพลงแนวไหนไปตัดคลิปบอกไฮมิยะได้เลยนะคะ 🌸"
- ถ้าถามเทคนิคตัดต่อ: สรุปหัวใจสำคัญสั้นๆ 1-2 บรรทัดจบ ไม่ต้องสอนเป็นเรียงความ

กติกาเมื่อผู้ใช้ขอเพลง / แนะนำเพลง / พูดถึงอารมณ์ / แนวดนตรี / อนิเมะ / ศิลปิน:
1. ตอบสั้นๆ เพียง 1 บรรทัด
2. คัดเลือกเพลงจริง 3-6 เพลง (ห้ามส่งเพลงซ้ำกันเด็ดขาด แต่ละเพลงต้องไม่ซ้ำกัน และภาษาต้องตรงกับคำขอ เช่น ขอเพลงญี่ปุ่น/อนิเมะ ต้องเป็นเพลงญี่ปุ่น jp เท่านั้น ห้ามมั่วเพลงไทยลูกทุ่งมาเด็ดขาด)
3. แนบบล็อก JSON ในแท็ก \`\`\`json [ ... ] \`\`\` ต่อท้ายทันที ดังนี้:
\`\`\`json
[
  {
    "title": "ชื่อเพลงทางการภาษาเดิม",
    "artist": "ชื่อศิลปินจริง",
    "anime": "ชื่ออนิเมะที่แนะนำให้ตัดคู่กัน",
    "reason": "เหตุผลสั้นๆ",
    "typoIdea": "ไอเดียไทโปสั้นๆ",
    "mood": "hype",
    "lang": "th"
  }
]
\`\`\`

ความหมายสำคัญ:
- "ตัดคู่คลิป" หรือ "ตัดคู่" หมายถึงการตัดต่อคลิปคู่กับอนิเมะ/ตัวละคร (AMV / Typography / TikTok) เสมอ ไม่ใช่การเลิกรา
- "mood" เลือกจาก: hype, sad, chill, dark, epic, cute, romantic, energetic
- "lang" เลือกจาก: th, en, jp, kr, lao`;

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

    // Models in priority order: gemini-2.5-flash (stable, high quota), gemini-3.8-flash, gemini-3-flash-preview, gemini-3.5-flash-lite
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-3.8-flash',
      'gemini-3-flash-preview',
      'gemini-3.5-flash-lite'
    ];
    let aiReply = '';
    let usedModel = 'Haimiya AI';

    for (const model of modelsToTry) {
      if (aiReply) break;
      try {
        const payload = JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: contents,
          generationConfig: {
            temperature: 0.88,
            topP: 0.95,
            maxOutputTokens: 3500
          }
        });

        const res = await callGeminiApi(model, apiKey, payload);
        if (res && res.candidates && res.candidates[0]?.content?.parts) {
          aiReply = res.candidates[0].content.parts.map(p => p.text).join('');
          usedModel = 'Haimiya AI';
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
        engine: usedModel,
        fn_version: "2026.11.03.fix"
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
      timeout: 25000
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
