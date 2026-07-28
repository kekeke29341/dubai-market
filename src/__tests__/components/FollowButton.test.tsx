import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FollowButton from '@/components/profile/FollowButton'
import toast from 'react-hot-toast'

const mockDelete = vi.fn()
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

describe('FollowButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    mockFrom.mockReturnValue({ delete: mockDelete, insert: mockInsert })
  })

  it('shows "Follow" when not following', () => {
    render(<FollowButton targetId="user-2" initialFollowing={false} currentUserId="user-1" />)
    expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument()
  })

  it('shows "Unfollow" when following', () => {
    render(<FollowButton targetId="user-2" initialFollowing={true} currentUserId="user-1" />)
    expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()

    render(<FollowButton targetId="user-2" initialFollowing={false} currentUserId={undefined} />)
    await userEvent.click(screen.getByRole('button'))
    expect(router.push).toHaveBeenCalledWith('/auth/login')
  })

  it('inserts follow row when following', async () => {
    render(<FollowButton targetId="user-2" initialFollowing={false} currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /follow/i }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('follows')
      expect(mockInsert).toHaveBeenCalledWith({ follower_id: 'user-1', following_id: 'user-2' })
    })
  })

  it('shows success toast on follow', async () => {
    render(<FollowButton targetId="user-2" initialFollowing={false} currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /follow/i }))
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Following!')
    })
  })

  it('deletes follow row when unfollowing', async () => {
    render(<FollowButton targetId="user-2" initialFollowing={true} currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /unfollow/i }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('follows')
      expect(mockDelete).toHaveBeenCalled()
    })
  })

  it('toggles button text from Follow → Unfollow', async () => {
    render(<FollowButton targetId="user-2" initialFollowing={false} currentUserId="user-1" />)
    const btn = screen.getByRole('button', { name: /follow/i })
    await userEvent.click(btn)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument()
    })
  })

  it('toggles button text from Unfollow → Follow', async () => {
    render(<FollowButton targetId="user-2" initialFollowing={true} currentUserId="user-1" />)
    const btn = screen.getByRole('button', { name: /unfollow/i })
    await userEvent.click(btn)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument()
    })
  })

  it('is disabled while loading', async () => {
    mockInsert.mockImplementationOnce(() => new Promise((res) => setTimeout(() => res({ error: null }), 200)))
    render(<FollowButton targetId="user-2" initialFollowing={false} currentUserId="user-1" />)
    const btn = screen.getByRole('button', { name: /follow/i })
    await userEvent.click(btn)
    expect(btn).toBeDisabled()
  })

  it('calls router.refresh after follow', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()

    render(<FollowButton targetId="user-2" initialFollowing={false} currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /follow/i }))
    await waitFor(() => {
      expect(router.refresh).toHaveBeenCalled()
    })
  })
})
