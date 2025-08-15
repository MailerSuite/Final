export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko' | 'ar' | 'ru';

export interface TranslationKey {
  // Common UI
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    view: string;
    close: string;
    yes: string;
    no: string;
    back: string;
    next: string;
    previous: string;
    continue: string;
    retry: string;
    refresh: string;
    search: string;
    filter: string;
    sort: string;
    export: string;
    import: string;
    download: string;
    upload: string;
    copy: string;
    copied: string;
    select: string;
    selectAll: string;
    clear: string;
    reset: string;
    apply: string;
    create: string;
    update: string;
    remove: string;
    add: string;
    name: string;
    email: string;
    password: string;
    username: string;
    settings: string;
    profile: string;
    account: string;
    dashboard: string;
    analytics: string;
    reports: string;
    campaigns: string;
    templates: string;
    contacts: string;
    status: string;
    active: string;
    inactive: string;
    enabled: string;
    disabled: string;
    online: string;
    offline: string;
    connected: string;
    disconnected: string;
    pending: string;
    completed: string;
    failed: string;
    cancelled: string;
    date: string;
    time: string;
    createdAt: string;
    updatedAt: string;
    lastModified: string;
    actions: string;
    options: string;
    details: string;
    description: string;
    total: string;
    count: string;
    page: string;
    of: string;
    items: string;
    results: string;
    noResults: string;
    noData: string;
    language: string;
    timezone: string;
    theme: string;
    light: string;
    dark: string;
    auto: string;
  };

  // Authentication
  auth: {
    login: string;
    logout: string;
    signUp: string;
    signIn: string;
    register: string;
    forgotPassword: string;
    resetPassword: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    rememberMe: string;
    welcomeBack: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    invalidCredentials: string;
    passwordsDoNotMatch: string;
    passwordTooWeak: string;
    accountCreated: string;
    accountVerified: string;
    verificationEmailSent: string;
    emailRequired: string;
    passwordRequired: string;
    usernameRequired: string;
    loginSuccess: string;
    logoutSuccess: string;
    sessionExpired: string;
    accessDenied: string;
    accountLocked: string;
    tooManyAttempts: string;
  };

  // Navigation
  nav: {
    home: string;
    about: string;
    contact: string;
    help: string;
    support: string;
    documentation: string;
    pricing: string;
    features: string;
    blog: string;
    news: string;
    updates: string;
    changelog: string;
    roadmap: string;
    community: string;
    forum: string;
    feedback: string;
    legal: string;
    privacy: string;
    terms: string;
    cookies: string;
  };

  // Emails & Campaigns
  emails: {
    compose: string;
    send: string;
    sent: string;
    draft: string;
    drafts: string;
    inbox: string;
    outbox: string;
    archive: string;
    spam: string;
    trash: string;
    subject: string;
    recipient: string;
    recipients: string;
    sender: string;
    cc: string;
    bcc: string;
    attachment: string;
    attachments: string;
    priority: string;
    high: string;
    medium: string;
    low: string;
    scheduled: string;
    delivered: string;
    bounced: string;
    opened: string;
    clicked: string;
    unsubscribed: string;
    blocked: string;
    failed: string;
    queued: string;
    processing: string;
    campaign: string;
    campaigns: string;
    template: string;
    templates: string;
    preview: string;
    testEmail: string;
    sendTest: string;
    bulkSend: string;
    massEmail: string;
    emailList: string;
    emailLists: string;
    subscription: string;
    unsubscribe: string;
    blacklist: string;
    whitelist: string;
    suppression: string;
    deliverability: string;
    openRate: string;
    clickRate: string;
    bounceRate: string;
    unsubscribeRate: string;
    deliveryRate: string;
    engagementRate: string;
  };

  // SMTP & IMAP
  smtp: {
    server: string;
    host: string;
    port: string;
    security: string;
    authentication: string;
    connection: string;
    test: string;
    verify: string;
    configure: string;
    settings: string;
    ssl: string;
    tls: string;
    starttls: string;
    plain: string;
    login: string;
    cramMd5: string;
    oauth2: string;
    timeout: string;
    retry: string;
    maxConnections: string;
    pooling: string;
    keepAlive: string;
    rateLimit: string;
    throttle: string;
  };

  // Errors & Validation
  errors: {
    required: string;
    invalid: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    conflict: string;
    timeout: string;
    networkError: string;
    serverError: string;
    validationError: string;
    minLength: string;
    maxLength: string;
    minValue: string;
    maxValue: string;
    invalidEmail: string;
    invalidUrl: string;
    invalidDate: string;
    invalidNumber: string;
    invalidFormat: string;
    fileTooLarge: string;
    fileTypeNotSupported: string;
    uploadFailed: string;
    downloadFailed: string;
    connectionFailed: string;
    operationFailed: string;
    permissionDenied: string;
    quotaExceeded: string;
    rateLimitExceeded: string;
    maintenanceMode: string;
    serviceUnavailable: string;
    unexpectedError: string;
  };

  // Success Messages
  success: {
    saved: string;
    created: string;
    updated: string;
    deleted: string;
    uploaded: string;
    downloaded: string;
    sent: string;
    delivered: string;
    processed: string;
    imported: string;
    exported: string;
    synchronized: string;
    verified: string;
    activated: string;
    deactivated: string;
    connected: string;
    disconnected: string;
    configured: string;
    installed: string;
    uninstalled: string;
    completed: string;
    cancelled: string;
    paused: string;
    resumed: string;
    started: string;
    stopped: string;
    reset: string;
    restored: string;
    backup: string;
    published: string;
    unpublished: string;
  };
}

export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

export interface I18nState {
  locale: SupportedLocale;
  translations: Partial<TranslationKey> | null;
  isLoading: boolean;
  fallbackLocale: SupportedLocale;
  loadedLocales: Set<SupportedLocale>;
  
  setLocale: (locale: SupportedLocale) => Promise<void>;
  loadTranslations: (locale: SupportedLocale) => Promise<void>;
  t: TranslationFunction;
  formatMessage: (key: string, params?: Record<string, string | number>) => string;
}

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const FALLBACK_LOCALE: SupportedLocale = 'en'; 