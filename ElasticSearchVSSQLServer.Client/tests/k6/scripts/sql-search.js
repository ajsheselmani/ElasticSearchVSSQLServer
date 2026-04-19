import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_URL, defaultOptions } from "../config.js";

const sqlDuration = new Trend("sql_fetch_duration");

export const options = {
  ...defaultOptions,
  stages: [
    { duration: "30s", target: 10 }, // ramp up to 10 users
    { duration: "1m", target: 10 }, // hold
    { duration: "20s", target: 0 }, // ramp down
  ],
};

export default function () {
  const res = http.get(`${BASE_URL}/api/products?limit=20`);

  sqlDuration.add(res.timings.duration);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "has data": (r) => JSON.parse(r.body).data?.length > 0,
  });

  sleep(1);
}
