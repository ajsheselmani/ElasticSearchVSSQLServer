export const BASE_URL = "http://localhost:3031"; // your React dev server or API

export const defaultOptions = {
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    http_req_failed: ["rate<0.01"], // less than 1% errors
  },
};
