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

LicenseInfo.setLicenseKey(import.meta.env.VITE_DATAGRID_KEY);

const SQLData = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [filter, setFilter] = React.useState([]);
  const [logicType, setLogicalType] = React.useState(null);
  const [data, setData] = React.useState([]);
  const [totalCount, setTotalCount] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const bankDatasetData = await axiosInstance.get(
          "/SQLData/GetAllBankData",
          {
            params: {
              page: page + 1,
              pageSize,
            },
          },
        );
        // console.log(bankDatasetData, "bankDatasetData");
        setTotalCount(bankDatasetData?.data?.totalCount ?? 0);
        setData(bankDatasetData.data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, page, pageSize]);

  const rowsWithId =
    data &&
    data?.items?.map((row, index) => ({
      ...row,
      id: page * pageSize + index,
    }));

  const nameLocale = useMemo(() => {
    if (user.language === 1) return "nameSq";
    if (user.language === 3) return "nameSr";
    return "nameEn";
  }, [user.language]);

  const allColumns = useMemo(
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
        field: "date",
        headerName: t("date"),
        flex: 1,
        minWidth: 150,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const rawDate = params?.row?.date;
          if (!rawDate) return "";

          const date = new Date(rawDate);

          const dateFormated = new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
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
        field: "domain",
        headerName: t("domain"),
        flex: 1,
        minWidth: 180,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const domain = params?.row?.domain;
          return (
            <Tooltip title={domain} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {domain}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "location",
        headerName: t("location"),
        flex: 1,
        minWidth: 180,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const location = params?.row?.location;
          return (
            <Tooltip title={location} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {location}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "value",
        headerName: t("value"),
        flex: 1,
        minWidth: 130,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const value = params?.row?.value + " " + "$";
          return (
            <Tooltip title={value} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {value}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "transactionCount",
        headerName: t("transaction"),
        flex: 1,
        minWidth: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const transactionCount = params?.row?.transactionCount;
          return (
            <Tooltip title={transactionCount} arrow>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {transactionCount}
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [t, page, pageSize],
  );

  const columns = allColumns;

  const onFilterChange = React.useCallback(
    () =>
      debounce((filterModel) => {
        setPage(0);
        if (filterModel.items.length > 0) {
          const validFilters = filterModel.items.filter((item) => {
            if (["isEmpty", "isNotEmpty"].includes(item.operator)) return true;
            if (Array.isArray(item.value)) return item.value.length > 0;
            return (
              item.value !== undefined &&
              item.value !== null &&
              item.value !== ""
            );
          });

          setFilter(validFilters);
          setLogicalType(filterModel.logicOperator);
        } else {
          setFilter([]);
          setLogicalType(null);
        }
      }, 1000),
    [nameLocale],
  );

  return (
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
        paginationModel={{
          page: page,
          pageSize: pageSize,
        }}
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
        onFilterModelChange={onFilterChange}
        slotProps={{
          toolbar: {
            filter,
            logicType,
            columns,
          },
        }}
      />
    </div>
  );
};

export default SQLData;
