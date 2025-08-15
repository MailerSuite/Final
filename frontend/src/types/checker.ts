export interface CheckerTableProps<T> {
  data: T[]
  isLoading: boolean
  onRefresh?: () => void
  autoRefreshInterval?: number
}
