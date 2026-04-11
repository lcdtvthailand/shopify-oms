import Image from 'next/image'
import TopBar from '../components/layout/TopBar'
import TopMenu from '../components/layout/TopMenu'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { LanguageProvider } from '../contexts/LanguageContext'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
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
    </LanguageProvider>
  )
}
