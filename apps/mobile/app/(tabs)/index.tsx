import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/lib/auth-context'
import { supabase } from '../../src/lib/supabase'
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns'
import { nl } from 'date-fns/locale'

type Workout = {
  id: string
  workout_type: string
  title: string
  description: string | null
  scheduled_date: string
  status: string | null
  target_duration_minutes: number | null
  target_distance_km: number | null
}

type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

type WeekStats = {
  totalDistance: number
  totalDuration: number
  completedWorkouts: number
  plannedWorkouts: number
}

const { width } = Dimensions.get('window')

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [weekWorkouts, setWeekWorkouts] = useState<Workout[]>([])
  const [weekStats, setWeekStats] = useState<WeekStats>({ totalDistance: 0, totalDuration: 0, completedWorkouts: 0, plannedWorkouts: 0 })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }

    // Fetch this week's workouts
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    
    const { data: workoutsData } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
      .order('scheduled_date', { ascending: true })

    if (workoutsData) {
      setWeekWorkouts(workoutsData)
      
      // Calculate stats
      const completed = workoutsData.filter(w => w.status === 'completed')
      setWeekStats({
        totalDistance: completed.reduce((sum, w) => sum + (w.target_distance_km || 0), 0),
        totalDuration: completed.reduce((sum, w) => sum + (w.target_duration_minutes || 0), 0),
        completedWorkouts: completed.length,
        plannedWorkouts: workoutsData.length,
      })
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Goedemorgen'
    if (hour < 18) return 'Goedemiddag'
    return 'Goedenavond'
  }

  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case 'easy_run': return '🏃'
      case 'long_run': return '🏃‍♂️'
      case 'tempo_run': return '⚡'
      case 'interval': return '🔥'
      case 'recovery': return '🧘'
      case 'rest': return '😴'
      case 'cross_training': return '💪'
      default: return '🏃'
    }
  }

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'easy_run': return '#22c55e'
      case 'long_run': return '#3b82f6'
      case 'tempo_run': return '#f59e0b'
      case 'interval': return '#ef4444'
      case 'recovery': return '#8b5cf6'
      case 'rest': return '#64748b'
      default: return '#3b82f6'
    }
  }

  const todayWorkout = weekWorkouts.find(w => isToday(parseISO(w.scheduled_date)))
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  })

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>{profile?.full_name || 'Atleet'}</Text>
        </View>
        <TouchableOpacity style={styles.avatarButton} onPress={() => router.push('/(tabs)/profile')}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Week Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deze week</Text>
        <View style={styles.weekGrid}>
          {weekDays.map((day, index) => {
            const workout = weekWorkouts.find(w => isSameDay(parseISO(w.scheduled_date), day))
            const isCurrentDay = isToday(day)
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isCurrentDay && styles.dayCellToday,
                  workout?.status === 'completed' && styles.dayCellCompleted,
                ]}
                onPress={() => workout && router.push(`/(tabs)/workouts`)}
              >
                <Text style={[styles.dayLabel, isCurrentDay && styles.dayLabelToday]}>
                  {format(day, 'EEEEE', { locale: nl })}
                </Text>
                {workout ? (
                  <View style={[styles.workoutDot, { backgroundColor: getWorkoutTypeColor(workout.workout_type) }]}>
                    {workout.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                ) : (
                  <View style={styles.restDot} />
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Today's Workout */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vandaag</Text>
        {todayWorkout ? (
          <TouchableOpacity 
            style={styles.todayCard}
            onPress={() => router.push('/(tabs)/workouts')}
          >
            <View style={styles.todayHeader}>
              <View style={styles.todayIconContainer}>
                <Text style={styles.todayIcon}>{getWorkoutTypeIcon(todayWorkout.workout_type)}</Text>
              </View>
              <View style={styles.todayInfo}>
                <Text style={styles.todayType}>{todayWorkout.workout_type.replace('_', ' ')}</Text>
                <Text style={styles.todayTitle}>{todayWorkout.title}</Text>
              </View>
              {todayWorkout.status === 'completed' ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓ Voltooid</Text>
                </View>
              ) : (
                <View style={styles.scheduledBadge}>
                  <Text style={styles.scheduledText}>Gepland</Text>
                </View>
              )}
            </View>
            
            {todayWorkout.description && (
              <Text style={styles.todayDescription} numberOfLines={2}>
                {todayWorkout.description}
              </Text>
            )}
            
            <View style={styles.todayStats}>
              {todayWorkout.target_distance_km && (
                <View style={styles.todayStat}>
                  <Text style={styles.todayStatValue}>{todayWorkout.target_distance_km}</Text>
                  <Text style={styles.todayStatLabel}>km</Text>
                </View>
              )}
              {todayWorkout.target_duration_minutes && (
                <View style={styles.todayStat}>
                  <Text style={styles.todayStatValue}>{todayWorkout.target_duration_minutes}</Text>
                  <Text style={styles.todayStatLabel}>min</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.restCard}>
            <Text style={styles.restIcon}>🎉</Text>
            <Text style={styles.restTitle}>Rustdag!</Text>
            <Text style={styles.restText}>Geen workout gepland voor vandaag. Geniet van je rust!</Text>
          </View>
        )}
      </View>

      {/* Week Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voortgang deze week</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weekStats.totalDistance.toFixed(1)}</Text>
            <Text style={styles.statLabel}>km gelopen</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weekStats.totalDuration}</Text>
            <Text style={styles.statLabel}>minuten</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weekStats.completedWorkouts}/{weekStats.plannedWorkouts}</Text>
            <Text style={styles.statLabel}>workouts</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Snelle acties</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/activities')}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionLabel}>Activiteiten</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/workouts')}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionLabel}>Planning</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#94a3b8',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
  },
  dayCell: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    width: (width - 80) / 7,
  },
  dayCellToday: {
    backgroundColor: '#334155',
  },
  dayCellCompleted: {
    opacity: 0.8,
  },
  dayLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dayLabelToday: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  workoutDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  restDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
  },
  todayCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  todayIcon: {
    fontSize: 24,
  },
  todayInfo: {
    flex: 1,
  },
  todayType: {
    fontSize: 12,
    color: '#3b82f6',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: '#166534',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completedText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  scheduledBadge: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scheduledText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  todayDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 16,
  },
  todayStats: {
    flexDirection: 'row',
    gap: 24,
  },
  todayStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  todayStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  todayStatLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  restCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  restIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  restTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  restText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 32,
  },
})
