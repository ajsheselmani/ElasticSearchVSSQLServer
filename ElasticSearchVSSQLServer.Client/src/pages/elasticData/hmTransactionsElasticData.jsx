import { LicenseInfo } from "@mui/x-license";
import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo } from "react";
import { debounce } from "lodash";
import { DataGrid } from "@mui/x-data-grid";
import { Tooltip } from "@mui/material";
import { useAuthContext } from "src/auth/hooks";
import axiosInstance from "src/lib/axios";
import i18n from "src/locales";
import { getDataGridLocale } from "src/locales/custom components/datagrid/utils";
import DataGridToolbar from "src/components/datagrid-toolbar/datagrid-toolbar";
import { CONFIG } from "src/global-config";
import { DashboardContent } from "src/layouts/dashboard";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { paths } from "src/routes/paths";

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
      if (item.operator === "isEmpty" || item.operator === "isNotEmpty") {
        return true;
      }

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

      if (Array.isArray(backendValue)) {
        backendValue = JSON.stringify(backendValue);
      } else if (backendValue instanceof Date) {
        backendValue = backendValue.toISOString();
      }

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

function renderTooltipValue(value, fallback = "///") {
  const displayValue =
    value === null || value === undefined || value === ""
      ? fallback
      : String(value);

  return (
    <Tooltip title={displayValue} arrow>
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {displayValue}
      </span>
    </Tooltip>
  );
}

function renderDateValue(value) {
  if (!value) return "///";

  const date = new Date(value);
  const formattedValue = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return renderTooltipValue(formattedValue);
}

const HMTransactionsElasticData = () => {
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

  const pageTitle = t("hmTransactionsDataElastic");
  const metadata = {
    title: `${pageTitle} - ${CONFIG.appName}`,
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const requestFilters = [...filter];

        if (searchText?.trim()) {
          requestFilters.push({
            propertyName: "globalSearch",
            operator: "Like",
            value: searchText.trim(),
            caseSensitive: false,
          });
        }

        const response = await axiosInstance.put(
          `/ElasticData/HMFashionFlatSearch?page=${page}&pageSize=${pageSize}`,
          {
            filter: requestFilters,
            sortOrders: [],
            aggregations: [],
            logicType: logicType || "and",
          },
        );

        setData(response?.data?.hits ?? []);
        setTotalCount(response?.data?.metadata?.totalCount ?? 0);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, page, pageSize, filter, logicType, searchText]);

  const rowsWithId =
    data?.map((row, index) => ({
      ...row,
      id: row.id ?? `${row.customerId}-${row.articleId}-${row.transactionDate}`,
      rowNumber: page * pageSize + index + 1,
    })) ?? [];

  const columns = useMemo(
    () => [
      {
        field: "rowNumber",
        headerName: t("rowNumber"),
        width: 90,
        sortable: false,
        filterable: false,
      },
      {
        field: "transactionDate",
        headerName: t("date"),
        minWidth: 130,
        flex: 1,
        renderCell: (params) => renderDateValue(params?.row?.transactionDate),
      },
      {
        field: "customerId",
        headerName: t("customerId"),
        minWidth: 170,
        flex: 1,
        renderCell: (params) => renderTooltipValue(params?.row?.customerId),
      },
      {
        field: "articleId",
        headerName: t("articleId"),
        minWidth: 120,
        flex: 1,
        type: "number",
        renderCell: (params) => renderTooltipValue(params?.row?.articleId),
      },
      {
        field: "salesChannelId",
        headerName: t("salesChannelId"),
        minWidth: 140,
        flex: 1,
        type: "number",
        renderCell: (params) => renderTooltipValue(params?.row?.salesChannelId),
      },
      {
        field: "price",
        headerName: t("price"),
        minWidth: 120,
        flex: 1,
        type: "number",
        renderCell: (params) => renderTooltipValue(params?.row?.price),
      },
      {
        field: "productCode",
        headerName: t("productCode"),
        minWidth: 130,
        flex: 1,
        type: "number",
        renderCell: (params) => renderTooltipValue(params?.row?.productCode),
      },
      {
        field: "prodName",
        headerName: t("productName"),
        minWidth: 220,
        flex: 1.2,
        renderCell: (params) => renderTooltipValue(params?.row?.prodName),
      },
      {
        field: "productTypeName",
        headerName: t("productType"),
        minWidth: 180,
        flex: 1,
        renderCell: (params) =>
          renderTooltipValue(params?.row?.productTypeName),
      },
      {
        field: "productGroupName",
        headerName: t("productGroup"),
        minWidth: 180,
        flex: 1,
        renderCell: (params) =>
          renderTooltipValue(params?.row?.productGroupName),
      },
      {
        field: "graphicalAppearanceName",
        headerName: t("graphicalAppearance"),
        minWidth: 190,
        flex: 1,
        renderCell: (params) =>
          renderTooltipValue(params?.row?.graphicalAppearanceName),
      },
      {
        field: "colourGroupName",
        headerName: t("colourGroup"),
        minWidth: 180,
        flex: 1,
        renderCell: (params) =>
          renderTooltipValue(params?.row?.colourGroupName),
      },
      {
        field: "perceivedColourValueName",
        headerName: t("perceivedColourValue"),
        minWidth: 200,
        flex: 1,
        renderCell: (params) =>
          renderTooltipValue(params?.row?.perceivedColourValueName),
      },
      {
        field: "departmentName",
        headerName: t("department"),
        minWidth: 180,
        flex: 1,
        renderCell: (params) => renderTooltipValue(params?.row?.departmentName),
      },
      {
        field: "indexName",
        headerName: t("indexName"),
        minWidth: 160,
        flex: 1,
        renderCell: (params) => renderTooltipValue(params?.row?.indexName),
      },
      {
        field: "indexGroupName",
        headerName: t("indexGroup"),
        minWidth: 180,
        flex: 1,
        renderCell: (params) => renderTooltipValue(params?.row?.indexGroupName),
      },
      {
        field: "sectionName",
        headerName: t("section"),
        minWidth: 160,
        flex: 1,
        renderCell: (params) => renderTooltipValue(params?.row?.sectionName),
      },
      {
        field: "garmentGroupName",
        headerName: t("garmentGroup"),
        minWidth: 180,
        flex: 1,
        renderCell: (params) =>
          renderTooltipValue(params?.row?.garmentGroupName),
      },
      {
        field: "detailDesc",
        headerName: t("detailDescription"),
        minWidth: 240,
        flex: 1.5,
        renderCell: (params) => renderTooltipValue(params?.row?.detailDesc),
      },
      {
        field: "fn",
        headerName: t("fn"),
        minWidth: 110,
        flex: 1,
        renderCell: (params) => renderTooltipValue(params?.row?.fn),
      },
      {
        field: "active",
        headerName: t("active"),
        minWidth: 110,
        flex: 1,
        renderCell: (params) => renderTooltipValue(params?.row?.active),
      },
      {
        field: "clubMemberStatus",
        headerName: t("clubMemberStatus"),
        minWidth: 180,
        flex: 1,
        renderCell: (params) =>
          renderTooltipValue(params?.row?.clubMemberStatus),
      },
      {
        field: "fashionNewsFrequency",
        headerName: t("fashionNewsFrequency"),
        minWidth: 190,
        flex: 1,
        renderCell: (params) =>
          renderTooltipValue(params?.row?.fashionNewsFrequency),
      },
      {
        field: "age",
        headerName: t("age"),
        minWidth: 100,
        flex: 1,
        type: "number",
        renderCell: (params) => renderTooltipValue(params?.row?.age),
      },
      {
        field: "postalCode",
        headerName: t("postalCode"),
        minWidth: 140,
        flex: 1,
        renderCell: (params) => renderTooltipValue(params?.row?.postalCode),
      },
    ],
    [t],
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
          heading={pageTitle}
          links={[
            { name: t("homepage"), href: paths.dashboard.root },
            {
              name: pageTitle,
              href: paths.elastic.hmTransactionsData,
            },
          ]}
          sx={{ mb: { xs: 1, md: 1 } }}
        />
        <div style={{ height: "100%" }}>
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
      </DashboardContent>
    </>
  );
};

export default HMTransactionsElasticData;
