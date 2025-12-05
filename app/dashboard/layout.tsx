import MainLayout from "@/components/main-layout"
import { CurrencyProvider } from "@/contexts/currency-context"
import ChunkErrorHandler from "@/components/chunk-error-handler"
import { Toaster } from "@/components/dashboard/ui/toaster"
import PreventBackNavigation from "@/components/prevent-back-navigation"

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
      <PreventBackNavigation />
      <ChunkErrorHandler />
      <MainLayout>
        {children}
      </MainLayout>
      <Toaster />
    </CurrencyProvider>
  )
}
