export const API = {
  compose: '/compose',
  oauthCallback: (provider: string) => `/oauth/${provider}/callback`,
  templateHistory: '/templates/history',
  smtpStatus: (id: string) => `/smtp-checker/${id}/status`,
  healthLive: '/health/live',
  healthReady: '/health/ready',
  blacklistDomain: (domain: string) => `/blacklist/domain/${domain}`,
  imapMetricsWS: '/ws/imap/metrics',
  smtpMetricsWS: '/ws/smtp/metrics',
  campaignProgressWS: (campaignId: string) => `/ws/campaigns/${encodeURIComponent(campaignId)}/progress`,
  smtpDiscovery: '/discovery/smtp-hosts',
} as const;

