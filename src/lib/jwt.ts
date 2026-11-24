import { UserRole } from '../types';

export interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  trainer_id?: string;
  exp: number;
  iat: number;
}

/**
 * Base64 URL decode helper safe for browser environments.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return atob(base64);
  }
}

/**
 * Decodes and verifies the structural shape of a JWT token,
 * returning the strictly typed payload.
 */
export function decodeJwt(token: string): JWTPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payloadStr = base64UrlDecode(parts[1]);
    const parsed = JSON.parse(payloadStr) as Partial<JWTPayload>;

    if (!parsed.id || !parsed.role || !parsed.name) {
      return null;
    }

    // Check expiration
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      console.warn('JWT token has expired');
      return null;
    }

    return parsed as JWTPayload;
  } catch (err) {
    console.error('Failed to decode JWT:', err);
    return null;
  }
}
