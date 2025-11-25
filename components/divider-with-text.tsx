export default function DividerWithText({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-300"></div>
      <div className="px-4 py-1 text-sm font-medium text-gray-500 dark:text-white bg-gray-100/60 dark:bg-gray-800/60 rounded-full backdrop-blur-sm">{text}</div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-300"></div>
    </div>
  )
}

