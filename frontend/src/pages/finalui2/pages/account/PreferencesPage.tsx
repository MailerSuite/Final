import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  PaintBrushIcon,
  LanguageIcon,
  ComputerDesktopIcon,
  BellIcon,
  EyeIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

const PreferencesPage: React.FC = () => {
  const [theme, setTheme] = useState('system')
  const [language, setLanguage] = useState('en')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [tablePageSize, setTablePageSize] = useState([25])
  const [dashboardLayout, setDashboardLayout] = useState('grid')
  const [timezone, setTimezone] = useState('America/New_York')
  const [dateFormat, setDateFormat] = useState('MM/dd/yyyy')
  const [numberFormat, setNumberFormat] = useState('en-US')
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false)

  const themes = [
    { id: 'light', name: 'Light', icon: SunIcon, preview: 'bg-white border' },
    { id: 'dark', name: 'Dark', icon: MoonIcon, preview: 'bg-gray-900 border-gray-700' },
    { id: 'system', name: 'System', icon: ComputerDesktopIcon, preview: 'bg-gradient-to-r from-white to-gray-900' }
  ]

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ]

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ]

  const dateFormats = [
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'yyyy-MM-dd',
    'MMM dd, yyyy',
    'dd MMM yyyy'
  ]

  const handleSavePreferences = () => {
    // Implementation for saving preferences
    console.log('Saving preferences...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize your experience and application settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PaintBrushIcon className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
            <CardDescription>
              Customize how the application looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Theme</Label>
              <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
                {themes.map((themeOption) => (
                  <div key={themeOption.id}>
                    <RadioGroupItem
                      value={themeOption.id}
                      id={themeOption.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={themeOption.id}
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      )}
                    >
                      <themeOption.icon className="mb-3 h-6 w-6" />
                      <div className={cn("w-full h-8 rounded mb-2", themeOption.preview)} />
                      <span className="text-sm font-medium">{themeOption.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">UI Preferences</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Compact Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Reduce spacing for more content
                    </p>
                  </div>
                  <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Animations</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable smooth transitions and animations
                    </p>
                  </div>
                  <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Advanced Features</Label>
                    <p className="text-xs text-muted-foreground">
                      Show developer and power user features
                    </p>
                  </div>
                  <Switch checked={showAdvancedFeatures} onCheckedChange={setShowAdvancedFeatures} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Table Page Size</Label>
              <div className="space-y-2">
                <Slider
                  value={tablePageSize}
                  onValueChange={setTablePageSize}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10 rows</span>
                  <span className="font-medium">{tablePageSize[0]} rows</span>
                  <span>100 rows</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LanguageIcon className="h-5 w-5" />
              <span>Language & Region</span>
            </CardTitle>
            <CardDescription>
              Set your language, timezone, and regional preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format} value={format}>
                      <div className="flex items-center justify-between w-full">
                        <span>{format}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date().toLocaleDateString('en-US', {
                            year: format.includes('yyyy') ? 'numeric' : '2-digit',
                            month: format.includes('MMM') ? 'short' : '2-digit',
                            day: '2-digit'
                          })}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Number Format</Label>
              <Select value={numberFormat} onValueChange={setNumberFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">1,234.56 (US)</SelectItem>
                  <SelectItem value="en-EU">1.234,56 (EU)</SelectItem>
                  <SelectItem value="en-IN">1,23,456.78 (India)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BellIcon className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Manage how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive browser push notifications
                  </p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Marketing Emails</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive product updates and tips
                  </p>
                </div>
                <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
              </div>
            </div>

            <Separator />

            <Alert>
              <BellIcon className="h-4 w-4" />
              <AlertDescription>
                You can customize individual notification types in your account settings.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Workspace */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cog6ToothIcon className="h-5 w-5" />
              <span>Workspace</span>
            </CardTitle>
            <CardDescription>
              Configure your workspace and productivity settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Dashboard Layout</Label>
              <RadioGroup value={dashboardLayout} onValueChange={setDashboardLayout}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="grid" id="grid" />
                  <Label htmlFor="grid" className="text-sm">Grid Layout</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="list" id="list" />
                  <Label htmlFor="list" className="text-sm">List Layout</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="compact" id="compact" />
                  <Label htmlFor="compact" className="text-sm">Compact Layout</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Auto-save</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically save changes as you work
                  </p>
                </div>
                <Switch checked={autoSave} onCheckedChange={setAutoSave} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings Preview */}
      {showAdvancedFeatures && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SparklesIcon className="h-5 w-5" />
              <span>Advanced Features</span>
              <Badge variant="secondary">Beta</Badge>
            </CardTitle>
            <CardDescription>
              Experimental features for power users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Debug Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Show detailed debug information
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">API Preview</Label>
                  <p className="text-xs text-muted-foreground">
                    Access experimental API features
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={handleSavePreferences} className="flex items-center space-x-2">
          <CheckCircleIcon className="h-4 w-4" />
          <span>Save Preferences</span>
        </Button>
      </div>
    </div>
  )
}

export default PreferencesPage