/**
 * Permanent Ban Page - SGPT Platform
 * Professional animated ban page for severe fingerprint violations
 * Matches the login/signup page design with enhanced animations
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  X, 
  Shield, 
  Fingerprint, 
  Skull, 
  Home,
  Lock,
  AlertTriangle,
  Users,
  Gavel,
  ExternalLink,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PermanentBanPage = () => {
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

  const slideUpVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const scaleVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const fadeInVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.6 } },
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

  const shakeVariants = {
    animate: {
      x: [0, -2, 2, -2, 2, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 3,
        ease: "easeInOut"
      }
    }
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleContactSupport = () => {
    window.open('mailto:legal@sgpt.com?subject=Account Ban Appeal', '_blank');
  };

  const handleViewTerms = () => {
    window.open('/terms-of-service', '_blank');
  };

  const handleCreateNewAccount = () => {
    navigate('/auth/sign-up', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Background Elements - Dark red theme for permanent ban */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/5 rounded-full blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-900/3 rounded-full blur-3xl"
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
        {/* Floating BANNED Title */}
        <motion.div
          variants={slideUpVariants}
          className="text-center mb-8"
        >
          <motion.h1 
            variants={floatingVariants}
            className="text-6xl font-bold text-red-600 mb-2 drop-shadow-lg"
          >
            BANNED
          </motion.h1>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={scaleVariants}>
          <Card className="backdrop-blur-md bg-card/80 border-red-600/20 shadow-2xl">
            <CardContent className="p-8">
              <motion.div
                variants={slideUpVariants}
                className="text-center mb-6"
              >
                <motion.div variants={shakeVariants}>
                  <Skull className="mx-auto h-16 w-16 text-red-600 mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Account Permanently Banned</h2>
                <p className="text-muted-foreground">
                  Your account has been permanently banned due to severe violations
                </p>
              </motion.div>

              <motion.div variants={slideUpVariants} className="space-y-6">
                {/* Ban Reason */}
                <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Fingerprint className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-600 mb-1">Extreme Fingerprint Violations</h3>
                      <p className="text-sm text-muted-foreground">
                        Your account was accessed from <span className="font-bold text-red-600">25+ out of 5</span> allowed devices 
                        after multiple warnings and a temporary suspension. This constitutes blatant account sharing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ban Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-red-600/20">
                    <div className="flex items-center space-x-2">
                      <Gavel className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">Ban Type</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">PERMANENT</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-red-600/20">
                    <div className="flex items-center space-x-2">
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">Status</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">IRREVOCABLE</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-red-600/20">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">Total Violations</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">25+</span>
                  </div>
                </div>

                {/* Violation History */}
                <div className="bg-muted/10 border border-border/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">📋 Violation History</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Initial Warning</span>
                      <span className="text-yellow-500">Ignored</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">7-Day Suspension</span>
                      <span className="text-orange-500">Ignored</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Final Warning</span>
                      <span className="text-red-500">Violated</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Status</span>
                      <span className="text-red-600 font-bold">BANNED</span>
                    </div>
                  </div>
                </div>

                {/* Final Notice */}
                <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-600 mb-2">⚠️ FINAL NOTICE</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    This account has been <strong className="text-red-600">permanently banned</strong> and cannot be recovered. 
                    All associated data will be retained per our legal obligations but access is permanently revoked.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ban issued under Section 4.2 of our Terms of Service for repeated account sharing violations.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleContactSupport}
                    variant="outline"
                    className="w-full border-red-600/50 text-red-600 hover:bg-red-600/10"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Appeal Ban (Legal Team)
                  </Button>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={handleViewTerms}
                      className="flex-1"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Terms
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

                  <Button 
                    onClick={handleCreateNewAccount}
                    className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Create New Account
                  </Button>
                </div>

                {/* Legal Notice */}
                <div className="bg-card/30 border border-border/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground text-center">
                    This ban is final and binding under our Terms of Service. 
                    Legal appeals may be submitted to our legal department within 30 days.
                  </p>
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
            <p className="text-xs text-muted-foreground">Platform Security</p>
            <p className="text-xs text-muted-foreground">Zero tolerance</p>
          </motion.div>
          <motion.div variants={fadeInVariants} className="text-center">
            <Gavel className="mx-auto h-8 w-8 text-primary/60 mb-2" />
            <p className="text-xs text-muted-foreground">Fair Enforcement</p>
            <p className="text-xs text-muted-foreground">Due process</p>
          </motion.div>
          <motion.div variants={fadeInVariants} className="text-center">
            <Lock className="mx-auto h-8 w-8 text-primary/60 mb-2" />
            <p className="text-xs text-muted-foreground">Terms Protection</p>
            <p className="text-xs text-muted-foreground">Legal compliance</p>
          </motion.div>
        </motion.div>

        {/* Decorative Dots - Red theme */}
        <motion.div variants={fadeInVariants} className="flex justify-center space-x-2 mt-8">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-red-600/30 rounded-full"
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

export default PermanentBanPage;