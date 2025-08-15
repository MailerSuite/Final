/**
 * Performance utilities for React optimization and memory leak prevention
 */

import { useEffect, useRef, useCallback, useMemo } from 'react'

// PERFORMANCE FIX: Memory leak prevention utilities
export class MemoryLeakPrevention {
  private static intervals: Set<number> = new Set()
  private static timeouts: Set<number> = new Set()
  private static abortControllers: Set<AbortController> = new Set()
  private static eventListeners: Array<{
    element: EventTarget
    event: string
    handler: EventListener
    options?: boolean | AddEventListenerOptions
  }> = []

  static addInterval(intervalId: number): void {
    this.intervals.add(intervalId)
  }

  static addTimeout(timeoutId: number): void {
    this.timeouts.add(timeoutId)
  }

  static addAbortController(controller: AbortController): void {
    this.abortControllers.add(controller)
  }

  static addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options)
    this.eventListeners.push({ element, event, handler, options })
  }

  static cleanup(): void {
    // Clear all intervals
    this.intervals.forEach(id => clearInterval(id))
    this.intervals.clear()

    // Clear all timeouts
    this.timeouts.forEach(id => clearTimeout(id))
    this.timeouts.clear()

    // Abort all ongoing requests
    this.abortControllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort()
      }
    })
    this.abortControllers.clear()

    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options)
    })
    this.eventListeners.length = 0
  }
}

// PERFORMANCE FIX: Safe interval hook that prevents memory leaks
export function useSafeInterval(
  callback: () => void,
  delay: number | null,
  dependencies: React.DependencyList = []
): void {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setInterval(() => savedCallback.current(), delay)
    MemoryLeakPrevention.addInterval(id)

    return () => {
      clearInterval(id)
      MemoryLeakPrevention.intervals.delete(id)
    }
  }, [delay, ...dependencies])
}

// PERFORMANCE FIX: Safe timeout hook
export function useSafeTimeout(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setTimeout(() => savedCallback.current(), delay)
    MemoryLeakPrevention.addTimeout(id)

    return () => {
      clearTimeout(id)
      MemoryLeakPrevention.timeouts.delete(id)
    }
  }, [delay])
}

// PERFORMANCE FIX: Memoized event handler to prevent unnecessary re-renders
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T {
  return useCallback(callback, dependencies)
}

// PERFORMANCE FIX: Heavy computation memoization
export function useHeavyComputation<T>(
  computeFn: () => T,
  dependencies: React.DependencyList
): T {
  return useMemo(() => {
    const startTime = performance.now()
    const result = computeFn()
    const endTime = performance.now()
    
    if (endTime - startTime > 16) { // More than one frame
      console.warn(`Heavy computation took ${(endTime - startTime).toFixed(2)}ms`)
    }
    
    return result
  }, dependencies)
}

// PERFORMANCE FIX: Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    MemoryLeakPrevention.addTimeout(handler)

    return () => {
      clearTimeout(handler)
      MemoryLeakPrevention.timeouts.delete(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// PERFORMANCE FIX: Throttled callback hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    [callback, delay]
  )
}

// PERFORMANCE FIX: Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry)
    }, options)

    observer.observe(element)

    return () => {
      observer.unobserve(element)
      observer.disconnect()
    }
  }, [elementRef, options.threshold, options.root, options.rootMargin])

  return entry
}

// PERFORMANCE FIX: Virtual scrolling utilities
export class VirtualScrolling {
  static calculateVisibleItems(
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 3
  ) {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      totalItems - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return {
      startIndex,
      endIndex,
      visibleItems: endIndex - startIndex + 1
    }
  }

  static getItemOffset(index: number, itemHeight: number): number {
    return index * itemHeight
  }
}

// PERFORMANCE FIX: Image optimization utilities
export class ImageOptimization {
  private static readonly cache = new Map<string, HTMLImageElement>()

  static preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src)!)
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.cache.set(src, img)
        resolve(img)
      }
      img.onerror = reject
      img.src = src
    })
  }

  static getOptimizedSrc(src: string, width?: number, height?: number): string {
    // In a real implementation, this would generate optimized image URLs
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    params.set('q', '80') // Quality
    params.set('f', 'webp') // Format

    return `${src}?${params.toString()}`
  }
}

// PERFORMANCE FIX: Bundle splitting utilities
export const LazyComponents = {
  // Note: Commenting out until component paths are confirmed
  // CampaignAnalytics: React.lazy(() => 
  //   import('../components/campaign/CampaignAnalytics').then(module => ({
  //     default: module.CampaignAnalytics
  //   }))
  // ),
  
  // EmailEditor: React.lazy(() => 
  //   import('../components/email/EmailEditor').then(module => ({
  //     default: module.EmailEditor
  //   }))
  // ),
  
  // DataVisualization: React.lazy(() => 
  //   import('../components/analytics/DataVisualization').then(module => ({
  //     default: module.DataVisualization
  //   }))
  // )
}

// PERFORMANCE FIX: Performance monitoring utilities
export class PerformanceMonitor {
  private static readonly metrics = new Map<string, number[]>()

  static startTiming(label: string): void {
    performance.mark(`${label}-start`)
  }

  static endTiming(label: string): number {
    performance.mark(`${label}-end`)
    performance.measure(label, `${label}-start`, `${label}-end`)
    
    const measure = performance.getEntriesByName(label, 'measure')[0]
    const duration = measure.duration

    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(duration)

    // Clean up marks and measures
    performance.clearMarks(`${label}-start`)
    performance.clearMarks(`${label}-end`)
    performance.clearMeasures(label)

    return duration
  }

  static getAverageTime(label: string): number {
    const times = this.metrics.get(label)
    if (!times || times.length === 0) return 0

    return times.reduce((sum, time) => sum + time, 0) / times.length
  }

  static logPerformanceMetrics(): void {
    console.group('Performance Metrics')
    this.metrics.forEach((times, label) => {
      const avg = this.getAverageTime(label)
      const min = Math.min(...times)
      const max = Math.max(...times)
      console.log(`${label}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`)
    })
    console.groupEnd()
  }
}

// PERFORMANCE FIX: React component performance utilities
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.memo<P>((props) => {
    React.useEffect(() => {
      PerformanceMonitor.startTiming(`${componentName}-render`)
      return () => {
        PerformanceMonitor.endTiming(`${componentName}-render`)
      }
    })

    return React.createElement(Component, props)
  })
}

// PERFORMANCE FIX: Global cleanup on app unmount
export function setupGlobalCleanup(): void {
  const cleanup = () => {
    MemoryLeakPrevention.cleanup()
    PerformanceMonitor.logPerformanceMetrics()
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup)
  
  // Cleanup on visibility change (mobile apps)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      cleanup()
    }
  })

  return () => {
    cleanup()
    document.removeEventListener('visibilitychange', cleanup)
  }
}

// Export useState import for useDebounce
import React, { useState } from 'react'