import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";

export const options = {
  stages: [
    { duration: "20s", target: 10 },
    { duration: "40s", target: 50 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = "https://localhost:5001";

export default function () {
  const filters = [];
  // const url =
  //   `${BASE_URL}/SQLData/GetAllElectronicEvents` +
  //   `?page=1&pageSize=10&filters=${encodeURIComponent(JSON.stringify(filters))}&logicType=and`;
  const url = `${BASE_URL}/sql/electronicsData`;

  const res = http.get(url, {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  const metrics = data.metrics;

  const rows = [
    {
      id: 1,
      metric: "http_req_duration",
      avg: metrics.http_req_duration?.values?.avg ?? null,
      min: metrics.http_req_duration?.values?.min ?? null,
      med: metrics.http_req_duration?.values?.med ?? null,
      max: metrics.http_req_duration?.values?.max ?? null,
      p90: metrics.http_req_duration?.values?.["p(90)"] ?? null,
      p95: metrics.http_req_duration?.values?.["p(95)"] ?? null,
      p99: metrics.http_req_duration?.values?.["p(99)"] ?? null,
      unit: "ms",
    },
    {
      id: 2,
      metric: "http_req_failed",
      rate: metrics.http_req_failed?.values?.rate ?? null,
      passes: metrics.http_req_failed?.thresholds
        ? JSON.stringify(metrics.http_req_failed.thresholds)
        : null,
      unit: "rate",
    },
    {
      id: 3,
      metric: "http_reqs",
      count: metrics.http_reqs?.values?.count ?? null,
      rate: metrics.http_reqs?.values?.rate ?? null,
      unit: "count/rate",
    },
    {
      id: 4,
      metric: "iterations",
      count: metrics.iterations?.values?.count ?? null,
      rate: metrics.iterations?.values?.rate ?? null,
      unit: "count/rate",
    },
    {
      id: 5,
      metric: "vus",
      value: metrics.vus?.values?.value ?? null,
      min: metrics.vus?.values?.min ?? null,
      max: metrics.vus?.values?.max ?? null,
      unit: "users",
    },
    {
      id: 6,
      metric: "vus_max",
      value: metrics.vus_max?.values?.value ?? null,
      min: metrics.vus_max?.values?.min ?? null,
      max: metrics.vus_max?.values?.max ?? null,
      unit: "users",
    },
  ];

  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "summaryExtra.json": JSON.stringify(rows, null, 2),
  };
}
