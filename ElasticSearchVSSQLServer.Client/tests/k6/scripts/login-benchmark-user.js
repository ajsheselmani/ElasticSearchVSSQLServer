import http from "k6/http";
import { check, fail } from "k6";

import { BASE_URL } from "../config.js";

export const options = {
  vus: 1,
  iterations: 1,
  insecureSkipTLSVerify: true,
};

let issuedToken = "";

export default function () {
  const email = (__ENV.K6_EMAIL || "").trim();
  const password = (__ENV.K6_PASSWORD || "").trim();

  if (!email || !password) {
    fail("K6_EMAIL and K6_PASSWORD are required to issue a benchmark token.");
  }

  const response = http.post(
    `${BASE_URL}/auth`,
    JSON.stringify({ email, password }),
    {
      headers: { "Content-Type": "application/json" },
      timeout: "60s",
    },
  );

  let token = "";

  try {
    token = JSON.parse(response.body || "{}")?.token || "";
  } catch (error) {
    token = "";
  }

  check(response, {
    "benchmark auth token issued": () => response.status === 200 && !!token,
  });

  if (response.status !== 200 || !token) {
    fail(
      `Benchmark auth token request failed. Status: ${response.status}. Body: ${response.body}`,
    );
  }

  issuedToken = token;
}

export function handleSummary() {
  return {
    "tests/k6/reports/benchmark-auth-token.json": JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        token: issuedToken,
      },
      null,
      2,
    ),
    stdout: issuedToken ? `TOKEN:${issuedToken}\n` : "TOKEN:\n",
  };
}
