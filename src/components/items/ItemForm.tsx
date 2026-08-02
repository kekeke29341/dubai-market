'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Category, Item, ItemCondition } from '@/types'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Upload, X, GripVertical } from 'lucide-react'
import Image from 'next/image'

interface ItemFormProps {
  categories: Category[]
  initialData?: Partial<Item>
  mode?: 'create' | 'edit'
}

const CONDITIONS: { value: ItemCondition; label: string; desc: string }[] = [
  { value: 'new', label: 'Brand New', desc: 'Never used, with tags/packaging' },
  { value: 'like_new', label: 'Like New', desc: 'Barely used, no visible wear' },
  { value: 'good', label: 'Good', desc: 'Minor signs of use' },
  { value: 'fair', label: 'Fair', desc: 'Visible wear, fully functional' },
  { value: 'poor', label: 'Poor', desc: 'Heavy wear, may need repair' },
]

export default function ItemForm({ categories, initialData, mode = 'create' }: ItemFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [price, setPrice] = useState(initialData?.price?.toString() || '')
  const [brand, setBrand] = useState((initialData as any)?.brand || '')
  const [condition, setCondition] = useState<ItemCondition>(initialData?.condition || 'good')
  const [categoryId, setCategoryId] = useState<number | ''>(initialData?.category_id || '')
  const [location, setLocation] = useState(initialData?.location || 'Dubai, UAE')
  const [images, setImages] = useState<string[]>(initialData?.images || [])
  const [uploadingImages, setUploadingImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    for (const file of acceptedFiles.slice(0, 8 - images.length - uploadingImages.length)) {
      const previewUrl = URL.createObjectURL(file)
      setUploadingImages((prev) => [...prev, previewUrl])

      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(path, file, { contentType: file.type })

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(data.path)
        setImages((prev) => [...prev, publicUrl])
      } else {
        toast.error('Failed to upload image')
      }
      setUploadingImages((prev) => prev.filter((u) => u !== previewUrl))
    }
  }, [images.length, supabase])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 8,
    disabled: images.length >= 8,
  })

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const save = async (targetStatus: 'active' | 'draft') => {
    const isDraft = targetStatus === 'draft'
    if (!isDraft && (!title.trim() || !price || !condition)) {
      toast.error('Please fill in all required fields')
      return
    }
    if (!isDraft && parseFloat(price) <= 0) {
      toast.error('Price must be greater than 0')
      return
    }
    if (!title.trim()) {
      toast.error('Title is required even for drafts')
      return
    }

    if (isDraft) setDraftLoading(true)
    else setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setDraftLoading(false)
      router.push('/auth/login')
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      price: price ? parseFloat(price) : 0,
      currency: 'AED',
      brand: brand.trim() || null,
      condition,
      category_id: categoryId || null,
      location: location.trim() || 'Dubai, UAE',
      images,
      seller_id: user.id,
      status: targetStatus,
    }

    let error
    let itemId = initialData?.id

    if (mode === 'edit' && initialData?.id) {
      const { error: e } = await supabase.from('items').update(payload).eq('id', initialData.id)
      error = e
    } else {
      const { data, error: e } = await supabase.from('items').insert(payload).select('id').single()
      error = e
      itemId = data?.id
    }

    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else if (isDraft) {
      toast.success('Saved as draft')
      router.push('/mypage?tab=drafts')
      router.refresh()
    } else {
      toast.success(mode === 'edit' ? 'Item updated!' : 'Item listed!')
      router.push(itemId ? `/items/${itemId}` : '/')
      router.refresh()
    }
    setLoading(false)
    setDraftLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await save('active')
  }

  const handleDelete = async () => {
    if (!confirm('Delete this item? This cannot be undone.')) return
    const { error } = await supabase
      .from('items')
      .update({ status: 'deleted' })
      .eq('id', initialData!.id)
    if (error) {
      toast.error('Failed to delete')
    } else {
      toast.success('Item deleted')
      router.push('/mypage')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Images */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Photos <span className="text-gray-400 font-normal">({images.length}/8)</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
              <Image src={img} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
              >
                <X className="w-3 h-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">Main</span>
              )}
            </div>
          ))}
          {uploadingImages.map((url, i) => (
            <div key={`uploading-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 animate-pulse">
              <Image src={url} alt="Uploading..." fill className="object-cover opacity-50" sizes="120px" />
            </div>
          ))}
          {images.length + uploadingImages.length < 8 && (
            <div
              {...getRootProps()}
              className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${
                isDragActive ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">Add photo</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400">First photo will be the main listing photo. Up to 8 photos.</p>
      </div>

      {/* Title */}
      <Input
        label="Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. iPhone 14 Pro 256GB Space Black"
        required
        maxLength={80}
      />

      {/* Brand */}
      <Input
        label="Brand"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        placeholder="e.g. Apple, Samsung, Nike (optional)"
        maxLength={60}
      />

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your item — condition, history, reason for selling, what's included..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>

      {/* Price */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Price (AED) *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">AED</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="1"
            step="0.01"
            placeholder="0"
            required
            className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : '')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Condition */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Condition *</label>
        <div className="flex flex-col gap-2">
          {CONDITIONS.map((c) => (
            <label
              key={c.value}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                condition === c.value
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="condition"
                value={c.value}
                checked={condition === c.value}
                onChange={() => setCondition(c.value)}
                className="text-amber-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{c.label}</p>
                <p className="text-xs text-gray-400">{c.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <Input
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Dubai, UAE"
      />

      {/* Submit */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-3">
          <Button type="submit" loading={loading} size="lg" className="flex-1">
            {mode === 'edit' ? 'Save changes' : 'List item'}
          </Button>
          {mode === 'edit' && (
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
        </div>
        {mode === 'create' && (
          <button
            type="button"
            onClick={() => save('draft')}
            disabled={draftLoading || loading}
            className="w-full text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-xl py-2.5 transition disabled:opacity-50"
          >
            {draftLoading ? 'Saving draft…' : 'Save as draft'}
          </button>
        )}
      </div>
    </form>
  )
}
