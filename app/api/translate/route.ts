import { NextResponse } from 'next/server';
import queryString from 'query-string';
import Joi from 'joi';
import { getConnection } from '@/app/lib/db';
import { parseJson } from "../../lib/utils";
import { RowDataPacket } from 'mysql2';
import { deepseekCreateCompletion } from '@/app/lib/deepseek';

interface Params {
  subtitle: string;
}

const schema = Joi.object<Params>({
  subtitle: Joi.string().required(),
});

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const data = queryString.parse(search);
  const { error, value } = schema.validate(data);
  if (error) {
    return NextResponse.json({ message: 'Invalid input', error: error.message }, { status: 400 });
  }
  
  // const origin = request.headers.get('Origin');
  // if (origin !== 'https://www.youtube.com') {
  //   return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  // }

  const { subtitle } = value;
  console.log({ subtitle });
  const json = await getTranslation(subtitle);

  const response = NextResponse.json({ message: 'success', translation: json });
  // response.headers.set('Access-Control-Allow-Origin', 'https://www.youtube.com'); // Allow only YouTube
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}

async function getTranslation(subtitle: string) {
  // 判断视频是否已经存在
  const connection = await getConnection();
  const [translations] = await connection.query<RowDataPacket[]>('SELECT id,originalText,translation FROM Translations where originalText=?', [subtitle]);
  console.log({ translations, subtitle });
  if (translations.length > 0) {
    if (!parseJson(translations[0].translation)) {
      await connection.query('DELETE FROM Translations WHERE id=?', [translations[0].id]);
    } else {
      return parseJson(translations[0].translation);
    }
  }
  let translation = await deepseekCreateCompletion({
    messages: [
      {
        role: 'user',
        content: `
        ${subtitle}

  我需要学习上面的英文句子，返回翻译、语法分析、例句、重点词汇。格式为json字符串，如下：
  {
    "translate": "",
      "grammar": "",
        "example": [{ "sentence": "", "translate": "" }],
          "keyVocabulary": [{ "vocabulary": "", "illustrate": "", pronounce: "", example: "" }]
  } `,
      },
    ],
  });
  let json = parseJson(translation);
  if (translation && !json) {
    // 将翻译结果转换为json格式，需要先去掉```json字符串的注释
    const jsonStr = translation.match(/```json([^`]+)```/);
    if (jsonStr) {
      translation = jsonStr[1];
      json = parseJson(jsonStr[1]);
    }
  }
  await connection.query('INSERT INTO Translations (originalText, translation) VALUES (?, ?)', [subtitle, translation]);
  return json;
}
