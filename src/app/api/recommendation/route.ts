// src/app/api/recommendation/route.ts
import { promises as fs } from 'fs';
import path from 'path';
import natural from 'natural';

const { TfIdf, PorterStemmer, stopwords } = natural;
const tokenizer = new natural.WordTokenizer();

type Video = {
  id: number;
  url: string;
  title: string;
  publishedAt: string | null | undefined;
  thumbnail: string | null | undefined;
  tags: string[];
};

function preprocess(text: string): string[] {
  return tokenizer
    .tokenize(text.toLowerCase())
    .map(token => PorterStemmer.stem(token))
    .filter(token => !stopwords.includes(token) && /^[a-z0-9]+$/.test(token));
}

function cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
  const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dotProduct = 0, magA = 0, magB = 0;
  allTerms.forEach(term => {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  });
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = body.prompt;
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt is required.' }), { status: 400 });
  }

  // Read videos from JSON file
  const filePath = path.join(process.cwd(), 'data', 'sermons_with_tags.json');
  let videos: Video[];
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    videos = JSON.parse(fileContents);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Could not read videos data.' }), { status: 500 });
  }

  // Build TF-IDF for video tags
  const tfidf = new TfIdf();
  videos.forEach(video => {
    tfidf.addDocument(preprocess(video.tags.join(' ')).join(' '));
  });

  // Preprocess prompt and create TF-IDF vector
  const processedPrompt = preprocess(prompt).join(' ');
  const promptVector: Record<string, number> = {};
  tfidf.tfidfs(processedPrompt, (i: number, measure: number, key: string) => {
    promptVector[key] = measure;
  });

  // Compute similarity for each video
  const results = videos.map((video, idx) => {
    const videoTerms = tfidf.listTerms(idx);
    const videoVector: Record<string, number> = {};
    videoTerms.forEach(({ term, tfidf }) => {
      videoVector[term] = tfidf;
    });
    const score = cosineSimilarity(promptVector, videoVector);
    return { ...video, score };
  });

  // Sort and return top 3
//   const topResults = results
//     .sort((a, b) => b.score - a.score)
//     .slice(0, 3);
  const THRESHOLD = 0.7;

  // Filter videos above threshold
  const aboveThreshold = results.filter(video => video.score >= THRESHOLD);

  let responseVideos;
  if (aboveThreshold.length > 0) {
    // Return all videos above threshold, sorted by score descending
    responseVideos = aboveThreshold.sort((a, b) => b.score - a.score);
  } else {
    // Return the single highest scoring video
    const highest = results.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), results[0]);
    responseVideos = [highest];
  }

  return new Response(JSON.stringify(responseVideos), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
