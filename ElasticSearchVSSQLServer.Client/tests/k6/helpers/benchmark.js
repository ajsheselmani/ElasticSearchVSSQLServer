import http from "k6/http";
import { check, fail } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

export const DEFAULT_BASE_URL =
  __ENV.K6_BASE_URL || "https://localhost:7236/api";

const BENCHMARK_SKIP_AUDIT_HEADER = "X-Benchmark-Skip-Audit";
const DEFAULT_BENCHMARK_EMAIL = "benchmark.k6@example.com";
const DEFAULT_BENCHMARK_PASSWORD = "Benchmark123!";
const DEFAULT_REQUEST_TIMEOUT = "60s";
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
  const rampUpDuration = (__ENV.K6_RAMP_UP || "15s").trim();
  const holdDuration = (__ENV.K6_HOLD || "30s").trim();
  const rampDownDuration = (__ENV.K6_RAMP_DOWN || "15s").trim();

  return [
    { duration: rampUpDuration, target: Math.max(1, Math.ceil(peakUsers / 2)) },
    { duration: holdDuration, target: peakUsers },
    { duration: rampDownDuration, target: 0 },
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
  const sqlFailedDurationMetric = `${prefix}_sql_failed_duration`;
  const elasticFailedDurationMetric = `${prefix}_elastic_failed_duration`;
  const sqlFailureMetric = `${prefix}_sql_failures`;
  const elasticFailureMetric = `${prefix}_elastic_failures`;
  const sqlRequestMetric = `${prefix}_sql_requests`;
  const elasticRequestMetric = `${prefix}_elastic_requests`;
  const sqlSuccessMetric = `${prefix}_sql_successes`;
  const elasticSuccessMetric = `${prefix}_elastic_successes`;
  const sqlTransportErrorMetric = `${prefix}_sql_transport_errors`;
  const elasticTransportErrorMetric = `${prefix}_elastic_transport_errors`;

  return {
    names: {
      sqlDurationMetric,
      elasticDurationMetric,
      sqlFailedDurationMetric,
      elasticFailedDurationMetric,
      sqlFailureMetric,
      elasticFailureMetric,
      sqlRequestMetric,
      elasticRequestMetric,
      sqlSuccessMetric,
      elasticSuccessMetric,
      sqlTransportErrorMetric,
      elasticTransportErrorMetric,
    },
    sqlDuration: new Trend(sqlDurationMetric, true),
    elasticDuration: new Trend(elasticDurationMetric, true),
    sqlFailedDuration: new Trend(sqlFailedDurationMetric, true),
    elasticFailedDuration: new Trend(elasticFailedDurationMetric, true),
    sqlFailures: new Rate(sqlFailureMetric),
    elasticFailures: new Rate(elasticFailureMetric),
    sqlRequests: new Counter(sqlRequestMetric),
    elasticRequests: new Counter(elasticRequestMetric),
    sqlSuccesses: new Counter(sqlSuccessMetric),
    elasticSuccesses: new Counter(elasticSuccessMetric),
    sqlTransportErrors: new Counter(sqlTransportErrorMetric),
    elasticTransportErrors: new Counter(elasticTransportErrorMetric),
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

  const { email, password, authMode } = resolveBenchmarkCredentials();

  if (!email || !password) {
    fail(
      "Protected benchmark endpoints require authentication. " +
        "Set K6_AUTH_TOKEN or K6_EMAIL/K6_PASSWORD, or keep K6_USE_DEFAULT_CREDENTIALS enabled.",
    );
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
  const accessToken = getAuthToken(authBody);

  if (authResponse.status !== 200 || !accessToken) {
    fail(
      `Authentication failed for k6 benchmark setup. Status: ${authResponse.status}. ` +
        `Use K6_AUTH_TOKEN or valid K6_EMAIL/K6_PASSWORD values. ` +
        `For the default benchmark account, run npm run test:perf:register-user first.`,
    );
  }

  return {
    baseUrl,
    headers: buildJsonHeaders(accessToken),
    authMode,
  };
}

export function runComparisonRequest({
  context,
  metrics,
  sqlRequest,
  elasticRequest,
}) {
  const responses = http.batch([
    buildBatchRequest(context, sqlRequest),
    buildBatchRequest(context, elasticRequest),
  ]);

  recordResponse({
    label: "sql",
    response: responses[0],
    metrics,
  });

  recordResponse({
    label: "elastic",
    response: responses[1],
    metrics,
  });
}

export function runSourceRequest({ context, metrics, request }) {
  const requestDefinition = buildBatchRequest(context, request);
  const response = http.request(
    requestDefinition.method,
    requestDefinition.url,
    requestDefinition.body ?? null,
    requestDefinition.params,
  );

  recordResponse({
    label: request.source,
    response,
    metrics,
  });
}

function buildBatchRequest(context, request) {
  const requestHeaders = {
    ...context.headers,
    ...(request.headers ?? {}),
  };

  const params = {
    headers: requestHeaders,
    timeout: request.timeout ?? getRequestTimeout(),
    tags: {
      name: request.name,
      source: request.source,
      scenario: request.scenarioId,
    },
  };

  const method = request.method?.toUpperCase();
  const url = `${context.baseUrl}${request.path}`;

  if (!["GET", "POST", "PUT"].includes(method)) {
    fail(`Unsupported request method: ${request.method}`);
  }

  const requestDefinition = {
    method,
    url,
    params,
  };

  if (method !== "GET") {
    requestDefinition.body = JSON.stringify(request.body ?? {});
  }

  return requestDefinition;
}

function recordResponse({ label, response, metrics }) {
  const isSql = label === "sql";
  const requestCounter = isSql ? metrics.sqlRequests : metrics.elasticRequests;
  const successCounter = isSql ? metrics.sqlSuccesses : metrics.elasticSuccesses;
  const failureMetric = isSql ? metrics.sqlFailures : metrics.elasticFailures;
  const durationMetric = isSql ? metrics.sqlDuration : metrics.elasticDuration;
  const failedDurationMetric = isSql
    ? metrics.sqlFailedDuration
    : metrics.elasticFailedDuration;
  const transportErrorCounter = isSql
    ? metrics.sqlTransportErrors
    : metrics.elasticTransportErrors;
  const succeeded = response && response.status === 200;
  const duration = getResponseDuration(response);

  requestCounter.add(1);
  if (succeeded) {
    successCounter.add(1);
    if (duration != null) {
      durationMetric.add(duration);
    }
  } else if (duration != null) {
    failedDurationMetric.add(duration);
  }

  if (hasTransportError(response)) {
    transportErrorCounter.add(1);
  }

  failureMetric.add(!succeeded);

  check(response, {
    [`${label} status 200`]: (res) => res && res.status === 200,
  });
}

function buildJsonHeaders(token) {
  const headers = {
    "Content-Type": "application/json",
    "X-Benchmark-Run": "k6",
  };

  if (shouldSkipAuditLogging()) {
    headers[BENCHMARK_SKIP_AUDIT_HEADER] = "true";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export function getAuthToken(authBody) {
  return (
    authBody?.token ??
    authBody?.Token ??
    authBody?.accessToken ??
    authBody?.AccessToken ??
    ""
  );
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
      authMode: getBenchmarkAuthMode(),
      concurrentUsers: scenario.concurrentUsers ?? null,
      suiteKey: scenario.suiteKey ?? null,
      requestTimeout: getRequestTimeout(),
      comparisonMode: "paired-batch",
      latencyMetric: "successful_responses_only",
      auditLoggingSkipRequested: shouldSkipAuditLogging(),
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

export function buildCapacityScenarioOutput({
  data,
  reportPath,
  scenario,
  metricNames,
  request,
}) {
  const source = request.source === "sql" ? "SQL" : "Elastic";
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
      authMode: getBenchmarkAuthMode(),
      concurrentUsers: scenario.concurrentUsers ?? null,
      suiteKey: scenario.suiteKey ?? null,
      source: request.source,
      requestTimeout: getRequestTimeout(),
      comparisonMode: "single-source-capacity",
      latencyMetric: "successful_responses_only",
      auditLoggingSkipRequested: shouldSkipAuditLogging(),
      notes: scenario.notes ?? "",
    },
    source: {
      key: request.source,
      label: request.source === "sql" ? "SQL Server" : "Elasticsearch",
      method: request.method,
      endpoint: request.path,
      summary: buildSummaryRows({
        data,
        source,
        prefix: request.source,
        metricNames,
      }),
    },
  };

  return {
    [reportPath]: JSON.stringify(report, null, 2),
    stdout: renderCapacityConsoleSummary(report),
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
  const successValues =
    data.metrics[
      prefix === "sql"
        ? metricNames.sqlSuccessMetric
        : metricNames.elasticSuccessMetric
    ]?.values ?? {};
  const failedDurationValues =
    data.metrics[
      prefix === "sql"
        ? metricNames.sqlFailedDurationMetric
        : metricNames.elasticFailedDurationMetric
    ]?.values ?? {};
  const transportErrorValues =
    data.metrics[
      prefix === "sql"
        ? metricNames.sqlTransportErrorMetric
        : metricNames.elasticTransportErrorMetric
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
      metric: "http_req_successful",
      avg: null,
      min: null,
      med: null,
      max: null,
      p90: null,
      p95: null,
      p99: null,
      count: successValues.count ?? null,
      rate: successValues.rate ?? null,
      value: null,
      unit: "count/rate",
    },
    {
      id: `${prefix}-5`,
      source,
      metric: "http_req_failed_duration",
      avg: failedDurationValues.avg ?? null,
      min: failedDurationValues.min ?? null,
      med: failedDurationValues.med ?? null,
      max: failedDurationValues.max ?? null,
      p90: failedDurationValues["p(90)"] ?? null,
      p95: failedDurationValues["p(95)"] ?? null,
      p99: failedDurationValues["p(99)"] ?? null,
      count: null,
      rate: null,
      value: null,
      unit: "ms",
    },
    {
      id: `${prefix}-6`,
      source,
      metric: "http_req_transport_errors",
      avg: null,
      min: null,
      med: null,
      max: null,
      p90: null,
      p95: null,
      p99: null,
      count: transportErrorValues.count ?? null,
      rate: transportErrorValues.rate ?? null,
      value: null,
      unit: "count/rate",
    },
    {
      id: `${prefix}-7`,
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
      id: `${prefix}-8`,
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

function getRequestTimeout() {
  const configuredTimeout = (__ENV.K6_REQUEST_TIMEOUT || "").trim();
  return configuredTimeout || DEFAULT_REQUEST_TIMEOUT;
}

function shouldSkipAuditLogging() {
  const configuredValue = (__ENV.K6_SKIP_AUDIT || "true").trim().toLowerCase();
  return configuredValue !== "false";
}

function shouldUseDefaultCredentials() {
  const configuredValue = (__ENV.K6_USE_DEFAULT_CREDENTIALS || "true")
    .trim()
    .toLowerCase();

  return configuredValue !== "false";
}

function resolveBenchmarkCredentials() {
  const configuredEmail = (__ENV.K6_EMAIL || "").trim();
  const configuredPassword = (__ENV.K6_PASSWORD || "").trim();

  if (configuredEmail || configuredPassword) {
    return {
      email: configuredEmail,
      password: configuredPassword,
      authMode: "credentials",
    };
  }

  if (!shouldUseDefaultCredentials()) {
    return {
      email: "",
      password: "",
      authMode: "none",
    };
  }

  return {
    email: (__ENV.K6_REGISTER_EMAIL || DEFAULT_BENCHMARK_EMAIL).trim(),
    password: (__ENV.K6_REGISTER_PASSWORD || DEFAULT_BENCHMARK_PASSWORD).trim(),
    authMode: "default-credentials",
  };
}

function getBenchmarkAuthMode() {
  if (__ENV.K6_AUTH_TOKEN && __ENV.K6_AUTH_TOKEN.trim()) {
    return "token";
  }

  if (__ENV.K6_EMAIL && __ENV.K6_PASSWORD) {
    return "credentials";
  }

  return shouldUseDefaultCredentials() ? "default-credentials" : "none";
}

function getResponseDuration(response) {
  const duration = response?.timings?.duration;

  return typeof duration === "number" && Number.isFinite(duration)
    ? duration
    : null;
}

function hasTransportError(response) {
  if (!response || response.status === 0) {
    return true;
  }

  const errorText = `${response.error ?? ""} ${response.error_code ?? ""}`.toLowerCase();
  return (
    errorText.includes("timeout") ||
    errorText.includes("context deadline exceeded") ||
    errorText.includes("connection refused")
  );
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
  const pairedRequestRate = getMetricEntry(report.sql.summary, "http_reqs");
  const sqlSuccesses = getMetricEntry(report.sql.summary, "http_req_successful");
  const elasticSuccesses = getMetricEntry(
    report.elastic.summary,
    "http_req_successful",
  );
  const sqlTransportErrors = getMetricEntry(
    report.sql.summary,
    "http_req_transport_errors",
  );
  const elasticTransportErrors = getMetricEntry(
    report.elastic.summary,
    "http_req_transport_errors",
  );

  return [
    "",
    `Benchmark: ${report.title}`,
    `Status: ${report.status}`,
    `Query: ${report.queryLabel}`,
    `Generated: ${report.metadata.generatedAt}`,
    `Mode: paired batch, successful-response latency, ${report.metadata.requestTimeout} timeout`,
    `Audit logging skip requested: ${report.metadata.auditLoggingSkipRequested ? "yes" : "no"}`,
    `SQL avg success latency: ${formatConsoleValue(sqlDuration?.avg, "ms")}`,
    `Elastic avg success latency: ${formatConsoleValue(elasticDuration?.avg, "ms")}`,
    `SQL failure rate: ${formatConsoleValue(sqlFailures?.rate, "rate")}`,
    `Elastic failure rate: ${formatConsoleValue(elasticFailures?.rate, "rate")}`,
    `SQL successes: ${formatConsoleValue(sqlSuccesses?.count, "count")}`,
    `Elastic successes: ${formatConsoleValue(elasticSuccesses?.count, "count")}`,
    `SQL transport errors: ${formatConsoleValue(sqlTransportErrors?.count, "count")}`,
    `Elastic transport errors: ${formatConsoleValue(
      elasticTransportErrors?.count,
      "count",
    )}`,
    `Paired request rate per source: ${formatConsoleValue(
      pairedRequestRate?.rate,
      "req/s",
    )}`,
    "",
  ].join("\n");
}

function renderCapacityConsoleSummary(report) {
  const duration = getMetricEntry(report.source.summary, "http_req_duration");
  const failures = getMetricEntry(report.source.summary, "http_req_failed");
  const requests = getMetricEntry(report.source.summary, "http_reqs");
  const successes = getMetricEntry(report.source.summary, "http_req_successful");
  const transportErrors = getMetricEntry(
    report.source.summary,
    "http_req_transport_errors",
  );

  return [
    "",
    `Capacity benchmark: ${report.title}`,
    `Status: ${report.status}`,
    `Source: ${report.source.label}`,
    `Query: ${report.queryLabel}`,
    `Generated: ${report.metadata.generatedAt}`,
    `Mode: single source, successful-response latency, ${report.metadata.requestTimeout} timeout`,
    `Audit logging skip requested: ${report.metadata.auditLoggingSkipRequested ? "yes" : "no"}`,
    `Avg success latency: ${formatConsoleValue(duration?.avg, "ms")}`,
    `Failure rate: ${formatConsoleValue(failures?.rate, "rate")}`,
    `Successful requests: ${formatConsoleValue(successes?.count, "count")}`,
    `Transport errors: ${formatConsoleValue(transportErrors?.count, "count")}`,
    `Capacity throughput: ${formatConsoleValue(requests?.rate, "req/s")}`,
    "",
  ].join("\n");
}

function formatConsoleValue(value, unit) {
  if (value == null) return "N/A";
  if (unit === "ms") return `${value.toFixed(2)} ms`;
  if (unit === "rate") return `${(value * 100).toFixed(2)}%`;
  if (unit === "req/s") return `${value.toFixed(2)} req/s`;
  if (unit === "count") return `${value.toFixed(0)}`;
  return `${value}`;
}

function getMetricEntry(summary, metric) {
  return (summary ?? []).find((entry) => entry.metric === metric) ?? null;
}
