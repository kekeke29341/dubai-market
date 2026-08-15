import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SecurityCheckList from '@/components/admin/SecurityCheckList'

describe('SecurityCheckList', () => {
  it('renders each check status', () => {
    render(
      <SecurityCheckList
        checks={[
          { id: 'a', title: 'Env OK', status: 'pass', detail: 'keys present' },
          { id: 'b', title: 'Reports', status: 'warn', detail: '2 pending', href: '/admin/reports' },
          { id: 'c', title: 'Guards', status: 'fail', detail: 'missing trigger' },
        ]}
      />,
    )
    expect(screen.getByText('Env OK')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Guards')).toBeInTheDocument()
    expect(screen.getByText('Pass')).toBeInTheDocument()
    expect(screen.getByText('Warn')).toBeInTheDocument()
    expect(screen.getByText('Fail')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /reports/i })).toHaveAttribute('href', '/admin/reports')
  })
})
