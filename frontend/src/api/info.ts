import axios from '@/http/axios'

/** Root API information */
export const rootInfo = async () => {
  const { data } = await axios.get<{ message: string }>('/')
  return data
}
