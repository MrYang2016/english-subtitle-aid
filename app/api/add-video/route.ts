import { NextResponse } from 'next/server';
import queryString from 'query-string';
import Joi from 'joi';
import puppeteer from 'puppeteer';
import { getConnection } from '@/app/lib/db';
import { parseJson } from '@/app/lib/utils';

interface Params {
  videoId: string;
}

const schema = Joi.object<Params>({
  videoId: Joi.string().required(),
});

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const data = queryString.parse(search);
  const { error, value } = schema.validate(data);
  if (error) {
    return NextResponse.json({ message: 'Invalid input', error: error.message }, { status: 400 });
  }
  const { videoId } = value;
  // 判断视频是否已经存在
  const connection = await getConnection();
  const [video] = await connection.query('SELECT * FROM videos WHERE id = ?', [videoId]);
  if (Array.isArray(video) && video.length > 0) {
    return NextResponse.json({ message: 'success', id: videoId });
  }
  const sql = 'INSERT INTO Videos (id, title, thumbnailUrl) VALUES (?, ?, ?)';
  const values = [videoId, '', ''];
  await connection.query(sql, values);
  getSubtitleFromYoutube(videoId);
  console.log('videoId', videoId);
  return NextResponse.json({ message: 'success', id: videoId });
}

async function getSubtitleFromYoutube(videoId: string) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址


  const args = [
    '--no-sandbox', '--disable-setuid-sandbox',
  ];
  if (process.env.CUSTOM_ENV === 'local') {
    args.push(`--proxy-server=${proxy}`);
  }
  const browser = await puppeteer.launch({
    headless: true, 
    args,
  });
  const page = await browser.newPage();

  // 设置User-Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  // 监听网络请求
  // page.on('request', request => {
  //   const url = request.url();
  //   if (url.includes('timedtext')) {
  //     console.log('字幕请求接口:', url);
  //   }
  // });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('timedtext')) {
      const text = await response.text();
      // await browser.close();
      console.log('字幕:', typeof text);

      // 保存每条字幕
      const subtitles = parseJson(text)?.events || [];
      if (!isSubtitle(subtitles)) {
        console.error('字幕格式错误');
        return;
      }
      const connection = await getConnection();
      // 批量保存
      const sql = 'INSERT INTO Subtitles (videoId, text, language, startTime, duration) VALUES ?';
      const values = subtitles.map(subtitle => [videoId, subtitle.segs[0].utf8, 'en', subtitle.tStartMs, subtitle.dDurationMs]);
      await connection.query(sql, [values]);

    }
  });

  interface Subtitle {
    tStartMs: number;
    dDurationMs: number;
    segs: {
      utf8: string;
    }[];
  }

  function isSubtitle(subtitles: unknown): subtitles is Subtitle[] {
    return Array.isArray(subtitles) && subtitles.every(subtitle => 
      typeof subtitle === 'object' && 
      'tStartMs' in subtitle && 
      'dDurationMs' in subtitle && 
      'segs' in subtitle && 
      Array.isArray(subtitle.segs) && 
      subtitle.segs.every((seg: { utf8: string }) => typeof seg === 'object' && 'utf8' in seg && typeof seg.utf8 === 'string')
    );
  }

  // 加载YouTube视频页面
  await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  // 获取封面图像URL
  const thumbnailUrl = await page.evaluate(() => {
    const linkElement = document.querySelector('link[rel="preload"][as="image"]');
    return linkElement ? linkElement.getAttribute('href') : null;
  });

  console.log('封面图像URL:', thumbnailUrl);

  // 获取视频标题
  const title = await page.evaluate(() => {
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
    return titleElement ? titleElement.textContent : null;
  });

  console.log('视频标题:', title);

  // 保存视频信息
  const connection = await getConnection();
  const sql = 'UPDATE Videos SET title = ?, thumbnailUrl = ? WHERE id = ?';
  const values = [title, thumbnailUrl, videoId];
  await connection.query(sql, values);

  // 调试页面加载情况
  // await page.screenshot({ path: 'screenshot.png' }); // 截图保存

  // await delay(10000);

  // await page.screenshot({ path: 'screenshot2.png' }); // 截图保存

  // 移动鼠标到视频播放器区域，使字幕按钮出现
  const videoPlayerSelector = '.html5-video-player';
  const videoPlayer = await page.waitForSelector(videoPlayerSelector, { visible: true });
  if (videoPlayer) {
    const videoPlayerBox = await videoPlayer.boundingBox();
    if (videoPlayerBox) {
      await page.mouse.move(
        videoPlayerBox.x + videoPlayerBox.width / 2,
        videoPlayerBox.y + videoPlayerBox.height / 2
      );
    }
  }


  // 等待字幕按钮可点击
  await page.waitForSelector('.ytp-subtitles-button', { visible: true });
  await page.click('.ytp-subtitles-button');
}
