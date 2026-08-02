import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ItemForm from '@/components/items/ItemForm'

interface PageProps {
  params: { id: string }
}

export default async function EditItemPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', params.id)
    .eq('seller_id', user.id)
    .single()

  if (!item) notFound()

  const { data: categories } = await supabase.from('categories').select('*').order('id')

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit listing</h1>
      <ItemForm categories={categories || []} initialData={item} mode="edit" />
    </div>
  )
}
