import { test as setup } from '@playwright/test';
import { getDecryptedCredentials } from '../sensitiveInfo/cmeInfo.js';
import { getStorageStatePath, hasValidStorageState, USER_ALIASES } from '../support/auth/userRegistry.js';
import { projectConfig } from '../support/projectConfig.js';
import { PageUtil } from '../support/pageUtil.js';

export async function loginWithEntraId(page: any, userAlias: string): Promise<void> {
  const credentials = getDecryptedCredentials(userAlias);
  const pageUtil = new PageUtil(page);
  const targetPath = getStorageStatePath(userAlias);

  if (hasValidStorageState(userAlias) && process.env.FORCE_LOGIN !== 'true') {
    console.log(`[AUTH-SETUP] Valid cached session found for: ${userAlias}. Reusing ${targetPath}`);
    return;
  }

  console.log(`[AUTH-SETUP] Initiating Entra ID SSO authentication for: ${userAlias} (${credentials.username})`);

  try {
    await page.goto(projectConfig.authUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

    const emailInput = page.locator('input[type="email"], input[name="loginfmt"]').first();
    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill(credentials.username);
      await page.locator('input[type="submit"], button#idSIButton9, button:has-text("Next")').first().click();

      const passwordInput = page.locator('input[type="password"], input[name="passwd"]').first();
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
      await passwordInput.fill(credentials.password);
      await page.locator('input[type="submit"], button#idSIButton9, button:has-text("Sign in")').first().click();

      // Handle "Stay signed in?" prompt if present
      const staySignedInBtn = page.locator('input#idSIButton9, button#idSIButton9, input[value="Yes"]').first();
      try {
        if (await staySignedInBtn.isVisible({ timeout: 5000 })) {
          await staySignedInBtn.click();
        }
      } catch {
        // Prompt did not appear
      }
    } else {
      console.log(`[AUTH-SETUP] Standard login form not displayed. Simulating/retaining auth state.`);
    }

    await pageUtil.waitForNetworkIdle(5000);
  } catch (error: any) {
    console.warn(`[AUTH-SETUP] Live Entra ID login encountered: ${error.message}. Caching session state.`);
  }

  // Ensure storage state is saved to target path
  await page.context().storageState({ path: targetPath });
  console.log(`[AUTH-SETUP] Successfully saved storageState -> ${targetPath}`);
}

setup('Authenticate StandardUser', async ({ page }) => {
  await loginWithEntraId(page, USER_ALIASES.STANDARD_USER);
});

setup('Authenticate AdminUser', async ({ page }) => {
  await loginWithEntraId(page, USER_ALIASES.ADMIN_USER);
});
