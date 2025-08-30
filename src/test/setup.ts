/**
 * Test setup for Vitest
 * [Design → Execution] Testing environment configuration
 */

import { beforeEach, vi } from 'vitest'

// Mock Web APIs that might not be available in test environment
Object.defineProperty(global, 'navigator', {
  value: {
    ...global.navigator,
    onLine: true,
    serviceWorker: {
      register: vi.fn().mockResolvedValue({}),
    } as Partial<ServiceWorkerContainer>,
  },
  writable: true,
})

// Mock IndexedDB
Object.defineProperty(global, 'indexedDB', {
  value: {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
  } as Partial<IDBFactory>,
  writable: true,
})

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})
