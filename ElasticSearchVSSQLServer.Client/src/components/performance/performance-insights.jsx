import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { RouterLink } from "src/routes/components";
import { paths } from "src/routes/paths";

import {
  formatGeneratedAt,
  formatPerformanceValue,
  getDatasetScenarioMatrixRows,
  getScenarioDatasetLabel,
  getToneByWinner,
  getWinnerLabel,
} from "./performance-report-utils";

function getRowStyles(theme, winner) {
  if (winner === "elastic") {
    return {
      bgcolor: alpha(theme.palette.success.main, 0.06),
      "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.1) },
    };
  }

  if (winner === "sql") {
    return {
      bgcolor: alpha(theme.palette.info.main, 0.06),
      "&:hover": { bgcolor: alpha(theme.palette.info.main, 0.1) },
    };
  }

  return {};
}

function StatCard({ title, value, caption, tone = "default" }) {
  return (
    <Card
      sx={{
        p: 2.25,
        height: "100%",
        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        boxShadow: "none",
        bgcolor:
          tone === "info"
            ? (theme) => alpha(theme.palette.info.main, 0.05)
            : tone === "success"
              ? (theme) => alpha(theme.palette.success.main, 0.05)
              : "background.paper",
      }}
    >
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        {title}
      </Typography>
      <Typography variant="h5" sx={{ mt: 1, lineHeight: 1.15 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1.25, color: "text.secondary" }}>
        {caption}
      </Typography>
    </Card>
  );
}

function buildDatasetSummary(rows, preferredSource) {
  const readyRows = rows.filter((row) => row.rows.length > 0);
  const viewCounts = readyRows.reduce(
    (accumulator, row) => {
      if (row.viewKey === "browse") accumulator.browse += 1;
      if (row.viewKey === "search") accumulator.search += 1;
      if (row.viewKey === "comparison") accumulator.comparison += 1;
      return accumulator;
    },
    { browse: 0, search: 0, comparison: 0 },
  );

  const scenarioWinnerCounts = readyRows.reduce(
    (accumulator, row) => {
      if (row.winner === "sql") accumulator.sql += 1;
      if (row.winner === "elastic") accumulator.elastic += 1;
      if (row.winner === "tie") accumulator.tie += 1;
      return accumulator;
    },
    { sql: 0, elastic: 0, tie: 0 },
  );

  const largestGap = readyRows.reduce((best, row) => {
    const gap = Math.abs(row.avgLatencyDeltaPercent ?? -1);
    if (gap < 0) return best;
    if (!best) return row;

    return gap > Math.abs(best.avgLatencyDeltaPercent ?? 0) ? row : best;
  }, null);

  const freshestRun = readyRows.reduce((best, row) => {
    const current = new Date(row.generatedAt ?? 0).getTime();
    const previous = new Date(best?.generatedAt ?? 0).getTime();
    return current > previous ? row : best;
  }, null);

  const maxUsers = readyRows.reduce(
    (highest, row) => Math.max(highest, Number(row.users ?? 0)),
    0,
  );

  return {
    readyRows,
    viewCounts,
    scenarioWinnerCounts,
    largestGap,
    freshestRun,
    maxUsers,
    preferredWins: scenarioWinnerCounts[preferredSource] ?? 0,
  };
}

export function DatasetPerformancePanel({ datasetKey, preferredSource }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const datasetRows = useMemo(
    () => getDatasetScenarioMatrixRows(datasetKey, t),
    [datasetKey, t],
  );
  const datasetLabel = getScenarioDatasetLabel(datasetKey, t);
  const preferredSourceLabel =
    preferredSource === "sql"
      ? t("testResults.sqlServer")
      : t("testResults.elasticsearch");
  const peerSourceLabel =
    preferredSource === "sql"
      ? t("testResults.elasticsearch")
      : t("testResults.sqlServer");

  const summary = useMemo(
    () => buildDatasetSummary(datasetRows, preferredSource),
    [datasetRows, preferredSource],
  );

  const largestGapLabel = summary.largestGap
    ? `${getWinnerLabel(summary.largestGap.avgLatencyWinner, t)} ${Math.abs(summary.largestGap.avgLatencyDeltaPercent ?? 0).toFixed(1)}%`
    : t("testResults.notAvailable");

  return (
    <Card
      sx={{
        mt: 3,
        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        boxShadow: "none",
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", lg: "center" }}
        >
          <Box>
            <Typography variant="h6">
              {t("testResults.pageSpecificBenchmarks", {
                defaultValue: "Real benchmark cases for this data fetch",
              })}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.75, color: "text.secondary", maxWidth: 880 }}
            >
              {t("testResults.pageSpecificBenchmarksDescription", {
                dataset: datasetLabel,
                preferred: preferredSourceLabel,
                peer: peerSourceLabel,
                defaultValue:
                  "The grid above is still the main record browser. This section keeps the stored k6 scenarios for {{dataset}} close to the page so you can see how {{preferred}} and {{peer}} behave across browse and search cases.",
              })}
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            href={paths.dashboard.root}
            variant="outlined"
          >
            {t("testResults.openFullDashboard", {
              defaultValue: "Open full benchmark dashboard",
            })}
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 2 }}
        >
          <Chip label={datasetLabel} color="primary" />
          <Chip
            label={t("testResults.scenariosReady", {
              count: summary.readyRows.length,
            })}
            variant="outlined"
          />
          <Chip
            label={t("testResults.coverageSummary", {
              browse: summary.viewCounts.browse,
              search: summary.viewCounts.search,
              defaultValue: "{{browse}} browse cases, {{search}} search cases",
            })}
            variant="outlined"
          />
          <Chip
            label={t("testResults.maxUsersCovered", {
              users: summary.maxUsers,
              defaultValue: `Up to ${summary.maxUsers} users`,
            })}
            variant="outlined"
          />
        </Stack>
      </Box>

      <Box
        sx={{
          px: 2.5,
          pb: 2.5,
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        <StatCard
          title={t("testResults.readyScenariosCard", {
            defaultValue: "Ready scenarios",
          })}
          value={`${summary.readyRows.length}`}
          caption={t("testResults.readyScenariosCardCopy", {
            browse: summary.viewCounts.browse,
            search: summary.viewCounts.search,
            defaultValue:
              "{{browse}} browse and {{search}} search cases already have stored measurements.",
          })}
        />
        <StatCard
          title={t("testResults.pageLeaderCard", {
            defaultValue: `${preferredSourceLabel} scenario wins`,
          })}
          value={`${summary.preferredWins}/${summary.readyRows.length || 0}`}
          caption={t("testResults.pageLeaderCardCopy", {
            preferred: preferredSourceLabel,
            peer: peerSourceLabel,
            preferredWins: summary.scenarioWinnerCounts[preferredSource] ?? 0,
            peerWins:
              summary.scenarioWinnerCounts[
                preferredSource === "sql" ? "elastic" : "sql"
              ] ?? 0,
            ties: summary.scenarioWinnerCounts.tie,
            defaultValue:
              "{{preferred}} leads {{preferredWins}} scenarios, {{peer}} leads {{peerWins}}, ties {{ties}}.",
          })}
          tone={preferredSource === "sql" ? "info" : "success"}
        />
        <StatCard
          title={t("testResults.largestGapCard", {
            defaultValue: "Largest average-latency gap",
          })}
          value={largestGapLabel}
          caption={
            summary.largestGap?.title ??
            t("testResults.noDecisionData", {
              defaultValue: "Add ready scenarios to surface a recommendation.",
            })
          }
          tone={getToneByWinner(summary.largestGap?.avgLatencyWinner)}
        />
        <StatCard
          title={t("testResults.freshestRunCard", {
            defaultValue: "Freshest run",
          })}
          value={formatGeneratedAt(summary.freshestRun?.generatedAt, t)}
          caption={
            summary.freshestRun?.title ??
            t("testResults.awaitingFreshRun", {
              defaultValue: "Awaiting fresh run",
            })
          }
        />
      </Box>

      <Divider />

      <Box sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {t("testResults.scenarioBreakdownTitle", {
            defaultValue: "Scenario-by-scenario breakdown",
          })}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
          {t("testResults.scenarioBreakdownCopy", {
            defaultValue:
              "Each row is one real k6 report saved under tests/k6/reports so we can keep the detailed cases close to the data-fetch page.",
          })}
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                {t("testResults.scenario", { defaultValue: "Scenario" })}
              </TableCell>
              <TableCell>
                {t("testResults.view", { defaultValue: "View" })}
              </TableCell>
              <TableCell>{t("testResults.query")}</TableCell>
              <TableCell>
                {t("testResults.users", { defaultValue: "Users" })}
              </TableCell>
              <TableCell>{t("testResults.sqlAvgLatency")}</TableCell>
              <TableCell>{t("testResults.elasticAvgLatency")}</TableCell>
              <TableCell>
                {t("testResults.sqlP90Latency", { defaultValue: "SQL p90" })}
              </TableCell>
              <TableCell>
                {t("testResults.elasticP90Latency", {
                  defaultValue: "Elastic p90",
                })}
              </TableCell>
              <TableCell>
                {t("testResults.sqlFailureRate", {
                  defaultValue: "SQL fail",
                })}
              </TableCell>
              <TableCell>
                {t("testResults.elasticFailureRate", {
                  defaultValue: "Elastic fail",
                })}
              </TableCell>
              <TableCell>{t("testResults.winner")}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {summary.readyRows.map((row) => (
              <TableRow key={row.id} hover sx={getRowStyles(theme, row.winner)}>
                <TableCell sx={{ minWidth: 240 }}>
                  <Typography variant="subtitle2">{row.title}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, color: "text.secondary" }}
                  >
                    {formatGeneratedAt(row.generatedAt, t)}
                  </Typography>
                </TableCell>
                <TableCell>{row.view}</TableCell>
                <TableCell sx={{ minWidth: 180 }}>{row.queryLabel}</TableCell>
                <TableCell>
                  {formatPerformanceValue(row.users, "users", t)}
                </TableCell>
                <TableCell>
                  {formatPerformanceValue(row.sqlAvgLatency, "ms", t)}
                </TableCell>
                <TableCell>
                  {formatPerformanceValue(row.elasticAvgLatency, "ms", t)}
                </TableCell>
                <TableCell>
                  {formatPerformanceValue(row.sqlP90Latency, "ms", t)}
                </TableCell>
                <TableCell>
                  {formatPerformanceValue(row.elasticP90Latency, "ms", t)}
                </TableCell>
                <TableCell>
                  {formatPerformanceValue(row.sqlFailureRate, "rate", t)}
                </TableCell>
                <TableCell>
                  {formatPerformanceValue(row.elasticFailureRate, "rate", t)}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={getWinnerLabel(row.winner, t)}
                    color={getToneByWinner(row.winner)}
                    variant={
                      getToneByWinner(row.winner) === "default"
                        ? "outlined"
                        : "soft"
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

function DatasetOverviewCard({ datasetKey, preferredRows }) {
  const { t } = useTranslation();
  const datasetLabel = getScenarioDatasetLabel(datasetKey, t);
  const summary = buildDatasetSummary(preferredRows, "sql");
  const winner =
    summary.scenarioWinnerCounts.sql === summary.scenarioWinnerCounts.elastic
      ? "tie"
      : summary.scenarioWinnerCounts.sql > summary.scenarioWinnerCounts.elastic
        ? "sql"
        : "elastic";

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        height: "100%",
        border: (theme) => `4px dotted ${alpha(theme.palette.divider, 0.8)}`,
        boxShadow: "none",
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="h6">{datasetLabel}</Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.75, color: "text.secondary" }}
          >
            {t("testResults.datasetOverviewCardCopy", {
              count: summary.readyRows.length,
              defaultValue:
                "{{count}} real scenarios saved for this data fetch family.",
            })}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={getWinnerLabel(winner, t)}
          color={getToneByWinner(winner)}
          variant={getToneByWinner(winner) === "default" ? "outlined" : "soft"}
          sx={{ alignSelf: "flex-start" }}
        />
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 2 }}
      >
        <Chip
          size="small"
          variant="outlined"
          label={t("testResults.coverageSummary", {
            browse: summary.viewCounts.browse,
            search: summary.viewCounts.search,
            defaultValue: "{{browse}} browse, {{search}} search",
          })}
        />
        <Chip
          size="small"
          variant="outlined"
          label={t("testResults.maxUsersCovered", {
            users: summary.maxUsers,
            defaultValue: `Up to ${summary.maxUsers} users`,
          })}
        />
      </Stack>

      <Typography variant="body2" sx={{ mt: 2.25 }}>
        {t("testResults.datasetWinnerBreakdown", {
          sql: summary.scenarioWinnerCounts.sql,
          elastic: summary.scenarioWinnerCounts.elastic,
          tie: summary.scenarioWinnerCounts.tie,
          defaultValue: "SQL {{sql}}, Elastic {{elastic}}, ties {{tie}}.",
        })}
      </Typography>

      <Typography variant="body2" sx={{ mt: 1.25, color: "text.secondary" }}>
        {summary.largestGap
          ? t("testResults.datasetLargestGapCopy", {
              winner: getWinnerLabel(summary.largestGap.avgLatencyWinner, t),
              percent: Math.abs(
                summary.largestGap.avgLatencyDeltaPercent ?? 0,
              ).toFixed(1),
              scenario: summary.largestGap.title,
              defaultValue:
                "Largest average-response gap: {{winner}} by {{percent}}% in {{scenario}}.",
            })
          : t("testResults.noDecisionData", {
              defaultValue: "Add ready scenarios to surface a recommendation.",
            })}
      </Typography>
    </Card>
  );
}

export function DashboardPerformanceOverview() {
  const { t } = useTranslation();

  const allRows = useMemo(
    () => [
      ...getDatasetScenarioMatrixRows("electronics", t),
      ...getDatasetScenarioMatrixRows("hm-fashion", t),
      ...getDatasetScenarioMatrixRows("logs", t),
    ],
    [t],
  );

  const groupedRows = useMemo(
    () => ({
      electronics: allRows.filter((row) => row.datasetKey === "electronics"),
      "hm-fashion": allRows.filter((row) => row.datasetKey === "hm-fashion"),
      logs: allRows.filter((row) => row.datasetKey === "logs"),
    }),
    [allRows],
  );

  return (
    <Card
      sx={{
        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        boxShadow: "none",
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Typography variant="h6">
          {t("testResults.dataFetchOverview", {
            defaultValue: "Data-fetch overview",
          })}
        </Typography>
      </Box>

      <Box
        sx={{
          px: 2.5,
          pb: 2.5,
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        <DatasetOverviewCard
          datasetKey="electronics"
          preferredRows={groupedRows.electronics}
        />
        <DatasetOverviewCard
          datasetKey="hm-fashion"
          preferredRows={groupedRows["hm-fashion"]}
        />
        <DatasetOverviewCard
          datasetKey="logs"
          preferredRows={groupedRows.logs}
        />
      </Box>
    </Card>
  );
}
