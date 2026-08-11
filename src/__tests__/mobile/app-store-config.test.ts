import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const mobileRoot = join(process.cwd(), 'mobile')

describe('mobile App Store config integrity', () => {
  it('app.json has required iOS identity and privacy strings', () => {
    const app = JSON.parse(readFileSync(join(mobileRoot, 'app.json'), 'utf8'))
    const ios = app.expo.ios
    expect(app.expo.name).toBe('Dubai Market')
    expect(ios.bundleIdentifier).toBe('com.dubaimarket.app')
    expect(ios.infoPlist.NSCameraUsageDescription).toMatch(/camera/i)
    expect(ios.infoPlist.NSPhotoLibraryUsageDescription).toMatch(/photo/i)
    expect(ios.infoPlist.ITSAppUsesNonExemptEncryption).toBe(false)
    expect(ios.associatedDomains).toContain('applinks:dubai-market-wine.vercel.app')
    expect(app.expo.scheme).toBe('dubai-market')
    expect(app.expo.icon).toBe('./assets/icon.png')
    expect(existsSync(join(mobileRoot, 'assets/icon.png'))).toBe(true)
    expect(existsSync(join(mobileRoot, 'assets/splash-icon.png'))).toBe(true)
    expect(existsSync(join(mobileRoot, 'assets/adaptive-icon.png'))).toBe(true)
  })

  it('eas.json has production build + submit placeholders documented', () => {
    const eas = JSON.parse(readFileSync(join(mobileRoot, 'eas.json'), 'utf8'))
    expect(eas.build.production).toBeTruthy()
    expect(eas.build.preview.distribution).toBe('internal')
    expect(eas.submit.production.ios.ascAppId).toMatch(/REPLACE|^\d+$/)
    expect(eas.submit.production.ios.appleTeamId).toMatch(/REPLACE|^[A-Z0-9]+$/)
  })

  it('App.tsx wires share bridge and native UA marker', () => {
    const src = readFileSync(join(mobileRoot, 'App.tsx'), 'utf8')
    expect(src).toContain('DubaiMarketApp/1.0')
    expect(src).toContain("type: 'share'")
    expect(src).toContain('Share.share')
    expect(src).toContain('mediaCapturePermissionGrantType')
    expect(src).toContain('__DUBAI_MARKET_NATIVE__')
  })

  it('listing docs exist for App Store Connect paste', () => {
    expect(existsSync(join(mobileRoot, 'APP_STORE.md'))).toBe(true)
    expect(existsSync(join(mobileRoot, 'STORE_LISTING.md'))).toBe(true)
    const listing = readFileSync(join(mobileRoot, 'STORE_LISTING.md'), 'utf8')
    expect(listing).toContain('/support')
    expect(listing).toContain('/privacy')
    expect(listing).toContain('Demo account')
  })
})
