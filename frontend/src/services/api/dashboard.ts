import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ServerPerformance {
  server: string;
  cpu: number;
  memory: number;
  disk: number;
  status: 'Healthy' | 'Warning' | 'Critical';
}

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  endpoints: (builder) => ({
    getServerPerformance: builder.query<ServerPerformance[], void>({
      query: () => '/dashboard/system-health',
    }),
  }),
});

export const { useGetServerPerformanceQuery } = dashboardApi;
