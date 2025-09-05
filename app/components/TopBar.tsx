"use client";

import Link from "next/link";

export default function TopBar() {
  return (
    <div className="w-full bg-black text-white">
      <div className="mx-auto max-w-screen-xl px-2 sm:px-4">
        <div className="flex h-8 sm:h-9 items-center justify-start text-[11px] sm:text-xs leading-none tracking-wide">
          <div className="flex items-center gap-3 sm:gap-4 whitespace-nowrap">
            <span className="opacity-90">โทร : 091-901-7000, 091-901-8000</span>
            <span className="hidden sm:inline opacity-50">|</span>
            <a href="#" className="hidden sm:inline hover:underline opacity-90">💬 LINE</a>
          </div>
        </div>
      </div>
    </div>
  );
}
