import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { nodesFrom } from '@/app/utils/orderUtils'

interface OrderTaxInvoiceInfoProps {
  order: OrderNode
}

export const OrderTaxInvoiceInfo: React.FC<OrderTaxInvoiceInfoProps> = ({ order }) => {
  const metafields = nodesFrom(order.metafields)

  // Helper to get metafield by namespace.key with fallbacks
  const getMf = (candidates: string[]): string => {
    for (const cand of candidates) {
      const [ns, key] = cand.split('.')
      // Try exact namespace.key first
      const exact = metafields.find(
        (m: any) => String(m?.namespace) === ns && String(m?.key) === key
      )
      if (exact && typeof exact.value !== 'undefined' && String(exact.value).trim() !== '') {
        return String(exact.value)
      }
      // Fallback: any namespace with same key
      const anyNs = metafields.find((m: any) => String(m?.key) === key)
      if (anyNs && typeof anyNs.value !== 'undefined' && String(anyNs.value).trim() !== '') {
        return String(anyNs.value)
      }
    }
    return '-'
  }

  const items = [
    {
      k: 'ประเภท (นิติบุคคล/บุคคลธรรมดา)',
      v: getMf(['custom.customer_type', 'custom.custom_customer_type']),
    },
    {
      k: 'คำนำหน้าชื่อ',
      v: getMf(['custom.title_name', 'custom.custom_title_name']),
    },
    {
      k: 'ชื่อ-นามสกุล',
      v: getMf(['custom.full_name', 'custom.custom_full_name']),
    },
    {
      k: 'ชื่อบริษัท',
      v: getMf(['custom.company_name', 'custom.custom_company_name']),
    },
    {
      k: 'สาขา',
      v: getMf(['custom.branch_type', 'custom.custom_branch_type']),
    },
    {
      k: 'รหัสสาขา',
      v: getMf(['custom.branch_code', 'custom.custom_branch_code']),
    },
    {
      k: 'หมายเลขประจำตัวผู้เสียภาษี',
      v: getMf([
        'custom.tax_id',
        'custom.custom_tax_id',
        'custom.tax_id_formatted',
        'custom.custom_tax_id_formatted',
      ]),
    },
    {
      k: 'หมายเลขโทรศัพท์',
      v: getMf(['custom.phone_number', 'custom.custom_phone_number']),
    },
    {
      k: 'จังหวัด',
      v: getMf(['custom.province', 'custom.custom_province']),
    },
    {
      k: 'อำเภอ/เขต',
      v: getMf(['custom.district', 'custom.custom_district']),
    },
    {
      k: 'ตำบล/แขวง',
      v: getMf(['custom.sub_district', 'custom.custom_sub_district']),
    },
    {
      k: 'ไปรษณีย์',
      v: getMf(['custom.postal_code', 'custom.custom_postal_code']),
    },
    {
      k: 'ที่อยู่',
      v: getMf(['custom.full_address', 'custom.custom_full_address']),
    },
  ]

  return (
    <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4 lg:col-start-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500 rounded-lg">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h4 className="font-semibold text-red-800 text-lg">ใบกำกับภาษี</h4>
      </div>
      <div className="space-y-4 flex flex-col items-center sm:block">
        <div className="text-sm font-semibold text-gray-800 flex items-center gap-2"></div>
        <div className="border border-red-200 rounded-2xl p-3 sm:p-4 bg-white shadow-inner w-full max-w-full sm:max-w-none">
          {/* Desktop table layout (hidden on mobile) */}
          <table className="hidden sm:table w-full text-sm">
            <tbody className="divide-y divide-gray-200">
              {items.map((p, idx) => (
                <tr key={`${p.k}-${idx}`} className="hover:bg-gray-50">
                  <td className="align-top py-3 pr-6 w-64 text-xs font-semibold text-gray-700">
                    {p.k}
                  </td>
                  <td className="align-top py-3 text-sm text-gray-900 break-words">
                    <span className="bg-red-200 px-2 py-1 rounded-md font-medium border border-red-100">
                      {p.k.includes('หมายเลขประจำตัวผู้เสียภาษี')
                        ? String(p.v || '').replace(/-/g, '')
                        : p.v}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile 2-line layout (visible only on mobile) */}
          <div className="block sm:hidden space-y-3">
            {items.map((p, idx) => (
              <div
                key={`${p.k}-${idx}`}
                className="pb-3 border-b border-gray-200 last:border-b-0 last:pb-0"
              >
                <div className="text-xs font-semibold text-gray-700 mb-1 text-left">{p.k}</div>
                <div className="pl-4">
                  <span className="bg-red-200 px-2 py-1 rounded-md font-medium text-sm text-gray-900 inline-block text-left break-all border border-red-100">
                    {p.k.includes('หมายเลขประจำตัวผู้เสียภาษี')
                      ? String(p.v || '').replace(/-/g, '')
                      : p.v}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
