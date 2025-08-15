/**
 * Sign Up Page - SpamGPT Platform
 * Professional animated registration page with sophisticated effects
 * Matches the login page design with enhanced animations
 */

import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  User,
  CheckCircle,
  UserPlus
} from "lucide-react";
import { toast } from "@/hooks/useToast";
import { register } from "@/api/auth";
import { useAuthStore } from "@/store/auth";
import { getFingerprint } from "@/lib/fingerprint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { fadeInVariants, slideUpVariants, scaleVariants } from '@/lib/animations';

const SignUp = () => {
  const setTokens = useAuthStore((s) => s.setTokens);
  const getMe = useAuthStore((s) => s.getMe);
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isShowConfirmPassword, setIsShowConfirmPassword] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    enable2FA: false,
  });

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

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoToLogin = () => {
    navigate('/auth/login');
  };

  const handleForgotPassword = () => {
    navigate('/auth/forgot');
  };

  const getPasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[\W_]/.test(password),
    };
    
    const score = Object.values(requirements).filter(Boolean).length;
    return { requirements, score };
  };

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const { score } = getPasswordStrength(formData.password);

    if (!formData.name.trim()) {
      setError("Please enter your name");
      toast({ description: "Please enter your name", severity: "warning" });
      return false;
    }

    if (!formData.email || !emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      toast({ description: "Please enter a valid email address", severity: "warning" });
      return false;
    }

    if (!formData.password) {
      setError("Please enter your password");
      toast({ description: "Please enter your password", severity: "warning" });
      return false;
    }

    if (score < 3) {
      setError("Password must include at least uppercase, lowercase, number, and be 8+ characters");
      toast({ 
        description: "Password must include at least uppercase, lowercase, number, and be 8+ characters", 
        severity: "warning" 
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      toast({ description: "Passwords do not match", severity: "warning" });
      return false;
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions");
      toast({ description: "Please agree to the terms and conditions", severity: "warning" });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validate()) return;

    setisLoading(true);
    try {
      // Get fingerprint but don't fail if it's not available
      let fingerprint = "no-fingerprint";
      try {
        fingerprint = await getFingerprint();
      } catch (fpError) {
        console.warn("Fingerprint collection disabled or failed:", fpError);
      }
      
      const { name, email, password, enable2FA } = formData;
      
      const response = await register({
        email: email.trim().toLowerCase(),
        password,
        fingerprint,
      });
      
      // Check if 2FA setup is required
      if (response?.requires_2fa_setup) {
        toast({ description: "Account created! Please verify your email for 2FA setup.", severity: "info" });
        navigate('/auth/verify-2fa', { 
          state: { 
            userId: response.user_id, 
            email: email,
            isSetup: true,
            message: response.message 
          } 
        });
        return;
      }
      
      setTokens(response.access_token, response.refresh_token);
      await getMe();
      toast({ description: "Account created successfully!", severity: "success" });
              navigate("/client/dashboard");
    } catch (error: any) {
      const errorObj = error as { response?: { status?: number; data?: any } };
      const resp = errorObj.response;

      if (resp?.status === 422) {
        const validationErrors = resp.data as Array<{ msg: string; loc: string[] }>;
        const friendly = validationErrors[0]?.msg || "Invalid input";
        setError(friendly);
        toast({ description: friendly, severity: "critical" });
        return;
      }

      if (resp?.status === 400) {
        const detail = resp.data?.detail || "Email or username already exists";
        setError(detail);
        toast({ description: detail, severity: "critical" });
        return;
      }

      // Generic fallback
      const detail = resp?.data?.detail;
      let message = "Failed to create account. Please try again.";
      if (typeof detail === "string") {
        message = detail;
      } else if (typeof detail === "object") {
        message = JSON.stringify(detail);
      }
      setError(message);
      toast({ description: message, severity: "critical" });
    } finally {
      setisLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  const { requirements, score } = getPasswordStrength(formData.password);
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-red-600", "bg-green-500"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Background Elements - Same as login page */}
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
        className="relative z-10 max-w-2xl mx-auto text-center"
      >
        {/* Main Sign Up Display with floating text */}
        <motion.div
          variants={slideUpVariants}
          className="mb-8"
        >
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="relative inline-block"
          >
            <div className="text-5xl md:text-6xl font-bold text-primary/20 select-none">
              SIGN UP
            </div>
            <motion.div
              className="absolute inset-0 text-5xl md:text-6xl font-bold text-primary"
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              SIGN UP
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Main Content Card - Same structure as login */}
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
                  <UserPlus className="w-8 h-8" />
                </motion.div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Create Your Account
                </h1>
                
                <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Join SpamGPT platform and unlock powerful email marketing tools to grow your business.
                </p>
              </motion.div>

              {/* Sign Up Form */}
              <motion.div variants={slideUpVariants} className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2 text-left">
                    <Label htmlFor="name" className="text-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="pl-10 bg-background/80 border-muted hover:border-primary/50 focus:border-primary transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2 text-left">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleInputChange("email", e.target.value)
                        }
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
                        type={isShowPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="pl-10 pr-10 bg-background/80 border-muted hover:border-primary/50 focus:border-primary transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setIsShowPassword(!isShowPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2"
                      >
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i < score ? strengthColors[score - 1] : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${score >= 3 ? "text-green-600" : "text-muted-foreground"}`}>
                          Password strength: {strengthLabels[score - 1] || "Very Weak"}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2 text-left">
                    <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={isShowConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className="pl-10 pr-10 bg-background/80 border-muted hover:border-primary/50 focus:border-primary transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setIsShowConfirmPassword(!isShowConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isShowConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-destructive"
                      >
                        Passwords do not match
                      </motion.p>
                    )}
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) =>
                        handleInputChange("agreeToTerms", checked as boolean)
                      }
                      className="mt-1"
                    />
                    <Label htmlFor="terms" className="text-sm text-foreground leading-relaxed">
                      I agree to the{" "}
                      <button 
                        type="button"
                        onClick={() => navigate('/terms')}
                        className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button 
                        type="button"
                        onClick={() => navigate('/privacy')}
                        className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                      >
                        Privacy Policy
                      </button>
                    </Label>
                  </div>

                  {/* 2FA Option */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="enable2fa"
                      checked={formData.enable2FA}
                      onCheckedChange={(checked) =>
                        handleInputChange("enable2FA", checked as boolean)
                      }
                      className="mt-1"
                    />
                    <Label htmlFor="enable2fa" className="text-sm text-foreground leading-relaxed">
                      <span className="flex items-center gap-2">
                        <span>Enable Two-Factor Authentication (2FA) for enhanced security</span>
                        <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      </span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        A verification code will be sent to your email when logging in
                      </span>
                    </Label>
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
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 gap-2 font-medium"
                      size="lg"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </motion.div>

              {/* Suggestion Cards - Similar to login page but sign-up themed */}
              <motion.div
                variants={slideUpVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8"
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-4 rounded-lg border border-muted/20 bg-muted/5 hover:bg-muted/10 transition-colors"
                >
                  <Shield className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold text-sm text-foreground">Secure Platform</h3>
                  <p className="text-xs text-muted-foreground">Bank-level security</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-4 rounded-lg border border-muted/20 bg-muted/5 hover:bg-muted/10 transition-colors"
                >
                  <Zap className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold text-sm text-foreground">Quick Setup</h3>
                  <p className="text-xs text-muted-foreground">Start in minutes</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-4 rounded-lg border border-muted/20 bg-muted/5 hover:bg-muted/10 transition-colors"
                >
                  <Mail className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold text-sm text-foreground">Email Tools</h3>
                  <p className="text-xs text-muted-foreground">Powerful features</p>
                </motion.div>
              </motion.div>

              {/* Action Buttons - Same as login page */}
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
                    onClick={handleGoToLogin}
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground px-6 py-3 gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Already have an account
                  </Button>
                </motion.div>
              </motion.div>

              {/* Help Text */}
              <motion.div
                variants={fadeInVariants}
                className="pt-6 border-t border-muted/20"
              >
                <p className="text-sm text-muted-foreground">
                  By signing up, you'll get instant access to our{' '}
                  <button 
                    onClick={() => navigate('/features')}
                    className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                  >
                    premium features
                  </button>
                  {' '}and 24/7 support.
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Decorative Elements - Same as login page */}
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

export default SignUp;

