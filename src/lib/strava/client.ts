/**
 * Strava API Client
 * 
 * Handles OAuth authentication and API calls to Strava.
 * 
 * Required environment variables:
 * - STRAVA_CLIENT_ID
 * - STRAVA_CLIENT_SECRET
 */

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_OAUTH_BASE = "https://www.strava.com/oauth";

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  athlete: StravaAthlete;
}

export interface StravaAthlete {
  id: number;
  username: string | null;
  firstname: string;
  lastname: string;
  profile_medium: string;
  profile: string;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: "M" | "F" | null;
  premium: boolean;
  summit: boolean;
  created_at: string;
  updated_at: string;
}

export interface StravaActivity {
  id: number;
  external_id: string | null;
  upload_id: number | null;
  name: string;
  description: string | null;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string;
  sport_type: string;
  start_date: string; // ISO 8601
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: {
    id: string;
    summary_polyline: string | null;
    polyline: string | null;
  } | null;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  gear_id: string | null;
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_cadence?: number;
  average_temp?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  has_heartrate: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  heartrate_opt_out: boolean;
  display_hide_heartrate_option: boolean;
  elev_high?: number;
  elev_low?: number;
  pr_count: number;
  suffer_score?: number;
  calories?: number;
}

export interface StravaActivityStream {
  type: string;
  data: number[];
  series_type: string;
  original_size: number;
  resolution: string;
}

export interface StravaLap {
  id: number;
  activity: { id: number };
  athlete: { id: number };
  resource_state: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  lap_index: number;
  split: number;
  pace_zone?: number;
}

/**
 * Get the Strava OAuth authorization URL
 */
export function getStravaAuthUrl(redirectUri: string, state?: string): string {
  const clientId = process.env.STRAVA_CLIENT_ID;
  
  if (!clientId) {
    throw new Error("STRAVA_CLIENT_ID environment variable is not set");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
  });

  if (state) {
    params.set("state", state);
  }

  return `${STRAVA_OAUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeStravaCode(code: string): Promise<StravaTokens> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Strava client credentials are not configured");
  }

  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Strava token exchange failed:", error);
    throw new Error(`Failed to exchange Strava code: ${response.status}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshStravaToken(refreshToken: string): Promise<Omit<StravaTokens, "athlete">> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Strava client credentials are not configured");
  }

  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Strava token refresh failed:", error);
    throw new Error(`Failed to refresh Strava token: ${response.status}`);
  }

  return response.json();
}

/**
 * Deauthorize the app (disconnect from Strava)
 */
export async function deauthorizeStrava(accessToken: string): Promise<void> {
  const response = await fetch(`${STRAVA_OAUTH_BASE}/deauthorize`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error("Strava deauthorization failed:", response.status);
    throw new Error(`Failed to deauthorize Strava: ${response.status}`);
  }
}

/**
 * Strava API client with automatic token refresh
 */
export class StravaClient {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: number;
  private onTokenRefresh?: (tokens: { access_token: string; refresh_token: string; expires_at: number }) => Promise<void>;

  constructor(
    accessToken: string,
    refreshToken: string,
    expiresAt: number,
    onTokenRefresh?: (tokens: { access_token: string; refresh_token: string; expires_at: number }) => Promise<void>
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    this.onTokenRefresh = onTokenRefresh;
  }

  /**
   * Ensure we have a valid access token, refreshing if necessary
   */
  private async ensureValidToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    
    // Refresh if token expires in less than 5 minutes
    if (this.expiresAt < now + 300) {
      const newTokens = await refreshStravaToken(this.refreshToken);
      this.accessToken = newTokens.access_token;
      this.refreshToken = newTokens.refresh_token;
      this.expiresAt = newTokens.expires_at;
      
      if (this.onTokenRefresh) {
        await this.onTokenRefresh({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_at: newTokens.expires_at,
        });
      }
    }
    
    return this.accessToken;
  }

  /**
   * Make an authenticated request to the Strava API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.ensureValidToken();
    
    const response = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Strava API error (${endpoint}):`, error);
      throw new Error(`Strava API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get the authenticated athlete
   */
  async getAthlete(): Promise<StravaAthlete> {
    return this.request<StravaAthlete>("/athlete");
  }

  /**
   * Get activities for the authenticated athlete
   */
  async getActivities(options: {
    before?: number; // Unix timestamp
    after?: number; // Unix timestamp
    page?: number;
    per_page?: number;
  } = {}): Promise<StravaActivity[]> {
    const params = new URLSearchParams();
    
    if (options.before) params.set("before", options.before.toString());
    if (options.after) params.set("after", options.after.toString());
    if (options.page) params.set("page", options.page.toString());
    if (options.per_page) params.set("per_page", options.per_page.toString());
    
    const query = params.toString();
    return this.request<StravaActivity[]>(`/athlete/activities${query ? `?${query}` : ""}`);
  }

  /**
   * Get a specific activity by ID
   */
  async getActivity(activityId: number, includeAllEfforts = true): Promise<StravaActivity> {
    const params = new URLSearchParams({
      include_all_efforts: includeAllEfforts.toString(),
    });
    
    return this.request<StravaActivity>(`/activities/${activityId}?${params.toString()}`);
  }

  /**
   * Get activity streams (detailed data like GPS, heart rate, etc.)
   */
  async getActivityStreams(
    activityId: number,
    keys: string[] = ["time", "distance", "latlng", "altitude", "heartrate", "cadence"]
  ): Promise<Record<string, StravaActivityStream>> {
    const params = new URLSearchParams({
      keys: keys.join(","),
      key_by_type: "true",
    });
    
    return this.request<Record<string, StravaActivityStream>>(`/activities/${activityId}/streams?${params.toString()}`);
  }

  /**
   * Get activity laps
   */
  async getActivityLaps(activityId: number): Promise<StravaLap[]> {
    return this.request<StravaLap[]>(`/activities/${activityId}/laps`);
  }
}

/**
 * Map Strava activity type to our activity type
 */
export function mapStravaActivityType(stravaType: string): string {
  const typeMap: Record<string, string> = {
    "Run": "run",
    "TrailRun": "run",
    "VirtualRun": "run",
    "Walk": "walk",
    "Hike": "walk",
    "Ride": "cycling",
    "MountainBikeRide": "cycling",
    "GravelRide": "cycling",
    "EBikeRide": "cycling",
    "VirtualRide": "cycling",
    "Swim": "swimming",
    "Workout": "cross_training",
    "WeightTraining": "cross_training",
    "Crossfit": "cross_training",
    "Yoga": "cross_training",
  };
  
  return typeMap[stravaType] || "other";
}

/**
 * Convert Strava streams to GPX-like data for storage
 */
export function stravaStreamsToGpxData(
  streams: Record<string, StravaActivityStream>,
  startTime: string
): object | null {
  // latlng stream contains [lat, lon] pairs, not single numbers
  const latlng = streams.latlng?.data as unknown as [number, number][] | undefined;
  const altitude = streams.altitude?.data;
  const time = streams.time?.data;
  const heartrate = streams.heartrate?.data;
  const cadence = streams.cadence?.data;
  
  if (!latlng || latlng.length === 0) {
    return null;
  }
  
  const startDate = new Date(startTime);
  
  const track = latlng.map((coords, i) => {
    const point: Record<string, unknown> = {
      lat: coords[0],
      lon: coords[1],
    };
    
    if (altitude && altitude[i] !== undefined) {
      point.ele = altitude[i];
    }
    
    if (time && time[i] !== undefined) {
      point.time = new Date(startDate.getTime() + time[i] * 1000).toISOString();
    }
    
    if (heartrate && heartrate[i] !== undefined) {
      point.hr = heartrate[i];
    }
    
    if (cadence && cadence[i] !== undefined) {
      point.cad = cadence[i];
    }
    
    return point;
  });
  
  return { track };
}

/**
 * Convert Strava laps to splits data for storage
 */
export function stravaLapsToSplitsData(laps: StravaLap[]): object | null {
  if (!laps || laps.length === 0) {
    return null;
  }
  
  const splits = laps.map((lap, index) => ({
    lapNumber: index + 1,
    startTime: lap.start_date,
    durationSeconds: lap.elapsed_time,
    movingTimeSeconds: lap.moving_time,
    distanceMeters: lap.distance,
    paceSecPerKm: lap.distance > 0 
      ? Math.round((lap.moving_time / lap.distance) * 1000)
      : null,
    avgHeartRate: lap.average_heartrate,
    maxHeartRate: lap.max_heartrate,
    cadence: lap.average_cadence,
    elevationGain: lap.total_elevation_gain,
  }));
  
  return { splits };
}

