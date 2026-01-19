"use client";
import { Button } from "@/components/ui/button";
import React from "react";
import Image from "next/image";
import ParkingInfo from "@/app/visit/parking-info";
import PublicTransportInfo from "@/app/visit/public-transport-info";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import OurServices from "@/app/visit/our-services";
import Address from "./address";

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
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3166.423826164946!2d126.99362163411561!3d37.4743237354116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca055b964e8c9%3A0x3190e40b3f6b0496!2z7ISc7Jq47Yq567OE7IucIOyEnOy0iOq1rCDrgqjrtoDsiJztmZjroZwgMjIyMQ!5e0!3m2!1sko!2skr!4v1768785706319!5m2!1sko!2skr"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
            title="Google Map"
          />
        </div>
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
        <Address />
        <ParkingInfo />
        <PublicTransportInfo />
      </div>
    </div>
  );
}
