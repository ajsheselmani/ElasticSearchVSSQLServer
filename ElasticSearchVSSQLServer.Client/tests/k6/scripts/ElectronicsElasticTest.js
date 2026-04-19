import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, defaultOptions } from "../config.js";

// export const options = {
//   stages: [
//     { duration: "15s", target: 10 },
//     { duration: "30s", target: 30 },
//     { duration: "15s", target: 0 },
//   ],
//   thresholds: {
//     http_req_duration: ["p(95)<1500"],
//     http_req_failed: ["rate<0.05"],
//   },
// };
export const options = {
  ...defaultOptions,
  // stages: [
  //   { duration: "30s", target: 20 },
  //   { duration: "2m", target: 20 },
  //   { duration: "20s", target: 0 },
  // ],
  stages: [
    { duration: "30s", target: 20 },
    { duration: "30s", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "30s", target: 200 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1500"],
    http_req_failed: ["rate<0.05"],
  },
};

// const BASE_URL = 'https://localhost:5001';

export default function () {
  const filters = [];
  const url = `${BASE_URL}/elastic/electronicsData`;

  const res = http.get(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  check(res, {
    "elastic status 200": (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  const m = data.metrics;

  const rows = [
    {
      id: "elastic-1",
      source: "Elastic",
      metric: "http_req_duration",
      avg: m.http_req_duration?.values?.avg ?? null,
      min: m.http_req_duration?.values?.min ?? null,
      med: m.http_req_duration?.values?.med ?? null,
      max: m.http_req_duration?.values?.max ?? null,
      p90: m.http_req_duration?.values?.["p(90)"] ?? null,
      p95: m.http_req_duration?.values?.["p(95)"] ?? null,
      p99: m.http_req_duration?.values?.["p(99)"] ?? null,
      count: null,
      rate: null,
      value: null,
      unit: "ms",
    },
    {
      id: "elastic-2",
      source: "Elastic",
      metric: "http_req_failed",
      avg: null,
      min: null,
      med: null,
      max: null,
      p90: null,
      p95: null,
      p99: null,
      count: null,
      rate: m.http_req_failed?.values?.rate ?? null,
      value: null,
      unit: "rate",
    },
    {
      id: "elastic-3",
      source: "Elastic",
      metric: "http_reqs",
      avg: null,
      min: null,
      med: null,
      max: null,
      p90: null,
      p95: null,
      p99: null,
      count: m.http_reqs?.values?.count ?? null,
      rate: m.http_reqs?.values?.rate ?? null,
      value: null,
      unit: "count/rate",
    },
    {
      id: "elastic-4",
      source: "Elastic",
      metric: "iterations",
      avg: null,
      min: null,
      med: null,
      max: null,
      p90: null,
      p95: null,
      p99: null,
      count: m.iterations?.values?.count ?? null,
      rate: m.iterations?.values?.rate ?? null,
      value: null,
      unit: "count/rate",
    },
    {
      id: "elastic-5",
      source: "Elastic",
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
      value: m.vus_max?.values?.value ?? null,
      unit: "users",
    },
  ];

  return {
    "../reports/summary-elastic.json": JSON.stringify(rows, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
