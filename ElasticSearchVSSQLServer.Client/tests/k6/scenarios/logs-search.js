import { sleep } from "k6";

import {
  buildScenarioOutput,
  createBenchmarkMetrics,
  createBenchmarkOptions,
  runComparisonRequest,
  setupAuthContext,
} from "../helpers/benchmark.js";

const metrics = createBenchmarkMetrics("logs_search");
const searchTerm = (__ENV.K6_LOGS_QUERY || "error").trim();
const encodedSqlFilters = encodeURIComponent(
  JSON.stringify([
    {
      propertyName: "globalSearch",
      operator: "like",
      value: searchTerm,
      caseSensitive: false,
    },
  ]),
);

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
  scenarioId: "logs-search",
  name: "logs_search_sql",
  source: "sql",
  method: "GET",
  path: `/Logs/GetAllLogsData?page=1&pageSize=10&filters=${encodedSqlFilters}&logicType=and`,
};

const elasticRequest = {
  scenarioId: "logs-search",
  name: "logs_search_elastic",
  source: "elastic",
  method: "PUT",
  path: "/ElasticData/LogsDataSearch?page=0&pageSize=10",
  body: {
    filter: [
      {
        propertyName: "globalSearch",
        operator: 2,
        value: searchTerm,
        caseSensitive: false,
      },
    ],
    sortOrders: [],
    aggregations: [],
    logicType: "and",
  },
};

const scenario = {
  id: "logs-search",
  title: "Logs Search",
  description:
    "Search-heavy log retrieval to compare how both stores behave on operational log queries.",
  queryLabel: `Query: "${searchTerm}"`,
  runCommand:
    "k6 run tests/k6/scenarios/logs-search.js -e K6_LOGS_QUERY=error",
  notes:
    "Set K6_LOGS_QUERY to target your own log keyword, IP fragment, or event text.",
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
    reportPath: "tests/k6/reports/scenario-logs-search.json",
    scenario,
    metricNames: metrics.names,
    sqlRequest,
    elasticRequest,
  });
}
