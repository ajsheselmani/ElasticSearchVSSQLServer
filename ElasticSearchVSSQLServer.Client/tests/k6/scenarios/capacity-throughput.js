import { sleep } from "k6";

import {
  buildCapacityScenarioOutput,
  buildRampStages,
  createBenchmarkMetrics,
  createBenchmarkOptions,
  resolvePeakUsers,
  runSourceRequest,
  setupAuthContext,
  slugifySegment,
} from "../helpers/benchmark.js";

const CAPACITY_SUITE_KEY = "throughput-capacity";
const peakUsers = resolvePeakUsers(50);
const datasetKey = resolveDatasetKey();
const workloadKey = resolveWorkloadKey();
const sourceKey = resolveSourceKey();
const queryTerm = resolveQueryTerm(datasetKey, workloadKey);
const querySlug = workloadKey === "search" ? slugifySegment(queryTerm) : "";
const scenarioId = [
  "capacity",
  datasetKey,
  workloadKey,
  sourceKey,
  querySlug,
  `${peakUsers}vu`,
]
  .filter(Boolean)
  .join("-");
const reportPath = `tests/k6/reports/scenario-${scenarioId}.json`;
const capacityCase = buildCapacityCase({
  datasetKey,
  workloadKey,
  queryTerm,
  scenarioId,
});
const request = capacityCase[sourceKey];
const metrics = createBenchmarkMetrics(scenarioId.replace(/-/g, "_"));
const capacitySleepSeconds = resolveCapacitySleepSeconds();

export const options = createBenchmarkOptions(metrics.names, {
  stages: buildRampStages(peakUsers),
  p95Threshold: 30000,
  failureRateThreshold: 0.1,
});

const scenario = {
  id: scenarioId,
  suiteKey: CAPACITY_SUITE_KEY,
  title: `${capacityCase.datasetLabel} ${capacityCase.workloadLabel} Capacity (${request.label}, ${peakUsers} users)`,
  description:
    "Single-source k6 capacity run. SQL Server and Elasticsearch are tested separately so request rate reflects independent throughput instead of paired scenario pacing.",
  datasetLabel: capacityCase.datasetLabel,
  workloadLabel: capacityCase.workloadLabel,
  viewType: workloadKey,
  queryTerm: workloadKey === "search" ? queryTerm : null,
  queryLabel:
    workloadKey === "search" ? `Query: "${queryTerm}"` : "No filters",
  concurrentUsers: peakUsers,
  runCommand: [
    "k6 run tests/k6/scenarios/capacity-throughput.js",
    `-e K6_CAPACITY_DATASET=${datasetKey}`,
    `-e K6_CAPACITY_WORKLOAD=${workloadKey}`,
    `-e K6_CAPACITY_SOURCE=${sourceKey}`,
    `-e K6_PEAK_USERS=${peakUsers}`,
    workloadKey === "search" ? `-e K6_CAPACITY_QUERY=${queryTerm}` : "",
  ]
    .filter(Boolean)
    .join(" "),
  notes:
    "Use K6_CAPACITY_SOURCE=sql or elastic to load one backend at a time. Use K6_CAPACITY_QUERY for search workloads and K6_CAPACITY_SLEEP to add think time; the default capacity run has no sleep.",
};

export function setup() {
  return setupAuthContext();
}

export default function (context) {
  runSourceRequest({
    context,
    metrics,
    request,
  });

  if (capacitySleepSeconds > 0) {
    sleep(capacitySleepSeconds);
  }
}

export function handleSummary(data) {
  return buildCapacityScenarioOutput({
    data,
    reportPath,
    scenario,
    metricNames: metrics.names,
    request,
  });
}

function resolveDatasetKey() {
  const value = (__ENV.K6_CAPACITY_DATASET || "electronics").trim().toLowerCase();

  if (["electronics", "hm-fashion", "logs"].includes(value)) {
    return value;
  }

  throw new Error(
    `Unsupported K6_CAPACITY_DATASET "${value}". Use electronics, hm-fashion, or logs.`,
  );
}

function resolveWorkloadKey() {
  const value = (__ENV.K6_CAPACITY_WORKLOAD || "search").trim().toLowerCase();

  if (["browse", "search"].includes(value)) {
    return value;
  }

  throw new Error(`Unsupported K6_CAPACITY_WORKLOAD "${value}". Use browse or search.`);
}

function resolveSourceKey() {
  const value = (__ENV.K6_CAPACITY_SOURCE || "elastic").trim().toLowerCase();

  if (["sql", "elastic"].includes(value)) {
    return value;
  }

  throw new Error(`Unsupported K6_CAPACITY_SOURCE "${value}". Use sql or elastic.`);
}

function resolveQueryTerm(dataset, workload) {
  if (workload !== "search") return "";

  const configuredQuery = (__ENV.K6_CAPACITY_QUERY || "").trim();
  if (configuredQuery) return configuredQuery;

  if (dataset === "hm-fashion") return "dress";
  if (dataset === "logs") return "error";
  return "phone";
}

function resolveCapacitySleepSeconds() {
  const value = Number((__ENV.K6_CAPACITY_SLEEP || "0").trim());
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function buildCapacityCase({ datasetKey, workloadKey, queryTerm, scenarioId }) {
  if (datasetKey === "electronics") {
    return buildElectronicsCase({ workloadKey, queryTerm, scenarioId });
  }

  if (datasetKey === "hm-fashion") {
    return buildHmFashionCase({ workloadKey, queryTerm, scenarioId });
  }

  return buildLogsCase({ workloadKey, queryTerm, scenarioId });
}

function buildElectronicsCase({ workloadKey, queryTerm, scenarioId }) {
  const encodedFilters = encodeSqlFilters(queryTerm);
  const elasticFilter = buildElasticFilter(queryTerm);

  return {
    datasetLabel: "Electronics",
    workloadLabel: workloadKey === "browse" ? "Browse" : "Search",
    sql: {
      scenarioId,
      name: `${scenarioId}_sql`,
      source: "sql",
      label: "SQL Server",
      method: "GET",
      path:
        workloadKey === "browse"
          ? "/SQLData/GetAllElectronicEvents?page=1&pageSize=10&filters=[]&logicType=and"
          : `/SQLData/GetAllElectronicEvents?page=1&pageSize=10&filters=${encodedFilters}&logicType=and`,
    },
    elastic: {
      scenarioId,
      name: `${scenarioId}_elastic`,
      source: "elastic",
      label: "Elasticsearch",
      method: "PUT",
      path: "/ElasticData/ElectronicsDataSearch?page=0&pageSize=10",
      body: buildElasticSearchBody(workloadKey, elasticFilter),
    },
  };
}

function buildHmFashionCase({ workloadKey, queryTerm, scenarioId }) {
  const encodedFilters = encodeSqlFilters(queryTerm);
  const elasticFilter = buildElasticFilter(queryTerm);

  return {
    datasetLabel: "H&M Fashion",
    workloadLabel: workloadKey === "browse" ? "Browse" : "Search",
    sql: {
      scenarioId,
      name: `${scenarioId}_sql`,
      source: "sql",
      label: "SQL Server",
      method: "GET",
      path:
        workloadKey === "browse"
          ? "/SQLData/GetAllHMTransactionsTrain?page=1&pageSize=10&filters=[]&logicType=and"
          : `/SQLData/GetAllHMTransactionsTrain?page=1&pageSize=10&filters=${encodedFilters}&logicType=and`,
    },
    elastic: {
      scenarioId,
      name: `${scenarioId}_elastic`,
      source: "elastic",
      label: "Elasticsearch",
      method: "PUT",
      path: "/ElasticData/HMFashionFlatSearch?page=0&pageSize=10",
      body: buildElasticSearchBody(workloadKey, elasticFilter),
    },
  };
}

function buildLogsCase({ workloadKey, queryTerm, scenarioId }) {
  const encodedFilters = encodeSqlFilters(queryTerm);
  const elasticFilter = buildElasticFilter(queryTerm);

  return {
    datasetLabel: "Logs",
    workloadLabel: workloadKey === "browse" ? "Browse" : "Search",
    sql: {
      scenarioId,
      name: `${scenarioId}_sql`,
      source: "sql",
      label: "SQL Server",
      method: "GET",
      path:
        workloadKey === "browse"
          ? "/Logs/GetAllLogsData?page=1&pageSize=10&filters=[]&logicType=and"
          : `/Logs/GetAllLogsData?page=1&pageSize=10&filters=${encodedFilters}&logicType=and`,
    },
    elastic: {
      scenarioId,
      name: `${scenarioId}_elastic`,
      source: "elastic",
      label: "Elasticsearch",
      method: "PUT",
      path: "/ElasticData/LogsDataSearch?page=0&pageSize=10",
      body: buildElasticSearchBody(workloadKey, elasticFilter),
    },
  };
}

function encodeSqlFilters(queryTerm) {
  return encodeURIComponent(
    JSON.stringify([
      {
        propertyName: "globalSearch",
        operator: "like",
        value: queryTerm,
        caseSensitive: false,
      },
    ]),
  );
}

function buildElasticFilter(queryTerm) {
  return {
    propertyName: "globalSearch",
    operator: 2,
    value: queryTerm,
    caseSensitive: false,
  };
}

function buildElasticSearchBody(workloadKey, elasticFilter) {
  return {
    filter: workloadKey === "search" ? [elasticFilter] : [],
    sortOrders: [],
    aggregations: [],
    logicType: "and",
  };
}
