import { sleep } from "k6";

import {
  buildRampStages,
  buildScenarioOutput,
  createBenchmarkMetrics,
  createBenchmarkOptions,
  resolvePeakUsers,
  runComparisonRequest,
  setupAuthContext,
} from "../helpers/benchmark.js";

const peakUsers = resolvePeakUsers();
const isDefaultScenario = peakUsers === 2;
const metrics = createBenchmarkMetrics(`logs_browse_${peakUsers}vu`);
const scenarioId = isDefaultScenario ? "logs-browse" : `logs-browse-${peakUsers}vu`;
const reportPath = isDefaultScenario
  ? "tests/k6/reports/scenario-logs-browse.json"
  : `tests/k6/reports/scenario-${scenarioId}.json`;

export const options = createBenchmarkOptions(metrics.names, {
  stages: buildRampStages(peakUsers),
  p95Threshold: 15000,
  failureRateThreshold: 0.05,
});

const sqlRequest = {
  scenarioId,
  name: `${scenarioId}_sql`,
  source: "sql",
  method: "GET",
  path: "/Logs/GetAllLogsData?page=1&pageSize=10&filters=[]&logicType=and",
};

const elasticRequest = {
  scenarioId,
  name: `${scenarioId}_elastic`,
  source: "elastic",
  method: "PUT",
  path: "/ElasticData/LogsDataSearch?page=0&pageSize=10",
  body: {
    filter: [],
    sortOrders: [],
    aggregations: [],
    logicType: "and",
  },
};

const scenario = {
  id: scenarioId,
  suiteKey: "view-benchmark-matrix",
  title: isDefaultScenario ? "Logs Browse" : `Logs Browse (${peakUsers} users)`,
  description:
    "Baseline log retrieval with no filters to measure how quickly each log view can open with data.",
  datasetLabel: "Logs",
  workloadLabel: "Browse",
  viewType: "browse",
  queryTerm: null,
  queryLabel: "No filters",
  concurrentUsers: peakUsers,
  runCommand: isDefaultScenario
    ? "k6 run tests/k6/scenarios/logs-browse.js"
    : `k6 run tests/k6/scenarios/logs-browse.js -e K6_PEAK_USERS=${peakUsers}`,
  notes:
    "Measures the initial logs page load without any search or column filters. Set K6_PEAK_USERS to regenerate this browse case for a different concurrency level.",
};

export function setup() {
  return setupAuthContext();
}

export default function (context) {
  runComparisonRequest({
    context,
    metrics,
    sqlRequest,
    elasticRequest,
  });

  sleep(1);
}

export function handleSummary(data) {
  return buildScenarioOutput({
    data,
    reportPath,
    scenario,
    metricNames: metrics.names,
    sqlRequest,
    elasticRequest,
  });
}
