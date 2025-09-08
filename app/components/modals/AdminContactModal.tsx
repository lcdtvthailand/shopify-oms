'use client'

import { useState } from 'react'
import {
  generateContactTemplate,
  getAdminContact,
  type OrderStatus,
} from '@/lib/services/order-status'

interface AdminContactModalProps {
  isOpen: boolean
  onClose: () => void
  orderNumber: string
  orderStatus: OrderStatus
  customerEmail: string
}

export function AdminContactModal({
  isOpen,
  onClose,
  orderNumber,
  orderStatus,
  customerEmail,
}: AdminContactModalProps) {
  const [copied, setCopied] = useState(false)
  const adminContact = getAdminContact()
  const emailTemplate = generateContactTemplate(orderNumber, orderStatus, customerEmail)

  if (!isOpen) return null

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailTemplate)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEmailClick = () => {
    const subject = encodeURIComponent(`ขอความช่วยเหลือ - ใบกำกับภาษี คำสั่งซื้อ #${orderNumber}`)
    const body = encodeURIComponent(emailTemplate)
    window.location.href = `mailto:${adminContact.email}?subject=${subject}&body=${body}`
  }

  const handlePhoneClick = () => {
    window.location.href = `tel:${adminContact.phone.replace(/\D/g, '')}`
  }

  const handleLineClick = () => {
    window.open(`https://line.me/R/ti/p/${adminContact.lineId}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">ติดต่อเจ้าหน้าที่</h2>
            <p className="text-gray-600 mt-1">กรุณาติดต่อเจ้าหน้าที่เพื่อขอความช่วยเหลือ</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={handleEmailClick}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-8 h-8 text-red-600 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium text-gray-900">อีเมล</span>
              <span className="text-sm text-gray-600">{adminContact.email}</span>
            </button>

            <button
              type="button"
              onClick={handlePhoneClick}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-8 h-8 text-red-600 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="font-medium text-gray-900">โทรศัพท์</span>
              <span className="text-sm text-gray-600">{adminContact.phone}</span>
            </button>

            <button
              type="button"
              onClick={handleLineClick}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-8 h-8 text-green-500 mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15h-2v-3h2v-1c0-2.76 1.34-4 3.91-4 1.16 0 1.73.09 2.01.13v2.2h-1.38c-1.36 0-1.62.65-1.62 1.6V12h3l-.4 3h-2.6v6.82C18.57 20.89 22 16.84 22 12c0-5.52-4.48-10-10-10z" />
              </svg>
              <span className="font-medium text-gray-900">LINE</span>
              <span className="text-sm text-gray-600">{adminContact.lineId}</span>
            </button>
          </div>

          {/* Office Hours */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">เวลาทำการ:</span> {adminContact.officeHours}
            </p>
          </div>

          {/* Email Template */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900">ข้อความสำหรับติดต่อ</h3>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="text-sm text-red-600 hover:text-red-700 flex items-center"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    คัดลอกแล้ว
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    คัดลอก
                  </>
                )}
              </button>
            </div>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">
              {emailTemplate}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}
