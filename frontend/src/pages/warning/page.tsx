/**
 * Warning Page - SGPT Platform
 * Professional animated warning page for fingerprint violations
 * Matches the login/signup page design with enhanced animations
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  Fingerprint,
  ArrowRight,
  Home,
  Lock,
  Eye,
  Users,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const WarningPage = () => {
  const navigate = useNavigate();

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

  // Define missing animation variants
  const slideUpVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const scaleVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const fadeInVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleContinue = () => {
    navigate('/client/dashboard', { replace: true });
  };

  const handleLogout = () => {
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Background Elements - Same as login page */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-orange-500/3 rounded-full blur-3xl"
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
        {/* Floating SGPT Title */}
        <motion.div
          variants={slideUpVariants}
          className="text-center mb-8"
        >
          <motion.h1
            variants={floatingVariants}
            className="text-6xl font-bold text-yellow-500 mb-2 drop-shadow-lg"
          >
            WARNING
          </motion.h1>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={scaleVariants}>
          <Card className="backdrop-blur-md bg-card/80 border-yellow-500/20 shadow-2xl">
            <CardContent className="p-8">
              <motion.div
                variants={slideUpVariants}
                className="text-center mb-6"
              >
                <motion.div variants={pulseVariants}>
                  <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Account Access Warning</h2>
                <p className="text-muted-foreground">
                  We've detected unusual activity on your account
                </p>
              </motion.div>

              <motion.div variants={slideUpVariants} className="space-y-6">
                {/* Warning Details */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Fingerprint className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-500 mb-1">Device Fingerprint Violation</h3>
                      <p className="text-sm text-muted-foreground">
                        Your account has been accessed from <span className="font-bold text-yellow-500">8 out of 5</span> allowed devices.
                        This suggests potential account sharing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Violation Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border dark:border-border/50">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Allowed Devices</span>
                    </div>
                    <span className="text-sm font-bold text-blue-500">5</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-500">Detected Devices</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-500">8</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-red-500/20">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-500">Violations</span>
                    </div>
                    <span className="text-sm font-bold text-red-500">3</span>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-500 mb-2">⚠️ Account Security Notice</h4>
                  <p className="text-sm text-muted-foreground">
                    Account sharing violates our Terms of Service. If this continues, your account may be
                    temporarily suspended or permanently banned. Please ensure you're the only one using your account.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleContinue}
                    className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    I Understand, Continue
                  </Button>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="flex-1"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Logout
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
            <p className="text-xs text-muted-foreground">Secure Platform</p>
            <p className="text-xs text-muted-foreground">Bank-level security</p>
          </motion.div>
          <motion.div variants={fadeInVariants} className="text-center">
            <Fingerprint className="mx-auto h-8 w-8 text-primary/60 mb-2" />
            <p className="text-xs text-muted-foreground">Device Tracking</p>
            <p className="text-xs text-muted-foreground">Advanced detection</p>
          </motion.div>
          <motion.div variants={fadeInVariants} className="text-center">
            <Eye className="mx-auto h-8 w-8 text-primary/60 mb-2" />
            <p className="text-xs text-muted-foreground">24/7 Monitoring</p>
            <p className="text-xs text-muted-foreground">Real-time alerts</p>
          </motion.div>
        </motion.div>

        {/* Decorative Dots */}
        <motion.div variants={fadeInVariants} className="flex justify-center space-x-2 mt-8">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary/30 rounded-full"
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

export default WarningPage;