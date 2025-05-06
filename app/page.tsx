import { Suspense } from "react"
import SessionExpiredNotification from "@/components/session-expired-notification"
import PageContent from "./PageContent" // this must be a separate client component file

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
