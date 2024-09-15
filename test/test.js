const puppeteer = require('puppeteer');

(async () => {
  const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址

  const browser = await puppeteer.launch({
    headless: true, args: [
      '--no-sandbox', '--disable-setuid-sandbox', `--proxy-server=${proxy}`
    ]
  });
  const page = await browser.newPage();

  // 设置User-Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  // 监听网络请求
  page.on('request', request => {
    const url = request.url();
    if (url.includes('timedtext')) {
      console.log('字幕请求接口:', url);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('timedtext')) {
      const text = await response.text();
      console.log('字幕内容:', text);
    }
  });

  // 加载YouTube视频页面
  await page.goto('https://www.youtube.com/watch?v=3uTmcG7CgdI', {
    waitUntil: 'networkidle2',
  });

  // 调试页面加载情况
  // await page.screenshot({ path: 'screenshot.png' }); // 截图保存

  // await delay(10000);

  // await page.screenshot({ path: 'screenshot2.png' }); // 截图保存

  // 移动鼠标到视频播放器区域，使字幕按钮出现
  const videoPlayerSelector = '.html5-video-player';
  const videoPlayer = await page.waitForSelector(videoPlayerSelector, { visible: true });
  const videoPlayerBox = await videoPlayer.boundingBox();
  await page.mouse.move(
    videoPlayerBox.x + videoPlayerBox.width / 2,
    videoPlayerBox.y + videoPlayerBox.height / 2
  );

  // 等待字幕按钮可点击
  await page.waitForSelector('.ytp-subtitles-button', { visible: true });
  await page.click('.ytp-subtitles-button');

  // 等待一段时间以确保所有请求都被捕获
  // await page.waitForTimeout(10000);
  setTimeout(async () => {
    await browser.close();
  }, 200000);
})();

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
