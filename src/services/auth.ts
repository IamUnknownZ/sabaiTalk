import { requireSupabase } from '@/lib/supabase';
import { validateSignInCredentials, validateSignUpCredentials } from '@/lib/validation';

export async function signInWithEmail(email: string, password: string) {
  const credentials = validateSignInCredentials(email, password);
  return requireSupabase().auth.signInWithPassword(credentials);
}

export async function signUpWithEmail(email: string, password: string) {
  const credentials = validateSignUpCredentials(email, password);
  return requireSupabase().auth.signUp(credentials);
}

export async function signOut() {
  return requireSupabase().auth.signOut();
}
