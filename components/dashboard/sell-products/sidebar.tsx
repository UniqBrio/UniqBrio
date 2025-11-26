import { useState } from "react"
import { Button } from "@/components/dashboard/ui/button"
import { Input } from "@/components/dashboard/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/ui/dialog"
import { Home, Calendar, Users, GraduationCap, DollarSign, TrendingUp, Gift, ShoppingCart, MessageSquare, Cog, Palette, HelpCircle, Search, ChevronLeft, ChevronRight, Star, UserCheck, BookOpen, UserPlus, School, CalendarDays, Settings, Move } from 'lucide-react'
import { useCustomColors } from '@/lib/use-custom-colors'

interface SidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  position: "left" | "right" | "top" | "bottom"
  onPositionChange: (position: "left" | "right" | "top" | "bottom") => void
}

export function Sidebar({ collapsed, onCollapsedChange, position, onPositionChange }: SidebarProps) {
  const { primaryColor, secondaryColor } = useCustomColors();
  const [showPositionDialog, setShowPositionDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [favoriteItems, setFavoriteItems] = useState<string[]>(["Home", "Sell Products and Services"])
  const [showFavorites, setShowFavorites] = useState(false)

  const menuItems = [
    { name: "Home", icon: Home, subItems: [] },
    { name: "Services", icon: Cog, subItems: [] },
    { name: "Schedule", icon: Calendar, subItems: [] },
    { name: "Course Management", icon: BookOpen, subItems: [] },
    { name: "User Management", icon: Users, subItems: [] },
    { name: "Students Management", icon: GraduationCap, subItems: [] },
    {
      name: "Staff Management",
      icon: UserCheck,
      subItems: ["Instructor", "Non-Instructor", "Leave Management", "Attendance"],
    },
    { name: "Parent Management", icon: UserPlus, subItems: [] },
    { name: "Alumni Management", icon: School, subItems: [] },
    { name: "Enquiries", icon: MessageSquare, subItems: [] },
    { name: "Payments", icon: DollarSign, subItems: [] },
    {
      name: "Financials",
      icon: TrendingUp,
      subItems: ["Income", "Expenses", "ROI", "Balance Sheet", "Forecast"],
    },
    { name: "Promotion", icon: Gift, subItems: [] },
    { name: "Events", icon: CalendarDays, subItems: [] },
    { name: "Sell Products and Services", icon: ShoppingCart, subItems: [] },
    { name: "Community", icon: Users, subItems: [] },
    { name: "Settings", icon: Settings, subItems: [] },
    { name: "Theme Customization", icon: Palette, subItems: [] },
    { name: "Help", icon: HelpCircle, subItems: [] },
  ]

  const toggleFavorite = (itemName: string) => {
    setFavoriteItems((prev) =>
      prev.includes(itemName) ? prev.filter((item) => item !== itemName) : [...prev, itemName],
    )
  }

  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subItems.some((subItem) => subItem.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <>
      <div
        className={`fixed ${position === "left" ? "left-0" : position === "right" ? "right-0" : position === "top" ? "top-0 w-full h-auto" : "bottom-0 w-full h-auto"} ${
          position === "left" || position === "right" ? "top-0 h-full" : ""
        } ${collapsed ? "w-16" : "w-64"} bg-white/90 dark:bg-gray-900/90 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 shadow-lg`}>
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center glow"
                  style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                >
                  <span className="text-white font-bold text-sm">XYZ</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold gradient-text">UniqBrio</h1>
                  <p className="text-xs text-gray-600 dark:text-white">Mentoring Businesses</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCollapsedChange(!collapsed)}
              className="p-1 hover:bg-gray-100 transition-smooth"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {!collapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white h-4 w-4" />
              <Input
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:text-white dark:placeholder:text-white border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {!collapsed && showFavorites && favoriteItems.length > 0 && (
            <div className="px-4 py-2">
              <h3 className="text-sm font-semibold mb-2" style={{ color: primaryColor }}>? Favorites</h3>
              {favoriteItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-smooth"
                >
                  <span className="text-sm text-gray-700 dark:text-white">{item}</span>
                </div>
              ))}
            </div>
          )}

          <nav className="px-4 py-2">
            {!collapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFavorites(!showFavorites)}
                className="w-full justify-start mb-4 transition-smooth"
                style={{ color: secondaryColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${secondaryColor}10`;
                  e.currentTarget.style.color = secondaryColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = secondaryColor;
                }}
              >
                <Star className="h-4 w-4 mr-2" />
                Favorite Menu Items
              </Button>
            )}

            {filteredMenuItems.map((item) => (
              <div key={item.name} className="mb-1">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-100 cursor-pointer group transition-smooth">
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" style={{ color: primaryColor }} />
                    {!collapsed && (
                      <span
                        className={`text-sm ${item.name === "Sell Products and Services" ? "font-semibold gradient-text" : "text-gray-700 dark:text-white"}`}
                      >
                        {item.name}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(item.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 transition-smooth"
                      style={{
                        backgroundColor: favoriteItems.includes(item.name) ? `${secondaryColor}10` : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${secondaryColor}10`}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = favoriteItems.includes(item.name) ? `${secondaryColor}10` : 'transparent'}
                    >
                      <Star
                        className="h-4 w-4"
                        style={{
                          color: favoriteItems.includes(item.name) ? secondaryColor : undefined,
                          fill: favoriteItems.includes(item.name) ? secondaryColor : 'none'
                        }}
                      />
                    </Button>
                  )}
                </div>
                {!collapsed && item.subItems.length > 0 && (
                  <div className="ml-8 space-y-1">
                    {item.subItems.map((subItem) => (
                      <div
                        key={subItem}
                        className="flex items-center justify-between py-1 px-3 rounded-lg hover:bg-gray-100 cursor-pointer group transition-smooth"
                      >
                        <span className="text-sm text-gray-600 dark:text-white">{subItem}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(subItem)}
                          className="opacity-0 group-hover:opacity-100 p-1 transition-smooth"
                          style={{
                            backgroundColor: favoriteItems.includes(subItem) ? `${secondaryColor}10` : 'transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${secondaryColor}10`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = favoriteItems.includes(subItem) ? `${secondaryColor}10` : 'transparent'}
                        >
                          <Star
                            className="h-3 w-3"
                            style={{
                              color: favoriteItems.includes(subItem) ? secondaryColor : undefined,
                              fill: favoriteItems.includes(subItem) ? secondaryColor : 'none'
                            }}
                          />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPositionDialog(true)}
            className="w-full justify-center hover:bg-gray-100 transition-smooth"
            title="Sidebar Position"
          >
            <Move className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent className="bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Sidebar Position</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {["Top", "Bottom", "Left", "Right"].map((pos) => (
              <Button
                key={pos}
                variant={position === pos.toLowerCase() ? "default" : "outline"}
                onClick={() => {
                  onPositionChange(pos.toLowerCase() as any)
                  setShowPositionDialog(false)
                }}
                style={position === pos.toLowerCase() ? {
                  backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                  color: 'white'
                } : undefined}
                className={
                  position === pos.toLowerCase()
                    ? ""
                    : "border-gray-300 hover:bg-gray-50 text-gray-700 dark:text-white"
                }
              >
                {pos}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
