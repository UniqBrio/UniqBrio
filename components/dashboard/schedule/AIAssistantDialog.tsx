"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dashboard/ui/dialog"
import { Button } from "@/components/dashboard/ui/button"
import { Card } from "@/components/dashboard/ui/card"
import { Zap, TrendingUp, Sparkles, Users, Clock, MapPin } from "lucide-react"
import { useCustomColors } from '@/lib/use-custom-colors'

interface AIAssistantDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  suggestions: string[]
}

export default function AIAssistantDialog({ isOpen, onOpenChange, suggestions }: AIAssistantDialogProps) {
  const { primaryColor } = useCustomColors();
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" style={{ color: primaryColor }} />
            AI Scheduling Assistant
          </DialogTitle>
          <DialogDescription>Get intelligent suggestions to optimize your schedule</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Smart Suggestions
            </h4>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
                  <Sparkles className="h-4 w-4 mt-0.5" style={{ color: primaryColor }} />
                  <div className="flex-1">
                    <p className="text-sm">{suggestion}</p>
                    <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                      Apply Suggestion
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Optimize Capacity
              </Button>
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Find Best Times
              </Button>
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Room Utilization
              </Button>
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Demand Forecast
              </Button>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}