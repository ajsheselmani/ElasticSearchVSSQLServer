export const BASE_URL = __ENV.K6_BASE_URL || "https://localhost:7236/api";

export const defaultOptions = {
  insecureSkipTLSVerify: true,
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    http_req_failed: ["rate<0.01"], // less than 1% errors
  },
};
