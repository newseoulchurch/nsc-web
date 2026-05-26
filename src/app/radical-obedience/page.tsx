/** @format */

import { google } from "googleapis";
import { Metadata } from "next";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Radical Obedience",
  description:
    "Events and creative projects from New Seoul Church — a community living out radical obedience to God.",
};

const PLAYLIST_ID = "PLGeHDPBuWQroGcEj2Xk2a6HTD3iwSPsm6";
const YOUTUBE_PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;

type Video = {
  id: string;
  title: string;
  publishedAt: string | null;
};

async function getPlaylistVideos(): Promise<Video[]> {
  const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
  });

  const res = await youtube.playlistItems.list({
    part: ["snippet"],
    playlistId: PLAYLIST_ID,
    maxResults: 50,
  });

  return (
    res.data.items?.map((item) => ({
      id: item.snippet?.resourceId?.videoId ?? "",
      title: item.snippet?.title ?? "",
      publishedAt: item.snippet?.publishedAt ?? null,
    })).filter((v) => v.id) ?? []
  );
}

export default async function RadicalObediencePage() {
  const videos = await getPlaylistVideos();

  return (
    <div className="bg-black text-white flex flex-col">
      <section
        className="flex flex-col items-center sm:items-start justify-center mb-10 gap-4 px-4 sm:px-[85px] h-[351px] text-center sm:text-start bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/images/sermon/sermon-background-img.png')" }}
      >
        <h1 className="text-[28px] sm:text-4xl font-bold uppercase">
          Radical Obedience
        </h1>
        <p className="text-base sm:text-[18px] leading-relaxed max-w-2xl">
          Events, worship nights, and creative projects from our community —
          living out radical obedience to God.
        </p>
        <a
          href={YOUTUBE_PLAYLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-white px-4 py-2 text-sm uppercase font-medium hover:bg-white hover:text-black transition-colors"
        >
          Watch on YouTube
        </a>
      </section>

      <section className="px-4 sm:px-[85px] py-14">
        {videos.length === 0 ? (
          <p className="text-center text-gray-400">No videos found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <article key={video.id}>
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-[200px] object-cover rounded-[12px] bg-gray-800"
                  />
                  <p className="mt-3 text-base font-medium leading-snug">
                    {video.title}
                  </p>
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
