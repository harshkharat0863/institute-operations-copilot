import { User, UserRole } from '../types';

export interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  trainer_id?: string;
  exp: number;
  iat: number;
  iss: string;
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
 * Base64 URL encode helper.
 */
function base64UrlEncode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes and verifies the structural shape of a JWT token,
 * returning the strictly typed payload.
 * Role is extracted exclusively from this payload.
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

/**
 * Generates a standard JWT format for mock authentication.
 */
export function generateMockJwt(user: User): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    trainer_id: user.trainer_id,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
    iss: 'institute-ops-copilot',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  // Simulated signature for mock client-side validation
  const signature = base64UrlEncode(`sig_${user.id}_${user.role}_${now}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
