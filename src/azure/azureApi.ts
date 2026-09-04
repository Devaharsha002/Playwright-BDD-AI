import { httpTransport } from './httpTransport.js';
import { htmlToText } from './htmlToText.js';
import { azureConfig } from './azureConfig.js';

export interface WorkItemRelation {
  rel: string;
  url: string;
  attributes?: Record<string, any>;
}

export interface AzureWorkItem {
  id: number;
  rev: number;
  fields: {
    'System.Title': string;
    'System.WorkItemType': string;
    'System.State': string;
    'System.Description'?: string;
    'Microsoft.VSTS.Common.AcceptanceCriteria'?: string;
    'Microsoft.VSTS.TCM.Steps'?: string;
    'System.AreaPath'?: string;
    'System.IterationPath'?: string;
    [key: string]: any;
  };
  relations?: WorkItemRelation[];
  url: string;
}

export interface ParsedTestStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
}

export interface TestCaseContext {
  id: number;
  title: string;
  state: string;
  description: string;
  steps: ParsedTestStep[];
  url: string;
}

export interface PbiContext {
  id: number;
  title: string;
  state: string;
  description: string;
  acceptanceCriteria: string;
  linkedTestCases: TestCaseContext[];
  url: string;
}

/**
 * Extracts Test Step actions and expected results from Azure DevOps XML step definitions.
 */
export function parseAzureTestSteps(xmlSteps = ''): ParsedTestStep[] {
  if (!xmlSteps) return [];

  const steps: ParsedTestStep[] = [];
  const stepRegex = /<step\b[^>]*>(.*?)<\/step>/gis;
  let match: RegExpExecArray | null;
  let counter = 1;

  while ((match = stepRegex.exec(xmlSteps)) !== null) {
    const stepContent = match[1];
    const paramStrings = [...stepContent.matchAll(/<parameterizedString[^>]*>(.*?)<\/parameterizedString>/gis)];

    const actionHtml = paramStrings[0] ? paramStrings[0][1] : '';
    const expectedHtml = paramStrings[1] ? paramStrings[1][1] : '';

    steps.push({
      stepNumber: counter++,
      action: htmlToText(actionHtml),
      expectedResult: htmlToText(expectedHtml),
    });
  }

  return steps;
}

export class AzureDevOpsApi {
  /**
   * Tests connectivity to the configured Azure DevOps project.
   */
  async testConnection(): Promise<{ success: boolean; projectName: string; orgUrl: string }> {
    const endpoint = `${azureConfig.orgUrl}/_apis/projects/${encodeURIComponent(azureConfig.project)}`;
    const result = await httpTransport.request(endpoint);
    return {
      success: true,
      projectName: result.name || azureConfig.project,
      orgUrl: azureConfig.orgUrl,
    };
  }

  /**
   * Fetches a single Work Item with all relations and fields.
   */
  async getWorkItem(id: number | string): Promise<AzureWorkItem> {
    return httpTransport.get<AzureWorkItem>(`wit/workitems/${id}`, {
      $expand: 'all',
    });
  }

  /**
   * Fetches multiple Work Items by ID in a single batch request.
   */
  async getWorkItems(ids: (number | string)[]): Promise<AzureWorkItem[]> {
    if (ids.length === 0) return [];
    const idList = ids.join(',');
    const response = await httpTransport.get<{ count: number; value: AzureWorkItem[] }>(`wit/workitems`, {
      ids: idList,
      $expand: 'all',
    });
    return response.value || [];
  }

  /**
   * Extracts linked Test Case IDs from a Work Item's relations.
   */
  extractLinkedTestCaseIds(workItem: AzureWorkItem): number[] {
    if (!workItem.relations) return [];

    const ids: number[] = [];
    for (const relation of workItem.relations) {
      // Azure relations for test cases typically use 'Microsoft.VSTS.Common.TestedBy-Forward'
      // or standard hyperlink URLs matching /workItems/(\d+)
      const match = relation.url.match(/workItems\/(\d+)$/i);
      if (match) {
        ids.push(parseInt(match[1], 10));
      }
    }

    return ids;
  }

  /**
   * Formats a raw Work Item into a clean TestCaseContext.
   */
  formatTestCase(item: AzureWorkItem): TestCaseContext {
    const rawSteps = item.fields['Microsoft.VSTS.TCM.Steps'] || '';
    return {
      id: item.id,
      title: item.fields['System.Title'] || '',
      state: item.fields['System.State'] || '',
      description: htmlToText(item.fields['System.Description'] || ''),
      steps: parseAzureTestSteps(rawSteps),
      url: item.url,
    };
  }

  /**
   * Fetches full context for a PBI (Product Backlog Item / User Story),
   * including clean Acceptance Criteria and linked Test Cases with steps.
   */
  async getPbiContext(pbiId: number | string): Promise<PbiContext> {
    const pbiItem = await this.getWorkItem(pbiId);
    const testCaseIds = this.extractLinkedTestCaseIds(pbiItem);

    let linkedTestCases: TestCaseContext[] = [];
    if (testCaseIds.length > 0) {
      const items = await this.getWorkItems(testCaseIds);
      linkedTestCases = items
        .filter((item) => item.fields['System.WorkItemType'] === 'Test Case')
        .map((item) => this.formatTestCase(item));
    }

    return {
      id: pbiItem.id,
      title: pbiItem.fields['System.Title'] || '',
      state: pbiItem.fields['System.State'] || '',
      description: htmlToText(pbiItem.fields['System.Description'] || ''),
      acceptanceCriteria: htmlToText(pbiItem.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || ''),
      linkedTestCases,
      url: pbiItem.url,
    };
  }
}

export const azureApi = new AzureDevOpsApi();
