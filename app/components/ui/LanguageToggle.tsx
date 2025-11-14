'use client'

import { useLanguage } from '@/app/contexts/LanguageContext'
import { LANGUAGE_LABELS, type Language } from '@/constants/language'

interface LanguageToggleProps {
  className?: string
}

export function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage()

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  return (
    <div className={`flex items-center ${className}`}>
      {Object.entries(LANGUAGE_LABELS).map(([lang, label], index) => (
        <div key={lang} className="flex items-center">
          <button
            type="button"
            onClick={() => handleLanguageChange(lang as Language)}
            className={`px-2 py-1 text-sm font-medium transition-colors duration-200 ${
              language === lang
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
          {index < Object.entries(LANGUAGE_LABELS).length - 1 && (
            <span className="text-gray-300 text-sm mx-1">|</span>
          )}
        </div>
      ))}
    </div>
  )
}
