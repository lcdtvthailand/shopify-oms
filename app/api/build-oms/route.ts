import { type NextRequest, NextResponse } from 'next/server'

// Self-contained MD5 (same as resolve-oms)
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
    const sp = urlObj.searchParams
    const order = (sp.get('order') || '').trim()
    const email = (sp.get('email') || '').trim().toLowerCase()
    const key = (sp.get('key') || process.env.SHOPIFY_STORE_DOMAIN || '').trim()
    const tsParam = sp.get('ts')
    if (!order || !email || !key) {
      return NextResponse.json({ ok: false, reason: 'missing_params' }, { status: 400 })
    }
    const ts = tsParam ? parseInt(tsParam, 10) : Math.floor(Date.now() / 1000)
    const rawOms = `#${order}|${email}`
    const tokenSource = `${rawOms}|${ts}|${key}`
    const token = md5(tokenSource)

    const omsEnc = encodeURIComponent(rawOms)
    const tokenEnc = encodeURIComponent(token)
    const url = new URL(
      `/?key=${encodeURIComponent(key)}&oms=${omsEnc}&ts=${ts}&token=${tokenEnc}`,
      urlObj.origin
    )

    // If accessed in browser, redirect to the new format unless format=json
    const format = (sp.get('format') || '').toLowerCase()
    if (format !== 'json') {
      return NextResponse.redirect(url, 302)
    }

    return NextResponse.json({ ok: true, key, oms: rawOms, ts, token, url: url.toString() })
  } catch (_e) {
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 })
  }
}
