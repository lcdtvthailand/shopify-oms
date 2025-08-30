'use client'

import { useState } from 'react'
import TaxInvoiceForm from './components/TaxInvoiceForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <TaxInvoiceForm />
      </div>
    </main>
  )
}
