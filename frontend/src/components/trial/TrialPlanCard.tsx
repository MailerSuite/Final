import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  Zap,
  Star,
  Bitcoin,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Timer,
  CreditCard,
  TrendingUp,
  Settings,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TrialPlanCardProps {
  onPurchaseSuccess?: () => void;
  className?: string;
}

interface TrialStatus {
  is_active: boolean;
  time_remaining_minutes: number;
  threads_used: number;
  campaigns_sent: number;
  extensions_used: number;
  extensions_remaining: number;
  can_extend: boolean;
  expires_at: string;
}

interface PaymentRequest {
  payment_request_id: string;
  plan_name: string;
  amount_btc: string;
  amount_usd: number;
  btc_address: string;
  expires_at: string;
  status: string;
  qr_data: string;
  trial_duration_minutes?: number;
  max_threads?: number;
  max_extensions?: number;
  extension_minutes?: number;
  extensions_remaining?: number;
}

const TrialPlanCard: React.FC<TrialPlanCardProps> = ({ onPurchaseSuccess, className }) => {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [availability, setAvailability] = useState<{
    can_purchase_trial: boolean;
    has_active_trial: boolean;
    has_used_trial: boolean;
    message: string;
  } | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    checkTrialAvailability();
    if (availability?.has_active_trial) {
      fetchTrialStatus();
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (trialStatus?.is_active) {
      interval = setInterval(fetchTrialStatus, 30000); // Update every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trialStatus?.is_active]);

  const checkTrialAvailability = async () => {
    try {
      const response = await fetch('/api/trial/availability', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAvailability(data);
      
      if (data.has_active_trial) {
        await fetchTrialStatus();
      }
    } catch (error) {
      console.error('Error checking trial availability:', error);
    }
  };

  const fetchTrialStatus = async () => {
    try {
      const response = await fetch('/api/trial/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrialStatus(data);
      }
    } catch (error) {
      console.error('Error fetching trial status:', error);
    }
  };

  const purchaseTrial = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trial/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const payment: PaymentRequest = await response.json();
        setPaymentRequest(payment);
        setQrCodeUrl(generateQRCode(payment.qr_data));
        setShowPaymentModal(true);
        startPaymentMonitoring(payment.payment_request_id);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create trial payment');
      }
    } catch (error) {
      toast.error('Failed to create trial payment');
      console.error('Error creating trial payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseExtension = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trial/extend/payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const payment: PaymentRequest = await response.json();
        setPaymentRequest(payment);
        setQrCodeUrl(generateQRCode(payment.qr_data));
        setShowPaymentModal(true);
        startExtensionPaymentMonitoring(payment.payment_request_id);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create extension payment');
      }
    } catch (error) {
      toast.error('Failed to create extension payment');
      console.error('Error creating extension payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = (qrData: string): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  const startPaymentMonitoring = (paymentRequestId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/core/payment-request/${paymentRequestId}/status/`);
        const status = await response.json();

        if (status.payment_confirmed) {
          // Activate trial
          await fetch('/api/trial/activate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ payment_request_id: paymentRequestId })
          });

          toast.success('Trial activated successfully!');
          setShowPaymentModal(false);
          await checkTrialAvailability();
          onPurchaseSuccess?.();
          clearInterval(interval);
        } else if (status.is_expired) {
          toast.error('Payment expired');
          setShowPaymentModal(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 10000);

    // Clear interval after 15 minutes
    setTimeout(() => clearInterval(interval), 15 * 60 * 1000);
  };

  const startExtensionPaymentMonitoring = (paymentRequestId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/core/payment-request/${paymentRequestId}/status/`);
        const status = await response.json();

        if (status.payment_confirmed) {
          // Extend trial
          await fetch('/api/trial/extend', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ payment_request_id: paymentRequestId })
          });

          toast.success('Trial extended successfully!');
          setShowPaymentModal(false);
          await fetchTrialStatus();
          clearInterval(interval);
        } else if (status.is_expired) {
          toast.error('Payment expired');
          setShowPaymentModal(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error checking extension payment status:', error);
      }
    }, 10000);

    // Clear interval after 15 minutes
    setTimeout(() => clearInterval(interval), 15 * 60 * 1000);
  };

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes <= 0) return '0 minutes';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const getTimeRemainingColor = (minutes: number): string => {
    if (minutes <= 5) return 'text-red-600';
    if (minutes <= 15) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressPercentage = (minutes: number, totalMinutes: number = 60): number => {
    return Math.max(0, Math.min(100, (minutes / totalMinutes) * 100));
  };

  if (!availability) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Card className="w-full overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Trial Plan
              </CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                60 Minutes
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {availability.has_active_trial && trialStatus ? (
              // Active Trial Status
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Trial Active</h3>
                  <Badge variant={trialStatus.is_active ? "default" : "destructive"}>
                    {trialStatus.is_active ? "Running" : "Expired"}
                  </Badge>
                </div>

                {trialStatus.is_active && (
                  <>
                    {/* Time Remaining */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Time Remaining</span>
                        <span className={cn("font-bold text-lg", getTimeRemainingColor(trialStatus.time_remaining_minutes))}>
                          {formatTimeRemaining(trialStatus.time_remaining_minutes)}
                        </span>
                      </div>
                      <Progress 
                        value={getProgressPercentage(trialStatus.time_remaining_minutes)} 
                        className="h-3"
                      />
                    </div>

                    {/* Usage Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{trialStatus.threads_used}</p>
                        <p className="text-sm text-muted-foreground">Threads Used</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{trialStatus.campaigns_sent}</p>
                        <p className="text-sm text-muted-foreground">Campaigns Sent</p>
                      </div>
                    </div>

                    {/* Extensions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Extensions Available</span>
                        <Badge variant="outline">
                          {trialStatus.extensions_remaining} remaining
                        </Badge>
                      </div>

                      {trialStatus.can_extend && trialStatus.extensions_remaining > 0 && (
                        <Button
                          onClick={purchaseExtension}
                          disabled={loading}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Extend Trial (+30 min) - $0.50
                        </Button>
                      )}
                    </div>

                    {/* Low Time Warning */}
                    {trialStatus.time_remaining_minutes <= 15 && (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-orange-800">Trial Ending Soon!</p>
                          <p className="text-xs text-orange-600">
                            Consider extending or upgrading to a full plan
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : availability.can_purchase_trial ? (
              // Purchase Trial
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Try MailerSuite</h3>
                  <p className="text-muted-foreground">
                    Get 60 minutes of full access to our email marketing platform
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Included Features:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Up to 5 sending threads',
                      'Basic campaign management',
                      'SMTP/IMAP configuration',
                      'Basic analytics & templates',
                      'Extendable (2x 30min extensions)'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-700">$1.00</div>
                  <div className="text-sm text-blue-600">One-time payment</div>
                </div>

                <Button
                  onClick={purchaseTrial}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Payment...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Start Trial - $1.00
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Payment via Bitcoin • Instant activation • No recurring charges
                </p>
              </div>
            ) : (
              // Already Used Trial
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Trial Already Used</h3>
                  <p className="text-muted-foreground mt-1">
                    {availability.message}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Ready for a full plan?</p>
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Subscription Plans
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-orange-500" />
              {paymentRequest?.plan_name || 'Complete Payment'}
            </DialogTitle>
          </DialogHeader>
          
          {paymentRequest && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-foreground">
                  ${paymentRequest.amount_usd}
                </div>
                <div className="text-sm text-muted-foreground">
                  {paymentRequest.amount_btc} BTC
                </div>
              </div>

              {qrCodeUrl && (
                <div className="flex justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="Payment QR Code" 
                    className="w-48 h-48 border rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Bitcoin Address:</p>
                <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                  {paymentRequest.btc_address}
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Scan QR code or send Bitcoin to the address above
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Payment will be detected automatically
                </p>
              </div>

              {paymentRequest.trial_duration_minutes && (
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-green-700">
                    ✨ {paymentRequest.trial_duration_minutes} minutes of access
                  </p>
                  {paymentRequest.max_extensions && (
                    <p className="text-xs text-muted-foreground">
                      + {paymentRequest.max_extensions} extensions available
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrialPlanCard; 