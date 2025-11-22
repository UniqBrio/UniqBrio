'use client';

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardTitle } from "@/components/dashboard/ui/card"
import ComingSoonNotice from "./coming-soon-notice"
import { Switch } from "@/components/dashboard/ui/switch"
import { Button } from "@/components/dashboard/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/ui/tooltip"
import { useToast } from "@/hooks/dashboard/use-toast"
import { Bell, Info } from "lucide-react"

export default function SmartNotifications() {
  const { toast } = useToast()
  const defaultNotif = { sms: true, email: true, whatsapp: true, inapp: true }
  const defaultAlerts = { pending24h: true, quotaBreach: true, upcomingApproved: true }

  const [notif, setNotif] = useState(defaultNotif)
  const [alerts, setAlerts] = useState(defaultAlerts)
  const [initialNotif, setInitialNotif] = useState(defaultNotif)
  const [initialAlerts, setInitialAlerts] = useState(defaultAlerts)
  // Lock the feature to be non-editable as per design (coming soon)
  const locked = true

  useEffect(() => {
    // Session-only; ensure no persisted values are used
    try { localStorage.removeItem("ub-smart-notifications") } catch {}
    setInitialNotif(defaultNotif)
    setInitialAlerts(defaultAlerts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dirty = useMemo(() => {
    return (
      JSON.stringify(notif) !== JSON.stringify(initialNotif) ||
      JSON.stringify(alerts) !== JSON.stringify(initialAlerts)
    )
  }, [notif, alerts, initialNotif, initialAlerts])

  function handleSave() {
    setInitialNotif(notif)
    setInitialAlerts(alerts)
    toast({ title: "Saved", description: "Notification preferences updated for this session." })
  }

  return (
    <Card>
      <CardContent className="space-y-6">
       

        <ComingSoonNotice text="Coming Soon" />
         <div className="mb-2 opacity-50">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Smart Notifications & Communications 
          </CardTitle>
        </div>
        
        
        <div className="opacity-50 pointer-events-none select-none" aria-disabled="true">
        <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Notification Channels */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Notification Channels</h4>
            <div className="flex items-center gap-2">
              <Switch
                id="page-notif-sms"
                checked={notif.sms}
                onCheckedChange={(v) => setNotif((p) => ({ ...p, sms: v }))}
                className="data-[state=checked]:bg-purple-600"
                disabled={locked}
              />
              <label htmlFor="page-notif-sms" className="text-sm">SMS</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="page-notif-email"
                checked={notif.email}
                onCheckedChange={(v) => setNotif((p) => ({ ...p, email: v }))}
                className="data-[state=checked]:bg-purple-600"
                disabled={locked}
              />
              <label htmlFor="page-notif-email" className="text-sm">Email</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="page-notif-whatsapp"
                checked={notif.whatsapp}
                onCheckedChange={(v) => setNotif((p) => ({ ...p, whatsapp: v }))}
                className="data-[state=checked]:bg-purple-600"
                disabled={locked}
              />
              <label htmlFor="page-notif-whatsapp" className="text-sm">Whatsapp</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="page-notif-inapp"
                checked={notif.inapp}
                onCheckedChange={(v) => setNotif((p) => ({ ...p, inapp: v }))}
                className="data-[state=checked]:bg-purple-600"
                disabled={locked}
              />
              <label htmlFor="page-notif-inapp" className="text-sm">InApp</label>
            </div>
          </div>

          {/* Auto-Alert Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Auto-Alert Settings</h4>
            {/* Moved: Feature toggles under Auto-Alert Settings */}
            <div className="flex items-center gap-2">
              <Switch
                id="page-alert-conflict"
                checked={true}
                onCheckedChange={() => {}}
                className="data-[state=checked]:bg-purple-600"
                disabled={locked}
              />
              <label htmlFor="page-alert-conflict" className="text-sm">Conflict Detection</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="page-alert-ai"
                checked={true}
                onCheckedChange={() => {}}
                className="data-[state=checked]:bg-purple-600"
                disabled={locked}
              />
              <label htmlFor="page-alert-ai" className="text-sm">AI Suggestions</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="page-alert-pending"
                checked={alerts.pending24h}
                onCheckedChange={(v) => setAlerts((p) => ({ ...p, pending24h: v }))}
                className="data-[state=checked]:bg-purple-600"
                disabled={locked}
              />
              <label htmlFor="page-alert-pending" className="text-sm">Pending &gt; 24 hours</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Info: Pending over 24 hours"
                    className={locked ? "text-[hsl(var(--muted-foreground)/.6)] cursor-not-allowed" : "text-muted-foreground hover:text-foreground"}
                    disabled={locked}
                  >
                    <Info className={locked ? "h-4 w-4 text-[hsl(var(--muted-foreground)/.6)]" : "h-4 w-4"} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-xs">
                  If a leave request isn't approved or rejected within 24 hours, send a notification.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="page-alert-quota"
                checked={alerts.quotaBreach}
                onCheckedChange={(v) => setAlerts((p) => ({ ...p, quotaBreach: v }))}
                className="data-[state=checked]:bg-purple-600"
                disabled={locked}
              />
              <label htmlFor="page-alert-quota" className="text-sm">Quota breach alerts</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Info: Quota breach alerts"
                    className={locked ? "text-[hsl(var(--muted-foreground)/.6)] cursor-not-allowed" : "text-muted-foreground hover:text-foreground"}
                    disabled={locked}
                  >
                    <Info className={locked ? "h-4 w-4 text-[hsl(var(--muted-foreground)/.6)]" : "h-4 w-4"} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-xs">
                  When a person exceeds their allotted leave quota, send a notification.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="page-alert-upcoming"
                checked={alerts.upcomingApproved}
                onCheckedChange={(v) => setAlerts((p) => ({ ...p, upcomingApproved: v }))}
                className="data-[state=checked]:bg-purple-600"
                disabled={locked}
              />
              <label htmlFor="page-alert-upcoming" className="text-sm">Upcoming approved leaves</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Info: Upcoming approved leaves"
                    className={locked ? "text-[hsl(var(--muted-foreground)/.6)] cursor-not-allowed" : "text-muted-foreground hover:text-foreground"}
                    disabled={locked}
                  >
                    <Info className={locked ? "h-4 w-4 text-[hsl(var(--muted-foreground)/.6)]" : "h-4 w-4"} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-xs">
                  When a request is approved, send a notification.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        </TooltipProvider>
        </div>

        {!locked && dirty && (
          <div className="flex items-center justify-end pt-2">
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
