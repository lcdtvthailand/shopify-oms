import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบหน้าที่ต้องการ</h2>
        <p className="text-gray-600 mb-6">ขออภัย หน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ</p>
        <Link
          href="/"
          className="inline-block bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  )
}
