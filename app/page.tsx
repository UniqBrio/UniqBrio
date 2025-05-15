import { Suspense } from "react"

import PageContent from "./PageContent"

export default function Home() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <PageContent />
      </Suspense>
    </>
  )
}
