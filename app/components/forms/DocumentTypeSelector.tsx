'use client'

interface DocumentTypeSelectorProps {
  documentType: 'tax' | 'receipt'
  onDocumentTypeChange: (type: 'tax' | 'receipt') => void
}

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  documentType,
  onDocumentTypeChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="radio-group flex flex-wrap items-center gap-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="documentType"
            value="tax"
            checked={documentType === 'tax'}
            onChange={() => onDocumentTypeChange('tax')}
            className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
          />
          <span
            className={`${documentType === 'tax' ? 'text-red-600' : 'text-gray-600'} font-medium`}
          >
            บุคคลธรรมดา
          </span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name="documentType"
            value="receipt"
            checked={documentType === 'receipt'}
            onChange={() => onDocumentTypeChange('receipt')}
            className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
          />
          <span
            className={`${documentType === 'receipt' ? 'text-red-600' : 'text-gray-600'} font-medium`}
          >
            นิติบุคคล
          </span>
        </label>
      </div>
    </div>
  )
}
