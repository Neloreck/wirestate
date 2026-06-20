const fs = require("node:fs");

module.exports = class GithubSummaryReporter {
  onRunComplete(_testContexts, results) {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;

    if (!summaryFile) {
      return;
    }

    const passed = results.numFailedTests === 0 && results.numFailedTestSuites === 0;
    const durationSeconds = ((Date.now() - results.startTime) / 1000).toFixed(1);

    const lines = [
      `## ${passed ? "✅" : "❌"} Jest — ${results.numPassedTests}/${results.numTotalTests} tests passed`,
      "",
      "| Suites | Tests | Passed | Failed | Skipped | Duration |",
      "| -----: | ----: | -----: | -----: | ------: | -------: |",
      `| ${results.numTotalTestSuites} | ${results.numTotalTests} | ${results.numPassedTests} | ` +
        `${results.numFailedTests} | ${results.numPendingTests} | ${durationSeconds}s |`,
    ];

    if (!passed) {
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
};
