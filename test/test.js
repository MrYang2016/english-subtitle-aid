const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // 监听网络请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('timedtext')) {
      console.log('字幕请求接口:', url);
    }
  });

  // 加载YouTube视频页面
  await page.goto('https://www.youtube.com/watch?v=3uTmcG7CgdI', {
    waitUntil: 'networkidle2',
  });

  // 等待一段时间以确保所有请求都被捕获
  // await page.waitForTimeout(10000);
  setTimeout(async () => {
    await browser.close();
  }, 200000);
})();