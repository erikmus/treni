import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/lib/auth-context'
import { supabase } from '../../src/lib/supabase'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

type Activity = {
  id: string
  activity_type: string
  title: string | null
  started_at: string
  duration_seconds: number
  moving_time_seconds: number | null
  distance_meters: number | null
  avg_pace_sec_per_km: number | null
  best_pace_sec_per_km: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  elevation_gain_meters: number | null
  calories: number | null
  source: string | null
  feeling: string | null
  perceived_effort: number | null
}

const { width } = Dimensions.get('window')

export default function Activities() {
  const { user } = useAuth()
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

  const fetchActivities = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50)

    if (data) {
      setActivities(data)
    }
  }, [user])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const onRefresh = async () => {
    setIsRefreshing(true)
    await fetchActivities()
    setIsRefreshing(false)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatPace = (paceSecPerKm: number | null) => {
    if (!paceSecPerKm) return '-'
    const mins = Math.floor(paceSecPerKm / 60)
    const secs = Math.round(paceSecPerKm % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number | null) => {
    if (!meters) return '-'
    const km = meters / 1000
    return km.toFixed(2)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'run': return '🏃‍♂️'
      case 'walk': return '🚶‍♂️'
      case 'cycling': return '🚴‍♂️'
      case 'swimming': return '🏊‍♂️'
      case 'cross_training': return '💪'
      default: return '🏃'
    }
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'run': return 'Hardlopen'
      case 'walk': return 'Wandelen'
      case 'cycling': return 'Fietsen'
      case 'swimming': return 'Zwemmen'
      case 'cross_training': return 'Cross training'
      default: return type
    }
  }

  const getSourceIcon = (source: string | null) => {
    switch (source) {
      case 'strava': return '🔶'
      case 'garmin': return '🟢'
      case 'import': return '📥'
      default: return '✏️'
    }
  }

  const getFeelingEmoji = (feeling: string | null) => {
    switch (feeling) {
      case 'great': return '🤩'
      case 'good': return '😊'
      case 'okay': return '😐'
      case 'tired': return '😓'
      case 'exhausted': return '😵'
      default: return null
    }
  }

  const renderActivity = ({ item, index }: { item: Activity; index: number }) => {
    const isSelected = selectedActivity?.id === item.id

    return (
      <TouchableOpacity
        style={[styles.activityCard, isSelected && styles.activityCardSelected]}
        onPress={() => router.push(`/activity/${item.id}`)}
        onLongPress={() => setSelectedActivity(isSelected ? null : item)}
        activeOpacity={0.8}
      >
        <View style={styles.activityHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.activityIcon}>{getActivityIcon(item.activity_type)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.activityTitle}>{item.title || getActivityTypeLabel(item.activity_type)}</Text>
            <Text style={styles.activityDate}>
              {format(parseISO(item.started_at), "EEEE d MMMM 'om' HH:mm", { locale: nl })}
            </Text>
          </View>
          {item.feeling && (
            <Text style={styles.feelingEmoji}>{getFeelingEmoji(item.feeling)}</Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPrimary}>
            <Text style={styles.statPrimaryValue}>{formatDistance(item.distance_meters)}</Text>
            <Text style={styles.statPrimaryLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statPrimary}>
            <Text style={styles.statPrimaryValue}>{formatDuration(item.moving_time_seconds || item.duration_seconds)}</Text>
            <Text style={styles.statPrimaryLabel}>tijd</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statPrimary}>
            <Text style={styles.statPrimaryValue}>{formatPace(item.avg_pace_sec_per_km)}</Text>
            <Text style={styles.statPrimaryLabel}>/km</Text>
          </View>
        </View>

        {/* Expanded stats */}
        {isSelected && (
          <View style={styles.expandedStats}>
            <View style={styles.statsGrid}>
              {item.best_pace_sec_per_km && (
                <View style={styles.gridStat}>
                  <Text style={styles.gridStatValue}>{formatPace(item.best_pace_sec_per_km)}/km</Text>
                  <Text style={styles.gridStatLabel}>Beste tempo</Text>
                </View>
              )}
              {item.avg_heart_rate && (
                <View style={styles.gridStat}>
                  <Text style={styles.gridStatValue}>{item.avg_heart_rate} bpm</Text>
                  <Text style={styles.gridStatLabel}>Gem. hartslag</Text>
                </View>
              )}
              {item.max_heart_rate && (
                <View style={styles.gridStat}>
                  <Text style={styles.gridStatValue}>{item.max_heart_rate} bpm</Text>
                  <Text style={styles.gridStatLabel}>Max. hartslag</Text>
                </View>
              )}
              {item.elevation_gain_meters && (
                <View style={styles.gridStat}>
                  <Text style={styles.gridStatValue}>{Math.round(item.elevation_gain_meters)} m</Text>
                  <Text style={styles.gridStatLabel}>Hoogtemeters</Text>
                </View>
              )}
              {item.calories && (
                <View style={styles.gridStat}>
                  <Text style={styles.gridStatValue}>{item.calories}</Text>
                  <Text style={styles.gridStatLabel}>Calorieën</Text>
                </View>
              )}
              {item.perceived_effort && (
                <View style={styles.gridStat}>
                  <Text style={styles.gridStatValue}>{item.perceived_effort}/10</Text>
                  <Text style={styles.gridStatLabel}>Inspanning</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {item.source && item.source !== 'manual' && (
          <View style={styles.sourceTag}>
            <Text style={styles.sourceIcon}>{getSourceIcon(item.source)}</Text>
            <Text style={styles.sourceText}>{item.source}</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  // Calculate totals for header
  const thisMonthActivities = activities.filter(a => {
    const activityDate = parseISO(a.started_at)
    const now = new Date()
    return activityDate.getMonth() === now.getMonth() && activityDate.getFullYear() === now.getFullYear()
  })

  const totalDistance = thisMonthActivities.reduce((sum, a) => sum + (a.distance_meters || 0), 0) / 1000
  const totalDuration = thisMonthActivities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0)
  const totalActivities = thisMonthActivities.length

  return (
    <View style={styles.container}>
      {/* Month Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Deze maand</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{totalDistance.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>km</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{Math.floor(totalDuration / 3600)}:{Math.floor((totalDuration % 3600) / 60).toString().padStart(2, '0')}</Text>
            <Text style={styles.summaryLabel}>uur</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{totalActivities}</Text>
            <Text style={styles.summaryLabel}>activiteiten</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏃‍♂️</Text>
            <Text style={styles.emptyTitle}>Nog geen activiteiten</Text>
            <Text style={styles.emptyText}>
              Koppel Strava via de web app of voeg handmatig een activiteit toe
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  summaryContainer: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  activityCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activityCardSelected: {
    borderColor: '#3b82f6',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 13,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  feelingEmoji: {
    fontSize: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
  },
  statPrimary: {
    flex: 1,
    alignItems: 'center',
  },
  statPrimaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statPrimaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#475569',
  },
  expandedStats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridStat: {
    width: (width - 80) / 3,
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  gridStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  gridStatLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  sourceIcon: {
    fontSize: 12,
  },
  sourceText: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
})
