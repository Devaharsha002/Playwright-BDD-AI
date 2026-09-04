import type { Page, BrowserContext, Browser, TestInfo, Frame } from '@playwright/test';

export interface WorldOptions {
  page: Page;
  context: BrowserContext;
  browser: Browser;
  testInfo: TestInfo;
}

/**
 * World: Plain TypeScript context container for Playwright-BDD steps.
 * Does NOT extend @cucumber/cucumber World.
 */
export class World {
  public page: Page;
  public context: BrowserContext;
  public browser: Browser;
  public testInfo: TestInfo;
  public customState: Map<string, any>;

  constructor(options: WorldOptions) {
    this.page = options.page;
    this.context = options.context;
    this.browser = options.browser;
    this.testInfo = options.testInfo;
    this.customState = new Map<string, any>();
  }

  /**
   * Navigates to a target URL with configurable timeout and domcontentloaded/load wait.
   */
  async navigateTo(url: string, timeout = 60000): Promise<void> {
    await this.page.goto(url, {
      timeout,
      waitUntil: 'domcontentloaded'
    });
  }

  /**
   * Polls page frames to identify a Dynamics 365 / PowerApps CRM Xrm frame exposing window.Xrm.WebApi.
   */
  async findXrmFrame(timeoutMs = 30000): Promise<Frame | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const frames = this.page.frames();
      for (const frame of frames) {
        try {
          const hasXrm = await frame.evaluate(() => {
            const win = window as any;
            return !!(win.Xrm && win.Xrm.WebApi);
          });
          if (hasXrm) {
            return frame;
          }
        } catch {
          // Frame evaluation might fail if frame is navigating or cross-origin
        }
      }
      await this.page.waitForTimeout(500);
    }

    return null;
  }

  /**
   * Captures a full page screenshot and attaches it to the current Playwright testInfo artifact.
   */
  async takeScreenshot(name = 'screenshot'): Promise<Buffer> {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.testInfo.attach(name, {
      body: screenshot,
      contentType: 'image/png'
    });
    return screenshot;
  }

  /**
   * Stores cross-step data in scenario session memory.
   */
  set(key: string, value: any): void {
    this.customState.set(key, value);
  }

  /**
   * Retrieves cross-step data from scenario session memory.
   */
  get<T = any>(key: string): T {
    return this.customState.get(key) as T;
  }

  /**
   * Checks if key exists in state memory.
   */
  has(key: string): boolean {
    return this.customState.has(key);
  }
}
