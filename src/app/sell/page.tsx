import { redirect } from 'next/navigation'

// Redirect /sell → /items/new
export default function SellRedirect() {
  redirect('/items/new')
}
