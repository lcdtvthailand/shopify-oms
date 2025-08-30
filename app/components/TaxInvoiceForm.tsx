'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface FormData {
  documentType: 'tax' | 'receipt'
  documentNumber: string
  branchCode: string
  companyName: string
  companyNameEng: string
  provinceCode: number | null
  districtCode: number | null
  subdistrictCode: number | null
  postalCode: string
  address: string
  branchType?: 'head' | 'branch' | null
  branchNumber?: string
  subBranchCode?: string
}

export default function TaxInvoiceForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    documentType: 'tax',
    documentNumber: '',
    branchCode: '',
    companyName: '',
    companyNameEng: '',
    provinceCode: null,
    districtCode: null,
    subdistrictCode: null,
    postalCode: '',
    address: '',
    branchType: null,
    branchNumber: ''
  })

  // Cascading options loaded from lib/geography/thailand.ts via dynamic import
  const [provinces, setProvinces] = useState<Array<{ code: number; nameTh: string; nameEn: string }>>([])
  const [districts, setDistricts] = useState<Array<{ code: number; nameTh: string; nameEn: string }>>([])
  const [subdistricts, setSubdistricts] = useState<Array<{ code: number; nameTh: string; nameEn: string; postalCode: number }>>([])

  // Load provinces on mount
  useEffect(() => {
    let mounted = true
    import('@/lib/geography/thailand').then((geo) => {
      if (!mounted) return
      setProvinces(geo.getProvinces())
    })
    return () => { mounted = false }
  }, [])

  // When province changes, load districts
  useEffect(() => {
    if (formData.provinceCode == null) {
      setDistricts([])
      setSubdistricts([])
      setFormData((p) => ({ ...p, districtCode: null, subdistrictCode: null, postalCode: '' }))
      return
    }
    let mounted = true
    import('@/lib/geography/thailand').then((geo) => {
      if (!mounted) return
      setDistricts(geo.getDistrictsByProvince(formData.provinceCode!))
      // reset lower levels
      setSubdistricts([])
      setFormData((p) => ({ ...p, districtCode: null, subdistrictCode: null, postalCode: '' }))
    })
    return () => { mounted = false }
  }, [formData.provinceCode])

  // When district changes, load subdistricts
  useEffect(() => {
    if (formData.districtCode == null) {
      setSubdistricts([])
      setFormData((p) => ({ ...p, subdistrictCode: null, postalCode: '' }))
      return
    }
    let mounted = true
    import('@/lib/geography/thailand').then((geo) => {
      if (!mounted) return
      setSubdistricts(geo.getSubdistrictsByDistrict(formData.districtCode!))
      setFormData((p) => ({ ...p, subdistrictCode: null, postalCode: '' }))
    })
    return () => { mounted = false }
  }, [formData.districtCode])

  // When subdistrict changes, auto-fill postal code
  useEffect(() => {
    if (formData.subdistrictCode == null) return
    import('@/lib/geography/thailand').then((geo) => {
      const item = geo.findBySubdistrictCode(formData.subdistrictCode!)
      if (item) setFormData((p) => ({ ...p, postalCode: String(item.postalCode) }))
    })
  }, [formData.subdistrictCode])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.documentNumber.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุล')
      return
    }
    
    if (!formData.branchCode.trim()) {
      alert('กรุณากรอกหมายเลขประจำตัวผู้เสียภาษี')
      return
    }
    
    if (formData.branchCode.length !== 13) {
      alert('หมายเลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก')
      return
    }
    
    if (!formData.companyName.trim()) {
      alert('กรุณากรอกหมายเลขโทรศัพท์')
      return
    }
    
    if (!formData.provinceCode) {
      alert('กรุณาเลือกจังหวัด')
      return
    }
    
    if (!formData.districtCode) {
      alert('กรุณาเลือกอำเภอ/เขต')
      return
    }
    
    if (!formData.subdistrictCode) {
      alert('กรุณาเลือกตำบล/แขวง')
      return
    }
    
    if (!formData.address.trim()) {
      alert('กรุณากรอกที่อยู่')
      return
    }

    if (formData.documentType === 'receipt' && formData.branchType === 'branch') {
      if (!formData.branchNumber || !formData.branchNumber.trim()) {
        alert('กรุณากรอกรหัสสาขาย่อย')
        return
      }
    }
    
    // Save to localStorage
    const savedData = {
      ...formData,
      savedAt: new Date().toISOString(),
      id: Date.now().toString()
    }
    
    const existingData = JSON.parse(localStorage.getItem('taxInvoiceData') || '[]')
    existingData.push(savedData)
    localStorage.setItem('taxInvoiceData', JSON.stringify(existingData))
    
    alert('บันทึกข้อมูลเรียบร้อยแล้ว!')
    
    // Reset form
    setFormData({
      documentType: 'tax',
      documentNumber: '',
      branchCode: '',
      companyName: '',
      companyNameEng: '',
      provinceCode: null,
      districtCode: null,
      subdistrictCode: null,
      postalCode: '',
      address: '',
      branchType: null,
      branchNumber: ''
    })
    
    setProvinces([])
    setDistricts([])
    setSubdistricts([])
  }

  const handleRadioChange = (value: 'tax' | 'receipt') => {
    setFormData(prev => ({
      ...prev,
      documentType: value,
      // reset branch type when switching to บุคคลธรรมดา
      branchType: value === 'receipt' ? (prev.branchType ?? 'head') : null,
      branchNumber: value === 'receipt' ? prev.branchNumber : ''
    }))
  }

  const handleGoBack = () => {
    router.back()
  }

  // options are now driven by dataset above

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-center mb-4">
        <Image src="/LOGO LCDTVTHAILAND SHOP Official 1.png" alt="Logo" width={240} height={80} priority />
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">เพิ่มข้อมูลสำหรับออกใบกำกับภาษี</h1>
        <button 
          onClick={handleGoBack}
          className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors duration-200"
        >
          ย้อนกลับ
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Type Radio Buttons */}
        <div className="space-y-4">
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="documentType"
                value="tax"
                checked={formData.documentType === 'tax'}
                onChange={() => handleRadioChange('tax')}
                className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className={`${formData.documentType === 'tax' ? 'text-red-600' : 'text-gray-600'} font-medium`}>
                บุกคลธรรมดา
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="documentType"
                value="receipt"
                checked={formData.documentType === 'receipt'}
                onChange={() => handleRadioChange('receipt')}
                className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className={`${formData.documentType === 'receipt' ? 'text-red-600' : 'text-gray-600'} font-medium`}>
                นิติบุคคล
              </span>
            </label>
          </div>
        </div>

        {/* Name or Company Name */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">
            {formData.documentType === 'receipt' ? 'ชื่อบริษัท' : 'ชื่อ-นามสกุล'}
          </label>
          <input
            type="text"
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleInputChange}
            placeholder={formData.documentType === 'receipt' ? 'ชื่อบริษัท' : 'ชื่อ-นามสกุล'}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Head office / Branch for juristic person */}
        {formData.documentType === 'receipt' && (
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">สาขา</label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="branchType"
                  value="head"
                  checked={formData.branchType === 'head'}
                  onChange={() => setFormData(p => ({ ...p, branchType: 'head' }))}
                  className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className={`${formData.branchType === 'head' ? 'text-red-600' : 'text-gray-600'} font-medium`}>
                  สำนักงานใหญ่
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="branchType"
                  value="branch"
                  checked={formData.branchType === 'branch'}
                  onChange={() => setFormData(p => ({ ...p, branchType: 'branch' }))}
                  className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className={`${formData.branchType === 'branch' ? 'text-red-600' : 'text-gray-600'} font-medium`}>
                  สาขาย่อย
                </span>
              </label>
            </div>

            {/* Sub-branch code input */}
            {formData.branchType === 'branch' && (
              <div className="space-y-2 pt-2">
                <label className="block text-gray-700">รหัสสาขาย่อย</label>
                <input
                  type="text"
                  name="branchNumber"
                  value={formData.branchNumber || ''}
                  onChange={handleInputChange}
                  placeholder="รหัสสาขาย่อย"
                  inputMode="numeric"
                  className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        {/* Tax Identification Number */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">หมายเลขประจำตัวผู้เสียภาษี</label>
          <input
            type="text"
            name="branchCode"
            value={formData.branchCode}
            onChange={handleInputChange}
            placeholder="หมายเลขประจำตัวผู้เสียภาษี"
            inputMode="numeric"
            maxLength={13}
            pattern="\\d{13}"
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Company Names Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">หมายเลขโทรศัพท์</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="หมายเลขโทรศัพท์"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">หมายเลขโทรศัพท์สำรอง (ถ้ามี)</label>
            <input
              type="text"
              name="companyNameEng"
              value={formData.companyNameEng}
              onChange={handleInputChange}
              placeholder="หมายเลขโทรศัพท์สำรอง"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">จังหวัด</label>
            <div className="relative">
              <select
                name="provinceCode"
                value={formData.provinceCode ?? ''}
                onChange={(e) => setFormData((p) => ({ ...p, provinceCode: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option value="">เลือกจังหวัด</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>{p.nameTh}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">อำเภอ/ เขต</label>
            <div className="relative">
              <select
                name="districtCode"
                value={formData.districtCode ?? ''}
                onChange={(e) => setFormData((p) => ({ ...p, districtCode: e.target.value ? Number(e.target.value) : null }))}
                disabled={!formData.provinceCode}
                className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed"
              >
                <option value="">เลือกอำเภอ/เขต</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>{d.nameTh}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* District and Postal Code Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">ตำบล/ แขวง</label>
            <div className="relative">
              <select
                name="subdistrictCode"
                value={formData.subdistrictCode ?? ''}
                onChange={(e) => setFormData((p) => ({ ...p, subdistrictCode: e.target.value ? Number(e.target.value) : null }))}
                disabled={!formData.districtCode}
                className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed"
              >
                <option value="">เลือกตำบล/แขวง</option>
                {subdistricts.map((s) => (
                  <option key={s.code} value={s.code}>{s.nameTh}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">ไปรษณีย์</label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleInputChange}
              placeholder="ไปรษณีย์"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">ที่อยู่</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="ที่อยู่"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-8 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            บันทึก
          </button>
        </div>
      </form>
    </div>
  )
}
