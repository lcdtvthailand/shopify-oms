'use client'

import { ErrorMessage } from '@/app/components/ui/ErrorMessage'
import { useLanguage } from '@/app/contexts/LanguageContext'

interface AddressFieldProps {
  documentType: 'tax' | 'receipt'
  address: string
  fieldErrors: Record<string, string>
  onAddressChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export const AddressField: React.FC<AddressFieldProps> = ({
  documentType,
  address,
  fieldErrors,
  onAddressChange,
}) => {
  const { texts } = useLanguage()
  return (
    <div className="space-y-2">
      <label className="block text-gray-700 font-medium">
        {documentType === 'receipt' ? texts.registeredAddress : texts.address}
      </label>
      <textarea
        name="address"
        value={address}
        onChange={onAddressChange}
        onInvalid={(e) => {
          ;(e.target as HTMLTextAreaElement).setCustomValidity('กรุณากรอกที่อยู่')
        }}
        onInput={(e) => {
          ;(e.target as HTMLTextAreaElement).setCustomValidity('')
        }}
        placeholder={
          documentType === 'receipt' ? texts.registeredAddressPlaceholder : texts.addressPlaceholder
        }
        rows={1}
        required
        className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
          fieldErrors.address
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-red-500'
        }`}
      />
      <ErrorMessage message={fieldErrors.address} />
    </div>
  )
}
