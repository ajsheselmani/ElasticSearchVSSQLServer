import { spawnSync } from "node:child_process";

const CAPACITY_CASES = [
  { dataset: "electronics", workload: "browse" },
  { dataset: "electronics", workload: "search", query: "phone" },
  { dataset: "hm-fashion", workload: "browse" },
  { dataset: "hm-fashion", workload: "search", query: "dress" },
  { dataset: "logs", workload: "browse" },
  { dataset: "logs", workload: "search", query: "error" },
];
const SOURCES = ["sql", "elastic"];

const requestedUserLevels = process.argv
  .slice(2)
  .filter((arg) => arg !== "--dry-run")
  .map((arg) => Number(arg))
  .filter((value) => Number.isFinite(value) && value > 0);
const userLevels = requestedUserLevels.length ? requestedUserLevels : [50];
const dryRun = process.argv.includes("--dry-run");
const k6Executable = process.platform === "win32" ? "k6.exe" : "k6";
const failures = [];

for (const users of userLevels) {
  for (const capacityCase of CAPACITY_CASES) {
    for (const source of SOURCES) {
      const args = [
        "run",
        "tests/k6/scenarios/capacity-throughput.js",
        "-e",
        `K6_PEAK_USERS=${users}`,
        "-e",
        `K6_CAPACITY_DATASET=${capacityCase.dataset}`,
        "-e",
        `K6_CAPACITY_WORKLOAD=${capacityCase.workload}`,
        "-e",
        `K6_CAPACITY_SOURCE=${source}`,
      ];

      if (capacityCase.query) {
        args.push("-e", `K6_CAPACITY_QUERY=${capacityCase.query}`);
      }

      console.log(
        `\n== ${capacityCase.dataset} ${capacityCase.workload} ${source} (${users} users) ==`,
      );
      console.log(`${k6Executable} ${args.join(" ")}`);

      if (dryRun) {
        continue;
      }

      const result = spawnSync(k6Executable, args, {
        cwd: process.cwd(),
        env: process.env,
        stdio: "inherit",
        shell: false,
      });

      if (result.error || result.status !== 0) {
        failures.push({
          dataset: capacityCase.dataset,
          workload: capacityCase.workload,
          source,
          users,
          status: result.status,
          error: result.error?.message ?? null,
        });
      }
    }
  }
}

if (failures.length) {
  console.error("\nThe capacity suite finished with k6 command failures:");
  for (const failure of failures) {
    const detail = failure.error
      ? `error=${failure.error}`
      : `exit=${failure.status}`;
    console.error(
      `- ${failure.dataset} ${failure.workload} ${failure.source} (${failure.users} users): ${detail}`,
    );
  }

  process.exit(1);
}

console.log("\nThe capacity suite finished all requested scenarios.");
