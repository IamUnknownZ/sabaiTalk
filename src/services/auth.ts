import { requireSupabase } from '@/lib/supabase';

export async function signInWithEmail(email: string, password: string) {
  return requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
}

export async function signUpWithEmail(email: string, password: string) {
  return requireSupabase().auth.signUp({ email: email.trim(), password });
}

export async function signOut() {
  return requireSupabase().auth.signOut();
}
