import React, { useState } from "react";

export default function Address() {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      alert("Copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-left text-2xl font-bold uppercase">Address</div>

      <div className="text-left flex flex-col gap-4 text-lg w-full md:w-[735px]">
        <div style={{ display: "flex" }}>
          <span> 서울특별시 서초구 남부순환로 2221</span>
          <button
            onClick={() => handleCopy("서울특별시 서초구 남부순환로 2221")} // 익명 함수로 호출
            className="ml-2 text-blue-500 hover:text-blue-700"
          >
            <div style={{ width: "20px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z" />
              </svg>
            </div>
          </button>
        </div>
        <div style={{ display: "flex" }}>
          <span>2221, Nambu Circular Road, Seocho-gu, Seoul, South Korea</span>
          <button
            onClick={
              () =>
                handleCopy(
                  "2221, Nambu Circular Road, Seocho-gu, Seoul, South Korea"
                ) // 익명 함수로 호출
            }
            className="ml-2 text-blue-500 hover:text-blue-700"
          >
            <div style={{ width: "20px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L400 115.9 400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-32-48 0 0 32c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l32 0 0-48-32 0z" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
