"use client"

import { useState } from "react"
import Image from "next/image"
import { Bell, SettingsIcon, User, ChevronDown, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/dashboard/ui/dropdown-menu"
import { Button } from "@/components/dashboard/ui/button"
import { Badge } from "@/components/dashboard/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/dashboard/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"

interface HeaderProps {
  currentLanguage: string
  changeLanguage: (language: string) => void
  userRole: "admin" | "super admin"
  changeUserRole: (role: "admin" | "super admin") => void
}

export default function Header({ currentLanguage, changeLanguage, userRole, changeUserRole }: HeaderProps) {
  const [notifications, setNotifications] = useState(3)
  const languages = ["English", "Spanish", "French", "German", "Chinese"]
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6">
      {/* Left section - Logo */}
      <div className="flex items-center">
        <div className="relative h-10 w-40">
          <Image src="/logo.png" alt="UniqBrio Logo" fill style={{ objectFit: "contain" }} priority />
        </div>
      </div>

      {/* Center section - Academy Name */}
      <div className="flex items-center justify-center">
        <h1 className="text-2xl font-bold text-center">
          <span className="text-purple-700">XYZ</span> <span className="text-orange-500">Academy</span>
        </h1>
      </div>

      {/* Right section - Utilities */}
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center">
              {currentLanguage}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((language) => (
              <DropdownMenuItem key={language} onClick={() => changeLanguage(language)} className="cursor-pointer">
                {language}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
            <Button variant="ghost" className="flex items-center space-x-2 rounded-full" aria-label="User profile">
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-green-600 capitalize">{userRole}</span>
                <span className="text-sm">Profile</span>
              </div>
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={userRole}
              onValueChange={(value) => changeUserRole(value as "admin" | "super admin")}
            >
              <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="super admin">Super Admin</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Account Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
