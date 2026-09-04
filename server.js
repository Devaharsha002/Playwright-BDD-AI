import path from 'node:path';
import fs from 'node:fs';
import express from 'express';

const app = express();
const port = parseInt(process.env.REPORT_PORT || '5000', 10);
const reportDir = path.resolve(process.cwd(), 'test-results/cucumber-html');

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Serve static report assets
app.use(express.static(reportDir));

// Route root to index.html
app.get('/', (_req, res) => {
  const indexFile = path.resolve(reportDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send(`
      <html>
        <head><title>Report Not Ready</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h2>Cucumber HTML Report is Not Generated Yet</h2>
          <p>Please run: <code>npm run test</code> or <code>node report.js</code> first.</p>
        </body>
      </html>
    `);
  }
});

app.listen(port, () => {
  console.log(`\n===============================================================`);
  console.log(`   CUCUMBER HTML REPORT SERVER RUNNING AT: http://localhost:${port}`);
  console.log(`===============================================================\n`);
});
