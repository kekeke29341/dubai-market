import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ItemForm from '@/components/items/ItemForm'

export default async function SellPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/sell')

  const { data: categories } = await supabase.from('categories').select('*').order('id')

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">List an item for sale</h1>
      <ItemForm categories={categories || []} mode="create" />
    </div>
  )
}
