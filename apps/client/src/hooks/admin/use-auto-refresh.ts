import { useState, useEffect, useCallback } from 'react';

export function useAutoRefresh(initialInterval = 30) {
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(initialInterval);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshCount, setRefreshCount] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    if (!isAutoRefreshing) return;

    const interval = setInterval(() => {
      triggerRefresh();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, refreshInterval, triggerRefresh]);

  const toggleAutoRefresh = useCallback((enabled?: boolean) => {
    setIsAutoRefreshing(prev => enabled ?? !prev);
  }, []);

  const setRefreshRate = useCallback((seconds: number) => {
    setRefreshInterval(seconds);
  }, []);

  return {
    isAutoRefreshing,
    refreshInterval,
    lastRefresh,
    refreshCount,
    triggerRefresh,
    toggleAutoRefresh,
    setRefreshRate,
  };
}
