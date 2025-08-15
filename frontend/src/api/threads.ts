import { ThreadPool, ThreadPoolCreate, ThreadPoolUpdate } from '@/types'
import { apiClient } from '@/http/stable-api-client'

export const listThreadPools = async () => apiClient.get<ThreadPool[]>('/api/v1/thread-pools')
export const getThreadPool = async (id: string) => apiClient.get<ThreadPool>(`/api/v1/thread-pools/${id}`)
export const createThreadPool = async (payload: ThreadPoolCreate) => apiClient.post<ThreadPool>('/api/v1/thread-pools', payload)
export const deleteThreadPool = async (id: string) => apiClient.delete(`/api/v1/thread-pools/${id}`)
export const updateThreadPool = async (id: string, payload: ThreadPoolUpdate) => apiClient.put<ThreadPool>(`/api/v1/thread-pools/${id}`, payload)
