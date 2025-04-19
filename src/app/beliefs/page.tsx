import VisionCards from "./VisionCards";

export default function LifeGroupPage() {
  return (
    <div>
      <section className="h-[300px] sm:h-[436px] flex justify-center items-center px-4">
        <h1 className="text-[28px] sm:text-h1 font-bold uppercase text-center">
          our beliefs
        </h1>
      </section>

      <section className="py-[16px] px-4 sm:px-[54px]">
        <div className="w-full h-[200px] sm:h-[261px] bg-[#191b2c] rounded-[12px]">
          <div className="flex flex-col items-center justify-center h-full text-center px-2">
            <h1 className="font-bold uppercase text-white text-[18px] sm:text-[20px]">
              our vision
            </h1>
            <h1 className="font-bold uppercase text-white text-[24px] sm:text-[28px] mt-[20px] sm:mt-[32px]">
              Made New to Make New
            </h1>
          </div>
        </div>
      </section>

      <section className="py-[16px] px-4 sm:px-[54px] relative">
        <img
          className="w-full h-[300px] sm:h-full object-cover rounded-[12px]"
          src="/assets/images/ourbeliefs/Our-belief-image1.png"
          alt="Our Belief"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-bold uppercase text-black text-[18px] sm:text-[20px]">
            our mission
          </h1>
          <h1 className="font-bold text-black text-[22px] sm:text-[28px] mt-[20px] sm:mt-[32px] max-w-[800px]">
            Reviving Christian Witness
            <br /> in the Greater Seoul area
            <br /> through Radical Obedience
          </h1>
        </div>
      </section>

      {/* Core Commitments */}
      <section>
        <div className="relative mt-[27px] w-full">
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{
              backgroundImage: `url("/assets/images/ourbeliefs/beliefs-bg.png")`,
            }}
          />
          <div
            className="absolute inset-0 z-10"
            style={{ backgroundColor: "#121320", opacity: 0.1 }}
          />

          <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 py-[60px]">
            <h4 className="text-[24px] sm:text-[32px] font-bold text-white mb-8 max-w-[800px]">
              OUR 7 CORE COMMITMENTS TO RADICAL OBEDIENCE
            </h4>

            <div className="w-full max-w-[1000px]">
              <VisionCards />
            </div>
          </div>
        </div>
      </section>

      {/* Confessional Statement */}
      <section className="py-[16px] px-4 sm:px-[54px] mt-[90px]">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="font-bold uppercase text-[18px] sm:text-[20px] mb-[24px] sm:mb-[38px]">
            CONFESSIONAL STATEMENT
          </h1>
          <div className="w-full max-w-[800px] shadow-xl overflow-hidden border border-gray-300 rounded-[12px]">
            <iframe
              src="/assets/pdfs/confessional.pdf#zoom=page-width"
              title="Confessional Statement"
              className="w-full h-[500px] sm:h-[800px]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
