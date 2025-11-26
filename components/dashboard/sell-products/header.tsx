import { Button } from "@/components/dashboard/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/dashboard/ui/dropdown-menu"
import { Badge } from "@/components/dashboard/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/ui/avatar"
import { Globe, Bell, Settings, User } from 'lucide-react'
import { useState } from "react"
import { useCustomColors } from "@/lib/use-custom-colors"

interface HeaderProps {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
  const [language, setLanguage] = useState("English")
  const [userRole, setUserRole] = useState("Super Admin")
  const { primaryColor, secondaryColor } = useCustomColors()

  return (
    <header className="bg-white/90 border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold gradient-text">Sell Products & Services</h1>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-white transition-smooth"
              >
                <Globe className="h-4 w-4 mr-2" />
                {language}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border-gray-200">
              <DropdownMenuItem onClick={() => setLanguage("English")}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("Spanish")}>Spanish</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("French")}>French</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 transition-smooth">
            <Bell className="h-5 w-5 text-gray-700 dark:text-white" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs glow text-white"
                   style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}>
              3
            </Badge>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSettingsClick}
            className="hover:bg-gray-100 transition-smooth text-gray-700 dark:text-white"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:bg-gray-100 transition-smooth"
              >
                <Avatar className="h-8 w-8 border-2" style={{ borderColor: primaryColor }}>
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-xs text-green-600 font-semibold">{userRole}</div>
                  <div className="text-sm text-gray-700 dark:text-white">Profile</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-gray-200">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem>Log Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
