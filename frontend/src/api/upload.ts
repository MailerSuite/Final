import axios from '@/http/axios'
import { API } from './endpoints'

/** Upload a single file */
export const uploadFile = async (file: File) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axios.post('/upload', form)
  return data
}

/** Upload multiple files */
export const uploadFiles = async (files: File[]) => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const { data } = await axios.post('/upload/multiple', form)
  return data
}

/** Fetch template test history */
export const getTemplateHistory = async () => {
  const { data } = await axios.get(API.templateHistory)
  return data
}
