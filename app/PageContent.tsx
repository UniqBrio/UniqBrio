"use client"

export default function PageContent() {
  return (
    // This component should fill the screen height and center its content.
    // The parent <main> in layout.tsx provides min-h-screen.
    // This div will take that height and center its children.
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* Content is wrapped in another div if a slight vertical offset is needed later.
          For now, this will be truly centered. The previous -mt-40 is removed. */}
      <div>
        <h1 className="text-2xl text-center font-bold mb-4">Welcome to UniqBrio</h1>
        <p className="mb-6 text-center">Please sign in or create an account to continue.</p>
        <div className="flex gap-4 justify-center">
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
    </div>
  )
}
