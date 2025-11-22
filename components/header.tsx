"use client"

import { useState } from "react"
import Image from "next/image"
import { Bell, SettingsIcon, User, ChevronDown, X } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HeaderProps {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  userRole: "admin" | "super admin";
  changeUserRole: (role: "admin" | "super admin") => void;
  academyName?: string;
  userName?: string;
  toggleSidebar?: () => void;
  isMobile?: boolean;
  sidebarCollapsed?: boolean;
}

export default function Header({ 
  currentLanguage, 
  changeLanguage, 
  userRole, 
  changeUserRole, 
  academyName = "", 
  userName = "",
  toggleSidebar,
  isMobile = false,
  sidebarCollapsed = false
}: HeaderProps) {
  const [notifications, setNotifications] = useState(3)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 h-16 sm:h-18 md:h-20 flex items-center justify-between px-1 sm:px-2 md:px-4 lg:px-6 relative z-30 min-w-0">
      {/* Mobile hamburger menu */}
      {isMobile && toggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden p-2 hover:bg-gray-100"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <div className="space-y-1">
            <div className="w-5 h-0.5 bg-gray-600"></div>
            <div className="w-5 h-0.5 bg-gray-600"></div>
            <div className="w-5 h-0.5 bg-gray-600"></div>
          </div>
        </Button>
      )}
      
      {/* Center section - Academy Logo, Name, Tagline */}
      <div className="flex-1 flex items-center justify-center px-1 sm:px-2 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0 max-w-full">
          <div className="relative h-6 w-8 sm:h-8 sm:w-12 md:h-10 md:w-16 lg:h-12 lg:w-20 flex-shrink-0">
            <Image 
              src="/placeholder-logo.png" 
              alt="Academy Logo" 
              fill 
              style={{ objectFit: "contain" }} 
              priority 
              className="rounded"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0 flex-1 max-w-[150px] sm:max-w-[200px] md:max-w-none">
            <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-purple-700 leading-tight truncate">
              {academyName || "Academy"}
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium hidden md:block truncate">
              Empowering Minds, Shaping Futures
            </span>
          </div>
        </div>
      </div>

      {/* Right section - Utilities */}
      <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-2 flex-shrink-0">
        {/* ...existing code... */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs"
                    aria-label={`${notifications} unread notifications`}
                  >
                    {notifications}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Settings">
                    <SettingsIcon className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>Settings</DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500">
                Configure your application settings and preferences. Changes will be applied immediately.
              </p>
              {/* Settings content would go here */}
            </div>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 md:px-3 min-w-0 max-w-[120px] sm:max-w-[150px] md:max-w-none" aria-label="User profile">
              <span className="flex items-center gap-1 sm:gap-2 min-w-0">
                <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-purple-100 flex-shrink-0">
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-purple-600" />
                </span>
                <span className="text-xs sm:text-sm md:text-sm font-medium truncate min-w-0 hidden sm:block">
                  {userName || "User"}
                </span>
              </span>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border rounded-md shadow-lg">
            <div className="px-2 pt-2 pb-2 bg-white">
              <div className="text-sm font-semibold">{userName || "User"}</div>
              <div className="text-xs text-muted-foreground">{academyName || "Academy"}</div>
            </div>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem className="focus:bg-gray-100">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-gray-100">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600" onSelect={async () => {
              try {
                const response = await fetch("/api/auth/logout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                });
                if (response.ok) {
                  window.location.href = "/login";
                }
              } catch (error) {
                console.error("Logout failed:", error);
              }
            }}>
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
