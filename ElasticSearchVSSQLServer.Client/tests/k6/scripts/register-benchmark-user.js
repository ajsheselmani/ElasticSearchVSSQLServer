import http from "k6/http";
import { check, fail } from "k6";

import { BASE_URL } from "../config.js";

export const options = {
  vus: 1,
  iterations: 1,
  insecureSkipTLSVerify: true,
};

export default function () {
  const email = (__ENV.K6_REGISTER_EMAIL || "benchmark.k6@example.com").trim();
  const password = (__ENV.K6_REGISTER_PASSWORD || "Benchmark123!").trim();
  const userName = (__ENV.K6_REGISTER_USERNAME || "benchmarkk6").trim();
  const personalNumber = (
    __ENV.K6_REGISTER_PERSONAL_NUMBER || "90042612345"
  ).trim();

  const payload = {
    PersonalNumber: personalNumber,
    Gender: "1",
    Firstname: "Benchmark",
    Lastname: "Runner",
    Birthdate: "1995-01-01",
    UserName: userName,
    PhoneNumber: "044123456",
    Email: email,
    Password: password,
    ConfirmPassword: password,
    Language: "1",
  };

  const response = http.post(`${BASE_URL}/User`, payload);
  const succeeded = response.status === 200;
  const alreadyExists =
    response.status === 400 &&
    `${response.body ?? ""}`.toLowerCase().includes("exist");

  check(response, {
    "benchmark user created or already exists": () =>
      succeeded || alreadyExists,
  });

  if (!succeeded && !alreadyExists) {
    fail(
      `Benchmark user bootstrap failed. Status: ${response.status}. Body: ${response.body}`,
    );
  }
}
