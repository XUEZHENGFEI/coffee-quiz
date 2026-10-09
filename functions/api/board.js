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
    --bg:#f5e8d3; --bg-2:#fdf3e3; --panel:#ffffff; --panel2:#faf1e3; --panel3:#f0e2c8;
    --cream:#3a2517; --cream-soft:#5a3c26; --cream-dim:#8b6332;
    --apricot:#f0c692; --peach:#ffa07a; --coral:#ff7e6b; --coral-deep:#e5614d;
    --caramel:#c89a63; --caramel-deep:#a97a42;
    --green:#7fa86a; --red:#d9543f;
    --line:#e6d3b3; --line-soft:#f0e2c8;
  }
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{
    font-family:"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif;
    background:
      radial-gradient(900px 500px at 85% -10%, rgba(255,126,107,.10), transparent 60%),
      radial-gradient(700px 400px at -10% 110%, rgba(200,154,99,.10), transparent 60%),
      var(--bg);
    color:var(--cream);min-height:100vh;padding:0 0 40px;
  }
  .wrap{max-width:900px;margin:0 auto;padding:20px 16px}
  header{text-align:center;padding:18px 0 24px}
  .kicker{color:var(--coral);font-size:12px;letter-spacing:4px;font-weight:700}
  h1{font-size:30px;font-weight:800;margin:8px 0 4px;letter-spacing:2px;color:var(--cream)}
  .sub{color:var(--cream-dim);font-size:13px}
  .updated{font-size:11px;color:var(--cream-dim);margin-top:8px;opacity:.7}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
  .stat{background:linear-gradient(180deg,var(--panel) 0%,var(--bg-2) 100%);border:1px solid var(--line);border-radius:14px;padding:14px;text-align:center;box-shadow:0 4px 12px rgba(169,122,66,.08),inset 0 1px 0 rgba(255,255,255,.6)}
  .stat .v{display:block;color:var(--coral);font-weight:800;font-size:22px}
  .stat .l{display:block;color:var(--cream-dim);font-size:11px;margin-top:4px}
  .card{background:linear-gradient(180deg,var(--panel) 0%,var(--bg-2) 100%);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 8px 24px rgba(169,122,66,.10),inset 0 1px 0 rgba(255,255,255,.6)}
  table{width:100%;border-collapse:collapse}
  th,td{padding:10px 8px;text-align:left;border-bottom:1px solid var(--line);font-size:14px}
  th{color:var(--cream-soft);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px}
  .rank{width:54px;font-weight:800;font-size:18px;color:var(--caramel-deep)}
  .rank-badge{display:inline-block;width:30px;height:30px;border-radius:50%;line-height:30px;text-align:center;font-weight:800;font-size:13px;background:var(--panel3);color:var(--cream-soft)}
  .rank-badge.gold{background:linear-gradient(135deg,#d9b070,#a97a42);color:#241408}
  .rank-badge.silver{background:linear-gradient(135deg,#c8c8c8,#8a8a8a);color:#241408}
  .rank-badge.bronze{background:linear-gradient(135deg,#cd9a6e,#8a5a30);color:#241408}
  .sig{font-weight:700;color:var(--cream)}
  .pct{font-weight:800;color:var(--caramel-deep);font-size:16px}
  .right-meta{font-size:11px;color:var(--cream-dim);line-height:1.6}
  .pct-bar{flex:none;width:80px;height:8px;background:var(--line);border-radius:4px;overflow:hidden}
  .pct-bar .f{height:100%;background:linear-gradient(90deg,var(--coral),var(--apricot))}
  .empty{text-align:center;color:var(--cream-dim);padding:30px;font-size:14px}
  .toolbar{display:flex;gap:8px;margin-bottom:14px;align-items:center}
  .toolbar input{flex:1;background:var(--panel);border:1px solid var(--line);color:var(--cream);font-family:inherit;font-size:13px;padding:8px 12px;border-radius:10px;outline:none}
  .toolbar input:focus{border-color:var(--coral)}
  .btn{background:rgba(255,255,255,.5);border:1px solid var(--line);color:var(--cream-soft);font-size:13px;padding:8px 14px;border-radius:10px;cursor:pointer;font-family:inherit;transition:.2s}
  .btn:hover{border-color:var(--peach);color:var(--coral);background:rgba(255,160,122,.10)}
  .btn-danger{border-color:var(--red);color:var(--red)}
  .btn-danger:hover{background:rgba(217,84,63,.10)}
  .btn-ghost-sm{background:rgba(255,255,255,.5);border:1px solid var(--line);color:var(--cream-soft);font-size:11px;padding:4px 10px;border-radius:8px;cursor:pointer;font-family:inherit;transition:.2s}
  .btn-ghost-sm:hover{border-color:var(--red);color:var(--red)}
  /* 密码弹窗 */
  .pwd-mask{position:fixed;inset:0;background:rgba(74,47,29,.4);display:flex;align-items:center;justify-content:center;z-index:9999;padding:18px}
  .pwd-box{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px;max-width:340px;width:100%;box-shadow:0 12px 40px rgba(169,122,66,.20)}
  .pwd-title{font-size:14px;font-weight:600;color:var(--cream);margin-bottom:10px;line-height:1.6;white-space:pre-line}
  .pwd-input{width:100%;background:var(--panel2);border:1px solid var(--line);color:var(--cream);font-family:inherit;font-size:14px;padding:10px 12px;border-radius:8px;outline:none;box-sizing:border-box;margin-bottom:8px}
  .pwd-input:focus{border-color:var(--coral)}
  .pwd-err{font-size:12px;color:var(--red);min-height:16px;margin-bottom:4px}
  .pwd-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
  .pwd-actions .btn-ghost-sm{padding:8px 18px;font-size:13px}
  /* 加载更多 */
  .more-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0 0;margin-top:8px;border-top:1px solid var(--line);font-size:13px;color:var(--cream-dim)}
  .more-bar b{color:var(--coral);font-weight:800}
  .dur{display:inline-block;background:rgba(200,154,99,.18);color:var(--caramel-deep);font-size:12px;font-weight:700;padding:3px 10px;border-radius:8px;letter-spacing:.3px}
  footer{text-align:center;color:var(--cream-dim);font-size:11px;margin-top:20px;line-height:1.8;opacity:.7}
  footer a{color:var(--coral);text-decoration:none}
  @media (max-width:600px){.grid{grid-template-columns:repeat(2,1fr)}.rank-badge{width:26px;height:26px;line-height:26px;font-size:12px}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="kicker">啡正式嘉年华</div>
    <h1>咖啡文化排行榜</h1>
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