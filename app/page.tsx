import { Suspense } from "react"
import SessionExpiredNotification from "@/components/session-expired-notification"
import { useSearchParams } from "next/navigation"

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <SessionExpiredNotification />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <PageContent />
      </Suspense>
    </>
  )
}

function PageContent() {
  const searchParams = useSearchParams()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Welcome to UniqBrio</h1>
      <p className="mb-6 text-center">Please sign in or create an account to continue.</p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="px-6 py-2 bg-[#fd9c2d] text-white rounded-lg hover:bg-[#c26700] transition-colors"
        >
          Login
        </a>
        <a
          href="/signup"
          className="px-6 py-2 bg-[#8a3ffc] text-white rounded-lg hover:bg-[#7535e5] transition-colors"
        >
          Signup
        </a>
      </div>
    </div>
  )
}
