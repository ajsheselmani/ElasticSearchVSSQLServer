const scenarioReportModules = import.meta.glob(
  "../../../tests/k6/reports/scenario-*.json",
  {
    eager: true,
    import: "default",
  },
);

const DATASET_SORT_ORDER = {
  electronics: 0,
  "hm-fashion": 1,
  logs: 2,
  unknown: 99,
};

const VIEW_SORT_ORDER = {
  browse: 0,
  search: 1,
  comparison: 2,
  unknown: 99,
};

const SOURCE_SORT_ORDER = {
  sql: 0,
  elastic: 1,
  unknown: 99,
};

export const VIEW_BENCHMARK_SUITE_KEY = "view-benchmark-matrix";
export const CAPACITY_BENCHMARK_SUITE_KEY = "throughput-capacity";
export const VIEW_BENCHMARK_USER_LEVELS = [20, 50, 100];

export const COMPARISON_DEFINITIONS = [
  {
    id: "avg-latency",
    labelKey: "averageTimeResponse",
    labelDefault: "Average response",
    descriptionKey: "averageTimeServeRequest",
    descriptionDefault:
      "Average time needed to serve a successful request in this scenario.",
    sourceMetric: "http_req_duration",
    selector: (entry) => entry?.avg,
    unit: "ms",
    better: "lower",
  },
  {
    id: "p90-latency",
    labelKey: "p90ResponseTime",
    labelDefault: "P90 response time",
    descriptionKey: "p90ResponseTimeDescription",
    descriptionDefault:
      "90% of successful requests complete under this threshold.",
    sourceMetric: "http_req_duration",
    selector: (entry) => entry?.p90,
    unit: "ms",
    better: "lower",
  },
  {
    id: "p95-latency",
    labelKey: "p95ResponseTime",
    labelDefault: "P95 response time",
    descriptionKey: "p95ResponseTimeDescription",
    descriptionDefault:
      "Tail latency for the slowest 5% of successful requests.",
    sourceMetric: "http_req_duration",
    selector: (entry) => entry?.p95,
    unit: "ms",
    better: "lower",
  },
  {
    id: "failure-rate",
    labelKey: "failureRate",
    labelDefault: "Failure rate",
    descriptionKey: "failureRateDescription",
    descriptionDefault:
      "Lower is better because it means fewer failed requests.",
    sourceMetric: "http_req_failed",
    selector: (entry) => entry?.rate,
    unit: "rate",
    better: "lower",
  },
  {
    id: "successful-requests",
    labelKey: "testResults.successfulRequests",
    labelDefault: "Successful requests",
    descriptionKey: "testResults.successfulRequestsDescription",
    descriptionDefault:
      "Higher is better because it means more requests returned HTTP 200.",
    sourceMetric: "http_req_successful",
    selector: (entry) => entry?.count,
    unit: "count",
    better: "higher",
  },
  {
    id: "transport-errors",
    labelKey: "testResults.transportErrors",
    labelDefault: "Transport errors",
    descriptionKey: "testResults.transportErrorsDescription",
    descriptionDefault:
      "Lower is better because these requests timed out or failed before a valid HTTP response.",
    sourceMetric: "http_req_transport_errors",
    selector: (entry) => entry?.count,
    unit: "count",
    better: "lower",
  },
  {
    id: "throughput",
    labelKey: "testResults.throughput",
    labelDefault: "Paired request rate",
    descriptionKey: "testResults.throughputDescription",
    descriptionDefault:
      "In paired-batch mode this is expected to match because each iteration sends one SQL request and one Elasticsearch request.",
    sourceMetric: "http_reqs",
    selector: (entry) => entry?.rate,
    unit: "req/s",
    better: "equal",
  },
  {
    id: "vus-max",
    labelKey: "peakVirtualUsers",
    labelDefault: "Peak virtual users",
    descriptionKey: "peakVirtualUsersDescription",
    descriptionDefault:
      "Maximum concurrent virtual users configured for the run.",
    sourceMetric: "vus_max",
    selector: (entry) => entry?.value,
    unit: "users",
    better: "equal",
  },
];

function reportUserValue(report) {
  return Number(
    report?.metadata?.concurrentUsers ??
      report?.sql?.summary?.find?.((entry) => entry.metric === "vus_max")
        ?.value ??
      0,
  );
}

export function getScenarioDatasetKey(report) {
  const rawValue =
    `${report?.datasetLabel ?? ""} ${report?.id ?? ""}`.toLowerCase();

  if (rawValue.includes("hm-fashion") || rawValue.includes("h&m")) {
    return "hm-fashion";
  }
  if (rawValue.includes("electronics")) {
    return "electronics";
  }
  if (rawValue.includes("logs")) {
    return "logs";
  }

  return "unknown";
}

export function getScenarioViewKey(report) {
  const rawValue =
    `${report?.viewType ?? ""} ${report?.workloadLabel ?? ""} ${report?.id ?? ""}`.toLowerCase();

  if (rawValue.includes("browse")) return "browse";
  if (rawValue.includes("search")) return "search";
  if (rawValue.includes("comparison")) return "comparison";

  return "unknown";
}

function compareScenarioReports(a, b) {
  const datasetDiff =
    (DATASET_SORT_ORDER[getScenarioDatasetKey(a)] ??
      DATASET_SORT_ORDER.unknown) -
    (DATASET_SORT_ORDER[getScenarioDatasetKey(b)] ??
      DATASET_SORT_ORDER.unknown);

  if (datasetDiff !== 0) return datasetDiff;

  const viewDiff =
    (VIEW_SORT_ORDER[getScenarioViewKey(a)] ?? VIEW_SORT_ORDER.unknown) -
    (VIEW_SORT_ORDER[getScenarioViewKey(b)] ?? VIEW_SORT_ORDER.unknown);

  if (viewDiff !== 0) return viewDiff;

  const userDiff = Number(reportUserValue(a)) - Number(reportUserValue(b));
  if (userDiff !== 0) return userDiff;

  const queryDiff = `${a?.queryTerm ?? a?.queryLabel ?? ""}`.localeCompare(
    `${b?.queryTerm ?? b?.queryLabel ?? ""}`,
  );
  if (queryDiff !== 0) return queryDiff;

  return `${a?.title ?? a?.id ?? ""}`.localeCompare(
    `${b?.title ?? b?.id ?? ""}`,
  );
}

export const SCENARIO_REPORTS = Object.values(scenarioReportModules).sort(
  compareScenarioReports,
);

export function isScenarioReady(report) {
  return ["ready", "seeded"].includes(report?.status);
}

export function isScenarioSeeded(report) {
  return report?.status === "seeded";
}

export function getMetricEntry(summary, metric) {
  return (summary ?? []).find((entry) => entry.metric === metric) ?? null;
}

export function sanitizeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getWinner(sqlValue, elasticValue, better) {
  if (sqlValue == null || elasticValue == null || better === "equal") {
    return sqlValue === elasticValue ? "tie" : "neutral";
  }

  if (sqlValue === elasticValue) return "tie";
  if (better === "lower") return sqlValue < elasticValue ? "sql" : "elastic";

  return sqlValue > elasticValue ? "sql" : "elastic";
}

export function formatPerformanceValue(value, unit, t) {
  if (value == null) return t?.("testResults.notAvailable") ?? "N/A";

  if (unit === "ms") return `${value.toFixed(value >= 100 ? 1 : 2)} ms`;
  if (unit === "rate") return `${(value * 100).toFixed(2)}%`;
  if (unit === "req/s") return `${value.toFixed(2)} req/s`;
  if (unit === "count") return `${value.toFixed(0)}`;
  if (unit === "users") {
    return (
      t?.("testResults.usersUnit", { count: value.toFixed(0) }) ??
      `${value.toFixed(0)} users`
    );
  }

  return `${value.toFixed(2)} ${unit}`;
}

export function translateScenarioReport(report, t) {
  const key = `testResults.scenarios.${report.id}`;

  return {
    ...report,
    title: t(`${key}.title`, { defaultValue: report.title }),
    description: t(`${key}.description`, {
      defaultValue: report.description,
    }),
    queryLabel: t(`${key}.queryLabel`, { defaultValue: report.queryLabel }),
    metadata: {
      ...report.metadata,
      notes: t(`${key}.notes`, { defaultValue: report.metadata?.notes }),
    },
  };
}

export function getScenarioUsers(report) {
  const metadataValue = sanitizeNumber(report?.metadata?.concurrentUsers);
  if (metadataValue != null) return metadataValue;

  const sqlValue = sanitizeNumber(getMetricEntry(report?.sql?.summary, "vus_max")?.value);
  if (sqlValue != null) return sqlValue;

  return sanitizeNumber(getMetricEntry(report?.elastic?.summary, "vus_max")?.value);
}

export function getScenarioDatasetLabel(datasetKey, t) {
  if (datasetKey === "hm-fashion") {
    return t("testResults.hmFashionDataset", { defaultValue: "H&M Fashion" });
  }
  if (datasetKey === "electronics") {
    return t("testResults.electronicsDataset", { defaultValue: "Electronics" });
  }
  if (datasetKey === "logs") {
    return t("testResults.logsDataset", { defaultValue: "Logs" });
  }

  return t("testResults.unknownDataset", { defaultValue: "Dataset" });
}

export function getScenarioDataset(report, t) {
  return getScenarioDatasetLabel(getScenarioDatasetKey(report), t);
}

export function getScenarioView(report, t) {
  const viewKey = getScenarioViewKey(report);

  if (viewKey === "browse") {
    return t("testResults.browseView", { defaultValue: "Browse" });
  }
  if (viewKey === "search") {
    return t("testResults.searchView", { defaultValue: "Search" });
  }

  return t("testResults.comparisonView", { defaultValue: "Comparison" });
}

export function getScenarioWorkloadLabel(report, t) {
  const viewKey = getScenarioViewKey(report);

  if (viewKey === "browse") {
    return t("testResults.workloadOpenWithData", {
      defaultValue: "Open with data",
    });
  }

  if (viewKey === "search") {
    return t("testResults.workloadFilteredResults", {
      defaultValue: "Filtered results",
    });
  }

  return t("testResults.comparisonView", { defaultValue: "Comparison" });
}

export function getWinnerLabel(winner, t) {
  if (winner === "sql") return t("testResults.sqlServer");
  if (winner === "elastic") return t("testResults.elasticsearch");
  if (winner === "tie") return t("testResults.tie");

  return t("testResults.contextOnly", { defaultValue: "Context only" });
}

export function getToneByWinner(winner) {
  if (winner === "sql") return "info";
  if (winner === "elastic") return "success";

  return "default";
}

export function formatGeneratedAt(value, t) {
  if (!value) {
    return t("testResults.awaitingFreshRun", {
      defaultValue: "Awaiting fresh run",
    });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function buildComparisonRows(sqlData, elasticData, t) {
  return COMPARISON_DEFINITIONS.map((definition) => {
    const sqlEntry = getMetricEntry(sqlData, definition.sourceMetric);
    const elasticEntry = getMetricEntry(elasticData, definition.sourceMetric);

    const sqlValue = sanitizeNumber(definition.selector(sqlEntry));
    const elasticValue = sanitizeNumber(definition.selector(elasticEntry));
    const winner = getWinner(sqlValue, elasticValue, definition.better);
    const delta =
      sqlValue != null && elasticValue != null ? elasticValue - sqlValue : null;
    const deltaPercent =
      sqlValue != null && elasticValue != null && sqlValue !== 0
        ? (delta / sqlValue) * 100
        : null;

    return {
      ...definition,
      label: t(definition.labelKey, {
        defaultValue: definition.labelDefault,
      }),
      description: t(definition.descriptionKey, {
        defaultValue: definition.descriptionDefault,
      }),
      sqlValue,
      elasticValue,
      winner,
      delta,
      deltaPercent,
    };
  });
}

export function getWinnerCounts(rows) {
  return rows.reduce(
    (accumulator, row) => {
      if (row.winner === "sql") accumulator.sql += 1;
      if (row.winner === "elastic") accumulator.elastic += 1;
      if (row.winner === "tie") accumulator.tie += 1;

      return accumulator;
    },
    { sql: 0, elastic: 0, tie: 0, total: rows.length },
  );
}

export function getOverallWinner(rows) {
  const winnerCounts = getWinnerCounts(rows);

  if (winnerCounts.sql === 0 && winnerCounts.elastic === 0) return "neutral";
  if (winnerCounts.sql === winnerCounts.elastic) return "tie";

  return winnerCounts.sql > winnerCounts.elastic ? "sql" : "elastic";
}

export function buildTranslatedScenarioEntries(t) {
  return SCENARIO_REPORTS.map((report) => {
    const translatedReport = translateScenarioReport(report, t);

    return {
      report: translatedReport,
      rows: isScenarioReady(translatedReport)
        ? buildComparisonRows(
            translatedReport.sql?.summary,
            translatedReport.elastic?.summary,
            t,
          )
        : [],
    };
  });
}

export function buildScenarioMatrixRows(scenarioEntries, t) {
  return scenarioEntries.map(({ report, rows }) => {
    const avgLatency = rows.find((row) => row.id === "avg-latency");
    const p90Latency = rows.find((row) => row.id === "p90-latency");
    const p95Latency = rows.find((row) => row.id === "p95-latency");
    const failureRate = rows.find((row) => row.id === "failure-rate");
    const throughput = rows.find((row) => row.id === "throughput");

    return {
      id: report.id,
      report,
      title: report.title,
      datasetKey: getScenarioDatasetKey(report),
      dataset: getScenarioDataset(report, t),
      viewKey: getScenarioViewKey(report),
      view: getScenarioView(report, t),
      queryLabel: report.queryLabel,
      users: getScenarioUsers(report),
      generatedAt: report.metadata?.generatedAt,
      sqlAvgLatency: avgLatency?.sqlValue ?? null,
      elasticAvgLatency: avgLatency?.elasticValue ?? null,
      sqlP90Latency: p90Latency?.sqlValue ?? null,
      elasticP90Latency: p90Latency?.elasticValue ?? null,
      sqlP95Latency: p95Latency?.sqlValue ?? null,
      elasticP95Latency: p95Latency?.elasticValue ?? null,
      sqlFailureRate: failureRate?.sqlValue ?? null,
      elasticFailureRate: failureRate?.elasticValue ?? null,
      sqlThroughput: throughput?.sqlValue ?? null,
      elasticThroughput: throughput?.elasticValue ?? null,
      avgLatencyWinner: avgLatency?.winner ?? "neutral",
      avgLatencyDeltaPercent: avgLatency?.deltaPercent ?? null,
      winner: getOverallWinner(rows),
      winnerCounts: getWinnerCounts(rows),
      rows,
    };
  });
}

export function getDatasetScenarioMatrixRows(datasetKey, t) {
  const entries = buildTranslatedScenarioEntries(t).filter(
    ({ report }) =>
      getScenarioDatasetKey(report) === datasetKey &&
      isMatrixBenchmarkReport(report),
  );

  return buildScenarioMatrixRows(entries, t);
}

export function getBenchmarkSourceLabel(sourceKey, t) {
  if (sourceKey === "sql") {
    return t("testResults.sqlServer", { defaultValue: "SQL Server" });
  }

  if (sourceKey === "elastic") {
    return t("testResults.elasticsearch", {
      defaultValue: "Elasticsearch",
    });
  }

  return t("testResults.unknownSource", { defaultValue: "Unknown source" });
}

export function getBenchmarkViewPath(datasetKey, sourceKey) {
  if (datasetKey === "electronics") {
    return sourceKey === "sql"
      ? "/sql/electronicsData"
      : "/elastic/electronicsData";
  }

  if (datasetKey === "hm-fashion") {
    return sourceKey === "sql"
      ? "/sql/hmTransactionsData"
      : "/elastic/hmTransactionsData";
  }

  if (datasetKey === "logs") {
    return sourceKey === "sql" ? "/sql/logsData" : "/elastic/logsData";
  }

  return "/";
}

export function getBenchmarkViewLabel(datasetKey, sourceKey, t) {
  const sourceLabel = getBenchmarkSourceLabel(sourceKey, t);
  const datasetLabel = getScenarioDatasetLabel(datasetKey, t);

  return `${sourceLabel} / ${datasetLabel}`;
}

function isMatrixBenchmarkReport(report) {
  const users = getScenarioUsers(report);

  return (
    isScenarioReady(report) &&
    report?.metadata?.suiteKey === VIEW_BENCHMARK_SUITE_KEY &&
    VIEW_BENCHMARK_USER_LEVELS.includes(Number(users)) &&
    !isAuthenticationSetupFailureReport(report)
  );
}

function getReportMetricValue(report, sourceKey, metric, valueKey) {
  return sanitizeNumber(
    getMetricEntry(report?.[sourceKey]?.summary, metric)?.[valueKey],
  );
}

function isAuthenticationSetupFailureReport(report) {
  const authMode = report?.metadata?.authMode;

  if (authMode !== "none") return false;

  const sqlFailureRate = getReportMetricValue(
    report,
    "sql",
    "http_req_failed",
    "rate",
  );
  const elasticFailureRate = getReportMetricValue(
    report,
    "elastic",
    "http_req_failed",
    "rate",
  );
  const sqlSuccesses =
    getReportMetricValue(report, "sql", "http_req_successful", "count") ?? 0;
  const elasticSuccesses =
    getReportMetricValue(report, "elastic", "http_req_successful", "count") ??
    0;

  return (
    sqlFailureRate === 1 &&
    elasticFailureRate === 1 &&
    sqlSuccesses === 0 &&
    elasticSuccesses === 0
  );
}

function buildBenchmarkViewRow(report, sourceKey, t) {
  const summary = report?.[sourceKey]?.summary ?? [];
  const datasetKey = getScenarioDatasetKey(report);
  const duration = getMetricEntry(summary, "http_req_duration");
  const failures = getMetricEntry(summary, "http_req_failed");
  const requests = getMetricEntry(summary, "http_reqs");
  const successes = getMetricEntry(summary, "http_req_successful");
  const transportErrors = getMetricEntry(summary, "http_req_transport_errors");
  const iterations = getMetricEntry(summary, "iterations");
  const users = sanitizeNumber(getScenarioUsers(report));
  const failureRate = sanitizeNumber(failures?.rate);
  const avgLatency = sanitizeNumber(duration?.avg);
  const shouldHideDurationMetrics = failureRate === 1 && avgLatency === 0;

  return {
    id: `${report.id}-${sourceKey}`,
    reportId: report.id,
    title: report.title,
    status: report.status,
    datasetKey,
    dataset: getScenarioDatasetLabel(datasetKey, t),
    sourceKey,
    source: getBenchmarkSourceLabel(sourceKey, t),
    viewId: `${sourceKey}-${datasetKey}`,
    view: getBenchmarkViewLabel(datasetKey, sourceKey, t),
    viewPath: getBenchmarkViewPath(datasetKey, sourceKey),
    workloadKey: getScenarioViewKey(report),
    workload: getScenarioWorkloadLabel(report, t),
    queryLabel: report.queryLabel,
    users,
    generatedAt: report?.metadata?.generatedAt ?? null,
    avgLatency: shouldHideDurationMetrics ? null : avgLatency,
    p90Latency: shouldHideDurationMetrics ? null : sanitizeNumber(duration?.p90),
    p95Latency: shouldHideDurationMetrics ? null : sanitizeNumber(duration?.p95),
    maxLatency: shouldHideDurationMetrics ? null : sanitizeNumber(duration?.max),
    failureRate,
    throughput: sanitizeNumber(requests?.rate),
    requestCount: sanitizeNumber(requests?.count),
    successCount: sanitizeNumber(successes?.count),
    transportErrorCount: sanitizeNumber(transportErrors?.count),
    iterationCount: sanitizeNumber(iterations?.count),
  };
}

function compareBenchmarkViewRows(a, b) {
  const datasetDiff =
    (DATASET_SORT_ORDER[a.datasetKey] ?? DATASET_SORT_ORDER.unknown) -
    (DATASET_SORT_ORDER[b.datasetKey] ?? DATASET_SORT_ORDER.unknown);
  if (datasetDiff !== 0) return datasetDiff;

  const sourceDiff =
    (SOURCE_SORT_ORDER[a.sourceKey] ?? SOURCE_SORT_ORDER.unknown) -
    (SOURCE_SORT_ORDER[b.sourceKey] ?? SOURCE_SORT_ORDER.unknown);
  if (sourceDiff !== 0) return sourceDiff;

  const workloadDiff =
    (VIEW_SORT_ORDER[a.workloadKey] ?? VIEW_SORT_ORDER.unknown) -
    (VIEW_SORT_ORDER[b.workloadKey] ?? VIEW_SORT_ORDER.unknown);
  if (workloadDiff !== 0) return workloadDiff;

  const userDiff = Number(a.users ?? 0) - Number(b.users ?? 0);
  if (userDiff !== 0) return userDiff;

  return `${a.queryLabel ?? ""}`.localeCompare(`${b.queryLabel ?? ""}`);
}

function hasLatencyBenchmarkRow(row) {
  return row.avgLatency != null;
}

function isHealthyBenchmarkRow(row) {
  return (
    hasLatencyBenchmarkRow(row) &&
    Number(row.requestCount ?? 0) > 0 &&
    Number(row.failureRate ?? 1) === 0
  );
}

export function buildViewBenchmarkRows(t) {
  return SCENARIO_REPORTS.filter(isMatrixBenchmarkReport)
    .flatMap((report) => [
      buildBenchmarkViewRow(report, "sql", t),
      buildBenchmarkViewRow(report, "elastic", t),
    ])
    .sort(compareBenchmarkViewRows);
}

function isCapacityBenchmarkReport(report) {
  const users = getScenarioUsers(report);

  return (
    isScenarioReady(report) &&
    report?.metadata?.suiteKey === CAPACITY_BENCHMARK_SUITE_KEY &&
    VIEW_BENCHMARK_USER_LEVELS.includes(Number(users)) &&
    hasCapacityMeasurements(report) &&
    !isCapacityAuthenticationSetupFailureReport(report)
  );
}

function getCapacitySourceKey(report) {
  return report?.source?.key ?? report?.metadata?.source ?? "unknown";
}

function getCapacityMetricValue(report, metric, valueKey) {
  return sanitizeNumber(getMetricEntry(report?.source?.summary, metric)?.[valueKey]);
}

function hasCapacityMeasurements(report) {
  return (
    getCapacityMetricValue(report, "http_reqs", "count") != null ||
    getCapacityMetricValue(report, "http_req_failed", "rate") != null ||
    getCapacityMetricValue(report, "http_req_duration", "avg") != null
  );
}

function isCapacityAuthenticationSetupFailureReport(report) {
  if (report?.metadata?.authMode !== "none") return false;

  const failureRate = getCapacityMetricValue(report, "http_req_failed", "rate");
  const successes =
    getCapacityMetricValue(report, "http_req_successful", "count") ?? 0;

  return failureRate === 1 && successes === 0;
}

function buildCapacityBenchmarkRow(report, t) {
  const summary = report?.source?.summary ?? [];
  const datasetKey = getScenarioDatasetKey(report);
  const sourceKey = getCapacitySourceKey(report);
  const duration = getMetricEntry(summary, "http_req_duration");
  const failures = getMetricEntry(summary, "http_req_failed");
  const requests = getMetricEntry(summary, "http_reqs");
  const successes = getMetricEntry(summary, "http_req_successful");
  const transportErrors = getMetricEntry(summary, "http_req_transport_errors");
  const users = sanitizeNumber(getScenarioUsers(report));
  const failureRate = sanitizeNumber(failures?.rate);
  const avgLatency = sanitizeNumber(duration?.avg);
  const shouldHideDurationMetrics = failureRate === 1 && avgLatency === 0;

  return {
    id: report.id,
    reportId: report.id,
    title: report.title,
    status: report.status,
    datasetKey,
    dataset: getScenarioDatasetLabel(datasetKey, t),
    sourceKey,
    source: getBenchmarkSourceLabel(sourceKey, t),
    viewId: `capacity-${sourceKey}-${datasetKey}`,
    view: getBenchmarkViewLabel(datasetKey, sourceKey, t),
    viewPath: getBenchmarkViewPath(datasetKey, sourceKey),
    workloadKey: getScenarioViewKey(report),
    workload: getScenarioWorkloadLabel(report, t),
    queryLabel: report.queryLabel,
    users,
    generatedAt: report?.metadata?.generatedAt ?? null,
    avgLatency: shouldHideDurationMetrics ? null : avgLatency,
    p90Latency: shouldHideDurationMetrics ? null : sanitizeNumber(duration?.p90),
    p95Latency: shouldHideDurationMetrics ? null : sanitizeNumber(duration?.p95),
    maxLatency: shouldHideDurationMetrics ? null : sanitizeNumber(duration?.max),
    failureRate,
    throughput: sanitizeNumber(requests?.rate),
    requestCount: sanitizeNumber(requests?.count),
    successCount: sanitizeNumber(successes?.count),
    transportErrorCount: sanitizeNumber(transportErrors?.count),
  };
}

export function buildCapacityBenchmarkRows(t) {
  return SCENARIO_REPORTS.filter(isCapacityBenchmarkReport)
    .map((report) => buildCapacityBenchmarkRow(report, t))
    .sort(compareBenchmarkViewRows);
}

export function buildCapacityBenchmarkSummary(rows) {
  const readyRows = rows.filter((row) => row.status === "ready");
  const distinctUsers = [...new Set(readyRows.map((row) => row.users))]
    .filter((value) => value != null)
    .sort((a, b) => a - b);
  const fastestThroughputRow = readyRows.reduce((best, row) => {
    if (!best || Number(best.throughput ?? -1) < Number(row.throughput ?? -1)) {
      return row;
    }

    return best;
  }, null);
  const freshestRun = readyRows.reduce((best, row) => {
    const currentTime = new Date(row.generatedAt ?? 0).getTime();
    const bestTime = new Date(best?.generatedAt ?? 0).getTime();

    return currentTime > bestTime ? row : best;
  }, null);

  return {
    readyRows,
    totalRows: readyRows.length,
    totalViews: new Set(readyRows.map((row) => row.viewId)).size,
    distinctUsers,
    fastestThroughputRow,
    freshestRun,
  };
}

export function buildViewBenchmarkSummary(rows) {
  const readyRows = rows.filter((row) => row.status === "ready");
  const latencyRows = readyRows.filter(hasLatencyBenchmarkRow);
  const healthyRows = readyRows.filter(isHealthyBenchmarkRow);
  // Headline fastest/slowest cards should prioritize fully successful runs.
  const headlineRows = healthyRows.length ? healthyRows : latencyRows;
  const distinctUsers = [...new Set(readyRows.map((row) => row.users))]
    .filter((value) => value != null)
    .sort((a, b) => a - b);

  const freshestRun = readyRows.reduce((best, row) => {
    const currentTime = new Date(row.generatedAt ?? 0).getTime();
    const bestTime = new Date(best?.generatedAt ?? 0).getTime();

    return currentTime > bestTime ? row : best;
  }, null);

  const slowestRow = headlineRows.reduce((best, row) => {
    if (!best || (best.avgLatency ?? -1) < row.avgLatency) return row;
    return best;
  }, null);

  const fastestRow = headlineRows.reduce((best, row) => {
    if (!best || (best.avgLatency ?? Number.MAX_SAFE_INTEGER) > row.avgLatency) {
      return row;
    }

    return best;
  }, null);

  return {
    readyRows,
    totalRows: readyRows.length,
    totalViews: new Set(readyRows.map((row) => row.viewId)).size,
    distinctUsers,
    freshestRun,
    slowestRow,
    fastestRow,
    maxUsers: readyRows.reduce(
      (highest, row) => Math.max(highest, Number(row.users ?? 0)),
      0,
    ),
  };
}
