import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Loads environment variables from `.env.local` or `.env.example` as fallback.
 * Must be executed prior to any secret decryption or configuration initialization.
 */
function loadEnvironment(): void {
  const rootDir = process.cwd();
  const candidates = [
    path.resolve(rootDir, '.env.local'),
    path.resolve(rootDir, 'env.local'),
    path.resolve(rootDir, '.env'),
    path.resolve(rootDir, '.env.example'),
    path.resolve(rootDir, 'env.example')
  ];

  let loaded = false;
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file });
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    dotenv.config(); // fallback to default dotenv resolution
  }
}

loadEnvironment();
