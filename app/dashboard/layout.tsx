import MainLayout from "@/components/main-layout"
import { CurrencyProvider } from "@/contexts/currency-context"
import ChunkErrorHandler from "@/components/chunk-error-handler"

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
      <ChunkErrorHandler />
      <MainLayout>
        {children}
      </MainLayout>
    </CurrencyProvider>
  )
}
