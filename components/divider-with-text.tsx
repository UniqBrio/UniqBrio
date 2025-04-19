export default function DividerWithText({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      <div className="flex-1 h-px bg-[#d9d9d9]"></div>
      <div className="px-4 py-2 text-lg bg-[#d9d9d9]">{text}</div>
      <div className="flex-1 h-px bg-[#d9d9d9]"></div>
    </div>
  )
}

