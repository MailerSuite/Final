import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { listSessions, createSession, SESSIONS_KEY } from "@/api/sessions";
import * as sessionService from '@/services/sessionService'
import { queryClient } from '@/queryClient'
import {
    getActiveProxy as fetchActiveProxyApi,
    setActiveProxy as updateActiveProxyApi,
} from "@/api/proxies";
import type { ProxyServer } from "@/types/proxy";
import type { Session as SessionType } from "@/types";

interface Session {
    sessions: SessionType[] | null
    session: SessionType | null
    activeProxy: ProxyServer | null
    isLoading: boolean
    removeLoading: boolean
    apiErrorCount: number
    lastApiError: Date | null
    isApiDown: boolean
    setSessions: (sessions: SessionType[]) => void
    setSession: (session: SessionType) => void
    addSession: (name: string) => void
    getSessions: (abortSignal?: AbortSignal) => void
    removeSession: (id: string) => void
    getActiveProxy: (sessionId: string) => void
    setActiveProxy: (
        sessionId: string,
        proxyId: string,
        firewallEnabled: boolean
    ) => void
    resetApiErrorState: () => void
    canMakeApiCall: () => boolean
}

const useSessionStore = create<Session>()(
    persist(
        (set, get) => ({
            sessions: null,
            session: null,
            activeProxy: null,
            isLoading: false,
            removeLoading: false,
            apiErrorCount: 0,
            lastApiError: null,
            isApiDown: false,
            setSessions: (sessions) => set({ sessions }),
            setSession: (session) => set({ session }),
            // Add session
            addSession: async (name: string) => {
                try {
                    const data = await createSession(name)
                    const existing = get().sessions || []
                    if (!existing.find((s) => s.id === data.id)) {
                        set({ sessions: [...existing, data] })
                    }
                } catch (error: unknown) {
                    const message = error?.response?.data?.error || "Invalid credentials. Please try again."
                    toast.error(message)
                    // Add session error
                }
            },
            // Fetch sessions
            getSessions: async (abortSignal?: AbortSignal) => {
                if (abortSignal?.aborted) {
                    return;
                }

                // Check if we can make API calls (circuit breaker)
                if (!get().canMakeApiCall()) {
                    console.warn("API is down, skipping getSessions request");
                    return;
                }
                
                set({ isLoading: true })
                try {
                    const data = await listSessions()
                    
                    // Check if aborted before setting state
                    if (abortSignal?.aborted) {
                        return;
                    }
                    
                    set({ sessions: data })
                    const current = get().session
                    if (current) {
                        const found = data.find((s) => s.id === current.id)
                        set({ session: found || data[0] || null })
                    } else {
                        set({ session: data[0] || null })
                    }
                    
                    // Reset API error state on successful request
                    get().resetApiErrorState();
                } catch (error: unknown) {
                    // Ignore AbortError - it's intentional
                    if (error.name === 'AbortError' || abortSignal?.aborted) {
                        console.debug("Sessions request was aborted (intentional)");
                        return;
                    }
                    
                    // Don't clear sessions on auth errors - keep existing data
                    if (error?.response?.status === 401 || error?.response?.status === 403) {
                        console.debug("Sessions request failed due to authentication - keeping existing data");
                        return;
                    }
                    
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
                    } else {
                        set({ sessions: null })
                        const message = error?.response?.data?.error || "Invalid credentials. Please try again."
                        // Fetch session error
                    }
                } finally {
                    // Only clear loading if not aborted
                    if (!abortSignal?.aborted) {
                        set({ isLoading: false })
                    }
                }
            },
            // Delete session
            removeSession: async (id) => {
                try {
                    const res = await sessionService.deleteSession(id)
                    queryClient.invalidateQueries({ queryKey: SESSIONS_KEY })
                    set((state) => {
                        const remaining = state.sessions?.filter((s) => s.id !== id) || null
                        return {
                            sessions: remaining,
                            session:
                                state.session && state.session.id === id
                                    ? remaining?.[0] || null
                                    : state.session,
                        }
                    })
                    toast.success(res.detail)
                } catch (error: unknown) {
                    const message = error?.response?.data?.detail || "Something went wrong. Please try again"
                    toast.error(message)
                    // Delete session error
                }
            },
            getActiveProxy: async (sessionId: string) => {
                try {
                    const data = await fetchActiveProxyApi(sessionId)
                    set({ activeProxy: data })
                } catch (error: unknown) {
                    // Fetch active proxy error
                    set({ activeProxy: null })
                }
            },
            setActiveProxy: async (
                sessionId: string,
                proxyId: string,
                firewallEnabled: boolean,
            ) => {
                try {
                    const data = await updateActiveProxyApi(sessionId, proxyId)
                    if (data) {
                        set({
                            activeProxy: {
                                ...data,
                                is_firewall_enabled: firewallEnabled,
                                firewall_on: data.firewall_on ?? firewallEnabled,
                            },
                        })
                    } else {
                        set({ activeProxy: null })
                    }
                } catch (error: unknown) {
                    const message = error?.response?.data?.detail || 'Failed to set active proxy'
                    toast.error(message)
                    // Set active proxy error
                }
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
        }),
        {
            name: "session-storage",
            partialize: (state) => ({
                session: state.session,
                sessions: state.sessions,
                activeProxy: state.activeProxy,
            }),
        }
    ))

export default useSessionStore
export { useSessionStore }
