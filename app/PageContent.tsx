"use client"

export default function PageContent() {
  return (
    // Removed min-h-screen to allow layout to control overall page height and centering.
    <div className="flex flex-col items-center justify-center -mt-40">
      <h1 className="text-2xl font-bold mb-4">Welcome to UniqBrio</h1>
      <p className="mb-6 text-center">Please sign in or create an account to continue.</p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="px-6 py-2 bg-orange-400 text-white rounded-lg hover:bg-[#c26700] transition-colors"
        >
          Login
        </a>
        <a
          href="/signup"
          className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-[#7535e5] transition-colors"
        >
          Signup
        </a>
      </div>
    </div>
  )
}
