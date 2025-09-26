'use client'

import { ErrorMessage } from '@/app/components/ui/ErrorMessage'

interface GeographyFieldsProps {
  provinceCode: number | null
  districtCode: number | null
  subdistrictCode: number | null
  postalCode: string
  provinces: Array<{ code: number; nameTh: string; nameEn: string }>
  districts: Array<{ code: number; nameTh: string; nameEn: string }>
  subdistricts: Array<{ code: number; nameTh: string; nameEn: string; postalCode: number }>
  fieldErrors: Record<string, string>
  onProvinceChange: (value: string) => void
  onDistrictChange: (value: string) => void
  onSubdistrictChange: (value: string) => void
  onPostalCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearFieldError: (fieldName: string) => void
}

export const GeographyFields: React.FC<GeographyFieldsProps> = ({
  provinceCode,
  districtCode,
  subdistrictCode,
  postalCode,
  provinces,
  districts,
  subdistricts,
  fieldErrors,
  onProvinceChange,
  onDistrictChange,
  onSubdistrictChange,
  onPostalCodeChange,
  onClearFieldError,
}) => {
  return (
    <>
      {/* Province and District Row - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">จังหวัด</label>
          <div className="relative">
            <select
              name="provinceCode"
              value={provinceCode != null ? String(provinceCode) : ''}
              onChange={(e) => {
                onClearFieldError('provinceCode')
                onProvinceChange(e.target.value)
              }}
              onInvalid={(e) => {
                ;(e.target as HTMLSelectElement).setCustomValidity('กรุณาเลือกจังหวัด')
              }}
              onInput={(e) => {
                ;(e.target as HTMLSelectElement).setCustomValidity('')
              }}
              required
              className={`w-full px-4 pr-10 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white cursor-pointer ${
                fieldErrors.provinceCode
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-red-500'
              }`}
            >
              <option value="">เลือกจังหวัด</option>
              {provinces.map((p) => (
                <option key={p.code} value={String(p.code)}>
                  {p.nameTh}
                </option>
              ))}
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
            {provinceCode && districts.length === 0 ? (
              <p className="mt-1 text-xs text-red-600">ไม่พบอำเภอสำหรับจังหวัดที่เลือก</p>
            ) : null}
            <ErrorMessage message={fieldErrors.provinceCode} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">อำเภอ/ เขต</label>
          <div className="relative">
            <select
              name="districtCode"
              value={districtCode != null ? String(districtCode) : ''}
              onChange={(e) => {
                onClearFieldError('districtCode')
                onDistrictChange(e.target.value)
              }}
              onInvalid={(e) => {
                ;(e.target as HTMLSelectElement).setCustomValidity('กรุณาเลือกอำเภอ/เขต')
              }}
              onInput={(e) => {
                ;(e.target as HTMLSelectElement).setCustomValidity('')
              }}
              disabled={!provinceCode}
              required
              className={`w-full px-4 pr-10 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed ${
                fieldErrors.districtCode
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-red-500'
              }`}
            >
              <option value="">เลือกอำเภอ/เขต</option>
              {districts.map((d) => (
                <option key={d.code} value={String(d.code)}>
                  {d.nameTh}
                </option>
              ))}
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
            <ErrorMessage message={fieldErrors.districtCode} />
          </div>
        </div>
      </div>

      {/* Subdistrict and Postal Code Row - Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">ตำบล/ แขวง</label>
          <div className="relative">
            <select
              name="subdistrictCode"
              value={subdistrictCode != null ? String(subdistrictCode) : ''}
              onChange={(e) => {
                onClearFieldError('subdistrictCode')
                onSubdistrictChange(e.target.value)
              }}
              onInvalid={(e) => {
                ;(e.target as HTMLSelectElement).setCustomValidity('กรุณาเลือกตำบล/แขวง')
              }}
              onInput={(e) => {
                ;(e.target as HTMLSelectElement).setCustomValidity('')
              }}
              disabled={!districtCode}
              required
              className={`w-full px-4 pr-10 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed ${
                fieldErrors.subdistrictCode
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-red-500'
              }`}
            >
              <option value="">เลือกตำบล/แขวง</option>
              {subdistricts.map((s) => (
                <option key={s.code} value={String(s.code)}>
                  {s.nameTh}
                </option>
              ))}
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
            <ErrorMessage message={fieldErrors.subdistrictCode} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">รหัสไปรษณีย์</label>
          <input
            type="text"
            name="postalCode"
            value={postalCode}
            onChange={onPostalCodeChange}
            onInvalid={(e) => {
              ;(e.target as HTMLInputElement).setCustomValidity('กรุณากรอกรหัสไปรษณีย์')
            }}
            onInput={(e) => {
              ;(e.target as HTMLInputElement).setCustomValidity('')
            }}
            placeholder="รหัสไปรษณีย์"
            inputMode="numeric"
            maxLength={5}
            required
            className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
              fieldErrors.postalCode
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-red-500'
            }`}
          />
          <ErrorMessage message={fieldErrors.postalCode} />
        </div>
      </div>
    </>
  )
}
