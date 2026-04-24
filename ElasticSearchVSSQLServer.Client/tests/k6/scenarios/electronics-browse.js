import { sleep } from "k6";

import {
  buildScenarioOutput,
  createBenchmarkMetrics,
  createBenchmarkOptions,
  runComparisonRequest,
  setupAuthContext,
} from "../helpers/benchmark.js";

const metrics = createBenchmarkMetrics("electronics_browse");

export const options = createBenchmarkOptions(metrics.names, {
  stages: [
    { duration: "5s", target: 1 },
    { duration: "10s", target: 2 },
    { duration: "5s", target: 0 },
  ],
  p95Threshold: 15000,
  failureRateThreshold: 0.05,
});

const sqlRequest = {
  scenarioId: "electronics-browse",
  name: "electronics_browse_sql",
  source: "sql",
  method: "GET",
  path: "/SQLData/GetAllElectronicEvents?page=1&pageSize=10&filters=[]&logicType=and",
};

const elasticRequest = {
  scenarioId: "electronics-browse",
  name: "electronics_browse_elastic",
  source: "elastic",
  method: "PUT",
  path: "/ElasticData/ElectronicsDataSearch?page=0&pageSize=10",
  body: {
    filter: [],
    sortOrders: [],
    aggregations: [],
    logicType: "and",
  },
};

const scenario = {
  id: "electronics-browse",
  title: "Electronics Browse",
  description:
    "Baseline catalog retrieval with no filters to compare raw browse performance.",
  queryLabel: "No filters",
  runCommand: "k6 run tests/k6/scenarios/electronics-browse.js",
  notes:
    "Uses the same electronics list endpoints already wired into the application UI.",
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
    reportPath: "tests/k6/reports/scenario-electronics-browse.json",
    scenario,
    metricNames: metrics.names,
    sqlRequest,
    elasticRequest,
  });
}
