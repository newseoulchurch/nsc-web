"use client";

export default function WeeklyPage() {
  return (
    <>
      <section className="py-[16px] px-4 sm:px-[54px]">
        <div className="w-full h-[90px] sm:h-[160px] bg-[#191b2c] rounded-[12px]">
          <div className="flex flex-col items-center justify-center h-full text-center px-2">
            <h1 className="font-bold uppercase text-white text-[24px] sm:text-[38px] ">
              WEEKLY PAPER
            </h1>
          </div>
        </div>
      </section>
      <section className="py-[16px] px-4 sm:px-[54px]">
        <div className="w-full bg-[#e9e9e9] rounded-[12px] overflow-hidden">
          <div className="flex flex-col items-center justify-center text-center gap-6 py-6">
            <img
              src="/assets/images/weekly/1.png"
              alt="Weekly Paper 1"
              className="w-full max-w-[768px] h-auto rounded-lg shadow-lg"
            />
            <img
              src="/assets/images/weekly/2.png"
              alt="Weekly Paper 2"
              className="w-full max-w-[768px] h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>
    </>
  );
}
