import './loadEnv.js';

export interface ViewportConfig {
  width: number;
  height: number;
}

export interface ProjectSettings {
  baseUrl: string;
  crmBaseUrl: string;
  authUrl: string;
  defaultUser: string;
  viewport: ViewportConfig;
}

const DEFAULT_VIEWPORT: ViewportConfig = {
  width: 1920,
  height: 1080,
};

export const projectConfig: ProjectSettings = {
  baseUrl: process.env.BASE_URL || 'https://login.microsoftonline.com',
  crmBaseUrl: process.env.CRM_BASE_URL || 'https://cme-crm.enterprise.internal',
  authUrl: process.env.AUTH_URL || 'https://login.microsoftonline.com',
  defaultUser: process.env.DEFAULT_USER_ALIAS || 'StandardUser',
  viewport: DEFAULT_VIEWPORT,
};
