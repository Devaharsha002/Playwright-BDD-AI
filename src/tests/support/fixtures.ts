import { expect } from '@playwright/test';
import { test as base, createBdd } from 'playwright-bdd';
import { World } from './World.js';

/**
 * Extended Playwright test runner injecting custom World fixture.
 */
export const test = base.extend<{ world: World }>({
  world: async ({ page, context }, use, testInfo) => {
    const browser = context.browser() ?? page.context().browser()!;
    const world = new World({
      page,
      context,
      browser,
      testInfo,
    });
    await use(world);
  },
});

/**
 * Step definition hooks and matchers with worldFixture binding.
 */
export const { Given, When, Then, Before, After } = createBdd(test, {
  worldFixture: 'world',
});

export { expect };
export type { World };
