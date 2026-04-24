import { sleep } from "k6";

import {
  buildScenarioOutput,
  createBenchmarkMetrics,
  createBenchmarkOptions,
  runComparisonRequest,
  setupAuthContext,
} from "../helpers/benchmark.js";

const metrics = createBenchmarkMetrics("electronics_search");
const searchTerm = (__ENV.K6_ELECTRONICS_QUERY || "phone").trim();
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
  scenarioId: "electronics-search",
  name: "electronics_search_sql",
  source: "sql",
  method: "GET",
  path: `/SQLData/GetAllElectronicEvents?page=1&pageSize=10&filters=${encodedSqlFilters}&logicType=and`,
};

const elasticRequest = {
  scenarioId: "electronics-search",
  name: "electronics_search_elastic",
  source: "elastic",
  method: "PUT",
  path: "/ElasticData/ElectronicsDataSearch?page=0&pageSize=10",
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
  id: "electronics-search",
  title: "Electronics Search",
  description:
    "Global-search query against the electronics data set to compare filtered search latency.",
  queryLabel: `Query: "${searchTerm}"`,
  runCommand:
    "k6 run tests/k6/scenarios/electronics-search.js -e K6_ELECTRONICS_QUERY=phone",
  notes:
    "Set K6_ELECTRONICS_QUERY to swap the search term for your own product keyword.",
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
    reportPath: "tests/k6/reports/scenario-electronics-search.json",
    scenario,
    metricNames: metrics.names,
    sqlRequest,
    elasticRequest,
  });
}
