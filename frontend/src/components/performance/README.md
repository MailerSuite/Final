# Performance Components

A comprehensive set of React components for performance monitoring, testing, and analysis in MailerSuite.

## Components

### PerformanceDashboard

A complete performance overview dashboard that displays:

- Overall performance score and grade
- System health indicators
- Service status (SMTP, IMAP, API)
- Real-time resource metrics
- Performance testing interface

**Usage:**

```tsx
import { PerformanceDashboard } from '@/components/performance';

// Standalone dashboard
<PerformanceDashboard />

// Or embed in another component
<div className="performance-section">
  <PerformanceDashboard />
</div>
```

### PerformanceMetricsCard

Reusable card component for displaying performance metrics with:

- Visual progress bars
- Trend indicators
- Status badges
- Threshold monitoring

**Variants:**

- `default` - Standard metrics display
- `compact` - Condensed view
- `detailed` - Full metrics with thresholds

**Usage:**

```tsx
import { PerformanceMetricsCard } from "@/components/performance";

const metrics = {
  responseTime: {
    current: 125,
    average: 118,
    trend: "stable",
    threshold: 500,
    unit: "ms",
  },
  throughput: {
    current: 1250,
    average: 1180,
    trend: "up",
    threshold: 1000,
    unit: " req/s",
  },
};

<PerformanceMetricsCard
  title="Network Performance"
  description="Real-time network metrics"
  metrics={metrics}
  variant="detailed"
  showTrends={true}
  showThresholds={true}
/>;
```

### SystemMetricsCard

Specialized card for system resource metrics:

- CPU usage
- Memory utilization
- Disk I/O
- Network activity

**Usage:**

```tsx
import { SystemMetricsCard } from "@/components/performance";

const systemMetrics = {
  cpu: 45,
  memory: 68,
  disk: 72,
  network: 35,
};

<SystemMetricsCard metrics={systemMetrics} />;
```

### NetworkMetricsCard

Specialized card for network performance:

- Response time
- Throughput
- Error rate
- Latency

**Usage:**

```tsx
import { NetworkMetricsCard } from "@/components/performance";

const networkMetrics = {
  responseTime: 125,
  throughput: 1250,
  errorRate: 0.8,
  latency: 45,
};

<NetworkMetricsCard metrics={networkMetrics} />;
```

### PerformanceTestRunner

Comprehensive test configuration and execution interface:

- Multiple test types (Load, Stress, Spike, Endurance, SMTP, IMAP)
- Real-time test monitoring
- Progress tracking
- Results export

**Usage:**

```tsx
import { PerformanceTestRunner } from "@/components/performance";

<PerformanceTestRunner
  onTestStart={(config) => console.log("Test started:", config)}
  onTestStop={(testId) => console.log("Test stopped:", testId)}
  onTestPause={(testId) => console.log("Test paused:", testId)}
  onTestResume={(testId) => console.log("Test resumed:", testId)}
/>;
```

## Features

- **Real-time Updates**: Auto-refreshing metrics with configurable intervals
- **Responsive Design**: Works on all screen sizes
- **Animation**: Smooth Framer Motion animations
- **TypeScript**: Fully typed with proper interfaces
- **Design System**: Uses unified design system colors and components
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Design System Integration

All components use the unified design system:

- Colors from CSS variables (`--primary`, `--secondary`, `--accent`)
- Consistent spacing and typography
- Unified component library (`@/components/ui`)
- Responsive breakpoints

## Performance Considerations

- Components use `useCallback` and `useMemo` for optimization
- Real-time updates are throttled to prevent excessive re-renders
- Progress bars and animations are hardware-accelerated
- Lazy loading support for heavy components

## Customization

Components accept various props for customization:

- `className` for additional CSS classes
- `variant` for different display modes
- `showTrends` and `showThresholds` for conditional rendering
- Event handlers for test control

## Examples

### Basic Dashboard

```tsx
import { PerformanceDashboard } from "@/components/performance";

function App() {
  return (
    <div className="app">
      <PerformanceDashboard />
    </div>
  );
}
```

### Custom Metrics Display

```tsx
import { PerformanceMetricsCard } from "@/components/performance";

function CustomMetrics() {
  const customMetrics = {
    // Your custom metrics here
  };

  return (
    <PerformanceMetricsCard
      title="Custom Metrics"
      metrics={customMetrics}
      variant="compact"
      showTrends={false}
    />
  );
}
```

### Embedded Test Runner

```tsx
import { PerformanceTestRunner } from "@/components/performance";

function TestingPage() {
  const handleTestStart = (config) => {
    // Custom test start logic
  };

  return (
    <div className="testing-page">
      <h1>Performance Testing</h1>
      <PerformanceTestRunner onTestStart={handleTestStart} />
    </div>
  );
}
```

## File Structure

```
src/components/performance/
├── PerformanceDashboard.tsx    # Main dashboard component
├── PerformanceMetricsCard.tsx  # Reusable metrics cards
├── PerformanceTestRunner.tsx   # Test configuration and execution
├── index.ts                   # Component exports
└── README.md                  # This documentation
```

## Dependencies

- React 18+
- Framer Motion for animations
- Lucide React for icons
- shadcn/ui components
- Tailwind CSS for styling
- TypeScript for type safety
