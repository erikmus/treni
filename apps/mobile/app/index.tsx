import { Redirect } from 'expo-router'
import { useAuth } from '../src/lib/auth-context'
import { View, ActivityIndicator, StyleSheet } from 'react-native'

export default function Index() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (user) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/login" />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
