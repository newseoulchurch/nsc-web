import React from "react"

export default function ChurchStaff() {
  const churchStaffMembers = [
    {
      id: 0,
      name: "Pastor Joe Oh",
      description: "Vision Casting Pastor",
      image: "/assets/images/pjoe-and-family.jpeg",
    },
  ]
  return (
    <section className="text-center mt-[104px] mb-[97px]">
      <div className="text-3xl sm:text-4xl font-bold">CHURCH STAFF</div>
    </section>
  )
}
