# 🎨 Client UI Kit - Professional Email Marketing Interface

> Deprecated notice: For shared primitives (Button, Card, Tabs, Dialog, etc.) import from `@/components/base-ui`. This kit remains for specialized client-only components and examples.

**Professional client-facing UI kit built with shadcn/ui, TypeScript, and Framer Motion**

---

## 🚀 **Overview**

The Client UI Kit provides a comprehensive set of components specifically designed for client-facing interfaces in the SGPT email marketing platform. It mirrors the structure and quality of the AdminUIKit while being optimized for user experiences like campaign management, analytics, and account settings.

### ✨ **Key Features**

- ✅ **Modern Design** with dark/grey/red theme (SGPT brand colors)
- ✅ **Smooth Animations** powered by Framer Motion
- ✅ **Real-time Updates** for campaigns and metrics
- ✅ **Responsive Design** for all devices
- ✅ **Full TypeScript Support** with comprehensive type definitions
- ✅ **Accessibility First** with ARIA support
- ✅ **Performance Optimized** with lazy loading and memoization
- ✅ **Theme Switching** support (red, blue, green, purple, black)

---

## 📦 **Installation & Setup**

```bash
# Install dependencies (if not already installed)
npm install framer-motion lucide-react
npm install @radix-ui/react-* # shadcn/ui components
```

### Import Components

```typescript
// Basic components
import {
  ClientPageHeader,
  ClientMetricCard,
  ClientStatus,
  ClientActionCard,
  ClientGrid,
  ClientSection,
  ClientQuickStats,
  ClientThemeProvider,
} from "@/components/client/ClientUIKit";

// Enhanced components
import {
  RealTimeCampaignCard,
  AnalyticsOverviewCard,
  ClientQuickActions,
  ClientNotificationCenter,
  ClientPerformanceMonitor,
} from "@/components/client/EnhancedClientComponents";
```

---

## 🧩 **Core Components**

### 1. **ClientPageHeader**

Professional page headers with breadcrumbs, actions, and badges.

```typescript
<ClientPageHeader
  title="Campaign Dashboard"
  description="Monitor and manage your email campaigns with real-time analytics"
  badge={{
    text: "LIVE MONITORING",
    variant: "default",
    pulse: true,
  }}
  breadcrumbs={[
    { label: "Dashboard" },
    { label: "Campaigns" },
    { label: "Campaign Analytics" },
  ]}
  actions={
    <div className="flex gap-2">
      <Button variant="outline">Export Data</Button>
      <Button>New Campaign</Button>
    </div>
  }
  showBackButton
  onBack={() => navigate(-1)}
/>
```

**Props:**

- `title` (string) - Page title
- `description?` (string) - Page description
- `badge?` (object) - Badge configuration with pulse animation
- `actions?` (ReactNode) - Action buttons or elements
- `breadcrumbs?` (array) - Navigation breadcrumbs
- `showBackButton?` (boolean) - Show back navigation
- `onBack?` (function) - Back button handler

---

### 2. **ClientMetricCard**

Interactive metric cards with trends, targets, and loading states.

```typescript
<ClientMetricCard
  title="Emails Sent Today"
  value="12,547"
  description="Across 8 active campaigns"
  trend={{
    type: "up",
    value: "+12.3%",
    period: "vs yesterday",
  }}
  icon={<Mail className="h-4 w-4" />}
  status="success"
  target={{
    current: 12547,
    goal: 15000,
    label: "Daily Goal",
  }}
  onClick={() => navigateTo("/campaigns")}
  loading={false}
/>
```

**Props:**

- `title` (string) - Metric title
- `value` (string | number) - Main metric value
- `description?` (string) - Additional context
- `trend?` (object) - Trend indicator with direction and value
- `icon?` (ReactNode) - Icon component
- `status?` (string) - Visual status indicator
- `target?` (object) - Progress tracking
- `onClick?` (function) - Click handler
- `loading?` (boolean) - Loading state

---

### 3. **ClientStatus**

Status indicators with pulse animations and multiple sizes.

```typescript
<ClientStatus
  status="active"
  label="Campaign Running"
  description="Sending emails to 5,000 subscribers"
  showPulse={true}
  size="md"
/>
```

**Status Types:**

- `active` - Green, for running campaigns
- `inactive` - Gray, for stopped/paused
- `pending` - Yellow, for scheduled campaigns
- `error` - Red, for failed operations
- `success` - Green, for completed actions
- `warning` - Yellow, for attention needed

---

### 4. **ClientActionCard**

Interactive action cards with progress tracking and status feedback.

```typescript
<ClientActionCard
  title="Create New Campaign"
  description="Launch a new email marketing campaign with our wizard"
  icon={<Plus className="h-6 w-6" />}
  action={{
    label: "Start Campaign",
    onClick: handleCreateCampaign,
    variant: "default",
    loading: isCreating,
  }}
  secondaryAction={{
    label: "Learn More",
    onClick: openDocumentation,
  }}
  status="idle"
  progress={75}
/>
```

---

### 5. **ClientGrid**

Responsive grid layouts with staggered animations.

```typescript
<ClientGrid columns={3} gap="md">
  <ClientMetricCard title="Sent" value="1,247" />
  <ClientMetricCard title="Delivered" value="1,189" />
  <ClientMetricCard title="Opened" value="445" />
</ClientGrid>
```

**Grid Configurations:**

- `columns`: 1-6 columns with responsive breakpoints
- `gap`: "sm" | "md" | "lg" | "xl"

---

### 6. **ClientSection**

Collapsible content sections with headers and actions.

```typescript
<ClientSection
  title="Campaign Performance"
  description="Real-time metrics and analytics for your campaigns"
  actions={
    <Button variant="outline" size="sm">
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh
    </Button>
  }
  collapsible={true}
  defaultExpanded={true}
>
  <ClientGrid columns={4} gap="md">
    {/* Metric cards */}
  </ClientGrid>
</ClientSection>
```

---

### 7. **ClientQuickStats**

Compact statistics display for dashboard overviews.

```typescript
<ClientQuickStats
  stats={[
    {
      label: "Active Campaigns",
      value: "8",
      icon: <Target className="h-4 w-4" />,
      color: "primary",
      trend: { type: "up", value: "+2" },
    },
    {
      label: "Total Subscribers",
      value: "24.5K",
      icon: <Users className="h-4 w-4" />,
      color: "success",
      trend: { type: "up", value: "+1.2K" },
    },
    {
      label: "This Month Revenue",
      value: "$12,450",
      icon: <DollarSign className="h-4 w-4" />,
      color: "info",
      trend: { type: "up", value: "+8.3%" },
    },
  ]}
/>
```

---

## 🔥 **Enhanced Components**

### 1. **RealTimeCampaignCard**

Live campaign monitoring with real-time metric updates.

```typescript
<RealTimeCampaignCard
  title="Summer Promotion 2024"
  campaignId="CMP-2024-001"
  status="running"
  metrics={{
    sent: 5420,
    delivered: 5180,
    opened: 1245,
    clicked: 187,
    bounced: 240,
  }}
  progress={68}
  estimatedCompletion="2 hours remaining"
  updateInterval={5000}
  onStatusChange={(newStatus) => updateCampaignStatus(newStatus)}
/>
```

**Features:**

- Real-time metric updates
- Campaign control buttons (play/pause/stop)
- Live indicator with pulse animation
- Delivery, open, and click rate calculations
- Progress tracking with time estimates

---

### 2. **AnalyticsOverviewCard**

Comprehensive analytics with time range selection and trend analysis.

```typescript
<AnalyticsOverviewCard
  title="Performance Overview"
  timeRange="30d"
  data={[
    {
      current: 12547,
      previous: 10234,
      label: "Total Sent",
      format: "number",
    },
    {
      current: 4567.89,
      previous: 3890.12,
      label: "Revenue",
      format: "currency",
    },
    {
      current: 23.4,
      previous: 19.8,
      label: "Open Rate",
      format: "percentage",
    },
  ]}
  chartData={chartDataPoints}
  onTimeRangeChange={(range) => fetchAnalytics(range)}
/>
```

---

### 3. **ClientQuickActions**

Grid of action cards for common user tasks.

```typescript
<ClientQuickActions
  actions={[
    {
      title: "Create Campaign",
      description: "Launch a new email marketing campaign",
      icon: <Plus className="h-6 w-6" />,
      onClick: () => navigate("/campaigns/create"),
      badge: "Popular",
    },
    {
      title: "View Analytics",
      description: "Check your campaign performance",
      icon: <BarChart3 className="h-6 w-6" />,
      onClick: () => navigate("/analytics"),
    },
    {
      title: "Manage Lists",
      description: "Organize your subscriber lists",
      icon: <Users className="h-6 w-6" />,
      onClick: () => navigate("/lists"),
    },
    {
      title: "Account Settings",
      description: "Update your account preferences",
      icon: <Settings className="h-6 w-6" />,
      onClick: () => navigate("/settings"),
      disabled: !hasPermission,
    },
  ]}
/>
```

---

### 4. **ClientNotificationCenter**

Real-time notification management with read/unread states.

```typescript
<ClientNotificationCenter
  notifications={[
    {
      id: "notif-001",
      type: "success",
      title: "Campaign Completed",
      message: "Your 'Summer Sale' campaign has finished successfully",
      timestamp: new Date(),
      read: false,
      actionLabel: "View Report",
      onAction: () => viewCampaignReport("CMP-001"),
    },
    {
      id: "notif-002",
      type: "warning",
      title: "Low Credit Balance",
      message: "Your account balance is running low",
      timestamp: new Date(Date.now() - 3600000),
      read: true,
      actionLabel: "Add Credits",
      onAction: () => navigate("/billing"),
    },
  ]}
  onMarkAsRead={(id) => markNotificationAsRead(id)}
  onMarkAllAsRead={() => markAllNotificationsAsRead()}
/>
```

---

### 5. **ClientPerformanceMonitor**

System performance monitoring with live metrics.

```typescript
<ClientPerformanceMonitor
  metrics={{
    emailsSentToday: 12547,
    deliveryRate: 94.2,
    openRate: 23.8,
    clickRate: 4.1,
    activeConnections: 8,
    systemLoad: 34,
  }}
  updateInterval={10000}
/>
```

---

## 🎨 **Theme System**

### Theme Provider

Wrap your application with the theme provider:

```typescript
<ClientThemeProvider theme="red">
  <YourApp />
</ClientThemeProvider>
```

### Available Themes

- **red** (default) - SGPT brand red theme
- **blue** - Professional blue theme
- **green** - Success/growth focused theme
- **purple** - Creative/premium theme
- **black** - Minimal monochrome theme

### Custom Theme Switching

```typescript
const [currentTheme, setCurrentTheme] = useState<'red' | 'blue' | 'green' | 'purple' | 'black'>('red');

<div className="flex gap-2 mb-4">
  {['red', 'blue', 'green', 'purple', 'black'].map((theme) => (
    <Button
      key={theme}
      size="sm"
      variant={currentTheme === theme ? "default" : "outline"}
      onClick={() => setCurrentTheme(theme)}
      className="capitalize"
    >
      {theme}
    </Button>
  ))}
</div>

<ClientThemeProvider theme={currentTheme}>
  <YourClientInterface />
</ClientThemeProvider>
```

---

## 🎬 **Animation System**

### Available Animations

```typescript
import { clientAnimations } from '@/components/client/ClientUIKit';

// Page-level animations
<motion.div {...clientAnimations.pageContainer}>
  {/* Staggered children animations */}
</motion.div>

// Card animations
<motion.div {...clientAnimations.cardStagger}>
  {/* Individual card with entrance animation */}
</motion.div>

// Interactive animations
<motion.div {...clientAnimations.pulse}>
  {/* Breathing pulse effect */}
</motion.div>

<motion.div {...clientAnimations.float}>
  {/* Floating animation */}
</motion.div>

<motion.div {...clientAnimations.glow}>
  {/* Glow effect for important elements */}
</motion.div>
```

### Custom Animations

```typescript
const customVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

<motion.div variants={customVariants} initial="initial" animate="animate">
  <ClientMetricCard {...props} />
</motion.div>;
```

---

## 📱 **Responsive Design**

All components are mobile-first and responsive:

```typescript
// Grid automatically adjusts
<ClientGrid columns={4} gap="md">
  {/* 4 columns on desktop, 2 on tablet, 1 on mobile */}
</ClientGrid>

// Manual responsive control
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Custom responsive grid */}
</div>
```

### Breakpoints

- **Mobile**: < 640px (1 column)
- **Tablet**: 640px - 1024px (2 columns)
- **Desktop**: > 1024px (3-4 columns)
- **Large**: > 1280px (4-6 columns)

---

## ⚡ **Performance Optimization**

### Lazy Loading

```typescript
import { lazy, Suspense } from "react";
import { ProfessionalLoader } from "@/components/ui/professional-loader";

const ClientDashboard = lazy(() => import("./ClientDashboard"));

<Suspense fallback={<ProfessionalLoader variant="orbit" size="lg" />}>
  <ClientDashboard />
</Suspense>;
```

### Memoization

```typescript
import { memo, useMemo } from "react";

const MemoizedMetricCard = memo(ClientMetricCard);

const ExpensiveMetrics = ({ data }) => {
  const processedMetrics = useMemo(() => {
    return data.map((item) => calculateComplexMetrics(item));
  }, [data]);

  return (
    <ClientGrid columns={3}>
      {processedMetrics.map((metric) => (
        <MemoizedMetricCard key={metric.id} {...metric} />
      ))}
    </ClientGrid>
  );
};
```

### Virtual Scrolling

For large lists, use the VirtualList component:

```typescript
import { VirtualList } from "@/components/ui/VirtualList";

<VirtualList
  items={campaigns}
  height={400}
  itemHeight={80}
  renderItem={({ item, index }) => (
    <RealTimeCampaignCard key={item.id} {...item} />
  )}
/>;
```

---

## 🔒 **Accessibility**

### ARIA Support

All components include proper ARIA attributes:

```typescript
<ClientStatus
  status="active"
  label="Campaign Running"
  aria-label="Campaign status: Active and running"
  role="status"
  aria-live="polite"
/>
```

### Keyboard Navigation

```typescript
<ClientActionCard
  title="Create Campaign"
  description="Start a new email campaign"
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleAction();
    }
  }}
  tabIndex={0}
  role="button"
  aria-label="Create new email campaign"
/>
```

### Focus Management

```typescript
import { useFocusManagement } from "@/hooks/useFocusManagement";

const ClientDashboard = () => {
  const { focusElement, setFocusedElement } = useFocusManagement();

  return (
    <div onKeyDown={handleKeyboardNavigation}>
      <ClientGrid columns={3}>
        {metrics.map((metric, index) => (
          <ClientMetricCard
            key={metric.id}
            {...metric}
            ref={index === focusElement ? setFocusedElement : null}
          />
        ))}
      </ClientGrid>
    </div>
  );
};
```

---

## 🧪 **Testing**

### Component Testing

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { ClientMetricCard } from "@/components/client/ClientUIKit";

describe("ClientMetricCard", () => {
  it("renders metric data correctly", () => {
    render(
      <ClientMetricCard
        title="Test Metric"
        value="1,234"
        trend={{ type: "up", value: "+12%" }}
      />
    );

    expect(screen.getByText("Test Metric")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText("+12%")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(
      <ClientMetricCard
        title="Clickable Metric"
        value="100"
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Animation Testing

```typescript
import { act, render } from "@testing-library/react";
import { motion } from "framer-motion";

// Mock framer-motion for testing
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));
```

---

## 🚀 **Best Practices**

### 1. **Consistent Spacing**

Use the predefined spacing system:

```typescript
// Good
<div className="space-y-4">
  <ClientMetricCard />
  <ClientActionCard />
</div>

// Avoid
<div style={{ marginBottom: '16px' }}>
  <ClientMetricCard />
</div>
```

### 2. **Loading States**

Always provide loading states for async operations:

```typescript
<ClientMetricCard
  title="Revenue"
  value={isLoading ? "..." : `$${revenue}`}
  loading={isLoading}
  icon={
    isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign />
  }
/>
```

### 3. **Error Handling**

Include error states and recovery options:

```typescript
{
  error ? (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Failed to load metrics.
        <Button variant="link" onClick={retry}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  ) : (
    <ClientMetricCard {...props} />
  );
}
```

### 4. **Semantic HTML**

Use appropriate semantic elements:

```typescript
<main role="main">
  <ClientPageHeader title="Dashboard" />
  <section aria-label="Key Metrics">
    <ClientGrid columns={3}>{/* Metric cards */}</ClientGrid>
  </section>
  <aside aria-label="Quick Actions">
    <ClientQuickActions actions={actions} />
  </aside>
</main>
```

---

## 📊 **Performance Metrics**

### Component Performance

- **Initial Load**: < 100ms
- **Animation Duration**: 200-400ms
- **Real-time Updates**: 1-5s intervals
- **Memory Usage**: < 50MB for typical dashboard
- **Bundle Size**: +~45KB (gzipped)

### Optimization Tips

1. **Lazy Load** heavy components
2. **Memoize** expensive calculations
3. **Debounce** real-time updates
4. **Virtualize** large lists
5. **Code Split** by route

---

## 🤝 **Contributing**

### Adding New Components

1. Follow the existing naming convention: `Client[ComponentName]`
2. Include TypeScript interfaces
3. Add Framer Motion animations
4. Support dark/light themes
5. Include comprehensive props documentation
6. Add accessibility attributes
7. Write unit tests

### Component Template

```typescript
interface ClientNewComponentProps {
  title: string;
  // ... other props
  className?: string;
}

export const ClientNewComponent: React.FC<ClientNewComponentProps> = ({
  title,
  className,
}) => {
  return (
    <motion.div
      {...clientAnimations.cardStagger}
      className={cn("base-styles", className)}
    >
      {/* Component content */}
    </motion.div>
  );
};
```

---

## 📄 **License**

This Client UI Kit is part of the SGPT email marketing platform and follows the same licensing terms as the main project.

---

## 🆘 **Support**

- **Documentation**: `/docs/components/client-ui-kit`
- **Examples**: `/examples/client-components`
- **Issues**: Create issue in main repository
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ for the SGPT Platform**
