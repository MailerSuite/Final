/**
 * Temporary Suspend Page - SpamGPT Platform
 * Professional animated suspension page for fingerprint violations
 * Matches the login/signup page design with enhanced animations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Shield, 
  Fingerprint, 
  Ban, 
  Home,
  Lock,
  AlertCircle,
  Users,
  Timer,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fadeInVariants, slideUpVariants, scaleVariants } from '@/lib/animations';

const TemporarySuspendPage = () => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(7 * 24 * 60 * 60); // 7 days in seconds

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    return { days, hours, minutes, seconds: secs };
  };

  const time = formatTime(timeRemaining);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleContactSupport = () => {
    window.open('mailto:support@sgpt.com?subject=Account Suspension Appeal', '_blank');
  };

  const handleRetryLogin = () => {
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Background Elements - Orange/Red theme for suspension */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-500/3 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 w-full max-w-md mx-auto"
      >
        {/* Floating SUSPENDED Title */}
        <motion.div
          variants={slideUpVariants}
          className="text-center mb-8"
        >
          <motion.h1 
            variants={floatingVariants}
            className="text-5xl font-bold text-orange-500 mb-2 drop-shadow-lg"
          >
            SUSPENDED
          </motion.h1>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={scaleVariants}>
          <Card className="backdrop-blur-md bg-card/80 border-orange-500/20 shadow-2xl">
            <CardContent className="p-8">
              <motion.div
                variants={slideUpVariants}
                className="text-center mb-6"
              >
                <motion.div variants={pulseVariants}>
                  <Ban className="mx-auto h-16 w-16 text-orange-500 mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Account Temporarily Suspended</h2>
                <p className="text-muted-foreground">
                  Your account has been suspended due to repeated violations
                </p>
              </motion.div>

              <motion.div variants={slideUpVariants} className="space-y-6">
                {/* Countdown Timer */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Timer className="h-5 w-5 text-orange-500" />
                    <h3 className="text-sm font-semibold text-orange-500">Suspension Ends In</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-card/50 rounded-lg p-2">
                      <div className="text-2xl font-bold text-orange-500">{time.days}</div>
                      <div className="text-xs text-muted-foreground">Days</div>
                    </div>
                    <div className="bg-card/50 rounded-lg p-2">
                      <div className="text-2xl font-bold text-orange-500">{time.hours}</div>
                      <div className="text-xs text-muted-foreground">Hours</div>
                    </div>
                    <div className="bg-card/50 rounded-lg p-2">
                      <div className="text-2xl font-bold text-orange-500">{time.minutes}</div>
                      <div className="text-xs text-muted-foreground">Minutes</div>
                    </div>
                    <div className="bg-card/50 rounded-lg p-2">
                      <div className="text-2xl font-bold text-orange-500">{time.seconds}</div>
                      <div className="text-xs text-muted-foreground">Seconds</div>
                    </div>
                  </div>
                </div>

                {/* Violation Details */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Fingerprint className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-500 mb-1">Severe Fingerprint Violations</h3>
                      <p className="text-sm text-muted-foreground">
                        Your account was accessed from <span className="font-bold text-red-500">15 out of 5</span> allowed devices. 
                        This clearly indicates account sharing, which violates our Terms of Service.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Suspension Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border dark:border-border/50">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Suspension Type</span>
                    </div>
                    <span className="text-sm font-bold text-orange-500">Temporary</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-orange-500/20">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-500">Duration</span>
                    </div>
                    <span className="text-sm font-bold text-orange-500">7 Days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-red-500/20">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-500">Violation Count</span>
                    </div>
                    <span className="text-sm font-bold text-red-500">10</span>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-500 mb-2">🚨 Final Warning</h4>
                  <p className="text-sm text-muted-foreground">
                    This is a temporary suspension. If account sharing continues after the suspension ends, 
                    your account will be <strong className="text-red-500">permanently banned</strong> without further notice.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleContactSupport}
                    variant="outline"
                    className="w-full border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={handleRetryLogin}
                      className="flex-1"
                      disabled
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Login (Disabled)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleGoHome}
                      className="flex-1"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Button>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Features */}
        <motion.div 
          variants={slideUpVariants}
          className="mt-8 flex justify-center space-x-8"
        >
          <motion.div variants={fadeInVariants} className="text-center">
            <Shield className="mx-auto h-8 w-8 text-primary/60 mb-2" />
            <p className="text-xs text-muted-foreground">Fair Use Policy</p>
            <p className="text-xs text-muted-foreground">Protecting our platform</p>
          </motion.div>
          <motion.div variants={fadeInVariants} className="text-center">
            <Timer className="mx-auto h-8 w-8 text-primary/60 mb-2" />
            <p className="text-xs text-muted-foreground">Temporary Block</p>
            <p className="text-xs text-muted-foreground">Account recovery</p>
          </motion.div>
          <motion.div variants={fadeInVariants} className="text-center">
            <RefreshCw className="mx-auto h-8 w-8 text-primary/60 mb-2" />
            <p className="text-xs text-muted-foreground">Second Chance</p>
            <p className="text-xs text-muted-foreground">Learn from mistakes</p>
          </motion.div>
        </motion.div>

        {/* Decorative Dots */}
        <motion.div variants={fadeInVariants} className="flex justify-center space-x-2 mt-8">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-orange-500/30 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TemporarySuspendPage;