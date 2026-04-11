import type { Metadata } from 'next'
import './globals.css'
import { Anuphan } from 'next/font/google'

const anuphan = Anuphan({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ใบกำกับภาษี - Tax Invoice Form',
  description: 'Thai Tax Invoice Form Application',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`bg-gray-50 min-h-screen ${anuphan.className}`}>{children}</body>
    </html>
  )
}
