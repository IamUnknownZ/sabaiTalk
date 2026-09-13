import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function parseEnv(text) {
  const result = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 0) continue;
    const key = line.slice(0, index);
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectNoError(label, promise) {
  const result = await promise;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result;
}

const envText = execFileSync('npx', ['-y', 'supabase', 'status', '-o', 'env'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
});
const env = parseEnv(envText);
const url = env.API_URL;
const anonKey = env.ANON_KEY || env.PUBLISHABLE_KEY;
const serviceRoleKey = env.SERVICE_ROLE_KEY || env.SECRET_KEY;

assert(url, 'Local Supabase API_URL not found. Run: npx supabase start');
assert(
  url.startsWith('http://127.0.0.1:') || url.startsWith('http://localhost:'),
  'Refusing to run against a non-local Supabase project.',
);
assert(anonKey, 'Local Supabase public/anon key not found.');
assert(serviceRoleKey, 'Local Supabase service-role key not found.');

const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

const clientA = createClient(url, anonKey, options);
const clientB = createClient(url, anonKey, options);
const admin = createClient(url, serviceRoleKey, options);

const suffix = randomUUID().slice(0, 8);
const password = 'SabaiTalk-QA-Local-123!';
const emailA = `qa-a-${suffix}@example.test`;
const emailB = `qa-b-${suffix}@example.test`;

let userA;
let userB;
let matchId;

const checks = [];

function pass(name) {
  checks.push({ check: name, result: 'PASS' });
}

try {
  const signupA = await expectNoError('Sign up A', clientA.auth.signUp({ email: emailA, password }));
  const signupB = await expectNoError('Sign up B', clientB.auth.signUp({ email: emailB, password }));
  userA = signupA.data.user?.id;
  userB = signupB.data.user?.id;
  assert(userA && signupA.data.session, 'Tester A did not receive a local auth session.');
  assert(userB && signupB.data.session, 'Tester B did not receive a local auth session.');
  pass('auth_signup_sessions');

  await expectNoError(
    'Profile A',
    clientA.from('profiles').insert({
      id: userA,
      display_name: 'QA A',
      bio: 'Temporary local QA account A',
      approximate_area: 'QA local area',
    }),
  );
  await expectNoError(
    'Profile B',
    clientB.from('profiles').insert({
      id: userB,
      display_name: 'QA B',
      bio: 'Temporary local QA account B',
      approximate_area: 'QA local area',
    }),
  );
  pass('profile_rls_insert');

  const catalog = await expectNoError(
    'Interest catalog',
    clientA.from('interests').select('id,slug,label,emoji').in('slug', ['gaming', 'music', 'coffee']),
  );
  assert(catalog.data?.length === 3, 'Expected static interest catalog rows are missing.');

  await expectNoError(
    'Interests A',
    clientA.from('user_interests').insert(
      catalog.data.map((row) => ({ user_id: userA, interest_id: row.id })),
    ),
  );
  await expectNoError(
    'Interests B',
    clientB.from('user_interests').insert(
      catalog.data.slice(0, 2).map((row) => ({ user_id: userB, interest_id: row.id })),
    ),
  );
  pass('interest_catalog_and_links');

  await expectNoError(
    'Location A',
    clientA.rpc('set_my_location', { lat: 13.819552, lng: 100.514812 }),
  );
  await expectNoError(
    'Location B',
    clientB.rpc('set_my_location', { lat: 13.82, lng: 100.516 }),
  );
  pass('location_rpc');

  const foreignLocations = await expectNoError(
    'Foreign exact location RLS',
    clientA.from('profile_locations').select('*').eq('user_id', userB),
  );
  assert(foreignLocations.data?.length === 0, 'Exact location of another user is readable.');
  pass('exact_location_hidden_by_rls');

  const nearby = await expectNoError(
    'Nearby profiles',
    clientA.rpc('nearby_profiles', { radius_meters: 5000, result_limit: 50 }),
  );
  const nearbyB = nearby.data?.find((row) => row.id === userB);
  assert(nearbyB, 'Nearby RPC did not return the nearby tester account.');
  assert(
    !Object.hasOwn(nearbyB, 'location') &&
      !Object.hasOwn(nearbyB, 'latitude') &&
      !Object.hasOwn(nearbyB, 'longitude') &&
      !Object.hasOwn(nearbyB, 'lat') &&
      !Object.hasOwn(nearbyB, 'lng'),
    'Nearby RPC exposed an exact-location field.',
  );
  pass('nearby_postgis_privacy_shape');

  const oneWayLike = await expectNoError(
    'Like A to B',
    clientA.rpc('like_profile', { target_user: userB }),
  );
  assert(oneWayLike.data === null, 'One-way like unexpectedly created a match.');

  const mutualLike = await expectNoError(
    'Like B to A',
    clientB.rpc('like_profile', { target_user: userA }),
  );
  matchId = mutualLike.data;
  assert(typeof matchId === 'string' && matchId.length > 0, 'Mutual like did not create a match.');
  pass('mutual_match_rpc');

  const matchesA = await expectNoError('My matches A', clientA.rpc('my_matches'));
  assert(
    matchesA.data?.some((row) => row.match_id === matchId && row.other_user_id === userB),
    'my_matches did not return the mutual match.',
  );
  pass('my_matches_rpc');

  const forbiddenOrigins = await clientA.rpc('meeting_origins', { target_match: matchId });
  assert(forbiddenOrigins.error, 'Authenticated client unexpectedly executed meeting_origins.');
  pass('meeting_origins_client_denied');

  const serverOrigins = await expectNoError(
    'Service-role meeting origins',
    admin.rpc('meeting_origins', { target_match: matchId }),
  );
  assert(serverOrigins.data?.length === 1, 'Service-role meeting origins did not return the active match.');
  pass('meeting_origins_server_only');

  const sent = await expectNoError(
    'Send message A',
    clientA
      .from('messages')
      .insert({ match_id: matchId, sender_id: userA, content: 'Temporary local QA message' })
      .select('id,match_id,sender_id,content,created_at')
      .single(),
  );
  assert(sent.data?.id, 'Message insert did not return an id.');

  const inboxB = await expectNoError(
    'Read messages B',
    clientB.from('messages').select('id,sender_id,content').eq('match_id', matchId),
  );
  assert(
    inboxB.data?.some((row) => row.id === sent.data.id && row.sender_id === userA),
    'Matched recipient could not read the message.',
  );
  pass('chat_rls_read_write');

  await expectNoError('Block B from A', clientA.rpc('block_profile', { target_user: userB }));

  const matchesAfterBlock = await expectNoError('Matches after block', clientA.rpc('my_matches'));
  assert(
    !matchesAfterBlock.data?.some((row) => row.match_id === matchId),
    'Blocked relationship remained an active match.',
  );

  const nearbyAfterBlock = await expectNoError(
    'Nearby after block',
    clientA.rpc('nearby_profiles', { radius_meters: 5000, result_limit: 50 }),
  );
  assert(
    !nearbyAfterBlock.data?.some((row) => row.id === userB),
    'Blocked user remained discoverable.',
  );
  pass('block_removes_match_and_discovery');

  const bucket = await expectNoError('Avatar bucket', admin.storage.getBucket('avatars'));
  assert(bucket.data?.public === true, 'avatars bucket is missing or not public.');
  pass('avatar_bucket_exists');

  console.log(JSON.stringify({ checked: checks.length, failures: 0, checks }, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        checked: checks.length,
        failures: 1,
        checks,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  for (const userId of [userA, userB]) {
    if (!userId) continue;
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // Local QA cleanup is best effort; a future db reset also clears temporary test data.
    }
  }
}
