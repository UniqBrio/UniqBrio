"use client"

import Image from "next/image"

export default function Footer() {
  return (
    <footer className="bg-background dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-2 px-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500 dark:text-white">© {new Date().getFullYear()} UniqBrio. All rights reserved.</p>

       
      </div>
    </footer>
  )
}
