"use client"
function SidebarPositionSelector() {
  const { position, setPosition } = useSidebarPosition()
  return (
    <div className="border-t border-gray-200 p-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="w-full flex items-center justify-center">
            <Move className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[120px] p-2" side="top">
          <div className="flex gap-1">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant={position === 'left' ? 'default' : 'ghost'}
                  className="h-7 w-12 px-0"
                  onClick={() => setPosition('left')}
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Left sidebar</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant={position === 'right' ? 'default' : 'ghost'}
                  className="h-7 w-12 px-0"
                  onClick={() => setPosition('right')}
                >
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Right sidebar</TooltipContent>
            </Tooltip>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}


import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Home,
  Briefcase,
  Calendar,
  BookOpen,
  ClipboardCheck,
  Users,
  UserCog,
  MessageSquare,
  CreditCard,
  TrendingUp,
  CalendarClock,
  Users2,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  UserPlus,
  Palette,
  LayoutGrid,
  Star,
  DollarSign,
  BarChart3,
  PieChart,
  FileText,
  TrendingDown,
  GraduationCap,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  UserCircle,
  Move,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { useSidebarPosition } from "../app/contexts/sidebar-position-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SidebarProps {
  position: "left" | "right" 
  collapsed: boolean
  toggleSidebar: () => void
}

interface MenuItem {
  id: string
  name: string
  icon: React.ReactNode
  href: string
  tooltip: string
  submenu?: MenuItem[]
  isFavorite?: boolean
  external?: boolean
}

export default function Sidebar({ position, collapsed, toggleSidebar }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([])
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoritesExpanded, setFavoritesExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("favoritesExpanded");
      return stored === null ? true : stored === "true";
    }
    return true;
  })
  const [allMenuExpanded, setAllMenuExpanded] = useState(true)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const favoritesRef = useRef<HTMLDivElement>(null)
  const { setPosition } = useSidebarPosition()

  // Define all menu items

  const menuItems: MenuItem[] = [
    {
      id: "home",
      name: "Home",
      icon: <Home className="h-5 w-5" />,
      href: "/",
      tooltip: "Home",
    },
    {
      id: "services",
      name: "Services",
      icon: <Briefcase className="h-5 w-5" />,
      href: "/services",
      tooltip: "Manage services",
      submenu: [
        {
          id: "schedule",
          name: "Schedule",
          icon: <Calendar className="h-5 w-5" />,
          href: "/services/schedule",
          tooltip: "Manage schedules",
        },
        {
          id: "courses",
          name: "Course Management",
          icon: <BookOpen className="h-5 w-5" />,
          href: "/services/courses",
          tooltip: "Manage courses",
        },
      ],
    },
    {
      id: "user",
      name: "User Management",
      icon: <UserCircle className="h-5 w-5" />,
      href: "/user",
      tooltip: "Manage users",
      submenu: [
        {
          id: "students",
          name: "Students Management", 
          icon: <Users className="h-5 w-5" />,
          href: "/dashboard/students",
          tooltip: "Manage students",
          submenu: [
            {
              id: "attendance-students",
              name: "Attendance",
              icon: <ClipboardCheck className="h-5 w-5" />,
              href: "/user/students/attendance",
              tooltip: "Track student attendance",
            },
            {
              id: "leave-students",
              name: "Leave Management",
              icon: <Calendar className="h-5 w-5" />,
              href: "/user/students/leave",
              tooltip: "Manage student leave",
            },
          ],
        },
        {
          id: "staff",
          name: "Staff Management",
          icon: <Users className="h-5 w-5" />,
          href: "/user/staff",
          tooltip: "Manage staff",
          submenu: [
            {
              id: "instructor",
              name: "Instructor",
              icon: <Users className="h-5 w-5" />,
              href: "/user/staff/instructor",
              tooltip: "Manage instructors",
              submenu: [
                {
                  id: "attendance-instructor",
                  name: "Attendance",
                  icon: <ClipboardCheck className="h-5 w-5" />,
                  href: "/user/staff/instructor/attendance",
                  tooltip: "Track instructor attendance",
                },
                {
                  id: "leave-instructor",
                  name: "Leave Management",
                  icon: <Calendar className="h-5 w-5" />,
                  href: "/user/staff/instructor/leave",
                  tooltip: "Manage instructor leave",
                },
              ],
            },
            {
              id: "non-instructor",
              name: "Non-Instructor",
              icon: <Users className="h-5 w-5" />,
              href: "/user/staff/non-instructor",
              tooltip: "Manage non-instructors",
              submenu: [
                {
                  id: "attendance-noninstructor",
                  name: "Attendance",
                  icon: <ClipboardCheck className="h-5 w-5" />,
                  href: "/user/staff/non-instructor/attendance",
                  tooltip: "Track non-instructor attendance",
                },
                {
                  id: "leave-noninstructor",
                  name: "Leave Management",
                  icon: <Calendar className="h-5 w-5" />,
                  href: "/user/staff/non-instructor/leave",
                  tooltip: "Manage non-instructor leave",
                },
              ],
            },
          ],
        },
        {
          id: "parents",
          name: "Parent Management",
          icon: <Users className="h-5 w-5" />,
          href: "/user/parents",
          tooltip: "Manage parents",
        },
        {
          id: "alumni",
          name: "Alumni Management",
          icon: <GraduationCap className="h-5 w-5" />,
          href: "/user/alumni",
          tooltip: "Manage alumni",
        },
      ],
    },
    {
      id: "enquiries",
      name: "Customer Relations",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/enquiries",
      tooltip: "Enquiries and leads",
      
    },
    {
      id: "payments",
      name: "Payments",
      icon: <CreditCard className="h-5 w-5" />,
      href: "/payments",
      tooltip: "Payments",
    },
    {
      id: "financials",
      name: "Financials",
      icon: <DollarSign className="h-5 w-5" />,
      href: "/financials",
      tooltip: "Manage financials",
    },
    {
      id: "events",
      name: "Events",
      icon: <CalendarClock className="h-5 w-5" />,
      href: "/events",
      tooltip: "Manage events",
    },
    {
      id: "promotions",
      name: "Promotions",
      icon: <TrendingUp className="h-5 w-5" />,
      href: "/promotions",
      tooltip: "Manage promotions",
    },
    {
      id: "community",
      name: "Community",
      icon: <Users2 className="h-5 w-5" />,
      href: "https://dailybrio.uniqbrio.com/",
      tooltip: "Community",
      external: true,
    },
    
    {
      id: "settings",
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
      tooltip: "Settings",
    },
    {
      id: "help",
      name: "Help",
      icon: <HelpCircle className="h-5 w-5" />,
      href: "/help",
      tooltip: "Help",
    },
  ]

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("favorites")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  // Update filtered menu items when search term changes
  useEffect(() => {
    let items = [...menuItems]

    // Mark items as favorites based on the favorites array
    items = items.map((item) => {
      const newItem = { ...item, isFavorite: favorites.includes(item.id) }
      if (item.submenu) {
        newItem.submenu = item.submenu.map((subitem) => ({
          ...subitem,
          isFavorite: favorites.includes(subitem.id),
          submenu: subitem.submenu
            ? subitem.submenu.map((subsubitem) => ({
                ...subsubitem,
                isFavorite: favorites.includes(subsubitem.id),
              }))
            : undefined,
        }))
      }
      return newItem
    })

    // Filter by search term if provided
    if (searchTerm.trim() !== "") {
      const searchResults: MenuItem[] = []

    // Recursive search function to collect all matching items at any depth
    const collectMatches = (menuItems: MenuItem[], parentIds: string[] = []): MenuItem[] => {
      let results: MenuItem[] = [];
      menuItems.forEach((item) => {
        const matchesItem = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        let matchedSubmenu: MenuItem[] = [];
        if (item.submenu) {
          matchedSubmenu = collectMatches(item.submenu, [...parentIds, item.id]);
        }
        if (matchesItem || matchedSubmenu.length > 0) {
          // If item matches or any of its children match, include them
          const itemCopy = { ...item };
          if (matchedSubmenu.length > 0) {
            itemCopy.submenu = matchedSubmenu;
          } else {
            delete itemCopy.submenu;
          }
          results.push(itemCopy);
          // Open all parent submenus for matches
          parentIds.forEach(pid => {
            if (!openSubmenus.includes(pid)) {
              setOpenSubmenus(prev => [...prev, pid]);
            }
          });
          if (!openSubmenus.includes(item.id) && (matchedSubmenu.length > 0)) {
            setOpenSubmenus(prev => [...prev, item.id]);
          }
        }
      });
      return results;
    };

    items = collectMatches(items);
    }

    setFilteredMenuItems(items)
    // Collapse Favourites section automatically when searching, but only if not manually collapsed
    if (searchTerm.trim() !== "") {
      if (localStorage.getItem("favoritesExpanded") !== "false") {
        setFavoritesExpanded(false)
      }
    } else {
      const stored = localStorage.getItem("favoritesExpanded");
      setFavoritesExpanded(stored === null ? true : stored === "true");
    }
  }, [searchTerm, favorites, openSubmenus])

  // Close favorites dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (favoritesRef.current && !favoritesRef.current.contains(event.target as Node)) {
        setFavoritesOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) => {
      if (prev.includes(name)) {
        return prev.filter((item) => item !== name)
      } else {
        return [...prev, name]
      }
    })
  }

  // Helper to get all descendant ids for a menu item
  const getAllDescendantIds = (item: MenuItem): string[] => {
    let ids: string[] = [];
    if (item.submenu && item.submenu.length > 0) {
      item.submenu.forEach(sub => {
        ids.push(sub.id);
        ids = ids.concat(getAllDescendantIds(sub));
      });
    }
    return ids;
  };

  const toggleFavorite = (id: string) => {
    // Find the item in menuItems
    const findItem = (items: MenuItem[]): MenuItem | undefined => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.submenu) {
          const found = findItem(item.submenu);
          if (found) return found;
        }
      }
      return undefined;
    };
    const item = findItem(menuItems);
    if (!item) return;

    const allIds = [id, ...getAllDescendantIds(item)];

    setFavorites((prev) => {
      let newFavorites: string[];
      if (prev.includes(id)) {
        // Remove all
        newFavorites = prev.filter((favId) => !allIds.includes(favId));
      } else {
        // Add all
        newFavorites = [...prev, ...allIds.filter(favId => !prev.includes(favId))];
      }

      // Helper to recursively check and update parent favorite status
      const updateParentFavorites = (items: MenuItem[], favs: string[]): string[] => {
        let updatedFavs = [...favs];
        const findParentId = (items: MenuItem[], childId: string): string | undefined => {
          for (const item of items) {
            if (item.submenu && item.submenu.some(sub => sub.id === childId)) {
              return item.id;
            }
            if (item.submenu) {
              const found = findParentId(item.submenu, childId);
              if (found) return found;
            }
          }
          return undefined;
        };

        let parentId = findParentId(menuItems, id);
        while (parentId) {
          const parentItem = findItem(menuItems.filter(item => item.id === parentId));
          if (parentItem && parentItem.submenu) {
            // Get all descendant ids for the parent
            const getAllDescendantIdsForParent = (item: MenuItem): string[] => {
              let ids: string[] = [];
              if (item.submenu && item.submenu.length > 0) {
                item.submenu.forEach(sub => {
                  ids.push(sub.id);
                  ids = ids.concat(getAllDescendantIdsForParent(sub));
                });
              }
              return ids;
            };
            const allSubIds = parentItem.submenu.map(sub => sub.id);
            // All direct children must be selected
            const allDirectSubSelected = allSubIds.every(subId => updatedFavs.includes(subId));
            // All descendants must be selected
            const allDescendantIds = getAllDescendantIdsForParent(parentItem);
            const allDescendantsSelected = allDescendantIds.every(subId => updatedFavs.includes(subId));
            if (allDirectSubSelected && allDescendantsSelected && !updatedFavs.includes(parentId)) {
              updatedFavs = [...updatedFavs, parentId];
            } else if ((!allDirectSubSelected || !allDescendantsSelected) && updatedFavs.includes(parentId)) {
              updatedFavs = updatedFavs.filter(favId => favId !== parentId);
            }
            parentId = findParentId(menuItems, parentId);
          } else {
            break;
          }
        }
        return updatedFavs;
      };

      newFavorites = updateParentFavorites(menuItems, newFavorites);
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      return newFavorites;
    });
  }

  // Get all favorite menu items
  // Group favorites by parent menu
  const getFavoriteGroups = () => {
    const groups: { parent: MenuItem, children: MenuItem[] }[] = [];
    const parentIds: string[] = [];
    const addGroup = (item: MenuItem, parent?: MenuItem) => {
      if (favorites.includes(item.id)) {
        if (parent && favorites.includes(parent.id)) {
          // If parent is already a favorite, don't add child separately
          return;
        }
        if (parent) {
          let group = groups.find(g => g.parent.id === parent.id);
          if (!group) {
            group = { parent, children: [] };
            groups.push(group);
            parentIds.push(parent.id);
          }
          group.children.push(item);
        } else {
          groups.push({ parent: item, children: [] });
          parentIds.push(item.id);
        }
      }
      if (item.submenu) {
        item.submenu.forEach(sub => addGroup(sub, item));
      }
    };
    menuItems.forEach(item => addGroup(item));
    // Remove children from groups if parent is present
    return groups.filter(g => !parentIds.includes(g.parent.id) || g.children.length > 0);
  };

  // Get the appropriate collapse icon based on sidebar position
  const getCollapseIcon = () => {
    if (collapsed) {
      switch (position) {
        case "left":
          return <ChevronRight className="h-5 w-5" />
        case "right":
          return <ChevronLeft className="h-5 w-5" />
       
      }
    } else {
      switch (position) {
        case "left":
          return <ChevronLeft className="h-5 w-5" />
        case "right":
          return <ChevronRight className="h-5 w-5" />
    
      }
    }
  }

  // Determine sidebar classes based on position and collapsed state
  const getSidebarClasses = () => {
    const baseClasses = "bg-white border-gray-200 transition-all duration-300 ease-in-out z-20 flex"

    switch (position) {
      case "left":
        return cn(baseClasses, "border-r h-screen flex-col", collapsed ? "w-[70px]" : "w-[250px]")
      case "right":
        return cn(baseClasses, "border-l h-screen flex-col", collapsed ? "w-[70px]" : "w-[250px]")
      
      default:
        return baseClasses
    }
  }

  

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isOpen = openSubmenus.includes(item.id);
    const isFavorite = favorites.includes(item.id);

    // Always show icons for all menu items (including submenus) when collapsed
    // Remove left margin for collapsed state so icons are vertically aligned
    const itemContainerClass = collapsed ? "" : level > 0 ? "ml-4" : "";

    // In collapsed mode, only show icons for all menu items and submenus (flattened)
    // This block is not used anymore, see renderVerticalContent for collapsed mode rendering
    if (collapsed) {
      // This will be handled in renderVerticalContent
      return null;
    }
    // Expanded mode: original rendering
    return (
      <div key={item.id} className={itemContainerClass}>
        {hasSubmenu ? (
          <Collapsible open={isOpen} onOpenChange={() => toggleSubmenu(item.id)}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CollapsibleTrigger
                  className={cn(
                    "flex items-center w-full px-2 py-2 text-sm font-medium rounded-md hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors",
                    "justify-between",
                  )}
                >
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-3">{item.icon}</span>
                    <span className="text-left">{item.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span
                      role="button"
                      tabIndex={0}
                      className={cn("inline-flex items-center justify-center h-6 w-6 mr-1 rounded text-gray-400 hover:text-orange-500 cursor-pointer", isFavorite ? "text-orange-500" : "text-gray-400")}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star className={cn("h-4 w-4", isFavorite ? "fill-orange-500" : "")} />
                    </span>
                    <ChevronDown
                      className={cn("h-4 w-4 text-gray-500 transition-transform", isOpen && "transform rotate-180")}
                    />
                  </div>
                </CollapsibleTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-purple-700 text-white">
                {item.tooltip}
              </TooltipContent>
            </Tooltip>
            {isOpen && item.submenu && (
              <CollapsibleContent className="space-y-1 mt-1">
                {item.submenu.map((subitem) => renderMenuItem(subitem, level + 1))}
              </CollapsibleContent>
            )}
          </Collapsible>
        ) : (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors",
                      "justify-start flex-1",
                    )}
                  >
                    <span className="text-gray-500 mr-3">{item.icon}</span>
                    <span className="text-left">{item.name}</span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors",
                      "justify-start flex-1",
                    )}
                  >
                    <span className="text-gray-500 mr-3">{item.icon}</span>
                    <span className="text-left">{item.name}</span>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-6 w-6 mr-1", isFavorite ? "text-orange-500" : "text-gray-400")}
                  onClick={() => toggleFavorite(item.id)}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className={cn("h-4 w-4", isFavorite ? "fill-orange-500" : "")}/>
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-purple-700 text-white">
              {item.tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }  

 

  // Render vertical sidebar content (for left/right positions)
  const renderVerticalContent = () => {
    // Helper to recursively filter menu items to only favorites, preserving hierarchy
    const filterFavoritesHierarchy = (items: MenuItem[]): MenuItem[] => {
      return items
        .map(item => {
          if (favorites.includes(item.id)) {
            // If this item is a favorite, include it and all its submenus (filtered)
            return {
              ...item,
              submenu: item.submenu ? filterFavoritesHierarchy(item.submenu) : undefined,
            };
          } else if (item.submenu) {
            // If any submenu is a favorite, include this item with filtered submenus
            const filteredSubmenu = filterFavoritesHierarchy(item.submenu);
            if (filteredSubmenu.length > 0) {
              return {
                ...item,
                submenu: filteredSubmenu,
              };
            }
          }
          return null;
        })
        .filter(Boolean) as MenuItem[];
    };

    // Helper to flatten all menu items and submenus into a single array
    const flattenMenuItems = (items: MenuItem[]): MenuItem[] => {
      let flat: MenuItem[] = [];
      items.forEach(item => {
        flat.push(item);
        if (item.submenu) {
          flat = flat.concat(flattenMenuItems(item.submenu));
        }
      });
      return flat;
    };

    const favoriteMenuItems = filterFavoritesHierarchy(menuItems);
    const hasFavorites = favoriteMenuItems.length > 0;

    return (
      <>
        <div className="flex flex-col h-16 px-4 border-b border-gray-200 justify-center">
          <div className="flex items-center justify-center w-full h-full relative">
            {!collapsed && (
              <a href="https://www.uniqbrio.com/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full">
                <img src="/UniqBrio Logo Transparent.png" alt="UniqBrio Logo" className="h-30 w-40" />
              </a>
            )}
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {getCollapseIcon()}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Collapsed mode: show all icons flat */}
        {collapsed ? (
          <div className="py-4 overflow-y-auto flex-1 flex flex-col items-center gap-2">
            {/* Always show main menu items in collapsed mode, even if favorites are empty */}
            {menuItems.length === 0 ? (
              <div className="text-gray-400 text-sm">No menu items available</div>
            ) : (
              menuItems.map((item) => (
                <div key={item.id} className="flex items-center justify-center w-full relative">
                  <div className="flex items-center justify-between w-full">
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          {item.href ? (
                            item.external ? (
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center px-2 py-2 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                aria-label={item.name}
                              >
                                <span className="text-gray-500">{item.icon}</span>
                              </a>
                            ) : (
                              <Link
                                href={item.href}
                                className="flex items-center justify-center px-2 py-2 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                aria-label={item.name}
                              >
                                <span className="text-gray-500">{item.icon}</span>
                              </Link>
                            )
                          ) : (
                            <span className="text-gray-500 px-2 py-2">{item.icon}</span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-purple-700 text-white">
                        {item.tooltip}
                      </TooltipContent>
                    </Tooltip>
                    <button
                      onClick={() => setAllMenuExpanded((prev) => !prev)}
                      className="p-1 rounded hover:bg-gray-100 focus:outline-none"
                      aria-label={allMenuExpanded ? "Collapse all menu items" : "Expand all menu items"}
                    >
                      {allMenuExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Expanded mode: original rendering */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search menu..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search menu items"
                />
              </div>
            </div>

            <div className="py-4 overflow-y-auto flex-1">
              {/* Favourites Section - uses the exact same UI and hierarchy as all menu items */}
              {hasFavorites && (
                <div className="px-4 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2 fill-orange-500 text-orange-500" />
                      <span className="font-semibold">Favourites</span>
                    </div>
                    {/* Plus/Minus icon for expand/collapse */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setFavoritesExpanded((prev) => {
                          localStorage.setItem("favoritesExpanded", (!prev).toString());
                          return !prev;
                        });
                      }}
                      aria-label={favoritesExpanded ? "Collapse favourites" : "Expand favourites"}
                    >
                      {favoritesExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                  </div>
                  {favoritesExpanded && (
                    <nav className="space-y-1 mt-2">{favoriteMenuItems.map((item) => renderMenuItem(item))}</nav>
                  )}
                </div>
              )}

              {/* All Menu Items Section */}
              <div className="px-4 mb-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">All menu items</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAllMenuExpanded((prev) => !prev)}
                    aria-label={allMenuExpanded ? "Collapse all menu items" : "Expand all menu items"}
                  >
                    {allMenuExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </div>
                {allMenuExpanded && (
                  <nav className="space-y-1 mt-2">{filteredMenuItems.map((item) => renderMenuItem(item))}</nav>
                )}
              </div>
            </div>
          </>
        )}
        {/* Sidebar position selector at the bottom */}
        <SidebarPositionSelector />
      </>
    )
  }

  return (
    <TooltipProvider>
      <aside className={getSidebarClasses()}>
         {renderVerticalContent()}
      </aside>
    </TooltipProvider>
  )
}
