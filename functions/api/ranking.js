// Cloudflare Pages Function: 返回全员匿名排行榜
// URL: GET /api/ranking（JSON）
//       GET /api/board  （HTML 仪表板）
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 仪表板 HTML
  if (url.pathname === '/ranking/board' || url.pathname === '/ranking/board/') {
    return new Response(BOARD_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS },
    });
  }

  // JSON 排行榜
  try {
    const { results } = await env.COFFEE_QUIZ_DB.prepare(
      `SELECT sig,
              COUNT(*) AS rounds,
              SUM(right) AS sum_right,
              SUM(total) AS sum_total,
              ROUND(AVG(pct)) AS avg_pct,
              MIN(pct) AS min_pct,
              MAX(pct) AS max_pct,
              MAX(ts) AS last_ts
       FROM submissions
       GROUP BY sig
       ORDER BY avg_pct DESC, rounds DESC, sum_right DESC
       LIMIT 100`
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

const BOARD_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>全员答题排行榜 · 咖啡自测</title>
<style>
  :root{
    --bg:#1a0f08; --panel:#3a2517; --panel2:#4a2f1d; --cream:#f3e6d4; --cream-dim:#d8c3a6;
    --gold:#c89a63; --gold-deep:#a97a42; --green:#7fb069; --red:#e06b5b; --line:#5a3c26;
  }
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{
    font-family:"Microsoft YaHei","PingFang SC","Helvetica Neue",Arial,sans-serif;
    background:
      radial-gradient(1200px 600px at 80% -10%, rgba(200,154,99,.18), transparent 60%),
      radial-gradient(900px 500px at -10% 110%, rgba(127,176,105,.10), transparent 60%),
      var(--bg);
    color:var(--cream);min-height:100vh;padding:0 0 40px;
  }
  .wrap{max-width:900px;margin:0 auto;padding:20px 16px}
  header{text-align:center;padding:18px 0 24px}
  .kicker{color:var(--gold);font-size:12px;letter-spacing:3px;font-weight:600}
  h1{font-size:26px;font-weight:800;margin:6px 0 2px;letter-spacing:1px}
  .sub{color:var(--cream-dim);font-size:13px}
  .updated{font-size:11px;color:var(--cream-dim);margin-top:8px;opacity:.7}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
  .stat{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;text-align:center}
  .stat .v{display:block;color:var(--gold);font-weight:800;font-size:22px}
  .stat .l{display:block;color:var(--cream-dim);font-size:11px;margin-top:4px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
  table{width:100%;border-collapse:collapse}
  th,td{padding:10px 8px;text-align:left;border-bottom:1px solid var(--line);font-size:14px}
  th{color:var(--cream-dim);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px}
  .rank{width:54px;font-weight:800;font-size:18px;color:var(--gold)}
  .rank-badge{display:inline-block;width:30px;height:30px;border-radius:50%;line-height:30px;text-align:center;font-weight:800;font-size:13px;background:var(--line);color:var(--cream-dim)}
  .rank-badge.gold{background:linear-gradient(135deg,#d9b070,#a97a42);color:#241408}
  .rank-badge.silver{background:linear-gradient(135deg,#c8c8c8,#8a8a8a);color:#241408}
  .rank-badge.bronze{background:linear-gradient(135deg,#cd9a6e,#8a5a30);color:#241408}
  .sig{font-weight:700;color:var(--cream)}
  .pct{font-weight:800;color:var(--gold);font-size:16px}
  .right-meta{font-size:11px;color:var(--cream-dim);line-height:1.6}
  .pct-bar{flex:none;width:80px;height:8px;background:var(--line);border-radius:4px;overflow:hidden}
  .pct-bar .f{height:100%;background:linear-gradient(90deg,#7fb069,#c89a63)}
  .empty{text-align:center;color:var(--cream-dim);padding:30px;font-size:14px}
  .toolbar{display:flex;gap:8px;margin-bottom:14px;align-items:center}
  .toolbar input{flex:1;background:var(--panel2);border:1px solid var(--line);color:var(--cream);font-family:inherit;font-size:13px;padding:8px 12px;border-radius:10px;outline:none}
  .toolbar input:focus{border-color:var(--gold)}
  .btn{background:transparent;border:1px solid var(--gold);color:var(--gold);font-size:13px;padding:8px 14px;border-radius:10px;cursor:pointer;font-family:inherit}
  .btn:hover{background:rgba(200,154,99,.12)}
  footer{text-align:center;color:#8a6c4f;font-size:11px;margin-top:20px;line-height:1.8}
  footer a{color:var(--gold);text-decoration:none}
  @media (max-width:600px){.grid{grid-template-columns:repeat(2,1fr)}.rank-badge{width:26px;height:26px;line-height:26px;font-size:12px}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="kicker">COFFEE QUIZ · 全员排行榜</div>
    <h1>📊 全员匿名答题榜</h1>
    <div class="sub">所有开启匿名贡献的同事数据汇总（仅签名/分数/用时，无隐私信息）</div>
    <div class="updated" id="updated">加载中...</div>
  </header>

  <div class="grid">
    <div class="stat"><span class="v" id="sSubmits">0</span><span class="l">总提交数</span></div>
    <div class="stat"><span class="v" id="sSigners">0</span><span class="l">签名人数</span></div>
    <div class="stat"><span class="v" id="sAvg">—</span><span class="l">整体平均%</span></div>
    <div class="stat"><span class="v" id="sTop">—</span><span class="l">最高分</span></div>
  </div>

  <div class="card">
    <div class="toolbar">
      <input id="search" placeholder="🔍 按签名筛选（陶渊 / 培训部）">
      <button class="btn" id="refreshBtn">刷新</button>
    </div>
    <table>
      <thead><tr><th class="rank">排名</th><th>签名</th><th>轮次</th><th>答对/总题</th><th>平均%</th><th>区间</th><th>最近</th></tr></thead>
      <tbody id="tbody"></tbody>
    </table>
    <div class="empty" id="empty" style="display:none">暂无数据 — 邀请同事开启"匿名贡献到全员榜"开关</div>
  </div>

  <footer>
    数据来源 <a href="/api/ranking" target="_blank">/api/ranking</a> · 实时同步<br>
    网址 <a href="https://coffee-quiz-djc.pages.dev" target="_blank">coffee-quiz-djc.pages.dev</a>
  </footer>
</div>

<script>
var DATA_URL = '/ranking';
var data = null;

function fmtDate(ts){if(!ts||ts<1e11)return'\u2014';var d=new Date(ts),p=function(n){return n<10?('0'+n):n;};return(d.getMonth()+1)+'-'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes());}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}

async function load(){
  document.getElementById('updated').textContent = '加载中...';
  try{
    var r = await fetch(DATA_URL, {cache:'no-store'});
    var j = await r.json();
    if(!j.ok) throw new Error(j.error||'fetch failed');
    data = j;
    render();
    var d = new Date(j.updated_at);
    var p = function(n){return n<10?('0'+n):n;};
    document.getElementById('updated').textContent = '最后更新 '+(d.getMonth()+1)+'-'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
  }catch(e){
    document.getElementById('updated').textContent = '加载失败：'+e.message;
  }
}

function render(){
  var q = (document.getElementById('search').value||'').toLowerCase().trim();
  var items = (data.items||[]).filter(function(r){return !q || String(r.sig).toLowerCase().indexOf(q)>=0;});
  // 头部统计
  document.getElementById('sSubmits').textContent = data.overall.total_submissions||0;
  document.getElementById('sSigners').textContent = data.overall.total_signers||0;
  var totalRight = 0, totalTotal = 0;
  (data.items||[]).forEach(function(r){totalRight+=r.sum_right; totalTotal+=r.sum_total;});
  document.getElementById('sAvg').textContent = totalTotal ? Math.round(totalRight/totalTotal*100)+'%' : '\u2014';
  document.getElementById('sTop').textContent = (data.items||[]).length ? (data.items[0].avg_pct+'%') : '\u2014';

  var tb = document.getElementById('tbody');
  if(!items.length){
    tb.innerHTML='';
    document.getElementById('empty').style.display='block';
    return;
  }
  document.getElementById('empty').style.display='none';
  var html = '';
  items.forEach(function(r,i){
    var bc='';
    if(i===0) bc='gold';
    else if(i===1) bc='silver';
    else if(i===2) bc='bronze';
    html += '<tr>'
      + '<td class="rank"><span class="rank-badge '+bc+'">'+(i+1)+'</span></td>'
      + '<td class="sig">'+esc(r.sig)+'</td>'
      + '<td>'+r.rounds+'</td>'
      + '<td>'+r.sum_right+'/'+r.sum_total+'</td>'
      + '<td><div style="display:flex;align-items:center;gap:8px"><div class="pct">'+r.avg_pct+'%</div><div class="pct-bar"><div class="f" style="width:'+r.avg_pct+'%"></div></div></div></td>'
      + '<td class="right-meta">最低 '+r.min_pct+'%<br>最高 '+r.max_pct+'%</td>'
      + '<td class="right-meta">'+fmtDate(r.last_ts)+'</td>'
      + '</tr>';
  });
  tb.innerHTML = html;
}

document.getElementById('refreshBtn').onclick = load;
document.getElementById('search').oninput = render;
load();
setInterval(load, 30000); // 每 30 秒自动刷新
</script>
</body>
</html>`;