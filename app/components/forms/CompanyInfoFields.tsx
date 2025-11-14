'use client'

import { ErrorMessage } from '@/app/components/ui/ErrorMessage'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface CompanyInfoFieldsProps {
  companyNameText: string
  branchType?: 'head' | 'branch' | null
  branchNumber: string
  fieldErrors: Record<string, string>
  onCompanyNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBranchTypeChange: (type: 'head' | 'branch') => void
  onBranchNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearFieldError: (fieldName: string) => void
}

export const CompanyInfoFields: React.FC<CompanyInfoFieldsProps> = ({
  companyNameText,
  branchType,
  branchNumber,
  fieldErrors,
  onCompanyNameChange,
  onBranchTypeChange,
  onBranchNumberChange,
  onClearFieldError,
}) => {
  const { texts } = useLanguage()
  return (
    <>
      {/* Company Name - Full Width for juristic person */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">{texts.companyName}</label>
        <input
          type="text"
          name="companyNameText"
          value={companyNameText}
          onChange={onCompanyNameChange}
          autoComplete="organization"
          onInvalid={(e) => {
            ;(e.target as HTMLInputElement).setCustomValidity('กรุณากรอกชื่อบริษัท')
          }}
          onInput={(e) => {
            ;(e.target as HTMLInputElement).setCustomValidity('')
          }}
          placeholder={texts.companyName}
          required
          className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
            fieldErrors.companyNameText
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
        />
        <ErrorMessage message={fieldErrors.companyNameText} />
      </div>

      {/* Head office / Branch for juristic person */}
      <div className={`grid grid-cols-1 ${branchType === 'branch' ? 'md:grid-cols-2' : ''} gap-6`}>
        {/* Left: Branch radios */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">{texts.branch}</label>
          <div className="flex items-center space-x-6 gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="branchType"
                value="head"
                checked={branchType === 'head'}
                onChange={() => {
                  onClearFieldError('branchType')
                  onBranchTypeChange('head')
                }}
                required={!branchType}
                className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
              />
              <span
                className={`${branchType === 'head' ? 'text-red-600' : 'text-gray-600'} font-medium`}
              >
                {texts.headOffice}
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="branchType"
                value="branch"
                checked={branchType === 'branch'}
                onChange={() => {
                  onClearFieldError('branchType')
                  onBranchTypeChange('branch')
                }}
                className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
              />
              <span
                className={`${branchType === 'branch' ? 'text-red-600' : 'text-gray-600'} font-medium`}
              >
                {texts.branchOffice}
              </span>
            </label>
          </div>
          <ErrorMessage message={fieldErrors.branchType} />
        </div>

        {/* Right: Sub-branch code input (show only when selecting branch) */}
        {branchType === 'branch' && (
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">{texts.branchCode}</label>
            <input
              type="text"
              name="branchNumber"
              value={branchNumber || ''}
              onChange={onBranchNumberChange}
              onInvalid={(e) => {
                ;(e.target as HTMLInputElement).setCustomValidity('กรุณากรอกรหัสสาขาย่อย')
              }}
              onInput={(e) => {
                ;(e.target as HTMLInputElement).setCustomValidity('')
              }}
              placeholder={texts.branchCode}
              inputMode="numeric"
              pattern="\\d{5}"
              maxLength={5}
              required
              className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                fieldErrors.branchNumber
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-red-500'
              }`}
            />
            <ErrorMessage message={fieldErrors.branchNumber} />
          </div>
        )}
      </div>
    </>
  )
}
