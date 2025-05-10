"use client";

import UpdateBlocker from "@/components/UpdateBlocker";
import { useIsOpen } from "@/hooks/useIsOpen.ts";
import { TEvents } from "@/types/events";
import { TYoutubeVideo } from "@/types/youtube";
import Link from "next/link";
import { useEffect, useState } from "react";
// import "./globals.css";

export default function Home() {
  const isOpen = useIsOpen();

  const [youtubeData, setYoutubeData] = useState<TYoutubeVideo[]>([]);
  const [eventsData, setEventsData] = useState<TEvents[]>();

  const parts = youtubeData[0]?.title.split(/[\]|\:]/) ?? [];
  const [query, setQuery] = useState("");
  const [searchData, setSearchData] = useState<TYoutubeVideo[]>([]);

  const handleSearch = async (e: KeyboardEvent | null, keyword?: string) => {
    const searchTerm = keyword ?? query;

    if ((e === null || e.key === "Enter") && searchTerm.trim()) {
      try {
        const res = await fetch(`/api/sermon/search?q=${searchTerm}`, {
          method: "POST",
        });

        const data = await res.json();
        setSearchData(
          data.results.map((item: any) => ({
            ...item,
            videoUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
          }))
        );
      } catch (error) {
        console.error("Search error:", error);
      }
    }
  };

  async function getYoutubeData() {
    try {
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

      setYoutubeData(videos.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch YouTube data:", error);
      return [];
    }
  }
  async function getEvents() {
    const res = await fetch("/api/events");
    const data = await res.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = data.map((event: TEvents) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      const status = eventDate < today ? "past" : "upcoming";
      return { ...event, eventDate, status };
    });

    const sorted = enriched.sort((a, b) => {
      if (a.status === "upcoming" && b.status === "past") return -1;
      if (a.status === "past" && b.status === "upcoming") return 1;

      if (a.status === "upcoming" && b.status === "upcoming") {
        return a.eventDate.getTime() - b.eventDate.getTime();
      }
      if (a.status === "past" && b.status === "past") {
        return b.eventDate.getTime() - a.eventDate.getTime();
      }

      return 0;
    });

    setEventsData(sorted);
  }
  useEffect(() => {
    getYoutubeData();
    getEvents();
  }, []);
  return (
    <>
      {/* {!!isOpen ? (
        <UpdateBlocker />
      ) : ( */}
      <main>
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center h-[920px] p-10 text-center overflow-hidden">
          {/* 🔹 Background Video */}
          <video
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            src="/assets/videos/main-sermon.mp4"
          />

          {/* 🔹 Content Overlay */}
          <div className="relative z-10 text-white">
            <h1 className="text-h1 font-bold">
              {parts[0]?.trim().startsWith("[")
                ? parts[0]?.trim() + "]"
                : parts[0]?.trim()}
              <br />
              {parts[1]?.trim()}
            </h1>
            {/* <p className="mt-[22px] text-[18px] leading-[100%]">
                THE BLIND SPOTS IN OUR LIVES THAT
                <br /> STOP US FROM REFLECTING GOD’S GLORY
              </p> */}

            <a
              href="https://www.youtube.com/@newseoulchurch" // ← 여기에 교회 채널 주소 넣으세요
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Watch latest sermon"
            >
              <button className="py-2 px-[14px] mt-[55px] border border-white border-[1.5px] rounded-[8px] text-button tracking-[0.1rem] cursor-pointer hover:bg-black hover:text-white transition-colors duration-200">
                WATCH
              </button>
            </a>
          </div>
        </section>

        <section className="mt-[68px] mb-[61px] px-4 lg:px-[54px]">
          {/* Sunday Service */}
          <div
            className="rounded-[14px] flex flex-col items-center justify-center text-center bg-cover bg-center px-4 py-10 sm:py-12"
            style={{
              backgroundImage: "url('/assets/images/main-back-image1.jpeg')",
              backgroundPosition: "center",
              backgroundSize: "cover",
              minHeight: "300px",
            }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              JOIN US SUNDAY
            </h2>

            {/* Time & Location */}
            <div className="w-full max-w-[486px] mt-6 sm:mt-10 bg-white rounded-[12px] flex flex-col sm:flex-row items-center justify-center px-6 py-4 gap-4">
              <div className="flex items-center">
                <img
                  src="/assets/images/svg/time.svg"
                  alt="Service Time"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="ml-3 text-sm text-black">11:00am</span>
              </div>
              <div className="flex items-center sm:ml-6">
                <img
                  src="/assets/images/svg/map.svg"
                  alt="Map Icon"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <address className="ml-3 text-sm text-black not-italic leading-snug text-left">
                  2221 Nambusunhwan-ro,
                  <br />
                  Seocho-gu, Seoul
                </address>
              </div>
            </div>

            {/* Weekly Paper */}
            <div className="w-full max-w-[486px] mt-6 sm:mt-8 bg-white rounded-[12px] px-6 py-5 shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between text-center lg:text-left">
                <div>
                  <h4 className="text-xl font-bold text-black">WEEKLY PAPER</h4>
                  <p className="mt-2 text-sm text-gray-600">
                    Check out the latest church Weekly paper
                  </p>
                </div>
                <a
                  href="/weekly-paper"
                  className="mt-4 lg:mt-0 text-sm font-medium text-white bg-black hover:bg-gray-600 rounded-full px-5 py-2 transition self-center lg:self-auto"
                >
                  View Weekly paper
                </a>
              </div>
            </div>
          </div>

          {/* Events Section */}
          <section className="mt-[61px] pt-[24px] flex justify-between flex-col lg:flex-row">
            <div className="w-full lg:w-[200px] mb-6 lg:mr-[138px]">
              <h3 className="text-h3 font-bold">EVENTS</h3>
              <Link
                href={"/events"}
                aria-label="events"
                className="mt-[23px] flex items-center"
              >
                <span className="mr-[14px] text-sm tracking-[0.1rem]">
                  LEARN MORE
                </span>
                <img
                  src="/assets/images/svg/plus.svg"
                  alt="See more events"
                  className="h-4 w-4"
                />
              </Link>
            </div>

            {/* Slide */}
            <div className=" flex overflow-x-auto scroll-smooth thin-scrollbar space-x-4">
              {(eventsData || []).map((data, i) => (
                <article
                  key={i}
                  className="min-w-[280px] sm:w-[327px] flex-shrink-0"
                >
                  <div
                    className="h-[220px] sm:h-[266px] pt-[10px] pl-[10px] bg-gray-300 rounded-[12px] bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${data.img_url || "/assets/images/default-event.jpg"})`,
                    }}
                  >
                    <span className="inline-block p-[4px] rounded-[6px] text-[13px] bg-white">
                      {data.status}
                    </span>
                    <div className="w-[56px] h-[1px] mt-[28px] bg-white" />
                    <h4 className="mt-[14px] text-lg sm:text-h3 text-white">
                      {data.title}
                    </h4>
                  </div>

                  <p className="mt-[10px] text-base font-medium">
                    {data.title}
                  </p>
                  <p className="mt-[10px] text-base font-medium">{data.date}</p>
                  <p className="mt-[4px] text-lightGray text-sm">{data.time}</p>
                </article>
              ))}
            </div>
          </section>
          <section>
            <div className="mt-[85px] relative">
              <div className="flex justify-center items-center">
                <h3 className="text-h3 font-bold">SEARCH PASTOR’s MESSAGE</h3>
              </div>
            </div>

            <div className="mt-[25px] flex justify-center items-center">
              <div className="w-[616px] h-[53px] pl-[18px] flex justify-start items-center bg-gray5 rounded-[17px]">
                <img src="/assets/images/svg/zoom-icon.svg" />
                <input
                  type="text"
                  placeholder="Type anything you need"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => handleSearch(e)}
                  className="ml-[29px] w-full bg-transparent border-none outline-none"
                />
              </div>
            </div>

            <div className="mt-[26px] flex  w-max mx-auto">
              {["Discpleship", "Fellowship", "Happiness", "Blessings"].map(
                (keyword) => (
                  <button
                    key={keyword}
                    onClick={() => {
                      setQuery(keyword);
                      handleSearch(null, keyword);
                    }}
                    className="py-[8px] px-[14px] mr-[16px] text-gray-600 border border-gray-100 rounded-[8px] cursor-pointer hover:bg-gray-100 transition"
                  >
                    {keyword}
                  </button>
                )
              )}
            </div>

            <div className="mt-[26px] overflow-x-auto scroll-smooth thin-scrollbar px-4">
              <div className="flex gap-[16px] w-max mx-auto">
                {searchData.map((data, i) => (
                  <article
                    key={i}
                    className="min-w-[240px] max-w-[240px] flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-100 cursor-pointer"
                  >
                    <a
                      href={data.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3"
                    >
                      <img
                        src={data.thumbnail}
                        alt="Thumbnail"
                        className="w-full h-[135px] rounded-md object-cover"
                      />
                      <p className="mt-2 text-sm font-medium text-gray-800 line-clamp-2">
                        {data.title}
                      </p>
                    </a>
                  </article>
                ))}
              </div>
            </div>
          </section>
          {/* TODO : 디자이너님 컨펌 */}
          {/* <section>
            <div className="mt-[85px] relative">
              <div className=" flex justify-center items-center ">
                <h3 className="text-h3 font-bold">SEARCH PASTOR’s MESSAGE</h3>
              </div>
            </div>
            <div className="mt-[25px] flex justify-center items-center">
              <div className="w-[616px] h-[53px] pl-[18px] flex justify-start items-center bg-gray5 rounded-[17px]">
                <img src="/assets/images/svg/zoom-icon.svg" />
                <input
                  type="text"
                  placeholder="Type anything you need"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="ml-[29px] w-full bg-transparent border-none outline-none"
                />
              </div>
            </div>
            <div className="mt-[26px] justify-center items-center flex overflow-x-auto scroll-smooth thin-scrollbar"></div>
            <div className="flex justify-center">
              {[
                "Encourage",
                "Discpleship",
                "Fellowship",
                "Happiness",
                "Blessings",
              ].map((data) => {
                return (
                  <button className="py-[8px] px-[14px] mr-[16px] text-gray-600 border border-gray-100 rounded-[8px] cursor-pointer hover:bg-gray-100 transition">
                    {data}
                  </button>
                );
              })}
            </div>
            <div className="mt-[26px] flex flex-col gap-[24px] lg:flex-row lg:overflow-x-auto lg:scroll-smooth lg:thin-scrollbar">
              {(searchData || []).map((data, i) => (
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
          </section> */}
          <section>
            <div className="mt-[64px] relative flex flex-col">
              <div className="flex justify-center items-center">
                <h3 className="text-h3 font-bold">LATEST MESSAGE</h3>
              </div>

              {/* ✅ 모바일: 아래에 배치, 데스크탑: 오른쪽 상단 고정 */}
              <button className="mt-[16px]  flex items-center justify-center lg:absolute lg:top-[-10px] lg:right-[54px]">
                <Link
                  href={"/sermon"}
                  aria-label="sermon"
                  className="mt-[23px] flex items-center"
                >
                  <span className="mr-[14px]  text-sm leading-[100%] tracking-[0.1rem]">
                    SEE MORE
                  </span>
                  <img
                    src="/assets/images/svg/plus.svg"
                    alt="See more events"
                    className="h-4 w-4 mt-[-2px]"
                  />
                </Link>
              </button>
            </div>

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
          </section>
          <section className="mt-[80px] mb-[61px]">
            <div
              className="bg-purple-300 h-[323px] rounded-[14px] flex flex-col items-center justify-center text-center"
              style={{
                backgroundImage: "url('/assets/images/main-back-image2.png')",
              }}
            >
              <div className="text-div font-bold text-white">
                GET TO KNOW US
              </div>
              <h3 className="mt-[38px] text-h3 font-bold text-white">
                WHAT IS RADICAL OBEDIENCE?
              </h3>
              <div className="flex mt-[39px] ">
                <Link
                  href={"/about"}
                  className="py-2 px-[14px] mr-[12px] border border-white border-[1.5px] rounded-[8px] text-button text-white  tracking-[0.1rem] cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
                  aria-label="about us"
                >
                  ABOUT US
                </Link>
                <Link
                  href={"/beliefs"}
                  className="py-2 px-[14px] border border-white border-[1.5px] rounded-[8px] text-button text-white  tracking-[0.1rem] cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
                  aria-label="our beliefs"
                >
                  OUR BELIEFS
                </Link>
              </div>
            </div>
          </section>
        </section>
        {/* </div> */}
      </main>
      {/* )} */}
    </>
  );
}
