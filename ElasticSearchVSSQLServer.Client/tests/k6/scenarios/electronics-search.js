import { sleep } from "k6";

import {
  buildRampStages,
  buildScenarioOutput,
  createBenchmarkMetrics,
  createBenchmarkOptions,
  resolvePeakUsers,
  runComparisonRequest,
  slugifySegment,
  setupAuthContext,
} from "../helpers/benchmark.js";

const peakUsers = resolvePeakUsers();
const searchTerm = (__ENV.K6_ELECTRONICS_QUERY || "phone").trim();
const querySlug = slugifySegment(searchTerm) || "query";
const isDefaultScenario = peakUsers === 2 && searchTerm === "phone";
const metrics = createBenchmarkMetrics(
  `electronics_search_${querySlug}_${peakUsers}vu`,
);
const scenarioId = isDefaultScenario
  ? "electronics-search"
  : `electronics-search-${querySlug}-${peakUsers}vu`;
const reportPath = isDefaultScenario
  ? "tests/k6/reports/scenario-electronics-search.json"
  : `tests/k6/reports/scenario-${scenarioId}.json`;
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
  stages: buildRampStages(peakUsers),
  p95Threshold: 15000,
  failureRateThreshold: 0.05,
});

const sqlRequest = {
  scenarioId,
  name: `${scenarioId}_sql`,
  source: "sql",
  method: "GET",
  path: `/SQLData/GetAllElectronicEvents?page=1&pageSize=10&filters=${encodedSqlFilters}&logicType=and`,
};

const elasticRequest = {
  scenarioId,
  name: `${scenarioId}_elastic`,
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
  id: scenarioId,
  suiteKey: "view-benchmark-matrix",
  title: isDefaultScenario
    ? "Electronics Search"
    : `Electronics Search (${searchTerm}, ${peakUsers} users)`,
  description:
    "Global-search query against the electronics data set to compare filtered search latency.",
  datasetLabel: "Electronics",
  workloadLabel: "Search",
  viewType: "search",
  queryTerm: searchTerm,
  queryLabel: `Query: "${searchTerm}"`,
  concurrentUsers: peakUsers,
  runCommand: isDefaultScenario
    ? "k6 run tests/k6/scenarios/electronics-search.js -e K6_ELECTRONICS_QUERY=phone"
    : `k6 run tests/k6/scenarios/electronics-search.js -e K6_ELECTRONICS_QUERY=${searchTerm} -e K6_PEAK_USERS=${peakUsers}`,
  notes:
    "Set K6_ELECTRONICS_QUERY to swap the search term for your own product keyword and K6_PEAK_USERS to increase concurrency.",
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
