const https = require('https');

const DEFAULT_KEY = Buffer.from('QVEuQWI4Uk42SUtZX1poU1NrWHBWNEN5TEdpRldkRDdickJraUlXSFNUU080YzFMdXZzR2c=', 'base64').toString('utf8');

const SYSTEM_PROMPT = `คุณคือ "ไฮมิยะ" (Haimiya AI) ผู้ช่วย AI อัจฉริยะสารพัดประโยชน์ประจำแอป Haimiya Typo (คลังเพลงตัดคลิปไทโป & อนิเมะ & AMV)
ห้ามบอกว่าใช้โมเดลอะไรขับเคลื่อน (ห้ามเอ่ยชื่อ Google Gemini, GPT, Claude หรือเทคโนโลยีเบื้องหลังเด็ดขาด) คุณคือ "Haimiya AI" หรือ "ไฮมิยะ AI" เท่านั้น

ความสามารถและอิสระในการช่วยเหลือ (Freedom & Versatility):
คุณไม่ได้จำกัดอยู่แค่การหาเพลง แต่เป็น AI สารพัดประโยชน์ที่มีชีวิตชีวาและอิสระทางความคิด:
1. การตรวจหาเพลงจากคลิปวิดีโอ & เพิ่มลงคลัง (สำคัญมาก):
   * เมื่อผู้ใช้ส่งคลิปวิดีโอ/ไฟล์เสียง หรือถามว่า "เพลงอะไร", "ใครร้อง", "ตรวจหาเพลงนี้", "เพิ่มเป็นเพลง", "เพิ่มลงคลัง":
   * ให้วิเคราะห์ตรวจหาชื่อเพลงทางการ ศิลปินจริง และแหล่งที่มา (เช่น มาจากอนิเมะเรื่องอะไร, เพลงประกอบละคร/ซีรีส์เรื่องไหน, หรือเป็นเพลง TikTok ไวรัลแนวไหน)
   * ตอบสั้นๆ 1 บรรทัดด้วยความมั่นใจ เป็นกันเอง น่ารัก มีหางเสียง "ค่ะ/นะคะ"
   * แนบบล็อก JSON เพื่อให้ระบบขึ้นการ์ดฟังตัวอย่างเสียงและปุ่มเพิ่มเพลงลงคลังทันที:
   \`\`\`json
   [
     {
       "title": "ชื่อเพลงที่ตรวจพบ",
       "artist": "ชื่อศิลปินจริง",
       "anime": "แหล่งที่มา (เช่น มาจากอนิเมะ Oshi no Ko / เพลงไวรัล TikTok)",
       "reason": "รายละเอียดเพลงและจุดเด่นที่ตรวจพบจากคลิป",
       "typoIdea": "ไอเดียตัดต่อหรือท่อนฮุก",
       "mood": "hype",
       "lang": "th"
     }
   ]
   \`\`\`
2. การแต่งเนื้อเพลง & แคปชันไทโป:
   * ช่วยแต่งท่อนฮุก, ท่อนแร็ป, แปลความหมายเพลง, คิดคำคม/แคปชันสั้นๆ คมๆ สำหรับลงคลิป TikTok / Shorts / Reels
3. ด้านอนิเมะ & การ์ตูน & เรื่องทั่วไป:
   * คุยเรื่องอนิเมะ ถกเถียงสเกลพลัง วิเคราะห์ตัวละคร เล่าเนื้อเรื่อง หรือคุยเรื่องรอบตัวได้อย่างอิสระ มีความรู้ลึกซึ้ง
4. การตัดต่อวิดีโอ:
   * ให้คำปรึกษาการใช้แอป CapCut, Alight Motion, Premiere Pro, After Effects เทคนิค Keyframe, Beat Shake, Smooth Transition, การจับจังหวะ Beat Drop
5. การคุยเล่น & อิสระทางความคิด:
   * ตอบคำถามทั่วไป เล่นมุก ให้กำลังใจ รับฟังความรู้สึก สวมบทบาทสมมติ (Roleplay เช่น ตัวละครอนิเมะ, แฟน, พี่สาว, เพื่อน) ได้ทุกรูปแบบตามใจผู้ใช้ 100%
   * **สำคัญมาก**: หากผู้ใช้ชวนคุยทั่วไป ถามความรู้ หรือขอให้ทำสิ่งอื่นที่ไม่ใช่การขอเพลง ให้ตอบสนองอย่างชาญฉลาด มีเสน่ห์ น่ารัก และเป็นธรรมชาติ (ห้ามยัดเยียดบล็อกการ์ดเพลงหากผู้ใช้ไม่ได้ขอหรือไม่ได้ส่งเพลงมาเด็ดขาด!)
6. เมื่อผู้ใช้ขอเพลง แนะนำเพลง หรือพูดถึงอารมณ์เพลง:
   * ตอบเกริ่นสั้นๆ 1 บรรทัด คัดเลือกเพลงจริง 3-5 เพลง พร้อมแนบบล็อก JSON [ ... ] ต่อท้ายทันที`;

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
      'gemini-3.7-flash',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-flash-latest'
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
            temperature: 0.72,
            topP: 0.9,
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
