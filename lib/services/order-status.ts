/**
 * Order status validation utilities for tax invoice eligibility
 */

import type { AdminContact } from '@/types/admin'
import type {
  OrderFinancialStatus,
  OrderFulfillmentStatus,
  OrderStatus,
  OrderStatusValidation,
} from '@/types/order'

// Re-export types for backward compatibility
export type {
  AdminContact,
  OrderFinancialStatus,
  OrderFulfillmentStatus,
  OrderStatus,
  OrderStatusValidation,
}

/**
 * Check if an order is eligible for tax invoice creation
 */
export function validateOrderStatus(status: OrderStatus): OrderStatusValidation {
  // Check if order is cancelled
  if (status.cancelledAt) {
    return {
      isEligible: false,
      reason: 'cancelled',
      message: 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว กรุณาติดต่อเจ้าหน้าที่เพื่อขอความช่วยเหลือ',
    }
  }

  // Check if order is refunded
  if (status.financialStatus === 'refunded' || status.financialStatus === 'partially_refunded') {
    return {
      isEligible: false,
      reason: 'refunded',
      message: 'คำสั่งซื้อนี้ได้รับการคืนเงินแล้ว ไม่สามารถออกใบกำกับภาษีได้',
    }
  }

  // Check if order is already fulfilled
  if (status.fulfillmentStatus === 'fulfilled') {
    return {
      isEligible: false,
      reason: 'fulfilled',
      message: 'คำสั่งซื้อนี้ได้ออกใบกำกับภาษีแล้ว หากต้องการสำเนา กรุณาติดต่อเจ้าหน้าที่',
    }
  }

  // Check if order is unpaid
  if (status.financialStatus === 'pending' || status.financialStatus === 'voided') {
    return {
      isEligible: false,
      reason: 'unpaid',
      message: 'คำสั่งซื้อนี้ยังไม่ได้ชำระเงิน กรุณาชำระเงินก่อนขอใบกำกับภาษี',
    }
  }

  // Order is eligible (paid or partially paid, and not fulfilled)
  return {
    isEligible: true,
    message: 'คำสั่งซื้อนี้สามารถออกใบกำกับภาษีได้',
  }
}

/**
 * Get display status in Thai
 */
export function getOrderStatusDisplay(status: OrderStatus): {
  financial: string
  fulfillment: string
  overall: string
} {
  // Financial status mapping
  const financialStatusMap: Record<OrderFinancialStatus, string> = {
    pending: 'รอการชำระเงิน',
    paid: 'ชำระเงินแล้ว',
    partially_paid: 'ชำระเงินบางส่วน',
    refunded: 'คืนเงินแล้ว',
    partially_refunded: 'คืนเงินบางส่วน',
    voided: 'ยกเลิกการชำระเงิน',
  }

  // Fulfillment status mapping
  const fulfillmentStatusMap: Record<NonNullable<OrderFulfillmentStatus>, string> = {
    fulfilled: 'จัดส่งแล้ว',
    partial: 'จัดส่งบางส่วน',
    unfulfilled: 'ยังไม่จัดส่ง',
  }

  const financial = financialStatusMap[status.financialStatus] || status.financialStatus
  const fulfillment = status.fulfillmentStatus
    ? fulfillmentStatusMap[status.fulfillmentStatus] || status.fulfillmentStatus
    : 'ยังไม่จัดส่ง'

  // Overall status
  let overall = financial
  if (status.cancelledAt) {
    overall = 'ยกเลิกแล้ว'
  } else if (status.fulfillmentStatus === 'fulfilled') {
    overall = 'เสร็จสมบูรณ์'
  }

  return { financial, fulfillment, overall }
}

/**
 * Get admin contact information from environment variables
 */
export function getAdminContact(): AdminContact {
  return {
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@lcdtvthailand.com',
    phone: process.env.NEXT_PUBLIC_ADMIN_PHONE || '02-000-0000',
    lineId: process.env.NEXT_PUBLIC_ADMIN_LINE_ID || '@lcdtvthailand',
    officeHours: process.env.NEXT_PUBLIC_ADMIN_OFFICE_HOURS || 'จันทร์-ศุกร์ 9:00-18:00',
  }
}

/**
 * Generate contact template for email
 */
export function generateContactTemplate(
  orderNumber: string,
  status: OrderStatus,
  customerEmail: string
): string {
  const statusDisplay = getOrderStatusDisplay(status)

  return `Subject: ขอความช่วยเหลือ - ใบกำกับภาษี คำสั่งซื้อ #${orderNumber}

เรียน ฝ่ายบริการลูกค้า

ข้าพเจ้าต้องการขอความช่วยเหลือเกี่ยวกับใบกำกับภาษีสำหรับคำสั่งซื้อ

รายละเอียด:
- หมายเลขคำสั่งซื้อ: #${orderNumber}
- อีเมล: ${customerEmail}
- สถานะคำสั่งซื้อ: ${statusDisplay.overall}
- สถานะการชำระเงิน: ${statusDisplay.financial}
- สถานะการจัดส่ง: ${statusDisplay.fulfillment}

ปัญหาที่พบ: ไม่สามารถสร้างใบกำกับภาษีได้เนื่องจากสถานะคำสั่งซื้อ

ขอบคุณครับ/ค่ะ`
}
