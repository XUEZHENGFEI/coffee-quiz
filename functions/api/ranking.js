// Cloudflare Pages Function: 返回全员匿名排行榜 JSON
// URL: GET /api/ranking
export async function onRequestGet({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { results } = await env.COFFEE_QUIZ_DB.prepare(
      `SELECT sig, total, right, pct, duration, cats, ts
       FROM submissions
       ORDER BY pct DESC, duration ASC, ts DESC
       LIMIT 500`
    ).all();

    const overall = await env.COFFEE_QUIZ_DB.prepare(
      `SELECT COUNT(*) AS total_submissions,
              COUNT(DISTINCT sig) AS total_signers
       FROM submissions`
    ).first();

    return jsonResp({
      ok: true,
      overall: overall || { total_submissions: 0, total_signers: 0 },
      items: results || [],
      updated_at: Date.now(),
    }, 200, CORS);
  } catch (e) {
    return jsonResp({ ok: false, error: String(e.message || e) }, 500, CORS);
  }
}

export async function onRequestOptions() {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  return new Response(null, { headers: CORS });
}

function jsonResp(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}