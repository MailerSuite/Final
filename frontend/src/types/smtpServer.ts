export interface SmtpServer {
  id: number;
  alias: string;
  host: string;
  port: number;
  lastChecked?: string;
  status: 'pending' | 'valid' | 'invalid' | 'error';
  country?: string | null;
}
