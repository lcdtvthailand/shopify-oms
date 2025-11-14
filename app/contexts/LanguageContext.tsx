'use client'

import { createContext, type ReactNode, useContext, useState } from 'react'
import { type Language, TAX_INVOICE_TEXTS, type TaxInvoiceTexts } from '@/constants/language'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  texts: TaxInvoiceTexts
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('th')

  const texts = TAX_INVOICE_TEXTS[language]

  const value = {
    language,
    setLanguage,
    texts,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
