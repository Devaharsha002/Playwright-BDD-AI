import fs from 'node:fs';
import path from 'node:path';
import '../tests/support/loadEnv.js';

interface ScenarioMapping {
  featureFile: string;
  scenarioName: string;
  pbiIds: number[];
  tcIds: number[];
  tags: string[];
}

/**
 * Recursively retrieves all .feature files from the tests directory.
 */
function findFeatureFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFeatureFiles(filePath));
    } else if (file.endsWith('.feature')) {
      results.push(filePath);
    }
  }
  return results;
}

/**
 * Scans feature files to extract @PBI_ and @TC_ tags mapped to scenarios.
 */
export function scanFeatureFiles(testsDir: string): ScenarioMapping[] {
  const featureFiles = findFeatureFiles(testsDir);
  const mappings: ScenarioMapping[] = [];

  for (const file of featureFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    let currentTags: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('@')) {
        const tagsOnLine = line.split(/\s+/).filter((t) => t.startsWith('@'));
        currentTags = currentTags.concat(tagsOnLine);
      } else if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
        const scenarioName = line.replace(/^(Scenario|Scenario Outline):\s*/, '').trim();

        const pbiIds: number[] = [];
        const tcIds: number[] = [];

        for (const tag of currentTags) {
          const pbiMatch = tag.match(/@PBI_(\d+)/i);
          if (pbiMatch) pbiIds.push(parseInt(pbiMatch[1], 10));

          const tcMatch = tag.match(/@TC_(\d+)/i);
          if (tcMatch) tcIds.push(parseInt(tcMatch[1], 10));
        }

        mappings.push({
          featureFile: path.relative(process.cwd(), file).replace(/\\/g, '/'),
          scenarioName,
          pbiIds,
          tcIds,
          tags: [...currentTags],
        });

        currentTags = []; // Reset tags for next scenario
      } else if (line.startsWith('Feature:')) {
        // Retain feature-level tags for cascading scenarios if needed
      }
    }
  }

  return mappings;
}

/**
 * Generates an automated coverage audit report.
 * Usage: npm run azure:audit
 */
export async function runCoverageAudit(): Promise<void> {
  console.log(`\n===============================================================`);
  console.log(`        AZURE DEVOPS TEST AUTOMATION COVERAGE AUDIT            `);
  console.log(`===============================================================\n`);

  const testsDir = path.resolve(process.cwd(), 'src/tests');
  const mappings = scanFeatureFiles(testsDir);

  const uniquePbis = new Set<number>();
  const uniqueTcs = new Set<number>();

  for (const m of mappings) {
    m.pbiIds.forEach((id) => uniquePbis.add(id));
    m.tcIds.forEach((id) => uniqueTcs.add(id));
  }

  console.log(`Discovered Feature Files : ${findFeatureFiles(testsDir).length}`);
  console.log(`Total BDD Scenarios      : ${mappings.length}`);
  console.log(`Linked Azure PBIs        : ${uniquePbis.size} (${Array.from(uniquePbis).join(', ') || 'None'})`);
  console.log(`Linked Azure Test Cases  : ${uniqueTcs.size} (${Array.from(uniqueTcs).join(', ') || 'None'})`);
  console.log(`\nDetailed Automated Scenario Traceability:`);
  console.log(`---------------------------------------------------------------`);

  const tableData = mappings.map((m) => ({
    'Feature File': m.featureFile,
    'Scenario': m.scenarioName.length > 35 ? m.scenarioName.substring(0, 32) + '...' : m.scenarioName,
    'PBI ID': m.pbiIds.join(', ') || 'N/A',
    'Test Case ID': m.tcIds.join(', ') || 'N/A',
  }));

  console.table(tableData);

  // Write markdown report
  const reportDir = path.resolve(process.cwd(), 'test-results');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const markdownReport = [
    `# Azure DevOps BDD Test Automation Coverage Audit`,
    `Generated on: ${new Date().toISOString()}`,
    ``,
    `## Summary`,
    `- **Automated Scenarios**: ${mappings.length}`,
    `- **Automated PBIs**: ${uniquePbis.size}`,
    `- **Automated Test Cases**: ${uniqueTcs.size}`,
    `- **Coverage Traceability Ratio**: ${mappings.length > 0 ? Math.round((mappings.filter(m => m.tcIds.length > 0).length / mappings.length) * 100) : 0}% of scenarios trace directly to a Test Case ID.`,
    ``,
    `## Traceability Matrix`,
    `| Feature File | Scenario | PBI IDs | Test Case IDs | Tags |`,
    `| :--- | :--- | :--- | :--- | :--- |`,
    ...mappings.map(
      (m) => `| \`${m.featureFile}\` | ${m.scenarioName} | ${m.pbiIds.join(', ') || '—'} | ${m.tcIds.join(', ') || '—'} | \`${m.tags.join(' ')}\` |`
    ),
    ``,
  ].join('\n');

  const reportPath = path.resolve(reportDir, 'coverage-audit.md');
  fs.writeFileSync(reportPath, markdownReport, 'utf-8');
  console.log(`\nCoverage Audit Markdown written to: ${reportPath}\n`);
}

runCoverageAudit().catch(console.error);
