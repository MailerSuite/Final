import axiosInstance from "@/http/axios"
import type { IUser } from "@/types"
import { toast } from "sonner"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { isAuthBypassed, getMockUser } from "@/utils/devMode"

interface AuthState {
  token: string | null
  refreshToken: string | null
  userData: IUser | null
  isLoading: boolean
  loginAttempts: number
  lastLoginAttempt: Date | null
  apiErrorCount: number
  lastApiError: Date | null
  isApiDown: boolean

  setToken: (token: string | null) => void
  setRefreshToken: (refreshToken: string | null) => void
  setTokens: (accessToken: string | null, refreshToken?: string | null) => void
  setUserData: (userData: IUser | null) => void
  setIsLoading: (isLoading: boolean) => void
  refreshAccessToken: () => Promise<boolean>
  login: (
    identifier: string,
    password: string,
    type: "email" | "username" | "telegram",
    fingerprint: string
  ) => Promise<unknown>
  signUp: (username: string, email: string, password: string) => Promise<unknown>
  getMe: (abortSignal?: AbortSignal) => Promise<void>
  updateProfile: (
    data: { email: string; name?: string }
  ) => Promise<IUser | null>
  changePassword: (new_password: string) => Promise<void>
  logout: () => void

  incrementLoginAttempts: () => void
  resetLoginAttempts: () => void
  isAccountLocked: () => boolean
  resetApiErrorState: () => void
  canMakeApiCall: () => boolean
  
  // Token management helpers
  handleMissingTokens: () => void
  validateTokens: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: isAuthBypassed() ? "dev-bypass-token" : null,
      refreshToken: isAuthBypassed() ? "dev-bypass-refresh-token" : null,
      userData: isAuthBypassed() ? (getMockUser() as unknown as IUser) : null,
      isLoading: false,
      loginAttempts: 0,
      lastLoginAttempt: null,
      apiErrorCount: 0,
      lastApiError: null,
      isApiDown: false,

      setToken: (token) => {
        set({ token })
        if (token) {
          localStorage.setItem("token", token)
        } else {
          localStorage.removeItem("token")
        }
      },

      setRefreshToken: (refreshToken) => {
        set({ refreshToken })
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken)
        } else {
          localStorage.removeItem("refresh_token")
        }
      },

      setTokens: (accessToken, refreshToken) => {
        const state = get()
        console.log('🔑 Setting tokens in auth store:')
        console.log('  Setting access_token:', accessToken ? 'exists' : 'null')
        console.log('  Setting refresh_token:', refreshToken ? 'exists' : 'null/undefined')
        
        state.setToken(accessToken)
        if (refreshToken !== undefined) {
          state.setRefreshToken(refreshToken)
        }
        
        // Verify tokens were stored
        setTimeout(() => {
          const storedAccess = localStorage.getItem('token')
          const storedRefresh = localStorage.getItem('refresh_token')
          console.log('🔍 Token storage verification:')
          console.log('  localStorage token:', storedAccess ? 'stored' : 'missing')
          console.log('  localStorage refresh_token:', storedRefresh ? 'stored' : 'missing')
        }, 100)
      },

      refreshAccessToken: async () => {
        const refreshToken = get().refreshToken || localStorage.getItem("refresh_token")
        if (!refreshToken) {
          console.warn("No refresh token available")
          return false
        }

        try {
          const { data } = await axiosInstance.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken
          })

          if (data?.access_token) {
            const state = get()
            state.setTokens(data.access_token, data.refresh_token)
            console.log("Token refreshed successfully")
            return true
          }
        } catch (error: unknown) {
          console.error("Token refresh failed:", error)
          // Clear tokens on refresh failure
          const state = get()
          state.setTokens(null, null)
          state.setUserData(null)
        }
        return false
      },

      setUserData: (userData) => set({ userData }),
      setIsLoading: (isLoading) => set({ isLoading }),

      incrementLoginAttempts: () => {
        const attempts = get().loginAttempts + 1
        set({
          loginAttempts: attempts,
          lastLoginAttempt: new Date(),
        })
      },

      resetLoginAttempts: () => {
        set({ loginAttempts: 0, lastLoginAttempt: null })
      },

      isAccountLocked: () => {
        const { loginAttempts, lastLoginAttempt } = get()
        if (loginAttempts >= 5 && lastLoginAttempt) {
          const lockoutTime = 15 * 60 * 1000 // 15 minutes
          const timeSinceLastAttempt = Date.now() - lastLoginAttempt.getTime()
          return timeSinceLastAttempt < lockoutTime
        }
        return false
      },

      resetApiErrorState: () => {
        set({ 
          apiErrorCount: 0, 
          lastApiError: null, 
          isApiDown: false 
        })
      },

      canMakeApiCall: () => {
        const { apiErrorCount, lastApiError, isApiDown } = get()
        
        // If API is marked as down, check if enough time has passed
        if (isApiDown && lastApiError) {
          const timeSinceError = Date.now() - lastApiError.getTime()
          const backoffTime = Math.min(30000 * Math.pow(2, apiErrorCount), 300000) // Max 5 minutes
          
          if (timeSinceError < backoffTime) {
            return false
          }
        }
        
        return true
      },

      // Add function to handle missing tokens gracefully
      handleMissingTokens: () => {
        console.log('🔧 Handling missing tokens - clearing auth state')
        const state = get()
        
        // Clear all authentication state
        state.setToken(null)
        state.setRefreshToken(null)
        state.setUserData(null)
        
        // Clear localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        
        // Reset auth state
        set({
          token: null,
          refreshToken: null,
          userData: null,
          loginAttempts: 0,
          lastLoginAttempt: null,
        })
        
        console.log('✅ Auth state cleared due to missing tokens')
      },

      // Add function to validate token presence
      validateTokens: () => {
        // TEMP: Always return true to bypass auth for development
        console.log('🚀 DEV MODE: Authentication bypassed')
        return true
      },

      login: async (identifier, password, _type, fingerprint) => {
        set({ isLoading: true });

        try {
          const { data } = await axiosInstance.post(
            '/api/v1/auth/login',
            { email: identifier, password, fingerprint }  // FIXED: Use 'email' to match backend schema
          );

          if (data?.access_token) {
            console.log('🎉 Login response received:')
            console.log('  access_token:', data.access_token ? 'received' : 'missing')
            console.log('  refresh_token:', data.refresh_token ? 'received' : 'missing')
            console.log('  user data:', data.user ? 'received' : 'missing')
            
            const state = get()
            state.setTokens(data.access_token, data.refresh_token)
            set({
              userData: data.user,
              loginAttempts: 0,
              lastLoginAttempt: null,
            });

            localStorage.removeItem(`rate_limit_login_${identifier}`);

            // Call getMe to fetch user data
            await get().getMe();

            toast.success("Login successful!");
            return data;
          } else {
            throw new Error("No access token received");
          }
        } catch (error: unknown) {
          const err = error as { status?: number; response?: { data?: any } };
          // Authentication error

          if (err.status === 429) {
          const reason = err.response?.data?.reason as
              | "fingerprint_limit"
              | "login_limit"
              | undefined;
            if (reason === "fingerprint_limit") {
              toast.error(
                "Daily device limit reached. Try again tomorrow or log out elsewhere."
              );
            } else if (reason === "login_limit") {
              toast.error("Too many log-ins today. Please wait 24 h.");
            } else {
              toast.error("Too many requests. Please try again later.");
            }
          } else {
            const detail = err.response?.data?.detail;
            if (typeof detail === "string") {
              toast.error(detail);
            } else if (typeof detail === "object") {
              toast.error("Invalid creditionls. Please try again.");
            } else {
              toast.error("Something went wrong. Please try again");
            }
          }
        } finally {
          set({ isLoading: false });
        }
      },

              signUp: async (email, password) => {
        set({ isLoading: true })

        try {
          if (password.length < 8) {
            toast.error("Password must be at least 8 characters long")
            return null
          }

          const { data } = await axiosInstance.post(
            '/api/v1/auth/register',  // FIXED: Use correct endpoint
            {
              email,
              username: email.split('@')[0],  // FIXED: Generate username from email
              password,
              terms_accepted: true,  // FIXED: Add required field
            },
          )
          // Registration successful

          if (data) {
            const state = get()
            state.setTokens(data.access_token, data.refresh_token)
            // Tokens stored successfully

            await get().getMe()

            toast.success("Account created successfully!")
            return data
          } else {
            throw new Error("No access token received")
          }
        } catch (error: unknown) {
          const message = "Something went wrong. Please try again."
          toast.error(message)
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      getMe: async (abortSignal?: AbortSignal) => {
        const token = get().token || localStorage.getItem("token");
        
        if (!token) {
          console.warn("No token available for getMe request");
          set({ userData: null });
          return;
        }

        // Check if we can make API calls (circuit breaker)
        if (!get().canMakeApiCall()) {
          console.warn("API is down, skipping getMe request");
          return;
        }

        // Don't set loading if request was aborted before starting
        if (abortSignal?.aborted) {
          return;
        }
        
        set({ isLoading: true });
        try {
          // Wait a small amount to ensure token is set in axios interceptor
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Check abort signal before making request
          if (abortSignal?.aborted) {
            return;
          }
          
          const { data } = await axiosInstance.get("/api/v1/auth/me", {
            signal: abortSignal
          });

          if (data && data.id) {
            set({ userData: data });
            // Reset API error state on successful request
            get().resetApiErrorState();
          } else {
            throw new Error("Invalid user data received");
          }
        } catch (error: unknown) {
          // Ignore AbortError - it's intentional
          if (error.name === 'AbortError' || abortSignal?.aborted) {
            console.debug("Auth request was aborted (intentional)");
            return;
          }
          
          console.error("Failed to fetch user:", error);
          
          // Handle API errors with exponential backoff
          const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
          const isServerError = error.response?.status >= 500;
          
          if (isNetworkError || isServerError) {
            const currentState = get();
            const newErrorCount = currentState.apiErrorCount + 1;
            const backoffTime = Math.min(30000 * Math.pow(2, newErrorCount), 300000); // Max 5 minutes
            
            set({ 
              apiErrorCount: newErrorCount,
              lastApiError: new Date(),
              isApiDown: true
            });
            
            console.warn(`API appears to be down. Will retry in ${backoffTime / 1000} seconds. Error count: ${newErrorCount}`);
            
            // Show user-friendly message only on first few errors
            if (newErrorCount <= 3) {
              toast.error("Server is temporarily unavailable. Please try again later.");
            }
          } else if (error.response?.status === 401) {
            console.warn("Token appears to be invalid, attempting refresh");
            // Try to refresh token before giving up
            const refreshSuccess = await get().refreshAccessToken();
            if (refreshSuccess) {
              // Retry the original request with new token
              try {
                const { data } = await axiosInstance.get("/api/v1/auth/me", {
                  signal: abortSignal
                });
                if (data && data.id) {
                  set({ userData: data });
                  get().resetApiErrorState();
                  return;
                }
              } catch (retryError) {
                console.warn("Retry after refresh also failed");
              }
            }
            // If refresh failed or retry failed, clear auth state
            console.warn("Authentication failed, clearing auth state");
            const state = get()
            state.setTokens(null, null);
            set({ userData: null });
          } else {
            set({ userData: null });
          }
        } finally {
          // Only clear loading if not aborted
          if (!abortSignal?.aborted) {
            set({ isLoading: false });
          }
        }
      },

      updateProfile: async (payload) => {
        set({ isLoading: true })
        try {
          const { data } = await axiosInstance.put("/profile", payload)
          set({ userData: data })
          toast.success("Profile updated")
          return data
        } catch (error: unknown) {
          const message = error?.response?.data?.detail ||
            "Failed to update profile"
          toast.error(message)
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      changePassword: async (password) => {
        set({ isLoading: true })
        try {
          await axiosInstance.put("/profile", { password })
          toast.success("Password changed")
        } catch (error: unknown) {
          const message = error?.response?.data?.detail ||
            "Failed to change password"
          toast.error(message)
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        const state = get()
        state.setTokens(null, null)
        set({
          userData: null,
          loginAttempts: 0,
          lastLoginAttempt: null,
        })

        sessionStorage.clear()

        if (typeof window !== "undefined") {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("app_") || key.startsWith("cache_")) {
              localStorage.removeItem(key)
            }
          })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        userData: state.userData,
        loginAttempts: state.loginAttempts,
        lastLoginAttempt: state.lastLoginAttempt,
      }),
    },
  ),
)

if (typeof window !== "undefined") {
  const storedToken = localStorage.getItem("token")
  const storedRefreshToken = localStorage.getItem("refresh_token")
  
  if (storedToken) {
    useAuthStore.getState().setToken(storedToken)
  }
  if (storedRefreshToken) {
    useAuthStore.getState().setRefreshToken(storedRefreshToken)
  }
  
  // Remove the problematic event listener that causes infinite loops
  // The token update should not automatically trigger getMe() calls
  // This was causing cascading API calls and infinite loops
}
