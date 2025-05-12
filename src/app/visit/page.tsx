"use client";
import { Button } from "@/components/ui/button";
import React from "react";
import Image from "next/image";
import ParkingInfo from "@/app/visit/parking-info";
import PublicTransportInfo from "@/app/visit/public-transport-info";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import OurServices from "@/app/visit/our-services";

export default function VisitPage() {
  const churchAddress = "서초구 남부순환로 2221";
  const churchLocation = {
    lat: 37.4798789,
    lng: 126.9939103,
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col gap-8 px-4 sm:px-14 py-6 w-full max-w-[1024px]">
        <div className="text-left text-2xl font-bold uppercase">Visit Us</div>

        <p className="text-left text-base sm:text-lg leading-relaxed">
          Whether you are new to faith or seeking a church home, we invite you
          to join us and be part of a Christ-centered community committed to
          spiritual growth and service.
        </p>

        <Button
          onClick={() => {
            window.open("https://forms.gle/bKFKyNPStafuStbDA", "_blank");
          }}
          className="w-fit uppercase cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
          size="sm"
          variant="outline"
        >
          Registration
        </Button>

        <Image
          className="w-full rounded-md"
          src="/assets/images/nsc-stage.avif"
          alt="NSC Stage"
          width={1190}
          height={1000}
        />
      </div>

      <div className="w-full max-w-[1024px] px-4 sm:px-14">
        <OurServices />
      </div>

      <div className="flex flex-col gap-9 px-4 sm:px-14 py-6 w-full max-w-[1024px]">
        <div className="text-left text-2xl font-bold uppercase">Location</div>

        <div className="w-full h-[375px] rounded-lg overflow-hidden">
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
              <Map
                style={{ width: "100%", height: "100%" }}
                defaultCenter={churchLocation}
                defaultZoom={15}
                gestureHandling="greedy"
                disableDefaultUI={true}
              />
              <Marker position={churchLocation} />
            </APIProvider>
          ) : (
            <div>Loading...</div>
          )}
        </div>

        <div className="flex flex-col gap-16 pb-16">
          <div className="flex justify-center flex-wrap gap-4">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(churchAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="uppercase cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
              >
                Google Map
              </Button>
            </a>
            {/* TODO: kakao api 연결시 */}
            {/* <Button
              variant="outline"
              size="sm"
              className="uppercase cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Kakao Map
            </Button> */}
          </div>
          <ParkingInfo />
          <PublicTransportInfo />
        </div>
      </div>
    </div>
  );
}
