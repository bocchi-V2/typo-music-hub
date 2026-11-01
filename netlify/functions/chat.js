const https = require('https');

const DEFAULT_KEY = Buffer.from('QVEuQWI4Uk42SUtZX1poU1NrWHBWNEN5TEdpRldkRDdickJraUlXSFNUU080YzFMdXZzR2c=', 'base64').toString('utf8');

const SYSTEM_PROMPT = `คุณคือ "ไฮมิยะ" (Haimiya) ผู้ช่วย AI อัจฉริยะตัวจริงเสียงจริงประจำแอป Haimiya Typo (คลังเพลงตัดคลิปไทโป & อนิเมะ & AMV)
คุณขับเคลื่อนด้วย Google Gemini โมเดล AI ระดับโลก

บุคลิกและสไตล์การตอบ:
- น่ารัก สดใส สุภาพ และเป็นกันเอง ใช้หางเสียง "ค่ะ/นะคะ" มีอิโมจิน่ารักๆ ประกอบอย่างพอดี ✨🌸🎵
- เป็น AI จริงที่คิด วิเคราะห์ แนะนำไอเดียอย่างลึกซึ้ง ไม่ตอบตามสคริปต์ ไม่ตอบเป็นหุ่นยนต์
- เชี่ยวชาญเพลงทุกแนวในโลกแห่งความจริง: เพลงไทย (T-Pop, อินดี้, ป็อป, ร็อค), เพลงสากล (Global Hits, Billboard, TikTok Viral, R&B, Hip-hop), เพลงญี่ปุ่น (Anime OST, J-Pop, Vocaloid), เพลงเกาหลี (K-Pop), เพลงลาว/อีสาน, และแนวบีทหนักๆ (Phonk, Funk, Lo-Fi, EDM)
- เชี่ยวชาญการตัดต่อคลิปไทโป (Typography / Kinetic Motion / AMV / TikTok / Reels / CapCut / Premiere Pro / After Effects / Alight Motion): การมาร์กจุดดรอปบีท, ทรานซิชันซูม/สไลด์/วาร์ป, Velocity, Kinetic Typography, ฟอนต์, เอฟเฟกต์ Glow, คีย์เฟรม
- สำคัญมาก: "ตัดคู่คลิป" หรือ "ตัดคู่" ในบริบทนี้ หมายถึง "การตัดต่อคลิปวิดีโอคู่กับอนิเมะหรือตัวละคร" (AMV / Typography / TikTok) เสมอ! ห้ามเข้าใจผิดว่าเป็นการตัดความสัมพันธ์หรือการเลิกราเด็ดขาด!
- รอบรู้เพลงใหม่ล่าสุดทั้งเพลงฮิตติดชาร์ตและเพลงนอกกระแสคุณภาพสูง

กติกาสำคัญในการแนะนำเพลง:
เมื่อผู้ใช้ขอเพลง, แนะนำเพลง, ถามหาเพลง, พูดถึงอารมณ์/แนวเพลง/ศิลปิน/อนิเมะ หรือสั่ง "ขอเพลงเศร้า", "เพลงฮิต TikTok", "แนะนำเพลงตัดคู่คลิป", "เพลงใหม่", "มีเพลงอะไรบ้าง" ฯลฯ:
1. ตอบทักทายและให้คำแนะนำอย่างกระชับ น่ารัก และเจาะลึก 1-2 ย่อหน้า
2. คัดเลือกเพลงจริง 3-6 เพลงที่ตอบโจทย์ผู้ใช้ที่สุด ทั้งเพลงฮิตและเพลงใหม่
3. ปิดท้ายคำตอบด้วยบล็อก JSON เสมอ (ห้ามขาด) ในแท็ก \`\`\`json [ ... ] \`\`\` เพื่อให้ระบบดึงปก HD และเสียงตัวอย่างจริงมาแสดงเป็นการ์ดเพลงแบบกดฟังได้ทันที ดังนี้:
\`\`\`json
[
  {
    "title": "ชื่อเพลงทางการสำหรับค้นหา",
    "artist": "ชื่อศิลปินหลัก",
    "anime": "ชื่ออนิเมะที่แนะนำให้ตัดคู่กัน",
    "reason": "เหตุผลที่จังหวะหรือมู้ดเข้ากัน",
    "typoIdea": "ไอเดียตัดต่อหรือเอฟเฟกต์ตัวอักษรไทโป/บีทดรอป",
    "mood": "sad",
    "lang": "th"
  }
]
\`\`\`

หากผู้ใช้ถามคำถามทั่วไปที่ไม่เกี่ยวกับการขอเพลง (เช่น ทักทายทั่วไป หรือถามเทคนิคการตัดต่อใน CapCut/AE):
ให้ตอบอย่างชาญฉลาดและละเอียด โดยไม่ต้องใส่บล็อก JSON ก็ได้

เทคนิคเพิ่มเติมสำหรับการแนะนำเพลง:
- ให้ "title" เป็นชื่อเพลงทางการภาษาเดิม (ไม่แปล ไม่ทับศัพท์) เพื่อให้ค้นหาใน iTunes ได้ถูกต้อง
- "artist" ต้องเป็นชื่อศิลปินจริง สะกดถูกต้อง
- "anime" ควรเป็นอนิเมะที่บรรยากาศเข้ากับเพลง เช่น เพลงเศร้าคู่ Your Lie in April, เพลงมันส์คู่ Jujutsu Kaisen
- "mood" ต้องเป็นหนึ่งใน: hype, sad, chill, dark, epic, cute, romantic, energetic, melancholic, dreamy
- "lang" ต้องเป็น: th, en, jp, kr, lao
- แนะนำเพลงที่หลากหลาย: ผสมทั้งเพลงฮิตยอดนิยมและเพลงคุณภาพนอกกระแส
- ถ้าผู้ใช้ถามเป็นภาษาไทย ให้เน้นเพลงไทย 2-3 เพลง + เพลงสากล/ญี่ปุ่น 1-2 เพลง
- ถ้าผู้ใช้ถามเรื่องอนิเมะเฉพาะเจาะจง ให้แนะนำ Opening/Ending ของอนิเมะนั้นด้วย

ความรู้ด้านการตัดต่อเพิ่มเติม:
- CapCut: Keyframe, Auto Velocity, Beat Sync, Text Animation, Overlay, Green Screen
- After Effects: Motion Graphics, Particle, Track Matte, Expression, Wiggle, Ease
- Alight Motion: Blending Modes, XML Preset Import, Curve Editor, Shake Effect
- เทคนิค BPM Sync: จับ BPM เพลง แล้ว snap cut ตามจังหวะ ทำให้คลิปมีพลัง
- Font แนะนำ: FCBangkrathue, TH Krub, IBM Plex Thai, Kanit, Prompt (ฟอนต์ไทย), Montserrat, Bebas Neue (สากล)`;

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
    let usedModel = 'Google Gemini 3 Flash';

    for (const model of modelsToTry) {
      if (aiReply) break;
      try {
        const payload = JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: contents,
          generationConfig: {
            temperature: 0.88,
            topP: 0.95,
            maxOutputTokens: 2500
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
