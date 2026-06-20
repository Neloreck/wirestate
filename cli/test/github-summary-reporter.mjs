import * as fs from "node:fs";

// Writes a test-results summary to the GitHub Actions job summary ($GITHUB_STEP_SUMMARY), matching the
// format the Vitest run produces for the extension. A no-op outside CI, where the env var is unset.
export default class GithubSummaryReporter {
  onRunComplete(_testContexts, results) {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;

    if (!summaryFile) {
      return;
    }

    const summaryLine = (label, passed, failed, total) =>
      failed > 0
        ? `- **${label}**: ❌ **${failed} failed** · ${passed} passes · ${total} total`
        : `- **${label}**: ✅ **${passed} passes** · ${total} total`;

    const lines = [
      "## Jest Test Report",
      "",
      "### Summary",
      "",
      summaryLine("Test Files", results.numPassedTestSuites, results.numFailedTestSuites, results.numTotalTestSuites),
      summaryLine("Test Results", results.numPassedTests, results.numFailedTests, results.numTotalTests),
    ];

    if (results.numFailedTests > 0 || results.numFailedTestSuites > 0) {
      lines.push("", "### Failed tests", "");

      for (const suite of results.testResults) {
        for (const assertion of suite.testResults) {
          if (assertion.status === "failed") {
            lines.push(`- \`${assertion.fullName}\``);
          }
        }
      }
    }

    fs.appendFileSync(summaryFile, `${lines.join("\n")}\n`);
  }
}
