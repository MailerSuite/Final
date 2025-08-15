import React, { useState } from 'react'
import {
  AcademicCapIcon,
  LockClosedIcon,
  LockOpenIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  BookOpenIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  EnvelopeIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  StarIcon,
  BoltIcon,
  BeakerIcon,
  CommandLineIcon,
  GlobeAltIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import StandardPageWrapper from '@/components/layout/StandardPageWrapper'

interface Module {
  id: string
  title: string
  description: string
  duration: string
  lessons: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  isPremium: boolean
  isCompleted?: boolean
  progress?: number
  icon: React.ComponentType<unknown>
  topics: string[]
}

const modules: Module[] = [
  {
    id: 'intro',
    title: 'Introduction to Email Marketing',
    description: 'Master the fundamentals of professional email marketing and deliverability',
    duration: '2 hours',
    lessons: 8,
    difficulty: 'Beginner',
    isPremium: false,
    progress: 100,
    isCompleted: true,
    icon: BookOpenIcon,
    topics: [
      'Email marketing basics',
      'Understanding deliverability',
      'Sender reputation fundamentals',
      'Email authentication (SPF, DKIM, DMARC)'
    ]
  },
  {
    id: 'inbox-mastery',
    title: 'Inbox Mastery & Deliverability',
    description: 'Learn advanced techniques to ensure your emails reach the inbox every time',
    duration: '6 hours',
    lessons: 24,
    difficulty: 'Advanced',
    isPremium: true,
    progress: 0,
    icon: EnvelopeIcon,
    topics: [
      'Inbox placement strategies',
      'Avoiding spam filters',
      'Content optimization',
      'ISP relationship management',
      'Warming up IPs and domains',
      'Reputation monitoring'
    ]
  },
  {
    id: 'smtp-setup',
    title: 'SMTP Server Setup & Management',
    description: 'Build and manage your own SMTP infrastructure for maximum control',
    duration: '8 hours',
    lessons: 32,
    difficulty: 'Expert',
    isPremium: true,
    progress: 0,
    icon: ServerStackIcon,
    topics: [
      'Setting up SMTP servers',
      'Server configuration best practices',
      'IP rotation strategies',
      'Load balancing',
      'Backup and failover systems',
      'Security hardening'
    ]
  },
  {
    id: 'lead-generation',
    title: 'Finding & Building Quality Lead Bases',
    description: 'Discover proven methods to find and verify high-quality leads',
    duration: '5 hours',
    lessons: 20,
    difficulty: 'Intermediate',
    isPremium: true,
    progress: 0,
    icon: UserGroupIcon,
    topics: [
      'Lead generation techniques',
      'Data enrichment strategies',
      'Email verification methods',
      'List segmentation',
      'GDPR compliance',
      'Quality vs quantity approach'
    ]
  },
  {
    id: 'tools-mastery',
    title: 'Platform Tools Mastery',
    description: 'Master every tool in SpamGPT.io for maximum efficiency',
    duration: '4 hours',
    lessons: 16,
    difficulty: 'Intermediate',
    isPremium: false,
    progress: 45,
    icon: BeakerIcon,
    topics: [
      'Campaign builder advanced features',
      'Template optimization',
      'A/B testing strategies',
      'Analytics interpretation',
      'Automation workflows',
      'API integration'
    ]
  },
  {
    id: 'ai-optimization',
    title: 'AI-Powered Campaign Optimization',
    description: 'Leverage AI to create high-converting campaigns at scale',
    duration: '7 hours',
    lessons: 28,
    difficulty: 'Advanced',
    isPremium: true,
    progress: 0,
    icon: CpuChipIcon,
    topics: [
      'AI content generation',
      'Personalization at scale',
      'Predictive analytics',
      'Smart segmentation',
      'Automated optimization',
      'Performance prediction'
    ]
  },
  {
    id: 'scaling',
    title: 'Scaling to Millions',
    description: 'Enterprise-level strategies for massive email campaigns',
    duration: '10 hours',
    lessons: 40,
    difficulty: 'Expert',
    isPremium: true,
    progress: 0,
    icon: RocketLaunchIcon,
    topics: [
      'Infrastructure scaling',
      'Multi-server orchestration',
      'Global IP management',
      'Compliance at scale',
      'Team collaboration',
      'Enterprise automation'
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting & Recovery',
    description: 'Fix deliverability issues and recover from blacklists',
    duration: '3 hours',
    lessons: 12,
    difficulty: 'Intermediate',
    isPremium: true,
    progress: 0,
    icon: ShieldCheckIcon,
    topics: [
      'Blacklist removal',
      'Reputation recovery',
      'Debugging delivery issues',
      'ISP feedback loops',
      'Complaint handling',
      'Crisis management'
    ]
  }
]

const SpamTutorPage: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isPlaying, setIsPlaying] = useState(false)

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons, 0)
  const completedLessons = modules.reduce((acc, m) => acc + (m.progress || 0) * m.lessons / 100, 0)
  const overallProgress = (completedLessons / totalLessons) * 100

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-emerald-400 border-emerald-500/50'
      case 'Intermediate': return 'text-sky-400 border-sky-500/50'
      case 'Advanced': return 'text-amber-400 border-amber-500/50'
      case 'Expert': return 'text-red-400 border-red-500/50'
      default: return 'text-muted-foreground border-border/50'
    }
  }

  const handleModuleClick = (module: Module) => {
    if (module.isPremium && module.progress === 0) {
      setShowPurchaseDialog(true)
    } else {
      setSelectedModule(module)
    }
  }

  return (
    <StandardPageWrapper
      title="SpamGPT.io AI Tutor"
      subtitle="Master email marketing with our comprehensive AI-powered training program"
      className="min-h-screen"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border bg-background/50">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-300/10 via-indigo-300/10 to-purple-400/10 animate-gradient-x" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
        </div>

        <div className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
                    <AcademicCapIcon className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1">
                    AI-POWERED LEARNING
                  </Badge>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-400 mb-4">
                  SpamGPT.io AI Tutor
                </h1>

                <p className="text-xl text-muted-foreground mb-6 max-w-3xl">
                  Master email marketing with our comprehensive AI-powered training program.
                  Learn how to inbox, setup SMTP servers, find quality leads, and scale to millions.
                </p>

                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-sky-400" />
                    <span className="text-muted-foreground">50+ Hours of Content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpenIcon className="w-5 h-5 text-indigo-400" />
                    <span className="text-muted-foreground">{totalLessons} Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrophyIcon className="w-5 h-5 text-amber-400" />
                    <span className="text-muted-foreground">Certificate on Completion</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600"
                    onClick={() => setShowPurchaseDialog(true)}
                  >
                    <LockOpenIcon className="w-5 h-5 mr-2" />
                    Unlock Full Course
                  </Button>

                  <div className="text-center">
                    <div className="text-3xl font-black text-white">$2,000</div>
                    <div className="text-xs text-muted-foreground">Lifetime Access</div>
                  </div>

                  <Badge variant="outline" className="px-3 py-1 border-emerald-500/50 text-emerald-400">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    30-Day Money Back
                  </Badge>
                </div>
              </div>

              {/* Progress Card */}
              <Card className="w-80 glass-card border-border hidden lg:block">
                <CardHeader>
                  <CardTitle className="text-white">Your Progress</CardTitle>
                  <CardDescription>Track your learning journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Overall Completion</span>
                      <span className="text-sm font-bold text-white">{Math.round(overallProgress)}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Modules Completed</span>
                      <span className="text-white">2 / {modules.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lessons Watched</span>
                      <span className="text-white">{Math.round(completedLessons)} / {totalLessons}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Time Invested</span>
                      <span className="text-white">6.5 hours</span>
                    </div>
                  </div>

                  <Separator className="bg-muted" />

                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className={cn(
                          "w-5 h-5",
                          i < 4 ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
                        )} />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">4.9 (2,847 reviews)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Full Curriculum</TabsTrigger>
            <TabsTrigger value="demo">Free Demo</TabsTrigger>
            <TabsTrigger value="testimonials">Success Stories</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* What You'll Learn */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl text-white">What You'll Master</CardTitle>
                <CardDescription>Comprehensive email marketing expertise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { icon: EnvelopeIcon, title: 'Inbox Placement', desc: 'Achieve 99% inbox rates consistently' },
                    { icon: ServerStackIcon, title: 'SMTP Infrastructure', desc: 'Build enterprise-grade email systems' },
                    { icon: UserGroupIcon, title: 'Lead Generation', desc: 'Find and verify millions of leads' },
                    { icon: ChartBarIcon, title: 'Analytics Mastery', desc: 'Data-driven optimization strategies' },
                    { icon: ShieldCheckIcon, title: 'Deliverability', desc: 'Maintain pristine sender reputation' },
                    { icon: RocketLaunchIcon, title: 'Scale Operations', desc: 'Handle millions of emails daily' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 h-fit">
                        <item.icon className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Course Modules */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Course Modules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((module) => (
                  <Card
                    key={module.id}
                    className={cn(
                      "glass-card border-border cursor-pointer transition-all hover:scale-[1.02]",
                      module.isPremium && module.progress === 0 && "opacity-75"
                    )}
                    onClick={() => handleModuleClick(module)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            module.isPremium && module.progress === 0
                              ? "bg-card"
                              : "bg-gradient-to-br from-sky-500/20 to-indigo-500/20"
                          )}>
                            <module.icon className={cn(
                              "w-5 h-5",
                              module.isPremium && module.progress === 0
                                ? "text-muted-foreground"
                                : "text-sky-400"
                            )} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg text-white">{module.title}</CardTitle>
                              {module.isPremium && module.progress === 0 && (
                                <LockClosedIcon className="w-4 h-4 text-amber-400" />
                              )}
                            </div>
                            <CardDescription>{module.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
                          {module.difficulty}
                        </Badge>
                        <span className="text-muted-foreground">{module.duration}</span>
                        <span className="text-muted-foreground">{module.lessons} lessons</span>
                      </div>

                      {module.progress !== undefined && module.progress > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <span className="text-xs text-white">{module.progress}%</span>
                          </div>
                          <Progress value={module.progress} className="h-1" />
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {module.topics.slice(0, 3).map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-border">
                            {topic}
                          </Badge>
                        ))}
                        {module.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs border-border">
                            +{module.topics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            {/* Demo Video Section */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Free Demo: Introduction to Email Marketing</CardTitle>
                <CardDescription>Experience our teaching methodology with this free module</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Video Player */}
                <div className="relative aspect-video bg-background rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {!isPlaying ? (
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-sky-500 to-indigo-500"
                        onClick={() => setIsPlaying(true)}
                      >
                        <PlayIcon className="w-6 h-6 mr-2" />
                        Start Demo Lesson
                      </Button>
                    ) : (
                      <div className="text-center">
                        <VideoCameraIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Video player would be here</p>
                      </div>
                    )}
                  </div>

                  {/* Video overlay with stats */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                          LIVE
                        </Badge>
                        <span className="text-sm text-white">2,847 students watching</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Duration: 15:32</span>
                    </div>
                  </div>
                </div>

                {/* Demo Topics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Understanding email deliverability basics',
                    'Setting up your first campaign',
                    'Email authentication explained',
                    'Avoiding common spam triggers',
                    'Building sender reputation',
                    'Introduction to our platform tools'
                  ].map((topic, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                      <span className="text-muted-foreground">{topic}</span>
                    </div>
                  ))}
                </div>

                {/* Interactive Demo */}
                <Alert className="border-sky-500/50 bg-sky-500/10">
                  <SparklesIcon className="w-5 h-5 text-sky-400" />
                  <AlertTitle className="text-white">Try Our AI Assistant</AlertTitle>
                  <AlertDescription className="text-muted-foreground">
                    Ask any email marketing question and get instant AI-powered answers
                  </AlertDescription>
                  <div className="mt-3">
                    <Button variant="outline" className="bg-card/50 border-border">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                      Start Chat Demo
                    </Button>
                  </div>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  name: 'Alex Thompson',
                  role: 'Marketing Director',
                  company: 'TechCorp',
                  message: 'This course transformed our email marketing. We went from 20% to 95% inbox rate!',
                  revenue: '+$2.4M revenue',
                  rating: 5
                },
                {
                  name: 'Sarah Chen',
                  role: 'Growth Hacker',
                  company: 'StartupXYZ',
                  message: 'The SMTP setup module alone saved us $50k/year in third-party costs.',
                  revenue: '10x ROI',
                  rating: 5
                },
                {
                  name: 'Marcus Johnson',
                  role: 'Email Specialist',
                  company: 'Agency Pro',
                  message: 'Best investment ever. Now handling 5M+ emails daily with 99% deliverability.',
                  revenue: '+500% growth',
                  rating: 5
                },
                {
                  name: 'Emma Williams',
                  role: 'Founder',
                  company: 'EmailExperts',
                  message: 'The AI optimization techniques are game-changing. Doubled our conversion rates!',
                  revenue: '+$850k MRR',
                  rating: 5
                }
              ].map((testimonial, i) => (
                <Card key={i} className="glass-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-white">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                        {testimonial.revenue}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground mb-4">"{testimonial.message}"</p>

                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {modules.map((module) => (
                  <Card key={module.id} className="glass-card border-border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <module.icon className="w-6 h-6 text-sky-400" />
                          <div>
                            <CardTitle className="text-white">{module.title}</CardTitle>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant="outline" className={getDifficultyColor(module.difficulty)}>
                                {module.difficulty}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{module.duration} • {module.lessons} lessons</span>
                            </div>
                          </div>
                        </div>
                        {module.isPremium && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                            PREMIUM
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{module.description}</p>
                      <div className="space-y-2">
                        {module.topics.map((topic, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                            <span className="text-muted-foreground">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            {[
              {
                q: 'What makes this course worth $2,000?',
                a: 'This comprehensive program provides enterprise-level knowledge that typically costs businesses tens of thousands in consultancy fees. You\'ll learn strategies that can generate millions in revenue.'
              },
              {
                q: 'How long do I have access to the course?',
                a: 'Lifetime access! Once purchased, you can access all content forever, including future updates and new modules we add.'
              },
              {
                q: 'Is there a money-back guarantee?',
                a: 'Yes! We offer a 30-day money-back guarantee. If you\'re not satisfied, get a full refund, no questions asked.'
              },
              {
                q: 'Can I get a certificate?',
                a: 'Yes, upon completing all modules, you\'ll receive a SpamGPT.io Expert Certification, recognized in the industry.'
              },
              {
                q: 'Do I need technical knowledge?',
                a: 'We start from basics and progressively build up. Some modules require technical knowledge, but we teach everything you need.'
              }
            ].map((faq, i) => (
              <Card key={i} className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="bg-background border-border text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Unlock SpamGPT.io AI Tutor</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Get lifetime access to all premium modules and future updates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Pricing */}
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-300">
                $2,000
              </div>
              <p className="text-muted-foreground mt-2">One-time payment • Lifetime access</p>
            </div>

            {/* What's Included */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white">Everything Included:</h3>
              {[
                '50+ hours of premium video content',
                'Access to all 8 comprehensive modules',
                'Private Discord community access',
                '1-on-1 consultation calls (3 sessions)',
                'Custom SMTP setup assistance',
                'Priority support & updates',
                'Industry-recognized certification',
                '30-day money-back guarantee'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>

            {/* Payment Options */}
            <div className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600">
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                Purchase Now - $2,000
              </Button>

              <Button variant="outline" className="w-full bg-card/50 border-border">
                <ClockIcon className="w-5 h-5 mr-2" />
                Start 3-Month Payment Plan ($700/mo)
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-border">
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                <ShieldCheckIcon className="w-4 h-4 mr-1" />
                Secure Payment
              </Badge>
              <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                <TrophyIcon className="w-4 h-4 mr-1" />
                2,847+ Students
              </Badge>
              <Badge variant="outline" className="border-sky-500/50 text-sky-400">
                <StarIcon className="w-4 h-4 mr-1" />
                4.9 Rating
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </StandardPageWrapper>
  )
}

export default SpamTutorPage