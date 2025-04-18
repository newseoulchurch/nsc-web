"use client"
import { Button } from "@/components/ui/button"
import React from "react"
import Image from "next/image"
import ParkingInfo from "@/app/visit/parking-info"
import PublicTransportInfo from "@/app/visit/public-transport-info"
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"
import OurServices from "@/app/visit/our-services"

export default function VisitPage() {
  const churchLocation = {
    lat: 37.4798789,
    lng: 126.9939103,
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col gap-8 px-14 py-6 w-full">
        <div className="text-left text-2xl font-bold uppercase">Visit Us</div>
        <div className="text-left flex flex-col gap-4 text-lg w-full md:w-[450px]">
          Whether you are new to faith or seeking a church home, we invite you
          to join us and be part of a Christ-centered community committed to
          spiritual growth and service.
        </div>

        <Button
          onClick={() => {
            // window.open("https://forms.gle/234567890", "_blank")
          }}
          className="w-fit uppercase cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
          size="sm"
          variant="outline"
        >
          Registration
        </Button>

        <Image
          className="w-full"
          src="/assets/images/nsc-stage.png"
          alt="NSC Stage"
          width={1190}
          height={1000}
        />
      </div>

      <OurServices />

      <div className="flex flex-col gap-9 px-14 py-6 w-full">
        <div className="text-left text-2xl font-bold uppercase">Location</div>
        <div className="w-full h-[375px] !rounded-lg">
          <APIProvider apiKey={process.env.GOOGLE_MAPS_API_KEY ?? ""}>
            <Map
              style={{ width: "100%", height: "370px", borderRadius: "10px" }}
              defaultCenter={churchLocation}
              defaultZoom={15}
              gestureHandling={"greedy"}
              disableDefaultUI={true}
            />
            <Marker position={churchLocation} />
          </APIProvider>
        </div>

        <div className="flex flex-col gap-16 pb-16">
          <div className="flex justify-center flex-row items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="w-fit uppercase cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Google Map
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-fit uppercase cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Kakao Map
            </Button>
          </div>
          <ParkingInfo />

          <PublicTransportInfo />
        </div>
      </div>
    </div>
  )
}
