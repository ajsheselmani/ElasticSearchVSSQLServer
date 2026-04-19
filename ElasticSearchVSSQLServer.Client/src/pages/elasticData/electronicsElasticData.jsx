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
import { Tooltip } from "@mui/material";
import { DashboardContent } from "src/layouts/dashboard";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { paths } from "src/routes/paths";
import { CONFIG } from "src/global-config";

LicenseInfo.setLicenseKey(import.meta.env.VITE_DATAGRID_KEY);

const MUI_OPERATOR_MAP = {
  contains: { operator: "Like", negate: false },
  doesNotContain: { operator: "Nlike", negate: false },
  equals: { operator: "Eq", negate: false },
  startsWith: { operator: "Like", negate: false, prefix: true },
  endsWith: { operator: "Like", negate: false, suffix: true },
  isEmpty: { operator: "Nex", negate: false },
  isNotEmpty: { operator: "Ex", negate: false },
  is: { operator: "Eq", negate: false },
  not: { operator: "Neq", negate: false },
  after: { operator: "Gt", negate: false },
  onOrAfter: { operator: "Ge", negate: false },
  before: { operator: "Lt", negate: false },
  onOrBefore: { operator: "Le", negate: false },
  isAnyOf: { operator: "In", negate: false },
  "=": { operator: "Eq", negate: false },
  "!=": { operator: "Neq", negate: false },
  ">": { operator: "Gt", negate: false },
  ">=": { operator: "Ge", negate: false },
  "<": { operator: "Lt", negate: false },
  "<=": { operator: "Le", negate: false },
};

function mapMuiFiltersToBackend(items) {
  return (items ?? [])
    .filter((item) => {
      if (!item?.field || !item?.operator) return false;
      if (item.operator === "isEmpty" || item.operator === "isNotEmpty")
        return true;
      if (Array.isArray(item.value)) return item.value.length > 0;
      return (
        item.value !== undefined && item.value !== "" && item.value !== null
      );
    })
    .map(({ field, operator, value }) => {
      const mapping = MUI_OPERATOR_MAP[operator];
      if (!mapping) return null;

      if (operator === "isEmpty" || operator === "isNotEmpty") {
        return {
          propertyName: field,
          operator: mapping.operator,
          value: "",
          negate: false,
          caseSensitive: false,
        };
      }

      let backendValue = value;
      if (Array.isArray(backendValue))
        backendValue = JSON.stringify(backendValue);
      else if (backendValue instanceof Date)
        backendValue = backendValue.toISOString();

      if (mapping.prefix) backendValue = `${backendValue}*`;
      if (mapping.suffix) backendValue = `*${backendValue}`;

      return {
        propertyName: field,
        operator: mapping.operator,
        value: `${backendValue ?? ""}`,
        negate: false,
        caseSensitive: false,
      };
    })
    .filter(Boolean);
}

const ElectronicsElasticData = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [filter, setFilter] = React.useState([]);
  const [logicType, setLogicType] = React.useState(null);
  const [data, setData] = React.useState([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");

  const metadata = {
    title: `${t("electronicsDataElastic")} - ${CONFIG.appName}`,
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const requestFilters = [...filter];

        if (searchText?.trim()) {
          requestFilters.push({
            propertyName: "globalSearch",
            operator: 2,
            value: searchText.trim(),
            caseSensitive: false,
          });
        }

        const electronicsDatasetData = await axiosInstance.put(
          "/ElasticData/ElectronicsDataSearch?page=" +
            page +
            "&pageSize=" +
            pageSize,
          {
            filter: requestFilters,
            sortOrders: [],
            aggregations: [],
            logicType: logicType || "and",
          },
        );
        debugger;
        console.log(electronicsDatasetData, "electronicsDatasetData");
        setData(electronicsDatasetData.data?.hits);
        setTotalCount(electronicsDatasetData?.data?.metadata?.totalCount ?? 0);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, page, pageSize, filter, logicType, searchText]);
  console.log(data, "data");
  const rowsWithId =
    data &&
    data?.map((row, index) => ({
      ...row,
      id: page * pageSize + index,
    }));

  const allColumns = useMemo(
    () => [
      {
        field: "rowNumber",
        headerName: t("rowNumber"),
        width: 90,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          return params.row.id + 1;
        },
      },
      {
        field: "eventTime",
        headerName: t("eventTime"),
        flex: 1,
        minWidth: 170,
        renderCell: (params) => {
          const rawDate = params?.row?.eventTime;
          if (!rawDate) return "///";

          const date = new Date(rawDate);

          const dateFormated = new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC",
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
      {
        field: "eventType",
        headerName: t("eventType"),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const eventType = params?.row?.eventType;
          if (!eventType) return "///";

          return (
            <Tooltip title={eventType} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {eventType}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "productId",
        headerName: t("productId"),
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          const productId = params?.row?.productId;

          return (
            <Tooltip title={productId} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {productId}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "categoryId",
        headerName: t("categoryId"),
        flex: 1,
        minWidth: 130,
        renderCell: (params) => {
          const categoryId = params?.row?.categoryId;
          return (
            <Tooltip title={categoryId} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {categoryId}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "categoryCode",
        headerName: t("categoryCode"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          const categoryCode = params?.row?.categoryCode;
          return (
            <Tooltip title={categoryCode} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {categoryCode}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "brand",
        headerName: t("brand"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          const brand = params?.row?.brand;
          const formattedBrand = brand
            ? brand.charAt(0).toUpperCase() + brand.slice(1)
            : "///";
          return (
            <Tooltip title={formattedBrand} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formattedBrand}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "price",
        headerName: t("price"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          const price = params?.row?.price + " " + "$";
          if (!price) return "///";

          return (
            <Tooltip title={price} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {price}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "userId",
        headerName: t("userId"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          const userId = params?.row?.userId;
          return (
            <Tooltip title={userId} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userId}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "userSession",
        headerName: t("userSession"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          const userSession = params?.row?.userSession;
          if (!userSession) return "///";

          return (
            <Tooltip title={userSession} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userSession}
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [t, page, pageSize],
  );

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
          heading={t("electronicsData")}
          links={[
            { name: t("homepage"), href: paths.dashboard.root },
            { name: t("electronicsDataElastic"), href: paths.elastic.logsData },
          ]}
          sx={{ mb: { xs: 1, md: 1 } }}
        />
        <div style={{ height: "100%" }}>
          <DataGrid
            autoHeight
            columns={allColumns}
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
            rowCount={totalCount ?? 0}
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
      </DashboardContent>
    </>
  );
};

export default ElectronicsElasticData;
