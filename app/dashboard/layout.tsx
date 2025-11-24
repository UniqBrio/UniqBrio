import MainLayout from "@/components/main-layout"
import { CurrencyProvider } from "@/contexts/currency-context"

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CurrencyProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </CurrencyProvider>
  )
}
