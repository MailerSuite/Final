import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  RocketLaunchIcon, 
  EnvelopeIcon, 
  ChartBarIcon, 
  CogIcon,
  SparklesIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const WelcomePage: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to MailerSuite2',
      description: 'Your AI-powered email marketing platform',
      icon: RocketLaunchIcon,
      content: (
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-24 h-24 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center"
          >
            <SparklesIcon className="w-12 h-12 text-white" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Welcome to MailerSuite2
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              The future of email marketing is here
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="flex items-center space-x-2 text-sm">
              <EnvelopeIcon className="w-5 h-5 text-primary" />
              <span>AI-Powered Campaigns</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <ChartBarIcon className="w-5 h-5 text-primary" />
              <span>Real-time Analytics</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <UserGroupIcon className="w-5 h-5 text-primary" />
              <span>Smart Segmentation</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CogIcon className="w-5 h-5 text-primary" />
              <span>Advanced Automation</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'setup',
      title: 'Quick Setup',
      description: 'Let\'s get your account configured',
      icon: CogIcon,
      content: (
        <div className="space-y-6">
          <div className="grid gap-4">
            <Card className="border-2 border-dashed border-muted hover:border-primary transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Connect Email Provider</CardTitle>
                  </div>
                  <Badge variant="secondary">Optional</Badge>
                </div>
                <CardDescription>
                  Connect your SMTP provider for sending campaigns
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 border-dashed border-muted hover:border-primary transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Import Contacts</CardTitle>
                  </div>
                  <Badge variant="secondary">Optional</Badge>
                </div>
                <CardDescription>
                  Upload your existing contact lists
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 border-dashed border-muted hover:border-primary transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <SparklesIcon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Create First Campaign</CardTitle>
                  </div>
                  <Badge variant="outline">Recommended</Badge>
                </div>
                <CardDescription>
                  Launch your first AI-powered email campaign
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Ready to start your email marketing journey',
      icon: RocketLaunchIcon,
      content: (
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
          >
            <RocketLaunchIcon className="w-12 h-12 text-white" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold">You're Ready to Launch!</h2>
            <p className="text-muted-foreground mt-2">
              Everything is set up and ready for your first campaign
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">Quick Actions:</h3>
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="justify-start" 
                onClick={() => navigate('/campaigns/create')}
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => navigate('/templates')}
              >
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Browse Email Templates
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => navigate('/contacts')}
              >
                <UserGroupIcon className="w-4 h-4 mr-2" />
                Manage Contacts
              </Button>
            </div>
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate('/dashboard')
    }
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip Setup
              </Button>
            </div>
            <Progress value={progress} className="w-full h-2" />
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <currentStepData.icon className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">{currentStepData.title}</h1>
              </div>
              <p className="text-muted-foreground">{currentStepData.description}</p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="min-h-[300px] flex items-center justify-center"
            >
              {currentStepData.content}
            </motion.div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button onClick={handleNext} className="ml-auto">
                {currentStep === steps.length - 1 ? (
                  <>
                    Go to Dashboard
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default WelcomePage