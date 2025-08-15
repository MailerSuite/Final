import { apiClient } from '@/http/stable-api-client'

export const getStatus = async () => apiClient.get('/status')
