export default function LifeGroupPage() {
  return (
    <div>
      <section className="h-[436px] flex justify-center items-center ">
        <h1 className="text-h1 font-bold uppercase">our beliefs</h1>
      </section>
      <section className="py-[16px] px-[54px]">
        <div className="w-full h-[261px] bg-[#191b2c] rounded-[12px]">
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="font-bold uppercase text-white text-[20px]">
              our vision
            </h1>
            <h1 className="font-bold uppercase text-white text-[28px] mt-[32px]">
              Made New to Make New
            </h1>
          </div>
        </div>
      </section>
      <section className="py-[16px] px-[54px] relative">
        <img
          className="w-full h-full object-cover rounded-[12px]"
          src="/assets/images/Our-belief-image1.png"
          alt="Our Belief"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-bold uppercase text-black text-[20px]">
            our mission
          </h1>
          <h1 className="font-bold  text-black text-[28px] mt-[32px] max-w-[800px]">
            Reviving Christian Witness
            <br /> in the Greater Seoul area <br /> through Radical Obedience
          </h1>
        </div>
      </section>
    </div>
  )
}
