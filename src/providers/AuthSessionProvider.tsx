import type { PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { getMyOnboardingStatus } from '@/services/profile';

export type OnboardingStage = 'profile' | 'interests' | 'location' | 'complete';

type AuthSessionContextValue = {
  session: Session | null;
  authReady: boolean;
  stage: OnboardingStage | null;
  stageReady: boolean;
  error: string;
  refreshOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function onboardingStagePath(stage: OnboardingStage) {
  if (stage === 'profile') return '/profile-setup' as const;
  if (stage === 'interests') return '/interests' as const;
  if (stage === 'location') return '/location' as const;
  return '/discover' as const;
}

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig);
  const [stage, setStage] = useState<OnboardingStage | null>(null);
  const [stageReady, setStageReady] = useState(false);
  const [error, setError] = useState('');
  const sessionUserId = session?.user.id ?? null;

  const refreshOnboarding = useCallback(async () => {
    if (!sessionUserId) {
      setStage(null);
      setStageReady(true);
      return;
    }

    setStageReady(false);
    setError('');

    try {
      const status = await getMyOnboardingStatus();
      const nextStage: OnboardingStage = !status.profileComplete
        ? 'profile'
        : status.interestCount < 3
          ? 'interests'
          : !status.hasLocation
            ? 'location'
            : 'complete';
      setStage(nextStage);
    } catch {
      setStage(null);
      setError('Could not verify your account setup. Check the Supabase migrations and connection.');
    } finally {
      setStageReady(true);
    }
  }, [sessionUserId]);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setSession(null);
      setAuthReady(true);
      setStageReady(true);
      return;
    }

    let mounted = true;

    void client.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError || !data.session) {
        if (sessionError) setError('Could not restore your session.');
        setSession(null);
        setAuthReady(true);
        return;
      }

      // getSession() restores local state. getUser() revalidates that token with
      // Supabase Auth before the UI treats protected routes as authenticated.
      const { data: userData, error: userError } = await client.auth.getUser();
      if (!mounted) return;
      if (userError || !userData.user || userData.user.id !== data.session.user.id) {
        await client.auth.signOut({ scope: 'local' });
        if (!mounted) return;
        setSession(null);
        setError('Your session is no longer valid. Please log in again.');
        setAuthReady(true);
        return;
      }

      setSession(data.session);
      setAuthReady(true);
    });

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setStage(null);
      setStageReady(!nextSession);
      setError('');
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    void refreshOnboarding();
  }, [authReady, refreshOnboarding]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  }, []);

  const value = useMemo<AuthSessionContextValue>(() => ({
    session,
    authReady,
    stage,
    stageReady,
    error,
    refreshOnboarding,
    signOut,
  }), [authReady, error, refreshOnboarding, session, signOut, stage, stageReady]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  return value;
}
