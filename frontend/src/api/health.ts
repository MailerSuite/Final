import axios from '@/http/axios'
import { API } from './endpoints'

/** General health check */
export const health = async () => {
  const { data } = await axios.get('/api/v1health/')
  return data
}

/** Readiness probe */
export const ready = async () => {
  const { data } = await axios.get(API.healthReady)
  return data
}

/** Liveness probe */
export const live = async () => {
  const { data } = await axios.get(API.healthLive)
  return data
}
