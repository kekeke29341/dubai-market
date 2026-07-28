import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatPrice, formatRelativeTime, cn, CONDITION_LABELS, CONDITION_COLORS, getInitials } from '@/lib/utils'

describe('formatPrice', () => {
  it('formats AED price without decimals for whole numbers', () => {
    expect(formatPrice(1000, 'AED')).toBe('AED 1,000')
  })

  it('formats price with decimals', () => {
    expect(formatPrice(99.5, 'AED')).toBe('AED 99.5')
  })

  it('defaults to AED when currency omitted', () => {
    expect(formatPrice(500)).toBe('AED 500')
  })

  it('formats large prices with comma separators', () => {
    expect(formatPrice(50000, 'AED')).toBe('AED 50,000')
  })

  it('formats zero price', () => {
    expect(formatPrice(0, 'AED')).toBe('AED 0')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for seconds ago', () => {
    const date = new Date('2024-01-15T11:59:30Z').toISOString()
    expect(formatRelativeTime(date)).toBe('just now')
  })

  it('returns minutes ago', () => {
    const date = new Date('2024-01-15T11:45:00Z').toISOString()
    expect(formatRelativeTime(date)).toBe('15m ago')
  })

  it('returns hours ago', () => {
    const date = new Date('2024-01-15T09:00:00Z').toISOString()
    expect(formatRelativeTime(date)).toBe('3h ago')
  })

  it('returns days ago', () => {
    const date = new Date('2024-01-13T12:00:00Z').toISOString()
    expect(formatRelativeTime(date)).toBe('2d ago')
  })

  it('returns locale date string for more than 7 days', () => {
    const date = new Date('2024-01-01T12:00:00Z').toISOString()
    const result = formatRelativeTime(date)
    // Should be a date string (not a relative time)
    expect(result).not.toContain('ago')
    expect(result).not.toBe('just now')
  })
})

describe('cn (class name utility)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'excluded', 'included')).toBe('base included')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })
})

describe('CONDITION_LABELS', () => {
  it('has labels for all conditions', () => {
    const conditions = ['new', 'like_new', 'good', 'fair', 'poor']
    conditions.forEach((c) => {
      expect(CONDITION_LABELS[c]).toBeTruthy()
    })
  })

  it('returns correct label for new', () => {
    expect(CONDITION_LABELS['new']).toBe('Brand New')
  })
})

describe('CONDITION_COLORS', () => {
  it('has color classes for all conditions', () => {
    const conditions = ['new', 'like_new', 'good', 'fair', 'poor']
    conditions.forEach((c) => {
      expect(CONDITION_COLORS[c]).toMatch(/bg-\w+-\d+ text-\w+-\d+/)
    })
  })
})

describe('getInitials', () => {
  it('returns uppercase first character', () => {
    expect(getInitials('alice')).toBe('A')
  })

  it('handles already-uppercase input', () => {
    expect(getInitials('Bob')).toBe('B')
  })

  it('returns default fallback for null', () => {
    expect(getInitials(null)).toBe('?')
  })

  it('returns default fallback for undefined', () => {
    expect(getInitials(undefined)).toBe('?')
  })

  it('returns default fallback for empty string', () => {
    expect(getInitials('')).toBe('?')
  })

  it('accepts a custom fallback', () => {
    expect(getInitials(null, '–')).toBe('–')
  })
})
