'use client'

import { ErrorMessage } from '@/app/components/ui/ErrorMessage'

interface TaxIdAndPhoneFieldsProps {
  documentType: 'tax' | 'receipt'
  branchCode: string
  companyName: string
  taxIdError: string
  fieldErrors: Record<string, string>
  onBranchCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCompanyNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBranchCodeBlur: (e: React.FocusEvent<HTMLInputElement>) => void
}

export const TaxIdAndPhoneFields: React.FC<TaxIdAndPhoneFieldsProps> = ({
  documentType,
  branchCode,
  companyName,
  taxIdError,
  fieldErrors,
  onBranchCodeChange,
  onCompanyNameChange,
  onBranchCodeBlur,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Tax Identification Number - Half width */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">
          {documentType === 'receipt' ? 'หมายเลขประจำตัวผู้เสียภาษี' : 'เลขประจำตัวประชาชน'}
          <span className="ml-2 text-gray-500 text-sm">(กรอกเลข 13 หลัก)</span>
        </label>
        <input
          type="text"
          name="branchCode"
          value={branchCode}
          onChange={onBranchCodeChange}
          onInvalid={(e) => {
            ;(e.target as HTMLInputElement).setCustomValidity(
              documentType === 'receipt'
                ? 'กรุณากรอกหมายเลขประจำตัวผู้เสียภาษี'
                : 'กรุณากรอกเลขประจำตัวประชาชน'
            )
          }}
          onInput={(e) => {
            ;(e.target as HTMLInputElement).setCustomValidity('')
          }}
          placeholder={`${documentType === 'receipt' ? 'หมายเลขประจำตัวผู้เสียภาษี' : 'เลขประจำตัวประชาชน'} (กรอกเลข 13 หลัก)`}
          inputMode="tel"
          maxLength={13}
          onBlur={onBranchCodeBlur}
          required
          className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
            fieldErrors.branchCode || taxIdError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
        />
        <ErrorMessage message={fieldErrors.branchCode || taxIdError} />
      </div>

      {/* Phone Number - Half width */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium">
          หมายเลขโทรศัพท์
          <span className="ml-2 text-gray-500 text-sm">(ไม่บังคับ)</span>
        </label>
        <input
          type="text"
          name="companyName"
          value={companyName}
          onChange={onCompanyNameChange}
          onInvalid={(e) => {
            ;(e.target as HTMLInputElement).setCustomValidity('กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง')
          }}
          onInput={(e) => {
            ;(e.target as HTMLInputElement).setCustomValidity('')
          }}
          placeholder="หมายเลขโทรศัพท์ (ไม่บังคับ)"
          inputMode="tel"
          maxLength={12}
          className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
            fieldErrors.companyName
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-red-500'
          }`}
        />
        <ErrorMessage message={fieldErrors.companyName} />
      </div>
    </div>
  )
}
