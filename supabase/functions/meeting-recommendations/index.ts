import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedHeaders = 'authorization, x-client-info, apikey, content-type';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const typeMap: Record<string, string[]> = {
  cafe: ['cafe'],
  food: ['restaurant'],
  park: ['park'],
  mall: ['shopping_mall'],
  cinema: ['movie_theater'],
  study: ['library', 'cafe'],
};

function isAllowedBrowserOrigin(origin: string) {
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.includes(origin);
}

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
  if (origin && isAllowedBrowserOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(req: Request, body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders(req) });
}

function durationSeconds(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Number(value.replace('s', ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.POSITIVE_INFINITY;
}

function fairness(a: number, b: number) {
  const max = Math.max(a, b, 1);
  const imbalance = Math.abs(a - b) / max;
  const totalPenalty = Math.min((a + b) / 10800, 1);
  return Math.max(0, Math.min(100, Math.round(100 * (1 - imbalance * 0.75 - totalPenalty * 0.25))));
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    if (origin && !isAllowedBrowserOrigin(origin)) {
      return json(req, { error: 'origin_not_allowed' }, 403);
    }
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return json(req, { error: 'method_not_allowed' }, 405);
  }

  if (origin && !isAllowedBrowserOrigin(origin)) {
    return json(req, { error: 'origin_not_allowed' }, 403);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const placesKey = Deno.env.get('GOOGLE_PLACES_API_KEY') ?? '';
    const routesKey = Deno.env.get('GOOGLE_ROUTES_API_KEY') ?? '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json(req, { error: 'supabase_server_config_missing' }, 503);
    }
    if (!placesKey || !routesKey) {
      return json(req, { error: 'google_meeting_api_not_configured' }, 503);
    }

    const authorization = req.headers.get('Authorization') ?? '';
    if (!/^Bearer\s+\S+$/i.test(authorization)) {
      return json(req, { error: 'unauthorized' }, 401);
    }

    const contentType = req.headers.get('Content-Type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return json(req, { error: 'invalid_content_type' }, 415);
    }

    const contentLength = Number(req.headers.get('Content-Length') ?? 0);
    if (Number.isFinite(contentLength) && contentLength > 4096) {
      return json(req, { error: 'request_too_large' }, 413);
    }

    const bodyText = await req.text();
    if (bodyText.length > 4096) {
      return json(req, { error: 'request_too_large' }, 413);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return json(req, { error: 'invalid_json' }, 400);
    }

    const matchId = typeof payload.matchId === 'string' ? payload.matchId : '';
    const category = typeof payload.category === 'string' ? payload.category : 'cafe';
    if (!uuidPattern.test(matchId) || !typeMap[category]) {
      return json(req, { error: 'invalid_request' }, 400);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData.user;
    if (userError || !user) {
      return json(req, { error: 'unauthorized' }, 401);
    }

    const { data: rateAllowed, error: rateError } = await admin.rpc('consume_meeting_rate_limit', {
      target_user: user.id,
    });
    if (rateError) {
      console.error('meeting rate limiter failed', rateError.message);
      return json(req, { error: 'rate_limit_unavailable' }, 503);
    }
    if (!rateAllowed) {
      return json(req, { error: 'too_many_requests' }, 429);
    }

    const { data: match, error: matchError } = await admin
      .from('matches')
      .select('id,user_a,user_b,status')
      .eq('id', matchId)
      .single();

    if (matchError || !match || match.status !== 'active' || (match.user_a !== user.id && match.user_b !== user.id)) {
      return json(req, { error: 'match_not_available' }, 403);
    }

    const { data: origins, error: originsError } = await admin.rpc('meeting_origins', { target_match: matchId });
    const originRow = origins?.[0];
    if (originsError || !originRow) {
      return json(req, { error: 'locations_not_available' }, 409);
    }

    const center = {
      latitude: (originRow.a_lat + originRow.b_lat) / 2,
      longitude: (originRow.a_lng + originRow.b_lng) / 2,
    };

    const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': placesKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.primaryType,places.currentOpeningHours.openNow',
      },
      body: JSON.stringify({
        includedTypes: typeMap[category],
        maxResultCount: 10,
        locationRestriction: {
          circle: {
            center,
            radius: 3500,
          },
        },
      }),
    });

    if (!placesResponse.ok) {
      console.error('Places API failed', placesResponse.status);
      return json(req, { error: 'places_failed' }, 502);
    }

    const placesPayload = await placesResponse.json();
    const places = (Array.isArray(placesPayload.places) ? placesPayload.places : [])
      .filter((place: any) => (
        place?.id &&
        Number.isFinite(place?.location?.latitude) &&
        Number.isFinite(place?.location?.longitude)
      ))
      .slice(0, 10);

    if (!places.length) return json(req, { places: [] });

    const routesResponse = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': routesKey,
        'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition',
      },
      body: JSON.stringify({
        origins: [
          { waypoint: { location: { latLng: { latitude: originRow.a_lat, longitude: originRow.a_lng } } } },
          { waypoint: { location: { latLng: { latitude: originRow.b_lat, longitude: originRow.b_lng } } } },
        ],
        destinations: places.map((place: any) => ({
          waypoint: { location: { latLng: place.location } },
        })),
        travelMode: 'DRIVE',
      }),
    });

    if (!routesResponse.ok) {
      console.error('Routes API failed', routesResponse.status);
      return json(req, { error: 'routes_failed' }, 502);
    }

    const matrixPayload = await routesResponse.json();
    const matrix = Array.isArray(matrixPayload) ? matrixPayload : [];

    const scored = places.map((place: any, destinationIndex: number) => {
      const aRoute = matrix.find((row: any) => row.originIndex === 0 && row.destinationIndex === destinationIndex);
      const bRoute = matrix.find((row: any) => row.originIndex === 1 && row.destinationIndex === destinationIndex);
      const aSeconds = durationSeconds(aRoute?.duration);
      const bSeconds = durationSeconds(bRoute?.duration);
      const valid = Number.isFinite(aSeconds) && Number.isFinite(bSeconds);

      return {
        id: String(place.id).slice(0, 256),
        name: String(place.displayName?.text ?? 'Meeting place').slice(0, 200),
        address: String(place.formattedAddress ?? '').slice(0, 500),
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        rating: Number.isFinite(place.rating) ? place.rating : null,
        openNow: typeof place.currentOpeningHours?.openNow === 'boolean' ? place.currentOpeningHours.openNow : null,
        category: String(place.primaryType ?? category).slice(0, 80),
        yourMinutes: valid ? Math.round(aSeconds / 60) : null,
        friendMinutes: valid ? Math.round(bSeconds / 60) : null,
        fairness: valid ? fairness(aSeconds, bSeconds) : 0,
        totalMinutes: valid ? Math.round((aSeconds + bSeconds) / 60) : null,
      };
    })
      .filter((place: any) => place.yourMinutes !== null && place.friendMinutes !== null)
      .sort((a: any, b: any) => (b.fairness - a.fairness) || (a.totalMinutes - b.totalMinutes));

    return json(req, { places: scored });
  } catch (error) {
    console.error('meeting-recommendations failed', error instanceof Error ? error.message : 'unknown error');
    return json(req, { error: 'meeting_recommendation_failed' }, 500);
  }
});
