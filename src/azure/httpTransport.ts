import { azureConfig, validateAzureConfig } from './azureConfig.js';

export class AzureHttpTransport {
  private baseOrgUrl: string;
  private project: string;
  private authHeader: string;

  constructor() {
    validateAzureConfig();
    this.baseOrgUrl = azureConfig.orgUrl;
    this.project = encodeURIComponent(azureConfig.project);
    this.authHeader = `Basic ${Buffer.from(`:${azureConfig.pat}`).toString('base64')}`;
  }

  /**
   * Executes an authenticated HTTP request against Azure DevOps REST API.
   */
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseOrgUrl}/${this.project}/_apis/${endpoint.replace(/^\/+/, '')}`;

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Azure DevOps API error [${response.status} ${response.statusText}] at ${url}:\n${errorText}`);
    }

    return (await response.json()) as T;
  }

  async get<T = any>(endpoint: string, queryParams: Record<string, string> = {}): Promise<T> {
    const urlObj = new URL(
      endpoint.startsWith('http')
        ? endpoint
        : `${this.baseOrgUrl}/${this.project}/_apis/${endpoint.replace(/^\/+/, '')}`
    );

    urlObj.searchParams.set('api-version', azureConfig.apiVersion);
    for (const [key, value] of Object.entries(queryParams)) {
      urlObj.searchParams.set(key, value);
    }

    return this.request<T>(urlObj.toString(), { method: 'GET' });
  }

  async post<T = any>(endpoint: string, body: any, queryParams: Record<string, string> = {}): Promise<T> {
    const urlObj = new URL(
      endpoint.startsWith('http')
        ? endpoint
        : `${this.baseOrgUrl}/${this.project}/_apis/${endpoint.replace(/^\/+/, '')}`
    );

    urlObj.searchParams.set('api-version', azureConfig.apiVersion);
    for (const [key, value] of Object.entries(queryParams)) {
      urlObj.searchParams.set(key, value);
    }

    return this.request<T>(urlObj.toString(), {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const httpTransport = new AzureHttpTransport();
