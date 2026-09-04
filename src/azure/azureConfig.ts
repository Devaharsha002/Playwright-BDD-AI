import '../tests/support/loadEnv.js';

export interface AzureDevOpsConfig {
  orgUrl: string;
  orgName: string;
  project: string;
  pat: string;
  apiVersion: string;
}

/**
 * Normalizes Azure DevOps organization input into a standard URL and name.
 */
function normalizeOrg(rawOrg = ''): { orgUrl: string; orgName: string } {
  const trimmed = rawOrg.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return { orgUrl: '', orgName: '' };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const parts = trimmed.split('/');
    const orgName = parts[parts.length - 1];
    return { orgUrl: trimmed, orgName };
  }

  return {
    orgUrl: `https://dev.azure.com/${trimmed}`,
    orgName: trimmed,
  };
}

const rawOrg = process.env.AZURE_DEVOPS_ORG || '';
const { orgUrl, orgName } = normalizeOrg(rawOrg);
const project = (process.env.AZURE_DEVOPS_PROJECT || '').trim();
const pat = (process.env.AZURE_DEVOPS_PAT || '').trim();
const apiVersion = '7.0';

export const azureConfig: AzureDevOpsConfig = {
  orgUrl,
  orgName,
  project,
  pat,
  apiVersion,
};

export function validateAzureConfig(): void {
  const errors: string[] = [];
  if (!azureConfig.orgUrl) {
    errors.push('AZURE_DEVOPS_ORG is missing.');
  }
  if (!azureConfig.project) {
    errors.push('AZURE_DEVOPS_PROJECT is missing.');
  }
  if (!azureConfig.pat) {
    errors.push('AZURE_DEVOPS_PAT is missing.');
  }

  if (errors.length > 0) {
    throw new Error(`Azure DevOps configuration error:\n${errors.map((e) => ` - ${e}`).join('\n')}`);
  }
}
