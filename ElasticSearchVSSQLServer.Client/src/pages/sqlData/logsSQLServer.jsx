import { LicenseInfo } from "@mui/x-license";
import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo } from "react";
import { useAuthContext } from "src/auth/hooks";
import { getDataGridLocale } from "src/locales/custom components/datagrid/utils";
import i18n from "src/locales";
import { debounce } from "lodash";
import axiosInstance from "src/lib/axios";
import { DataGrid } from "@mui/x-data-grid";
import DataGridToolbar from "src/components/datagrid-toolbar/datagrid-toolbar";
import { Chip, Tooltip } from "@mui/material";
import { CONFIG } from "src/global-config";
import { DashboardContent } from "src/layouts/dashboard";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { paths } from "src/routes/paths";

LicenseInfo.setLicenseKey(import.meta.env.VITE_DATAGRID_KEY);

const MUI_OPERATOR_MAP = {
  contains: { operator: "like", negate: false },
  doesNotContain: { operator: "like", negate: true },
  equals: { operator: "eq", negate: false },
  startsWith: { operator: "like", negate: false, prefix: true },
  endsWith: { operator: "like", negate: false, suffix: true },
  isEmpty: { operator: "nex", negate: false },
  isNotEmpty: { operator: "ex", negate: false },
  is: { operator: "eq", negate: false },
  not: { operator: "eq", negate: true },
  after: { operator: "gt", negate: false },
  onOrAfter: { operator: "ge", negate: false },
  before: { operator: "lt", negate: false },
  onOrBefore: { operator: "le", negate: false },
  "=": { operator: "eq", negate: false },
  "!=": { operator: "eq", negate: true },
  ">": { operator: "gt", negate: false },
  ">=": { operator: "ge", negate: false },
  "<": { operator: "lt", negate: false },
  "<=": { operator: "le", negate: false },
};

function mapMuiFiltersToBackend(items) {
  const mapped = items
    .filter(
      (item) =>
        item.value !== undefined &&
        item.value !== "" &&
        item.value !== null &&
        item.operator !== "isEmpty" &&
        item.operator !== "isNotEmpty",
    )
    .map(({ field, operator, value }) => {
      const mapping = MUI_OPERATOR_MAP[operator];
      if (!mapping) return null;

      let backendValue = value;

      if (value instanceof Date) {
        backendValue = value.toISOString();
      }

      let backendOperator = mapping.operator;
      if (mapping.prefix) backendValue = `${backendValue}*`;
      if (mapping.suffix) backendValue = `*${backendValue}`;

      return {
        propertyName: field,
        operator: backendOperator,
        value: backendValue,
        negate: mapping.negate ?? false,
        caseSensitive: false,
      };
    })
    .filter(Boolean);

  const noValueFilters = items
    .filter(
      (item) => item.operator === "isEmpty" || item.operator === "isNotEmpty",
    )
    .map(({ field, operator }) => ({
      propertyName: field,
      operator: operator === "isEmpty" ? "nex" : "ex",
      value: null,
      negate: false,
      caseSensitive: false,
    }));

  return [...mapped, ...noValueFilters];
}

const LogsElasticSearch = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [filter, setFilter] = React.useState([]);
  const [logicType, setLogicType] = React.useState(null);
  const [data, setData] = React.useState([]);
  const [totalCount, setTotalCount] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");

  const metadata = {
    title: `${t("logsDataSql")} - ${CONFIG.appName}`,
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const requestFilters = [...filter];

        if (searchText?.trim()) {
          requestFilters.push({
            propertyName: "globalSearch",
            operator: "like",
            value: searchText.trim(),
            caseSensitive: false,
          });
        }

        const bankDatasetData = await axiosInstance.get(
          "/Logs/GetAllLogsData",
          {
            params: {
              page: page + 1,
              pageSize,
              filters: JSON.stringify(requestFilters),
              logicType: logicType ?? "and",
            },
          },
        );
        setTotalCount(bankDatasetData?.data?.totalCount ?? 0);
        setData(bankDatasetData?.data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, page, pageSize, filter, logicType, searchText]);

  const rowsWithId =
    data &&
    data?.items?.map((row, index) => ({
      ...row,
      id: page * pageSize + index,
    }));

  const columns = useMemo(
    () => [
      {
        field: "rowNumber",
        headerName: t("rowNumber"),
        width: 90,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const rowIndex = params.api.getRowIndexRelativeToVisibleRows(
            params.id,
          );
          return rowIndex !== -1 ? page * pageSize + rowIndex + 1 : "";
        },
      },
      {
        field: "ip",
        headerName: t("ip"),
        flex: 1,
        minWidth: 180,
        sortable: false,
        renderCell: (params) => {
          const ip = params?.row?.ip;
          return (
            <Tooltip title={ip} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {ip}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "url",
        headerName: t("url"),
        flex: 1,
        minWidth: 180,
        sortable: false,
        renderCell: (params) => {
          const url = params?.row?.url;
          return (
            <Tooltip title={url} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {url}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "httpMethod",
        headerName: t("httpMethod"),
        flex: 1,
        minWidth: 130,
        sortable: false,
        renderCell: (params) => {
          const httpMethod = params?.row?.httpMethod;
          return (
            <Tooltip title={httpMethod} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {httpMethod}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "controller",
        headerName: t("controller"),
        flex: 1,
        minWidth: 120,
        sortable: false,
        renderCell: (params) => {
          const controller = params?.row?.controller;
          return (
            <Tooltip title={controller} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {controller}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "action",
        headerName: t("action"),
        flex: 1,
        minWidth: 120,
        sortable: false,
        renderCell: (params) => {
          const action = params?.row?.action ?? "///";
          return (
            <Tooltip title={action} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {action}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "error",
        headerName: t("error"),
        flex: 1,
        minWidth: 120,
        sortable: false,
        type: "boolean",
        renderCell: (params) => {
          const error = params?.row?.error;
          return (
            <Tooltip title={error || ""} arrow>
              <span>
                <Chip
                  label={error ? t("true") : t("false")}
                  color={error ? "error" : "success"}
                  size="small"
                  variant={error ? "filled" : "outlined"}
                />
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "formContent",
        headerName: t("fromContent"),
        flex: 1,
        minWidth: 120,
        sortable: false,
        renderCell: (params) => {
          const fromContent = params?.row?.formContent ?? "///";
          return (
            <Tooltip title={fromContent} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {fromContent}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "response",
        headerName: t("response"),
        flex: 1,
        minWidth: 120,
        sortable: false,
        renderCell: (params) => {
          const response = params?.row?.response ?? "///";
          return (
            <Tooltip title={response} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {response}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "exception",
        headerName: t("exception"),
        flex: 1,
        minWidth: 120,
        sortable: false,
        renderCell: (params) => {
          const exception = params?.row?.exception ?? "///";
          return (
            <Tooltip title={exception} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {exception}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "insertedDate",
        headerName: t("insertedDate"),
        flex: 1,
        minWidth: 150,
        sortable: false,
        type: "dateTime",
        valueGetter: (value) => (value ? new Date(value) : null),
        renderCell: (params) => {
          const rawDate = params?.row?.insertedDate;
          if (!rawDate) return "";

          const date = new Date(rawDate);

          const dateFormated = new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }).format(date);

          return (
            <Tooltip title={dateFormated} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {dateFormated}
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [t, page, pageSize],
  );

  // const columns = allColumns;

  const debouncedFilterChange = React.useMemo(
    () =>
      debounce((model) => {
        const backendFilters = mapMuiFiltersToBackend(model.items ?? []);

        setLogicType(model.logicOperator ?? "and");
        setFilter(backendFilters);
        setPage(0);
      }, 400),
    [],
  );

  React.useEffect(() => {
    return () => debouncedFilterChange.cancel();
  }, [debouncedFilterChange]);

  return (
    <>
      <title>{metadata.title}</title>
      <DashboardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <CustomBreadcrumbs
          heading={t("userLogs")}
          links={[
            { name: t("dashboard"), href: paths.dashboard.root },
            { name: t("logsDataSql"), href: paths.sql.logsData },
          ]}
          sx={{ mb: { xs: 1, md: 1 } }}
        />
        {/* <Card> */}
        <div style={{ height: "100%", m: 5 }}>
          <DataGrid
            autoHeight
            columns={columns}
            rows={rowsWithId}
            getRowId={(item) => item.id}
            loading={loading}
            pinnedColumns={{ right: ["actions"] }}
            isRowSelectable={() => false}
            showToolbar
            pageSizeOptions={[10, 20, 50, 100]}
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            pagination
            slots={{ toolbar: DataGridToolbar }}
            rowCount={totalCount}
            localeText={getDataGridLocale(i18n.language)}
            sortingMode="server"
            paginationMode="server"
            filterMode="server"
            onFilterModelChange={debouncedFilterChange}
            slotProps={{
              toolbar: {
                onSearchChange: (value) => {
                  setPage(0);
                  setSearchText(value);
                },
              },
            }}
          />
        </div>
        {/* </Card> */}
      </DashboardContent>
    </>
  );
};

export default LogsElasticSearch;
