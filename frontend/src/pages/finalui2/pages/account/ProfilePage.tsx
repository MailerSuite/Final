import React, { useState, useEffect } from 'react'
import PageShell from '../../components/PageShell'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import axios from '@/http/axios'
import {
  UserIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  CameraIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  LanguageIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'

// Design system CSS injection for smooth transitions
const designSystemStyles = `
  /* Page transitions */
  .page-transition {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .tab-transition {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Glass morphism effects */
  .glass-panel {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  
  /* Neon glow effects */
  .neon-glow {
    filter: drop-shadow(0 0 20px currentColor);
  }
  
  /* Smooth hover transitions */
  .smooth-hover {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .smooth-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
  
  /* Gradient text */
  .gradient-text {
    background: linear-gradient(135deg, #22d3ee 0%, #60a5fa 50%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* Card hover effects */
  .card-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
  
  /* Form input focus effects */
  .input-focus {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .input-focus:focus {
    transform: scale(1.02);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
  
  /* Button press effects */
  .button-press {
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .button-press:active {
    transform: scale(0.98);
  }
  
  /* Avatar hover effect */
  .avatar-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .avatar-hover:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = designSystemStyles;
  if (!document.head.querySelector('style[data-profile-design-system]')) {
    styleElement.setAttribute('data-profile-design-system', 'true');
    document.head.appendChild(styleElement);
  }
}

// Form schemas
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  website: z.string().url('Invalid website URL').optional(),
  dateOfBirth: z.string().optional(),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
})

const securitySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ProfileFormVals = z.infer<typeof profileSchema>
type SecurityFormVals = z.infer<typeof securitySchema>

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  dateOfBirth?: string;
  language: string;
  timezone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string;
  createdAt: string;
  plan: {
    name: string;
    tier: 'free' | 'pro' | 'enterprise';
    expiresAt?: string;
  };
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  campaignUpdates: boolean;
  systemMaintenance: boolean;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe',
    phone: '+1 (555) 123-4567',
    bio: 'Software developer and email marketing enthusiast. Building the future of digital communication.',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    dateOfBirth: '1990-01-01',
    language: 'en',
    timezone: 'America/Los_Angeles',
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: true,
    lastLoginAt: '2024-01-15T10:30:00Z',
    createdAt: '2023-06-01T09:00:00Z',
    plan: {
      name: 'Professional',
      tier: 'pro',
      expiresAt: '2024-12-31T23:59:59Z'
    }
  })
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    securityAlerts: true,
    campaignUpdates: true,
    systemMaintenance: true,
  })
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [showPassword, setShowPassword] = useState(false)
  
  const profileForm = useForm<ProfileFormVals>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      dateOfBirth: profile.dateOfBirth || '',
      language: profile.language,
      timezone: profile.timezone,
    }
  })
  
  const securityForm = useForm<SecurityFormVals>({
    resolver: zodResolver(securitySchema)
  })

  const onProfileSubmit = async (vals: ProfileFormVals) => {
    try {
      await axios.put('/api/v1/auth/me/profile', vals)
      setProfile(prev => ({ ...prev, ...vals }))
      toast.success('Profile updated successfully')
    } catch (e: unknown) {
      toast.error(e?.response?.data?.detail ?? 'Failed to update profile')
    }
  }
  
  const onSecuritySubmit = async (vals: SecurityFormVals) => {
    try {
      await axios.put('/api/v1/auth/me/password', {
        currentPassword: vals.currentPassword,
        newPassword: vals.newPassword
      })
      securityForm.reset()
      toast.success('Password updated successfully')
    } catch (e: unknown) {
      toast.error(e?.response?.data?.detail ?? 'Failed to update password')
    }
  }
  
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('avatar', file)
    
    try {
      const response = await axios.post('/api/v1/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfile(prev => ({ ...prev, avatar: response.data.avatarUrl }))
      toast.success('Avatar updated successfully')
    } catch (e: unknown) {
      toast.error('Failed to update avatar')
    }
  }
  
  const toggleTwoFactor = async () => {
    try {
      await axios.post('/api/v1/auth/me/2fa/toggle')
      setProfile(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))
      toast.success(`Two-factor authentication ${!profile.twoFactorEnabled ? 'enabled' : 'disabled'}`)
    } catch (e: unknown) {
      toast.error('Failed to update two-factor authentication')
    }
  }
  
  const updateNotifications = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      await axios.put('/api/v1/auth/me/notifications', { [key]: value })
      setNotifications(prev => ({ ...prev, [key]: value }))
      toast.success('Notification settings updated')
    } catch (e: unknown) {
      toast.error('Failed to update notification settings')
    }
  }
  
  const deleteAccount = async () => {
    try {
      await axios.delete('/api/v1/auth/me/account')
      toast.success('Account deletion initiated')
      // Redirect to login or home page
    } catch (e: unknown) {
      toast.error('Failed to delete account')
    }
  }

  return (
    <PageShell
      title="My Account"
      subtitle="Manage your profile, security and preferences"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Account' }, { label: 'Profile' }]}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-6xl mx-auto"
      >
        {/* Profile Header */}
        <Card className="card-hover glass-panel">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 avatar-hover">
                  <AvatarImage src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} />
                  <AvatarFallback className="text-2xl">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="absolute -bottom-1 -right-1 rounded-full p-2 h-8 w-8 button-press smooth-hover"
                    >
                      <CameraIcon className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Avatar</DialogTitle>
                      <DialogDescription>
                        Upload a new profile picture. Images should be at least 200x200 pixels.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {profile.emailVerified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircleSolidIcon className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className={`${
                    profile.plan.tier === 'enterprise' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                    profile.plan.tier === 'pro' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    'bg-muted text-foreground border-border'
                  }`}>
                    {profile.plan.name}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground mb-4">{profile.email}</p>
                
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
                    {profile.bio}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    {profile.location || 'Location not set'}
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    Last login {new Date(profile.lastLoginAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex tab-transition">
            <TabsTrigger value="profile" className="flex items-center gap-2 tab-transition">
              <UserIcon className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 tab-transition">
              <ShieldCheckIcon className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 tab-transition">
              <BellIcon className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2 tab-transition">
              <PaintBrushIcon className="w-4 h-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2 tab-transition">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="card-hover glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...profileForm.register('firstName')}
                        error={profileForm.formState.errors.firstName?.message}
                        className="input-focus"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...profileForm.register('lastName')}
                        error={profileForm.formState.errors.lastName?.message}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          {...profileForm.register('email')}
                          error={profileForm.formState.errors.email?.message}
                          className="pr-10"
                        />
                        {profile.emailVerified && (
                          <CheckCircleSolidIcon className="w-5 h-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Input
                          id="phone"
                          type="tel"
                          {...profileForm.register('phone')}
                          error={profileForm.formState.errors.phone?.message}
                          className="pr-10"
                        />
                        {profile.phoneVerified ? (
                          <CheckCircleSolidIcon className="w-5 h-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
                        ) : (
                          <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 text-xs">
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        {...profileForm.register('location')}
                        placeholder="San Francisco, CA"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        {...profileForm.register('website')}
                        placeholder="https://your-website.com"
                        error={profileForm.formState.errors.website?.message}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...profileForm.register('dateOfBirth')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={profileForm.watch('language')}
                        onValueChange={(value) => profileForm.setValue('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...profileForm.register('bio')}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      error={profileForm.formState.errors.bio?.message}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={profileForm.formState.isSubmitting}
                      className="button-press smooth-hover"
                    >
                      {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => profileForm.reset()}
                      className="button-press smooth-hover"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Password */}
              <Card className="card-hover glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyIcon className="w-5 h-5" />
                    Password
                  </CardTitle>
                  <CardDescription>
                    Change your account password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          {...securityForm.register('currentPassword')}
                          error={securityForm.formState.errors.currentPassword?.message}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="w-4 h-4" />
                          ) : (
                            <EyeIcon className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        {...securityForm.register('newPassword')}
                        error={securityForm.formState.errors.newPassword?.message}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        {...securityForm.register('confirmPassword')}
                        error={securityForm.formState.errors.confirmPassword?.message}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={securityForm.formState.isSubmitting}
                      className="w-full"
                    >
                      {securityForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication */}
              <Card className="card-hover glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DevicePhoneMobileIcon className="w-5 h-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base font-medium">Authenticator App</div>
                      <div className="text-sm text-muted-foreground">
                        Use an authenticator app to generate verification codes
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.twoFactorEnabled && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircleSolidIcon className="w-3 h-3 mr-1" />
                          Enabled
                        </Badge>
                      )}
                      <Switch
                        checked={profile.twoFactorEnabled}
                        onCheckedChange={toggleTwoFactor}
                      />
                    </div>
                  </div>
                  
                  {!profile.twoFactorEnabled && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-yellow-800">
                            Improve your security
                          </div>
                          <div className="text-sm text-yellow-700 mt-1">
                            Enable two-factor authentication to protect your account from unauthorized access.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <LockClosedIcon className="w-4 h-4 mr-2" />
                      View Recovery Codes
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
                      Configure Authenticator
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Security Activity */}
            <Card className="card-hover glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Monitor recent security events on your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {[
                      { type: 'login', location: 'San Francisco, CA', time: '2 hours ago', success: true },
                      { type: 'password_change', location: 'San Francisco, CA', time: '1 day ago', success: true },
                      { type: 'login_failed', location: 'Unknown location', time: '3 days ago', success: false },
                      { type: 'login', location: 'New York, NY', time: '1 week ago', success: true },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                        <div className={`p-2 rounded-full ${
                          activity.success ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {activity.type === 'login' ? (
                            <UserIcon className={`w-4 h-4 ${
                              activity.success ? 'text-green-600' : 'text-red-600'
                            }`} />
                          ) : (
                            <KeyIcon className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {activity.type === 'login' ? 'Account login' :
                             activity.type === 'login_failed' ? 'Failed login attempt' :
                             'Password changed'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.location} • {activity.time}
                          </div>
                        </div>
                        
                        <Badge variant={activity.success ? 'secondary' : 'destructive'}>
                          {activity.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="card-hover glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellIcon className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how and when you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    key: 'emailNotifications' as keyof NotificationSettings,
                    icon: EnvelopeIcon,
                    title: 'Email Notifications',
                    description: 'Receive notifications via email',
                  },
                  {
                    key: 'pushNotifications' as keyof NotificationSettings,
                    icon: BellIcon,
                    title: 'Push Notifications',
                    description: 'Receive push notifications in your browser',
                  },
                  {
                    key: 'smsNotifications' as keyof NotificationSettings,
                    icon: DevicePhoneMobileIcon,
                    title: 'SMS Notifications',
                    description: 'Receive important updates via SMS',
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <item.icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-base font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(checked) => updateNotifications(item.key, checked)}
                    />
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="text-base font-medium mb-4">Email Categories</div>
                  
                  {[
                    {
                      key: 'securityAlerts' as keyof NotificationSettings,
                      title: 'Security Alerts',
                      description: 'Important security notifications and alerts',
                    },
                    {
                      key: 'campaignUpdates' as keyof NotificationSettings,
                      title: 'Campaign Updates',
                      description: 'Updates about your email campaigns',
                    },
                    {
                      key: 'systemMaintenance' as keyof NotificationSettings,
                      title: 'System Maintenance',
                      description: 'Notifications about system updates and maintenance',
                    },
                    {
                      key: 'marketingEmails' as keyof NotificationSettings,
                      title: 'Marketing Emails',
                      description: 'Tips, feature updates, and product news',
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                      <Switch
                        checked={notifications[item.key]}
                        onCheckedChange={(checked) => updateNotifications(item.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="card-hover glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PaintBrushIcon className="w-5 h-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize how the interface looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-4 block">Theme</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: SunIcon },
                        { value: 'dark', label: 'Dark', icon: MoonIcon },
                        { value: 'system', label: 'System', icon: ComputerDesktopIcon },
                      ].map((themeOption) => (
                        <Button
                          key={themeOption.value}
                          variant={theme === themeOption.value ? 'default' : 'outline'}
                          className="flex flex-col gap-2 h-auto p-4 button-press smooth-hover"
                          onClick={() => setTheme(themeOption.value as typeof theme)}
                        >
                          <themeOption.icon className="w-5 h-5" />
                          <span className="text-sm">{themeOption.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="card-hover glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LanguageIcon className="w-5 h-5" />
                    Language & Region
                  </CardTitle>
                  <CardDescription>
                    Set your language and regional preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pref-language">Language</Label>
                    <Select value={profile.language}>
                      <SelectTrigger id="pref-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pref-timezone">Timezone</Label>
                    <Select value={profile.timezone}>
                      <SelectTrigger id="pref-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Account/Danger Tab */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="border-destructive card-hover glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border border-destructive/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-base font-semibold mb-2">Delete Account</div>
                        <div className="text-sm text-muted-foreground mb-4">
                          Once you delete your account, there is no going back. This will permanently delete your account, 
                          all your campaigns, contacts, and data. This action cannot be undone.
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="font-medium">This will delete:</div>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                            <li>All email campaigns and templates</li>
                            <li>Contact lists and subscriber data</li>
                            <li>Analytics and reporting data</li>
                            <li>Account settings and preferences</li>
                            <li>Billing history and subscriptions</li>
                          </ul>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="mt-4">
                              <TrashIcon className="w-4 h-4 mr-2" />
                              Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <p>
                                  This action cannot be undone. This will permanently delete your account
                                  and remove all your data from our servers.
                                </p>
                                <p className="font-medium text-destructive">
                                  Type "DELETE" to confirm:
                                </p>
                                <Input placeholder="Type DELETE here" className="mt-2" />
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={deleteAccount}
                              >
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </PageShell>
  )
}
