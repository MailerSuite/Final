/**
 * Login Page - SpamGPT Platform
 * Professional animated login page with sophisticated effects
 * Matches the 404 page design with enhanced animations
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Zap,
  Home,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import Shell from '@/components/layouts/Shell';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import StandardPageWrapper from '@/components/layout/StandardPageWrapper';

// Simple animation variants
const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
};

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      let fingerprint = "no-fingerprint";
      try {
        fingerprint = 'browser-fingerprint';
      } catch (fpError) {
        console.warn("Fingerprint collection disabled or failed:", fpError);
      }

      console.log('🔐 Attempting login with:', { email, hasPassword: !!password, fingerprint });

      const response = await login({
        email,
        password,
        fingerprint,
      });

      console.log('✅ Login response:', response);

      // Check if 2FA is required
      if (response?.requires_2fa) {
        toast.info('2FA verification required. Check your email.');
        navigate('/auth/verify-2fa', {
          state: {
            userId: response.user_id,
            email: email,
            message: response.message
          }
        });
        return;
      }

      // FIXED: Redirect based on user role with improved timing
      const user = response.user;
      const isAdmin = user?.is_admin === true;  // Simplified admin check
      const redirectPath = isAdmin ? '/admin' : '/client/dashboard';

      console.log('🚀 Login success - redirecting to:', {
        user: { id: user?.id, email: user?.email, is_admin: user?.is_admin },
        isAdmin,
        redirectPath
      });

      toast.success(`Login successful! ${isAdmin ? 'Welcome to Admin Panel' : 'Welcome back!'}`);

      // ENHANCED: Wait for auth store to be fully updated, then navigate
      setTimeout(() => {
        console.log('🔄 Attempting navigation to:', redirectPath);
        navigate(redirectPath, { replace: true });

        // Fallback check after navigation
        setTimeout(() => {
          if (window.location.pathname === '/auth/login') {
            console.log('🔧 Fallback: Still on login page, forcing redirect...');
            window.location.href = redirectPath;
          }
        }, 1000);
      }, 500); // Increased delay to ensure auth store is updated
    } catch (err: unknown) {
      const errorMessage = err?.response?.data?.detail || 'Invalid email or password';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoToSignup = () => {
    navigate('/auth/sign-up');
  };

  const handleForgotPassword = () => {
    navigate('/auth/forgot');
  };



  const breadcrumbs = useBreadcrumbs("/")

  return (
    <Shell title="Login" breadcrumbs={breadcrumbs}>
      <StandardPageWrapper
        title="Login"
        subtitle="Access your SpamGPT account"
        className="relative flex items-center justify-center p-4 overflow-hidden"
      >
        {/* Enhanced Background Elements with additional orbs */}
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
          {/* Additional floating elements for enhanced visual depth */}
          <motion.div
            className="absolute top-1/2 right-1/3 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl"
            animate={{
              x: [0, 20, 0],
              y: [0, -15, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-blue-500/8 rounded-full blur-xl"
            animate={{
              x: [0, -15, 0],
              y: [0, 10, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="relative z-10 w-full max-w-md mx-auto text-center"
        >
          {/* Main Login Display with floating login icon */}
          <motion.div
            variants={slideUpVariants}
            className="mb-8"
          >
            <motion.div
              variants={floatingVariants}
              animate="animate"
              className="relative inline-block"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary/20 select-none">
                LOGIN
              </div>
              <motion.div
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
                LOGIN
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Main Content Card - Enhanced glassmorphism */}
          <motion.div variants={scaleVariants}>
            <Card className="border-muted/20 bg-card/40 backdrop-blur-xl shadow-2xl shadow-primary/5">
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
                    <Shield className="w-8 h-8" />
                  </motion.div>

                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Welcome Back!
                  </h1>

                  <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Sign in to access your SpamGPT platform dashboard and continue your email marketing journey.
                  </p>
                </motion.div>

                {/* Login Form */}
                <motion.div variants={slideUpVariants} className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Field */}
                    <div className="space-y-2 text-left">
                      <Label htmlFor="email" className="text-foreground">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                          }}
                          className="pl-10 bg-background/80 border-muted hover:border-primary/50 focus:border-primary transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2 text-left">
                      <Label htmlFor="password" className="text-foreground">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                          }}
                          className="pl-10 pr-10 bg-background/80 border-muted hover:border-primary/50 focus:border-primary transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="w-4 h-4 rounded border-muted text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <span className="text-sm text-foreground">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 gap-2 font-medium"
                        size="lg"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            Sign In
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>

                {/* Suggestion Cards - Compact version */}
                <motion.div
                  variants={slideUpVariants}
                  className="grid grid-cols-3 gap-3 my-6"
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-3 rounded-lg border border-muted/20 bg-muted/5 hover:bg-muted/10 transition-colors text-center"
                  >
                    <CheckCircle className="w-5 h-5 text-primary mb-1 mx-auto" />
                    <h3 className="font-semibold text-xs text-foreground">Secure</h3>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-3 rounded-lg border border-muted/20 bg-muted/5 hover:bg-muted/10 transition-colors text-center"
                  >
                    <Zap className="w-5 h-5 text-primary mb-1 mx-auto" />
                    <h3 className="font-semibold text-xs text-foreground">Fast</h3>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-3 rounded-lg border border-muted/20 bg-muted/5 hover:bg-muted/10 transition-colors text-center"
                  >
                    <Mail className="w-5 h-5 text-primary mb-1 mx-auto" />
                    <h3 className="font-semibold text-xs text-foreground">Reliable</h3>
                  </motion.div>
                </motion.div>

                {/* Action Buttons - Same as 404 page */}
                <motion.div
                  variants={slideUpVariants}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleGoHome}
                      variant="outline"
                      className="border-muted hover:bg-muted/20 px-6 py-3 gap-2"
                    >
                      <Home className="w-4 h-4" />
                      Go to Home
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleGoToSignup}
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground px-6 py-3 gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Create Account
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Help Text */}
                <motion.div
                  variants={fadeInVariants}
                  className="pt-6 border-t border-muted/20"
                >
                  <p className="text-sm text-muted-foreground">
                    Need help signing in? Check your credentials or{' '}
                    <button
                      onClick={() => navigate('/contact')}
                      className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                    >
                      contact our support team
                    </button>
                    {' '}for assistance.
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Decorative Elements - Same as 404 page */}
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
      </StandardPageWrapper>
    </Shell>
  );
};

export default Login;