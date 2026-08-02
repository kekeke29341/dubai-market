#!/usr/bin/env bash
# Push Supabase env vars to the linked Vercel project (production + preview + development).
# Usage:
#   export NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
#   export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
#   export SUPABASE_SERVICE_ROLE_KEY=eyJ...
#   ./scripts/set-vercel-env.sh

set -euo pipefail

cd "$(dirname "$0")/.."

require() {
  if [[ -z "${!1:-}" ]]; then
    echo "Missing env: $1" >&2
    exit 1
  fi
}

require NEXT_PUBLIC_SUPABASE_URL
require NEXT_PUBLIC_SUPABASE_ANON_KEY
require SUPABASE_SERVICE_ROLE_KEY

add_env() {
  local name="$1"
  local value="$2"
  local env="$3"
  # Remove existing value if present (ignore errors)
  printf '%s\n' "$value" | vercel env rm "$name" "$env" --yes >/dev/null 2>&1 || true
  printf '%s\n' "$value" | vercel env add "$name" "$env"
}

for env in production preview development; do
  echo "→ Setting vars for $env"
  add_env NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL" "$env"
  add_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$env"
  add_env SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY" "$env"
done

echo "Done. Redeploy with: vercel --prod --yes"
