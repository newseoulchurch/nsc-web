"use client"
import { useState } from "react"

export default function EventsPage() {
  const CARD_WIDTH = 390 + 120
  const [currentIndex, setCurrentIndex] = useState(0)
  const eventsTestData = [
    {
      status: "upcoming",
      title: "DICSIPLESHIP TRAINING",
      date: "Feb 12",
      img_url: "",
    },
    { status: "upcoming", title: "EASTER SUNDAY", date: "Feb 12", img_url: "" },
    { status: "upcoming", title: "BAPTISM", date: "Feb 12", img_url: "" },
    { status: "upcoming", title: "BAPTISM", date: "Feb 12", img_url: "" },
    { status: "past", title: "BAPTISM", date: "Feb 12", img_url: "" },
    { status: "past", title: "BAPTISM", date: "Feb 12", img_url: "" },
    { status: "past", title: "BAPTISM", date: "Feb 12", img_url: "" },
  ]

  const maxIndex = Math.max(eventsTestData.length - 3, 0)

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const renderEventCard = (data, i) => (
    <div key={i} className="mt-8 sm:mt-[33px] w-full max-w-[390px]">
      <div className="relative w-full h-[266px] bg-gray-600 rounded-[12px]">
        <div className="absolute top-[62px] left-[10px] w-[56px] h-[1px] border border-white" />
        <div className="absolute top-[76px] left-[12px] text-[20px] text-white font-semibold">
          {data.title}
        </div>
      </div>
      <div className="font-bold mt-[10px] text-sm sm:text-base">
        {data.title}
      </div>
      <div className="text-sm text-gray-500">{data.date}</div>
    </div>
  )

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
          <img
            src="/assets/images/event-main-photo1.jpeg"
            className="w-full h-[200px] sm:h-[308px] bg-gray-200 rounded-[18px]"
          />
        </div>
      </section>
      <div className="relative mt-[30px]">
        {/* 좌우 버튼 */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 text-xl sm:text-2xl font-bold text-gray-400 disabled:opacity-30"
        >
          {"<"}
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === maxIndex}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-xl sm:text-2xl font-bold text-gray-400 disabled:opacity-30"
        >
          {">"}
        </button>

        <div className="overflow-hidden px-2 sm:px-0">
          <div
            className="flex transition-transform duration-300 ease-in-out gap-[12px]"
            style={{
              transform: `translateX(-${currentIndex * CARD_WIDTH}px)`,
            }}
          >
            {eventsTestData.map((data, i) => (
              <div
                key={i}
                className="w-[270px] sm:w-[300px] md:w-[390px] flex-shrink-0 bg-gray-600 rounded-[12px] h-[220px] sm:h-[266px] relative"
              >
                <div className="absolute top-[48px] sm:top-[62px] left-[10px] w-[56px] h-[1px] border border-white" />
                <div className="absolute top-[66px] sm:top-[76px] left-[12px] text-[16px] sm:text-[20px] text-white font-semibold">
                  {data.title}
                </div>
                <div className="absolute bottom-[12px] left-[12px] text-white text-sm sm:text-base font-bold">
                  {data.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-[65px]">
        <div className="text-2xl sm:text-h3 font-bold">PAST</div>
        <div className="flex flex-wrap gap-4 mt-6 justify-start sm:justify-normal">
          {eventsTestData
            .filter((e) => e.status === "past")
            .map(renderEventCard)}
        </div>

        <div className="flex justify-center mt-8 mb-[27px]">
          <button
            className="px-[14px] h-[34px] border-2 border-black rounded-[8px] text-sm tracking-[0.1rem]"
            aria-label="See more events"
          >
            SEE MORE
          </button>
        </div>
      </section>
    </div>
  )
}
