import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminAuthError, rejectCrossOrigin, requireAdmin } from '@/lib/adminAuth'
import { normalizeProhibitedWord } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return adminAuthError(auth)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('prohibited_words')
    .select('id, word, active')
    .order('word', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ words: data ?? [] })
}

export async function POST(req: NextRequest) {
  const originError = rejectCrossOrigin(req)
  if (originError) return originError
  const auth = await requireAdmin()
  if (!auth.ok) return adminAuthError(auth)

  const body = await req.json().catch(() => ({}))
  const word = normalizeProhibitedWord(typeof body.word === 'string' ? body.word : '')
  if (!word) {
    return NextResponse.json({ error: 'Invalid word (2–40 letters or numbers)' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('prohibited_words')
    .insert({ word, active: true })
    .select('id, word, active')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That word is already on the list' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    admin_id: auth.user.id,
    action: 'prohibited_word.add',
    target_type: 'prohibited_word',
    target_id: String(data.id),
    details: { word },
  })

  return NextResponse.json({ word: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const originError = rejectCrossOrigin(req)
  if (originError) return originError
  const auth = await requireAdmin()
  if (!auth.ok) return adminAuthError(auth)

  const body = await req.json().catch(() => ({}))
  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const payload: { word?: string; active?: boolean } = {}
  if (typeof body.word === 'string') {
    const word = normalizeProhibitedWord(body.word)
    if (!word) {
      return NextResponse.json({ error: 'Invalid word (2–40 letters or numbers)' }, { status: 400 })
    }
    payload.word = word
  }
  if (typeof body.active === 'boolean') {
    payload.active = body.active
  }
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('prohibited_words')
    .update(payload)
    .eq('id', id)
    .select('id, word, active')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    admin_id: auth.user.id,
    action: 'prohibited_word.update',
    target_type: 'prohibited_word',
    target_id: String(id),
    details: payload,
  })

  return NextResponse.json({ word: data })
}

export async function DELETE(req: NextRequest) {
  const originError = rejectCrossOrigin(req)
  if (originError) return originError
  const auth = await requireAdmin()
  if (!auth.ok) return adminAuthError(auth)

  const body = await req.json().catch(() => ({}))
  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('prohibited_words')
    .delete()
    .eq('id', id)
    .select('id, word')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await admin.from('admin_audit_logs').insert({
    admin_id: auth.user.id,
    action: 'prohibited_word.delete',
    target_type: 'prohibited_word',
    target_id: String(id),
    details: { word: data?.word },
  })

  return NextResponse.json({ ok: true })
}
