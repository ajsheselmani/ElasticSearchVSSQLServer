import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_URL, defaultOptions } from "../config.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// const esDuration = new Trend("es_search_duration");

// const searchTerms = ["laptop", "phone", "tablet", "monitor", "keyboard"];

export const options = {
  ...defaultOptions,
  stages: [
    //   stages: [
    //   { duration: '1m', target: 20 },
    //   { duration: '1m', target: 50 },
    //   { duration: '1m', target: 100 },
    //   { duration: '1m', target: 150 },
    //   { duration: '1m', target: 200 },
    //   { duration: '30s', target: 0 },
    // ],
    { duration: "30s", target: 20 },
    { duration: "2m", target: 20 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1500"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  //   const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  //   const res = http.get(`${BASE_URL}/api/search?q=${term}&size=10`);
  const filters = [];
  const url = `${BASE_URL}/sql/electronicsData`;

  const res = http.get(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  check(res, {
    "sql status 200": (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  const m = data.metrics;

  const rows = [
    {
      id: "sql-1",
      source: "SQL",
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
      id: "sql-2",
      source: "SQL",
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
      id: "sql-3",
      source: "SQL",
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
      id: "sql-4",
      source: "SQL",
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
      id: "sql-5",
      source: "SQL",
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
    // "summary.html": htmlReport(data),
    "../reports/summary-sql.json": JSON.stringify(rows, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
//   esDuration.add(res.timings.duration);

//   check(res, {
//     "status is 200": (r) => r.status === 200,
//     "response time < 800ms": (r) => r.timings.duration < 800,
//     "has hits": (r) => JSON.parse(r.body).hits?.length >= 0,
//   });

//   sleep(0.5);
// }
