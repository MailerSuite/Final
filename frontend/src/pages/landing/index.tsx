import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  SparklesIcon, 
  RocketLaunchIcon, 
  CpuChipIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

const LandingPageIndex: React.FC = () => {
  const landingPages = [
    {
      title: 'AI Landing',
      description: 'Main AI platform landing page with features and pricing',
      path: '/landing/ai',
      icon: CpuChipIcon,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'AI Landing OpenAI',
      description: 'OpenAI-focused landing page with specialized features',
      path: '/landing/ai-openai',
      icon: SparklesIcon,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'SpamGPT Hero',
      description: 'SpamGPT branded hero section with animations',
      path: '/landing/spamgpt',
      icon: RocketLaunchIcon,
      color: 'from-red-500 to-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Landing Pages
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore all available landing page templates and components for the MailerSuite platform
          </p>
        </div>

        {/* Landing Pages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {landingPages.map((page, index) => (
            <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${page.color} flex items-center justify-center`}>
                  <page.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">{page.title}</CardTitle>
                <CardDescription className="text-gray-300">
                  {page.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to={page.path}>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    size="lg"
                  >
                    View Landing Page
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Back to Main */}
        <div className="text-center mt-16">
          <Link to="/">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
              ← Back to Main App
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPageIndex; 