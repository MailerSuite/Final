// HTTP Request utility - compatibility layer
import axiosInstance from './axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

export type HttpRequestConfig = InternalAxiosRequestConfig

export async function httpRequest<T = any>(config: HttpRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<T> = await axiosInstance.request<T>(config)
    return response.data
  } catch (error) {
    console.error('HTTP Request failed:', error)
    throw error
  }
}

// Export both named and default for compatibility
export { httpRequest as request }
export default httpRequest