import Link from "next/link"
import Image from "next/image"
import { Linkedin, Instagram } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-sm text-gray-500 dark:text-white">? {new Date().getFullYear()} XYZ Academy. All rights reserved.</p>
        </div>

        <div className="flex space-x-4 mb-4 md:mb-0">
          <Link href="/legal/privacy" className="text-sm text-gray-500 dark:text-white hover:text-purple-600 transition-colors">
            How We Protect Your Academy
          </Link>
          <Link href="/legal/terms" className="text-sm text-gray-500 dark:text-white hover:text-purple-600 transition-colors">
            Our Promise to You
          </Link>
          <Link href="/legal/cookies" className="text-sm text-gray-500 dark:text-white hover:text-purple-600 transition-colors">
            Cookie Policy
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5 text-gray-500 dark:text-white hover:text-purple-600 transition-colors" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>LinkedIn</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram className="h-5 w-5 text-gray-500 dark:text-white hover:text-purple-600 transition-colors" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Instagram</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center ml-4">
            <span className="text-xs text-gray-500 dark:text-white mr-2">Powered by</span>
            <div className="relative h-6 w-20">
              <Image src="/logo.png" alt="UniqBrio Logo" fill style={{ objectFit: "contain" }} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
