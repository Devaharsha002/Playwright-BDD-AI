import fs from 'node:fs';
import path from 'node:path';
import { frameworkConfig } from '../frameworkConfig.js';

export const USER_ALIASES = {
  STANDARD_USER: 'StandardUser',
  ADMIN_USER: 'AdminUser',
  CME_OFFICER: 'CmeOfficer',
} as const;

export type UserAlias = (typeof USER_ALIASES)[keyof typeof USER_ALIASES] | string;

/**
 * Ensures the storageState cache folder exists.
 */
export function ensureAuthDir(): string {
  const dir = frameworkConfig.artifacts.authDir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Returns the absolute storageState path for a given user alias.
 */
export function getStorageStatePath(userAlias: UserAlias): string {
  const authDir = ensureAuthDir();
  return path.resolve(authDir, `${userAlias}.json`);
}

/**
 * Checks if a valid storageState session file exists for a given user.
 */
export function hasValidStorageState(userAlias: UserAlias): boolean {
  const filePath = getStorageStatePath(userAlias);
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.cookies) && Array.isArray(parsed.origins);
  } catch {
    return false;
  }
}
