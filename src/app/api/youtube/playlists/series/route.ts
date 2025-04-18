import { google, youtube_v3 } from 'googleapis';
import { NextResponse, NextRequest } from 'next/server';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

type PlaylistResult = {
  id: string;
  title: string;
  videoCount: number;
};

const MAX_PLAYLIST_RESULTS = 10;

export async function GET(req: NextRequest) {
  /* For getting list of playlists that start with "Series: __"*/
  try {
    const response = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      channelId: process.env.YOUTUBE_CHANNEL_ID,
      maxResults: MAX_PLAYLIST_RESULTS,
    });

    const seriesPlaylists: PlaylistResult[] = response.data.items
      ?.filter(
        (playlist: youtube_v3.Schema$Playlist) =>
          playlist.snippet?.title?.startsWith('Series: ')
      )
      .map((playlist: youtube_v3.Schema$Playlist) => ({
        id: playlist.id!,
        title: playlist.snippet!.title!,
        videoCount: playlist.contentDetails!.itemCount!,
      })) ?? [];

    return NextResponse.json(seriesPlaylists, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}
