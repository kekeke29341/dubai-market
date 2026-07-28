import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemForm from '@/components/items/ItemForm'
import { Category } from '@/types'
import toast from 'react-hot-toast'

// ---- Supabase mock ----
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: 'https://storage.example.com/item-images/user-1/test.jpg' },
})
const mockStorageUpload = vi.fn().mockResolvedValue({
  data: { path: 'user-1/test.jpg' },
  error: null,
})
const mockStorageFrom = vi.fn().mockReturnValue({
  upload: mockStorageUpload,
  getPublicUrl: mockGetPublicUrl,
})
const mockItemsInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { id: 'new-item-id' }, error: null }),
  }),
})
const mockItemsUpdate = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockImplementation((table: string) => ({
  insert: mockItemsInsert,
  update: mockItemsUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
}))
const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: 'user-1', email: 'test@example.com' } },
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    storage: { from: mockStorageFrom },
  }),
}))

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, disabled }: any) => ({
    getRootProps: () => ({
      onClick: vi.fn(),
      'data-testid': 'dropzone',
    }),
    getInputProps: () => ({
      type: 'file',
      accept: 'image/*',
      'data-testid': 'file-input',
      onChange: async (e: any) => {
        if (e.target.files?.length) {
          await onDrop(Array.from(e.target.files))
        }
      },
    }),
    isDragActive: false,
  }),
}))

const categories: Category[] = [
  { id: 1, name: 'Electronics', slug: 'electronics', icon: '📱' },
  { id: 2, name: 'Fashion', slug: 'fashion', icon: '👗' },
]

describe('ItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(<ItemForm categories={categories} />)
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByText(/condition/i)).toBeInTheDocument()
    expect(screen.getByText(/category/i)).toBeInTheDocument()
  })

  it('renders category options', () => {
    render(<ItemForm categories={categories} />)
    expect(screen.getByText('📱 Electronics')).toBeInTheDocument()
    expect(screen.getByText('👗 Fashion')).toBeInTheDocument()
  })

  it('shows validation error when required fields missing', async () => {
    render(<ItemForm categories={categories} />)
    const submitBtn = screen.getByRole('button', { name: /list item/i })
    await userEvent.click(submitBtn)
    expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields')
  })

  it('shows error when price is 0 or negative', async () => {
    render(<ItemForm categories={categories} />)
    await userEvent.type(screen.getByLabelText(/title/i), 'Test Item')
    const priceInput = screen.getByRole('spinbutton')
    await userEvent.clear(priceInput)
    await userEvent.type(priceInput, '0')
    const submitBtn = screen.getByRole('button', { name: /list item/i })
    await userEvent.click(submitBtn)
    expect(toast.error).toHaveBeenCalledWith('Price must be greater than 0')
  })

  it('submits successfully with valid data', async () => {
    render(<ItemForm categories={categories} />)

    await userEvent.type(screen.getByLabelText(/title/i), 'iPhone 14 Pro')
    const priceInput = screen.getByRole('spinbutton')
    await userEvent.clear(priceInput)
    await userEvent.type(priceInput, '3500')

    const submitBtn = screen.getByRole('button', { name: /list item/i })
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith('items')
      expect(mockItemsInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'iPhone 14 Pro',
          price: 3500,
          currency: 'AED',
          seller_id: 'user-1',
        })
      )
    })
  })

  it('redirects to login when user not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { useRouter } = await import('next/navigation')
    const router = useRouter()

    render(<ItemForm categories={categories} />)
    await userEvent.type(screen.getByLabelText(/title/i), 'Test')
    const priceInput = screen.getByRole('spinbutton')
    await userEvent.clear(priceInput)
    await userEvent.type(priceInput, '100')
    await userEvent.click(screen.getByRole('button', { name: /list item/i }))

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('initializes with existing data in edit mode', () => {
    render(
      <ItemForm
        categories={categories}
        mode="edit"
        initialData={{
          id: 'existing-id',
          title: 'Existing Item',
          price: 999,
          condition: 'good',
          location: 'Downtown Dubai',
          images: ['https://example.com/img1.jpg'],
        }}
      />
    )
    expect(screen.getByDisplayValue('Existing Item')).toBeInTheDocument()
    expect(screen.getByDisplayValue('999')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Downtown Dubai')).toBeInTheDocument()
  })

  it('shows Save changes button in edit mode', () => {
    render(<ItemForm categories={categories} mode="edit" initialData={{ id: 'x' }} />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('shows Delete button in edit mode', () => {
    render(<ItemForm categories={categories} mode="edit" initialData={{ id: 'x' }} />)
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  describe('Image upload', () => {
    it('shows upload placeholder when no images', () => {
      render(<ItemForm categories={categories} />)
      expect(screen.getByText('Add photo')).toBeInTheDocument()
    })

    it('shows (0/8) count initially', () => {
      render(<ItemForm categories={categories} />)
      expect(screen.getByText(/0\/8/)).toBeInTheDocument()
    })

    it('shows uploaded images count', () => {
      render(
        <ItemForm
          categories={categories}
          initialData={{
            images: [
              'https://example.com/img1.jpg',
              'https://example.com/img2.jpg',
            ],
          }}
        />
      )
      expect(screen.getByText(/2\/8/)).toBeInTheDocument()
    })

    it('marks first image as Main', () => {
      render(
        <ItemForm
          categories={categories}
          initialData={{ images: ['https://example.com/img1.jpg'] }}
        />
      )
      expect(screen.getByText('Main')).toBeInTheDocument()
    })

    it('hides upload area when 8 images present', () => {
      const eightImages = Array.from({ length: 8 }, (_, i) => `https://example.com/img${i}.jpg`)
      render(<ItemForm categories={categories} initialData={{ images: eightImages }} />)
      expect(screen.queryByText('Add photo')).not.toBeInTheDocument()
    })

    it('removes image when X button clicked', async () => {
      render(
        <ItemForm
          categories={categories}
          initialData={{ images: ['https://example.com/img1.jpg'] }}
        />
      )
      expect(screen.getByText(/1\/8/)).toBeInTheDocument()
      const removeBtn = screen.getByRole('button', { name: '' }) // the X button
      await userEvent.click(removeBtn)
      await waitFor(() => {
        expect(screen.getByText(/0\/8/)).toBeInTheDocument()
      })
    })

    it('uploads file to supabase storage', async () => {
      render(<ItemForm categories={categories} />)

      const fileInput = screen.getByTestId('file-input')
      const file = new File(['fake image data'], 'photo.jpg', { type: 'image/jpeg' })

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })

      await waitFor(() => {
        expect(mockStorageFrom).toHaveBeenCalledWith('item-images')
        expect(mockStorageUpload).toHaveBeenCalledWith(
          expect.stringMatching(/^user-1\/.+\.jpg$/),
          file,
          expect.objectContaining({ contentType: 'image/jpeg' })
        )
      })
    })

    it('adds public URL to images state after upload', async () => {
      render(<ItemForm categories={categories} />)
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['fake image data'], 'photo.jpg', { type: 'image/jpeg' })

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })

      await waitFor(() => {
        expect(screen.getByText(/1\/8/)).toBeInTheDocument()
      })
    })

    it('shows error toast when upload fails', async () => {
      mockStorageUpload.mockResolvedValueOnce({ data: null, error: new Error('Upload failed') })

      render(<ItemForm categories={categories} />)
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['data'], 'fail.jpg', { type: 'image/jpeg' })

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to upload image')
      })
    })

    it('does not exceed 8 images when uploading multiple files', async () => {
      // Start with 7 images already uploaded
      const sevenImages = Array.from({ length: 7 }, (_, i) => `https://example.com/img${i}.jpg`)
      render(<ItemForm categories={categories} initialData={{ images: sevenImages }} />)

      const fileInput = screen.getByTestId('file-input')
      // Try to upload 3 more (should only upload 1)
      const files = [
        new File(['data'], 'a.jpg', { type: 'image/jpeg' }),
        new File(['data'], 'b.jpg', { type: 'image/jpeg' }),
        new File(['data'], 'c.jpg', { type: 'image/jpeg' }),
      ]

      await act(async () => {
        fireEvent.change(fileInput, { target: { files } })
      })

      await waitFor(() => {
        // Only 1 upload should happen (7 + 1 = 8 max)
        expect(mockStorageUpload).toHaveBeenCalledTimes(1)
      })
    })

    it('includes uploaded images in submit payload', async () => {
      render(
        <ItemForm
          categories={categories}
          initialData={{ images: ['https://example.com/img1.jpg'] }}
        />
      )

      await userEvent.type(screen.getByLabelText(/title/i), 'Item with image')
      const priceInput = screen.getByRole('spinbutton')
      await userEvent.clear(priceInput)
      await userEvent.type(priceInput, '200')
      await userEvent.click(screen.getByRole('button', { name: /list item/i }))

      await waitFor(() => {
        expect(mockItemsInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            images: ['https://example.com/img1.jpg'],
          })
        )
      })
    })
  })
})
