import axiosInstance from '@/http/axios'
import type { Domain } from '@/types'

export const pingDomain = async (id: string) => {
  const { data } = await axiosInstance.get<Domain>(`/domains/${id}/ping`)
  return data
}

export const blacklistDomain = async (id: string) => {
  const { data } = await axiosInstance.post(`/api/v1domains/${id}/blacklist-check`)
  return data
}

export default { pingDomain, blacklistDomain }
