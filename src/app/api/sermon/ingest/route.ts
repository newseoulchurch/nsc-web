import { google, youtube_v3 } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID!;
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const youtube = google.youtube({
  version: "v3",
  auth: YOUTUBE_API_KEY,
});

// Helper: Fetch latest 3 long videos with "Pastor Sermon" in title
async function fetchLatestVideos() {
  const params: youtube_v3.Params$Resource$Search$List = {
    part: ["snippet"],
    channelId: CHANNEL_ID,
    q: "Pastor Sermon",
    type: ["video"],
    videoDuration: "long",
    order: "date",
    maxResults: 5,
  };
  const res = await youtube.search.list(params);
  return (
    res.data.items
      ?.filter(
        (item) =>
          item.snippet?.description?.includes("Sermon")
      )
      .map((item) => ({
        videoId: item.id?.videoId,
        title: item.snippet?.title || "",
        publishedAt: item.snippet?.publishedAt || "",
      })) ?? []
  );
}

// Helper: Check if videoId exists in Supabase
async function existsInSupabase(videoId: string) {
  const { data, error } = await supabase
    .from("sermon")
    .select("id")
    .eq("id", videoId)
    .maybeSingle();
  return !!data;
}

// Helper: Fetch transcript from Supadata
async function fetchTranscript(videoId: string) {
  const url = `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`;
  const res = await fetch(url, {
    headers: { "x-api-key": SUPADATA_API_KEY },
  });
  if (!res.ok) throw new Error(`Transcript fetch failed for ${videoId}`);
  const json = await res.json();
  return json.content;
}

// Helper: Get OpenAI embedding
async function getEmbedding(text: string) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-large",
      input: text,
      encoding_format: "float",
    }),
  });
  if (!res.ok) throw new Error("OpenAI embedding failed");
  const json = await res.json();
  return json.data[0].embedding;
}

// Helper: Insert into Supabase
async function insertToSupabase(
  videoId: string,
  title: string,
  embedding: number[],
  publishedAt: string
) {
  const { error } = await supabase
    .from("sermon")
    .insert({ id: videoId, title, embedding, publishedAt });
  if (error) throw error;
}

export async function GET(req: Request) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ status: 401 });
  }
  let processed = [];
  try {
    const videos = await fetchLatestVideos();
    for (const { videoId, title, publishedAt } of videos) {
      if (!videoId) continue;
      const exists = await existsInSupabase(videoId);
      if (exists) continue;

      const transcript = await fetchTranscript(videoId);
      if (!transcript) throw new Error("No transcript!");

      const embedding = await getEmbedding(transcript);
      await insertToSupabase(videoId, title, embedding, publishedAt);
      processed.push({ videoId, title, publishedAt });
    }
    return NextResponse.json({ data: processed }, { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
