import fs from 'node:fs';
import path from 'node:path';
import '../tests/support/loadEnv.js';
import { azureApi, PbiContext } from './azureApi.js';

/**
 * CLI tool to fetch full context for an Azure DevOps PBI / User Story.
 * Outputs both JSON and structured Markdown suitable for AI Agent feature authoring.
 * Usage: npm run agent:feature [pbiId]
 */
async function fetchFeatureContext(): Promise<void> {
  const pbiIdArg = process.argv[2] || process.env.TARGET_PBI_ID || '1001';
  console.log(`[AZURE-AGENT] Fetching context for PBI #${pbiIdArg}...`);

  const outputDir = path.resolve(process.cwd(), 'context');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let pbiContext: PbiContext;

  try {
    pbiContext = await azureApi.getPbiContext(pbiIdArg);
  } catch (error: any) {
    console.warn(`[AZURE-AGENT] Azure API connection could not be established (${error.message}). Generating sample offline context for demonstration.`);
    pbiContext = {
      id: parseInt(pbiIdArg, 10),
      title: 'Customer Onboarding & CME Profile Validation',
      state: 'Active',
      description: 'As a CME Operations Officer, I need to create and validate commercial corporate accounts so that onboarding compliance criteria are verified.',
      acceptanceCriteria: [
        'Corporate account number must follow ISO-13616 standard formatting.',
        'Primary contact email must belong to an authorized enterprise domain.',
        'Risk rating must default to "Medium" unless high-risk jurisdiction flags are triggered.',
        'Account status must transition from "Pending" to "Approved" upon validation.'
      ].join('\n\n'),
      linkedTestCases: [
        {
          id: 2001,
          title: 'Verify successful corporate account creation with standard risk profile',
          state: 'Design',
          description: 'Validates that submitting standard corporate credentials creates a persistent CME account.',
          steps: [
            { stepNumber: 1, action: 'Navigate to Customer Onboarding dashboard', expectedResult: 'Dashboard loads with Create Account button enabled' },
            { stepNumber: 2, action: 'Enter corporate entity details and business registration number', expectedResult: 'Entity details accepted without validation errors' },
            { stepNumber: 3, action: 'Submit the registration form', expectedResult: 'Success toast is displayed and Account ID is generated' }
          ],
          url: `https://dev.azure.com/enterprise-org/CoreBanking-CME/_workitems/edit/2001`
        }
      ],
      url: `https://dev.azure.com/enterprise-org/CoreBanking-CME/_workitems/edit/${pbiIdArg}`
    };
  }

  const jsonFilePath = path.resolve(outputDir, `pbi-${pbiIdArg}.json`);
  fs.writeFileSync(jsonFilePath, JSON.stringify(pbiContext, null, 2), 'utf-8');

  // Generate structured Markdown context for AI Agent
  const mdContent = [
    `# Azure DevOps PBI Context: #${pbiContext.id} - ${pbiContext.title}`,
    ``,
    `**State**: ${pbiContext.state}  `,
    `**URL**: ${pbiContext.url}  `,
    ``,
    `## User Story & Description`,
    pbiContext.description || '_No description provided._',
    ``,
    `## Acceptance Criteria`,
    pbiContext.acceptanceCriteria || '_No acceptance criteria defined._',
    ``,
    `## Linked Test Cases (${pbiContext.linkedTestCases.length})`,
    ...pbiContext.linkedTestCases.map((tc) => {
      return [
        `### Test Case #${tc.id}: ${tc.title}`,
        `**State**: ${tc.state} | [Open in Azure](${tc.url})`,
        tc.description ? `\n_${tc.description}_\n` : '',
        `#### Test Steps:`,
        tc.steps.length > 0
          ? tc.steps.map((s) => `${s.stepNumber}. **Action**: ${s.action}\n   *Expected*: ${s.expectedResult}`).join('\n')
          : '_No automated or manual steps defined._',
        ``
      ].join('\n');
    })
  ].join('\n');

  const mdFilePath = path.resolve(outputDir, `pbi-${pbiIdArg}.md`);
  fs.writeFileSync(mdFilePath, mdContent, 'utf-8');

  console.log(`[AZURE-AGENT] Successfully extracted context:`);
  console.log(`  - JSON: ${jsonFilePath}`);
  console.log(`  - Markdown: ${mdFilePath}`);
}

fetchFeatureContext().catch(console.error);
