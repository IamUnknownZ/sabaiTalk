import { Redirect, Slot } from 'expo-router';
import { GuardError, GuardLoading } from '@/components/GuardState';
import { onboardingStagePath, useAuthSession } from '@/providers/AuthSessionProvider';

export default function ProtectedLayout() {
  const { session, authReady, stage, stageReady, error } = useAuthSession();

  if (!authReady || (session && !stageReady)) return <GuardLoading />;
  if (!session) return <Redirect href="/login" />;
  if (error) return <GuardError />;
  if (stage && stage !== 'complete') return <Redirect href={onboardingStagePath(stage)} />;

  return <Slot />;
}
