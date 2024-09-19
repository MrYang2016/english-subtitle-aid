import { NextResponse } from 'next/server';
import queryString from 'query-string';
import Joi from 'joi';
import { getConnection } from '@/app/lib/db';

interface Params {
  videoId: string;
}

const schema = Joi.object<Params>({
  videoId: Joi.string().required(),
});

interface Subtitle {
  id: number;
  text: string;
  startTime: number;
  duration: number;
}

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
  const sqlResult = await connection.query('SELECT id,text,startTime,duration FROM Subtitles where videoId=?', [videoId]);
  const rows: Subtitle[] = sqlResult[0] as Subtitle[]; 
  let obj = { text: '', startTime: 0, duration: 0, id: 0 };
  const subtitles = rows.reduce<Subtitle[]>((r, v) => {
    const { text } = v;
    // text最后一个字符是否为句子的结尾
    const lastChar = text.slice(-1);
    obj.text += ` ${text}`;
    if (obj.startTime === 0) {
      obj.startTime = v.startTime;
      obj.id = v.id;
    }
    obj.duration += (v.startTime - (obj.startTime + obj.duration)) + v.duration;
    if (lastChar === '.' || lastChar === '!' || lastChar === '?') {
      r.push(obj);
      obj = { text: '', startTime: 0, duration: 0, id: 0 };
    }
    return r;
  }, [] as Subtitle[]);
  return NextResponse.json({ message: 'success', subtitles });
}
