import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบว่ามี environment variables ที่จำเป็น
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!storeDomain || !accessToken) {
      return NextResponse.json(
        { error: 'Missing Shopify configuration. Please check environment variables.',
          details: {
            hasStoreDomain: Boolean(storeDomain),
            hasAccessToken: Boolean(accessToken)
          }
        },
        { status: 500 }
      );
    }

    // สร้าง Shopify GraphQL endpoint URL
    const shopifyUrl = `https://${storeDomain}/admin/api/2024-07/graphql.json`;

    // ดึง query และ variables ที่ส่งมาจาก Frontend
    const body = await request.json();
    const { query, variables } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'GraphQL query is required' },
        { status: 400 }
      );
    }

    // เรียก Shopify Admin API
    const shopifyRequest = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Header สำคัญสำหรับยืนยันตัวตน
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!shopifyRequest.ok) {
      const errorText = await shopifyRequest.text();
      console.error('Shopify API Error:', errorText);
      return NextResponse.json(
        { error: `Shopify API request failed: ${shopifyRequest.status} ${shopifyRequest.statusText}`, details: errorText },
        { status: shopifyRequest.status }
      );
    }

    const shopifyData = await shopifyRequest.json();

    // ตรวจสอบว่ามี GraphQL errors หรือไม่
    if (shopifyData.errors) {
      console.error('Shopify GraphQL Errors:', shopifyData.errors);
      return NextResponse.json(
        { error: 'GraphQL errors occurred', details: shopifyData.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(shopifyData);

  } catch (error) {
    console.error('Error fetching from Shopify:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Shopify', details: String(error) },
      { status: 500 }
    );
  }
}

// อนุญาตเฉพาะ POST method
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. Use POST instead.' },
    { status: 405 }
  );
}
