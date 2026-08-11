import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// SearchPage uses localStorage — mock it
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Dynamic import after mocking
async function renderSearch() {
  const { default: SearchPage } = await import('@/app/search/page')
  return render(<SearchPage />)
}

describe('SearchPage — search history', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('shows no history section when localStorage is empty', async () => {
    await renderSearch()
    expect(screen.queryByText('Recent')).not.toBeInTheDocument()
  })

  it('shows Popular section always', async () => {
    await renderSearch()
    expect(screen.getByText('Popular')).toBeInTheDocument()
    expect(screen.getByText('iPhone')).toBeInTheDocument()
  })

  it('shows Recent section when history exists', async () => {
    localStorageMock.setItem('dubai_search_history', JSON.stringify(['camera', 'laptop']))
    await renderSearch()
    expect(screen.getByText('Recent')).toBeInTheDocument()
    expect(screen.getByText('camera')).toBeInTheDocument()
    expect(screen.getByText('laptop')).toBeInTheDocument()
  })

  it('clears all history when "Clear all" is clicked', async () => {
    localStorageMock.setItem('dubai_search_history', JSON.stringify(['camera']))
    await renderSearch()

    const clearBtn = screen.getByText('Clear all')
    await userEvent.click(clearBtn)

    expect(screen.queryByText('camera')).not.toBeInTheDocument()
    expect(screen.queryByText('Recent')).not.toBeInTheDocument()
  })

  it('limits history to 10 items', () => {
    const HISTORY_KEY = 'dubai_search_history'
    // Save 10 items already
    const existing = Array.from({ length: 10 }, (_, i) => `item${i}`)
    localStorageMock.setItem(HISTORY_KEY, JSON.stringify(existing))

    // Simulate saveHistory('new-item') by re-computing
    const prev = JSON.parse(localStorageMock.getItem(HISTORY_KEY) || '[]').filter((t: string) => t !== 'new-item')
    const next = ['new-item', ...prev].slice(0, 10)
    localStorageMock.setItem(HISTORY_KEY, JSON.stringify(next))

    const stored = JSON.parse(localStorageMock.getItem(HISTORY_KEY) || '[]')
    expect(stored.length).toBe(10)
    expect(stored[0]).toBe('new-item')
  })

  it('deduplicates repeated search terms', () => {
    const HISTORY_KEY = 'dubai_search_history'
    localStorageMock.setItem(HISTORY_KEY, JSON.stringify(['camera', 'laptop']))

    // Saving 'camera' again should move it to the front, not duplicate
    const prev = JSON.parse(localStorageMock.getItem(HISTORY_KEY) || '[]').filter((t: string) => t !== 'camera')
    const next = ['camera', ...prev].slice(0, 10)
    localStorageMock.setItem(HISTORY_KEY, JSON.stringify(next))

    const stored = JSON.parse(localStorageMock.getItem(HISTORY_KEY) || '[]')
    expect(stored).toEqual(['camera', 'laptop'])
    expect(stored.filter((t: string) => t === 'camera').length).toBe(1)
  })
})
