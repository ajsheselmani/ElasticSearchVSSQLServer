import http from "k6/http";
import { check, fail } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

export const DEFAULT_BASE_URL =
  __ENV.K6_BASE_URL || "https://localhost:7236/api";

const DEFAULT_STAGES = [
  { duration: "15s", target: 5 },
  { duration: "30s", target: 15 },
  { duration: "15s", target: 0 },
];

export function resolvePeakUsers(defaultValue = 2) {
  const parsedValue = Number((__ENV.K6_PEAK_USERS || `${defaultValue}`).trim());

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return defaultValue;
  }

  return Math.round(parsedValue);
}

export function buildRampStages(peakUsers) {
  return [
    { duration: "5s", target: Math.max(1, Math.ceil(peakUsers / 2)) },
    { duration: "10s", target: peakUsers },
    { duration: "5s", target: 0 },
  ];
}

export function slugifySegment(value) {
  return `${value ?? ""}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createBenchmarkMetrics(prefix) {
  const sqlDurationMetric = `${prefix}_sql_duration`;
  const elasticDurationMetric = `${prefix}_elastic_duration`;
  const sqlFailureMetric = `${prefix}_sql_failures`;
  const elasticFailureMetric = `${prefix}_elastic_failures`;
  const sqlRequestMetric = `${prefix}_sql_requests`;
  const elasticRequestMetric = `${prefix}_elastic_requests`;

  return {
    names: {
      sqlDurationMetric,
      elasticDurationMetric,
      sqlFailureMetric,
      elasticFailureMetric,
      sqlRequestMetric,
      elasticRequestMetric,
    },
    sqlDuration: new Trend(sqlDurationMetric, true),
    elasticDuration: new Trend(elasticDurationMetric, true),
    sqlFailures: new Rate(sqlFailureMetric),
    elasticFailures: new Rate(elasticFailureMetric),
    sqlRequests: new Counter(sqlRequestMetric),
    elasticRequests: new Counter(elasticRequestMetric),
  };
}

export function createBenchmarkOptions(metricNames, overrides = {}) {
  const {
    stages = DEFAULT_STAGES,
    p95Threshold = 1500,
    failureRateThreshold = 0.05,
    setupTimeout = "180s",
  } = overrides;

  const enforceThresholds = `${__ENV.K6_ENFORCE_THRESHOLDS || ""}`.trim() === "true";

  const options = {
    insecureSkipTLSVerify: true,
    stages,
    setupTimeout,
  };

  if (enforceThresholds) {
    options.thresholds = {
      [metricNames.sqlDurationMetric]: [`p(95)<${p95Threshold}`],
      [metricNames.elasticDurationMetric]: [`p(95)<${p95Threshold}`],
      [metricNames.sqlFailureMetric]: [`rate<${failureRateThreshold}`],
      [metricNames.elasticFailureMetric]: [`rate<${failureRateThreshold}`],
    };
  }

  return options;
}

export function setupAuthContext() {
  const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, "");
  const token = (__ENV.K6_AUTH_TOKEN || "").trim();

  if (token) {
    return {
      baseUrl,
      headers: buildJsonHeaders(token),
      authMode: "token",
    };
  }

  const email = (__ENV.K6_EMAIL || "").trim();
  const password = (__ENV.K6_PASSWORD || "").trim();

  if (!email || !password) {
    return {
      baseUrl,
      headers: buildJsonHeaders(),
      authMode: "none",
    };
  }

  const authResponse = http.post(
    `${baseUrl}/auth`,
    JSON.stringify({ email, password }),
    {
      headers: buildJsonHeaders(),
      tags: { name: "auth_login" },
    },
  );

  const authBody = safeJson(authResponse);
  const accessToken = authBody?.token;

  if (authResponse.status !== 200 || !accessToken) {
    fail(
      `Authentication failed for k6 benchmark setup. Status: ${authResponse.status}. ` +
        `Use K6_AUTH_TOKEN or valid K6_EMAIL/K6_PASSWORD values.`,
    );
  }

  return {
    baseUrl,
    headers: buildJsonHeaders(accessToken),
    authMode: "credentials",
  };
}

export function runComparisonRequest({
  context,
  metrics,
  sqlRequest,
  elasticRequest,
}) {
  const sqlResponse = issueRequest(context, sqlRequest);
  recordResponse({
    label: "sql",
    response: sqlResponse,
    metrics,
  });

  const elasticResponse = issueRequest(context, elasticRequest);
  recordResponse({
    label: "elastic",
    response: elasticResponse,
    metrics,
  });
}

function issueRequest(context, request) {
  const requestHeaders = {
    ...context.headers,
    ...(request.headers ?? {}),
  };

  const params = {
    headers: requestHeaders,
    timeout: request.timeout ?? "20s",
    tags: {
      name: request.name,
      source: request.source,
      scenario: request.scenarioId,
    },
  };

  const url = `${context.baseUrl}${request.path}`;

  switch (request.method) {
    case "GET":
      return http.get(url, params);
    case "POST":
      return http.post(url, JSON.stringify(request.body ?? {}), params);
    case "PUT":
      return http.put(url, JSON.stringify(request.body ?? {}), params);
    default:
      fail(`Unsupported request method: ${request.method}`);
      return null;
  }
}

function recordResponse({ label, response, metrics }) {
  const isSql = label === "sql";
  const requestCounter = isSql ? metrics.sqlRequests : metrics.elasticRequests;
  const failureMetric = isSql ? metrics.sqlFailures : metrics.elasticFailures;
  const durationMetric = isSql ? metrics.sqlDuration : metrics.elasticDuration;
  const succeeded = response && response.status === 200;

  requestCounter.add(1);
  durationMetric.add(response?.timings?.duration ?? 20000);
  failureMetric.add(!succeeded);

  check(response, {
    [`${label} status 200`]: (res) => res.status === 200,
  });
}

function buildJsonHeaders(token) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export function buildScenarioOutput({
  data,
  reportPath,
  scenario,
  metricNames,
  sqlRequest,
  elasticRequest,
}) {
  const report = {
    id: scenario.id,
    title: scenario.title,
    description: scenario.description,
    status: "ready",
    datasetLabel: scenario.datasetLabel ?? null,
    workloadLabel: scenario.workloadLabel ?? null,
    viewType: scenario.viewType ?? null,
    queryTerm: scenario.queryTerm ?? null,
    queryLabel: scenario.queryLabel,
    reportSource: reportPath,
    metadata: {
      generatedAt: new Date().toISOString(),
      runCommand: scenario.runCommand,
      authMode:
        __ENV.K6_AUTH_TOKEN && __ENV.K6_AUTH_TOKEN.trim()
          ? "token"
          : __ENV.K6_EMAIL && __ENV.K6_PASSWORD
            ? "credentials"
            : "none",
      concurrentUsers: scenario.concurrentUsers ?? null,
      suiteKey: scenario.suiteKey ?? null,
      notes: scenario.notes ?? "",
    },
    sql: {
      label: "SQL Server",
      method: sqlRequest.method,
      endpoint: sqlRequest.path,
      summary: buildSummaryRows({
        data,
        source: "SQL",
        prefix: "sql",
        metricNames,
      }),
    },
    elastic: {
      label: "Elasticsearch",
      method: elasticRequest.method,
      endpoint: elasticRequest.path,
      summary: buildSummaryRows({
        data,
        source: "Elastic",
        prefix: "elastic",
        metricNames,
      }),
    },
  };

  return {
    [reportPath]: JSON.stringify(report, null, 2),
    stdout: renderConsoleSummary(report),
  };
}

function buildSummaryRows({ data, source, prefix, metricNames }) {
  const durationValues =
    data.metrics[
      prefix === "sql"
        ? metricNames.sqlDurationMetric
        : metricNames.elasticDurationMetric
    ]?.values ?? {};
  const failureValues =
    data.metrics[
      prefix === "sql"
        ? metricNames.sqlFailureMetric
        : metricNames.elasticFailureMetric
    ]?.values ?? {};
  const requestValues =
    data.metrics[
      prefix === "sql"
        ? metricNames.sqlRequestMetric
        : metricNames.elasticRequestMetric
    ]?.values ?? {};
  const iterationValues = data.metrics.iterations?.values ?? {};
  const vusMaxValues = data.metrics.vus_max?.values ?? {};

  return [
    {
      id: `${prefix}-1`,
      source,
      metric: "http_req_duration",
      avg: durationValues.avg ?? null,
      min: durationValues.min ?? null,
      med: durationValues.med ?? null,
      max: durationValues.max ?? null,
      p90: durationValues["p(90)"] ?? null,
      p95: durationValues["p(95)"] ?? null,
      p99: durationValues["p(99)"] ?? null,
      count: null,
      rate: null,
      value: null,
      unit: "ms",
    },
    {
      id: `${prefix}-2`,
      source,
      metric: "http_req_failed",
      avg: null,
      min: null,
      med: null,
      max: null,
      p90: null,
      p95: null,
      p99: null,
      count: null,
      rate: failureValues.rate ?? null,
      value: null,
      unit: "rate",
    },
    {
      id: `${prefix}-3`,
      source,
      metric: "http_reqs",
      avg: null,
      min: null,
      med: null,
      max: null,
      p90: null,
      p95: null,
      p99: null,
      count: requestValues.count ?? null,
      rate: requestValues.rate ?? null,
      value: null,
      unit: "count/rate",
    },
    {
      id: `${prefix}-4`,
      source,
      metric: "iterations",
      avg: null,
      min: null,
      med: null,
      max: null,
      p90: null,
      p95: null,
      p99: null,
      count: iterationValues.count ?? null,
      rate: iterationValues.rate ?? null,
      value: null,
      unit: "count/rate",
    },
    {
      id: `${prefix}-5`,
      source,
      metric: "vus_max",
      avg: null,
      min: null,
      med: null,
      max: null,
      p90: null,
      p95: null,
      p99: null,
      count: null,
      rate: null,
      value: vusMaxValues.value ?? null,
      unit: "users",
    },
  ];
}

function safeJson(response) {
  if (!response?.body) return null;

  try {
    return JSON.parse(response.body);
  } catch (error) {
    return null;
  }
}

function renderConsoleSummary(report) {
  const sqlDuration = getMetricEntry(report.sql.summary, "http_req_duration");
  const elasticDuration = getMetricEntry(
    report.elastic.summary,
    "http_req_duration",
  );
  const sqlFailures = getMetricEntry(report.sql.summary, "http_req_failed");
  const elasticFailures = getMetricEntry(
    report.elastic.summary,
    "http_req_failed",
  );
  const sqlThroughput = getMetricEntry(report.sql.summary, "http_reqs");
  const elasticThroughput = getMetricEntry(report.elastic.summary, "http_reqs");

  return [
    "",
    `Benchmark: ${report.title}`,
    `Status: ${report.status}`,
    `Query: ${report.queryLabel}`,
    `Generated: ${report.metadata.generatedAt}`,
    `SQL avg latency: ${formatConsoleValue(sqlDuration?.avg, "ms")}`,
    `Elastic avg latency: ${formatConsoleValue(elasticDuration?.avg, "ms")}`,
    `SQL failure rate: ${formatConsoleValue(sqlFailures?.rate, "rate")}`,
    `Elastic failure rate: ${formatConsoleValue(elasticFailures?.rate, "rate")}`,
    `SQL throughput: ${formatConsoleValue(sqlThroughput?.rate, "req/s")}`,
    `Elastic throughput: ${formatConsoleValue(
      elasticThroughput?.rate,
      "req/s",
    )}`,
    "",
  ].join("\n");
}

function formatConsoleValue(value, unit) {
  if (value == null) return "N/A";
  if (unit === "ms") return `${value.toFixed(2)} ms`;
  if (unit === "rate") return `${(value * 100).toFixed(2)}%`;
  if (unit === "req/s") return `${value.toFixed(2)} req/s`;
  return `${value}`;
}

function getMetricEntry(summary, metric) {
  return (summary ?? []).find((entry) => entry.metric === metric) ?? null;
}
