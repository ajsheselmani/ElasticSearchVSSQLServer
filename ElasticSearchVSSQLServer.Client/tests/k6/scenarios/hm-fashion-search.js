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
const searchTerm = (__ENV.K6_HM_QUERY || "dress").trim();
const querySlug = slugifySegment(searchTerm) || "query";
const metrics = createBenchmarkMetrics(
  `hm_fashion_search_${querySlug}_${peakUsers}vu`,
);
const scenarioId = `hm-fashion-search-${querySlug}-${peakUsers}vu`;
const reportPath = `tests/k6/reports/scenario-${scenarioId}.json`;
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
  p95Threshold: 20000,
  failureRateThreshold: 0.05,
});

const sqlRequest = {
  scenarioId,
  name: `${scenarioId}_sql`,
  source: "sql",
  method: "GET",
  path: `/SQLData/GetAllHMTransactionsTrain?page=1&pageSize=10&filters=${encodedSqlFilters}&logicType=and`,
};

const elasticRequest = {
  scenarioId,
  name: `${scenarioId}_elastic`,
  source: "elastic",
  method: "PUT",
  path: "/ElasticData/HMFashionFlatSearch?page=0&pageSize=10",
  body: {
    filter: [
      {
        propertyName: "globalSearch",
        operator: "Like",
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
  title: `H&M Fashion Search (${searchTerm}, ${peakUsers} users)`,
  description:
    "Global-search workload for the flattened H&M dataset to compare SQL Server and Elasticsearch search behaviour.",
  datasetLabel: "H&M Fashion",
  workloadLabel: "Search",
  viewType: "search",
  queryTerm: searchTerm,
  queryLabel: `Query: "${searchTerm}"`,
  concurrentUsers: peakUsers,
  runCommand:
    `k6 run tests/k6/scenarios/hm-fashion-search.js ` +
    `-e K6_HM_QUERY=${searchTerm} -e K6_PEAK_USERS=${peakUsers}`,
  notes:
    "Use K6_HM_QUERY and K6_PEAK_USERS to regenerate this H&M search scenario with your own search word and concurrency level.",
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
