import MainLayout from "@/components/main-layout"
import { CurrencyProvider } from "@/contexts/currency-context"
import { GlobalDataProvider } from "@/contexts/dashboard/global-data-context"
import ChunkErrorHandler from "@/components/chunk-error-handler"
import { Toaster } from "@/components/dashboard/ui/toaster"
import PreventBackNavigation from "@/components/prevent-back-navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CurrencyProvider>
      <GlobalDataProvider>
        <PreventBackNavigation />
        <ChunkErrorHandler />
        <MainLayout>
          {children}
        </MainLayout>
        <Toaster />
      </GlobalDataProvider>
    </CurrencyProvider>
  )
}
