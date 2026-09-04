import crypto from 'node:crypto';
import './loadEnv.js';

const ALGORITHM = 'aes-256-cbc';

/**
 * Normalizes a 32-byte (256-bit) encryption key from hex or raw string.
 */
function getKeyBuffer(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not defined.');
  }

  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }

  if (Buffer.byteLength(rawKey, 'utf8') === 32) {
    return Buffer.from(rawKey, 'utf8');
  }

  // If length does not match, hash using sha256 to ensure exact 32 bytes
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Normalizes a 16-byte (128-bit) IV from hex or raw string.
 */
function getDefaultIvBuffer(): Buffer {
  const rawIv = process.env.ENCRYPTION_IV;
  if (!rawIv) {
    return crypto.randomBytes(16);
  }

  if (/^[0-9a-fA-F]{32}$/.test(rawIv)) {
    return Buffer.from(rawIv, 'hex');
  }

  if (Buffer.byteLength(rawIv, 'utf8') === 16) {
    return Buffer.from(rawIv, 'utf8');
  }

  // Truncate or pad to 16 bytes
  const hash = crypto.createHash('md5').update(rawIv).digest();
  return hash;
}

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * Returns formatted string: "ivHex:cipherHex"
 */
export function encrypt(plainText: string, customIv?: Buffer): string {
  const key = getKeyBuffer();
  const iv = customIv ?? getDefaultIvBuffer();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const ivHex = iv.toString('hex');
  return `${ivHex}:${encrypted}`;
}

/**
 * Decrypts an AES-256-CBC string formatted as "ivHex:cipherHex".
 */
export function decrypt(encryptedPayload: string): string {
  if (!encryptedPayload) {
    return '';
  }

  const key = getKeyBuffer();
  let iv: Buffer;
  let cipherHex: string;

  if (encryptedPayload.includes(':')) {
    const parts = encryptedPayload.split(':');
    const ivHex = parts[0];
    cipherHex = parts[1];
    iv = Buffer.from(ivHex, 'hex');
  } else {
    // Fallback if no colon is found, use default IV
    iv = getDefaultIvBuffer();
    cipherHex = encryptedPayload;
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export const cryptoUtil = {
  encrypt,
  decrypt,
};
