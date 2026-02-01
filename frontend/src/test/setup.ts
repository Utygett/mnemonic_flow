import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Мок localStorage (используется во многих хуках)
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = localStorageMock as Storage

// Очистка моков после каждого теста
afterEach(() => {
  vi.clearAllMocks()
})
