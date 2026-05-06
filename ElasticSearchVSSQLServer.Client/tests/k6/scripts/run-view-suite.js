import { spawnSync } from "node:child_process";

const VIEW_SCENARIOS = [
  {
    label: "electronics browse",
    script: "tests/k6/scenarios/electronics-browse.js",
  },
  {
    label: "electronics search phone",
    script: "tests/k6/scenarios/electronics-search.js",
    env: { K6_ELECTRONICS_QUERY: "phone" },
  },
  {
    label: "H&M fashion browse",
    script: "tests/k6/scenarios/hm-fashion-browse.js",
  },
  {
    label: "H&M fashion search dress",
    script: "tests/k6/scenarios/hm-fashion-search.js",
    env: { K6_HM_QUERY: "dress" },
  },
  {
    label: "logs browse",
    script: "tests/k6/scenarios/logs-browse.js",
  },
  {
    label: "logs search error",
    script: "tests/k6/scenarios/logs-search.js",
    env: { K6_LOGS_QUERY: "error" },
  },
];

const requestedUserLevels = process.argv
  .slice(2)
  .filter((arg) => arg !== "--dry-run")
  .map((arg) => Number(arg))
  .filter((value) => Number.isFinite(value) && value > 0);
const userLevels = requestedUserLevels.length ? requestedUserLevels : [20, 50, 100];
const dryRun = process.argv.includes("--dry-run");
const k6Executable = process.platform === "win32" ? "k6.exe" : "k6";
const failures = [];

for (const users of userLevels) {
  for (const scenario of VIEW_SCENARIOS) {
    const args = [
      "run",
      scenario.script,
      "-e",
      `K6_PEAK_USERS=${users}`,
      ...Object.entries(scenario.env ?? {}).flatMap(([key, value]) => [
        "-e",
        `${key}=${value}`,
      ]),
    ];

    console.log(`\n== ${scenario.label} (${users} users) ==`);
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
        label: scenario.label,
        users,
        status: result.status,
        error: result.error?.message ?? null,
      });
    }
  }
}

if (failures.length) {
  console.error("\nThe view suite finished with k6 command failures:");
  for (const failure of failures) {
    const detail = failure.error
      ? `error=${failure.error}`
      : `exit=${failure.status}`;
    console.error(`- ${failure.label} (${failure.users} users): ${detail}`);
  }

  process.exit(1);
}

console.log("\nThe view suite finished all requested scenarios.");
