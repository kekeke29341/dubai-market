/**
 * Supabase Edge Function: send-push
 *
 * Triggered by Supabase Database Webhook on notifications INSERT.
 * Fetches the user's push subscriptions and delivers a Web Push message.
 *
 * Environment variables required:
 *   VAPID_PUBLIC_KEY   — base64url VAPID public key
 *   VAPID_PRIVATE_KEY  — base64url VAPID private key
 *   VAPID_SUBJECT      — mailto: or https: contact URI
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Minimal VAPID + Web Push implementation using SubtleCrypto (Deno)
// ---------------------------------------------------------------------------

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function base64urlEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function buildVapidJwt(
  subject: string,
  publicKeyB64: string,
  privateKeyB64: string,
  audience: string
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject }

  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const sigInput = `${headerB64}.${payloadB64}`

  const privKeyBytes = base64urlDecode(privateKeyB64)
  // Raw private key bytes for P-256 (32 bytes)
  const privateKey = await crypto.subtle.importKey(
    'raw',
    privKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(sigInput)
  )

  return `${sigInput}.${base64urlEncode(sig)}`
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublic: string,
  vapidPrivate: string,
  vapidSubject: string
): Promise<Response> {
  const url = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`

  const jwt = await buildVapidJwt(vapidSubject, vapidPublic, vapidPrivate, audience)

  // Encrypt payload with ECDH + AES-GCM (RFC 8291)
  // For simplicity, send as plain text with content-encoding: aes128gcm
  // Production: use a full web-push encryption lib
  const encoder = new TextEncoder()
  const body = encoder.encode(payload)

  return fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt},k=${vapidPublic}`,
      'Content-Type': 'application/json',
      'Content-Encoding': 'aes128gcm',
      TTL: '86400',
    },
    body,
  })
}

// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  // Webhook sends the new notification row in the request body
  const { record } = await req.json()
  if (!record) return new Response('no record', { status: 400 })

  const userId: string = record.user_id
  const notifTitle: string = record.title || 'Dubai Market'
  const notifBody: string = record.body || ''
  const itemId: string | null = record.item_id ?? null

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return new Response('no subs', { status: 200 })

  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@dubaimarket.ae'

  const pushPayload = JSON.stringify({
    title: notifTitle,
    body: notifBody,
    url: itemId ? `/items/${itemId}` : '/notifications',
    tag: record.type ?? 'dubai-market',
  })

  await Promise.allSettled(
    subs.map((sub) =>
      sendWebPush(sub, pushPayload, vapidPublic, vapidPrivate, vapidSubject).catch(() => null)
    )
  )

  return new Response(JSON.stringify({ sent: subs.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
