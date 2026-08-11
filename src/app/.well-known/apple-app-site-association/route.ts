import { NextResponse } from 'next/server'

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appID: 'REPLACE_TEAM_ID.com.dubaimarket.app',
        paths: ['*'],
      },
    ],
  },
}

export function GET() {
  return NextResponse.json(aasa, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
