import { useMemo } from "react"
import { useLocation } from "react-router-dom"

export type Breadcrumb = { label: string; href?: string }

const LABEL_MAP: Record<string, string> = {
    "finalui2": "FinalUI2",
    "admin": "Admin",
    "client": "Client",
    "auth": "Auth",
    "login": "Login",
    "sign-up": "Sign Up",
    "forgot": "Forgot Password",
    "verify-2fa": "Verify 2FA",
    "status": "Status",
    "pricing": "Pricing",
    "contact": "Contact",
}

export function useBreadcrumbs(rootHref: string = "/"): Breadcrumb[] {
    const { pathname } = useLocation()

    return useMemo(() => {
        if (!pathname) return []
        const segments = pathname.split("/").filter(Boolean)

        const trail: Breadcrumb[] = []
        // Always start with Home if not at root
        if (pathname !== "/") {
            trail.push({ label: "Home", href: rootHref })
        }

        let cumulative = ""
        segments.forEach((seg, index) => {
            cumulative += `/${seg}`
            const isLast = index === segments.length - 1
            const label = LABEL_MAP[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
            trail.push({ label, href: isLast ? undefined : cumulative })
        })

        return trail
    }, [pathname, rootHref])
}

export default useBreadcrumbs

