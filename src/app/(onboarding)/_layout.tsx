import { Redirect, Stack, usePathname } from 'expo-router';
import { GuardError, GuardLoading } from '@/components/GuardState';
import { onboardingStagePath, useAuthSession } from '@/providers/AuthSessionProvider';

export default function OnboardingLayout() {
  const pathname = usePathname();
  const { session, authReady, stage, stageReady, error } = useAuthSession();

  if (!authReady || (session && !stageReady)) return <GuardLoading />;
  if (!session) return <Redirect href="/login" />;
  if (error) return <GuardError />;

  if (stage && stage !== 'complete') {
    const expected = onboardingStagePath(stage);
    if (pathname !== expected) return <Redirect href={expected} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
