import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          borderRadius: 112,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 300,
          fontWeight: 700,
          fontFamily: 'system-ui',
        }}
      >
        D
      </div>
    ),
    { width: 512, height: 512 }
  )
}
