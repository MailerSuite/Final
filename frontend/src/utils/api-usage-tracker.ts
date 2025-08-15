export type ApiUsageRecord = {
    count: number;
    lastUsed: string; // ISO string
    methods: Record<string, number>;
};

type ApiUsageStore = Record<string, ApiUsageRecord>;

const STORAGE_KEY = 'sgpt_api_usage';

function readStore(): ApiUsageStore {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as ApiUsageStore;
    } catch {
        return {};
    }
}

function writeStore(store: ApiUsageStore) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        // ignore storage errors
    }
}

function normalizePath(url: string): string {
    try {
        // If absolute URL, remove origin
        const u = new URL(url, window.location.origin);
        return u.pathname.replace(/\/$/, '');
    } catch {
        // Likely a relative path already
        return url.split('?')[0].replace(/\/$/, '');
    }
}

export function recordApiUsage(method: string | undefined, url: string | undefined) {
    if (!url) return;
    const store = readStore();
    const key = normalizePath(url);
    const now = new Date().toISOString();

    if (!store[key]) {
        store[key] = { count: 0, lastUsed: now, methods: {} };
    }
    store[key].count += 1;
    store[key].lastUsed = now;
    const m = (method || 'GET').toUpperCase();
    store[key].methods[m] = (store[key].methods[m] || 0) + 1;

    writeStore(store);
}

export function getApiUsage(): ApiUsageStore {
    return readStore();
}

export function getUsageForPath(path: string): ApiUsageRecord | undefined {
    const store = readStore();
    const key = normalizePath(path);
    return store[key];
}

export function clearApiUsage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}

