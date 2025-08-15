// ===== TABLE & UI TYPES =====
export enum TableType {
  CAMPAIGN = "campaign",
  EMAIL = "email", 
  USER = "user",
  SMTP = "smtp",
  TEMPLATE = "template"
}

// ===== USER & AUTHENTICATION TYPES =====
export interface IUser {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  license_expires_at?: string | null;
}

// ===== CAMPAIGN & EMAIL TYPES =====
export interface EmailCampaign {
  id: number
  name: string
  template_id: number
  threads_number: number
  timeout: number
  session_id: number
  status: "draft" | "running" | "paused" | "stopped" | "completed" | "failed"
  sending_limit: number
  send_in_batches: boolean
  batch_size: number
  delay_between_batches: number
  autostart: boolean
  sent_count: number
  success_count: number
  error_count: number
  created_at: string
  started_at: string | null
  completed_at: string | null
  updated_at: string
}

// ===== LOCATION & COUNTRY TYPES =====
export interface Countries {
  flags: {
    png: string;
    svg: string;
    alt: string;
  };
  name: {
    common: string;
    official: string
  };
}

// ===== SPECIFIC FEATURE EXPORTS =====
// Email & SMTP related
export * from "./smtp";
export * from "./emailBase";

// Campaign & Template related  
export * from "./campaign";
export * from "./template";

// Session & Authentication related
export * from "./session";

// IMAP & Email Management
export * from "./imap";

// Infrastructure & Monitoring
export * from "./proxy";
export * from "./domain";
export * from "./jobLog";
export * from "./log";

// Validation & Checking
export * from "./checks";
export * from "./checker";

// Mailing & Jobs
export * from "./mailingJob";
export * from "./smtpServer";

// UI & Navigation
export * from "./sidebar";
export * from "./config";

