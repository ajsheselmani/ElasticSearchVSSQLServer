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

const ElectronicsData = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [filter, setFilter] = React.useState([]);
  const [logicType, setLogicalType] = React.useState(null);
  const [data, setData] = React.useState([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const electronicsDatasetData = await axiosInstance.get(
          "/SQLData/GetAllElectronicEvents",
          {
            params: {
              page: page + 1,
              pageSize,
            },
          },
        );
        console.log(electronicsDatasetData, "electronicsDatasetData");
        setData(electronicsDatasetData.data);
        setTotalCount(electronicsDatasetData?.data?.totalCount ?? 0);
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
          if (!rawDate) return "";

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
            : "";
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

export default ElectronicsData;
