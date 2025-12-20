import { useEffect, useState, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration, AppState, AppStateStatus } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/lib/auth-context'

type Workout = {
  id: string
  title: string
  workout_type: string
  description: string | null
  target_duration_minutes: number | null
  target_distance_km: number | null
  target_pace_min_per_km: number | null
  workout_structure: WorkoutBlock[] | null
}

type WorkoutBlock = {
  type: string
  duration_minutes?: number
  distance_km?: number
  pace_min_per_km?: number
  description?: string
}

type LocationPoint = {
  latitude: number
  longitude: number
  timestamp: number
  speed: number | null
}

type UserSettings = {
  distance_unit: 'km' | 'mi'
}

export default function WorkoutTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  
  // Workout data
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [settings, setSettings] = useState<UserSettings>({ distance_unit: 'km' })
  
  // Tracking state
  const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'paused' | 'finished'>('loading')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [distance, setDistance] = useState(0) // in meters
  const [currentPace, setCurrentPace] = useState<number | null>(null) // seconds per km
  const [avgPace, setAvgPace] = useState<number | null>(null)
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null) // m/s
  const [locations, setLocations] = useState<LocationPoint[]>([])
  
  // Current block tracking (for structured workouts)
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [blockDistance, setBlockDistance] = useState(0)
  const [blockElapsed, setBlockElapsed] = useState(0)
  
  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const locationSubscription = useRef<Location.LocationSubscription | null>(null)
  const lastLocation = useRef<LocationPoint | null>(null)
  const appState = useRef(AppState.currentState)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  // Fetch workout and user settings
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return
      
      const [workoutResult, profileResult] = await Promise.all([
        supabase.from('workouts').select('*').eq('id', id).single(),
        supabase.from('profiles').select('distance_unit').eq('id', user.id).single()
      ])
      
      if (workoutResult.data) {
        setWorkout(workoutResult.data)
      }
      
      if (profileResult.data?.distance_unit) {
        setSettings({ distance_unit: profileResult.data.distance_unit as 'km' | 'mi' })
      }
      
      setStatus('ready')
    }
    
    fetchData()
  }, [id, user])

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        if (status === 'running') {
          // Recalculate elapsed time
          const now = Date.now()
          setElapsedSeconds(Math.floor((now - startTimeRef.current - pausedTimeRef.current) / 1000))
        }
      }
      appState.current = nextAppState
    })

    return () => subscription.remove()
  }, [status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (locationSubscription.current) locationSubscription.current.remove()
      deactivateKeepAwake()
    }
  }, [])

  const requestLocationPermission = async (): Promise<boolean> => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync()
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Locatie vereist',
        'GPS is nodig om je workout te tracken. Geef toestemming in je instellingen.',
        [{ text: 'OK' }]
      )
      return false
    }
    return true
  }

  const startWorkout = async () => {
    const hasPermission = await requestLocationPermission()
    if (!hasPermission) return
    
    // Keep screen awake
    await activateKeepAwakeAsync()
    
    // Start location tracking
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (location) => {
        const point: LocationPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          speed: location.coords.speed,
        }
        
        // Calculate distance from last point
        if (lastLocation.current) {
          const dist = calculateDistance(
            lastLocation.current.latitude,
            lastLocation.current.longitude,
            point.latitude,
            point.longitude
          )
          
          if (dist > 0 && dist < 100) { // Filter out GPS jumps > 100m
            setDistance(prev => prev + dist)
            setBlockDistance(prev => prev + dist)
          }
        }
        
        // Update current speed/pace
        if (location.coords.speed && location.coords.speed > 0.5) {
          setCurrentSpeed(location.coords.speed)
          // Convert m/s to seconds per km
          const paceSecondsPerKm = 1000 / location.coords.speed
          setCurrentPace(paceSecondsPerKm)
        }
        
        lastLocation.current = point
        setLocations(prev => [...prev, point])
      }
    )
    
    // Start timer
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const newElapsed = prev + 1
        setBlockElapsed(be => be + 1)
        return newElapsed
      })
    }, 1000)
    
    setStatus('running')
    Vibration.vibrate(200)
  }

  const pauseWorkout = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    pausedTimeRef.current += Date.now() - startTimeRef.current
    setStatus('paused')
    Vibration.vibrate([100, 100, 100])
  }

  const resumeWorkout = () => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const newElapsed = prev + 1
        setBlockElapsed(be => be + 1)
        return newElapsed
      })
    }, 1000)
    setStatus('running')
    Vibration.vibrate(200)
  }

  const finishWorkout = async () => {
    Alert.alert(
      'Workout afronden',
      'Weet je zeker dat je de workout wilt afronden?',
      [
        { text: 'Annuleren', style: 'cancel' },
        { 
          text: 'Afronden', 
          onPress: async () => {
            // Stop tracking
            if (timerRef.current) clearInterval(timerRef.current)
            if (locationSubscription.current) locationSubscription.current.remove()
            deactivateKeepAwake()
            
            setStatus('finished')
            Vibration.vibrate([200, 100, 200, 100, 400])
            
            // Calculate average pace
            if (distance > 0 && elapsedSeconds > 0) {
              const avgPaceCalc = elapsedSeconds / (distance / 1000)
              setAvgPace(avgPaceCalc)
            }
            
            // Save activity to database
            await saveActivity()
          }
        }
      ]
    )
  }

  const saveActivity = async () => {
    if (!user || !workout) return
    
    try {
      const { error } = await supabase.from('activities').insert({
        user_id: user.id,
        workout_id: workout.id,
        activity_type: 'run',
        source: 'manual',
        started_at: new Date(startTimeRef.current).toISOString(),
        distance_meters: Math.round(distance),
        duration_seconds: elapsedSeconds,
        avg_pace_sec_per_km: distance > 0 ? Math.round(elapsedSeconds / (distance / 1000)) : null,
        gpx_data: locations.length > 0 ? JSON.stringify(locations) : null,
      })
      
      if (error) throw error
      
      // Update workout status
      await supabase.from('workouts').update({
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq('id', workout.id)
      
    } catch (err) {
      console.error('Error saving activity:', err)
    }
  }

  const discardWorkout = () => {
    Alert.alert(
      'Workout annuleren',
      'Weet je zeker dat je deze workout wilt annuleren? Alle data gaat verloren.',
      [
        { text: 'Doorgaan', style: 'cancel' },
        { 
          text: 'Annuleren', 
          style: 'destructive',
          onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (locationSubscription.current) locationSubscription.current.remove()
            deactivateKeepAwake()
            router.back()
          }
        }
      ]
    )
  }

  // Helper functions
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPace = (secondsPerKm: number | null): string => {
    if (!secondsPerKm || secondsPerKm > 1800) return '--:--'
    
    if (settings.distance_unit === 'mi') {
      // Convert to min/mile
      const secondsPerMile = secondsPerKm * 1.60934
      const mins = Math.floor(secondsPerMile / 60)
      const secs = Math.round(secondsPerMile % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    
    const mins = Math.floor(secondsPerKm / 60)
    const secs = Math.round(secondsPerKm % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number): string => {
    if (settings.distance_unit === 'mi') {
      return (meters / 1609.34).toFixed(2)
    }
    return (meters / 1000).toFixed(2)
  }

  const getTargetPaceSeconds = (): number | null => {
    // First check if explicit pace is set
    if (workout?.target_pace_min_per_km) {
      return workout.target_pace_min_per_km * 60
    }
    
    // Calculate from distance and duration
    if (workout?.target_distance_km && workout?.target_duration_minutes) {
      const secondsPerKm = (workout.target_duration_minutes * 60) / workout.target_distance_km
      return secondsPerKm
    }
    
    return null
  }

  const getTargetPace = (): string => {
    const targetSeconds = getTargetPaceSeconds()
    if (!targetSeconds) return '--:--'
    return formatPace(targetSeconds)
  }

  const getTargetDistance = (): string => {
    if (!workout?.target_distance_km) return '--'
    if (settings.distance_unit === 'mi') {
      return (workout.target_distance_km / 1.60934).toFixed(1)
    }
    return workout.target_distance_km.toFixed(1)
  }

  const getRemainingDistance = (): string => {
    if (!workout?.target_distance_km) return '--'
    const targetMeters = workout.target_distance_km * 1000
    const remaining = Math.max(0, targetMeters - distance)
    return formatDistance(remaining)
  }

  const getProgress = (): number => {
    if (!workout?.target_distance_km) return 0
    const targetMeters = workout.target_distance_km * 1000
    return Math.min(1, distance / targetMeters)
  }

  const getPaceIndicator = (): { color: string; text: string } => {
    const targetSeconds = getTargetPaceSeconds()
    if (!currentPace || !targetSeconds) {
      return { color: '#94a3b8', text: '' }
    }
    
    const diff = currentPace - targetSeconds
    
    if (Math.abs(diff) < 15) {
      return { color: '#22c55e', text: 'Op tempo ✓' }
    } else if (diff > 0) {
      const secondsSlower = Math.round(diff)
      return { color: '#f59e0b', text: `+${secondsSlower}s te langzaam` }
    } else {
      const secondsFaster = Math.round(Math.abs(diff))
      return { color: '#3b82f6', text: `-${secondsFaster}s sneller` }
    }
  }

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Laden...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (status === 'ready') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Terug</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.readyContainer}>
          <Text style={styles.workoutType}>{workout?.workout_type?.toUpperCase()}</Text>
          <Text style={styles.workoutTitle}>{workout?.title}</Text>
          
          {workout?.description && (
            <Text style={styles.workoutDescription}>{workout.description}</Text>
          )}
          
          <View style={styles.targetsContainer}>
            {workout?.target_distance_km && (
              <View style={styles.targetItem}>
                <Text style={styles.targetValue}>{getTargetDistance()}</Text>
                <Text style={styles.targetLabel}>{settings.distance_unit}</Text>
              </View>
            )}
            
            {workout?.target_duration_minutes && (
              <View style={styles.targetItem}>
                <Text style={styles.targetValue}>{workout.target_duration_minutes}</Text>
                <Text style={styles.targetLabel}>min</Text>
              </View>
            )}
            
            {getTargetPaceSeconds() && (
              <View style={styles.targetItem}>
                <Text style={styles.targetValue}>{getTargetPace()}</Text>
                <Text style={styles.targetLabel}>/{settings.distance_unit}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
            <Text style={styles.startButtonText}>▶ START</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (status === 'finished') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedEmoji}>🎉</Text>
          <Text style={styles.finishedTitle}>Workout voltooid!</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{formatDistance(distance)}</Text>
                <Text style={styles.summaryLabel}>{settings.distance_unit}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{formatTime(elapsedSeconds)}</Text>
                <Text style={styles.summaryLabel}>tijd</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{formatPace(avgPace)}</Text>
                <Text style={styles.summaryLabel}>gem. tempo/{settings.distance_unit}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Terug naar overzicht</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Running or Paused state
  const paceIndicator = getPaceIndicator()
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Main stats display */}
      <View style={styles.mainStats}>
        {/* Time */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeValue}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.timeLabel}>TIJD</Text>
        </View>
        
        {/* Progress bar */}
        {workout?.target_distance_km && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {getRemainingDistance()} {settings.distance_unit} te gaan
            </Text>
          </View>
        )}
        
        {/* Distance and Pace */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
            <Text style={styles.statLabel}>{settings.distance_unit.toUpperCase()}</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: paceIndicator.color }]}>
              {formatPace(currentPace)}
            </Text>
            <Text style={styles.statLabel}>/{settings.distance_unit.toUpperCase()}</Text>
            {paceIndicator.text && (
              <Text style={[styles.paceIndicator, { color: paceIndicator.color }]}>
                {paceIndicator.text}
              </Text>
            )}
          </View>
        </View>
        
        {/* Target pace comparison - always show if we have target data */}
        {getTargetPaceSeconds() && (
          <View style={styles.targetPaceContainer}>
            <View style={styles.targetPaceRow}>
              <Text style={styles.targetPaceLabel}>Streeftempo</Text>
              <Text style={styles.targetPaceValue}>{getTargetPace()} /{settings.distance_unit}</Text>
            </View>
            {paceIndicator.text && (
              <View style={[styles.paceStatusBadge, { backgroundColor: paceIndicator.color + '20' }]}>
                <Text style={[styles.paceStatusText, { color: paceIndicator.color }]}>
                  {paceIndicator.text}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      {/* Control buttons */}
      <View style={styles.controls}>
        {status === 'running' ? (
          <>
            <TouchableOpacity style={styles.secondaryButton} onPress={discardWorkout}>
              <Text style={styles.secondaryButtonText}>✕</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.pauseButton} onPress={pauseWorkout}>
              <Text style={styles.pauseButtonText}>❚❚</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
              <Text style={styles.finishButtonText}>✓</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.secondaryButton} onPress={discardWorkout}>
              <Text style={styles.secondaryButtonText}>✕</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resumeButton} onPress={resumeWorkout}>
              <Text style={styles.resumeButtonText}>▶</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
              <Text style={styles.finishButtonText}>✓</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 18,
  },
  header: {
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
  },
  
  // Ready state
  readyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  workoutType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
    letterSpacing: 2,
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  workoutDescription: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  targetsContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 48,
  },
  targetItem: {
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  targetLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 64,
    paddingVertical: 20,
    borderRadius: 50,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Running state
  mainStats: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timeValue: {
    fontSize: 72,
    fontWeight: '200',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 14,
    color: '#64748b',
    letterSpacing: 2,
    marginTop: 8,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 120,
  },
  statValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    letterSpacing: 1,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#334155',
  },
  paceIndicator: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  targetPaceContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  targetPaceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetPaceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  targetPaceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  paceStatusBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  paceStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Controls
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 20,
    color: '#94a3b8',
  },
  pauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  resumeButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  finishButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  
  // Finished state
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  finishedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 32,
  },
  summaryContainer: {
    width: '100%',
    gap: 24,
    marginBottom: 48,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
})

