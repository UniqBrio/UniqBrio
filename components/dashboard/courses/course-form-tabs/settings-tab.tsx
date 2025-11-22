"use client"

import { Label } from "@/components/dashboard/ui/label"
import { Input } from "@/components/dashboard/ui/input"
import { Switch } from "@/components/dashboard/ui/switch"
import { Separator } from "@/components/dashboard/ui/separator"

interface SettingsTabProps {
  formData: any
  onFormChange: (field: string, value: any) => void
}

export default function SettingsTab({ formData, onFormChange }: SettingsTabProps) {
  return (
    <div className="space-y-2 compact-form">
  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700 text-center italic">
          Coming Soon
        </p>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Content Security</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center space-x-1 text-xs">
            <Switch 
              id="watermark" 
              checked={formData.contentSecurity?.watermark || false}
              onCheckedChange={(checked) => {
                const updated = { ...formData.contentSecurity, watermark: checked };
                onFormChange('contentSecurity', updated);
              }}
            />
            <Label htmlFor="watermark" className="text-xs">Watermark Protection</Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Switch 
              id="downloadProtection" 
              checked={formData.contentSecurity?.downloadProtection || false}
              onCheckedChange={(checked) => {
                const updated = { ...formData.contentSecurity, downloadProtection: checked };
                onFormChange('contentSecurity', updated);
              }}
            />
            <Label htmlFor="downloadProtection" className="text-xs">Download Protection</Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Switch 
              id="screenRecording" 
              checked={formData.contentSecurity?.screenRecording || false}
              onCheckedChange={(checked) => {
                const updated = { ...formData.contentSecurity, screenRecording: checked };
                onFormChange('contentSecurity', updated);
              }}
            />
            <Label htmlFor="screenRecording" className="text-xs">Screen Recording Protection</Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Switch 
              id="accessLogging" 
              checked={formData.contentSecurity?.accessLogging || false}
              onCheckedChange={(checked) => {
                const updated = { ...formData.contentSecurity, accessLogging: checked };
                onFormChange('contentSecurity', updated);
              }}
            />
            <Label htmlFor="accessLogging" className="text-xs">Access Logging</Label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Offline Access</h4>

        <div className="flex items-center space-x-1 text-xs">
          <Switch 
            id="offlineAccess" 
            checked={formData.offlineAccess?.enabled || false}
            onCheckedChange={(checked) => {
              const updated = { ...formData.offlineAccess, enabled: checked };
              onFormChange('offlineAccess', updated);
            }}
          />
          <Label htmlFor="offlineAccess" className="text-xs">Enable Offline Access</Label>
        </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Label htmlFor="downloadLimit" className="mb-1 text-xs">Download Limit (per month)</Label>
            <Input 
              id="downloadLimit" 
              placeholder="5" 
              type="number" 
              min="0"
              value={formData.offlineAccess?.downloadLimit || ''}
              onKeyDown={e => {
                if (e.key === '-') {
                  e.preventDefault();
                }
                // Allow clearing the field with backspace/delete
                if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                  const updated = { ...formData.offlineAccess, downloadLimit: '' };
                  onFormChange('offlineAccess', updated);
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty value for clearing
                if (value === '') {
                  const updated = { ...formData.offlineAccess, downloadLimit: '' };
                  onFormChange('offlineAccess', updated);
                  return;
                }
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 0) {
                  const updated = { ...formData.offlineAccess, downloadLimit: numValue.toString() };
                  onFormChange('offlineAccess', updated);
                }
              }}
              className="px-2 py-1 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="expiryDays" className="mb-1 text-xs">Content Expiry (days)</Label>
            <Input 
              id="expiryDays" 
              placeholder="30" 
              type="number" 
              min="1"
              value={formData.offlineAccess?.expiryDays || ''}
              onKeyDown={e => {
                if (e.key === '-') {
                  e.preventDefault();
                }
                // Allow clearing the field with backspace/delete
                if ((e.key === 'Backspace' || e.key === 'Delete') && e.currentTarget.value.length === 1) {
                  const updated = { ...formData.offlineAccess, expiryDays: '' };
                  onFormChange('offlineAccess', updated);
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty value for clearing
                if (value === '') {
                  const updated = { ...formData.offlineAccess, expiryDays: '' };
                  onFormChange('offlineAccess', updated);
                  return;
                }
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 1) {
                  const updated = { ...formData.offlineAccess, expiryDays: numValue.toString() };
                  onFormChange('offlineAccess', updated);
                }
              }}
              className="px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Integrations</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex items-center space-x-1 text-xs">
            <Switch 
              id="credentialVerification" 
              checked={formData.integrations?.credentialVerification || false}
              onCheckedChange={(checked) => {
                const updated = { ...formData.integrations, credentialVerification: checked };
                onFormChange('integrations', updated);
              }}
            />
            <Label htmlFor="credentialVerification" className="text-xs">Credential Verification API</Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Switch 
              id="marketplace" 
              checked={formData.integrations?.marketplace || false}
              onCheckedChange={(checked) => {
                const updated = { ...formData.integrations, marketplace: checked };
                onFormChange('integrations', updated);
              }}
            />
            <Label htmlFor="marketplace" className="text-xs">Content Marketplace</Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Switch 
              id="ltiIntegration" 
              checked={formData.integrations?.ltiIntegration || false}
              onCheckedChange={(checked) => {
                const updated = { ...formData.integrations, ltiIntegration: checked };
                onFormChange('integrations', updated);
              }}
            />
            <Label htmlFor="ltiIntegration" className="text-xs">LTI Integration</Label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Gamification</h4>

        <div className="flex items-center space-x-1 text-xs">
          <Switch 
            id="enableGamification" 
            checked={formData.gamification?.enabled || false}
            onCheckedChange={(checked) => {
              const updated = { ...formData.gamification, enabled: checked };
              onFormChange('gamification', updated);
            }}
          />
          <Label htmlFor="enableGamification" className="text-xs">Enable Gamification Features</Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center space-x-1 text-xs">
            <Switch 
              id="streakRewards" 
              checked={formData.gamification?.streakRewards || false}
              onCheckedChange={(checked) => {
                const updated = { ...formData.gamification, streakRewards: checked };
                onFormChange('gamification', updated);
              }}
            />
            <Label htmlFor="streakRewards" className="text-xs">Learning Streak Rewards</Label>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Switch 
              id="instructorBadges" 
              checked={formData.gamification?.instructorBadges || false}
              onCheckedChange={(checked) => {
                const updated = { ...formData.gamification, instructorBadges: checked };
                onFormChange('gamification', updated);
              }}
            />
            <Label htmlFor="instructorBadges" className="text-xs">Instructor Achievement Badges</Label>
          </div>
        </div>
      </div>
    </div>
  )
}
