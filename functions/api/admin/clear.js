// Cloudflare Pages Function: 管理员清空排行榜
// 需密码校验（与前端一致：Peets123），删除所有记录
// URL: POST /api/admin/clear
export async function onRequestPost({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  try {
    const data = await request.json().catch(() => ({}));
    const pwd = String(data.pwd || '');
    if (pwd !== 'Peets123') {
      return jsonResp({ ok: false, error: '密码错误' }, 403, CORS);
    }

    // 可选：按 sig 删单条
    const sig = String(data.sig || '').slice(0, 40).trim();
    let result;
    if (sig) {
      result = await env.COFFEE_QUIZ_DB.prepare(
        `DELETE FROM submissions WHERE sig = ?`
      ).bind(sig).run();
    } else {
      // 清空全部
      result = await env.COFFEE_QUIZ_DB.prepare(
        `DELETE FROM submissions`
      ).run();
    }

    return jsonResp({
      ok: true,
      deleted: result.meta?.changes ?? 0,
      target: sig || 'all',
    }, 200, CORS);
  } catch (e) {
    return jsonResp({ ok: false, error: String(e.message || e) }, 500, CORS);
  }
}

export async function onRequestOptions() {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
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