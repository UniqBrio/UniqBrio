'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Palette, Sun, Moon, Monitor } from 'lucide-react'

interface ThemePreviewProps {
  className?: string
}

const colorThemes = [
  { name: 'Default', value: 'default', primary: 'hsl(222.2 47.4% 11.2%)' },
  { name: 'Purple', value: 'purple', primary: 'hsl(262.1 83.3% 57.8%)' },
  { name: 'Blue', value: 'blue', primary: 'hsl(221.2 83.2% 53.3%)' },
  { name: 'Green', value: 'green', primary: 'hsl(142.1 76.2% 36.3%)' },
  { name: 'Orange', value: 'orange', primary: 'hsl(24.6 95% 53.1%)' },
  { name: 'Red', value: 'red', primary: 'hsl(0 84.2% 60.2%)' },
]

export default function ThemePreview({ className = '' }: ThemePreviewProps) {
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    // Apply color theme
    root.setAttribute('data-theme', selectedTheme)
    
    // Apply dark/light mode
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [selectedTheme, mode, mounted])

  if (!mounted) {
    return null
  }

  return (
    <section className={`py-20 px-4 bg-gradient-to-b from-background to-muted/20 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Palette className="w-3 h-3 mr-1" />
            Live Theme Preview
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Customize Your Experience
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how UniqBrio looks with different color themes and modes. 
            Try them live and find your perfect style!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Theme Controls */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Theme Controls</CardTitle>
              <CardDescription>
                Customize the look and feel in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Theme Selector */}
              <div className="space-y-3">
                <Label htmlFor="color-theme" className="text-base font-semibold">
                  Color Theme
                </Label>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger id="color-theme">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorThemes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: theme.primary }}
                          />
                          {theme.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dark/Light Mode Toggle */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Display Mode</Label>
                <Tabs value={mode} onValueChange={(v) => setMode(v as 'light' | 'dark')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="light" className="gap-2">
                      <Sun className="w-4 h-4" />
                      Light
                    </TabsTrigger>
                    <TabsTrigger value="dark" className="gap-2">
                      <Moon className="w-4 h-4" />
                      Dark
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Quick Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode-switch" className="text-base">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark
                  </p>
                </div>
                <Switch
                  id="dark-mode-switch"
                  checked={mode === 'dark'}
                  onCheckedChange={(checked) => setMode(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See how components look with your selected theme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sample UI Components */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Dashboard Preview</h3>
                  <p className="text-muted-foreground">
                    This is how your academy dashboard will look with the selected theme.
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button>Primary Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        Total Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">1,234</div>
                      <p className="text-xs text-muted-foreground">
                        +12% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        Active Classes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">42</div>
                      <p className="text-xs text-muted-foreground">
                        +3 this week
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '92%' }} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge>New</Badge>
                  <Badge variant="secondary">Important</Badge>
                  <Badge variant="outline">Update</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            These themes are available for all UniqBrio users. 
            Customize your workspace to match your academy's brand!
          </p>
        </div>
      </div>
    </section>
  )
}
