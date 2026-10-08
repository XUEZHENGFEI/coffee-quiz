const pw = require('C:/Users/kxue/.workbuddy/binaries/node/workspace/node_modules/playwright-core');
(async () => {
  const browser = await pw.chromium.launch({
    headless: true,
    executablePath: 'C:/Users/kxue/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('https://coffee-quiz-djc.pages.dev/api/board', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);
  // 浏览器 fetch 25 个签名
  await page.evaluate(async () => {
    for (let i = 1; i <= 25; i++) {
      const right = Math.floor(Math.random() * 10) + 10; // 10-19
      await fetch('/api/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({sig: '测试'+i+'号', total: 20, right, duration: 30}) });
    }
  });
  await page.waitForTimeout(2000);
  // 刷新
  await page.locator('#refreshBtn').click();
  await page.waitForTimeout(2000);
  console.log('rows=' + await page.locator('#tbody tr').count());
  console.log('moreBar visible=' + await page.locator('#moreBar').isVisible());
  console.log('curShow=' + await page.locator('#curShow').textContent());
  console.log('totalAll=' + await page.locator('#totalAll').textContent());
  console.log('moreBtn text=' + await page.locator('#moreBtn').textContent());
  await page.screenshot({ path: 'C:/Users/kxue/WorkBuddy/Kirin文件夹/门店培训自测/_board_pg1.png', fullPage: true });

  // 点加载更多
  await page.locator('#moreBtn').click();
  await page.waitForTimeout(500);
  console.log('after more rows=' + await page.locator('#tbody tr').count());
  console.log('after more moreBar visible=' + await page.locator('#moreBar').isVisible());
  await page.screenshot({ path: 'C:/Users/kxue/WorkBuddy/Kirin文件夹/门店培训自测/_board_pg2.png', fullPage: true });

  await browser.close();
})().catch(e => { console.error('SCRIPT ERROR:', e.message); process.exit(1); });