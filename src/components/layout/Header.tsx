"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useIsOpen } from "@/hooks/useIsOpen.ts";
import UpdateBlocker from "../UpdateBlocker";

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDarkHeader = ["/sermons"].includes(pathname);
  const isOpen = useIsOpen();

  if (!isOpen) return <UpdateBlocker />;

  const bgClass = isDarkHeader ? "bg-black" : "bg-white";
  const logoSrc = isDarkHeader
    ? "assets/images/svg/logo-white.svg"
    : "assets/images/svg/logo-black.svg";
  const menuSrc = isDarkHeader
    ? "assets/images/menu-white.png"
    : "assets/images/menu-black.png";

  const navLinks = [
    { href: "/visit", label: "VISIT US" },
    { href: "/beliefs", label: "OUR BELIEFS" },
    { href: "/about", label: "ABOUT US" },
    { href: "/events", label: "EVENTS" },
    { href: "/life-group", label: "LIFE GROUP" },
    { href: "/sermon", label: "SERMON SERIES" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Header */}
      <header className={`h-[58px] ${bgClass} relative z-50`}>
        <div className="flex items-center h-full px-4">
          <div className="w-1/3">
            <button onClick={() => setIsMenuOpen(true)}>
              <img src={menuSrc} alt="Menu" className="h-6 w-6" />
            </button>
          </div>

          <div className="w-1/3 flex justify-center items-center">
            <Link href="/">
              <img
                src={logoSrc}
                alt="Logo"
                className="h-8 w-auto shrink-0 cursor-pointer"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" />

          <div
            ref={menuRef}
            className="fixed top-[58px] left-0 bg-white p-6 z-40  h-full overflow-auto"
          >
            <nav className="space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-base font-semibold"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
