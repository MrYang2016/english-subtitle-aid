import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';

import _he from 'he';

const _he2 = _interopRequireDefault(_he);

import _striptags from 'striptags';

const _striptags2 = _interopRequireDefault(_striptags);

// const url = 'https://www.youtube.com/watch?v=PXWFlea0l5w';
// getSubtitles(url).then(console.log);

const env = process.env.CUSTOM_ENV || process.env.NODE_ENV || "local";

export async function getSubtitles(url: string) {
  const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
  const agent = new HttpsProxyAgent(proxy);
  const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
  const data = response.data;

  const regex = /"captionTracks":(\[.*?\])/;
  if (!data.includes('captionTracks')) throw new Error(`Could not find captions for url: ${url}`);
  const _regex$exec = regex.exec(data);
  const _regex$exec2 = _slicedToArray(_regex$exec, 1);
  const match = _regex$exec2[0];
  const _JSON$parse = JSON.parse(`{${match}}`);
  const captionTracks = _JSON$parse.captionTracks;
  const en = captionTracks.find(v => v.vssId === '.en');
  const sutitleRes = await axios.get(en.baseUrl, { httpsAgent: agent });
  const transcript = sutitleRes.data;
  const lines = transcript.replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '').replace('</transcript>', '').split('</text>').filter(function (line) {
    return line && line.trim();
  }).map(function (line) {
    const startRegex = /start="([\d.]+)"/;
    const durRegex = /dur="([\d.]+)"/;

    const _startRegex$exec = startRegex.exec(line);
    const _startRegex$exec2 = _slicedToArray(_startRegex$exec, 2);

    const start = _startRegex$exec2[1];

    const _durRegex$exec = durRegex.exec(line);
    const _durRegex$exec2 = _slicedToArray(_durRegex$exec, 2);

    const dur = _durRegex$exec2[1];


    const htmlText = line.replace(/<text.+>/, '').replace(/&amp;/gi, '&').replace(/<\/?[^>]+(>|$)/g, '');

    const decodedText = _he2.default.decode(htmlText);
    const text = (0, _striptags2.default)(decodedText);

    return {
      start,
      dur,
      text
    };
  });

  return lines;
};

function _slicedToArray(arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else if (Symbol.iterator in Object(arr)) {
    return sliceIterator(arr, i);
  } else {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }
}

function sliceIterator(arr, i) {
  const _arr = [];
  let _n = true;
  let _d = false;
  let _e = undefined;
  const _i = arr[Symbol.iterator]();
  try {
    for (let _s; !(_n = (_s = _i.next()).done); _n = true) {
      // @ts-expect-error 类型错误
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    // @ts-expect-error 类型错误
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"]) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
