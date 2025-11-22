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
  
  userRole: "admin" | "super admin"
  changeUserRole: (role: "admin" | "super admin") => void
}

export default function Header({  userRole, changeUserRole }: HeaderProps) {
  const [notifications, setNotifications] = useState(3)
  
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 md:px-6">
      {/* Center section - Academy Logo, Name, Tagline */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-6">
          <div className="relative h-12 w-20">
            <Image src="/Academy logo.png" alt="UniqBrio Logo" fill style={{ objectFit: "contain" }} priority />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-bold text-purple-700 leading-tight">XYZ Academy</span>
            <span className="text-sm text-gray-500 font-medium">Empowering Minds, Shaping Futures</span>
          </div>
        </div>
      </div>

      {/* Right section - Utilities */}
      <div className="flex items-center space-x-2">
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
            <Button variant="ghost" size="icon" className="items-center space-x-2 rounded-full border-purple" aria-label="User profile">
              
                <Image
                  src="/placeholder-user.png"
                  alt="Profile"
                  width={32}
                  height={32}
                  className="object-cover h-8 w-8"
                  priority
                />

            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            
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
