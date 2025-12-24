export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 p-8">
        {/* Logo skeleton */}
        <div className="flex justify-center mb-8">
          <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mx-auto" />
        </div>

        {/* Form skeleton */}
        <div className="space-y-4 mt-8">
          {/* Email field */}
          <div className="space-y-2">
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>

          {/* Submit button */}
          <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded animate-pulse mt-6" />

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* OAuth button */}
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Footer links */}
        <div className="flex justify-between mt-4">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

