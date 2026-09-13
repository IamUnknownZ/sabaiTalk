export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertUuid(value: string, label = 'id') {
  if (!UUID_PATTERN.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}

export function normalizeRequiredText(value: string, label: string, maxLength: number) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maxLength) throw new Error(`${label} is too long.`);
  return normalized;
}

export function normalizeOptionalText(value: string | undefined, maxLength: number) {
  const normalized = value?.trim() ?? '';
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new Error('Text is too long.');
  return normalized;
}

export function validateInterestSlugs(values: string[]) {
  const unique = [...new Set(values)];
  if (unique.length < 3 || unique.length > 6 || unique.length !== values.length) {
    throw new Error('Choose 3–6 unique interests.');
  }
  for (const slug of unique) {
    if (!/^[a-z0-9][a-z0-9_-]{0,39}$/i.test(slug)) {
      throw new Error('Invalid interest.');
    }
  }
  return unique;
}

export function validateSignUpCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error('Password must be 8–128 characters.');
  }
  return { email: normalizedEmail, password };
}

export function validateSignInCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || normalizedEmail.length > 254 || !password || password.length > 1024) {
    throw new Error('Invalid email or password.');
  }
  return { email: normalizedEmail, password };
}
