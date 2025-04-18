"use client"
import { useSlider } from "@/hooks/useSlider"

export default function LifeGroupPage() {
  // TODO : PJOES CONFIRM
  const contents = [
    {
      title: "+ HOW ARE WE MEETING",
      content:
        "Lifegroup is after lunchtime from 1:30-3:30 pm on Sundays, in meeting rooms throughout our church. ",
    },
    {
      title: "+ WHAT TO EXPECT",
      content:
        "A safe, honest and powerful discussion on some of the pertinent topics of the day. Reflecting on what would Jesus do?",
    },
    {
      title: "+ Who should come? ",
      content:
        "Those that want to live life together with like-minded people. We believe that life people make us better, they challenge us and encourage us to become more like Christ. ",
    },
  ]
  // TODO: booklist 받기
  const bookList = [
    {
      title:
        "Habits of Grace: Enjoying Jesus Through the Spiritual Disciplines",
      author: "by David Mathis",
      img: "/assets/images/habits-of-grace.png",
    },
    {
      title:
        "Habits of Grace: Enjoying Jesus Through the Spiritual Disciplines",
      author: "by David Mathis",
      img: "/assets/images/habits-of-grace.png",
    },
    {
      title:
        "Habits of Grace: Enjoying Jesus Through the Spiritual Disciplines",
      author: "by David Mathis",
      img: "/assets/images/habits-of-grace.png",
    },
    {
      title:
        "Habits of Grace: Enjoying Jesus Through the Spiritual Disciplines",
      author: "by David Mathis",
      img: "/assets/images/habits-of-grace.png",
    },
  ]

  const CARD_WIDTH = 203 + 78
  const visibleCount = 1

  const { handlePrev, handleNext, translateX, isFirst, isLast } = useSlider(
    bookList,
    visibleCount,
    CARD_WIDTH,
  )
  return (
    <div className="px-4 sm:px-[55px]">
      <section className="flex flex-col lg:flex-row items-center mt-[77px] py-[31px] gap-6">
        <div className="lg:w-1/2 lg:pr-6 w-full text-center lg:text-left">
          <div className="text-3xl sm:text-4xl font-bold">LIFE GROUP</div>
          <div className="mt-4 sm:mt-[19px] text-[18px] ">
            At NSC, we gather after Sunday Service as a group through which we
            pray together, learn, grow in faith. We as a group aspire to be a
            witness of God’s presence.
          </div>
          <div className="mt-4 sm:mt-[28px] text-[18px] ">
            We share our stories, along with fellowship, prayer times, reading
            scriptures, books.
          </div>
          {/* TODO : Join lifegroup 링크 */}
          <button className="py-[8px] px-[14px] mt-[36px] border border-black border-[1.5px] rounded-[8px] text-button font-medium tracking-[0.1rem] cursor-pointer hover:bg-black hover:text-white transition-colors duration-200">
            JOIN LIFEGROUP
          </button>
        </div>
        <div className="lg:w-1/2 w-full">
          <img
            src="/assets/images/life-group-photo1.JPG"
            className="w-full h-[200px] sm:h-[308px] bg-gray-200 rounded-[18px]"
          />
        </div>
      </section>
      <section className="flex flex-col lg:flex-row items-center mt-[85px] py-[31px] gap-6">
        <div className="hidden lg:flex lg:items-center lg:justify-center lg:w-1/2">
          <img
            src="/assets/images/life-group-photo2.png"
            className="w-auto max-w-[800px] h-[200px] sm:h-[308px] rounded-[18px]"
          />
        </div>
        <div className="lg:w-1/2 lg:pr-6 w-[470px] text-center lg:text-left">
          {contents.map((data, index) => {
            return (
              <div className="mt-[29px]" key={index}>
                <div className="font-medium">{data.title}</div>
                <div className="w-full h-[1px] bg-black mt-[15px]" />
                <div className="mt-[15px]">{data.content}</div>
              </div>
            )
          })}
        </div>
      </section>
      <section className="text-center mt-[104px] mb-[97px]">
        <div className="font-bold text-[28px]">
          LISTS OF BOOKS WE READ IN OUR LIFE GROUP
        </div>
        <div className="flex justify-center">
          <div className="relative mt-[45px]  w-full flex justify-center">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className="absolute left-2 sm:left-[-40px] top-1/2 -translate-y-1/2 z-30 
             w-10 h-10 flex items-center justify-center 
             bg-white text-gray-600 text-xl font-bold 
             disabled:opacity-30"
            >
              {"<"}
            </button>
            <button
              onClick={handleNext}
              disabled={isLast}
              className="absolute right-2 sm:right-[-40px] top-1/2 -translate-y-1/2 z-30 
             w-10 h-10 flex items-center justify-center 
             bg-white  text-gray-600 text-xl font-bold 
             disabled:opacity-30"
            >
              {">"}
            </button>

            <div className="overflow-hidden flex items-center">
              <div
                className="flex transition-transform duration-300 gap-[78px]"
                style={{
                  transform: `translateX(-${translateX}px)`,
                }}
              >
                {bookList.map((data, index) => (
                  <div
                    key={index}
                    className="w-[203px] sm:w-[203px] flex-shrink-0"
                  >
                    <img
                      src={data.img}
                      className="h-[auto] max-h-[308px] w-[203px] rounded-[10px] object-cover"
                    />
                    <div className="text-[16px] mt-[21px] text-left">
                      {data.title}
                    </div>
                    <div className="text-[16px] mt-[11px] text-left text-[#A8A8A8]">
                      {data.author}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
