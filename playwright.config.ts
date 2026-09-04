import './src/tests/support/loadEnv';
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';
import { frameworkConfig } from './src/tests/support/frameworkConfig.js';
import { projectConfig } from './src/tests/support/projectConfig.js';
import { getStorageStatePath, USER_ALIASES } from './src/tests/support/auth/userRegistry.js';

/**
 * Multiple defineBddConfig passes configured for Enterprise suites
 */
const mainTestDir = defineBddConfig({
  features: 'src/tests/features/**/*.feature',
  steps: ['src/tests/steps/**/*.steps.ts', 'src/tests/support/fixtures.ts'],
  featuresRoot: 'src/tests/features',
});

const demoTestDir = defineBddConfig({
  outputDir: '.features-gen/demo',
  features: 'src/tests/features/Demo/**/*.feature',
  steps: ['src/tests/steps/**/*.steps.ts', 'src/tests/support/fixtures.ts'],
  featuresRoot: 'src/tests/features',
  tags: 'not @overlay',
});

const authCheckTestDir = defineBddConfig({
  outputDir: '.features-gen/authCheck',
  features: 'src/tests/authCheck/**/*.feature',
  steps: ['src/tests/steps/**/*.steps.ts', 'src/tests/support/fixtures.ts'],
  featuresRoot: 'src/tests/authCheck',
});

export default defineConfig({
  outputDir: frameworkConfig.artifacts.outputDir,
  fullyParallel: frameworkConfig.parallel,
  retries: frameworkConfig.retries,
  timeout: frameworkConfig.timeouts.test,
  expect: {
    timeout: frameworkConfig.timeouts.expect,
  },
  use: {
    channel: frameworkConfig.browser.channel,
    headless: frameworkConfig.browser.headless,
    actionTimeout: frameworkConfig.timeouts.action,
    navigationTimeout: frameworkConfig.timeouts.navigation,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: projectConfig.viewport,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    cucumberReporter('json', {
      outputFile: frameworkConfig.artifacts.cucumberJsonFile,
      skipAttachments: ['video/webm', 'application/zip'],
    }),
    ['./test-results/HSBC-AT-Report/reporter.ts'],
  ],
  projects: [
    {
      name: 'setup',
      testDir: 'src/tests/setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'CME',
      testDir: mainTestDir,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: frameworkConfig.browser.channel,
        storageState: getStorageStatePath(USER_ALIASES.STANDARD_USER),
      },
    },
    {
      name: 'demo',
      testDir: demoTestDir,
      use: {
        ...devices['Desktop Chrome'],
        channel: frameworkConfig.browser.channel,
      },
    },
    {
      name: 'authCheck',
      testDir: authCheckTestDir,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: frameworkConfig.browser.channel,
        storageState: getStorageStatePath(USER_ALIASES.STANDARD_USER),
      },
    },
  ],
});
