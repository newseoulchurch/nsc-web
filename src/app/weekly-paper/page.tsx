"use client";

import { useEffect, useState } from "react";
import { WeeklyImage } from "../admin/weekly-paper/page";

export default function WeeklyPage() {
  const [images, setImages] = useState<WeeklyImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weekly-upload")
      .then((res) => res.json())
      .then((data) =>
        setImages(data.filter((item) => item.date !== "unknown").reverse())
      )
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <section className="py-[16px] px-4 sm:px-[54px]">
        <div className="w-full  rounded-[12px] overflow-hidden">
          <div className="flex flex-col items-center justify-center text-center gap-6 py-6">
            {isLoading ? (
              <div className="text-gray-600 text-base animate-pulse">
                Loading...
              </div>
            ) : images.length === 0 ? (
              <div className="text-gray-500 text-base">
                No weekly paper found.
              </div>
            ) : (
              <img
                src={images[0].url}
                alt="Weekly Paper"
                className="w-full max-w-[768px] h-auto rounded-lg shadow-lg"
              />
              // 26/2/3 TODOLIST Blob store Hard lock됨
              // <img
              //   src="/assets/images/weeklypaper.png"
              //   alt="Weekly Paper"
              //   className="w-full max-w-[768px] h-auto rounded-lg shadow-lg"
              // />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
