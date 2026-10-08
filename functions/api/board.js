// Cloudflare Pages Function: 返回全员匿名排行榜仪表板 HTML
// URL: GET /api/board
export async function onRequestGet({ request, env }) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 仪表板 HTML + 内嵌 data fetch（页面端 fetch /api/ranking）
  const html = `<!DOCTYPE html>
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
  .btn-danger{border-color:var(--red);color:var(--red)}
  .btn-danger:hover{background:rgba(224,107,91,.12)}
  .btn-ghost-sm{background:transparent;border:1px solid var(--line);color:var(--cream-dim);font-size:11px;padding:4px 10px;border-radius:8px;cursor:pointer;font-family:inherit}
  .btn-ghost-sm:hover{border-color:var(--red);color:var(--red)}
  /* 密码弹窗 */
  .pwd-mask{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:18px}
  .pwd-box{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;max-width:340px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.4)}
  .pwd-title{font-size:14px;font-weight:600;color:var(--cream);margin-bottom:10px;line-height:1.6;white-space:pre-line}
  .pwd-input{width:100%;background:var(--panel2);border:1px solid var(--line);color:var(--cream);font-family:inherit;font-size:14px;padding:10px 12px;border-radius:8px;outline:none;box-sizing:border-box;margin-bottom:8px}
  .pwd-input:focus{border-color:var(--gold)}
  .pwd-err{font-size:12px;color:var(--red);min-height:16px;margin-bottom:4px}
  .pwd-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
  .pwd-actions .btn-ghost-sm{padding:8px 18px;font-size:13px}
  /* 加载更多 */
  .more-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0 0;margin-top:8px;border-top:1px solid var(--line);font-size:13px;color:var(--cream-dim)}
  .more-bar b{color:var(--gold);font-weight:800}
  .dur{display:inline-block;background:rgba(200,154,99,.15);color:var(--gold);font-size:12px;font-weight:700;padding:3px 10px;border-radius:8px;letter-spacing:.3px}
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
      <button class="btn btn-danger" id="clearAllBtn" title="清空全部匿名成绩（需密码）">🗑 清空</button>
    </div>
    <table>
      <thead><tr><th class="rank">排名</th><th>签名</th><th>答对/总题</th><th>正确率</th><th style="width:80px">用时</th><th>时间</th><th style="width:80px">操作</th></tr></thead>
      <tbody id="tbody"></tbody>
    </table>
    <div class="more-bar" id="moreBar" style="display:none">
      <span id="moreHint">已显示前 <b id="curShow">0</b> 名（共 <b id="totalAll">0</b> 名）</span>
      <button class="btn" id="moreBtn">加载更多</button>
    </div>
    <div class="empty" id="empty" style="display:none">暂无数据 — 邀请同事开启"匿名贡献到全员榜"开关</div>
  </div>

  <footer>
    数据来源 <a href="/api/ranking" target="_blank">/api/ranking</a> · 实时同步<br>
    网址 <a href="/" target="_blank">coffee-quiz-djc.pages.dev</a>
  </footer>
</div>

<script>
var DATA_URL = '/api/ranking';
var data = null;

function fmtDate(ts){if(!ts||ts<1e11)return'—';var d=new Date(ts),p=function(n){return n<10?('0'+n):n;};return(d.getMonth()+1)+'-'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes());}
function fmtDuration(sec){
  sec = Math.max(0, parseInt(sec||0, 10));
  if(sec < 60) return sec + '秒';
  var m = Math.floor(sec/60), s = sec%60;
  if(s === 0) return m + '分';
  return m + '分' + s + '秒';
}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}

async function load(){
  document.getElementById('updated').textContent = '加载中...';
  try{
    var r = await fetch(DATA_URL, {cache:'no-store'});
    var j = await r.json();
    if(!j.ok) throw new Error(j.error||'fetch failed');
    data = j;
    window._showCount = 20; // 每次刷新重置分页
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
  document.getElementById('sSubmits').textContent = data.overall.total_submissions||0;
  document.getElementById('sSigners').textContent = data.overall.total_signers||0;
  var totalRight = 0, totalTotal = 0;
  (data.items||[]).forEach(function(r){totalRight+=r.right; totalTotal+=r.total;});
  document.getElementById('sAvg').textContent = totalTotal ? Math.round(totalRight/totalTotal*100)+'%' : '—';
  document.getElementById('sTop').textContent = (data.items||[]).length ? (data.items[0].pct+'%') : '—';

  var tb = document.getElementById('tbody');
  if(!items.length){
    tb.innerHTML='';
    document.getElementById('empty').style.display='block';
    return;
  }
  document.getElementById('empty').style.display='none';
  // 分页：默认显示前 20，点"加载更多"再 +20
  var showCount = window._showCount || 20;
  var visible = items.slice(0, showCount);
  var html = '';
  visible.forEach(function(r,i){
    var bc='';
    if(i===0) bc='gold';
    else if(i===1) bc='silver';
    else if(i===2) bc='bronze';
    html += '<tr>'
      + '<td class="rank"><span class="rank-badge '+bc+'">'+(i+1)+'</span></td>'
      + '<td class="sig">'+esc(r.sig)+'</td>'
      + '<td>'+r.right+'/'+r.total+'</td>'
      + '<td><div style="display:flex;align-items:center;gap:8px"><div class="pct">'+r.pct+'%</div><div class="pct-bar"><div class="f" style="width:'+r.pct+'%"></div></div></div></td>'
      + '<td><span class="dur">'+fmtDuration(r.duration)+'</span></td>'
      + '<td class="right-meta">'+fmtDate(r.ts)+'</td>'
      + '<td><button class="btn-ghost-sm row-del" data-sig="'+esc(r.sig)+'" title="删除该签名所有记录">删除</button></td>'
      + '</tr>';
  });
  tb.innerHTML = html;
  // 行内"删除"按钮事件代理
  Array.prototype.forEach.call(tb.querySelectorAll('.row-del'), function(b){
    b.onclick = function(){ clearLeaderboard(b.getAttribute('data-sig')); };
  });
  // 加载更多状态
  var moreBar = document.getElementById('moreBar');
  document.getElementById('curShow').textContent = visible.length;
  document.getElementById('totalAll').textContent = items.length;
  if(visible.length < items.length){
    moreBar.style.display = 'flex';
    document.getElementById('moreBtn').textContent = '加载更多（还有 '+(items.length-visible.length)+' 条）';
  } else {
    moreBar.style.display = 'none';
  }
}

document.getElementById('refreshBtn').onclick = load;
document.getElementById('search').oninput = render;
document.getElementById('moreBtn').onclick = function(){
  window._showCount = (window._showCount || 20) + 20;
  render();
};

// ============ 密码弹窗 + 管理员操作 ============
function showPwdModal(title, onConfirm){
  var box = document.createElement('div');
  box.className = 'pwd-mask';
  box.innerHTML = '<div class="pwd-box">'
    + '<div class="pwd-title">'+esc(title)+'</div>'
    + '<input type="password" class="pwd-input" id="pwInput" placeholder="输入管理员密码" autocomplete="off">'
    + '<div class="pwd-err" id="pwErr"></div>'
    + '<div class="pwd-actions">'
    +   '<button class="btn-ghost-sm" id="pwCancel">取消</button>'
    +   '<button class="btn-ghost-sm" id="pwOk">确认</button>'
    + '</div></div>';
  document.body.appendChild(box);
  var input = document.getElementById('pwInput');
  setTimeout(function(){try{input.focus();}catch(e){}}, 60);
  function close(){
    box.parentNode && box.parentNode.removeChild(box);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e){
    if(e.key==='Enter'){e.preventDefault();doOk();}
    else if(e.key==='Escape'){e.preventDefault();close();}
  }
  document.addEventListener('keydown', onKey);
  function doOk(){
    var v = input.value || '';
    close();
    if(onConfirm) onConfirm(v);
  }
  document.getElementById('pwOk').onclick = doOk;
  document.getElementById('pwCancel').onclick = close;
}

function clearLeaderboard(sig){
  var actionLabel = sig ? '删除签名「'+sig+'」的所有记录' : '清空全部匿名排行榜数据';
  showPwdModal(actionLabel, async function(pwd){
    if(!pwd){return;}
    try{
      var r = await fetch('/api/admin/clear', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({pwd: pwd, sig: sig || ''})
      });
      var j = await r.json();
      if(!j.ok){alert(j.error||'操作失败');return;}
      //alert('已删除 ' + j.deleted + ' 条记录');
      load();
    }catch(e){alert('请求失败：'+e.message);}
  });
}

document.getElementById('clearAllBtn').onclick = function(){ clearLeaderboard(''); };

load();
setInterval(load, 30000);
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS },
  });
}

export async function onRequestOptions() {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  return new Response(null, { headers: CORS });
}