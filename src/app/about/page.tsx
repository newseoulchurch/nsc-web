/** @format */

import React from "react";
import Image from "next/image";
import ChurchStaff from "@/app/about/church-staff";
export default function AboutUsPage() {
  return (
    <div className="px-4 sm:px-[85px]">
      <section className="flex flex-col lg:flex-row items-center mt-[64px] sm:mt-[104px] py-[24px] sm:py-[31px] gap-6">
        <div className="lg:w-1/2 lg:pr-6 w-full text-center lg:text-left sm:pl-[25px]">
          <div className="text-3xl sm:text-4xl font-bold">WHO WE ARE</div>
          <div className="mt-5 sm:mt-[19px] text-base sm:text-[18px] leading-relaxed">
            New Seoul Church was birthed in February 2023 with a heart to be a
            new wineskin for the new wine in the Greater Seoul area. We desire
            to answer the call to reach all the corners of the city, Be a bridge
            between internationals and Korean natives, and be forerunners in
            21st century biblical obedience.
          </div>
          <div className="mt-5 sm:mt-[28px] text-base sm:text-[18px] leading-relaxed">
            We share our stories, along with fellowship, prayer times, reading
            scriptures, books.
          </div>
        </div>

        <div className="lg:w-1/2 w-full flex justify-center">
          <Image
            src="/assets/images/about/about-us-image1.jpeg"
            className="w-full max-w-[595px] h-auto sm:h-[308px] object-cover bg-gray-200 rounded-[18px]"
            alt="about-us-image1"
            width={300}
            height={300}
          />
        </div>
      </section>

      <section className="text-center mt-[64px] sm:mt-[104px] mb-[64px] sm:mb-[97px]">
        <div className="text-2xl sm:text-3xl font-bold">GET TO KNOW US</div>
        <div className="flex mt-10 sm:mt-[45px] flex-col lg:flex-row items-center gap-6">
          <div className="w-full lg:w-1/2 flex justify-center">
            <Image
              src="/assets/images/about/pjoe-and-family.jpeg"
              className="w-full max-w-[595px] h-auto sm:h-[417px] object-cover bg-gray-200 rounded-[18px]"
              alt="pjoe-and-family"
              width={200}
              height={200}
            />
          </div>
          <div className="lg:w-1/2 lg:pr-6 w-full text-center lg:text-left">
            <div className="text-2xl sm:text-3xl font-bold">
              Pastor Joe and Family
            </div>
            <div className="mt-4 sm:mt-5 text-base sm:text-[18px] leading-relaxed">
              Joe Oh - Lead pastor Joe Oh was born and raised in Anaheim, CA.
              His wife&apos;s name is Monica with two daughters, Eden and Ayla.
              He graduated from UC San Diego and got his Masters in Divinity in
              Talbot School of Theology. He has a passion for discipleship and
              loves to see men of God raised up. Joe Oh has served at Sarang
              Church Anaheim and Philippi Church OC, as the youth, English
              ministry and Vision casting pastor. He loves hiking, basketball,
              and living life with Covenant Fam.
            </div>
          </div>
        </div>
      </section>

      <ChurchStaff />
    </div>
  );
}
