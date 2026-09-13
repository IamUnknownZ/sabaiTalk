import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const typeMap: Record<string, string[]> = {
  cafe: ['cafe'],
  food: ['restaurant'],
  park: ['park'],
  mall: ['shopping_mall'],
  cinema: ['movie_theater'],
  study: ['library', 'cafe'],
};

function durationSeconds(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  return Number(value.replace('s', '')) || Number.POSITIVE_INFINITY;
}

function fairness(a: number, b: number) {
  const max = Math.max(a, b, 1);
  const imbalance = Math.abs(a - b) / max;
  const totalPenalty = Math.min((a + b) / 10800, 1);
  return Math.max(0, Math.min(100, Math.round(100 * (1 - imbalance * 0.75 - totalPenalty * 0.25))));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const placesKey = Deno.env.get('GOOGLE_PLACES_API_KEY') ?? '';
    const routesKey = Deno.env.get('GOOGLE_ROUTES_API_KEY') ?? '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return Response.json({ error: 'supabase_server_config_missing' }, { status: 503, headers: cors });
    }
    if (!placesKey || !routesKey) {
      return Response.json({ error: 'google_meeting_api_not_configured' }, { status: 503, headers: cors });
    }

    const authorization = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData.user;
    if (userError || !user) {
      return Response.json({ error: 'unauthorized' }, { status: 401, headers: cors });
    }

    const { matchId, category = 'cafe' } = await req.json();
    if (!matchId || !typeMap[category]) {
      return Response.json({ error: 'invalid_request' }, { status: 400, headers: cors });
    }

    const { data: match, error: matchError } = await admin
      .from('matches')
      .select('id,user_a,user_b,status')
      .eq('id', matchId)
      .single();

    if (matchError || !match || match.status !== 'active' || (match.user_a !== user.id && match.user_b !== user.id)) {
      return Response.json({ error: 'match_not_available' }, { status: 403, headers: cors });
    }

    const { data: origins, error: originsError } = await admin.rpc('meeting_origins', { target_match: matchId });
    const origin = origins?.[0];
    if (originsError || !origin) {
      return Response.json({ error: 'locations_not_available' }, { status: 409, headers: cors });
    }

    const center = {
      latitude: (origin.a_lat + origin.b_lat) / 2,
      longitude: (origin.a_lng + origin.b_lng) / 2,
    };

    const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
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
      return Response.json({ error: 'places_failed', status: placesResponse.status }, { status: 502, headers: cors });
    }

    const placesPayload = await placesResponse.json();
    const places = (placesPayload.places ?? []).filter((place: any) => place.location?.latitude && place.location?.longitude);
    if (!places.length) return Response.json({ places: [] }, { headers: cors });

    const routesResponse = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': routesKey,
        'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition',
      },
      body: JSON.stringify({
        origins: [
          { waypoint: { location: { latLng: { latitude: origin.a_lat, longitude: origin.a_lng } } } },
          { waypoint: { location: { latLng: { latitude: origin.b_lat, longitude: origin.b_lng } } } },
        ],
        destinations: places.map((place: any) => ({
          waypoint: { location: { latLng: place.location } },
        })),
        travelMode: 'DRIVE',
      }),
    });

    if (!routesResponse.ok) {
      return Response.json({ error: 'routes_failed', status: routesResponse.status }, { status: 502, headers: cors });
    }

    const matrix = await routesResponse.json();
    const scored = places.map((place: any, destinationIndex: number) => {
      const aRoute = matrix.find((row: any) => row.originIndex === 0 && row.destinationIndex === destinationIndex);
      const bRoute = matrix.find((row: any) => row.originIndex === 1 && row.destinationIndex === destinationIndex);
      const aSeconds = durationSeconds(aRoute?.duration);
      const bSeconds = durationSeconds(bRoute?.duration);
      const valid = Number.isFinite(aSeconds) && Number.isFinite(bSeconds);

      return {
        id: place.id,
        name: place.displayName?.text ?? 'Meeting place',
        address: place.formattedAddress ?? '',
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        rating: place.rating ?? null,
        openNow: place.currentOpeningHours?.openNow ?? null,
        category: place.primaryType ?? category,
        yourMinutes: valid ? Math.round(aSeconds / 60) : null,
        friendMinutes: valid ? Math.round(bSeconds / 60) : null,
        fairness: valid ? fairness(aSeconds, bSeconds) : 0,
        totalMinutes: valid ? Math.round((aSeconds + bSeconds) / 60) : null,
      };
    })
    .filter((place: any) => place.yourMinutes !== null && place.friendMinutes !== null)
    .sort((a: any, b: any) => (b.fairness - a.fairness) || (a.totalMinutes - b.totalMinutes));

    return Response.json({ places: scored }, { headers: cors });
  } catch (error) {
    return Response.json(
      { error: 'meeting_recommendation_failed', message: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: cors },
    );
  }
});
