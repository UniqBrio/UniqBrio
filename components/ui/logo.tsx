"use client"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/UniqBrio Logo Transparent.png"
      alt="UniqBrio Logo"
      className={className}
      style={{ maxHeight: 48 }}
    />
  );
}
