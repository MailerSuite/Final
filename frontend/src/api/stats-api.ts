import axiosInstance from '@/http/axios'

export interface Counts {
  smtp?: number;
  imap?: number;
  templates?: number;
  proxies?: number;
  domains?: number;
  campaigns?: number;
  leads?: number;
  sessions?: number;
}

// Fallback counts when API is unavailable
const fallbackCounts: Counts = {
  smtp: 0,
  imap: 0,
  templates: 0,
  proxies: 0,
  domains: 0,
  campaigns: 0,
  leads: 0,
  sessions: 0,
};

export async function getSidebarCounts(): Promise<Counts> {
  try {
    // Use the correct endpoint for dashboard counts
    const { data } = await axiosInstance.get('/dashboard/counts');
    
    // Map the response to expected format
    return {
      smtp: Number(data.smtp) || 0,
      imap: Number(data.imap) || 0,
      templates: Number(data.templates) || 0,
      proxies: Number(data.proxies) || 0,
      domains: Number(data.domains) || 0,
      campaigns: Number(data.campaigns) || 0,
      leads: Number(data.leads) || 0,
      sessions: Number(data.sessions) || 0,
    };
  } catch (error) {
    // Silently handle API errors - don't log to console
    return fallbackCounts;
  }
}

// Individual count APIs for specific sections
export async function getSmtpCount(): Promise<number> {
  try {
    const { data } = await axiosInstance.get('/smtp/count');
    return Number(data.count) || 0;
  } catch (error) {
    return 0;
  }
}

export async function getImapCount(): Promise<number> {
  try {
    const { data } = await axiosInstance.get('/imap/count');
    return Number(data.count) || 0;
  } catch (error) {
    return 0;
  }
}

export async function getTemplateCount(): Promise<number> {
  try {
    const { data } = await axiosInstance.get('/templates/count');
    return Number(data.count) || 0;
  } catch (error) {
    return 0;
  }
}

export async function getCampaignCount(): Promise<number> {
  try {
    const { data } = await axiosInstance.get('/campaigns/count');
    return Number(data.count) || 0;
  } catch (error) {
    return 0;
  }
}

export async function getSessionCount(): Promise<number> {
  try {
    const { data } = await axiosInstance.get('/sessions/count');
    return Number(data.count) || 0;
  } catch (error) {
    return 0;
  }
}
