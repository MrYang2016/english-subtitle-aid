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

  await delay(10000);

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
