import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../auth'

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useAuthStore.getState().logout()
    })
  })

  it('handles login flow', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.setToken('test-token')
      result.current.setUserData({ id: '1', email: 'test@example.com' } as any)
    })
    
    expect(result.current.token).toBe('test-token')
    expect(result.current.userData).toBeTruthy()
  })

  it('handles logout', () => {
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.setToken('test-token')
    })
    
    expect(result.current.token).toBe('test-token')
    
    act(() => {
      result.current.logout()
    })
    
    expect(result.current.token).toBeNull()
    expect(result.current.userData).toBeNull()
  })

  it('tracks login attempts', () => {
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.incrementLoginAttempts()
    })
    
    expect(result.current.loginAttempts).toBe(1)
    
    act(() => {
      result.current.resetLoginAttempts()
    })
    
    expect(result.current.loginAttempts).toBe(0)
  })

  it('detects account lockout', () => {
    const { result } = renderHook(() => useAuthStore())
    
    // Simulate 5 failed attempts
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.incrementLoginAttempts()
      })
    }
    
    expect(result.current.isAccountLocked()).toBe(true)
  })
}) 