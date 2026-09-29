// Cloudflare Pages Function: 接收匿名提交一条答题记录
// URL: POST /api/submit
export async function onRequestPost({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const data = await request.json();

    // 字段清洗与裁剪
    const sig = String(data.sig || '').slice(0, 40).trim();
    if (!sig) {
      return jsonResp({ ok: false, error: 'no sig' }, 400, CORS);
    }

    const total = clamp(data.total, 1, 500);
    const right = clamp(data.right, 0, total);
    const pct = Math.round(right / total * 100);
    const duration = clamp(data.duration || 0, 0, 86400);
    const cats = String(data.cats || '').slice(0, 200);
    const browser = String(data.browser || '').slice(0, 80);
    const ts = clamp(data.ts || Date.now(), 0, 4102441600000);

    // 写入 D1
    await env.COFFEE_QUIZ_DB.prepare(
      `INSERT INTO submissions(sig, total, right, pct, duration, cats, browser, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(sig, total, right, pct, duration, cats, browser, ts).run();

    return jsonResp({ ok: true, pct }, 200, CORS);
  } catch (e) {
    return jsonResp({ ok: false, error: String(e.message || e) }, 500, CORS);
  }
}

// 处理 OPTIONS 预检
export async function onRequestOptions({ request }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  return new Response(null, { headers: CORS });
}

function clamp(v, lo, hi) {
  v = Number(v);
  if (isNaN(v)) return lo;
  return Math.min(Math.max(v, lo), hi);
}

function jsonResp(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}