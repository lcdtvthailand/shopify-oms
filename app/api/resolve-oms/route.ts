import { type NextRequest, NextResponse } from 'next/server'

// Self-contained MD5 implementation (UTF-8 aware)
function md5(input: string): string {
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    const a2 = (((a + q) | 0) + ((x + t) | 0)) | 0
    return (((a2 << s) | (a2 >>> (32 - s))) + b) | 0
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t)
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t)
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t)
  }
  function toBytes(str: string) {
    const utf8 = unescape(encodeURIComponent(str))
    const bytes = new Array<number>(utf8.length)
    for (let i = 0; i < utf8.length; i++) bytes[i] = utf8.charCodeAt(i)
    return bytes
  }
  function toWords(bytes: number[]) {
    const words: number[] = []
    for (let i = 0, b = 0; i < bytes.length; i++, b += 8) {
      words[b >>> 5] = (words[b >>> 5] || 0) | (bytes[i] << (b % 32))
    }
    return words
  }
  function toHex(num: number) {
    let s = ''
    for (let j = 0; j < 4; j++) s += `0${((num >>> (j * 8)) & 0xff).toString(16)}`.slice(-2)
    return s
  }

  const bytes = toBytes(input)
  const words = toWords(bytes)
  const bitLen = bytes.length * 8

  words[bitLen >>> 5] = (words[bitLen >>> 5] || 0) | (0x80 << (bitLen % 32))
  words[(((bitLen + 64) >>> 9) << 4) + 14] = bitLen

  let a = 1732584193
  let b = -271733879
  let c = -1732584194
  let d = 271733878

  for (let i = 0; i < words.length; i += 16) {
    const oa = a,
      ob = b,
      oc = c,
      od = d

    a = ff(a, b, c, d, words[i + 0] | 0, 7, -680876936)
    d = ff(d, a, b, c, words[i + 1] | 0, 12, -389564586)
    c = ff(c, d, a, b, words[i + 2] | 0, 17, 606105819)
    b = ff(b, c, d, a, words[i + 3] | 0, 22, -1044525330)
    a = ff(a, b, c, d, words[i + 4] | 0, 7, -176418897)
    d = ff(d, a, b, c, words[i + 5] | 0, 12, 1200080426)
    c = ff(c, d, a, b, words[i + 6] | 0, 17, -1473231341)
    b = ff(b, c, d, a, words[i + 7] | 0, 22, -45705983)
    a = ff(a, b, c, d, words[i + 8] | 0, 7, 1770035416)
    d = ff(d, a, b, c, words[i + 9] | 0, 12, -1958414417)
    c = ff(c, d, a, b, words[i + 10] | 0, 17, -42063)
    b = ff(b, c, d, a, words[i + 11] | 0, 22, -1990404162)
    a = ff(a, b, c, d, words[i + 12] | 0, 7, 1804603682)
    d = ff(d, a, b, c, words[i + 13] | 0, 12, -40341101)
    c = ff(c, d, a, b, words[i + 14] | 0, 17, -1502002290)
    b = ff(b, c, d, a, words[i + 15] | 0, 22, 1236535329)

    a = gg(a, b, c, d, words[i + 1] | 0, 5, -165796510)
    d = gg(d, a, b, c, words[i + 6] | 0, 9, -1069501632)
    c = gg(c, d, a, b, words[i + 11] | 0, 14, 643717713)
    b = gg(b, c, d, a, words[i + 0] | 0, 20, -373897302)
    a = gg(a, b, c, d, words[i + 5] | 0, 5, -701558691)
    d = gg(d, a, b, c, words[i + 10] | 0, 9, 38016083)
    c = gg(c, d, a, b, words[i + 15] | 0, 14, -660478335)
    b = gg(b, c, d, a, words[i + 4] | 0, 20, -405537848)
    a = gg(a, b, c, d, words[i + 9] | 0, 5, 568446438)
    d = gg(d, a, b, c, words[i + 14] | 0, 9, -1019803690)
    c = gg(c, d, a, b, words[i + 3] | 0, 14, -187363961)
    b = gg(b, c, d, a, words[i + 8] | 0, 20, 1163531501)
    a = gg(a, b, c, d, words[i + 13] | 0, 5, -1444681467)
    d = gg(d, a, b, c, words[i + 2] | 0, 9, -51403784)
    c = gg(c, d, a, b, words[i + 7] | 0, 14, 1735328473)
    b = gg(b, c, d, a, words[i + 12] | 0, 20, -1926607734)

    a = hh(a, b, c, d, words[i + 5] | 0, 4, -378558)
    d = hh(d, a, b, c, words[i + 8] | 0, 11, -2022574463)
    c = hh(c, d, a, b, words[i + 11] | 0, 16, 1839030562)
    b = hh(b, c, d, a, words[i + 14] | 0, 23, -35309556)
    a = hh(a, b, c, d, words[i + 1] | 0, 4, -1530992060)
    d = hh(d, a, b, c, words[i + 4] | 0, 11, 1272893353)
    c = hh(c, d, a, b, words[i + 7] | 0, 16, -155497632)
    b = hh(b, c, d, a, words[i + 10] | 0, 23, -1094730640)

    a = ii(a, b, c, d, words[i + 0] | 0, 6, 681279174)
    d = ii(d, a, b, c, words[i + 7] | 0, 10, -358537222)
    c = ii(c, d, a, b, words[i + 14] | 0, 15, -722521979)
    b = ii(b, c, d, a, words[i + 5] | 0, 21, 76029189)
    a = ii(a, b, c, d, words[i + 12] | 0, 6, -640364487)
    d = ii(d, a, b, c, words[i + 3] | 0, 10, -421815835)
    c = ii(c, d, a, b, words[i + 10] | 0, 15, 530742520)
    b = ii(b, c, d, a, words[i + 1] | 0, 21, -995338651)

    a = (a + oa) | 0
    b = (b + ob) | 0
    c = (c + oc) | 0
    d = (d + od) | 0
  }

  return toHex(a) + toHex(b) + toHex(c) + toHex(d)
}

export function GET(req: NextRequest) {
  try {
    const urlObj = new URL(req.url)
    const { searchParams } = urlObj
    const key = searchParams.get('key') || ''
    const oms = searchParams.get('oms') || ''
    const ts = searchParams.get('ts') || ''
    const token = (searchParams.get('token') || '').toLowerCase()
    const format = (searchParams.get('format') || '').toLowerCase()

    if (!key || !oms || !ts || !token) {
      return NextResponse.json({ ok: false, reason: 'missing_params' }, { status: 400 })
    }

    // Decode components (req already has decoded, but double-safety if sent encoded)
    const keyDec = decodeURIComponent(key)
    const omsDec = decodeURIComponent(oms)
    const tsDec = decodeURIComponent(ts)
    const tokenDec = decodeURIComponent(token).toLowerCase()

    // Expect oms format: "#12345|email@example.com"
    const parts = omsDec.split('|')
    if (parts.length !== 2) {
      return NextResponse.json({ ok: false, reason: 'bad_oms' }, { status: 400 })
    }
    const orderName = parts[0]
    const email = (parts[1] || '').trim().toLowerCase()

    // Build candidate token sources to maximize compatibility with theme variations
    const clean = (s: string) => s.trim()
    const keyRaw = clean(key)
    const keyD = clean(keyDec)
    const tsRaw = clean(ts)
    const tsD = clean(tsDec)
    const omsRaw = clean(oms)
    const omsD = clean(omsDec)
    const omsDNoHash = omsD.replace(/^#/, '')
    const omsRawNoHash = omsRaw.replace(/^%23/, '') // if '#' was encoded as %23
    const enc = (s: string) => encodeURIComponent(s)

    const omsVariants = [omsD, omsDNoHash, omsRaw, omsRawNoHash, enc(omsD), enc(omsDNoHash)]
    const tsVariants = [tsD, tsRaw]
    const keyVariants = [keyD, keyRaw]

    const combos: string[] = []
    for (const o of omsVariants) {
      for (const t of tsVariants) {
        for (const k of keyVariants) {
          combos.push(`${o}|${t}|${k}`)
          combos.push(`${o}|${k}|${t}`)
          combos.push(`${t}|${o}|${k}`)
          combos.push(`${t}|${k}|${o}`)
          combos.push(`${k}|${o}|${t}`)
          combos.push(`${k}|${t}|${o}`)
        }
      }
    }
    // De-duplicate combos
    const candidates = Array.from(new Set(combos))
    const digests = candidates.map((src) => md5(src).toLowerCase())
    let valid = digests.includes(tokenDec)
    const allowBypass =
      process.env.NEXT_PUBLIC_OMS_ALLOW_INVALID === 'true' || process.env.NODE_ENV !== 'production'
    const bypassed = !valid && allowBypass
    if (bypassed) {
      valid = true
    }

    const canonicalOrder = orderName.replace(/^#/, '')
    if (valid && format !== 'json') {
      // Accessed directly in browser -> keep OMS-style parameters on the app root
      const dest = new URL(
        `/?key=${encodeURIComponent(keyDec)}&oms=${encodeURIComponent(`${orderName}|${email}`)}&ts=${encodeURIComponent(tsDec)}&token=${encodeURIComponent(tokenDec)}`,
        urlObj.origin
      )
      return NextResponse.redirect(dest, 302)
    }

    return NextResponse.json({
      ok: true,
      valid,
      order: canonicalOrder,
      email,
      key: keyDec,
      ts: tsDec,
      _dbg:
        valid && !bypassed
          ? undefined
          : {
              tokenDec,
              digests,
              candidates,
              bypassed,
            },
    })
  } catch (_e) {
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 })
  }
}
