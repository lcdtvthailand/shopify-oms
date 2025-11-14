'use client'

import { useEffect, useState } from 'react'
import { AddressField } from '@/app/components/forms/AddressField'
import { CompanyInfoFields } from '@/app/components/forms/CompanyInfoFields'
// Import UI components
import { DocumentTypeSelector } from '@/app/components/forms/DocumentTypeSelector'
import { GeographyFields } from '@/app/components/forms/GeographyFields'
import { PersonalInfoFields } from '@/app/components/forms/PersonalInfoFields'
import { TaxIdAndPhoneFields } from '@/app/components/forms/TaxIdAndPhoneFields'
import { AdminContactModal } from '@/app/components/modals/AdminContactModal'
import { LanguageToggle } from '@/app/components/ui/LanguageToggle'
import { OrderStatusAlert } from '@/app/components/ui/OrderStatusAlert'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { useFormValidation } from '@/app/hooks/useFormValidation'
import { useGeography } from '@/app/hooks/useGeography'
import { useMetafieldOperations } from '@/app/hooks/useMetafieldOperations'
// Import custom hooks
import { useTaxInvoiceForm } from '@/app/hooks/useTaxInvoiceForm'
import { useUrlParameterHandling } from '@/app/hooks/useUrlParameterHandling'
import { type OrderStatus, validateOrderStatus } from '@/lib/services/order-status'

// Types
interface OrderData {
  id: string
  name: string
  customerId?: string | null
  customer?: {
    id?: string
    firstName?: string
    lastName?: string
    email?: string
    defaultAddress?: {
      address1?: string
      address2?: string
      city?: string
      zip?: string
      province?: string
      country?: string
    }
  }
}

export default function TaxInvoiceForm() {
  // Avoid SSR/hydration flash: only render base content after client mounted
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { texts } = useLanguage()
  const [orderStatus, _setOrderStatus] = useState<OrderStatus | null>(null)
  const [showAdminContact, setShowAdminContact] = useState(false)

  // Initialize custom hooks
  const {
    formData,
    orderData,
    showFormOverlay,
    showSuccessToast,
    prefillGuard,
    setFormData,
    setOrderData,
    setShowFormOverlay,
    setShowSuccessToast,
    handleInputChange,
    handleRadioChange,
    handleGoBack,
    handleGoToShop,
    updateFormDataFromMetafields,
  } = useTaxInvoiceForm()

  const { fieldErrors, taxIdError, validateForm, validateTaxId, clearFieldError, clearAllErrors } =
    useFormValidation()

  const {
    provinces,
    districts,
    subdistricts,
    loadDistricts,
    loadSubdistricts,
    findGeographyByName,
  } = useGeography()

  const { isSaving, saveMessage, saveError, showSavePopup, loadExistingMetafields, saveTaxInfo } =
    useMetafieldOperations()

  const {
    email,
    isValidated,
    validationMessage,
    showValidationPopup,
    validationInProgress,
    setShowValidationPopup,
  } = useUrlParameterHandling(async (orderData: OrderData) => {
    setOrderData(orderData)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)

    // Immediately show the form overlay to avoid any UI flash while pre-filling
    setShowFormOverlay(true)

    // Load existing metafields for this order to pre-populate form
    const metafields = await loadExistingMetafields(orderData.id, orderData)
    if (metafields) {
      updateFormDataFromMetafields(metafields)

      // Load geography data and set codes based on names from metafields
      const geoResult = await findGeographyByName(
        provinces.find((p) => p.code === metafields.provinceCode)?.nameTh,
        districts.find((d) => d.code === metafields.districtCode)?.nameTh,
        subdistricts.find((s) => s.code === metafields.subdistrictCode)?.nameTh,
        metafields.postalCode
      )

      if (geoResult.provinceCode) {
        setFormData((prev) => ({
          ...prev,
          provinceCode: geoResult.provinceCode || null,
          districtCode: geoResult.districtCode || null,
          subdistrictCode: geoResult.subdistrictCode || null,
          postalCode: geoResult.postalCode || prev.postalCode,
        }))
      }
    }

    // Overlay already shown above; no delay here
  })

  // Handle province changes
  useEffect(() => {
    if (formData.provinceCode == null) {
      return
    }
    if (!prefillGuard.current) {
      setFormData((prev) => ({
        ...prev,
        districtCode: null,
        subdistrictCode: null,
        postalCode: '',
      }))
    }
    loadDistricts(formData.provinceCode)
  }, [formData.provinceCode, loadDistricts, prefillGuard, setFormData])

  // Handle district changes
  useEffect(() => {
    if (formData.districtCode == null) {
      return
    }
    if (!prefillGuard.current) {
      setFormData((prev) => ({
        ...prev,
        subdistrictCode: null,
        postalCode: '',
      }))
    }
    loadSubdistricts(formData.districtCode)
  }, [formData.districtCode, loadSubdistricts, prefillGuard, setFormData])

  // Handle subdistrict changes - auto-fill postal code
  useEffect(() => {
    if (formData.subdistrictCode == null) {
      return
    }
    const selectedSub = subdistricts.find((s) => s.code === formData.subdistrictCode)
    if (selectedSub) {
      setFormData((prev) => {
        if (!prefillGuard.current || !prev.postalCode) {
          return { ...prev, postalCode: String(selectedSub.postalCode) }
        }
        return prev
      })
    }
  }, [formData.subdistrictCode, subdistricts, prefillGuard, setFormData])

  // Handle form submission
  const handleSaveTaxInfo = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidated || !orderData?.id) {
      setShowValidationPopup(true)
      return
    }

    // Clear previous errors
    clearAllErrors()

    // Validate form
    const errors = validateForm(formData)
    if (errors.length > 0) {
      return
    }

    // Save to Shopify
    const success = await saveTaxInfo(formData, orderData, provinces, districts, subdistricts)
    if (success) {
      // Keep Tax ID as digits only (no dashes) after save
      const fmtId = (raw: string) => {
        const d = String(raw || '')
          .replace(/\D/g, '')
          .slice(0, 13)
        return d
      }
      setFormData((prev) => ({ ...prev, branchCode: fmtId(prev.branchCode) }))
    }
  }

  // Handle geography field changes
  const handleProvinceChange = async (value: string) => {
    const provinceCode = value ? Number(value) : null
    setFormData((prev) => ({
      ...prev,
      provinceCode,
      districtCode: null,
      subdistrictCode: null,
      postalCode: '',
    }))
    if (provinceCode) {
      await loadDistricts(provinceCode)
    }
  }

  const handleDistrictChange = async (value: string) => {
    const districtCode = value ? Number(value) : null
    setFormData((prev) => ({
      ...prev,
      districtCode,
      subdistrictCode: null,
      postalCode: '',
    }))
    if (districtCode) {
      await loadSubdistricts(districtCode)
    }
  }

  const handleSubdistrictChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      subdistrictCode: value ? Number(value) : null,
    }))
  }

  return (
    <>
      {/* Initial validation screen */}
      {validationInProgress && !showFormOverlay && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{texts.validating}</h3>
            <p className="text-gray-600">{texts.pleaseWait}</p>
          </div>
        </div>
      )}

      {/* Form Overlay - shows after successful validation */}
      {showFormOverlay && isValidated && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto z-40">
          <div className="min-h-screen px-4 text-center">
            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">{texts.title}</h2>
                <LanguageToggle />
              </div>

              {/* Order Status Alert */}
              {orderStatus && !validateOrderStatus(orderStatus).isEligible && orderData && (
                <OrderStatusAlert
                  status={orderStatus}
                  message={validateOrderStatus(orderStatus).message}
                  orderNumber={orderData.name}
                />
              )}

              {/* Admin Contact Modal */}
              {showAdminContact && orderStatus && orderData && (
                <AdminContactModal
                  isOpen={showAdminContact}
                  onClose={() => setShowAdminContact(false)}
                  orderNumber={orderData.name}
                  orderStatus={orderStatus}
                  customerEmail={email}
                />
              )}

              {/* Success Toast */}
              {showSuccessToast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
                  <div className="flex items-center space-x-3 bg-green-600 text-white px-4 py-3 rounded-md shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">{texts.validationSuccess}</span>
                    <span className="opacity-90">{texts.canFillForm}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveTaxInfo} noValidate className="space-y-6">
                {/* Document Type Radio Buttons */}
                <DocumentTypeSelector
                  documentType={formData.documentType}
                  onDocumentTypeChange={handleRadioChange}
                />

                {/* Personal/Company Info Fields */}
                {formData.documentType === 'tax' ? (
                  <PersonalInfoFields
                    titleName={formData.titleName}
                    fullName={formData.fullName}
                    fieldErrors={fieldErrors}
                    onTitleNameChange={(value) =>
                      setFormData((prev) => ({ ...prev, titleName: value }))
                    }
                    onFullNameChange={handleInputChange}
                    onClearFieldError={clearFieldError}
                  />
                ) : (
                  <CompanyInfoFields
                    companyNameText={formData.companyNameText}
                    branchType={formData.branchType}
                    branchNumber={formData.branchNumber || ''}
                    fieldErrors={fieldErrors}
                    onCompanyNameChange={handleInputChange}
                    onBranchTypeChange={(type) =>
                      setFormData((prev) => ({ ...prev, branchType: type }))
                    }
                    onBranchNumberChange={handleInputChange}
                    onClearFieldError={clearFieldError}
                  />
                )}

                {/* Tax ID and Phone Fields */}
                <TaxIdAndPhoneFields
                  documentType={formData.documentType}
                  branchCode={formData.branchCode}
                  companyName={formData.companyName}
                  taxIdError={taxIdError}
                  fieldErrors={fieldErrors}
                  onBranchCodeChange={handleInputChange}
                  onCompanyNameChange={handleInputChange}
                  onBranchCodeBlur={(e) => {
                    const d = String(e.target.value || '')
                      .replace(/\D/g, '')
                      .slice(0, 13)
                    setFormData((prev) => ({ ...prev, branchCode: d }))
                    validateTaxId(d, formData.documentType)
                  }}
                />

                {/* Address Field */}
                <AddressField
                  documentType={formData.documentType}
                  address={formData.address}
                  fieldErrors={fieldErrors}
                  onAddressChange={handleInputChange}
                />

                {/* Geography Fields */}
                <GeographyFields
                  provinceCode={formData.provinceCode}
                  districtCode={formData.districtCode}
                  subdistrictCode={formData.subdistrictCode}
                  postalCode={formData.postalCode}
                  provinces={provinces}
                  districts={districts}
                  subdistricts={subdistricts}
                  fieldErrors={fieldErrors}
                  onProvinceChange={handleProvinceChange}
                  onDistrictChange={handleDistrictChange}
                  onSubdistrictChange={handleSubdistrictChange}
                  onPostalCodeChange={handleInputChange}
                  onClearFieldError={clearFieldError}
                />

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {isSaving ? texts.saving : texts.save}
                  </button>
                  {!isValidated && (
                    <p className="mt-2 text-sm text-gray-500">{texts.pleaseAccessViaUrl}</p>
                  )}
                  {saveMessage && <p className="mt-2 text-sm text-green-600">{saveMessage}</p>}
                  {saveError && <p className="mt-2 text-sm text-red-600">Error: {saveError}</p>}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Original content for non-overlay mode (render only after mount to prevent SSR flash) */}
      {mounted && !showFormOverlay && !validationInProgress && !isValidated && (
        <div className="tax-form max-w-6xl mx-auto bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-8 md:p-10 m-4 md:m-6">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">{texts.title}</h1>
            <div className="flex items-center space-x-4">
              <LanguageToggle />
              <button
                type="button"
                onClick={handleGoBack}
                className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors duration-200"
              >
                {texts.back}
              </button>
            </div>
          </div>

          {!isValidated && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <p className="text-gray-600 text-lg">{texts.waitingValidation}</p>
              <p className="text-gray-500 mt-2">{texts.systemValidating}</p>
            </div>
          )}
        </div>
      )}

      {/* Validation Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${isValidated ? 'bg-green-100' : 'bg-red-100'}`}
              >
                {isValidated ? (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <h3
                className={`text-lg font-semibold ${isValidated ? 'text-green-800' : 'text-red-800'}`}
              >
                {isValidated ? texts.validationSuccessTitle : texts.errorTitle}
              </h3>
            </div>
            <p className="text-gray-700 mb-4 text-center">{validationMessage}</p>
            <button
              type="button"
              onClick={() => setShowValidationPopup(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
            >
              {texts.ok}
            </button>
          </div>
        </div>
      )}

      {/* Save Success Popup */}
      {showSavePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3 bg-green-100">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800">{texts.saveSuccess}</h3>
            </div>
            <p className="text-gray-700 mb-4 text-center">{texts.saveComplete}</p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleGoToShop}
                className="min-w-[200px] bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md"
              >
                {texts.goBackToPrevious}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
