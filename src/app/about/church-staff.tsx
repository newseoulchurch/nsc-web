/** @format */

import React from "react";
import Image from "next/image";

export default function ChurchStaff() {
  const churchStaffMembers = [
    {
      id: 0,
      name: "Joe Oh",
      description: "Vision Casting Pastor",
      image: "/assets/images/about/church-staff/PjoeGif.gif",
    },
    {
      id: 1,
      name: "Elias Kim",
      description: "Admin Pastor",
      image: "/assets/images/about/church-staff/PEliasGif.gif",
    },
    {
      id: 2,
      name: "Margot Chae",
      description: "Space / Kitchen",
      image: "/assets/images/about/church-staff/MargotGif.gif",
    },
    {
      id: 3,
      name: "Isak Choi",
      description: "Creative Arts",
      image: "/assets/images/about/church-staff/IsakGif.gif",
    },

    {
      id: 4,
      name: "Carmen",
      description: "Kids' Ministry",
      image: "/assets/images/about/church-staff/CarmenGif.gif",
    },
    {
      id: 5,
      name: "Monica Oh",
      description: "Hospitality",
      image: "/assets/images/about/church-staff/MonicaGif.gif",
    },
    {
      id: 6,
      name: "Eugene Hong",
      description: "Media Director / Worship",
      image: "/assets/images/about/church-staff/EugeneGif.gif",
    },
    {
      id: 7,
      name: "Jaedong Na",
      description: "Multimedia / Worship",
      image: "/assets/images/about/church-staff/JaedongGif.gif",
    },
    {
      id: 22,
      name: "Grace Na",
      description: "Fellowship",
      image: "/assets/images/about/church-staff/GraceGif.gif",
    },
    {
      id: 23,
      name: "Nabi Sanni",
      description: "Welcoming / Followup",
      image: "/assets/images/about/church-staff/NabiGif.gif",
    },

    // {
    //   id: 8,
    //   name: "Kathy",
    //   description: "Women Ministry",
    //   image: "/assets/images/about/church-staff/KathyGif.gif",
    // },
    {
      id: 9,
      name: "Sohee Kim",
      description: "Videography",
      image: "/assets/images/about/church-staff/SoheeGif.gif",
    },
    {
      id: 10,
      name: "Helen Kang",
      description: "Publication",
      image: "/assets/images/about/church-staff/HelenGif.gif",
    },
    // {
    //   id: 12,
    //   name: "Stella Jung",
    //   description: "Administration",
    //   image: "/assets/images/about/church-staff/StellaGif.gif",
    // }
    // {
    //   id: 15,
    //   name: "Lara Thompson",
    //   description: "Outreach",
    //   image: "/assets/images/about/church-staff/LaraGif.gif",
    // },
    // {
    //   id: 16,
    //   name: "Emily Jystad",
    //   description: "Welcoming",
    //   image: "/assets/images/about/church-staff/EmilyGif.gif",
    // },
    {
      id: 17,
      name: "Ellie Moon",
      description: "Media",
      image: "/assets/images/about/church-staff/EllieGif.gif",
    },
    {
      id: 18,
      name: "Enzo Choi",
      description: "Sports Ministry",
      image: "/assets/images/about/church-staff/EnzoGif.gif",
    },
    // {
    //   id: 19,
    //   name: "Victor Lee",
    //   description: "Facilities",
    //   image: "/assets/images/about/church-staff/VictorGif.gif",
    // },
    {
      id: 20,
      name: "Elaina Choi",
      description: "Service",
      image: "/assets/images/about/church-staff/ElainaGif.gif",
    },
    {
      id: 21,
      name: "Chanhee Lee",
      description: "Website",
      image: "/assets/images/about/church-staff/ChanheeGif.gif",
    },
  ];
  return (
    <div className=" mt-[104px] mb-[97px] items-center">
      <section className="text-center gap-16 flex flex-col ">
        <div className="text-3xl sm:text-4xl font-bold">CHURCH STAFF</div>
        <div className="text-3xl sm:text-2xl font-bold">Core staff</div>
        <div
          className="col-span-full flex justify-center"
          style={{ marginTop: "-50px" }}
        >
          <div className="w-1/2 h-[2px] bg-gray-400"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {churchStaffMembers.map((member, index) => (
            <React.Fragment key={member.id}>
              <div className="flex flex-col items-center gap-2">
                <Image
                  className="rounded-md"
                  src={member.image}
                  alt={member.name}
                  width={275}
                  height={275}
                />

                <div className="text-lg font-bold mt-[10px]">{member.name}</div>
                <div className="text-lg text-[#8F8F8F] font-bold">
                  {member.description}
                </div>
              </div>

              {/* 9번째 이후에 Divider 추가 */}
              {index === 9 && (
                <div className="col-span-full justify-center my-10">
                  <div className="text-3xl sm:text-2xl font-bold">
                    Lay staff
                  </div>
                  <div className="col-span-full flex justify-center my-3">
                    <div className="w-1/2 h-[2px] bg-gray-400"></div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}
