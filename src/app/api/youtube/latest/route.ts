import { google, youtube_v3 } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

type LatestVideoResult = {
  id: string;
  title: string;
  publishedAt: string | null | undefined;
  thumbnail: string | null | undefined;
};

const MAX_LATEST_VIDEO_RESULTS = 10;

export async function GET(req: NextApiRequest, res: NextApiResponse<LatestVideoResult[] | { error: string }>) {
  try {
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [process.env.YOUTUBE_CHANNEL_ID!], 
    });

    const uploadsPlaylistId =
      channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return NextResponse.json(
        { error: 'Could not find uploads playlist ID' },
        { status: 404 }
      );
    }

    const playlistItemsResponse = await youtube.playlistItems.list({ // Upload playlist
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: MAX_LATEST_VIDEO_RESULTS,
    });

    const latestVideos: LatestVideoResult[] =
      playlistItemsResponse.data.items?.map(
        (item: youtube_v3.Schema$PlaylistItem) => ({
          id: item.snippet!.resourceId!.videoId!,
          title: item.snippet!.title!,
          publishedAt: item.snippet!.publishedAt,
          thumbnail: item.snippet?.thumbnails?.high?.url, // Get high-resolution thumbnail
        })
      ) ?? [];

    return NextResponse.json(latestVideos, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching latest videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest videos' },
      { status: 500 }
    );
  }
}
