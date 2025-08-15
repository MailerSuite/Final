import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Mail,
  RefreshCw,
  ArrowRight,
  Lock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { verify2FACode, resend2FACode } from '@/api/auth';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function Verify2FAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [codesList, setCodesList] = useState<string[]>([]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get user ID from location state
  const userId = location.state?.userId;
  const email = location.state?.email;

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);

      // Focus last input or next empty input
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Single character input
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    setError('');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = useBackupCode ? backupCode : code.join('');

    if (useBackupCode && !backupCode) {
      setError('Please enter a backup code');
      return;
    }

    if (!useBackupCode && verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await verify2FACode({
        user_id: userId,
        code: useBackupCode ? undefined : verificationCode,
        backup_code: useBackupCode ? backupCode : undefined
      });

      if (response.success) {
        // Store auth tokens
        setAuth({
          token: response.access_token,
          refreshToken: response.refresh_token,
          user: { id: userId, email }
        });

        // Show backup codes if returned
        if (response.backup_codes) {
          setShowBackupCodes(true);
          setCodesList(response.backup_codes);
        }

        toast.success('Verification successful!');
        navigate('/client/dashboard');
      } else {
        setError(response.message || 'Invalid verification code');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setError('');

    try {
      const response = await resend2FACode({ user_id: userId });

      if (response.success) {
        toast.success('New code sent to your email');
        setCountdown(60); // 60 second cooldown
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(response.message || 'Failed to resend code');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your backup codes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Store these codes securely. Each code can be used once.</p>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              {codesList.map((c) => (
                <div key={c} className="font-mono text-sm p-2 rounded border bg-muted">{c}</div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5" />

      {/* Animated background elements */}
      <motion.div
        className="fixed top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="fixed bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full mb-4">
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Two-Factor Authentication</h1>
          <p className="text-zinc-400">
            Enter the 6-digit code sent to {email || 'your email'}
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Verification Code
              </CardTitle>
              <CardDescription>
                Check your email for the verification code
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!useBackupCode ? (
                <div className="space-y-4">
                  <div className="flex gap-2 justify-center">
                    {code.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-semibold bg-zinc-800/50 border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
                        disabled={isLoading}
                      />
                    ))}
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => setUseBackupCode(true)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Use a backup code instead
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Backup Code</label>
                    <Input
                      type="text"
                      placeholder="XXXX-XXXX"
                      value={backupCode}
                      onChange={(e) => {
                        setBackupCode(e.target.value.toUpperCase());
                        setError('');
                      }}
                      className="bg-zinc-800/50 border-zinc-700 text-white"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        setUseBackupCode(false);
                        setBackupCode('');
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Use verification code instead
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleVerify}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Verify & Continue
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-zinc-400">Didn't receive the code?</span>
                  <button
                    onClick={handleResend}
                    disabled={isResending || countdown > 0}
                    className={`text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 ${countdown > 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <span>Your account is protected with 2FA</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-6 text-center"
        >
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Back to login
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}