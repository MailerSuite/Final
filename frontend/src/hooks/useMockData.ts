import { useState, useEffect } from 'react';
import {
  generateDashboardData,
  generateCampaignData,
  generateEmailListData,
  generateSmtpData,
  generateImapData,
  generateProxyData,
  generateTemplateData,
  generateAnalyticsData,
  generateAdminData,
  generateHubData
} from '@/services/mockData';

export type MockDataType = 
  | 'dashboard'
  | 'campaigns'
  | 'emailLists'
  | 'smtp'
  | 'imap'
  | 'proxy'
  | 'templates'
  | 'analytics'
  | 'admin'
  | 'hub';

export function useMockData<T = any>(dataType: MockDataType, realData?: T | null): T {
  const [data, setData] = useState<T>(() => {
    // If real data is available and valid, use it
    if (realData !== null && realData !== undefined) {
      return realData;
    }
    
    // Otherwise, generate mock data based on type
    switch (dataType) {
      case 'dashboard':
        return generateDashboardData() as T;
      case 'campaigns':
        return generateCampaignData() as T;
      case 'emailLists':
        return generateEmailListData() as T;
      case 'smtp':
        return generateSmtpData() as T;
      case 'imap':
        return generateImapData() as T;
      case 'proxy':
        return generateProxyData() as T;
      case 'templates':
        return generateTemplateData() as T;
      case 'analytics':
        return generateAnalyticsData() as T;
      case 'admin':
        return generateAdminData() as T;
      case 'hub':
        return generateHubData() as T;
      default:
        return {} as T;
    }
  });

  useEffect(() => {
    // Update data if real data becomes available
    if (realData !== null && realData !== undefined) {
      setData(realData);
    }
  }, [realData]);

  return data;
}

// Hook for simulating real-time updates
export function useLiveUpdates<T = any>(
  initialData: T,
  updateInterval: number = 5000,
  updateFn?: (prev: T) => T
): T {
  const [data, setData] = useState<T>(initialData);

  useEffect(() => {
    if (!updateFn) return;

    const interval = setInterval(() => {
      setData(prev => updateFn(prev));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, updateFn]);

  return data;
}

// Hook for paginated mock data
export function usePaginatedMockData<T = any>(
  dataType: MockDataType,
  pageSize: number = 10
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [data] = useState<unknown>(() => {
    switch (dataType) {
      case 'campaigns':
        return generateCampaignData().campaigns;
      case 'emailLists':
        return generateEmailListData().subscribers;
      case 'smtp':
        return generateSmtpData().logs;
      case 'imap':
        return generateImapData().messages;
      case 'proxy':
        return generateProxyData().proxies;
      case 'templates':
        return generateTemplateData().templates;
      case 'admin':
        return generateAdminData().users;
      default:
        return [];
    }
  });

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = data.slice(startIndex, endIndex);

  return {
    data: currentData,
    currentPage,
    totalPages,
    totalItems: data.length,
    pageSize,
    setPage: setCurrentPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    nextPage: () => setCurrentPage(p => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage(p => Math.max(p - 1, 1))
  };
}