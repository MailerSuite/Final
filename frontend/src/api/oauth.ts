import axios from '@/http/axios'
import { API } from './endpoints'

/** Get Microsoft OAuth authorization URL */
export const authorizeMicrosoft = async () => {
  const { data } = await axios.get<{ authorization_url: string }>(
    '/oauth/microsoft/authorize'
  )
  return data
}

/** Handle Microsoft OAuth callback */
export const callbackMicrosoft = async (code: string) => {
  const { data } = await axios.get(API.oauthCallback('microsoft'), {
    params: { code },
  })
  return data
}
