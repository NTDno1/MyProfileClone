import crypto from 'crypto';

// Hash password using SHA256
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = hashPassword('1122'); // Hash of '1122'

export function verifyAdminCredentials(username: string, password: string): boolean {
  const passwordHash = hashPassword(password);
  return username === ADMIN_USERNAME && passwordHash === ADMIN_PASSWORD_HASH;
}

// Session management (using localStorage on client, cookies on server)
export const AUTH_COOKIE_NAME = 'admin_auth_token';
const AUTH_TOKEN = 'admin_authenticated_' + ADMIN_PASSWORD_HASH.substring(0, 10);

export function getAuthToken(): string {
  return AUTH_TOKEN;
}

export function isValidAuthToken(token: string): boolean {
  return token === AUTH_TOKEN;
}

