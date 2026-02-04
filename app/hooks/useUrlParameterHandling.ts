'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseUrlParameterHandlingReturn {
  orderId: string
  email: string
  isValidated: boolean
  validationMessage: string
  showValidationPopup: boolean
  validationInProgress: boolean
  loading: boolean
  error: string | null
  setOrderId: (id: string) => void
  setEmail: (email: string) => void
  setIsValidated: (validated: boolean) => void
  setValidationMessage: (message: string) => void
  setShowValidationPopup: (show: boolean) => void
  setValidationInProgress: (inProgress: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  validateParameters: (orderIdParam?: string, emailParam?: string) => Promise<void>
  fetchLatestOrderByEmail: (
    customerEmail: string
  ) => Promise<{ orderNumber: string; createdAt: string } | null>
  waitForNewestOrderAfter: (
    customerEmail: string,
    timeoutMs?: number,
    intervalMs?: number
  ) => Promise<string | null>
}

export const useUrlParameterHandling = (
  onValidationSuccess?: (orderData: any) => void
): UseUrlParameterHandlingReturn => {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Guard to prevent repeated processing of the same query set
  const lastProcessedRef = useRef<string | null>(null)

  // Timestamp to help detect orders created after landing on this page
  const arrivalAtRef = useRef<string>(new Date().toISOString())

  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [isValidated, setIsValidated] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [showValidationPopup, setShowValidationPopup] = useState(false)
  const [validationInProgress, setValidationInProgress] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper: Fetch latest order by email with createdAt for recency checks
  const fetchLatestOrderByEmail = useCallback(
    async (customerEmail: string): Promise<{ orderNumber: string; createdAt: string } | null> => {
      const FIND_BY_EMAIL = `
      query findOrdersByEmail($query: String!) {
        orders(first: 1, query: $query, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              customer { email }
            }
          }
        }
      }
    `
      const runSearch = async (queryString: string) => {
        const response = await fetch('/api/shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: FIND_BY_EMAIL, variables: { query: queryString } }),
        })
        let result: any | null
        try {
          result = await response.json()
        } catch {
          result = null
        }
        const node = result?.data?.orders?.edges?.[0]?.node
        if (!node) {
          return null
        }
        if ((node.customer?.email || '').toLowerCase() !== customerEmail.toLowerCase()) {
          return null
        }
        const orderNumber = String((node.name || '').replace(/^#/, ''))
        const createdAt = String(node.createdAt || '')
        if (!orderNumber || !createdAt) {
          return null
        }
        return { orderNumber, createdAt }
      }

      try {
        // Important: quote the email to avoid parsing issues with '@'
        // Also constrain by created_at to only pick orders created after arrival (minus skew)
        const skewMs = 60000
        const sinceIso = new Date(new Date(arrivalAtRef.current).getTime() - skewMs).toISOString()

        // Try with created_at constraint first (single query to reduce API calls)
        const primaryQuery = `email:"${customerEmail}" created_at:>=${sinceIso}`
        const res = await runSearch(primaryQuery)
        if (res) {
          return res
        }

        // Fallback: try without created_at constraint (only one fallback query)
        const fallbackQuery = `email:"${customerEmail}"`
        return await runSearch(fallbackQuery)
      } catch {
        // fetchLatestOrderByEmail failed
        return null
      }
    },
    []
  )

  // Poll until a newly created order (>= arrival time minus a small skew) appears
  // IMPORTANT: Do NOT return old orders as fallback to prevent customer data leakage
  const waitForNewestOrderAfter = useCallback(
    async (customerEmail: string, timeoutMs = 15000, intervalMs = 3000): Promise<string | null> => {
      const skewMs = 60000 // 1 minute clock/indexing skew tolerance
      const deadline = Date.now() + timeoutMs
      const arrival = new Date(arrivalAtRef.current).getTime()

      // Limit polling attempts to prevent 429 errors
      let attempts = 0
      const maxAttempts = 5

      while (Date.now() < deadline && attempts < maxAttempts) {
        attempts++
        const latest = await fetchLatestOrderByEmail(customerEmail)
        if (latest) {
          const createdTs = new Date(latest.createdAt).getTime()
          // Only return if this order was created after user arrived (new order)
          if (!Number.isNaN(createdTs) && createdTs >= arrival - skewMs) {
            return latest.orderNumber
          }
        }
        // Wait before next attempt
        if (Date.now() < deadline && attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, intervalMs))
        }
      }
      // Do NOT return old orders - return null to require explicit order ID
      return null
    },
    [fetchLatestOrderByEmail]
  )

  const validateParameters = useCallback(
    async (orderIdParam?: string, emailParam?: string) => {
      const checkOrderId = orderIdParam || orderId
      const checkEmail = emailParam || email

      if (!checkOrderId || !checkEmail) {
        setValidationMessage('กรุณาระบุทั้ง Order ID และ Email ใน URL')
        setShowValidationPopup(true)
        setIsValidated(false)
        return
      }

      setLoading(true)
      setError(null)
      setValidationInProgress(true)

      // ค้นหาออเดอร์จากเลข Order Number และตรวจสอบ email
      const GET_ORDER_DETAILS = `
      query getOrderByName($query: String!) {
        orders(first: 1, query: $query) {
          edges {
            node {
              id
              name
              customer { id email }
            }
          }
        }
      }
    `

      try {
        const response = await fetch('/api/shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: GET_ORDER_DETAILS,
            variables: { query: `name:#${checkOrderId}` },
            expectedEmail: checkEmail,
          }),
        })

        let result: any | null
        try {
          result = await response.json()
        } catch {
          result = null
        }

        if (!response.ok) {
          const message = result?.errors?.[0]?.message || 'Failed to fetch order data'
          throw new Error(message)
        }

        if (result?.errors) {
          throw new Error(result.errors[0]?.message || 'GraphQL error')
        }

        const node = result?.data?.orders?.edges?.[0]?.node
        if (!node) {
          setValidationMessage('ไม่พบออเดอร์ตามเลขที่ระบุ กรุณาตรวจสอบ Order ID')
          setShowValidationPopup(true)
          setIsValidated(false)
          return
        }

        // ตรวจสอบว่า email ตรงกันหรือไม่
        // For anonymous orders, customer might be null - skip email validation if anonymous email pattern
        const isAnonymousEmail =
          checkEmail.includes('anonymous-') && checkEmail.includes('@example.com')
        const customerEmail = node.customer?.email?.toLowerCase()

        if (!isAnonymousEmail && customerEmail !== checkEmail.toLowerCase()) {
          setValidationMessage('ไม่มีคำสั่งซื้อหรือผู้ใช้นี้ในระบบ')
          setShowValidationPopup(true)
          setIsValidated(false)
          return
        }

        // Success - call callback with order data
        const orderData = {
          id: node.id,
          name: node.name,
          customerId: node.customer?.id || null,
          customer: node.customer,
        }

        setIsValidated(true)
        setValidationMessage('ตรวจสอบข้อมูลสำเร็จ! สามารถกรอกฟอร์มได้')
        setShowValidationPopup(false)

        if (onValidationSuccess) {
          onValidationSuccess(orderData)
        }
      } catch (err) {
        setValidationMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล')
        setShowValidationPopup(true)
        setIsValidated(false)
      } finally {
        setLoading(false)
        setValidationInProgress(false)
      }
    },
    [orderId, email, onValidationSuccess]
  )

  // Keep a stable reference to validateParameters so the effect below
  // doesn't re-run when its identity changes
  const validateParametersRef = useRef(validateParameters)
  useEffect(() => {
    validateParametersRef.current = validateParameters
  }, [validateParameters])

  // Keep stable refs for router and waitForNewestOrderAfter to avoid adding them to deps
  const routerRef = useRef(router)
  useEffect(() => {
    routerRef.current = router
  }, [router])

  const waitForNewestOrderAfterRef = useRef(waitForNewestOrderAfter)
  useEffect(() => {
    waitForNewestOrderAfterRef.current = waitForNewestOrderAfter
  }, [waitForNewestOrderAfter])

  // Auto-validate URL parameters on mount
  useEffect(() => {
    let mounted = true
    // Block base content immediately to avoid UI flash while we resolve URL
    setValidationInProgress(true)
    // Build a key for the current query to avoid re-processing the same params
    const urlOrderId = searchParams.get('order')
    const urlEmail = searchParams.get('email')
    const urlOms = searchParams.get('oms')
    const urlKey = searchParams.get('key')
    const urlTs = searchParams.get('ts')
    const urlToken = searchParams.get('token')
    const urlCode = searchParams.get('code')

    const currentKey = urlCode
      ? `code:${urlCode}`
      : urlOms && urlKey && urlTs && urlToken
        ? `oms:${urlOms}|${urlKey}|${urlTs}|${urlToken}`
        : urlOrderId && urlEmail
          ? `order:${urlOrderId}|${urlEmail}`
          : urlEmail
            ? `email:${urlEmail}`
            : 'none'

    if (lastProcessedRef.current === currentKey) {
      return () => {
        mounted = false
      }
    }
    lastProcessedRef.current = currentKey

    // Priority 0: Single combined code param
    if (urlCode) {
      ;(async () => {
        try {
          setLoading(true)
          setError(null)
          const q = new URLSearchParams({ code: urlCode, format: 'json' })
          const res = await fetch(`/api/resolve-oms?${q.toString()}`)
          const json = (await res.json()) as {
            ok: boolean
            valid?: boolean
            order?: string
            email?: string
            reason?: string
          }
          if (!json?.ok || json.valid !== true || !json.order || !json.email) {
            setValidationMessage('ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าหน้าฟอร์มจากร้านค้าอีกครั้ง')
            setShowValidationPopup(true)
            setIsValidated(false)
            return
          }
          setOrderId(json.order)
          setEmail(json.email)
          // Trigger validation immediately (no artificial delay)
          if (mounted) {
            validateParametersRef.current(json.order!, json.email!)
          }
        } catch {
          setValidationMessage('ไม่สามารถตรวจสอบลิงก์ได้ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ')
          setShowValidationPopup(true)
          setIsValidated(false)
        } finally {
          setLoading(false)
          // validateParameters will manage validationInProgress lifecycle
        }
      })()
    }
    // Priority 1: New Shopify link format using oms/key/ts/token
    else if (urlOms && urlKey && urlTs && urlToken) {
      ;(async () => {
        try {
          setLoading(true)
          setError(null)
          const q = new URLSearchParams({
            key: urlKey,
            oms: urlOms,
            ts: urlTs,
            token: urlToken,
            format: 'json',
          })
          const res = await fetch(`/api/resolve-oms?${q.toString()}`)
          const json = (await res.json()) as {
            ok: boolean
            valid?: boolean
            order?: string
            email?: string
            reason?: string
          }
          if (!json?.ok || json.valid !== true || !json.order || !json.email) {
            setValidationMessage('ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าหน้าฟอร์มจากร้านค้าอีกครั้ง')
            setShowValidationPopup(true)
            setIsValidated(false)
            return
          }
          setOrderId(json.order)
          setEmail(json.email)
          if (mounted) {
            validateParametersRef.current(json.order!, json.email!)
          }
        } catch {
          setValidationMessage('ไม่สามารถตรวจสอบลิงก์ได้ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ')
          setShowValidationPopup(true)
          setIsValidated(false)
        } finally {
          setLoading(false)
          // validateParameters will manage validationInProgress lifecycle
        }
      })()
    } else if (urlOrderId && urlEmail) {
      // If canonical params provided, transform to OMS format for consistency
      ;(async () => {
        try {
          setLoading(true)
          setError(null)
          const q = new URLSearchParams({
            order: urlOrderId,
            email: urlEmail,
            format: 'json',
          })
          const res = await fetch(`/api/build-oms?${q.toString()}`)
          const json = (await res.json()) as {
            ok: boolean
            url?: string
          }
          if (json?.ok && json.url) {
            // Replace to OMS-style URL; the OMS branch above will handle validation
            routerRef.current.replace(json.url)
            return
          }
          // Fallback: keep old behavior if build-oms not available
          setOrderId(urlOrderId)
          setEmail(urlEmail)
          // Trigger validation immediately (no artificial delay)
          if (mounted) {
            validateParametersRef.current(urlOrderId, urlEmail)
          }
        } catch {
          // Fallback to prior behavior on error
          setOrderId(urlOrderId)
          setEmail(urlEmail)
          if (mounted) {
            validateParametersRef.current(urlOrderId, urlEmail)
          }
        } finally {
          setLoading(false)
          // validateParameters will manage validationInProgress lifecycle
        }
      })()
    } else if (urlEmail && !urlOrderId) {
      // If email exists but order is missing, try to auto-detect the latest order for this email
      ;(async () => {
        try {
          setLoading(true)
          setError(null)
          setEmail(urlEmail)
          const found = await waitForNewestOrderAfterRef.current(urlEmail)
          if (found) {
            setOrderId(found)
            // Update the URL query to include the order id and then auto-validate
            if (typeof window !== 'undefined') {
              const u = new URL(window.location.href)
              u.searchParams.set('order', found)
              u.searchParams.set('email', urlEmail)
              // Update the URL without full reload
              routerRef.current.replace(`${u.pathname}?${u.searchParams.toString()}`)
            }
            // Trigger validation immediately (no artificial delay)
            if (mounted) {
              validateParametersRef.current(found, urlEmail)
            }
          } else {
            setValidationMessage('ไม่พบออเดอร์ล่าสุดของอีเมลนี้ กรุณาระบุ Order ID ด้วยตนเอง')
            setShowValidationPopup(true)
            setIsValidated(false)
            setValidationInProgress(false)
          }
        } catch {
          setValidationMessage('ไม่สามารถค้นหาออเดอร์จากอีเมลได้ กรุณาระบุ Order ID และ Email ใน URL')
          setShowValidationPopup(true)
          setIsValidated(false)
          setValidationInProgress(false)
        } finally {
          setLoading(false)
        }
      })()
    } else if (urlOrderId || urlEmail) {
      // Missing one parameter and we cannot auto-detect
      setValidationMessage('กรุณาระบุทั้ง Order ID และ Email ใน URL')
      setShowValidationPopup(true)
      setIsValidated(false)
      setValidationInProgress(false)
    } else {
      // No parameters provided; do not block UI
      setValidationInProgress(false)
    }

    return () => {
      mounted = false
    }
  }, [searchParams])

  return {
    orderId,
    email,
    isValidated,
    validationMessage,
    showValidationPopup,
    validationInProgress,
    loading,
    error,
    setOrderId,
    setEmail,
    setIsValidated,
    setValidationMessage,
    setShowValidationPopup,
    setValidationInProgress,
    setLoading,
    setError,
    validateParameters,
    fetchLatestOrderByEmail,
    waitForNewestOrderAfter,
  }
}
