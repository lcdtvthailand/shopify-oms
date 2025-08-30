import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ใบกำกับภาษี - Tax Invoice Form',
  description: 'Thai Tax Invoice Form Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="font-thai bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
