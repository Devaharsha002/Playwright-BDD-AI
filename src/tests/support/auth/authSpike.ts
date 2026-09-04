import path from 'node:path';
import { chromium } from '@playwright/test';
import '../loadEnv.js';
import { getDecryptedCredentials } from '../../sensitiveInfo/cmeInfo.js';
import { getStorageStatePath, USER_ALIASES } from './userRegistry.js';
import { projectConfig } from '../projectConfig.js';

/**
 * Standalone headed authentication verification spike script.
 * Usage: npx tsx src/tests/support/auth/authSpike.ts [userAlias]
 */
async function runAuthSpike(): Promise<void> {
  const userAlias = process.argv[2] || USER_ALIASES.STANDARD_USER;
  console.log(`[AUTH-SPIKE] Starting headed authentication spike for: ${userAlias}`);

  let creds;
  try {
    creds = getDecryptedCredentials(userAlias);
    console.log(`[AUTH-SPIKE] Decrypted Username: ${creds.username}`);
    console.log(`[AUTH-SPIKE] Password Length: ${creds.password.length} chars (Decrypted securely)`);
  } catch (err: any) {
    console.error(`[AUTH-SPIKE] Decryption error: ${err.message}`);
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
  }).catch(() => chromium.launch({ headless: false })); // fallback to bundled chromium if chrome channel not found

  const context = await browser.newContext({
    viewport: projectConfig.viewport,
  });

  const page = await context.newPage();

  try {
    console.log(`[AUTH-SPIKE] Navigating to: ${projectConfig.authUrl}`);
    await page.goto(projectConfig.authUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const emailInput = page.locator('input[type="email"], input[name="loginfmt"]').first();
    if (await emailInput.isVisible({ timeout: 10000 })) {
      console.log(`[AUTH-SPIKE] Entering username...`);
      await emailInput.fill(creds.username);
      await page.locator('input[type="submit"], button#idSIButton9, button:has-text("Next")').first().click();

      const passwordInput = page.locator('input[type="password"], input[name="passwd"]').first();
      await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
      console.log(`[AUTH-SPIKE] Entering password...`);
      await passwordInput.fill(creds.password);
      await page.locator('input[type="submit"], button#idSIButton9, button:has-text("Sign in")').first().click();

      // Check if MFA or Stay signed in appears
      console.log(`[AUTH-SPIKE] Waiting for MFA or Post-Login landing...`);
      await page.waitForTimeout(3000);

      const staySignedIn = page.locator('input#idSIButton9, button#idSIButton9, input[value="Yes"]').first();
      if (await staySignedIn.isVisible({ timeout: 5000 })) {
        await staySignedIn.click();
      }
    }

    const statePath = getStorageStatePath(userAlias);
    await context.storageState({ path: statePath });
    console.log(`[AUTH-SPIKE] Successfully saved storage state to: ${statePath}`);
  } catch (err: any) {
    console.error(`[AUTH-SPIKE] Execution warning or error: ${err.message}`);
  } finally {
    console.log(`[AUTH-SPIKE] Spike completed. Closing browser.`);
    await browser.close();
  }
}

import url from 'node:url';
const isMainScript = process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url);

if (isMainScript) {
  runAuthSpike().catch(console.error);
}

export { runAuthSpike };
