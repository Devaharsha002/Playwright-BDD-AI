import path from 'node:path';
import './loadEnv.js';

export const frameworkConfig = {
  timeouts: {
    test: 240000,
    expect: 30000,
    action: 60000,
    navigation: 120000,
    shortWait: 5000,
    spinnerTimeout: 20000,
  },
  browser: {
    channel: 'chrome',
    headless: process.env.HEADLESS === 'true',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : 0,
  },
  artifacts: {
    outputDir: './test-results/artifacts',
    authDir: path.resolve(process.cwd(), '.auth'),
    reportsDir: path.resolve(process.cwd(), 'test-results'),
    jsonReportsDir: path.resolve(process.cwd(), 'test-results/jsonFiles'),
    cucumberJsonFile: path.resolve(process.cwd(), 'test-results/jsonFiles/cucumber-report.json'),
    cucumberHtmlDir: path.resolve(process.cwd(), 'test-results/cucumber-html'),
    hsbcReportDir: path.resolve(process.cwd(), 'test-results/HSBC-AT-Report'),
  },
  retries: 0,
  parallel: false,
};
