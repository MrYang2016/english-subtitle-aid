import { tongyiCreateCompletion } from "@/app/lib/tongyi";

import { NextResponse } from 'next/server';
import queryString from 'query-string';
import Joi from 'joi';
import { getConnection } from '@/app/lib/db';
import { parseJson } from "../../lib/utils";
import { RowDataPacket } from 'mysql2';
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
  const { subtitle } = value;
  console.log({ subtitle });
  const translation = await getTranslation(subtitle);
  let json = parseJson(translation);
  if (!json) {
    // 将翻译结果转换为json格式，需要先去掉```json字符串的注释
    const jsonStr = translation.match(/```json([^`]+)```/);
    if (jsonStr) {
      json = parseJson(jsonStr[1]);
    }
  }
  return NextResponse.json({ message: 'success', translation: json });
}

async function getTranslation(subtitle: string) {
  // 判断视频是否已经存在
  const connection = await getConnection();
  const [translations] = await connection.query<RowDataPacket[]>('SELECT id,originalText,translation FROM translations where originalText=?', [subtitle]);
  if (translations.length > 0) {
    if (!parseJson(translations[0].translation)) {
      await connection.query('DELETE FROM translations WHERE id=?', [translations[0].id]);
    } else {
      return translations[0].translation;
    }
  }
  const translation = await tongyiCreateCompletion({
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
  await connection.query('INSERT INTO translations (originalText, translation) VALUES (?, ?)', [subtitle, translation]);
  return translation;
}
