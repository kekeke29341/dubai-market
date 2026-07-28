// jest-dom matchers — only available in jsdom environment
if (typeof window !== 'undefined') {
  await import('@testing-library/jest-dom')
}

// Mock Next.js router (needed in jsdom tests; no-op in node environment)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/image (only meaningful in jsdom)
if (typeof window !== 'undefined') {
  vi.mock('next/image', () => ({
    default: (props: any) => {
      // eslint-disable-next-line @next/next/no-img-element
      const { fill, priority, sizes, ...rest } = props
      return <img {...rest} />
    },
  }))
}

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))
