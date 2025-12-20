import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, SectionList, RefreshControl, TouchableOpacity, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/lib/auth-context'
import { supabase } from '../../src/lib/supabase'
import { format, parseISO, isToday, isTomorrow, isPast, startOfWeek, addDays } from 'date-fns'
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
  workout_structure: any
}

type WorkoutSection = {
  title: string
  data: Workout[]
}

const { width } = Dimensions.get('window')

export default function Workouts() {
  const { user } = useAuth()
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)

  const fetchWorkouts = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_date', format(addDays(new Date(), -7), 'yyyy-MM-dd'))
      .order('scheduled_date', { ascending: true })
      .limit(50)

    if (data) {
      setWorkouts(data)
    }
  }, [user])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  const onRefresh = async () => {
    setIsRefreshing(true)
    await fetchWorkouts()
    setIsRefreshing(false)
  }

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Vandaag'
    if (isTomorrow(date)) return 'Morgen'
    if (isPast(date)) return format(date, "EEEE d MMMM '(afgelopen)'", { locale: nl })
    return format(date, 'EEEE d MMMM', { locale: nl })
  }

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'easy_run': return '#22c55e'
      case 'long_run': return '#3b82f6'
      case 'tempo_run': return '#f59e0b'
      case 'interval': return '#ef4444'
      case 'recovery': return '#8b5cf6'
      case 'rest': return '#64748b'
      case 'hill_training': return '#f97316'
      case 'race_pace': return '#ec4899'
      default: return '#3b82f6'
    }
  }

  const getWorkoutTypeLabel = (type: string) => {
    switch (type) {
      case 'easy_run': return 'Rustige duurloop'
      case 'long_run': return 'Lange duurloop'
      case 'tempo_run': return 'Tempo training'
      case 'interval': return 'Intervaltraining'
      case 'recovery': return 'Herstelloop'
      case 'rest': return 'Rustdag'
      case 'hill_training': return 'Heuveltraining'
      case 'race_pace': return 'Wedstrijdtempo'
      case 'fartlek': return 'Fartlek'
      case 'cross_training': return 'Cross training'
      default: return type.replace('_', ' ')
    }
  }

  const getWorkoutIcon = (type: string) => {
    switch (type) {
      case 'easy_run': return '🏃'
      case 'long_run': return '🏃‍♂️'
      case 'tempo_run': return '⚡'
      case 'interval': return '🔥'
      case 'recovery': return '🧘'
      case 'rest': return '😴'
      case 'hill_training': return '⛰️'
      case 'race_pace': return '🎯'
      case 'fartlek': return '🎲'
      case 'cross_training': return '💪'
      default: return '🏃'
    }
  }

  const markAsCompleted = async (workoutId: string) => {
    await supabase
      .from('workouts')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', workoutId)
    
    await fetchWorkouts()
    setSelectedWorkout(null)
  }

  const markAsSkipped = async (workoutId: string) => {
    await supabase
      .from('workouts')
      .update({ status: 'skipped' })
      .eq('id', workoutId)
    
    await fetchWorkouts()
    setSelectedWorkout(null)
  }

  // Group workouts by week
  const sections: WorkoutSection[] = []
  const workoutsByWeek = new Map<string, Workout[]>()
  
  workouts.forEach(workout => {
    const weekStart = format(startOfWeek(parseISO(workout.scheduled_date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    if (!workoutsByWeek.has(weekStart)) {
      workoutsByWeek.set(weekStart, [])
    }
    workoutsByWeek.get(weekStart)!.push(workout)
  })

  workoutsByWeek.forEach((workouts, weekStart) => {
    const weekStartDate = parseISO(weekStart)
    const isCurrentWeek = isToday(weekStartDate) || (weekStartDate <= new Date() && addDays(weekStartDate, 6) >= new Date())
    sections.push({
      title: isCurrentWeek ? 'Deze week' : format(weekStartDate, "'Week van' d MMMM", { locale: nl }),
      data: workouts,
    })
  })

  const renderWorkout = ({ item }: { item: Workout }) => {
    const isPastWorkout = isPast(parseISO(item.scheduled_date)) && !isToday(parseISO(item.scheduled_date))
    
    return (
      <TouchableOpacity 
        style={[styles.workoutCard, selectedWorkout?.id === item.id && styles.workoutCardSelected]}
        onPress={() => setSelectedWorkout(selectedWorkout?.id === item.id ? null : item)}
        activeOpacity={0.8}
      >
        <View style={styles.dateHeader}>
          <Text style={[styles.dateLabel, isToday(parseISO(item.scheduled_date)) && styles.dateLabelToday]}>
            {getDateLabel(item.scheduled_date)}
          </Text>
          {item.status === 'completed' && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ Voltooid</Text>
            </View>
          )}
          {item.status === 'skipped' && (
            <View style={styles.skippedBadge}>
              <Text style={styles.skippedBadgeText}>Overgeslagen</Text>
            </View>
          )}
        </View>

        <View style={styles.workoutContent}>
          <View style={[styles.typeIndicator, { backgroundColor: getWorkoutTypeColor(item.workout_type) }]} />
          <View style={styles.workoutMain}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutIcon}>{getWorkoutIcon(item.workout_type)}</Text>
              <View style={styles.workoutTitleContainer}>
                <Text style={styles.workoutType}>{getWorkoutTypeLabel(item.workout_type)}</Text>
                <Text style={styles.workoutTitle}>{item.title}</Text>
              </View>
            </View>

            <View style={styles.workoutMeta}>
              {item.target_distance_km && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaValue}>{item.target_distance_km}</Text>
                  <Text style={styles.metaLabel}>km</Text>
                </View>
              )}
              {item.target_duration_minutes && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaValue}>{item.target_duration_minutes}</Text>
                  <Text style={styles.metaLabel}>min</Text>
                </View>
              )}
            </View>

            {item.description && (
              <Text style={styles.workoutDescription} numberOfLines={selectedWorkout?.id === item.id ? undefined : 2}>
                {item.description}
              </Text>
            )}

            {/* Expanded content */}
            {selectedWorkout?.id === item.id && item.status !== 'completed' && item.status !== 'skipped' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => router.push(`/workout/${item.id}`)}
                >
                  <Text style={styles.startButtonText}>▶ Start activiteit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.skipButton}
                  onPress={() => markAsSkipped(item.id)}
                >
                  <Text style={styles.skipButtonText}>Overslaan</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderSectionHeader = ({ section }: { section: WorkoutSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        renderItem={renderWorkout}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Geen workouts gepland</Text>
            <Text style={styles.emptyText}>
              Maak een trainingsplan aan via de web app om te beginnen met trainen
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
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  workoutCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  workoutCardSelected: {
    borderColor: '#3b82f6',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dateLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateLabelToday: {
    color: '#3b82f6',
  },
  completedBadge: {
    backgroundColor: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
  skippedBadge: {
    backgroundColor: '#44403c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skippedBadgeText: {
    fontSize: 11,
    color: '#a8a29e',
    fontWeight: '600',
  },
  workoutContent: {
    flexDirection: 'row',
    padding: 16,
  },
  typeIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  workoutMain: {
    flex: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  workoutTitleContainer: {
    flex: 1,
  },
  workoutType: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  workoutTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metaValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  workoutDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#64748b',
  },
  skipButtonText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
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
