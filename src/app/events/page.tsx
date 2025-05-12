"use client";
import { TEvents } from "@/types/events";
import { useEffect, useState } from "react";
import { EventCardList } from "@/components/EventCardList";
import Image from "next/image";

export default function EventsPage() {
  const CARD_WIDTH = 390 + 120;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [eventsData, setEventsData] = useState<TEvents[]>([]);

  const upcomingEvents = eventsData.filter((event) => {
    return event.status === "upcoming";
  });

  const pastEvents = eventsData.filter((event) => {
    return event.status === "past";
  });

  const maxIndex = Math.max((eventsData || []).length - 3, 0);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const renderEventCard = (data: TEvents, i: number) => (
    <article key={i} className="mt-8 sm:mt-[33px] min-w-[280px] sm:w-[327px] flex-shrink-0 ">
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
        <h4 className="mt-[14px] text-lg sm:text-h3 text-white">{data.title}</h4>
      </div>

      <p className="mt-[10px] text-base font-medium">{data.title}</p>
      <p className="mt-[10px] text-base font-medium">{data.date}</p>
      <p className="mt-[4px] text-lightGray text-sm">{data.time}</p>
    </article>
  );
  async function getEvents() {
    const res = await fetch("/api/events");
    const data = await res.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = data.map((event: TEvents) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      const status = eventDate < today ? "past" : "upcoming";
      return { ...event, status };
    });

    setEventsData(enriched);
  }
  useEffect(() => {
    getEvents();
  }, []);
  return (
    <div className="px-4 sm:px-[55px]">
      <section className="flex flex-col lg:flex-row items-center mt-[77px] py-[31px] gap-6">
        <div className="lg:w-1/2 lg:pr-6 w-full text-center lg:text-left">
          <div className="text-3xl sm:text-4xl font-bold">EVENTS</div>
          <div className="mt-4 sm:mt-[28px] text-sm sm:text-base">
            Celebrating our life together as a church is such a blessing.
            <br />
            There are many events going on throughout the year.
          </div>
        </div>
        <div className="lg:w-1/2 w-full">
          <div className="relative w-full h-[200px] sm:h-[308px] bg-gray-200 rounded-[18px] overflow-hidden">
            <Image
              src="/assets/images/event-main-photo1.avif"
              alt="Event Main Photo"
              fill
              sizes="(max-width: 640px) 100vw, 100vw"
              style={{ objectFit: "cover" }}
              className="rounded-[18px]"
            />
          </div>
        </div>
      </section>
      <EventCardList eventsData={upcomingEvents} />

      <section className="mt-[65px] mb-[27px]">
        <div className="text-2xl sm:text-h3 font-bold text-center sm:text-left mb-6">PAST</div>
        <EventCardList eventsData={pastEvents} />

        {/* TODO: after events setting more */}
        {/* <div className="flex justify-center mt-8 mb-[27px]">
          <button
            className="px-[14px] h-[34px] border-2 border-black rounded-[8px] text-sm tracking-[0.1rem]"
            aria-label="See more events"
          >
            SEE MORE
          </button>
        </div> */}
      </section>
    </div>
  );
}
