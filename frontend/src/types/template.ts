export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string | null;
  macros?: Record<string, unknown>;
  attachments?: unknown[];
  mailStatus: 'INBOX' | 'JUNK' | 'UNKNOWN' | 'VALID';
  created_at: string;
  updated_at: string;
}
