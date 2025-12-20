import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Linking, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/lib/auth-context'
import { supabase } from '../../src/lib/supabase'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  distance_unit: string
  locale: string
  experience_level: string | null
  weekly_available_hours: number | null
  strava_athlete_id: number | null
  garmin_user_id: string | null
}

type Stats = {
  totalActivities: number
  totalDistance: number
  totalDuration: number
  currentStreak: number
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ totalActivities: 0, totalDistance: 0, totalDuration: 0, currentStreak: 0 })

  const fetchProfile = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }

    // Fetch activity stats
    const { data: activities } = await supabase
      .from('activities')
      .select('distance_meters, duration_seconds, started_at')
      .eq('user_id', user.id)

    if (activities) {
      const totalDistance = activities.reduce((sum, a) => sum + (a.distance_meters || 0), 0) / 1000
      const totalDuration = activities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0)
      
      setStats({
        totalActivities: activities.length,
        totalDistance,
        totalDuration,
        currentStreak: 0, // TODO: Calculate actual streak
      })
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSignOut = async () => {
    Alert.alert(
      'Uitloggen',
      'Weet je zeker dat je wilt uitloggen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Uitloggen',
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/(auth)/login')
          },
        },
      ]
    )
  }

  const toggleDistanceUnit = async () => {
    if (!profile) return
    
    const newUnit = profile.distance_unit === 'km' ? 'mi' : 'km'
    
    await supabase
      .from('profiles')
      .update({ distance_unit: newUnit })
      .eq('id', profile.id)
    
    setProfile({ ...profile, distance_unit: newUnit })
  }

  const toggleLocale = async () => {
    if (!profile) return
    
    const newLocale = profile.locale === 'nl' ? 'en' : 'nl'
    
    await supabase
      .from('profiles')
      .update({ locale: newLocale })
      .eq('id', profile.id)
    
    setProfile({ ...profile, locale: newLocale })
  }

  const openWebApp = () => {
    Linking.openURL('https://treni.app') // Update with actual URL
  }

  const getExperienceLabel = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'Beginner'
      case 'intermediate': return 'Gevorderd'
      case 'advanced': return 'Ervaren'
      case 'elite': return 'Elite'
      default: return 'Niet ingesteld'
    }
  }

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    return `${hours} uur`
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image 
              source={{ uri: profile.avatar_url }} 
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>
              {profile?.experience_level?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Geen naam'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.experience}>{getExperienceLabel(profile?.experience_level)}</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalActivities}</Text>
          <Text style={styles.statLabel}>Activiteiten</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalDistance.toFixed(0)}</Text>
          <Text style={styles.statLabel}>km totaal</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTotalTime(stats.totalDuration)}</Text>
          <Text style={styles.statLabel}>getraind</Text>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voorkeuren</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>📏</Text>
            <Text style={styles.settingLabel}>Afstandseenheid</Text>
          </View>
          <View style={styles.settingControl}>
            <Text style={styles.settingValue}>{profile?.distance_unit === 'mi' ? 'Miles' : 'Kilometers'}</Text>
            <Switch
              value={profile?.distance_unit === 'mi'}
              onValueChange={toggleDistanceUnit}
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingIcon}>🌍</Text>
            <Text style={styles.settingLabel}>Taal</Text>
          </View>
          <View style={styles.settingControl}>
            <Text style={styles.settingValue}>{profile?.locale === 'nl' ? 'Nederlands' : 'English'}</Text>
            <Switch
              value={profile?.locale === 'en'}
              onValueChange={toggleLocale}
              trackColor={{ false: '#334155', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* Integrations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integraties</Text>
        
        <TouchableOpacity style={styles.integrationItem} onPress={openWebApp}>
          <View style={styles.integrationIcon}>
            <Text style={styles.stravaLogo}>🔶</Text>
          </View>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>Strava</Text>
            <Text style={styles.integrationStatus}>
              {profile?.strava_athlete_id ? 'Gekoppeld' : 'Niet gekoppeld'}
            </Text>
          </View>
          <View style={[styles.statusDot, profile?.strava_athlete_id && styles.statusDotConnected]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.integrationItem} onPress={openWebApp}>
          <View style={styles.integrationIcon}>
            <Text style={styles.garminLogo}>🟢</Text>
          </View>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>Garmin</Text>
            <Text style={styles.integrationStatus}>
              {profile?.garmin_user_id ? 'Gekoppeld' : 'Niet gekoppeld'}
            </Text>
          </View>
          <View style={[styles.statusDot, profile?.garmin_user_id && styles.statusDotConnected]} />
        </TouchableOpacity>

        <Text style={styles.integrationHint}>
          Beheer integraties via de web app
        </Text>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={openWebApp}>
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuLabel}>Profiel bewerken</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={openWebApp}>
          <Text style={styles.menuIcon}>🎯</Text>
          <Text style={styles.menuLabel}>Trainingsplan</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={openWebApp}>
          <Text style={styles.menuIcon}>💳</Text>
          <Text style={styles.menuLabel}>Abonnement</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleSignOut}>
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={styles.menuLabelDanger}>Uitloggen</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.version}>Treni v1.0.0</Text>
        <Text style={styles.copyright}>© 2024 Treni. Alle rechten voorbehouden.</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  experience: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  settingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingValue: {
    fontSize: 14,
    color: '#94a3b8',
  },
  integrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  integrationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stravaLogo: {
    fontSize: 20,
  },
  garminLogo: {
    fontSize: 20,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  integrationStatus: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#64748b',
  },
  statusDotConnected: {
    backgroundColor: '#22c55e',
  },
  integrationHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemDanger: {
    marginTop: 8,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  menuLabelDanger: {
    flex: 1,
    fontSize: 16,
    color: '#ef4444',
  },
  menuArrow: {
    fontSize: 20,
    color: '#64748b',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  version: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#475569',
  },
})
