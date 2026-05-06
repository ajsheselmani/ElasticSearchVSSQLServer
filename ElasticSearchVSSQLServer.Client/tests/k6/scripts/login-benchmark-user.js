import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = process.env.K6_BASE_URL || "https://localhost:7236/api";
const DEFAULT_BENCHMARK_EMAIL = "benchmark.k6@example.com";
const DEFAULT_BENCHMARK_PASSWORD = "Benchmark123!";
const TOKEN_REPORT_PATH = "tests/k6/reports/benchmark-auth-token.json";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const email = (process.env.K6_EMAIL || DEFAULT_BENCHMARK_EMAIL).trim();
const password = (process.env.K6_PASSWORD || DEFAULT_BENCHMARK_PASSWORD).trim();
const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, "");

if (!email || !password) {
  throw new Error("K6_EMAIL and K6_PASSWORD are required to issue a benchmark token.");
}

const response = await fetch(`${baseUrl}/auth`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const responseText = await response.text();
const responseBody = safeJson(responseText);
const token = getAuthToken(responseBody);

await writeTokenReport({
  token,
  status: response.status,
  error: response.ok && token ? null : responseText,
});

if (!response.ok || !token) {
  throw new Error(
    `Benchmark auth token request failed. Status: ${response.status}. Body: ${responseText}`,
  );
}

console.log(`TOKEN:${token}`);

function safeJson(text) {
  try {
    return JSON.parse(text || "{}");
  } catch (error) {
    return {};
  }
}

function getAuthToken(authBody) {
  return (
    authBody?.token ??
    authBody?.Token ??
    authBody?.accessToken ??
    authBody?.AccessToken ??
    ""
  );
}

async function writeTokenReport(report) {
  const outputPath = path.resolve(TOKEN_REPORT_PATH);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        token: report.token,
        status: report.status,
        error: report.error,
      },
      null,
      2,
    )}\n`,
  );
}
