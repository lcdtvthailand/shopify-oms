import { expect, test } from '@playwright/test'

const TEST_CODE =
  'eyJrZXkiOiJsY2R0dnRoYWlsYW5kLm15c2hvcGlmeS5jb20iLCJvbXMiOiIjTENELTEzMDh8bmljaGFyaUBoYXJtb255eC5jbyIsInRzIjoxNzc1ODA0ODQzLCJ0b2tlbiI6IjJmMGJlYWNjMWNkMjhlYWE2YTMwZGRkMTVmYzA4YmVjYTU1OTBjNjk0ODk1YjhiZWU0NzVhODdiMmQ5Yzg4N2MifQ'

test.describe('API Endpoints', () => {
  test('resolve-oms returns valid order data', async ({ request }) => {
    const res = await request.get(`/api/resolve-oms?code=${TEST_CODE}&format=json`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.valid).toBe(true)
    expect(body.order).toBe('LCD-1308')
    expect(body.email).toBe('nichari@harmonyx.co')
  })

  test('shopify API allows order queries', async ({ request }) => {
    const res = await request.post('/api/shopify', {
      data: {
        query: `query getOrderByName($query: String!) {
          orders(first: 1, query: $query) {
            edges { node { id name customer { id email } } }
          }
        }`,
        variables: { query: 'name:#LCD-1308' },
        expectedEmail: 'nichari@harmonyx.co',
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.orders.edges.length).toBeGreaterThan(0)
    expect(body.data.orders.edges[0].node.name).toBe('LCD-1308')
  })

  test('shopify API allows metafieldsSet mutation', async ({ request }) => {
    const res = await request.post('/api/shopify', {
      data: {
        query: `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id key namespace }
            userErrors { field message code }
          }
        }`,
        variables: {
          metafields: [
            {
              ownerId: 'gid://shopify/Order/6269250797700',
              namespace: 'custom',
              key: 'playwright_test',
              type: 'single_line_text_field',
              value: 'test',
            },
          ],
        },
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data.metafieldsSet.userErrors).toHaveLength(0)
  })

  test('shopify API blocks non-allowed mutations', async ({ request }) => {
    const res = await request.post('/api/shopify', {
      data: {
        query: 'mutation { shopUpdate(input: {name: "hacked"}) { shop { name } } }',
      },
    })
    expect(res.status()).toBe(403)
  })

  test('shopify API blocks introspection', async ({ request }) => {
    const res = await request.post('/api/shopify', {
      data: { query: '{ __schema { types { name } } }' },
    })
    expect(res.status()).toBe(403)
  })

  test('favicon returns 200', async ({ request }) => {
    const res = await request.get('/icon.svg')
    expect(res.status()).toBe(200)
  })

  test('CSP allows Google Fonts', async ({ request }) => {
    const res = await request.get('/')
    const csp = res.headers()['content-security-policy']
    expect(csp).toContain('fonts.googleapis.com')
    expect(csp).toContain('fonts.gstatic.com')
  })

  test('no auth 401 on main page', async ({ request }) => {
    const res = await request.get('/')
    expect(res.status()).toBe(200)
  })

  test('cache-control is not 1 year', async ({ request }) => {
    const res = await request.get('/')
    const cc = res.headers()['cache-control']
    expect(cc).not.toContain('s-maxage=31536000')
  })
})

test.describe('Page Load & Validation', () => {
  test('shows title without code param', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('ใบกำกับภาษี')).toBeVisible()
  })

  test('resolves OMS code and shows form', async ({ page }) => {
    await page.goto(`/?code=${TEST_CODE}`)

    // Wait for form to appear after validation
    const form = page.locator('form')
    await expect(form).toBeVisible({ timeout: 20000 })

    // Individual type should be checked by default
    const taxRadio = page.locator('input[name="documentType"][value="tax"]')
    await expect(taxRadio).toBeChecked()
  })
})

test.describe('Individual (บุคคลธรรมดา) Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?code=${TEST_CODE}`)
    await page.locator('form').waitFor({ timeout: 20000 })
  })

  test('fills and submits individual tax invoice', async ({ page }) => {
    // Select individual type
    await page.locator('input[name="documentType"][value="tax"]').check()

    // Fill personal info
    await page.locator('select[name="titleName"]').selectOption('นาย')
    await page.locator('input[name="fullName"]').fill('ทดสอบ เพลย์ไรท์')

    // Fill tax ID (13 digits)
    await page.locator('input[name="branchCode"]').fill('1234567890123')

    // Fill phone
    await page.locator('input[name="companyName"]').fill('0812345678')

    // Fill address
    await page.locator('textarea[name="address"]').fill('123 ถ.ทดสอบ')

    // Select province
    const provinceSelect = page.locator('select[name="provinceCode"]')
    const provinceOptions = provinceSelect.locator('option')
    const provinceCount = await provinceOptions.count()
    if (provinceCount > 1) {
      // Select the second option (first real province)
      const value = await provinceOptions.nth(1).getAttribute('value')
      if (value) await provinceSelect.selectOption(value)
    }

    // Wait for districts to load and select to be enabled
    const districtSelect = page.locator('select[name="districtCode"]')
    await expect(districtSelect).toBeEnabled({ timeout: 10000 })
    await expect(districtSelect.locator('option')).not.toHaveCount(1, { timeout: 5000 })
    const districtValue = await districtSelect.locator('option').nth(1).getAttribute('value')
    if (districtValue) await districtSelect.selectOption(districtValue)

    // Wait for subdistricts to load and select to be enabled
    const subdistrictSelect = page.locator('select[name="subdistrictCode"]')
    await expect(subdistrictSelect).toBeEnabled({ timeout: 10000 })
    await expect(subdistrictSelect.locator('option')).not.toHaveCount(1, { timeout: 5000 })
    const subValue = await subdistrictSelect.locator('option').nth(1).getAttribute('value')
    if (subValue) await subdistrictSelect.selectOption(subValue)

    // Postal code should auto-fill
    const postalCode = page.locator('input[name="postalCode"]')
    await expect(postalCode).not.toHaveValue('')

    // Submit
    await page.locator('button[type="submit"]').click()

    // Wait for response - should not show error
    await page.waitForTimeout(3000)
    const errorText = page.locator('text=Error: Failed to save')
    await expect(errorText).not.toBeVisible()
  })
})

test.describe('Corporate (นิติบุคคล) Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?code=${TEST_CODE}`)
    await page.locator('form').waitFor({ timeout: 20000 })
  })

  test('switches to corporate and shows company fields', async ({ page }) => {
    await page.locator('input[name="documentType"][value="receipt"]').check()

    // Company fields visible
    await expect(page.locator('input[name="companyNameText"]')).toBeVisible()

    // Personal fields gone
    await expect(page.locator('select[name="titleName"]')).not.toBeVisible()
    await expect(page.locator('input[name="fullName"]')).not.toBeVisible()
  })

  test('fills corporate tax invoice form', async ({ page }) => {
    await page.locator('input[name="documentType"][value="receipt"]').check()

    // Fill company info
    await page.locator('input[name="companyNameText"]').fill('บริษัท ทดสอบ จำกัด')
    await page.locator('input[name="branchType"][value="head"]').check()

    // Fill tax ID
    await page.locator('input[name="branchCode"]').fill('1234567890123')

    // Fill phone
    await page.locator('input[name="companyName"]').fill('0212345678')

    // Fill address
    await page.locator('textarea[name="address"]').fill('456 อาคารทดสอบ')

    // Select province
    const provinceSelect = page.locator('select[name="provinceCode"]')
    const provinceOptions = provinceSelect.locator('option')
    const value = await provinceOptions.nth(1).getAttribute('value')
    if (value) await provinceSelect.selectOption(value)

    // Wait and select district
    const districtSelect = page.locator('select[name="districtCode"]')
    await expect(districtSelect.locator('option')).not.toHaveCount(1, { timeout: 5000 })
    const dv = await districtSelect.locator('option').nth(1).getAttribute('value')
    if (dv) await districtSelect.selectOption(dv)

    // Wait and select subdistrict
    const subdistrictSelect = page.locator('select[name="subdistrictCode"]')
    await expect(subdistrictSelect.locator('option')).not.toHaveCount(1, { timeout: 5000 })
    const sv = await subdistrictSelect.locator('option').nth(1).getAttribute('value')
    if (sv) await subdistrictSelect.selectOption(sv)

    // Postal code auto-fills
    await expect(page.locator('input[name="postalCode"]')).not.toHaveValue('')
  })
})
