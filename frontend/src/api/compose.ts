import axios from '@/http/axios'
import { API } from './endpoints'

export interface ComposeEmailPayload {
  email_data: string
  file?: File | null
}

/** Send composed email */
export const sendEmail = async (payload: ComposeEmailPayload) => {
  const form = new FormData()
  form.append('email_data', payload.email_data)
  if (payload.file) form.append('file', payload.file)
  const { data } = await axios.post(API.compose, form)
  return data
}
