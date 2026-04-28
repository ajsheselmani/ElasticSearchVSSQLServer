import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import axiosInstance from "src/lib/axios";
import { CONFIG } from "src/global-config";
import { DashboardContent } from "src/layouts/dashboard";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { paths } from "src/routes/paths";

const PAGE_SIZE = 10;
const DATE_LOCALE_BY_LANGUAGE = {
  en: "en-GB",
  sq: "sq-AL",
  sr: "sr-RS",
};

const SEARCH_TERM_SEPARATORS = /[\s,;]+/;
const SEARCH_TERM_TRIM_PATTERN = /^[.?!:()[\]{}"']+|[.?!:()[\]{}"']+$/g;

function formatValue(value, fallback = "///") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function getDateLocale(language) {
  return DATE_LOCALE_BY_LANGUAGE[language] ?? DATE_LOCALE_BY_LANGUAGE.en;
}

function formatDate(value, locale = DATE_LOCALE_BY_LANGUAGE.en) {
  if (!value) return "///";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTime(value, locale = DATE_LOCALE_BY_LANGUAGE.en) {
  if (!value) return "///";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(value));
}

function splitSearchTerms(query) {
  return query
    .split(SEARCH_TERM_SEPARATORS)
    .map((term) => term.trim().replace(SEARCH_TERM_TRIM_PATTERN, ""))
    .filter(Boolean);
}

function parseNumericSearchTerm(term) {
  const normalizedTerm = term.replace(",", ".");
  const parsedNumber = Number(normalizedTerm);

  return Number.isFinite(parsedNumber) ? normalizedTerm : null;
}

function buildDatasetFilters(query, fields, textOperator, numberOperator) {
  const searchTerms = splitSearchTerms(query.trim());
  if (searchTerms.length === 0) return [];

  return searchTerms.flatMap((searchTerm) => {
    const parsedNumber = parseNumericSearchTerm(searchTerm);

    return fields.flatMap((field) => {
      if (field.type === "number") {
        return parsedNumber === null
          ? []
          : [
              {
                propertyName: field.name,
                operator: numberOperator,
                value: parsedNumber,
                caseSensitive: false,
              },
            ];
      }

      return [
        {
          propertyName: field.name,
          operator: textOperator,
          value: searchTerm,
          caseSensitive: false,
        },
      ];
    });
  });
}

function getResponseError(response, fallbackMessage) {
  if (!response || response?.status >= 400 || response?.isAxiosError) {
    return (
      response?.response?.data?.message ||
      response?.response?.data?.title ||
      fallbackMessage
    );
  }

  return null;
}

const DATASET_CONFIGS = {
  electronics: {
    labelKey: "compareView.datasets.electronics.label",
    placeholderKey: "compareView.datasets.electronics.placeholder",
    descriptionKey: "compareView.datasets.electronics.description",
    searchFields: [
      { name: "eventTime", type: "text" },
      { name: "eventType", type: "text" },
      { name: "productId", type: "number" },
      { name: "categoryId", type: "number" },
      { name: "categoryCode", type: "text" },
      { name: "brand", type: "text" },
      { name: "price", type: "text" },
      { name: "userId", type: "number" },
      { name: "userSession", type: "text" },
    ],
    columns: [
      {
        key: "eventTime",
        labelKey: "compareView.columns.eventTime",
        getValue: (row, locale) => formatDateTime(row.eventTime, locale),
      },
      {
        key: "eventType",
        labelKey: "compareView.columns.eventType",
        getValue: (row) => formatValue(row.eventType),
      },
      {
        key: "brand",
        labelKey: "compareView.columns.brand",
        getValue: (row) => formatValue(row.brand),
      },
      {
        key: "categoryCode",
        labelKey: "compareView.columns.category",
        getValue: (row) => formatValue(row.categoryCode),
      },
      {
        key: "productId",
        labelKey: "compareView.columns.productId",
        getValue: (row) => formatValue(row.productId),
      },
      {
        key: "price",
        labelKey: "compareView.columns.price",
        getValue: (row) => formatValue(row.price),
      },
      {
        key: "userId",
        labelKey: "compareView.columns.userId",
        getValue: (row) => formatValue(row.userId),
      },
    ],
    fetchSql: (query) =>
      axiosInstance.get("/SQLData/GetAllElectronicEvents", {
        params: {
          page: 1,
          pageSize: PAGE_SIZE,
          filters: JSON.stringify(
            buildDatasetFilters(
              query,
              DATASET_CONFIGS.electronics.searchFields,
              "like",
              "eq",
            ),
          ),
          logicType: "or",
        },
      }),
    fetchElastic: (query) =>
      axiosInstance.put(
        `/ElasticData/ElectronicsDataSearch?page=0&pageSize=${PAGE_SIZE}`,
        {
          filter: buildDatasetFilters(
            query,
            DATASET_CONFIGS.electronics.searchFields,
            "Like",
            "Eq",
          ),
          sortOrders: [],
          aggregations: [],
          logicType: "or",
        },
      ),
    parseSql: (payload) => ({
      rows: payload?.items ?? [],
      totalCount: payload?.totalCount ?? 0,
    }),
    parseElastic: (payload) => ({
      rows: payload?.hits ?? [],
      totalCount: payload?.metadata?.totalCount ?? 0,
    }),
  },
  hmFashion: {
    labelKey: "compareView.datasets.hmFashion.label",
    placeholderKey: "compareView.datasets.hmFashion.placeholder",
    descriptionKey: "compareView.datasets.hmFashion.description",
    searchFields: [
      { name: "customerId", type: "text" },
      { name: "articleId", type: "number" },
      { name: "price", type: "number" },
      { name: "salesChannelId", type: "number" },
      { name: "productCode", type: "number" },
      { name: "prodName", type: "text" },
      { name: "productTypeName", type: "text" },
      { name: "productGroupName", type: "text" },
      { name: "graphicalAppearanceName", type: "text" },
      { name: "colourGroupName", type: "text" },
      { name: "perceivedColourValueName", type: "text" },
      { name: "departmentName", type: "text" },
      { name: "indexName", type: "text" },
      { name: "indexGroupName", type: "text" },
      { name: "sectionName", type: "text" },
      { name: "garmentGroupName", type: "text" },
      { name: "detailDesc", type: "text" },
      { name: "fn", type: "text" },
      { name: "active", type: "text" },
      { name: "clubMemberStatus", type: "text" },
      { name: "fashionNewsFrequency", type: "text" },
      { name: "postalCode", type: "text" },
    ],
    columns: [
      {
        key: "date",
        labelKey: "compareView.columns.date",
        getValue: (row, locale) =>
          formatDate(row.date ?? row.transactionDate, locale),
      },
      {
        key: "customerId",
        labelKey: "compareView.columns.customerId",
        getValue: (row) => formatValue(row.customerId),
      },
      {
        key: "articleId",
        labelKey: "compareView.columns.articleId",
        getValue: (row) => formatValue(row.articleId),
      },
      {
        key: "prodName",
        labelKey: "compareView.columns.productName",
        getValue: (row) => formatValue(row.prodName),
      },
      {
        key: "productTypeName",
        labelKey: "compareView.columns.productType",
        getValue: (row) => formatValue(row.productTypeName),
      },
      {
        key: "departmentName",
        labelKey: "compareView.columns.department",
        getValue: (row) => formatValue(row.departmentName),
      },
      {
        key: "price",
        labelKey: "compareView.columns.price",
        getValue: (row) => formatValue(row.price),
      },
    ],
    fetchSql: (query) =>
      axiosInstance.get("/SQLData/GetAllHMTransactionsTrain", {
        params: {
          page: 1,
          pageSize: PAGE_SIZE,
          filters: JSON.stringify(
            buildDatasetFilters(
              query,
              DATASET_CONFIGS.hmFashion.searchFields,
              "like",
              "eq",
            ),
          ),
          logicType: "or",
        },
      }),
    fetchElastic: (query) =>
      axiosInstance.put(
        `/ElasticData/HMFashionFlatSearch?page=0&pageSize=${PAGE_SIZE}`,
        {
          filter: buildDatasetFilters(
            query,
            DATASET_CONFIGS.hmFashion.searchFields,
            "Like",
            "Eq",
          ),
          sortOrders: [],
          aggregations: [],
          logicType: "or",
        },
      ),
    parseSql: (payload) => ({
      rows: payload?.items ?? [],
      totalCount: payload?.totalCount ?? 0,
    }),
    parseElastic: (payload) => ({
      rows: payload?.hits ?? [],
      totalCount: payload?.metadata?.totalCount ?? 0,
    }),
  },
};

function createEmptyResult() {
  return {
    rows: [],
    totalCount: 0,
    durationMs: null,
    error: "",
  };
}

function getLocalizedDatasetConfigs(t) {
  return Object.fromEntries(
    Object.entries(DATASET_CONFIGS).map(([key, config]) => [
      key,
      {
        ...config,
        label: t(config.labelKey),
        placeholder: t(config.placeholderKey),
        description: t(config.descriptionKey),
        columns: config.columns.map((column) => ({
          ...column,
          label: t(column.labelKey),
        })),
      },
    ]),
  );
}

async function fetchSource(fetcher, parser, fallbackMessage) {
  const startedAt = performance.now();
  const response = await fetcher();
  const responseError = getResponseError(response, fallbackMessage);

  if (responseError) {
    throw new Error(responseError);
  }

  return {
    ...parser(response?.data),
    durationMs: Math.round(performance.now() - startedAt),
    error: "",
  };
}

async function runComparisonSearch(datasetKey, query, messages) {
  const dataset = DATASET_CONFIGS[datasetKey] ?? DATASET_CONFIGS.electronics;

  const [sqlResult, elasticResult] = await Promise.allSettled([
    fetchSource(
      () => dataset.fetchSql(query),
      dataset.parseSql,
      messages.sqlSearchFailed,
    ),
    fetchSource(
      () => dataset.fetchElastic(query),
      dataset.parseElastic,
      messages.elasticSearchFailed,
    ),
  ]);

  return {
    sql:
      sqlResult.status === "fulfilled"
        ? sqlResult.value
        : { ...createEmptyResult(), error: sqlResult.reason.message },
    elastic:
      elasticResult.status === "fulfilled"
        ? elasticResult.value
        : { ...createEmptyResult(), error: elasticResult.reason.message },
  };
}

function SourceResultsCard({
  title,
  color,
  result,
  columns,
  loading,
  t,
  dateLocale,
}) {
  return (
    <Card
      sx={{
        minHeight: 420,
        display: "flex",
        flexDirection: "column",
        borderTop: `4px solid ${color}`,
      }}
    >
      {loading ? <LinearProgress /> : null}

      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Typography variant="h6">{title}</Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={t("compareView.recordsValue", { count: result.totalCount })}
              color="default"
              variant="outlined"
            />
            <Chip
              label={
                result.durationMs === null
                  ? t("compareView.responseTimePending")
                  : t("compareView.responseTimeValue", {
                      duration: result.durationMs,
                    })
              }
              color="default"
              variant="outlined"
            />
          </Stack>
        </Stack>

        {result.error ? (
          <Alert severity="error">{result.error}</Alert>
        ) : result.rows.length === 0 ? (
          <Alert severity="info">{t("compareView.noResultsForSource")}</Alert>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      sx={{ whiteSpace: "nowrap", fontWeight: 700 }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {result.rows.map((row, index) => (
                  <TableRow key={`${title}-${index}`}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={{ whiteSpace: "nowrap", maxWidth: 220 }}
                      >
                        {column.getValue(row, dateLocale)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function QueryDatasetComparison() {
  const { t, i18n } = useTranslation();
  const [datasetKey, setDatasetKey] = React.useState("electronics");
  const [query, setQuery] = React.useState("phone");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState({
    sql: createEmptyResult(),
    elastic: createEmptyResult(),
  });
  const latestSearchId = React.useRef(0);

  const dateLocale = getDateLocale(i18n.resolvedLanguage ?? i18n.language);
  const datasetConfigs = getLocalizedDatasetConfigs(t);
  const dataset = datasetConfigs[datasetKey] ?? datasetConfigs.electronics;
  const sqlSearchFailed = t("compareView.sqlSearchFailed");
  const elasticSearchFailed = t("compareView.elasticSearchFailed");
  const metadata = {
    title: `${t("sqlVsElasticsearchSearch")} - ${CONFIG.appName}`,
  };

  const handleSearch = async (nextDatasetKey = datasetKey, nextQuery = query) => {
    const currentSearchId = latestSearchId.current + 1;
    latestSearchId.current = currentSearchId;
    setResults({
      sql: createEmptyResult(),
      elastic: createEmptyResult(),
    });
    setLoading(true);

    try {
      const searchResults = await runComparisonSearch(
        nextDatasetKey,
        nextQuery,
        { sqlSearchFailed, elasticSearchFailed },
      );
      if (latestSearchId.current === currentSearchId) {
        setResults(searchResults);
      }
    } finally {
      if (latestSearchId.current === currentSearchId) {
        setLoading(false);
      }
    }
  };

  React.useEffect(() => {
    let isActive = true;
    const currentSearchId = latestSearchId.current + 1;

    latestSearchId.current = currentSearchId;

    setLoading(true);

    void runComparisonSearch("electronics", "phone", {
      sqlSearchFailed,
      elasticSearchFailed,
    })
      .then((searchResults) => {
        if (isActive && latestSearchId.current === currentSearchId) {
          setResults(searchResults);
        }
      })
      .finally(() => {
        if (isActive && latestSearchId.current === currentSearchId) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [elasticSearchFailed, sqlSearchFailed]);

  return (
    <>
      <title>{metadata.title}</title>

      <DashboardContent
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <CustomBreadcrumbs
          heading={t("sqlVsElasticsearchSearch")}
          links={[
            { name: t("dashboard"), href: paths.dashboard.root },
            {
              name: t("sqlVsElasticsearchSearch"),
              href: paths.compare.querySearch,
            },
          ]}
          sx={{ mb: { xs: 1, md: 1 } }}
        />

        <Card
          sx={{
            background:
              "linear-gradient(135deg, rgba(14, 116, 144, 0.12), rgba(15, 23, 42, 0.03))",
          }}
        >
          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Stack spacing={1}>
              <Typography variant="h4">{t("compareView.heroTitle")}</Typography>
              <Typography variant="body1" color="text.secondary">
                {dataset.description}
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", lg: "center" }}
            >
              <TextField
                select
                label={t("compareView.datasetFieldLabel")}
                value={datasetKey}
                onChange={(event) => {
                  const nextDatasetKey = event.target.value;
                  setDatasetKey(nextDatasetKey);
                  void handleSearch(nextDatasetKey, query);
                }}
                sx={{ minWidth: { xs: "100%", lg: 240 } }}
              >
                {Object.entries(datasetConfigs).map(([value, item]) => (
                  <MenuItem key={value} value={value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label={t("compareView.searchFieldLabel")}
                value={query}
                placeholder={dataset.placeholder}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSearch();
                  }
                }}
              />

              <Button
                variant="contained"
                size="large"
                onClick={() => void handleSearch()}
                disabled={loading}
                sx={{ minWidth: { xs: "100%", lg: 170 }, height: 56 }}
              >
                {loading ? t("compareView.searching") : t("compareView.runSearch")}
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={t("compareView.datasetValue", { value: dataset.label })}
                color="primary"
              />
              <Chip
                label={t("compareView.queryValue", {
                  value: query.trim() || t("compareView.emptyQuery"),
                })}
                variant="outlined"
              />
              <Chip
                label={t("compareView.previewSizeValue", { count: PAGE_SIZE })}
                variant="outlined"
              />
            </Stack>
          </CardContent>
        </Card>

        <Divider />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              xl: "minmax(0, 1fr) minmax(0, 1fr)",
            },
          }}
        >
          <SourceResultsCard
            title={t("testResults.sqlServer")}
            color="#2563eb"
            result={results.sql}
            columns={dataset.columns}
            loading={loading}
            t={t}
            dateLocale={dateLocale}
          />
          <SourceResultsCard
            title={t("testResults.elasticsearch")}
            color="#059669"
            result={results.elastic}
            columns={dataset.columns}
            loading={loading}
            t={t}
            dateLocale={dateLocale}
          />
        </Box>
      </DashboardContent>
    </>
  );
}
