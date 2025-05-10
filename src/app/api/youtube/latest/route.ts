import { google, youtube_v3 } from "googleapis";
import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Sermon = Database["public"]["Tables"]["sermon"]["Row"];
type SermonPreview = Pick<Sermon, "id" | "title" | "publishedAt">;

// const youtube = google.youtube({
//   version: "v3",
//   auth: process.env.YOUTUBE_API_KEY,
// });

type LatestVideoResult = {
  id: string;
  title: string;
  publishedAt: string | null | undefined;
  thumbnail: string | null | undefined;
};

const MAX_LATEST_VIDEO_RESULTS = 10;

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("sermon")
      .select("id, title, publishedAt")
      .order("publishedAt", { ascending: false })
      .limit(MAX_LATEST_VIDEO_RESULTS);

    const sermons: SermonPreview[] | null = data;
    // Pulling from Youtube Data API is deprecated, as we can use our internal storage to get latest videos

    // const channelResponse = await youtube.channels.list({
    //   part: ["contentDetails"],
    //   id: [process.env.YOUTUBE_CHANNEL_ID!],
    // });

    // const uploadsPlaylistId =
    //   channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists
    //     ?.uploads;

    // if (!uploadsPlaylistId) {
    //   return NextResponse.json(
    //     { error: "Could not find uploads playlist ID" },
    //     { status: 404 }
    //   );
    // }

    // const playlistItemsResponse = await youtube.playlistItems.list({
    //   // Upload playlist
    //   part: ["snippet"],
    //   playlistId: uploadsPlaylistId,
    //   maxResults: MAX_LATEST_VIDEO_RESULTS,
    // });

    const latestVideos: LatestVideoResult[] =
      sermons?.map((item) => ({
        id: item.id,
        title: item.title!,
        publishedAt: item.publishedAt,
        thumbnail: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
      })) ?? [];
    return NextResponse.json(latestVideos, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching latest videos:", error);
    return NextResponse.json({ error: "Failed to fetch latest videos" }, { status: 500 });
  }
}
