export type UICampaign = {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
  type: 'regular' | 'automated' | 'ab-test' | 'drip' | 'transactional';
  subject: string;
  fromName: string;
  fromEmail: string;
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  aiScore: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
};

export const mockCampaigns: UICampaign[] = [
  {
    id: 'm-100',
    name: 'Spring Promo 2025',
    status: 'running',
    type: 'regular',
    subject: 'Save 30% this spring',
    fromName: 'Marketing',
    fromEmail: 'marketing@example.com',
    totalRecipients: 12000,
    sent: 7600,
    delivered: 7400,
    opened: 4100,
    clicked: 1250,
    bounced: 200,
    unsubscribed: 35,
    aiScore: 90,
    tags: ['promotion', 'seasonal'],
    priority: 'high',
    progress: 64,
  },
  {
    id: 'm-101',
    name: 'Onboarding Flow',
    status: 'scheduled',
    type: 'drip',
    subject: 'Welcome to the platform',
    fromName: 'Product',
    fromEmail: 'product@example.com',
    totalRecipients: 4800,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
    aiScore: 84,
    tags: ['onboarding', 'automated'],
    priority: 'medium',
    progress: 0,
  },
];
