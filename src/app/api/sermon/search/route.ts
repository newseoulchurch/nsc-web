// pages/api/sermon/search.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  // 1. Get embedding from OpenAI
  const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: q,
      encoding_format: 'float',
    }),
  });
  if (!embeddingRes.ok) {
    return NextResponse.json({ error: 'OpenAI error' }, { status: 500 });
  }
  const embedding = (await embeddingRes.json()).data[0].embedding;

  // 2. Query Supabase for top 3 matches by vector similarity
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.rpc('match_sermons', {
    embedding: embedding,
    match_count: 3,
    match_threshold: 0.2
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string,
    title: string,
    similarity: number
  }
  // 3. Format and return results
  const results = (data || []).slice(0, 3).map((row: Row) => ({
    videoId: row.id,
    title: row.title,
    thumbnail: `https://img.youtube.com/vi/${row.id}/hqdefault.jpg`,
    similarity: row.similarity,
  }));
  if (results.length === 0) {
    return NextResponse.json({ results: [] }, { status: 404 });
  }
  return NextResponse.json({ results });
}
