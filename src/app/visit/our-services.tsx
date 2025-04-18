import React from "react"
import Image from "next/image"
import { Clock, MapPin } from "lucide-react"
export default function OurServices() {
  return (
    <div className="w-full relative">
      <Image
        className="w-full top-0 left-0"
        src="/assets/images/pray-time.png"
        alt="Pray Time"
        width={2000}
        height={555}
      />

      <div className="absolute top-0 left-0 w-full flex flex-col items-start justify-around px-11 py-11 gap-8 overflow-auto h-full">
        <div className="text-left text-2xl font-bold uppercase text-white">
          Our services
        </div>

        <div className="flex flex-row items-center gap-4 w-full justify-around text-white text-lg p-10 bg-opacity-25 bg-black rounded-lg">
          <div className="text-left justify-start text-xl font-bold uppercase text-white w-full">
            Sunday service
          </div>
          <div className="flex flex-row items-center gap-2 w-full">
            <Clock className="w-4 h-4 flex justify-center items-center flex-shrink-0 mb-1" />
            <div className="justify-start text-base">Sunday at 11:00 AM</div>
          </div>
          <div className="flex flex-row items-center gap-2 w-full">
            <MapPin className="w-4 h-4 flex justify-center items-center flex-shrink-0 mb-1" />
            <div className="justify-start text-base">
              Jerusalem Chapel, 2nd floor
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-4 w-full justify-around text-white text-lg p-10 bg-opacity-25 bg-black rounded-lg">
          <div className="text-left justify-start text-xl font-bold uppercase text-white w-full">
            Kids&apos; service
          </div>
          <div className="flex flex-row items-center gap-2 w-full">
            <Clock className="w-4 h-4 flex justify-center items-center flex-shrink-0 mb-1" />
            <div className="justify-start text-base">Sunday at 11:00 AM</div>
          </div>
          <div className="flex flex-row items-center gap-2 w-full">
            <MapPin className="w-4 h-4 flex justify-center items-center flex-shrink-0 mb-1" />
            <div className="justify-start text-base">1st floor</div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-4 w-full justify-around text-white text-lg p-10 bg-opacity-25 bg-black rounded-lg">
          <div className="text-left justify-start text-xl font-bold uppercase text-white w-full">
            Early morning worship
          </div>
          <div className="flex flex-row items-center gap-2 w-full">
            <Clock className="w-4 h-4 flex justify-center items-center flex-shrink-0 mb-1" />
            <div className="justify-start text-base">Saturday at 7:00 AM</div>
          </div>
          <div className="flex flex-row items-center gap-2 w-full">
            <MapPin className="w-4 h-4 flex justify-center items-center flex-shrink-0 mb-1" />
            <div className="justify-start text-base">
              Vision Hall, 4th floor
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
