import { AuthProvider } from '@/app/contexts/AuthContext'

export default function OrderReportLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
