import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          borderRadius: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 110,
          fontWeight: 700,
          fontFamily: 'system-ui',
        }}
      >
        D
      </div>
    ),
    { width: 192, height: 192 }
  )
}
