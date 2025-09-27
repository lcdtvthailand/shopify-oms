'use client'

import { useState } from 'react'
import type { OrderNode } from './useOrderData'

interface UseOrderExportReturn {
  exportingAll: boolean
  exportToXlsx: (orders?: OrderNode[]) => Promise<void>
  exportAllFromShopify: () => void
}

export const useOrderExport = (defaultOrders?: OrderNode[]): UseOrderExportReturn => {
  const [exportingAll, _setExportingAll] = useState(false)

  // Helper functions
  const nodesFrom = (src: any): any[] => {
    if (!src) return []
    if (Array.isArray(src)) return src
    if (Array.isArray(src.edges)) return src.edges.map((e: any) => e?.node ?? e).filter(Boolean)
    return []
  }

  const exportToXlsx = async (orders?: OrderNode[]) => {
    try {
      const ExcelJSImport: any = await import('exceljs')
      const ExcelJS = ExcelJSImport?.default ? ExcelJSImport.default : ExcelJSImport

      // Use provided orders or default orders
      const ordersToExport = orders || defaultOrders || []
      if (ordersToExport.length === 0) {
        alert('ไม่มีข้อมูลคำสั่งซื้อให้ส่งออก')
        return
      }

      const ordersRows: any[] = []

      // Helper function to safely parse numbers
      const parseNumber = (value: string | undefined | null): number => {
        if (!value || value === '') return 0
        const parsed = parseFloat(value)
        return Number.isNaN(parsed) ? 0 : parsed
      }

      ordersToExport.forEach((o) => {
        const customerName = o.customer?.displayName || o.customer?.email || ''
        const ship = (o.shippingLines as any)?.edges?.[0]?.node
        const tracking = Array.isArray(o.fulfillments)
          ? o.fulfillments.flatMap((f: any) =>
              Array.isArray(f?.trackingInfo)
                ? f.trackingInfo.map((t: any) => t?.number).filter(Boolean)
                : []
            )
          : []
        const shippingAddress = o.shippingAddress || {}

        // Consolidated summaries
        const itemEdges: any[] = (o.lineItems as any)?.edges || []
        const formatItem = (it: any) => {
          const name = it?.name || ''
          return `${name}`
        }

        const discEdges: any[] = (o.discountApplications as any)?.edges || []
        const discountSummary = discEdges
          .map((e: any) => {
            const d = e.node
            const type = d?.__typename || ''
            const codeOrTitle = d?.code || d?.title || ''
            const amount = d?.value?.amount || ''
            return `${type}${codeOrTitle ? ` ${codeOrTitle}` : ''}${amount ? ` amount:${amount}` : ''}`
          })
          .join(' | ')

        // Tax invoice fields from metafields (custom.*)
        const mlist = nodesFrom((o as any).metafields)
        const getMf = (candidates: string[]): string => {
          for (const cand of candidates) {
            const [ns, key] = String(cand).split('.')
            // First try exact namespace.key match
            const exact = (mlist as any[]).find(
              (m: any) => String(m?.namespace) === ns && String(m?.key) === key
            )
            if (exact && typeof exact.value !== 'undefined' && String(exact.value).trim() !== '') {
              return String(exact.value)
            }
            // Fallback: match by key across any namespace
            const anyNs = (mlist as any[]).find((m: any) => String(m?.key) === key)
            if (anyNs && typeof anyNs.value !== 'undefined' && String(anyNs.value).trim() !== '') {
              return String(anyNs.value)
            }
          }
          return ''
        }

        // Determine shipping option display and delivery method per checkout mapping
        const shippingOptionRaw = String(ship?.title || ship?.source || '')
        const shippingOptionDisplay =
          shippingOptionRaw === 'Thailand Shipping'
            ? `${shippingOptionRaw} (รับสินค้าเองที่ร้าน)`
            : shippingOptionRaw
        const deliveryMethodText =
          shippingOptionDisplay === 'Thailand Shipping (รับสินค้าเองที่ร้าน)'
            ? 'รับสินค้าเองที่ร้าน'
            : 'จัดส่งตามที่อยู่'

        // Determine whether buyer requested a tax invoice based on presence of key TI metafields
        const requestedTaxInvoice = !!(
          getMf(['custom.customer_type', 'custom.custom_customer_type']) ||
          getMf(['custom.company_name', 'custom.custom_company_name']) ||
          getMf([
            'custom.tax_id',
            'custom.custom_tax_id',
            'custom.tax_id_formatted',
            'custom.custom_tax_id_formatted',
          ]) ||
          getMf(['custom.full_address', 'custom.custom_full_address'])
        )

        const baseRow = {
          หมายเลขคำสั่งซื้อ: o.name,
          วันที่: o.createdAt ? new Date(o.createdAt).toLocaleString('th-TH') : '',
          สถานะการชำระเงิน: o.displayFinancialStatus || '',
          สถานะการจัดส่ง: o.displayFulfillmentStatus || '',
          'ชื่อผู้ใช้ (ผู้ซื้อ)': customerName,
          อีเมล: o.customer?.email || o.email || '',
          เบอร์โทร: o.customer?.phone || '',
          ตัวเลือกการจัดส่ง: shippingOptionDisplay,
          วิธีการจัดส่ง: deliveryMethodText,
          หมายเลขติดตามพัสดุ: tracking.join(', '),
          ชื่อผู้รับ: shippingAddress?.name || '',
          เบอร์โทรผู้รับ: shippingAddress?.phone || '',
          ที่อยู่ผู้รับ: shippingAddress?.address1 || '',
          'ตำบล/แขวง': shippingAddress?.address2 || '',
          'อำเภอ/เขต': shippingAddress?.city || '',
          จังหวัด: shippingAddress?.province || '',
          ประเทศ: shippingAddress?.country || '',
          รหัสไปรษณีย์: shippingAddress?.zip || '',
          รายการสินค้า: '',
          SKU: '',
          ราคาตั้งต้น: 0,
          ราคาขาย: 0,
          จำนวนสินค้า: 0,
          ราคาขายสุทธิ: 0,
          ส่วนลด: discountSummary,
          ส่วนลดรวม: parseNumber(o.currentTotalDiscountsSet?.shopMoney?.amount),
          ยอดรวม: parseNumber(o.currentTotalPriceSet?.shopMoney?.amount),
          ยอดสินค้า: parseNumber(o.currentSubtotalPriceSet?.shopMoney?.amount),
          ค่าส่ง: parseNumber(o.currentShippingPriceSet?.shopMoney?.amount),
          ภาษี: parseNumber(o.currentTotalTaxSet?.shopMoney?.amount),
          ร้องขอใบกำกับภาษี: requestedTaxInvoice ? 'ขอใบกำกับภาษี' : 'ไม่ขอใบกำกับภาษี',
          ประเภทใบกำกับภาษี: getMf(['custom.customer_type', 'custom.custom_customer_type']),
          'คำนำหน้าชื่อ (ใบกำกับภาษี)': getMf(['custom.title_name', 'custom.custom_title_name']),
          'ชื่อ-นามสกุล (ใบกำกับภาษี)': getMf(['custom.full_name', 'custom.custom_full_name']),
          'ชื่อบริษัท (ใบกำกับภาษี)': getMf([
            'custom.company_name',
            'custom.custom_company_name',
            'custom.custom_company_name',
          ]),
          'ประเภทสาขา (ใบกำกับภาษี)': getMf(['custom.branch_type', 'custom.custom_branch_type']),
          'รหัสสาขา (ใบกำกับภาษี)': getMf(['custom.branch_code', 'custom.custom_branch_code']),
          เลขผู้เสียภาษี: getMf([
            'custom.tax_id',
            'custom.custom_tax_id',
            'custom.tax_id_formatted',
            'custom.custom_tax_id_formatted',
          ]),
          'โทรศัพท์ (ใบกำกับภาษี)': getMf(['custom.phone_number', 'custom.custom_phone_number']),
          'จังหวัด (ใบกำกับภาษี)': getMf(['custom.province', 'custom.custom_province']),
          'อำเภอ/เขต (ใบกำกับภาษี)': getMf(['custom.district', 'custom.custom_district']),
          'ตำบล/แขวง (ใบกำกับภาษี)': getMf(['custom.sub_district', 'custom.custom_sub_district']),
          'ไปรษณีย์ (ใบกำกับภาษี)': getMf(['custom.postal_code', 'custom.custom_postal_code']),
          'ที่อยู่ (ใบกำกับภาษี)': getMf(['custom.full_address', 'custom.custom_full_address']),
        }

        if (itemEdges.length > 0) {
          // Group same items together (by SKU if present, otherwise by name + variant + unit price)
          const groups = new Map<string, { it: any; qty: number }>()
          itemEdges.forEach((e: any) => {
            const it = e.node
            const qty = Number(it?.quantity ?? 0)
            const sku = it?.sku || it?.variant?.sku || ''
            const name = it?.name || ''
            const variantTitle = it?.variant?.title || ''
            const unit = parseFloat(it?.discountedUnitPriceSet?.shopMoney?.amount || '0')
            const key = sku
              ? `SKU:${sku}|PRICE:${unit.toFixed(2)}`
              : `NAME:${name}|VAR:${variantTitle}|PRICE:${unit.toFixed(2)}`
            const existed = groups.get(key)
            if (existed) {
              existed.qty += qty
            } else {
              groups.set(key, { it, qty })
            }
          })
          Array.from(groups.values()).forEach(({ it, qty }) => {
            const unit = parseFloat(it?.discountedUnitPriceSet?.shopMoney?.amount || '0')
            ordersRows.push({
              ...baseRow,
              รายการสินค้า: formatItem(it),
              จำนวนสินค้า: qty,
              SKU: it?.sku || it?.variant?.sku || '',
              ราคาตั้งต้น: it?.originalUnitPriceSet?.shopMoney?.amount || '',
              ราคาขาย: it?.discountedUnitPriceSet?.shopMoney?.amount || '',
              ราคาขายสุทธิ: (unit * qty).toFixed(2),
            })
          })
        } else {
          ordersRows.push({
            ...baseRow,
            รายการสินค้า: '-',
            จำนวนสินค้า: 0,
            SKU: '',
            ราคาตั้งต้น: '',
            ราคาขาย: '',
            ราคาขายสุทธิ: '',
          })
        }
      })

      // Create additional sheets
      const itemsRows: any[] = []
      ordersToExport.forEach((o) => {
        const items = (o.lineItems as any)?.edges || []
        items.forEach((edge: any) => {
          const it = edge.node
          const unitAfterDisc = parseFloat(it?.discountedUnitPriceSet?.shopMoney?.amount || '0')
          const qty = Number(it?.quantity ?? 0)
          const netPerItem = unitAfterDisc * qty
          const variantTitleRaw = (it?.variant?.title || '').trim()
          const optionName =
            variantTitleRaw && variantTitleRaw.toLowerCase() !== 'default title'
              ? variantTitleRaw
              : ''
          itemsRows.push({
            หมายเลขคำสั่งซื้อ: o.name,
            ชื่อสินค้า: it?.name || '',
            'เลขอ้างอิง SKU (SKU Reference No.)': it?.sku || it?.variant?.sku || '',
            ชื่อตัวเลือก: optionName,
            ราคาตั้งต้น: parseNumber(it?.originalUnitPriceSet?.shopMoney?.amount as string),
            ราคาขาย: parseNumber(it?.discountedUnitPriceSet?.shopMoney?.amount as string),
            จำนวน: qty,
            'ราคาขายสุทธิ (ต่อไอเท็ม)': netPerItem,
            จำนวนที่คืนได้: it?.refundableQuantity ?? '',
            ส่วนลดรวม: parseNumber(it?.totalDiscountSet?.shopMoney?.amount as string),
          })
        })
      })

      const shippingRows: any[] = []
      ordersToExport.forEach((o) => {
        const lines = (o.shippingLines as any)?.edges || []
        lines.forEach((e: any) => {
          const s = e.node
          shippingRows.push({
            เลขที่ออเดอร์: o.name,
            ชื่อบริการ: s?.title || '',
            รหัส: s?.code || '',
            ราคาก่อนส่วนลด: parseNumber(s?.originalPriceSet?.shopMoney?.amount as string),
            ราคาหลังส่วนลด: parseNumber(s?.discountedPriceSet?.shopMoney?.amount as string),
          })
        })
      })

      const discountRows: any[] = []
      ordersToExport.forEach((o) => {
        const dapps = (o.discountApplications as any)?.edges || []
        dapps.forEach((e: any) => {
          const d = e.node
          discountRows.push({
            เลขที่ออเดอร์: o.name,
            ประเภทส่วนลด: d?.__typename || '',
            'โค้ด/ชื่อ': d?.code || d?.title || '',
            จำนวนเงิน: d?.value?.amount || '',
            เปอร์เซ็นต์: d?.value?.percentage ?? '',
          })
        })
      })

      // Build structured tax invoice sheet from metafields (custom.*) for ALL export
      const taxInvoiceRows: any[] = []
      ordersToExport.forEach((o) => {
        const mlist = nodesFrom((o as any).metafields)
        const getMf = (candidates: string[]): string => {
          for (const cand of candidates) {
            const [ns, key] = String(cand).split('.')
            const found = (mlist as any[]).find(
              (m: any) => String(m?.namespace) === ns && String(m?.key) === key
            )
            if (found && typeof found.value !== 'undefined' && String(found.value).trim() !== '') {
              return String(found.value)
            }
          }
          return ''
        }

        const row = {
          เลขที่ออเดอร์: o.name,
          'ประเภท (นิติบุคคล/บุคคลธรรมดา)': getMf([
            'custom.customer_type',
            'custom.custom_customer_type',
          ]),
          คำนำหน้าชื่อ: getMf(['custom.title_name', 'custom.custom_title_name']),
          'ชื่อ-นามสกุล': getMf(['custom.full_name', 'custom.custom_full_name']),
          ชื่อบริษัท: getMf([
            'custom.company_name',
            'custom.custom_company_name',
            'custom.custom_company_name',
          ]),
          สาขา: getMf(['custom.branch_type', 'custom.custom_branch_type']),
          รหัสสาขา: getMf(['custom.branch_code', 'custom.custom_branch_code']),
          หมายเลขประจำตัวผู้เสียภาษี: getMf([
            'custom.tax_id',
            'custom.custom_tax_id',
            'custom.tax_id_formatted',
            'custom.custom_tax_id_formatted',
          ]),
          หมายเลขโทรศัพท์: getMf(['custom.phone_number', 'custom.custom_phone_number']),
          จังหวัด: getMf(['custom.province', 'custom.custom_province']),
          'อำเภอ/เขต': getMf(['custom.district', 'custom.custom_district']),
          'ตำบล/แขวง': getMf(['custom.sub_district', 'custom.custom_sub_district']),
          ไปรษณีย์: getMf(['custom.postal_code', 'custom.custom_postal_code']),
          ที่อยู่: getMf(['custom.full_address', 'custom.custom_full_address']),
        }

        // Include only rows that have any non-empty field other than order number
        const hasInfo = Object.entries(row).some(
          ([k, v]) => k !== 'เลขที่ออเดอร์' && String(v ?? '').trim() !== ''
        )
        if (hasInfo) {
          taxInvoiceRows.push(row)
        }
      })

      const wb = new ExcelJS.Workbook()
      const addSheetFromRows = (
        name: string,
        rows: any[]
      ): { ws: any; headers: string[] } | null => {
        const ws = wb.addWorksheet(name)
        if (!rows || rows.length === 0) return { ws, headers: [] }
        const headers = Object.keys(rows[0])
        ws.columns = headers.map((h) => ({
          header: h,
          key: h,
          width: Math.min(40, Math.max(12, String(h).length + 2)),
        }))
        rows.forEach((r) => {
          ws.addRow(r)
        })
        return { ws, headers }
      }

      const main = addSheetFromRows('คำสั่งซื้อ', ordersRows)
      const items = addSheetFromRows('รายการสินค้า', itemsRows)
      const shipping = addSheetFromRows('การจัดส่ง', shippingRows)
      addSheetFromRows('ส่วนลด', discountRows)
      addSheetFromRows('ใบกำกับภาษี', taxInvoiceRows)

      // Style tax-invoice request column in main sheet
      if (main?.headers.length) {
        const colIdx = main.headers.indexOf('ร้องขอใบกำกับภาษี') + 1
        if (colIdx > 0) {
          const ws = main.ws
          for (let r = 2; r <= ws.rowCount; r++) {
            const cell = ws.getRow(r).getCell(colIdx)
            const val = String(cell.value ?? '')
            const isRequested = val === 'ขอใบกำกับภาษี'
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: isRequested ? 'FFC6F6D5' : 'FFFECACA' }, // green-200 / red-200
            }
          }
        }
        // Format Tax column as number
        const taxColIdx = main.headers.indexOf('ภาษี') + 1
        if (taxColIdx > 0) {
          const ws = main.ws
          ws.getColumn(taxColIdx).numFmt = '#,##0.00'
        }
      }

      // Format base price in Items sheet as currency/price
      if (items?.headers.length) {
        const priceColIdx = items.headers.indexOf('ราคาตั้งต้น') + 1
        if (priceColIdx > 0) {
          const ws = items.ws
          ws.getColumn(priceColIdx).numFmt = '#,##0.00'
        }
      }

      // Format price-before-discount in Shipping sheet as currency/price
      if (shipping?.headers.length) {
        const baseShipColIdx = shipping.headers.indexOf('ราคาก่อนส่วนลด') + 1
        if (baseShipColIdx > 0) {
          const ws = shipping.ws
          ws.getColumn(baseShipColIdx).numFmt = '#,##0.00'
        }
      }

      // Determine filename based on the date range of orders included
      const createdDates = ordersToExport
        .map((o) => new Date(o.createdAt))
        .filter((d) => !Number.isNaN(d.getTime()))
      const formatYMD = (dt: Date) => {
        const y = dt.getFullYear()
        const m = String(dt.getMonth() + 1).padStart(2, '0')
        const dd = String(dt.getDate()).padStart(2, '0')
        return `${y}-${m}-${dd}`
      }
      let fileName = `orders_${new Date().toISOString().slice(0, 10)}.xlsx`
      if (createdDates.length > 0) {
        const minDate = new Date(Math.min(...createdDates.map((d) => d.getTime())))
        const maxDate = new Date(Math.max(...createdDates.map((d) => d.getTime())))
        const fromStr = formatYMD(minDate)
        const toStr = formatYMD(maxDate)
        const rangePart = `${fromStr}_to_${toStr}`
        fileName = `orders_${rangePart}.xlsx`
      }

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed', err)
      alert('ไม่สามารถส่งออกไฟล์ได้ กรุณาติดตั้งแพ็กเกจ exceljs และลองใหม่')
    }
  }

  // Temporary stub to avoid reference error from the hidden button
  const exportAllFromShopify = () => {
    // This button is currently hidden (display: 'none').
    // Implement full export-all logic here if enabling the button in the future.
    console.warn('exportAllFromShopify is currently disabled')
  }

  return {
    exportingAll,
    exportToXlsx,
    exportAllFromShopify,
  }
}
