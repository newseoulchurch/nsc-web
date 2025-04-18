"use client"
import Image from "next/image"
import { FooterPage } from "@/types/footer"
export default function Footer() {
  const pageList: FooterPage[] = [
    {
      category: "INFORMATION",
      list: [
        {
          title: "VISIT US",
          url: "/visit",
        },
        { title: "OUR BELIEFS", url: "/beliefs" },
        {
          title: "ABOUT US",
          url: "/about",
        },
      ],
    },
    {
      category: "CONNECT",
      list: [
        {
          title: "EVENTS",
          url: "/events",
        },
        { title: "LIFE GROUP", url: "/life-group" },
      ],
    },
    {
      category: "WATCH",
      list: [
        {
          title: "SERMON SERIES",
          url: "/sermon",
        },
        { title: "YOUTUBE", url: "https://www.youtube.com/@newseoulchurch" },
      ],
    },
    {
      category: "SOCIAL MEDIA",
      list: [
        {
          title: "INSTAGRAM",
          url: "https://www.instagram.com/nsc_newseoulchurch/",
        },
      ],
    },
  ]

  return (
    <footer className="bg-black py-[39px] px-[54px]">
      <div className="flex flex-col md:flex-row justify-between">
        {/* 로고 + @NSC */}
        <div className="flex flex-col items-center md:items-start">
          <Image
            src="/assets/images/svg/logo-white.svg"
            alt="Logo"
            width={258}
            height={32}
          />
        </div>

        {/* 메뉴 목록 */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 mt-[40px] md:mt-0">
          {pageList.map((data, i) => (
            <div key={i} className="flex flex-col text-center md:text-left">
              <div className="text-white font-bold mb-2">{data.category}</div>
              <div className="flex flex-col gap-1">
                {data.list.map((_list, j) => (
                  <a
                    onClick={() => {
                      router.push(_list.url)
                    }}
                    target="_self"

                    key={j}
                    href={_list.url}
                    className="text-gray4 font-bold text-sm hover:text-white"
                  >
                    {_list.title}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center md:items-start">
        <div className="mt-[60px] text-white leading-[100%] text-sm">@NSC</div>
      </div>
    </footer>
  )
}
