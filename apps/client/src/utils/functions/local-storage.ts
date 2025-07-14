// src/lib/utils/local-storage.ts

export class LocalStorage {
  static get<T = string>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const value = localStorage.getItem(key);
    try {
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return value as T;
    }
  }

  static set<T = string>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
} 