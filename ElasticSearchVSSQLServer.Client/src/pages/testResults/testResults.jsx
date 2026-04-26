import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  Chip,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { DashboardContent } from "src/layouts/dashboard";
import { DashboardPerformanceOverview } from "src/components/performance/performance-insights";
import {
  buildViewBenchmarkRows,
  buildViewBenchmarkSummary,
  formatGeneratedAt,
  formatPerformanceValue,
} from "src/components/performance/performance-report-utils";

const DEFAULT_KIBANA_URL =
  "http://localhost:5601/app/dashboards#/view/85dd4324-a0e8-4025-811c-21973109ec37?embed=true&_g=(refreshInterval:(pause:!t,value:60000),time:(from:now-15y,to:now))&show-query-input=false&show-filter-bar=false";

const KIBANA_DASHBOARD_URL =
  import.meta.env.VITE_KIBANA_DASHBOARD_URL || DEFAULT_KIBANA_URL;

function SummaryCard({ title, value, caption, tone = "default" }) {
  const paletteByTone = {
    default: "text.primary",
    primary: "primary.main",
    info: "info.main",
    success: "success.main",
    warning: "warning.main",
  };

  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        p: 2.75,
        height: "100%",
        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        boxShadow: "none",
        bgcolor:
          tone === "default"
            ? "background.paper"
            : (theme) => alpha(theme.palette[tone].main, 0.08),
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "0 auto auto 0",
          width: "100%",
          height: 4,
          bgcolor: (theme) =>
            tone === "default"
              ? alpha(theme.palette.text.primary, 0.12)
              : theme.palette[tone].main,
        },
      }}
    >
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        {title}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          mt: 1.25,
          lineHeight: 1.15,
          color: (theme) =>
            tone === "default"
              ? theme.palette.text.primary
              : theme.palette[paletteByTone[tone].split(".")[0]].main,
        }}
      >
        {value}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1.25, color: "text.secondary" }}>
        {caption}
      </Typography>
    </Card>
  );
}

function HeroStat({ label, value }) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2.5,
        bgcolor: (theme) => alpha(theme.palette.common.white, 0.08),
        border: (theme) =>
          `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: (theme) => alpha(theme.palette.common.white, 0.7),
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          mt: 0.75,
          color: "common.white",
          lineHeight: 1.2,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function getRowStyles(theme, sourceKey) {
  if (sourceKey === "elastic") {
    return {
      bgcolor: alpha(theme.palette.success.main, 0.05),
      "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.1) },
    };
  }

  if (sourceKey === "sql") {
    return {
      bgcolor: alpha(theme.palette.info.main, 0.05),
      "&:hover": { bgcolor: alpha(theme.palette.info.main, 0.1) },
    };
  }

  return {};
}

// function buildRunSummaryCaption(row, t) {
//   if (!row) return "";

//   const parts = [row.workload];
//   const usersLabel = formatPerformanceValue(row.users, "users", t);

//   if (usersLabel && usersLabel !== t("testResults.notAvailable")) {
//     parts.push(usersLabel);
//   }

//   if (row.queryLabel && row.queryLabel !== t("testResults.notAvailable")) {
//     parts.push(row.queryLabel);
//   }

//   return parts.join(" | ");
// }

export default function TestResults() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("table");

  const benchmarkRows = useMemo(() => buildViewBenchmarkRows(t), [t]);
  const summary = useMemo(
    () => buildViewBenchmarkSummary(benchmarkRows),
    [benchmarkRows],
  );

  // const slowestRunLabel = summary.slowestRow
  //   ? `${summary.slowestRow.view} / ${formatPerformanceValue(
  //       summary.slowestRow.avgLatency,
  //       "ms",
  //       t,
  //     )}`
  //   : t("testResults.notAvailable");

  // const fastestRunLabel = summary.fastestRow
  //   ? `${summary.fastestRow.view} / ${formatPerformanceValue(
  //       summary.fastestRow.avgLatency,
  //       "ms",
  //       t,
  //     )}`
  //   : t("testResults.notAvailable");

  const userLevelsLabel = summary.distinctUsers.length
    ? summary.distinctUsers.join(", ")
    : t("testResults.notAvailable");

  return (
    <DashboardContent
      maxWidth="xl"
      sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}
    >
      <Card
        sx={{
          position: "relative",
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
          boxShadow: "none",
          background: `
            radial-gradient(circle at top right, ${alpha(theme.palette.warning.main, 0.22)} 0%, transparent 30%),
            radial-gradient(circle at bottom left, ${alpha(theme.palette.info.light, 0.2)} 0%, transparent 34%),
            linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.primary.dark} 58%, ${theme.palette.common.black} 100%)
          `,
          color: "common.white",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -100,
            right: -80,
            width: 240,
            height: 240,
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.common.white, 0.05),
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -120,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.common.white, 0.04),
          }}
        />

        <Stack
          direction={{ xs: "column", xl: "row" }}
          spacing={3}
          justifyContent="space-between"
          sx={{ position: "relative", zIndex: 1, p: { xs: 3, md: 4 } }}
        >
          <Box sx={{ maxWidth: 760 }}>
            {/* <Chip
              size="small"
              label={t("testResults.performanceObservatory")}
              sx={{
                mb: 2,
                color: "common.white",
                bgcolor: alpha(theme.palette.common.white, 0.12),
                border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
              }}
            /> */}

            <Typography
              variant="h3"
              sx={{
                maxWidth: 680,
                fontSize: { xs: "2rem", md: "2.75rem" },
                lineHeight: 1.08,
              }}
            >
              {t("testResults.viewBenchmarkDashboard")}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 1.5,
                maxWidth: 700,
                color: alpha(theme.palette.common.white, 0.76),
              }}
            >
              {t("testResults.viewBenchmarkDashboardDescription")}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 2.5 }}
            >
              <Chip
                size="small"
                label={t("testResults.sqlServer")}
                sx={{
                  color: "common.white",
                  bgcolor: alpha(theme.palette.info.main, 0.18),
                  border: `1px solid ${alpha(theme.palette.info.light, 0.35)}`,
                }}
              />
              <Chip
                size="small"
                label={t("testResults.elasticsearch")}
                sx={{
                  color: "common.white",
                  bgcolor: alpha(theme.palette.success.main, 0.18),
                  border: `1px solid ${alpha(theme.palette.success.light, 0.35)}`,
                }}
              />
              <Chip
                size="small"
                label={t("testResults.workloadOpenWithData")}
                sx={{
                  color: "common.white",
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                  border: `1px solid ${alpha(theme.palette.primary.light, 0.35)}`,
                }}
              />
              <Chip
                size="small"
                label={t("testResults.workloadFilteredResults")}
                sx={{
                  color: "common.white",
                  bgcolor: alpha(theme.palette.warning.main, 0.18),
                  border: `1px solid ${alpha(theme.palette.warning.light, 0.35)}`,
                }}
              />
            </Stack>
          </Box>

          <Box
            sx={{
              width: { xs: "100%", xl: 380 },
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              bgcolor: alpha(theme.palette.common.white, 0.08),
              border: `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
              backdropFilter: "blur(16px)",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              sx={{
                minHeight: 0,
                bgcolor: alpha(theme.palette.common.white, 0.06),
                borderRadius: 999,
                p: 0.5,
                "& .MuiTabs-indicator": { display: "none" },
                "& .MuiTabs-flexContainer": { gap: 0.5 },
                "& .MuiTab-root": {
                  minHeight: 44,
                  minWidth: 0,
                  flex: 1,
                  px: 2.25,
                  py: 1.1,
                  color: alpha(theme.palette.common.white, 0.65),
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 600,
                  lineHeight: 1.2,
                },
                "& .Mui-selected": {
                  color: theme.palette.common.white,
                  bgcolor: alpha(theme.palette.common.white, 0.12),
                },
              }}
            >
              <Tab value="table" label={t("testResults.resultsTableTab")} />
              <Tab
                value="kibana"
                label={t("testResults.liveKibanaDashboard")}
              />
            </Tabs>

            <Box
              sx={{
                mt: 2,
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              }}
            >
              <HeroStat
                label={t("testResults.monitoredViewsCard")}
                value={`${summary.totalViews}`}
              />
              <HeroStat
                label={t("testResults.savedMeasurementsCard")}
                value={`${summary.totalRows}`}
              />
              <HeroStat
                label={t("testResults.concurrentUsersCard")}
                value={userLevelsLabel}
              />
              <HeroStat
                label={t("testResults.freshestRunCard")}
                value={formatGeneratedAt(summary.freshestRun?.generatedAt, t)}
              />
            </Box>
          </Box>
        </Stack>
      </Card>

      {activeTab === "table" ? (
        <Stack spacing={3}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            <SummaryCard
              title={t("testResults.monitoredViewsCard")}
              value={`${summary.totalViews}`}
              caption={t("testResults.monitoredViewsCardCopy")}
              tone="primary"
            />
            <SummaryCard
              title={t("testResults.savedMeasurementsCard")}
              value={`${summary.totalRows}`}
              caption={t("testResults.savedMeasurementsCardCopy")}
              tone="info"
            />
            <SummaryCard
              title={t("testResults.concurrentUsersCard")}
              value={userLevelsLabel}
              caption={t("testResults.concurrentUsersCardCopy")}
              tone="warning"
            />
            <SummaryCard
              title={t("testResults.freshestRunCard")}
              value={formatGeneratedAt(summary.freshestRun?.generatedAt, t)}
              caption={
                summary.freshestRun?.title ?? t("testResults.awaitingFreshRun")
              }
              tone="success"
            />
          </Box>

          {/* <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                xl: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            <SummaryCard
              title={t("testResults.fastestAverageRunCard")}
              value={fastestRunLabel}
              caption={buildRunSummaryCaption(summary.fastestRow, t)}
              tone="success"
            />
            <SummaryCard
              title={t("testResults.slowestAverageRunCard")}
              value={slowestRunLabel}
              caption={buildRunSummaryCaption(summary.slowestRow, t)}
              tone="warning"
            />
          </Box> */}

          <DashboardPerformanceOverview />

          <Card
            sx={{
              overflow: "hidden",
              border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
              boxShadow: "none",
            }}
          >
            <Box sx={{ p: 2.5, display: "grid", gap: 1.5 }}>
              <Box>
                <Typography variant="h6">
                  {t("testResults.viewResultsTableTitle")}
                </Typography>
              </Box>

              <Alert severity="info" variant="outlined">
                {t("testResults.dashboardDataSourceMessage")}
              </Alert>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  color="info"
                  variant="outlined"
                  label={t("testResults.sqlServer")}
                />
                <Chip
                  size="small"
                  color="success"
                  variant="outlined"
                  label={t("testResults.elasticsearch")}
                />
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={t("testResults.workloadOpenWithData")}
                />
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={t("testResults.workloadFilteredResults")}
                />
              </Stack>
            </Box>

            <TableContainer
              sx={{
                maxHeight: { xs: "none", xl: 760 },
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    borderColor: alpha(theme.palette.divider, 0.7),
                    verticalAlign: "top",
                  },
                  "& .MuiTableCell-head": {
                    bgcolor: alpha(theme.palette.background.paper, 0.98),
                    backdropFilter: "blur(12px)",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>{t("testResults.view")}</TableCell>
                    <TableCell>{t("testResults.workload")}</TableCell>
                    <TableCell>{t("testResults.filter")}</TableCell>
                    <TableCell>{t("testResults.users")}</TableCell>
                    <TableCell>{t("testResults.avgResultTime")}</TableCell>
                    <TableCell>{t("testResults.p90ResultTime")}</TableCell>
                    <TableCell>{t("testResults.p95ResultTime")}</TableCell>
                    <TableCell>{t("testResults.maxResultTime")}</TableCell>
                    <TableCell>{t("testResults.failureRate")}</TableCell>
                    <TableCell>{t("testResults.throughput")}</TableCell>
                    <TableCell>{t("testResults.requestCount")}</TableCell>
                    <TableCell>{t("testResults.generatedAt")}</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {benchmarkRows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={getRowStyles(theme, row.sourceKey)}
                    >
                      <TableCell sx={{ minWidth: 280 }}>
                        <Stack spacing={0.75}>
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                            alignItems="center"
                          >
                            <Typography variant="subtitle2">
                              {row.view}
                            </Typography>
                            <Chip
                              size="small"
                              label={row.source}
                              color={
                                row.sourceKey === "sql" ? "info" : "success"
                              }
                              variant="outlined"
                            />
                          </Stack>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {row.viewPath}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 170 }}>
                        <Chip
                          size="small"
                          label={row.workload}
                          color={
                            row.workloadKey === "browse" ? "primary" : "warning"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        {row.queryLabel}
                      </TableCell>
                      <TableCell>
                        {formatPerformanceValue(row.users, "users", t)}
                      </TableCell>
                      <TableCell>
                        {formatPerformanceValue(row.avgLatency, "ms", t)}
                      </TableCell>
                      <TableCell>
                        {formatPerformanceValue(row.p90Latency, "ms", t)}
                      </TableCell>
                      <TableCell>
                        {formatPerformanceValue(row.p95Latency, "ms", t)}
                      </TableCell>
                      <TableCell>
                        {formatPerformanceValue(row.maxLatency, "ms", t)}
                      </TableCell>
                      <TableCell>
                        {formatPerformanceValue(row.failureRate, "rate", t)}
                      </TableCell>
                      <TableCell>
                        {formatPerformanceValue(row.throughput, "req/s", t)}
                      </TableCell>
                      <TableCell>
                        {row.requestCount?.toLocaleString?.() ??
                          t("testResults.notAvailable")}
                      </TableCell>
                      <TableCell sx={{ minWidth: 190 }}>
                        {formatGeneratedAt(row.generatedAt, t)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      ) : (
        <Card
          sx={{
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            boxShadow: "none",
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Typography variant="h6">
              {t("testResults.liveKibanaDashboard")}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.75, color: "text.secondary", maxWidth: 880 }}
            >
              {t("testResults.liveKibanaDashboardDescription")}
            </Typography>
          </Box>

          <Box sx={{ height: { xs: 520, lg: 780 } }}>
            <Box
              component="iframe"
              src={KIBANA_DASHBOARD_URL}
              title={t("testResults.kibanaDashboard")}
              sx={{
                width: "100%",
                height: "100%",
                border: 0,
                display: "block",
                bgcolor: "background.default",
              }}
            />
          </Box>
        </Card>
      )}
    </DashboardContent>
  );
}
