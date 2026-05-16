/** @format */

import React from "react";
import Image from "next/image";
import ChurchStaff from "@/app/about/church-staff";
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description: "Meet the staff and community of New Seoul Church.",
}
export default function AboutUsPage() {
  return (
    <div className="px-4 sm:px-[85px]">
      <section className="mt-[64px] sm:mt-[104px] py-[24px] sm:py-[31px]">
        <div className="text-3xl sm:text-4xl font-bold">WHO WE ARE</div>
        <div className="mt-5 sm:mt-[19px] text-base sm:text-[18px] leading-relaxed">
          New Seoul Church was birthed in February 2023 with a heart to be a
          new wineskin for the new wine in the Greater Seoul area. We desire
          to answer the call to reach all the corners of the city, be a bridge
          between internationals and Korean natives, and be forerunners in
          21st century biblical obedience.
        </div>
        <div className="mt-5 sm:mt-[28px] text-base sm:text-[18px] leading-relaxed">
          We share our stories, along with fellowship, prayer times, reading
          scriptures, books.
        </div>
        <div className="mt-8 w-full">
          <Image
            src="/assets/images/about/about-us-image1.jpeg"
            className="w-full h-[340px] sm:h-[480px] object-cover rounded-[18px]"
            alt="NSC congregation"
            width={1200}
            height={480}
          />
        </div>
      </section>

      <section className="text-center mt-[64px] sm:mt-[104px] mb-[64px] sm:mb-[97px]">
        <div className="text-2xl sm:text-3xl font-bold">GET TO KNOW US</div>
        <div className="flex mt-10 sm:mt-[45px] flex-col lg:flex-row items-start gap-8 bg-gray-50 rounded-[18px] p-6 sm:p-10">
          <div className="w-full lg:w-[38%] flex justify-center flex-shrink-0">
            <Image
              src="/assets/images/about/pjoe-and-family.jpeg"
              className="w-full max-w-[420px] h-auto sm:h-[480px] object-cover rounded-[14px]"
              alt="Pastor Joe and family"
              width={420}
              height={480}
            />
          </div>
          <div className="lg:w-[62%] w-full text-center lg:text-left">
            <div className="text-2xl sm:text-3xl font-bold">
              Pastor Joe, Monica, Eden and Ayla Oh
            </div>
            <div className="mt-4 sm:mt-5 text-base sm:text-[18px] leading-relaxed">
              The Oh Family Ethos is &ldquo;Putting Jesus first.&rdquo; As a
              pastor&apos;s son and grandson, P. Joe&apos;s story involves a
              call before the call, and truly learning to make a birthed faith,
              his. Monica&apos;s passion is to model Godly couple, Godly family.
              Consequently, their passion is to model for their kids what it
              means to live out the Kingdom prerogative, together. If there is
              one phrase to describe P.Joe it is &ldquo;That&apos;s Life.&rdquo;
              Always trying to see the blessing in all circumstances, P.Joe
              finds joy and learning in the journey. This journey includes being
              born and raised in Orange County, California, college in University
              of California, San Diego (UCSD), and seminary at Talbot School of
              Theology, Biola. Ordained in the Presbyterian Church of America
              (PCA), God called P.Joe out to Korea with a call to bring the
              gospel to Asia. P.Joe loves challenges (Hiking, biking, Basketball,
              all things active) and commits to lead others to grow closer to
              Jesus and to grow to be more like Him.
            </div>
          </div>
        </div>
      </section>

      <ChurchStaff />
    </div>
  );
}
