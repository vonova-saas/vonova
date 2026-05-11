'use client';

import { useState, useEffect, useCallback } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
}

/**
 * useCountdown Hook
 * 
 * Returns a countdown timer for a target date.
 * Updates every second.
 * 
 * @param targetDate - The date to count down to
 * @returns CountdownResult with days, hours, minutes, seconds, and isExpired flag
 */
export function useCountdown(targetDate: Date | string): CountdownResult {
  const getTimeLeft = useCallback((): CountdownResult => {
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        totalSeconds: 0,
      };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
      totalSeconds: Math.floor(difference / 1000),
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(getTimeLeft());

  useEffect(() => {
    // Initial calculation
    setTimeLeft(getTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = getTimeLeft();
      setTimeLeft(newTimeLeft);

      // Stop interval if expired
      if (newTimeLeft.isExpired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [getTimeLeft]);

  return timeLeft;
}

/**
 * Format countdown for display
 */
export function formatCountdown(countdown: CountdownResult, compact = false): string {
  if (countdown.isExpired) {
    return compact ? 'Expired' : 'Offer expired';
  }

  const parts: string[] = [];

  if (countdown.days > 0) {
    parts.push(`${countdown.days}d`);
  }
  if (countdown.hours > 0 || countdown.days > 0) {
    parts.push(`${countdown.hours}h`);
  }
  if (countdown.minutes > 0 || countdown.hours > 0 || countdown.days > 0) {
    parts.push(`${countdown.minutes}m`);
  }
  parts.push(`${countdown.seconds}s`);

  return compact ? parts.slice(0, 2).join(' ') : parts.join(' ');
}
