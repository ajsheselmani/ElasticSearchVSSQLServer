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
const metrics = createBenchmarkMetrics(`hm_fashion_browse_${peakUsers}vu`);
const scenarioId = `hm-fashion-browse-${peakUsers}vu`;
const reportPath = `tests/k6/reports/scenario-${scenarioId}.json`;

export const options = createBenchmarkOptions(metrics.names, {
  stages: buildRampStages(peakUsers),
  p95Threshold: 20000,
  failureRateThreshold: 0.05,
});

const sqlRequest = {
  scenarioId,
  name: `${scenarioId}_sql`,
  source: "sql",
  method: "GET",
  path: "/SQLData/GetAllHMTransactionsTrain?page=1&pageSize=10&filters=[]&logicType=and",
};

const elasticRequest = {
  scenarioId,
  name: `${scenarioId}_elastic`,
  source: "elastic",
  method: "PUT",
  path: "/ElasticData/HMFashionFlatSearch?page=0&pageSize=10",
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
  title: `H&M Fashion Browse (${peakUsers} users)`,
  description:
    "Baseline H&M browse view with no filters to compare flat-catalog retrieval performance.",
  datasetLabel: "H&M Fashion",
  workloadLabel: "Browse",
  viewType: "browse",
  queryTerm: null,
  queryLabel: "No filters",
  concurrentUsers: peakUsers,
  runCommand: `k6 run tests/k6/scenarios/hm-fashion-browse.js -e K6_PEAK_USERS=${peakUsers}`,
  notes:
    "Use K6_PEAK_USERS to regenerate this H&M browse scenario for a different concurrency level.",
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
