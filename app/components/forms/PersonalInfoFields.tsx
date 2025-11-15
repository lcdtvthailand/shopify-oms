'use client'

import { ErrorMessage } from '@/app/components/ui/ErrorMessage'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface PersonalInfoFieldsProps {
  titleName: string
  fullName: string
  fieldErrors: Record<string, string>
  onTitleNameChange: (value: string) => void
  onFullNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearFieldError: (fieldName: string) => void
}

export const PersonalInfoFields: React.FC<PersonalInfoFieldsProps> = ({
  titleName,
  fullName,
  fieldErrors,
  onTitleNameChange,
  onFullNameChange,
  onClearFieldError,
}) => {
  const { texts } = useLanguage()
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Title Name - Half width */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">{texts.titleLabel}</label>
        <div className="relative">
          <select
            name="titleName"
            value={titleName}
            onChange={(e) => {
              onClearFieldError('titleName')
              onTitleNameChange(e.target.value)
            }}
            onInvalid={(e) => {
              ;(e.target as HTMLSelectElement).setCustomValidity('กรุณาเลือกคำนำหน้าชื่อ')
            }}
            onInput={(e) => {
              ;(e.target as HTMLSelectElement).setCustomValidity('')
            }}
            required
            className={`w-full px-4 pr-10 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white cursor-pointer ${
              fieldErrors.titleName
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-red-500'
            }`}
          >
            <option value="">{texts.selectTitle}</option>
            <option value="นาย">{texts.titleMr}</option>
            <option value="นาง">{texts.titleMrs}</option>
            <option value="นางสาว">{texts.titleMiss}</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
        <ErrorMessage message={fieldErrors.titleName} />
      </div>

      {/* Name - Half width */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">{texts.fullName}</label>
        <input
          type="text"
          name="fullName"
          value={fullName}
          onChange={onFullNameChange}
          autoComplete="name"
          onInvalid={(e) => {
            ;(e.target as HTMLInputElement).setCustomValidity('กรุณากรอกชื่อ-นามสกุล')
          }}
          onInput={(e) => {
            ;(e.target as HTMLInputElement).setCustomValidity('')
          }}
          placeholder={texts.fullName}
          required
          className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
            fieldErrors.fullName
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
        />
        <ErrorMessage message={fieldErrors.fullName} />
      </div>
    </div>
  )
}
