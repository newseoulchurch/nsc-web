"use client";

import UpdateBlocker from "@/components/UpdateBlocker";
import { useIsOpen } from "@/hooks/useIsOpen.ts";
import { getEventListeners } from "events";
import Link from "next/link";
import { useEffect, useState } from "react";
// import "./globals.css";

export default function Home() {
  let testData = [
    {
      tag: "Current",
      imgTitle: "DISCIPLESHIP TRAINING",
      title: "Discipleship Training",
      date: "Feb 23",
    },
    {
      tag: "Upcoming",
      imgTitle: "EASTER",
      title: "Easter Sunday",
      date: "April 20",
    },

    {
      tag: "Upcoming",
      imgTitle: "WATER BAPTISM",
      title: "Baptism",
      date: "Feb 23",
    },
  ];
  let testSermonData = [
    {
      title: "Discipleship Training",
      date: "Feb 23, 2025",
      url: "https://youtu.be/D50eTekDsDY?feature=shared",
    },
    {
      title: "Easter Sunday",
      date: "Feb 23, 2025",
      url: "https://youtu.be/kwsKd-UK4oI?feature=shared",
    },

    {
      title: "Baptism",
      date: "Feb 23, 2025",
      url: "https://youtu.be/PD4aYDCQXRI?feature=shared",
    },
  ];
  const isOpen = useIsOpen();

  if (!isOpen) return <UpdateBlocker />;
  const [youtubeData, setYoutubeData] = useState();
  const [eventsData, setEventsData] = useState();
  async function getYoutubeData() {
    try {
      const res = await fetch("/api/youtube/latest");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error.message);
      const videos = data.items.map((item: any) => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: item.snippet.publishedAt,
      }));

      // setYoutubeData(videos);
    } catch (error) {
      console.error("Failed to fetch YouTube data:", error);
      return [];
    }
  }
  // TODO
  async function getEvents() {
    const res = await fetch("/api/events");
    const data = await res.json();
    console.log("///res", res);
    console.log("data///", data);
    setEventsData(data);
  }
  useEffect(() => {
    // TODO: server 작업후
    // getYoutubeData();
    // getEvents();
  }, []);
  return (
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
          {/* TODO:Youtube api 최근 설교 불러오기 */}
          <h1 className="text-h1 font-bold">BLIND SPOTS</h1>
          <p className="mt-[22px] text-[18px] leading-[100%]">
            THE BLIND SPOTS IN OUR LIVES THAT
            <br /> STOP US FROM REFLECTING GOD’S GLORY
          </p>

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

      <section className="mt-[68px] mb-[61px] px-4  lg:px-[54px]">
        {/* Sunday Service */}
        <div
          className="h-[300px] sm:h-[376px]  rounded-[14px] flex flex-col items-center justify-center text-center bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/images/main-back-image1.jpeg')",
          }}
        >
          <h2 className="text-2xl sm:text-h2 font-bold text-white">
            JOIN US SUNDAY
          </h2>
          <div className="max-w-[486px] h-[auto] sm:h-[64px] mt-[30px] sm:mt-[51px] sm:mx-[10px] bg-white rounded-[12px] flex flex-col sm:flex-row items-center justify-center px-[57px] py-2 sm:py-0">
            <div className="flex items-center mb-2 sm:mb-0">
              <img
                src="/assets/images/svg/time.svg"
                alt="Service Time"
                className="w-4 h-4 sm:w-auto sm:h-auto"
              />
              <span className="ml-4 text-sm leading-none text-black">
                11:00am
              </span>
            </div>
            <div className="flex items-center sm:ml-6">
              <img
                src="/assets/images/svg/map.svg"
                alt="Map Icon"
                className="w-4 h-4 sm:w-auto sm:h-auto"
              />
              <address className="ml-4 text-sm leading-[120%] not-italic text-start text-black">
                2221 Nambusunhwan-ro,
                <br />
                Seocho-gu, Seoul
              </address>
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
            {testData.map((data, i) => (
              <article
                key={i}
                className="min-w-[280px] sm:w-[327px] flex-shrink-0"
              >
                <div className="h-[220px] sm:h-[266px] pt-[10px] pl-[10px] bg-gray-300 rounded-[12px]">
                  <span className="inline-block p-[4px] rounded-[6px] text-[13px] bg-white">
                    {data.tag}
                  </span>
                  <div className="w-[56px] h-[1px] mt-[28px] bg-white" />
                  <h4 className="mt-[14px] text-lg sm:text-h3 text-white">
                    {data.imgTitle}
                  </h4>
                </div>
                <p className="mt-[10px] text-base font-medium">{data.title}</p>
                <time
                  className="mt-[4px] text-lightGray text-sm"
                  dateTime={data.date}
                >
                  {data.date}
                </time>
              </article>
            ))}
          </div>
        </section>
        <section>
          {/* TODO : after open */}
          {/* <div className="mt-[85px] relative">
            <div className=" flex justify-center items-center ">
              <h3 className="text-h3 font-bold">SEARCH PASTOR’s MESSAGE</h3>
            </div> 
          </div> 
          <div className="mt-[25px] flex justify-center items-center">
            <div className="w-[616px] h-[53px] pl-[18px] flex justify-start  items-center bg-gray5 rounded-[17px]">
              <img src="/assets/images/svg/zoom-icon.svg" />
              <input
                type="text"
                placeholder="Type anything you need"
                className="ml-[29px] w-full bg-transparent border-none outline-none "
              />
            </div>
          </div> */}

          {/* TODO: 추천,태그 검색 후 불러오기 */}
          {/* <div className="mt-[26px] justify-center items-center flex overflow-x-auto scroll-smooth thin-scrollbar">
          </div>
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
          </div> */}
        </section>
        <section>
          <div className="mt-[64px] relative flex flex-col">
            <div className="flex justify-center items-center">
              <h3 className="text-h3 font-bold">LATEST MESSAGE</h3>
            </div>

            {/* ✅ 모바일: 아래에 배치, 데스크탑: 오른쪽 상단 고정 */}
            <button className="mt-[16px]  flex items-center justify-center lg:absolute lg:top-[-10px] lg:right-[54px]">
              <span className="mr-[14px]  text-sm leading-[100%] tracking-[0.1rem]">
                SEE MORE
              </span>
              <img
                src="/assets/images/svg/plus.svg"
                alt="See more events"
                className="h-4 w-4 mt-[-2px]"
              />
            </button>
          </div>

          <div className="mt-[26px] flex flex-col gap-[24px] lg:flex-row lg:overflow-x-auto lg:scroll-smooth lg:thin-scrollbar">
            {testSermonData.map((data, i) => (
              <article key={i} className="w-full lg:w-[390px] flex-shrink-0">
                <div className="w-full h-[219px] bg-gray5 rounded-[12px]" />
                <p className="mt-[10px] text-base font-medium">{data.title}</p>
                <time
                  className="mt-[4px] text-lightGray text-sm"
                  dateTime={data.date}
                >
                  {data.date}
                </time>
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
            <div className="text-div font-bold text-white">GET TO KNOW US</div>
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
  );
}
