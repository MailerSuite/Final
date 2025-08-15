import { faker } from '@faker-js/faker';

faker.seed(123);

export const generateDashboardData = () => ({
  stats: {
    totalCampaigns: faker.number.int({ min: 50, max: 500 }),
    activeCampaigns: faker.number.int({ min: 5, max: 50 }),
    totalSent: faker.number.int({ min: 10000, max: 1000000 }),
    totalOpened: faker.number.int({ min: 5000, max: 500000 }),
    totalClicked: faker.number.int({ min: 1000, max: 100000 }),
    totalBounced: faker.number.int({ min: 100, max: 10000 }),
    openRate: faker.number.float({ min: 15, max: 45, fractionDigits: 1 }),
    clickRate: faker.number.float({ min: 2, max: 15, fractionDigits: 1 }),
    bounceRate: faker.number.float({ min: 0.5, max: 5, fractionDigits: 1 }),
  },
  recentCampaigns: Array.from({ length: 5 }, () => ({
    id: faker.string.uuid(),
    name: faker.company.catchPhrase() + ' Campaign',
    status: faker.helpers.arrayElement(['active', 'paused', 'completed', 'draft']),
    sent: faker.number.int({ min: 1000, max: 50000 }),
    opened: faker.number.int({ min: 100, max: 25000 }),
    clicked: faker.number.int({ min: 50, max: 5000 }),
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
    lastActivity: faker.date.recent({ days: 7 }).toISOString(),
  })),
  chartData: Array.from({ length: 7 }, (_, i) => ({
    date: faker.date.recent({ days: 7 - i }).toLocaleDateString('en-US', { weekday: 'short' }),
    sent: faker.number.int({ min: 500, max: 5000 }),
    opened: faker.number.int({ min: 200, max: 2500 }),
    clicked: faker.number.int({ min: 50, max: 500 }),
  })),
});

export const generateCampaignData = () => ({
  campaigns: Array.from({ length: 20 }, () => ({
    id: faker.string.uuid(),
    name: faker.company.catchPhrase() + ' ' + faker.helpers.arrayElement(['Newsletter', 'Promo', 'Update', 'Announcement']),
    subject: faker.lorem.sentence({ min: 5, max: 10 }),
    fromName: faker.person.fullName(),
    fromEmail: faker.internet.email(),
    replyTo: faker.internet.email(),
    status: faker.helpers.arrayElement(['draft', 'scheduled', 'sending', 'sent', 'paused']),
    recipients: faker.number.int({ min: 100, max: 50000 }),
    sent: faker.number.int({ min: 0, max: 45000 }),
    opened: faker.number.int({ min: 0, max: 20000 }),
    clicked: faker.number.int({ min: 0, max: 5000 }),
    bounced: faker.number.int({ min: 0, max: 500 }),
    unsubscribed: faker.number.int({ min: 0, max: 100 }),
    createdAt: faker.date.recent({ days: 60 }).toISOString(),
    scheduledFor: faker.datatype.boolean() ? faker.date.future({ years: 0.1 }).toISOString() : null,
    completedAt: faker.datatype.boolean() ? faker.date.recent({ days: 30 }).toISOString() : null,
    tags: faker.helpers.arrayElements(['marketing', 'newsletter', 'product', 'announcement', 'promotion', 'event'], { min: 1, max: 3 }),
  })),
});

export const generateEmailListData = () => ({
  lists: Array.from({ length: 10 }, () => ({
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(['Customers', 'Prospects', 'Partners', 'VIP', 'Newsletter']) + ' ' + faker.location.country(),
    description: faker.lorem.sentence(),
    subscriberCount: faker.number.int({ min: 100, max: 100000 }),
    activeCount: faker.number.int({ min: 80, max: 90000 }),
    unsubscribedCount: faker.number.int({ min: 5, max: 5000 }),
    bouncedCount: faker.number.int({ min: 1, max: 1000 }),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    lastUpdated: faker.date.recent({ days: 14 }).toISOString(),
    tags: faker.helpers.arrayElements(['active', 'segmented', 'imported', 'verified'], { min: 1, max: 2 }),
  })),
  subscribers: Array.from({ length: 50 }, () => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    status: faker.helpers.arrayElement(['active', 'unsubscribed', 'bounced', 'pending']),
    subscribedAt: faker.date.past({ years: 1 }).toISOString(),
    lastActivity: faker.date.recent({ days: 30 }).toISOString(),
    tags: faker.helpers.arrayElements(['customer', 'lead', 'premium', 'trial'], { min: 0, max: 2 }),
  })),
});

export const generateSmtpData = () => ({
  servers: Array.from({ length: 8 }, () => ({
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(['SendGrid', 'Mailgun', 'AWS SES', 'Postmark', 'SparkPost']) + ' ' + faker.number.int({ min: 1, max: 5 }),
    host: faker.internet.domainName(),
    port: faker.helpers.arrayElement([25, 465, 587, 2525]),
    username: faker.internet.username(),
    encryption: faker.helpers.arrayElement(['TLS', 'SSL', 'STARTTLS', 'None']),
    status: faker.helpers.arrayElement(['active', 'inactive', 'error', 'testing']),
    dailyLimit: faker.number.int({ min: 1000, max: 100000 }),
    sentToday: faker.number.int({ min: 0, max: 50000 }),
    successRate: faker.number.float({ min: 85, max: 99.9, fractionDigits: 1 }),
    avgResponseTime: faker.number.int({ min: 50, max: 500 }),
    lastUsed: faker.date.recent({ days: 1 }).toISOString(),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  })),
  logs: Array.from({ length: 100 }, () => ({
    id: faker.string.uuid(),
    server: faker.helpers.arrayElement(['SendGrid-1', 'Mailgun-2', 'AWS SES-1']),
    recipient: faker.internet.email(),
    subject: faker.lorem.sentence({ min: 3, max: 8 }),
    status: faker.helpers.arrayElement(['sent', 'delivered', 'bounced', 'failed', 'deferred']),
    messageId: faker.string.alphanumeric(20),
    timestamp: faker.date.recent({ days: 7 }).toISOString(),
    responseTime: faker.number.int({ min: 50, max: 2000 }),
    error: faker.datatype.boolean(0.1) ? faker.lorem.sentence() : null,
  })),
});

export const generateImapData = () => ({
  accounts: Array.from({ length: 6 }, () => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    provider: faker.helpers.arrayElement(['Gmail', 'Outlook', 'Yahoo', 'Custom']),
    host: faker.internet.domainName(),
    port: faker.helpers.arrayElement([143, 993]),
    status: faker.helpers.arrayElement(['connected', 'disconnected', 'error', 'syncing']),
    folders: faker.number.int({ min: 5, max: 20 }),
    totalMessages: faker.number.int({ min: 100, max: 10000 }),
    unreadMessages: faker.number.int({ min: 0, max: 500 }),
    lastSync: faker.date.recent({ days: 1 }).toISOString(),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  })),
  messages: Array.from({ length: 50 }, () => ({
    id: faker.string.uuid(),
    from: faker.internet.email(),
    fromName: faker.person.fullName(),
    to: faker.internet.email(),
    subject: faker.lorem.sentence({ min: 3, max: 10 }),
    preview: faker.lorem.sentences({ min: 1, max: 2 }),
    folder: faker.helpers.arrayElement(['INBOX', 'Sent', 'Drafts', 'Spam', 'Trash']),
    hasAttachments: faker.datatype.boolean(0.3),
    isRead: faker.datatype.boolean(0.7),
    isStarred: faker.datatype.boolean(0.1),
    date: faker.date.recent({ days: 30 }).toISOString(),
    size: faker.number.int({ min: 1024, max: 5242880 }),
  })),
});

export const generateProxyData = () => ({
  proxies: Array.from({ length: 12 }, () => ({
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['HTTP', 'HTTPS', 'SOCKS5', 'SOCKS4']),
    host: faker.internet.ip(),
    port: faker.number.int({ min: 1080, max: 9999 }),
    username: faker.datatype.boolean(0.7) ? faker.internet.username() : null,
    country: faker.location.countryCode(),
    city: faker.location.city(),
    provider: faker.company.name(),
    status: faker.helpers.arrayElement(['active', 'inactive', 'testing', 'failed']),
    speed: faker.number.int({ min: 10, max: 1000 }),
    uptime: faker.number.float({ min: 85, max: 99.99, fractionDigits: 2 }),
    lastChecked: faker.date.recent({ days: 1 }).toISOString(),
    successRate: faker.number.float({ min: 75, max: 100, fractionDigits: 1 }),
    totalRequests: faker.number.int({ min: 1000, max: 1000000 }),
    failedRequests: faker.number.int({ min: 0, max: 10000 }),
  })),
});

export const generateTemplateData = () => ({
  templates: Array.from({ length: 15 }, () => ({
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(['Welcome', 'Newsletter', 'Promotion', 'Event', 'Survey']) + ' ' + faker.word.adjective(),
    category: faker.helpers.arrayElement(['marketing', 'transactional', 'newsletter', 'announcement']),
    description: faker.lorem.sentence(),
    thumbnail: faker.image.url(),
    usageCount: faker.number.int({ min: 0, max: 1000 }),
    rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    tags: faker.helpers.arrayElements(['responsive', 'mobile-friendly', 'dark-mode', 'minimal', 'colorful'], { min: 1, max: 3 }),
  })),
});

export const generateAnalyticsData = () => ({
  overview: {
    totalSent: faker.number.int({ min: 100000, max: 10000000 }),
    totalDelivered: faker.number.int({ min: 95000, max: 9500000 }),
    uniqueOpens: faker.number.int({ min: 30000, max: 3000000 }),
    uniqueClicks: faker.number.int({ min: 10000, max: 1000000 }),
    revenue: faker.number.float({ min: 10000, max: 1000000, fractionDigits: 2 }),
    avgOrderValue: faker.number.float({ min: 50, max: 500, fractionDigits: 2 }),
  },
  timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
    date: faker.date.recent({ days: 30 - i }).toISOString().split('T')[0],
    sent: faker.number.int({ min: 1000, max: 50000 }),
    delivered: faker.number.int({ min: 950, max: 48000 }),
    opened: faker.number.int({ min: 300, max: 20000 }),
    clicked: faker.number.int({ min: 100, max: 5000 }),
    bounced: faker.number.int({ min: 10, max: 500 }),
    unsubscribed: faker.number.int({ min: 0, max: 50 }),
  })),
  deviceStats: [
    { device: 'Desktop', percentage: faker.number.float({ min: 40, max: 60, fractionDigits: 1 }) },
    { device: 'Mobile', percentage: faker.number.float({ min: 30, max: 50, fractionDigits: 1 }) },
    { device: 'Tablet', percentage: faker.number.float({ min: 5, max: 15, fractionDigits: 1 }) },
  ],
  topPerformers: Array.from({ length: 5 }, () => ({
    campaignName: faker.company.catchPhrase() + ' Campaign',
    openRate: faker.number.float({ min: 25, max: 45, fractionDigits: 1 }),
    clickRate: faker.number.float({ min: 5, max: 15, fractionDigits: 1 }),
    revenue: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
  })),
});

export const generateAdminData = () => ({
  users: Array.from({ length: 25 }, () => ({
    id: faker.string.uuid(),
    username: faker.internet.username(),
    email: faker.internet.email(),
    fullName: faker.person.fullName(),
    role: faker.helpers.arrayElement(['admin', 'manager', 'editor', 'viewer']),
    status: faker.helpers.arrayElement(['active', 'inactive', 'suspended']),
    lastLogin: faker.date.recent({ days: 7 }).toISOString(),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    department: faker.helpers.arrayElement(['Marketing', 'Sales', 'Support', 'Development']),
    campaigns: faker.number.int({ min: 0, max: 50 }),
  })),
  systemHealth: {
    cpuUsage: faker.number.float({ min: 10, max: 80, fractionDigits: 1 }),
    memoryUsage: faker.number.float({ min: 20, max: 90, fractionDigits: 1 }),
    diskUsage: faker.number.float({ min: 30, max: 85, fractionDigits: 1 }),
    activeConnections: faker.number.int({ min: 10, max: 500 }),
    queueSize: faker.number.int({ min: 0, max: 1000 }),
    uptime: faker.number.int({ min: 86400, max: 2592000 }),
  },
  auditLog: Array.from({ length: 50 }, () => ({
    id: faker.string.uuid(),
    user: faker.person.fullName(),
    action: faker.helpers.arrayElement(['login', 'logout', 'create_campaign', 'delete_campaign', 'update_settings', 'export_data']),
    resource: faker.helpers.arrayElement(['campaign', 'template', 'list', 'user', 'settings']),
    ip: faker.internet.ip(),
    timestamp: faker.date.recent({ days: 7 }).toISOString(),
    status: faker.helpers.arrayElement(['success', 'failed', 'warning']),
  })),
});

export const generateHubData = () => ({
  quickStats: {
    todaySent: faker.number.int({ min: 1000, max: 50000 }),
    todayOpened: faker.number.int({ min: 500, max: 25000 }),
    todayClicked: faker.number.int({ min: 100, max: 5000 }),
    activeCampaigns: faker.number.int({ min: 1, max: 20 }),
    scheduledCampaigns: faker.number.int({ min: 0, max: 10 }),
    draftCampaigns: faker.number.int({ min: 0, max: 15 }),
  },
  recentActivity: Array.from({ length: 20 }, () => ({
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['campaign_sent', 'campaign_scheduled', 'list_imported', 'template_created', 'smtp_added']),
    description: faker.lorem.sentence({ min: 5, max: 10 }),
    user: faker.person.fullName(),
    timestamp: faker.date.recent({ days: 2 }).toISOString(),
    icon: faker.helpers.arrayElement(['mail', 'calendar', 'users', 'template', 'server']),
  })),
  upcomingCampaigns: Array.from({ length: 5 }, () => ({
    id: faker.string.uuid(),
    name: faker.company.catchPhrase() + ' Campaign',
    scheduledFor: faker.date.future({ years: 0.1 }).toISOString(),
    recipients: faker.number.int({ min: 100, max: 50000 }),
    template: faker.helpers.arrayElement(['Welcome Series', 'Monthly Newsletter', 'Product Launch']),
  })),
});