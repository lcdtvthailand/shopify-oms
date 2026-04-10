'use client'

interface InvoiceData {
  orderName: string
  customerType: string
  titleName: string
  fullName: string
  companyName: string
  branchType: string
  branchCode: string
  taxId: string
  taxIdFormatted: string
  phoneNumber: string
  province: string
  district: string
  subDistrict: string
  postalCode: string
  fullAddress: string
  customerEmail: string
}

function InfoRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <tr>
      <td
        className={`px-4 py-3 text-sm text-gray-500 font-medium whitespace-nowrap align-top w-[160px] ${isLast ? '' : 'border-b border-gray-200'}`}
      >
        {label}
      </td>
      <td
        className={`px-4 py-3 text-sm text-gray-900 font-medium ${isLast ? '' : 'border-b border-gray-200'}`}
      >
        {value || '-'}
      </td>
    </tr>
  )
}

export default function InvoiceView({ data }: { data: InvoiceData }) {
  const isCompany = data.customerType === 'นิติบุคคล'
  const _displayName = isCompany ? data.companyName : `${data.titleName}${data.fullName}`

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-[640px] mx-auto">
        {/* Invoice Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="px-8 pt-7 pb-5 text-center border-b border-gray-200">
            {/* biome-ignore lint/performance/noImgElement: External URL for print/PDF view, next/image not suitable */}
            <img
              src="https://lcdtvthailand.com/cdn/shop/files/LOGO_LCDTVTHAILAND_SHOP_Official_2.png?v=1747763313&width=300"
              alt="LCDTVTHAILAND SHOP"
              className="mx-auto h-14 object-contain"
            />
          </div>

          {/* Red accent */}
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-800" />

          {/* Title bar */}
          <div className="px-8 py-5 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Tax Invoice
                </p>
                <h1 className="text-xl font-bold text-gray-900">ใบกำกับภาษี</h1>
              </div>
              <span className="inline-block px-3.5 py-1.5 bg-white border border-red-200 rounded-full text-xs text-red-600 font-semibold">
                ✓ ยืนยันแล้ว
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-7">
            {/* Customer/Company Info */}
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  {isCompany ? '🏢 ข้อมูลนิติบุคคล' : '👤 ข้อมูลผู้ขอใบกำกับภาษี'}
                </p>
              </div>
              <table className="w-full">
                <tbody>
                  <InfoRow label="ประเภท" value={isCompany ? 'นิติบุคคล' : 'บุคคลธรรมดา'} />
                  {isCompany ? (
                    <>
                      <InfoRow label="ชื่อบริษัท" value={data.companyName} />
                      <InfoRow label="สาขา" value={data.branchType} />
                      <InfoRow label="รหัสสาขา" value={data.branchCode} />
                    </>
                  ) : (
                    <>
                      <InfoRow label="คำนำหน้าชื่อ" value={data.titleName} />
                      <InfoRow label="ชื่อ-นามสกุล" value={data.fullName} />
                    </>
                  )}
                  <InfoRow
                    label="หมายเลขประจำตัวผู้เสียภาษี"
                    value={data.taxIdFormatted || data.taxId}
                  />
                  <InfoRow label="หมายเลขโทรศัพท์" value={data.phoneNumber} isLast />
                </tbody>
              </table>
            </div>

            {/* Address Info */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  📍 ที่อยู่สำหรับใบกำกับภาษี
                </p>
              </div>
              <table className="w-full">
                <tbody>
                  <InfoRow label="จังหวัด" value={data.province} />
                  <InfoRow label="อำเภอ/เขต" value={data.district} />
                  <InfoRow label="ตำบล/แขวง" value={data.subDistrict} />
                  <InfoRow label="ไปรษณีย์" value={data.postalCode} />
                  <InfoRow label="ที่อยู่" value={data.fullAddress} isLast />
                </tbody>
              </table>
            </div>
          </div>

          {/* Divider */}
          <div className="px-8">
            <div className="border-t border-gray-200" />
          </div>

          {/* Contact */}
          <div className="px-8 py-5 text-center">
            <p className="text-sm font-semibold text-gray-900 mb-2">ต้องการความช่วยเหลือ?</p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <a href="mailto:shop@lcdtvthailand.com" className="text-red-600 font-medium">
                ✉ shop@lcdtvthailand.com
              </a>
              <span className="text-gray-300">|</span>
              <a href="tel:020266442" className="text-red-600 font-medium">
                ☎ 02-026-6442
              </a>
              <span className="text-gray-300">|</span>
              <a href="https://lin.ee/lcdtvthailand" className="text-green-600 font-medium">
                LINE @lcdtvthailand
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-gray-100 border-t border-gray-200 text-center print:hidden">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} LCDTVTHAILAND SHOP — All rights reserved.
            </p>
          </div>
        </div>

        {/* Action Buttons - Outside card, at bottom */}
        <div className="mt-6 flex items-center justify-center gap-4 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            🖨️ พิมพ์
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 rounded-xl text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
          >
            📥 บันทึก PDF
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3 print:hidden">
          กด &quot;บันทึก PDF&quot; แล้วเลือก &quot;Save as PDF&quot; ในหน้าพิมพ์
        </p>
      </div>
    </div>
  )
}
