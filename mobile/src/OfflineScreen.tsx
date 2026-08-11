import { Pressable, StyleSheet, Text, View } from 'react-native'
import { APP_NAME } from './config'

type Props = {
  title?: string
  message?: string
  onRetry: () => void
}

export default function OfflineScreen({
  title = 'You are offline',
  message = 'Check your connection and try again to browse Dubai Market.',
  onRetry,
}: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.badge}>
        <Text style={styles.badgeText}>D</Text>
      </View>
      <Text style={styles.brand}>{APP_NAME}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Retry"
      >
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonPressed: {
    backgroundColor: '#d97706',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
