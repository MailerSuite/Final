export type ApiStatus = 'not_listed' | 'listed' | 'error'
export type UiStatus = 'clear' | 'listed' | 'error'

export function mapStatus(status: ApiStatus): UiStatus {
  switch (status) {
    case 'listed':
      return 'listed'
    case 'not_listed':
      return 'clear'
    default:
      return 'error'
  }
}
