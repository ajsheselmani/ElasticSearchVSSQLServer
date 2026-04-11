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
        minWidth: 180,
        renderCell: (params) => {
          return params?.row?.eventTime;
        },
      },
      {
        field: "eventType",
        headerName: t("eventType"),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          return params?.row?.eventType;
        },
      },
      {
        field: "productId",
        headerName: t("productId"),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          return params?.row?.productId;
        },
      },
      {
        field: "categoryId",
        headerName: t("categoryId"),
        flex: 1,
        minWidth: 130,
        renderCell: (params) => {
          return params?.row?.categoryId;
        },
      },
      {
        field: "categoryCode",
        headerName: t("categoryCode"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          return params?.row?.categoryCode;
        },
      },
      {
        field: "brand",
        headerName: t("brand"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          return params?.row?.brand;
        },
      },
      {
        field: "price",
        headerName: t("price"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          return params?.row?.price;
        },
      },
      {
        field: "userId",
        headerName: t("userId"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          return params?.row?.userId;
        },
      },
      {
        field: "userSession",
        headerName: t("userSession"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          return params?.row?.userSession;
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
  );
};

export default ElectronicsData;
