import { Redirect, Stack } from 'expo-router';
import { GuardError, GuardLoading } from '@/components/GuardState';
import { onboardingStagePath, useAuthSession } from '@/providers/AuthSessionProvider';

export default function AuthLayout() {
  const { session, authReady, stage, stageReady, error } = useAuthSession();

  if (!authReady) return <GuardLoading />;
  if (session && !stageReady) return <GuardLoading />;
  if (session && error) return <GuardError />;

  if (session && stage) {
    return <Redirect href={onboardingStagePath(stage)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
