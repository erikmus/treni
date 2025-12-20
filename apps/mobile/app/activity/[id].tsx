import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps'
import { useAuth } from '../../src/lib/auth-context'
import { supabase } from '../../src/lib/supabase'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'

const { width } = Dimensions.get('window')

type Activity = {
  id: string
  activity_type: string
  title: string | null
  description: string | null
  started_at: string
  finished_at: string | null
  duration_seconds: number
  moving_time_seconds: number | null
  distance_meters: number | null
  avg_pace_sec_per_km: number | null
  best_pace_sec_per_km: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  elevation_gain_meters: number | null
  elevation_loss_meters: number | null
  calories: number | null
  avg_cadence: number | null
  source: string | null
  feeling: string | null
  perceived_effort: number | null
  gpx_data: any
  splits_data: any
  workout_id: string | null
}

type Coordinate = {
  latitude: number
  longitude: number
}

type Split = {
  distance_km: number
  duration_seconds: number
  pace_sec_per_km: number
  elevation_change?: number
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([])
  const [splits, setSplits] = useState<Split[]>([])
  const [mapRegion, setMapRegion] = useState<any>(null)

  useEffect(() => {
    fetchActivity()
  }, [id, user])

  const fetchActivity = async () => {
    if (!id || !user) return
    
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (data) {
      setActivity(data)
      
      // Parse GPS data for map
      if (data.gpx_data) {
        try {
          const gpsData = typeof data.gpx_data === 'string' 
            ? JSON.parse(data.gpx_data) 
            : data.gpx_data
          
          if (Array.isArray(gpsData) && gpsData.length > 0) {
            const coords = gpsData.map((point: any) => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))
            setRouteCoordinates(coords)
            
            // Calculate map region to fit route
            const lats = coords.map((c: Coordinate) => c.latitude)
            const lngs = coords.map((c: Coordinate) => c.longitude)
            const minLat = Math.min(...lats)
            const maxLat = Math.max(...lats)
            const minLng = Math.min(...lngs)
            const maxLng = Math.max(...lngs)
            
            setMapRegion({
              latitude: (minLat + maxLat) / 2,
              longitude: (minLng + maxLng) / 2,
              latitudeDelta: (maxLat - minLat) * 1.3 || 0.01,
              longitudeDelta: (maxLng - minLng) * 1.3 || 0.01,
            })
            
            // Calculate splits from GPS data
            calculateSplits(gpsData, data.duration_seconds)
          }
        } catch (e) {
          console.log('Error parsing GPS data:', e)
        }
      }
      
      // Use existing splits if available
      if (data.splits_data) {
        try {
          const splitsData = typeof data.splits_data === 'string'
            ? JSON.parse(data.splits_data)
            : data.splits_data
          if (Array.isArray(splitsData)) {
            setSplits(splitsData)
          }
        } catch (e) {
          console.log('Error parsing splits:', e)
        }
      }
    }
    
    setLoading(false)
  }

  const calculateSplits = (gpsData: any[], totalDuration: number) => {
    if (gpsData.length < 2) return
    
    const calculatedSplits: Split[] = []
    let currentKm = 1
    let kmStartIndex = 0
    let kmStartTime = gpsData[0].timestamp
    let totalDistance = 0
    
    for (let i = 1; i < gpsData.length; i++) {
      const dist = calculateDistance(
        gpsData[i-1].latitude, gpsData[i-1].longitude,
        gpsData[i].latitude, gpsData[i].longitude
      )
      totalDistance += dist
      
      if (totalDistance >= currentKm * 1000) {
        const splitDuration = (gpsData[i].timestamp - kmStartTime) / 1000
        const paceSecPerKm = splitDuration
        
        calculatedSplits.push({
          distance_km: currentKm,
          duration_seconds: Math.round(splitDuration),
          pace_sec_per_km: Math.round(paceSecPerKm),
        })
        
        currentKm++
        kmStartIndex = i
        kmStartTime = gpsData[i].timestamp
      }
    }
    
    // Add final partial split
    if (totalDistance > (currentKm - 1) * 1000) {
      const remainingDist = totalDistance - (currentKm - 1) * 1000
      const splitDuration = (gpsData[gpsData.length - 1].timestamp - kmStartTime) / 1000
      const paceSecPerKm = splitDuration / (remainingDist / 1000)
      
      calculatedSplits.push({
        distance_km: parseFloat((totalDistance / 1000).toFixed(2)),
        duration_seconds: Math.round(splitDuration),
        pace_sec_per_km: Math.round(paceSecPerKm),
      })
    }
    
    if (calculatedSplits.length > 0) {
      setSplits(calculatedSplits)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
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
    if (!paceSecPerKm || paceSecPerKm > 1800) return '--:--'
    const mins = Math.floor(paceSecPerKm / 60)
    const secs = Math.round(paceSecPerKm % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number | null) => {
    if (!meters) return '0.00'
    return (meters / 1000).toFixed(2)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'run': return '🏃‍♂️'
      case 'walk': return '🚶‍♂️'
      case 'cycling': return '🚴‍♂️'
      default: return '🏃'
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

  const getFeelingLabel = (feeling: string | null) => {
    switch (feeling) {
      case 'great': return 'Super!'
      case 'good': return 'Goed'
      case 'okay': return 'Oké'
      case 'tired': return 'Vermoeid'
      case 'exhausted': return 'Uitgeput'
      default: return null
    }
  }

  const getAvgPaceForSplits = () => {
    if (splits.length === 0) return null
    const avg = splits.reduce((sum, s) => sum + s.pace_sec_per_km, 0) / splits.length
    return avg
  }

  const getFastestSplit = () => {
    if (splits.length === 0) return null
    return Math.min(...splits.map(s => s.pace_sec_per_km))
  }

  const getSlowestSplit = () => {
    if (splits.length === 0) return null
    return Math.max(...splits.map(s => s.pace_sec_per_km))
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Laden...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Activiteit niet gevonden</Text>
        </View>
      </SafeAreaView>
    )
  }

  const avgPace = getAvgPaceForSplits()
  const fastestPace = getFastestSplit()
  const slowestPace = getSlowestSplit()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Terug</Text>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.activityIcon}>{getActivityIcon(activity.activity_type)}</Text>
          <Text style={styles.title}>{activity.title || 'Hardlopen'}</Text>
          <Text style={styles.date}>
            {format(parseISO(activity.started_at), "EEEE d MMMM yyyy 'om' HH:mm", { locale: nl })}
          </Text>
          {activity.feeling && (
            <View style={styles.feelingBadge}>
              <Text style={styles.feelingEmoji}>{getFeelingEmoji(activity.feeling)}</Text>
              <Text style={styles.feelingText}>{getFeelingLabel(activity.feeling)}</Text>
            </View>
          )}
        </View>

        {/* Main Stats */}
        <View style={styles.mainStats}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{formatDistance(activity.distance_meters)}</Text>
            <Text style={styles.mainStatLabel}>km</Text>
          </View>
          <View style={styles.mainStatDivider} />
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{formatDuration(activity.moving_time_seconds || activity.duration_seconds)}</Text>
            <Text style={styles.mainStatLabel}>tijd</Text>
          </View>
          <View style={styles.mainStatDivider} />
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{formatPace(activity.avg_pace_sec_per_km)}</Text>
            <Text style={styles.mainStatLabel}>/km</Text>
          </View>
        </View>

        {/* Map */}
        {routeCoordinates.length > 0 && mapRegion && (
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>Route</Text>
            <MapView
              style={styles.map}
              provider={PROVIDER_DEFAULT}
              initialRegion={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#3b82f6"
                strokeWidth={4}
              />
            </MapView>
          </View>
        )}

        {/* Splits */}
        {splits.length > 0 && (
          <View style={styles.splitsContainer}>
            <Text style={styles.sectionTitle}>Splits</Text>
            
            {/* Splits Summary */}
            <View style={styles.splitsSummary}>
              <View style={styles.splitsSummaryItem}>
                <Text style={styles.splitsSummaryValue}>{formatPace(fastestPace)}</Text>
                <Text style={styles.splitsSummaryLabel}>Snelste</Text>
              </View>
              <View style={styles.splitsSummaryItem}>
                <Text style={styles.splitsSummaryValue}>{formatPace(avgPace)}</Text>
                <Text style={styles.splitsSummaryLabel}>Gemiddeld</Text>
              </View>
              <View style={styles.splitsSummaryItem}>
                <Text style={styles.splitsSummaryValue}>{formatPace(slowestPace)}</Text>
                <Text style={styles.splitsSummaryLabel}>Langzaamste</Text>
              </View>
            </View>

            {/* Splits List */}
            <View style={styles.splitsList}>
              {splits.map((split, index) => {
                const isFastest = split.pace_sec_per_km === fastestPace
                const isSlowest = split.pace_sec_per_km === slowestPace
                const paceBarWidth = avgPace 
                  ? Math.min(100, Math.max(20, (avgPace / split.pace_sec_per_km) * 70))
                  : 50
                
                return (
                  <View key={index} style={styles.splitRow}>
                    <View style={styles.splitKm}>
                      <Text style={styles.splitKmText}>
                        {index < splits.length - 1 ? index + 1 : split.distance_km.toFixed(2)}
                      </Text>
                      <Text style={styles.splitKmLabel}>km</Text>
                    </View>
                    
                    <View style={styles.splitBarContainer}>
                      <View 
                        style={[
                          styles.splitBar, 
                          { width: `${paceBarWidth}%` },
                          isFastest && styles.splitBarFastest,
                          isSlowest && styles.splitBarSlowest,
                        ]} 
                      />
                    </View>
                    
                    <Text style={[
                      styles.splitPace,
                      isFastest && styles.splitPaceFastest,
                      isSlowest && styles.splitPaceSlowest,
                    ]}>
                      {formatPace(split.pace_sec_per_km)}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Additional Stats */}
        <View style={styles.additionalStats}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.statsGrid}>
            {activity.best_pace_sec_per_km && (
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{formatPace(activity.best_pace_sec_per_km)}/km</Text>
                <Text style={styles.statCardLabel}>Beste tempo</Text>
              </View>
            )}
            {activity.avg_heart_rate && (
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{activity.avg_heart_rate} bpm</Text>
                <Text style={styles.statCardLabel}>Gem. hartslag</Text>
              </View>
            )}
            {activity.max_heart_rate && (
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{activity.max_heart_rate} bpm</Text>
                <Text style={styles.statCardLabel}>Max. hartslag</Text>
              </View>
            )}
            {activity.elevation_gain_meters && (
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{Math.round(activity.elevation_gain_meters)} m</Text>
                <Text style={styles.statCardLabel}>Stijging</Text>
              </View>
            )}
            {activity.calories && (
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{activity.calories}</Text>
                <Text style={styles.statCardLabel}>Calorieën</Text>
              </View>
            )}
            {activity.avg_cadence && (
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{activity.avg_cadence}</Text>
                <Text style={styles.statCardLabel}>Cadans</Text>
              </View>
            )}
            {activity.perceived_effort && (
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{activity.perceived_effort}/10</Text>
                <Text style={styles.statCardLabel}>Inspanning</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {activity.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Notities</Text>
            <Text style={styles.description}>{activity.description}</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    color: '#3b82f6',
    fontSize: 16,
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  activityIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  feelingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  feelingEmoji: {
    fontSize: 18,
  },
  feelingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  mainStats: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  mainStat: {
    flex: 1,
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  mainStatDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  map: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  splitsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  splitsSummary: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  splitsSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  splitsSummaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  splitsSummaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  splitsList: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  splitKm: {
    flexDirection: 'row',
    alignItems: 'baseline',
    width: 50,
  },
  splitKmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  splitKmLabel: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 2,
  },
  splitBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  splitBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  splitBarFastest: {
    backgroundColor: '#22c55e',
  },
  splitBarSlowest: {
    backgroundColor: '#f59e0b',
  },
  splitPace: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    width: 60,
    textAlign: 'right',
  },
  splitPaceFastest: {
    color: '#22c55e',
  },
  splitPaceSlowest: {
    color: '#f59e0b',
  },
  additionalStats: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 3,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statCardLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  descriptionSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 22,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  bottomPadding: {
    height: 32,
  },
})

