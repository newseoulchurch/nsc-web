import { TEvents } from "@/types/events";
import Image from "next/image";
import { useState } from "react";

interface EventCardProps {
  data: TEvents;
  priority?: boolean;
}

export function EventCard({ data, priority = false }: EventCardProps) {
  const [imgSrc, setImgSrc] = useState(
    data.img_url || "/assets/images/events/event1.png"
  );

  return (
    <article className="min-w-[280px] sm:w-[327px] flex-shrink-0">
      <div className="relative h-[220px] sm:h-[266px] pt-[10px] pl-[10px] bg-gray-300 rounded-[12px] overflow-hidden">
        <Image
          src={imgSrc}
          alt={data.title}
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          sizes="(max-width: 640px) 280px, 327px"
          priority={priority}
          onError={() => {
            console.warn("이미지 로드 실패, 기본 이미지로 대체합니다:", imgSrc);
            setImgSrc("/assets/images/events/event1.png");
          }}
        />
        <span className="absolute top-[10px] left-[10px] inline-block p-[4px] rounded-[6px] text-[13px] bg-white z-10">
          {data.status}
        </span>
        <div className="absolute top-[38px] left-[10px] w-[56px] h-[1px] mt-[28px] bg-white z-10" />
        <h4 className="absolute top-[67px] left-[10px] mt-[14px] text-lg sm:text-h3 text-white z-10">
          {data.title}
        </h4>
      </div>
      <p className="mt-[10px] text-base font-medium">{data.title}</p>
      <p className="mt-[10px] text-base font-medium">{data.date}</p>
      <p className="mt-[4px] text-lightGray text-sm">{data.time}</p>
      {data.link && (
        <p
          className="mt-[4px] text-base font-medium text-blue-600 underline cursor-pointer hover:text-blue-800 transition"
          onClick={() => window.open(data.link, "_blank")}
        >
          Application link
        </p>
      )}
    </article>
  );
}
