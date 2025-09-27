'use client'

import { useState } from 'react'
import { isLikelyJSON, prettyJSON } from '@/app/utils/orderUtils'

interface KeyValueRowProps {
  k: string
  v: string
}

export const KeyValueRow: React.FC<KeyValueRowProps> = ({ k, v }) => {
  const [expanded, setExpanded] = useState(true)
  const longText = v && v.length > 120
  const isJson = isLikelyJSON(v)
  const preview = isJson
    ? prettyJSON(v).slice(0, 200) + (prettyJSON(v).length > 200 ? '…' : '')
    : longText
      ? `${v.slice(0, 200)}…`
      : v

  return (
    <div className="flex items-start gap-3">
      <dt className="text-xs font-medium text-gray-600 min-w-36 sm:min-w-44 break-words">{k}</dt>
      <dd className="text-xs text-gray-900 break-words max-w-full">
        {isJson ? (
          expanded ? (
            <pre
              className="text-[11px] leading-4 bg-gray-50 border rounded p-2 overflow-x-auto whitespace-pre-wrap break-words"
              style={{ fontFamily: 'inherit' }}
            >
              {prettyJSON(v)}
            </pre>
          ) : (
            <pre
              className="text-[11px] leading-4 bg-gray-50 border rounded p-2 overflow-x-auto whitespace-pre break-words"
              style={{ fontFamily: 'inherit' }}
            >
              {preview}
            </pre>
          )
        ) : (
          <span className={'whitespace-pre-wrap break-words'}>{expanded ? v : preview}</span>
        )}
        {(longText || isJson) && (
          <div className="mt-1">
            <button
              type="button"
              className="text-[11px] text-red-600 hover:text-red-800 underline"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'ย่อ' : 'แสดงทั้งหมด'}
            </button>
          </div>
        )}
      </dd>
    </div>
  )
}
