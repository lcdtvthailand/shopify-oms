# Order Status Validation Test Cases

## Test Scenarios

### 1. **Cancelled Order**
- URL: `http://localhost:3000?order=1001&email=test@example.com`
- Mock Status: `cancelledAt` is set
- Expected: Show "คำสั่งซื้อนี้ถูกยกเลิกแล้ว" message and admin contact

### 2. **Fulfilled Order**
- URL: `http://localhost:3000?order=1002&email=test@example.com`
- Mock Status: `displayFulfillmentStatus: "fulfilled"`
- Expected: Show "คำสั่งซื้อนี้ได้ออกใบกำกับภาษีแล้ว" message

### 3. **Refunded Order**
- URL: `http://localhost:3000?order=1003&email=test@example.com`
- Mock Status: `displayFinancialStatus: "refunded"`
- Expected: Show "คำสั่งซื้อนี้ได้รับการคืนเงินแล้ว" message

### 4. **Valid Order (Paid, Unfulfilled)**
- URL: `http://localhost:3000?order=1004&email=test@example.com`
- Mock Status: `displayFinancialStatus: "paid"`, `displayFulfillmentStatus: null`
- Expected: Form should be enabled

## How to Test

1. Navigate to the URLs above
2. The system will validate the order
3. Check if the appropriate message/modal appears

## Admin Contact Info (from .env.local)
- Email: admin@lcdtvthailand.com
- Phone: 02-xxx-xxxx
- LINE: @lcdtvthailand
- Hours: Mon-Fri 9:00-18:00