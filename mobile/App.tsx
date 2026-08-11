import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Share,
  StyleSheet,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import * as Haptics from 'expo-haptics'
import NetInfo from '@react-native-community/netinfo'
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview'
import { APP_URL } from './src/config'
import { deepLinkToWebUrl, isAllowedUrl, openExternal } from './src/url'
import OfflineScreen from './src/OfflineScreen'

SplashScreen.preventAutoHideAsync().catch(() => {})

const USER_AGENT_SUFFIX = ' DubaiMarketApp/1.0'

/** Runs before content loads — marks the page as the native shell. */
const INJECTED_BEFORE = `
(function() {
  window.__DUBAI_MARKET_NATIVE__ = true;
  try {
    document.documentElement.classList.add('dubai-market-native-app');
  } catch (e) {}
  true;
})();
`

type BridgeMessage =
  | { type: 'share'; title?: string; text?: string; url?: string }
  | { type: 'haptic'; style?: 'light' | 'medium' }

export default function App() {
  const webRef = useRef<WebView>(null)
  const [uri, setUri] = useState(APP_URL)
  const [canGoBack, setCanGoBack] = useState(false)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [webKey, setWebKey] = useState(0)

  const hideSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  const reload = useCallback(() => {
    setLoadError(false)
    setLoading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setWebKey((k) => k + 1)
  }, [])

  const onBridgeMessage = useCallback(async (event: WebViewMessageEvent) => {
    let data: BridgeMessage
    try {
      data = JSON.parse(event.nativeEvent.data) as BridgeMessage
    } catch {
      return
    }

    if (data.type === 'share' && data.url) {
      try {
        await Share.share({
          title: data.title || 'Dubai Market',
          message: data.text ? `${data.text}\n${data.url}` : data.url,
          url: data.url,
        })
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      } catch {
        // cancelled
      }
      return
    }

    if (data.type === 'haptic') {
      const style =
        data.style === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      Haptics.impactAsync(style).catch(() => {})
    }
  }, [])

  useEffect(() => {
    // Show offline screen immediately if already offline at launch (no WebView load to call hideSplash)
    NetInfo.fetch().then((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false)
      if (!online) {
        setOffline(true)
        hideSplash()
      }
    })
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false)
      setOffline(!online)
    })
    return () => unsub()
  }, [hideSplash])

  useEffect(() => {
    const handleUrl = (url: string) => {
      const web = deepLinkToWebUrl(url)
      if (web) setUri(web)
    }
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url)
    })
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url))
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'android') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webRef.current?.goBack()
        return true
      }
      return false
    })
    return () => sub.remove()
  }, [canGoBack])

  if (offline) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <OfflineScreen
          onRetry={() => {
            NetInfo.fetch().then((s) => {
              const online = !!(s.isConnected && s.isInternetReachable !== false)
              if (online) {
                setOffline(false)
                reload()
              }
            })
          }}
        />
      </View>
    )
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <OfflineScreen
          title="Could not load"
          message="Something went wrong loading Dubai Market. Please try again."
          onRetry={reload}
        />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <WebView
        key={webKey}
        ref={webRef}
        source={{ uri }}
        style={styles.webview}
        applicationNameForUserAgent={USER_AGENT_SUFFIX}
        injectedJavaScriptBeforeContentLoaded={INJECTED_BEFORE}
        onMessage={onBridgeMessage}
        onNavigationStateChange={(nav: WebViewNavigation) => {
          setCanGoBack(nav.canGoBack)
        }}
        onShouldStartLoadWithRequest={(req) => {
          const { url, isTopFrame } = req
          if (!isTopFrame) return true
          if (url.startsWith('about:blank') || url.startsWith('data:')) return true

          if (
            url.startsWith('tel:') ||
            url.startsWith('mailto:') ||
            url.startsWith('sms:') ||
            url.startsWith('maps:') ||
            url.startsWith('geo:')
          ) {
            openExternal(url)
            return false
          }

          if (isAllowedUrl(url)) return true

          openExternal(url)
          return false
        }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => {
          setLoading(false)
          hideSplash()
        }}
        onError={() => {
          setLoading(false)
          setLoadError(true)
          hideSplash()
        }}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) {
            setLoadError(true)
          }
        }}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        allowsFullscreenVideo
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        startInLoadingState={false}
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        allowsLinkPreview={false}
        decelerationRate="normal"
        // Keep content under the status bar; web CSS uses safe-area insets.
        contentInsetAdjustmentBehavior="automatic"
      />
      {loading && (
        <View style={[styles.loader, { pointerEvents: 'none' }]}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
})
