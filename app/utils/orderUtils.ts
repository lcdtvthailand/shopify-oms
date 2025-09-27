import type { PriceSet } from '@/app/hooks/useOrderData'

// Helper functions for order report
export const isLikelyJSON = (s: string) => {
  if (!s) return false
  const t = s.trim()
  if (!((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))))
    return false
  try {
    JSON.parse(t)
    return true
  } catch {
    return false
  }
}

export const prettyJSON = (s: string) => {
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}

export const formatPrice = (price: string) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(parseFloat(price))
}

export const fmt = (s?: string | null) => {
  if (s == null) return '-'
  const t = String(s).trim()
  return t === '' ? '-' : t
}

export const money = (ps?: PriceSet) =>
  ps?.shopMoney?.amount ? formatPrice(ps.shopMoney.amount) : '-'

export const nodesFrom = (src: any): any[] => {
  if (!src) return []
  if (Array.isArray(src)) return src
  if (Array.isArray(src.edges)) return src.edges.map((e: any) => e?.node ?? e).filter(Boolean)
  return []
}

export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('th-TH') : '-'

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('th-TH') : '-'

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('th-TH')
}

export const groupMetafields = (list: any[]) => {
  const map = new Map<string, Array<{ k: string; v: string }>>()
  for (const m of list) {
    const ns = String(m?.namespace ?? 'default')
    const key = String(m?.key ?? '')
    const val = String(m?.value ?? '')
    if (!map.has(ns)) map.set(ns, [])
    map.get(ns)!.push({ k: key, v: val })
  }
  return Array.from(map.entries()).map(([ns, items]) => ({ ns, items }))
}
