import fs from 'node:fs';
import path from 'node:path';
import '../tests/support/loadEnv.js';
import { azureApi, TestCaseContext } from './azureApi.js';

/**
 * CLI tool to fetch context for a specific Azure DevOps Test Case.
 * Usage: npm run agent:testcase [testCaseId]
 */
async function fetchTestCaseContext(): Promise<void> {
  const tcIdArg = process.argv[2] || process.env.TARGET_TC_ID || '2001';
  console.log(`[AZURE-AGENT] Fetching context for Test Case #${tcIdArg}...`);

  const outputDir = path.resolve(process.cwd(), 'context');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let tcContext: TestCaseContext;

  try {
    const rawItem = await azureApi.getWorkItem(tcIdArg);
    tcContext = azureApi.formatTestCase(rawItem);
  } catch (error: any) {
    console.warn(`[AZURE-AGENT] Azure API offline or unavailable (${error.message}). Generating sample offline test case context.`);
    tcContext = {
      id: parseInt(tcIdArg, 10),
      title: 'Verify CME Corporate Account Creation',
      state: 'Ready',
      description: 'End-to-end verification of corporate onboarding flow via CME web portal.',
      steps: [
        {
          stepNumber: 1,
          action: 'Log in using StandardUser credentials and navigate to CME Account module',
          expectedResult: 'User lands on CME Account Management home view with Active status'
        },
        {
          stepNumber: 2,
          action: 'Click "+ New Corporate Customer" button and enter valid company registration details',
          expectedResult: 'Form validates company fields, tax ID, and address correctly'
        },
        {
          stepNumber: 3,
          action: 'Select Risk Level "Standard" and click Submit',
          expectedResult: 'System returns generated Account Reference ID with Pending Approval status'
        }
      ],
      url: `https://dev.azure.com/enterprise-org/CoreBanking-CME/_workitems/edit/${tcIdArg}`
    };
  }

  const jsonFilePath = path.resolve(outputDir, `tc-${tcIdArg}.json`);
  fs.writeFileSync(jsonFilePath, JSON.stringify(tcContext, null, 2), 'utf-8');

  const mdLines = [
    `# Azure DevOps Test Case Context: #${tcContext.id} - ${tcContext.title}`,
    ``,
    `**State**: ${tcContext.state}  `,
    `**URL**: ${tcContext.url}  `,
    ``,
    `## Description`,
    tcContext.description || '_No description provided._',
    ``,
    `## Execution Steps (${tcContext.steps.length})`,
    tcContext.steps.length > 0
      ? tcContext.steps.map((s) => `${s.stepNumber}. **Step**: ${s.action}\n   *Expected*: ${s.expectedResult}`).join('\n\n')
      : '_No execution steps defined._',
    ``
  ];

  const mdFilePath = path.resolve(outputDir, `tc-${tcIdArg}.md`);
  fs.writeFileSync(mdFilePath, mdLines.join('\n'), 'utf-8');

  console.log(`[AZURE-AGENT] Successfully saved test case context:`);
  console.log(`  - JSON: ${jsonFilePath}`);
  console.log(`  - Markdown: ${mdFilePath}`);
}

fetchTestCaseContext().catch(console.error);
