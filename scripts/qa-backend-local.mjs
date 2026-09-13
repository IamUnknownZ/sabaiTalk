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

async function expectError(label, promise) {
  const result = await promise;
  if (!result.error) throw new Error(`${label}: expected an error`);
  return result.error;
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

  const injectionName = "QA A ' OR 1=1 --";
  await expectNoError(
    'Profile A',
    clientA.from('profiles').insert({
      id: userA,
      display_name: injectionName,
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

  const storedProfileA = await expectNoError(
    'Read parameterized profile value',
    clientA.from('profiles').select('display_name').eq('id', userA).single(),
  );
  assert(storedProfileA.data.display_name === injectionName, 'SQL-like profile text was not stored literally.');
  const stillHasB = await expectNoError(
    'Verify second profile survived SQL-like text',
    clientA.from('profiles').select('id').eq('id', userB).single(),
  );
  assert(stillHasB.data.id === userB, 'SQL-like profile text affected another row.');
  pass('postgrest_parameterization_profile_text');

  await expectError(
    'Reject blank profile update',
    clientA.from('profiles').update({ display_name: '   ' }).eq('id', userA),
  );
  pass('profile_database_constraints');

  const catalog = await expectNoError(
    'Interest catalog',
    clientA.from('interests').select('id,slug,label,emoji').in('slug', ['gaming', 'music', 'coffee', 'coding']),
  );
  assert(catalog.data?.length === 4, 'Expected static interest catalog rows are missing.');

  await expectError(
    'Direct user_interests write blocked',
    clientA.from('user_interests').insert({ user_id: userA, interest_id: catalog.data[0].id }),
  );

  await expectNoError(
    'Set interests A RPC',
    clientA.rpc('set_my_interests', { selected_slugs: ['gaming', 'music', 'coffee'] }),
  );
  await expectNoError(
    'Set interests B RPC',
    clientB.rpc('set_my_interests', { selected_slugs: ['gaming', 'music', 'coding'] }),
  );
  await expectError(
    'Reject injected interest slug',
    clientA.rpc('set_my_interests', { selected_slugs: ['gaming', 'music', "coffee');drop table profiles;--"] }),
  );
  pass('interests_rpc_only_and_validated');

  const statusBeforeLocation = await expectNoError('Onboarding status before location', clientA.rpc('my_onboarding_status'));
  assert(statusBeforeLocation.data?.[0]?.profile_complete === true, 'Profile should be complete.');
  assert(statusBeforeLocation.data?.[0]?.interest_count === 3, 'Interest count should be 3.');
  assert(statusBeforeLocation.data?.[0]?.has_location === false, 'Location should not be complete yet.');

  await expectError(
    'Direct location write blocked',
    clientA.from('profile_locations').insert({
      user_id: userA,
      location: 'POINT(100.514812 13.819552)',
    }),
  );

  await expectNoError(
    'Location A',
    clientA.rpc('set_my_location', { lat: 13.819552, lng: 100.514812 }),
  );
  await expectNoError(
    'Location B',
    clientB.rpc('set_my_location', { lat: 13.82, lng: 100.516 }),
  );
  await expectError(
    'Invalid latitude blocked',
    clientA.rpc('set_my_location', { lat: 999, lng: 100.5 }),
  );

  const statusAfterLocation = await expectNoError('Onboarding status after location', clientA.rpc('my_onboarding_status'));
  assert(statusAfterLocation.data?.[0]?.has_location === true, 'Location should complete onboarding.');
  pass('onboarding_status_and_location_rpc');

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

  await expectError(
    'Direct pass write blocked',
    clientA.from('passes').insert({ from_user_id: userA, to_user_id: userB }),
  );
  await expectError(
    'Direct block write blocked',
    clientA.from('blocks').insert({ blocker_id: userA, blocked_id: userB }),
  );
  pass('sensitive_relationship_writes_rpc_only');

  await expectError(
    'Direct report write blocked',
    clientA.from('reports').insert({
      reporter_id: userA,
      reported_id: userB,
      reason: 'other',
    }),
  );
  await expectError(
    'Invalid report reason blocked',
    clientA.rpc('report_profile', {
      target_user: userB,
      report_reason: "other');drop table profiles;--",
      report_details: null,
    }),
  );
  await expectNoError(
    'Valid report RPC',
    clientA.rpc('report_profile', {
      target_user: userB,
      report_reason: 'other',
      report_details: 'Temporary QA report',
    }),
  );
  pass('report_rpc_only_and_validated');

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

  await expectError(
    'Whitespace-only message blocked',
    clientA.from('messages').insert({ match_id: matchId, sender_id: userA, content: '   ' }),
  );
  await expectError(
    'Sender spoof blocked',
    clientA.from('messages').insert({ match_id: matchId, sender_id: userB, content: 'spoof attempt' }),
  );

  const sqlLikeMessage = "Robert'); DROP TABLE public.profiles; --";
  const sent = await expectNoError(
    'Send SQL-like message A',
    clientA
      .from('messages')
      .insert({ match_id: matchId, sender_id: userA, content: sqlLikeMessage })
      .select('id,match_id,sender_id,content,created_at')
      .single(),
  );
  assert(sent.data?.id && sent.data.content === sqlLikeMessage, 'SQL-like message was not stored literally.');

  const inboxB = await expectNoError(
    'Read messages B',
    clientB.from('messages').select('id,sender_id,content').eq('match_id', matchId),
  );
  assert(
    inboxB.data?.some((row) => row.id === sent.data.id && row.sender_id === userA && row.content === sqlLikeMessage),
    'Matched recipient could not read the literal message.',
  );

  const profileStillExists = await expectNoError(
    'Profiles table still intact',
    clientA.from('profiles').select('id').eq('id', userB).single(),
  );
  assert(profileStillExists.data.id === userB, 'SQL-like message affected profiles table.');
  pass('chat_rls_constraints_and_parameterization');

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const allowed = await expectNoError(
      `Meeting rate limit allow ${attempt}`,
      admin.rpc('consume_meeting_rate_limit', { target_user: userA }),
    );
    assert(allowed.data === true, `Meeting rate limiter rejected request ${attempt} too early.`);
  }
  const denied = await expectNoError(
    'Meeting rate limit deny 11',
    admin.rpc('consume_meeting_rate_limit', { target_user: userA }),
  );
  assert(denied.data === false, 'Meeting rate limiter did not reject the 11th request.');
  const clientRateAttempt = await clientA.rpc('consume_meeting_rate_limit', { target_user: userA });
  assert(clientRateAttempt.error, 'Authenticated client can call server-only rate limiter.');
  pass('meeting_rate_limit_server_only');

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

  const directMatchAfterBlock = await expectNoError(
    'Direct match read after block',
    clientA.from('matches').select('id,status').eq('id', matchId),
  );
  assert(directMatchAfterBlock.data?.length === 0, 'Blocked match remained directly readable.');

  const oldMessagesAfterBlock = await expectNoError(
    'Old messages after block',
    clientA.from('messages').select('id').eq('match_id', matchId),
  );
  assert(oldMessagesAfterBlock.data?.length === 0, 'Blocked chat history remained readable.');

  const blockedProfileFromA = await expectNoError(
    'Blocked profile hidden from blocker',
    clientA.from('profiles').select('id').eq('id', userB),
  );
  const blockerProfileFromB = await expectNoError(
    'Blocker profile hidden from blocked user',
    clientB.from('profiles').select('id').eq('id', userA),
  );
  assert(blockedProfileFromA.data?.length === 0, 'Blocked profile remained visible to blocker.');
  assert(blockerProfileFromB.data?.length === 0, 'Blocker profile remained visible to blocked user.');

  const blockedInterestsFromA = await expectNoError(
    'Blocked interests hidden from blocker',
    clientA.from('user_interests').select('user_id').eq('user_id', userB),
  );
  const blockerInterestsFromB = await expectNoError(
    'Blocker interests hidden from blocked user',
    clientB.from('user_interests').select('user_id').eq('user_id', userA),
  );
  assert(blockedInterestsFromA.data?.length === 0, 'Blocked user interests remained visible to blocker.');
  assert(blockerInterestsFromB.data?.length === 0, 'Blocker interests remained visible to blocked user.');
  pass('block_revokes_relationship_profile_interest_and_chat_access');

  const bucket = await expectNoError('Avatar bucket', admin.storage.getBucket('avatars'));
  assert(bucket.data?.public === true, 'avatars bucket is missing or not public.');
  assert(bucket.data?.file_size_limit === 5242880, 'avatars bucket size limit is not 5 MB.');
  assert(
    Array.isArray(bucket.data?.allowed_mime_types) &&
      ['image/jpeg', 'image/png', 'image/webp'].every((type) => bucket.data.allowed_mime_types.includes(type)),
    'avatars bucket MIME restrictions are missing.',
  );
  pass('avatar_bucket_restrictions');

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
