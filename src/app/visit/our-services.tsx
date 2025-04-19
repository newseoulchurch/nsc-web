import React from "react";
import Image from "next/image";
import { Clock, MapPin } from "lucide-react";

export default function OurServices() {
  return (
    <div className="w-full relative">
      <div className="w-full relative min-h-[555px]">
        <Image
          className="w-full h-[555px] object-cover rounded-md"
          src="/assets/images/pray-time.png"
          alt="Pray Time"
          width={2000}
          height={555}
        />

        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-start justify-around px-4 sm:px-11 py-6 sm:py-11 gap-6 sm:gap-8">
          <div className="absolute top-0 left-0 w-full flex flex-col items-start justify-around px-4 sm:px-11 py-6 sm:py-11 gap-6 sm:gap-8 h-full">
            <div className="text-left text-xl sm:text-2xl font-bold uppercase text-white">
              Our services
            </div>

            {[
              {
                title: "Sunday service",
                time: "Sunday at 11:00 AM",
                location: "Jerusalem Chapel, 2nd floor",
              },
              {
                title: "Kids' service",
                time: "Sunday at 11:00 AM",
                location: "1st floor",
              },
              {
                title: "Early morning worship",
                time: "Saturday at 7:00 AM",
                location: "Vision Hall, 4th floor",
              },
            ].map((service, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center gap-4 w-full text-white text-sm sm:text-lg p-4 sm:p-10 bg-opacity-25 bg-black rounded-lg"
              >
                <div className="text-left font-bold uppercase text-white sm:w-1/3">
                  {service.title}
                </div>
                <div className="flex flex-row items-start gap-2 sm:w-1/3">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-[2px]" />
                  <div className="text-base">{service.time}</div>
                </div>
                <div className="flex flex-row items-start gap-2 sm:w-1/3">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-[2px]" />
                  <div className="text-base">{service.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
