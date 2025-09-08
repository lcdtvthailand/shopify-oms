import type { Metadata } from 'next'
import Image from 'next/image'
import './globals.css'
import TopBar from './components/layout/TopBar'
import TopMenu from './components/layout/TopMenu'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

export const metadata: Metadata = {
  title: 'ใบกำกับภาษี - Tax Invoice Form',
  description: 'Thai Tax Invoice Form Application',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="font-thai bg-gray-50 min-h-screen">
        <TopBar />
        <header className="bg-white">
          <div className="mx-auto max-w-screen-xl px-3 sm:px-4 py-2 sm:py-3 flex justify-center">
            <Image
              src="/LOGO LCDTVTHAILAND SHOP Official 1.png"
              alt="LCDTVTHAILAND SHOP"
              width={200}
              height={60}
              priority
            />
          </div>
        </header>
        <TopMenu />
        <main>
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </body>
    </html>
  )
}
