/**
 * Forgot Password Page - SpamGPT Platform
 * Professional animated forgot password page following SpamGPT design patterns
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  ArrowLeft, 
  Home, 
  Loader2, 
  CheckCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/useToast';
import { 
  containerVariants, 
  floatingVariants, 
  pulseVariants, 
  slideUpVariants, 
  scaleVariants, 
  fadeInVariants 
} from '@/lib/animations';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoToLogin = () => {
    navigate('/auth/login');
  };

  const validateEmail = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail()) return;

    setLoading(true);

    try {
      // Call password reset endpoint
      const response = await fetch('/api/v1/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
        toast({ 
          description: 'Password reset instructions sent to your email', 
          severity: 'success' 
        });
      } else {
        // Even on error, we don't reveal if email exists (security)
        setSubmitted(true);
        toast({ 
          description: 'If the email address is registered, you will receive password reset instructions', 
          severity: 'info' 
        });
      }
    } catch (err: unknown) {
      const errorMessage = 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast({ description: errorMessage, severity: 'critical' });
    } finally {
      setLoading(false);
    }
  };

  // Success screen after submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
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
            className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/3 rounded-full blur-3xl"
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
          className="relative z-10 max-w-md mx-auto text-center"
        >
          <motion.div variants={scaleVariants}>
            <Card className="border-muted/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 space-y-6">
                {/* Success Icon */}
                <motion.div
                  variants={slideUpVariants}
                  className="space-y-4"
                >
                  <motion.div
                    variants={pulseVariants}
                    animate="animate"
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500"
                  >
                    <CheckCircle className="w-8 h-8" />
                  </motion.div>
                  
                  <h1 className="text-3xl font-bold text-foreground">
                    Check Your Email
                  </h1>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Password reset instructions have been sent to
                    <br />
                    <span className="font-semibold text-primary">{email}</span>
                  </p>
                </motion.div>

                {/* Info and Actions */}
                <motion.div variants={slideUpVariants} className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => {
                          setSubmitted(false);
                          setEmail('');
                          setError('');
                        }}
                        variant="outline"
                        className="w-full border-muted hover:bg-muted/20 gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleGoToLogin}
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Help Text */}
                <motion.div
                  variants={fadeInVariants}
                  className="pt-6 border-t border-muted/20"
                >
                  <p className="text-sm text-muted-foreground">
                    Need help?{' '}
                    <button 
                      onClick={() => navigate('/contact')}
                      className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                    >
                      Contact support
                    </button>
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            variants={fadeInVariants}
            className="mt-8 flex justify-center space-x-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary/40 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 1.5,
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
  }

  // Main forgot password form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/3 rounded-full blur-3xl"
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
        className="relative z-10 max-w-md mx-auto text-center"
      >
        {/* Floating Page Title */}
        <motion.div
          variants={slideUpVariants}
          className="mb-8"
        >
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="relative inline-block"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-primary/20 select-none mb-2">
              Reset
            </h1>
            <motion.h1
              className="absolute inset-0 text-4xl md:text-5xl font-bold text-primary"
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Reset
            </motion.h1>
          </motion.div>
        </motion.div>

        {/* Main Content Card */}
        <motion.div variants={scaleVariants}>
          <Card className="border-muted/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-6">
              {/* Icon and Title */}
              <motion.div
                variants={slideUpVariants}
                className="space-y-4"
              >
                <motion.div
                  variants={pulseVariants}
                  animate="animate"
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary"
                >
                  <Mail className="w-8 h-8" />
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">
                    Forgot Password?
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </div>
              </motion.div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  variants={slideUpVariants}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 h-12 bg-background/50 border-muted/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send reset instructions to this address
                  </p>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  variants={slideUpVariants}
                  className="space-y-4"
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending Instructions...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send Reset Instructions
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>

              {/* Navigation Links */}
              <motion.div
                variants={slideUpVariants}
                className="flex flex-col gap-3 pt-4 border-t border-muted/20"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleGoToLogin}
                    variant="outline"
                    className="w-full border-muted hover:bg-muted/20 gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleGoHome}
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Back to Home
                  </Button>
                </motion.div>
              </motion.div>

              {/* Help Text */}
              <motion.div
                variants={fadeInVariants}
                className="pt-6 border-t border-muted/20"
              >
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <button 
                    onClick={handleGoToLogin}
                    className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                  >
                    Sign in here
                  </button>
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          variants={fadeInVariants}
          className="mt-8 flex justify-center space-x-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary/40 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 1.5,
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

export default ForgotPasswordPage;