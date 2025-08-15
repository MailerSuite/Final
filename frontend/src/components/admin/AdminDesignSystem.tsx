/**
 * Admin Design System - Consistent Design Patterns
 * Standardizes spacing, typography, and layout across all admin components
 */

import { cn } from "@/lib/utils";

// ==================== SPACING SYSTEM ====================
export const ADMIN_SPACING = {
    // Page-level spacing
    page: "p-6",
    pageCompact: "p-4",
    pageWide: "p-8",

    // Section spacing
    section: "space-y-6",
    sectionCompact: "space-y-4",
    sectionWide: "space-y-8",

    // Card spacing
    card: "p-6",
    cardCompact: "p-4",
    cardWide: "p-8",

    // Form spacing
    form: "space-y-4",
    formCompact: "space-y-3",
    formWide: "space-y-6",

    // Button groups
    buttonGroup: "flex gap-3",
    buttonGroupCompact: "flex gap-2",
    buttonGroupWide: "flex gap-4",

    // Grid spacing
    grid: "gap-6",
    gridCompact: "gap-4",
    gridWide: "gap-8",
} as const;

// ==================== TYPOGRAPHY SYSTEM ====================
export const ADMIN_TYPOGRAPHY = {
    // Page headers
    pageTitle: "text-3xl font-bold text-foreground",
    pageSubtitle: "text-lg text-muted-foreground",

    // Section headers
    sectionTitle: "text-xl font-semibold text-foreground",
    sectionSubtitle: "text-sm text-muted-foreground",

    // Card headers
    cardTitle: "text-lg font-semibold text-foreground",
    cardSubtitle: "text-sm text-muted-foreground",

    // Content text
    body: "text-sm text-foreground",
    bodyLarge: "text-base text-foreground",
    caption: "text-xs text-muted-foreground",

    // Status text
    status: "text-sm font-medium",
    statusSuccess: "text-sm font-medium text-green-600",
    statusWarning: "text-sm font-medium text-yellow-600",
    statusError: "text-sm font-medium text-red-600",
} as const;

// ==================== LAYOUT PATTERNS ====================
export const ADMIN_LAYOUT = {
    // Page wrapper
    pageWrapper: cn(ADMIN_SPACING.page, ADMIN_SPACING.section),

    // Header section
    header: "space-y-2",
    headerContent: "flex items-center gap-3",
    headerIcon: "p-2 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg border border-primary/20",
    headerText: "space-y-1",

    // Content sections
    contentSection: cn(ADMIN_SPACING.section),
    contentCard: cn(ADMIN_SPACING.card),

    // Filter sections
    filterSection: cn(ADMIN_SPACING.cardCompact),
    filterContent: "flex gap-4 items-center",

    // Data tables
    tableSection: "space-y-4",
    tableCard: cn(ADMIN_SPACING.cardCompact),
    tableHeader: "flex flex-row items-center justify-between",

    // Stats grid
    statsGrid: cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4", ADMIN_SPACING.grid),
    statsCard: cn(ADMIN_SPACING.card),
    statsContent: "flex items-center gap-4",
    statsIcon: "h-8 w-8",
    statsText: "space-y-1",
    statsValue: "text-2xl font-bold",
    statsLabel: "text-sm text-muted-foreground",

    // Form layouts
    formLayout: cn(ADMIN_SPACING.form),
    formRow: "grid grid-cols-1 md:grid-cols-2 gap-4",
    formFullWidth: "col-span-full",

    // Action areas
    actionArea: "flex items-center justify-between",
    actionLeft: "flex items-center gap-3",
    actionRight: "flex items-center gap-3",
} as const;

// ==================== COMPONENT PATTERNS ====================
export const ADMIN_COMPONENTS = {
    // Badge variants
    badge: {
        status: {
            active: "bg-green-100 text-green-800 border-green-200",
            inactive: "bg-muted text-foreground border-border",
            suspended: "bg-red-100 text-red-800 border-red-200",
            deleted: "bg-muted text-foreground border-border",
        },
        role: {
            user: "bg-blue-100 text-blue-800 border-blue-200",
            moderator: "bg-purple-100 text-purple-800 border-purple-200",
            admin: "bg-orange-100 text-orange-800 border-orange-200",
            super_admin: "bg-red-100 text-red-800 border-red-200",
        },
    },

    // Button variants
    button: {
        primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
        secondary: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
    },

    // Card variants
    card: {
        default: "bg-card border border-border dark:border-border/50 shadow-sm",
        elevated: "bg-card border border-border dark:border-border/50 shadow-md",
        interactive: "bg-card border border-border dark:border-border/50 shadow-sm hover:shadow-md transition-shadow",
    },
} as const;

// ==================== UTILITY FUNCTIONS ====================
export const adminClassNames = {
    // Page layouts
    page: (variant: keyof typeof ADMIN_SPACING = "page") =>
        cn(ADMIN_SPACING[variant], ADMIN_SPACING.section),

    // Headers
    header: () => ADMIN_LAYOUT.header,
    headerContent: () => ADMIN_LAYOUT.headerContent,
    headerIcon: () => ADMIN_LAYOUT.headerIcon,
    headerText: () => ADMIN_LAYOUT.headerText,

    // Content
    content: (variant: keyof typeof ADMIN_SPACING = "section") =>
        ADMIN_LAYOUT.contentSection,
    card: (variant: keyof typeof ADMIN_SPACING = "card") =>
        ADMIN_LAYOUT.contentCard,

    // Filters
    filters: () => ADMIN_LAYOUT.filterSection,
    filterContent: () => ADMIN_LAYOUT.filterContent,

    // Tables
    tableSection: () => ADMIN_LAYOUT.tableSection,
    tableCard: () => ADMIN_LAYOUT.tableCard,
    tableHeader: () => ADMIN_LAYOUT.tableHeader,

    // Stats
    statsGrid: () => ADMIN_LAYOUT.statsGrid,
    statsCard: () => ADMIN_LAYOUT.statsCard,
    statsContent: () => ADMIN_LAYOUT.statsContent,
    statsIcon: () => ADMIN_LAYOUT.statsIcon,
    statsText: () => ADMIN_LAYOUT.statsText,
    statsValue: () => ADMIN_LAYOUT.statsValue,
    statsLabel: () => ADMIN_LAYOUT.statsLabel,

    // Forms
    form: (variant: keyof typeof ADMIN_SPACING = "form") =>
        ADMIN_LAYOUT.formLayout,
    formRow: () => ADMIN_LAYOUT.formRow,
    formFullWidth: () => ADMIN_LAYOUT.formFullWidth,

    // Actions
    actionArea: () => ADMIN_LAYOUT.actionArea,
    actionLeft: () => ADMIN_LAYOUT.actionLeft,
    actionRight: () => ADMIN_LAYOUT.actionRight,
} as const;

// ==================== ICON PATTERNS ====================
export const ADMIN_ICONS = {
    // Common admin icons with consistent sizing
    size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
    },

    // Icon colors for different contexts
    color: {
        primary: "text-primary",
        secondary: "text-secondary",
        muted: "text-muted-foreground",
        success: "text-green-600",
        warning: "text-yellow-600",
        error: "text-red-600",
        info: "text-blue-600",
    },
} as const;

export default {
    spacing: ADMIN_SPACING,
    typography: ADMIN_TYPOGRAPHY,
    layout: ADMIN_LAYOUT,
    components: ADMIN_COMPONENTS,
    classNames: adminClassNames,
    icons: ADMIN_ICONS,
}; 