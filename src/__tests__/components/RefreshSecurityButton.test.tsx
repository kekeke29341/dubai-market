import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RefreshSecurityButton from '@/components/admin/RefreshSecurityButton'

describe('RefreshSecurityButton', () => {
  it('renders a re-run control', async () => {
    render(<RefreshSecurityButton />)
    const button = screen.getByRole('button', { name: /re-run checks/i })
    expect(button).toBeEnabled()
    await userEvent.click(button)
    expect(button).toBeInTheDocument()
  })
})
