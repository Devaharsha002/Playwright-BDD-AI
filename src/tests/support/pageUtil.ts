import type { Page, Locator } from '@playwright/test';
import { frameworkConfig } from './frameworkConfig.js';

export class PageUtil {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Waits for standard enterprise CRM and web loading spinners to disappear.
   */
  async waitForSpinnerToDisappear(timeout = frameworkConfig.timeouts.spinnerTimeout): Promise<void> {
    const spinnerSelectors = [
      '[data-id="progress-indicator"]',
      '.ms-Spinner',
      '.loading-spinner',
      '[aria-label="Loading..."]',
      'div[role="progressbar"]',
      '.xrm-loading-pane',
    ];

    for (const selector of spinnerSelectors) {
      const locator = this.page.locator(selector).first();
      try {
        if (await locator.isVisible({ timeout: 1000 })) {
          await locator.waitFor({ state: 'hidden', timeout });
        }
      } catch {
        // Element not visible or detached - safe to ignore
      }
    }
  }

  /**
   * Safely clicks an element after ensuring visibility and scroll into view.
   */
  async safeClick(selector: string | Locator, timeout = frameworkConfig.timeouts.action): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible', timeout });
    await locator.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    await locator.click({ timeout });
    await this.waitForSpinnerToDisappear();
  }

  /**
   * Safely fills input after clearing existing text.
   */
  async safeFill(selector: string | Locator, text: string, timeout = frameworkConfig.timeouts.action): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible', timeout });
    await locator.fill('');
    await locator.fill(text, { timeout });
  }

  /**
   * Retrieves inner text safely with trimming.
   */
  async getTrimmedText(selector: string | Locator, timeout = frameworkConfig.timeouts.action): Promise<string> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible', timeout });
    const text = await locator.innerText({ timeout });
    return text.trim();
  }

  /**
   * Waits for network idle state with fallback on timeout.
   */
  async waitForNetworkIdle(timeout = 15000): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
    } catch {
      // Best effort network idle wait
    }
  }
}

export function createPageUtil(page: Page): PageUtil {
  return new PageUtil(page);
}
