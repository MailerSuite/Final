import React from 'react'
import { colorTokens, radiusTokens } from './tokens'

export const applyClientTheme = (root: HTMLElement = document.documentElement) => {
    root.style.setProperty('--background', colorTokens.background)
    root.style.setProperty('--foreground', colorTokens.foreground)
    root.style.setProperty('--primary', colorTokens.primary)
    root.style.setProperty('--secondary', colorTokens.secondary)
    root.style.setProperty('--accent', colorTokens.accent)
    root.style.setProperty('--muted', colorTokens.muted)
    root.style.setProperty('--border', colorTokens.border)
    root.style.setProperty('--input', colorTokens.input)
    root.style.setProperty('--ring', colorTokens.ring)

    root.style.setProperty('--radius', radiusTokens.md)
}

interface ClientThemeProviderProps {
    children: React.ReactNode
}

export const ClientThemeProvider: React.FC<ClientThemeProviderProps> = ({ children }) => {
    React.useEffect(() => {
        applyClientTheme()
    }, [])
    return <>{children}</>
}

