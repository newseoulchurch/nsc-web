import { google, youtube_v3 } from 'googleapis';
import { NextResponse, NextRequest } from 'next/server';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

type VideoResult = {
  id: string;
  title: string;
  publishedAt: string | null | undefined;
};

type PlaylistDetailResult = {
  id: string;
  title: string | null | undefined;
  description: string | null | undefined;
  videos: VideoResult[];
};

const MAX_PLAYLIST_ITEM_RESULTS = 5;

export async function  GET(req: NextRequest, { params }: { params: { playlistId: string } }) {
  const { playlistId } = params;

  if (!playlistId || typeof playlistId !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid playlistId' }, { status: 400 });
  }

  try {
    const playlistResponse = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      id: [playlistId as string], 
    });

    if (
      !playlistResponse.data.items ||
      playlistResponse.data.items.length === 0
    ) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const playlistData = playlistResponse.data.items[0];

    const playlistItemsResponse = await youtube.playlistItems.list({ // videos
      part: ['snippet', 'contentDetails'],
      playlistId: playlistId as string, 
      maxResults: MAX_PLAYLIST_ITEM_RESULTS,
    });

    const videos: VideoResult[] =
      playlistItemsResponse.data.items?.map(
        (item: youtube_v3.Schema$PlaylistItem) => ({
          id: item.snippet!.resourceId!.videoId!,
          title: item.snippet!.title!,
          publishedAt: item.snippet!.publishedAt,
        })
      ) ?? [];

    const responseData: PlaylistDetailResult = {
      id: playlistData.id!,
      title: playlistData.snippet?.title,
      description: playlistData.snippet?.description,
      videos: videos,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching playlist ${playlistId}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch playlist ${playlistId}` },
      { status: 500 }
    );
  }
}
