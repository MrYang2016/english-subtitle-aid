import { NextResponse } from 'next/server';
import { getConnection } from '@/app/lib/db';

export async function GET() {
  const connection = await getConnection();
  const sqlResult = await connection.query('SELECT id,title,thumbnailUrl FROM videos ORDER BY createdAt DESC');
  return NextResponse.json({ message: 'success', videos: sqlResult[0] });
}
