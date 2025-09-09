'use client'

export default function TopBar() {
  return (
    <div className="w-full bg-black text-white">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6">
        <div className="flex h-8 sm:h-9 items-center justify-start pl-6 md:pl-10 text-[11px] sm:text-xs leading-none tracking-wide">
          <div className="flex items-center gap-3 sm:gap-4 whitespace-nowrap">
            <span className="opacity-90">โทร : 091-901-7000, 091-901-8000</span>
            <span className="hidden sm:inline opacity-50">|</span>
            <a
              href="https://line.me/"
              className="hidden sm:inline hover:underline opacity-90"
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 LINE
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
