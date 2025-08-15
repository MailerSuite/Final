export interface MailingJob {
  id: number;
  name: string;
  recipients: string;
  status: 'pending' | 'running' | 'completed' | 'confirmed';
  scheduledAt: string;
}
