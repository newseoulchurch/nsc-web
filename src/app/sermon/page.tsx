/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { TYoutubeVideo } from "@/types/youtube";
import React, { useEffect, useState } from "react";

export default function SermonSeriesPage() {
  const previousSermons = [
    {
      title: "Who is Jesus?",
      description: "A series of sermons on who Jesus is",
      url: "https://www.youtube.com/playlist?list=PLGeHDPBuWQro0yNfRPr9Hds0nd0DJelSh",
      background: "/assets/images/sermon/crimson-bg.jpg",
    },
    {
      title: "Emotions",
      description: "A series of sermons on emotions",
      url: "https://www.youtube.com/playlist?list=PLGeHDPBuWQrpehPXs_suOCITn4ged6FdB",
      background: "/assets/images/sermon/red-bg.jpg",
    },
    {
      title: "Presence",
      description: "A series of sermons on presence",
      url: "https://www.youtube.com/playlist?list=PLGeHDPBuWQroZnmksjBq7YotMRiDLsggw",
      background: "/assets/images/sermon/pink-bg.jpg",
    },
  ];
  const [youtubeData, setYoutubeData] = useState<TYoutubeVideo[]>([]);
  const [youtubeWorship, setYoutubeWorship] = useState<TYoutubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function getYoutubeData() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/youtube/latest");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error.message);

      const videos = data
        .filter((item: any) => !item.title.toLowerCase().includes("worship"))
        .map((item: any) => ({
          title: item.title,
          videoId: item.id,
          videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
          thumbnail: item.thumbnail,
          publishedAt: item.publishedAt,
        }));

      const worshipVideos = data
        .filter((item: any) => item.title.toLowerCase().includes("worship"))
        .map((item: any) => ({
          title: item.title,
          videoId: item.id,
          videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
          thumbnail: item.thumbnail,
          publishedAt: item.publishedAt,
        }));

      setYoutubeData(videos.slice(0, 4));
      setYoutubeWorship(worshipVideos.slice(0, 4));
    } catch (error) {
      console.error("Failed to fetch YouTube data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getYoutubeData();
  }, []);

  return (
    <div className="bg-black text-white flex flex-col">
      <section
        className="flex flex-col items-center sm:items-start justify-center mb-10 gap-4 px-6 sm:px-14 h-[351px] text-center sm:text-start"
        style={{
          backgroundImage:
            "url('/assets/images/sermon/sermon-background-img.png')",
        }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold uppercase">
          Sermon Series
        </h1>
        <div className="text-base max-w-2xl">
          Our Sermon Series offers a collection of thought-provoking teachings
          designed to deepen your faith and understanding in gospel.
        </div>
        <Button
          className="bg-black uppercase text-white border-white hover:bg-white hover:text-black"
          onClick={() => {
            window.open(
              "https://www.youtube.com/@newseoulchurch/playlists",
              "_blank"
            );
          }}
          variant="outline"
        >
          Watch on YouTube
        </Button>
      </section>

      <section className="px-14 py-14">
        <div className="flex justify-center items-center">
          <h3 className="text-h3 font-bold">LATEST MESSAGE</h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-[200px] text-white">
            Loading latest sermons...
          </div>
        ) : (
          <div className="mt-[26px] flex flex-col gap-[24px] lg:flex-row lg:overflow-x-auto lg:scroll-smooth lg:thin-scrollbar">
            {(youtubeData || []).map((data, i) => (
              <article key={i} className="w-full lg:w-[390px] flex-shrink-0">
                <a
                  href={data.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={data.thumbnail}
                    alt="Thumbnail"
                    className="w-full h-[219px] bg-gray5 rounded-[12px] object-cover"
                    height={"219px"}
                  />
                  <p className="mt-[10px] text-base font-medium">
                    {data.title}
                  </p>
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="px-14 py-14">
        <div className="flex justify-center items-center">
          <h3 className="text-h3 font-bold">LATEST WORSHIP</h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px] text-white">
            Loading latest worships...
          </div>
        ) : (
          <div className="mt-[26px] flex flex-col gap-[24px] lg:flex-row lg:overflow-x-auto lg:scroll-smooth lg:thin-scrollbar">
            {(youtubeWorship || []).map((data, i) => (
              <article key={i} className="w-full lg:w-[390px] flex-shrink-0">
                <a
                  href={data.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={data.thumbnail}
                    alt="Thumbnail"
                    className="w-full h-[219px] bg-gray5 rounded-[12px] object-cover"
                    height={"219px"}
                  />
                  <p className="mt-[10px] text-base font-medium">
                    {data.title}
                  </p>
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="flex flex-col items-center justify-center my-10 px-4 sm:px-14">
        <h1 className="text-xl sm:text-2xl font-bold uppercase text-center">
          Previous Sermons
        </h1>

        <div className="w-full bg-[#FF03031C] h-6 sm:h-10 my-4" />

        <div className="flex flex-col gap-8 w-full">
          {previousSermons.map((sermon) => (
            <div
              key={sermon.title}
              className="flex w-full flex-col gap-4 items-center justify-center"
            >
              <div
                className="w-full bg-cover bg-center h-[180px] sm:h-48 rounded-lg py-[30px]"
                style={{ backgroundImage: `url(${sermon.background})` }}
              >
                <div className="w-full h-full flex flex-col sm:flex-row items-start justify-between px-4 sm:px-14 py-4 gap-4 sm:gap-0">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg sm:text-xl font-bold uppercase">
                      {sermon.title}
                    </h2>
                    <p className="text-sm">{sermon.description}</p>
                  </div>

                  <div
                    onClick={() => window.open(sermon.url, "_blank")}
                    className="font-circular uppercase text-base cursor-pointer text-white hover:underline"
                  >
                    Watch on YouTube +
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full bg-[#FF03031C] h-6 sm:h-10 my-4" />

        <Button
          className="mt-4 bg-black uppercase text-white border-white hover:bg-white hover:text-black"
          onClick={() =>
            window.open(
              "https://www.youtube.com/@newseoulchurch/playlists",
              "_blank"
            )
          }
          variant="outline"
        >
          More
        </Button>
      </section>
    </div>
  );
}
