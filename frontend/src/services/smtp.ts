import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { SMTPAccount } from '@/types/smtp'

export const smtpApi = createApi({
  reducerPath: 'smtpApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Smtp'],
  endpoints: (builder) => ({
    getSmtpList: builder.query<SMTPAccount[], { sessionId: string }>({
      query: ({ sessionId }) => `/smtp/${sessionId}/accounts`,
      providesTags: ['Smtp'],
    }),
    deleteSmtp: builder.mutation<void, { sessionId: string; id: string }>({
      query: ({ sessionId, id }) => ({ url: `/smtp/${sessionId}/accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Smtp'],
    }),
  }),
})

export const { useGetSmtpListQuery, useDeleteSmtpMutation } = smtpApi
