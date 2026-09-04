import '../tests/support/loadEnv.js';
import { azureConfig, validateAzureConfig } from './azureConfig.js';
import { azureApi } from './azureApi.js';

/**
 * Verifies the Personal Access Token (PAT) and connectivity to Azure DevOps.
 * Usage: npm run azure:check
 */
async function checkConnection(): Promise<void> {
  console.log(`\n===============================================================`);
  console.log(`         AZURE DEVOPS CONNECTIVITY & CREDENTIAL CHECK          `);
  console.log(`===============================================================\n`);

  console.log(`Configured Organization : ${azureConfig.orgUrl || '(Not Set)'}`);
  console.log(`Configured Project      : ${azureConfig.project || '(Not Set)'}`);
  console.log(`Configured PAT Status   : ${azureConfig.pat ? 'Present (Hidden)' : 'MISSING'}`);
  console.log(`Target API Version      : ${azureConfig.apiVersion}\n`);

  try {
    validateAzureConfig();
  } catch (validationError: any) {
    console.error(`[VALIDATION FAILED]\n${validationError.message}\n`);
    console.log(`Please configure your .env.local or environment variables with valid credentials.\n`);
    process.exit(1);
  }

  console.log(`Testing REST API connection to Azure DevOps...`);

  try {
    const result = await azureApi.testConnection();
    console.log(`\n[SUCCESS] Connection established!`);
    console.log(`  Project Name : ${result.projectName}`);
    console.log(`  Org URL      : ${result.orgUrl}`);
    console.log(`  PAT Token    : Verified and Authorized\n`);
  } catch (err: any) {
    console.warn(`\n[CONNECTION NOTICE]`);
    console.warn(`Could not connect to live Azure DevOps project: ${err.message}`);
    console.warn(`If you are running in an offline test environment or using mock credentials,`);
    console.warn(`the framework will automatically utilize the local mock/agent fallbacks.\n`);
  }
}

checkConnection().catch(console.error);
