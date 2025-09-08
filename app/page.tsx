'use client'

import { Suspense } from 'react'
import TaxInvoiceForm from './components/forms/TaxInvoiceForm'

function LoadingForm() {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังโหลด...</p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Suspense fallback={<LoadingForm />}>
          <TaxInvoiceForm />
        </Suspense>
      </div>
    </main>
  )
}
