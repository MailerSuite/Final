import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T = any> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5,
  getItemKey,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const { visibleRange, totalHeight } = useMemo(() => {
    const containerHeight = height;
    const totalHeight = items.length * itemHeight;
    
    if (totalHeight <= containerHeight) {
      return {
        visibleRange: { start: 0, end: items.length },
        totalHeight
      };
    }

    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );

    return {
      visibleRange: { 
        start: Math.max(0, start - overscan), 
        end 
      },
      totalHeight
    };
  }, [items.length, itemHeight, height, scrollTop, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  const scrollToIndex = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const scrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);

  // Expose scrollToIndex for parent components
  React.useImperativeHandle(scrollElementRef, () => ({
    scrollToIndex,
    scrollToTop: () => scrollToIndex(0),
    scrollToBottom: () => scrollToIndex(items.length - 1)
  }));

  if (loading && loadingComponent) {
    return (
      <div 
        className={cn("relative overflow-hidden", className)}
        style={{ height }}
      >
        {loadingComponent}
      </div>
    );
  }

  if (items.length === 0 && emptyComponent) {
    return (
      <div 
        className={cn("relative overflow-hidden", className)}
        style={{ height }}
      >
        {emptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn("relative overflow-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-900", className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items */}
        {visibleItems.map(({ item, index }) => (
          <div
            key={getItemKey ? getItemKey(item, index) : index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook for managing virtual list state
export function useVirtualList<T>(items: T[], itemHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef<{ scrollToIndex: (index: number) => void }>(null);

  const scrollToIndex = useCallback((index: number) => {
    listRef.current?.scrollToIndex(index);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollToIndex(0);
  }, [scrollToIndex]);

  const scrollToBottom = useCallback(() => {
    scrollToIndex(items.length - 1);
  }, [scrollToIndex, items.length]);

  return {
    listRef,
    scrollTop,
    setScrollTop,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
  };
}

// Optimized virtual table component for tabular data
interface VirtualTableProps<T = any> {
  data: T[];
  columns: Array<{
    key: string;
    header: string;
    width?: number | string;
    render?: (item: T, index: number) => React.ReactNode;
  }>;
  height: number;
  rowHeight?: number;
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  getRowKey?: (item: T, index: number) => string | number;
  onRowClick?: (item: T, index: number) => void;
  loading?: boolean;
}

export function VirtualTable<T>({
  data,
  columns,
  height,
  rowHeight = 48,
  className,
  headerClassName,
  rowClassName,
  getRowKey,
  onRowClick,
  loading = false
}: VirtualTableProps<T>) {
  const headerHeight = 40;
  const listHeight = height - headerHeight;

  const renderRow = useCallback((item: T, index: number) => (
    <div 
      className={cn(
        "flex items-center border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors cursor-pointer",
        rowClassName
      )}
      onClick={() => onRowClick?.(item, index)}
      style={{ height: rowHeight }}
    >
      {columns.map((column, colIndex) => (
        <div
          key={column.key}
          className="px-3 py-2 text-sm text-white overflow-hidden text-ellipsis"
          style={{ width: column.width || `${100 / columns.length}%` }}
        >
          {column.render ? column.render(item, index) : (item as any)[column.key]}
        </div>
      ))}
    </div>
  ), [columns, rowHeight, rowClassName, onRowClick]);

  if (loading) {
    return (
      <div className={cn("bg-zinc-900 border border-zinc-800 rounded-lg", className)}>
        <div className="p-8 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden", className)}>
      {/* Table Header */}
      <div 
        className={cn(
          "flex bg-zinc-800 border-b border-zinc-700",
          headerClassName
        )}
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-3 py-2 text-sm font-medium text-zinc-300 overflow-hidden"
            style={{ width: column.width || `${100 / columns.length}%` }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtual List for Rows */}
      <VirtualList
        items={data}
        height={listHeight}
        itemHeight={rowHeight}
        renderItem={renderRow}
        getItemKey={getRowKey}
        emptyComponent={
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-lg mb-2">No data available</div>
              <div className="text-sm">Add some data to get started</div>
            </div>
          </div>
        }
      />
    </div>
  );
}

export default VirtualList; 