import { LicenseInfo } from "@mui/x-license";
import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo } from "react";
import { useAuthContext } from "src/auth/hooks";
import { getDataGridLocale } from "src/locales/custom components/datagrid/utils";
import i18n from "src/locales";
import { useLocation } from "react-router";
import { debounce } from "lodash";
import axiosInstance from "src/lib/axios";
import { DataGrid } from "@mui/x-data-grid";

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
  const location = useLocation();

  useEffect(() => {
    const loadData = async () => {
      const bankDatasetData = await axiosInstance.get(
        "/SQLData/GetAllBankData",
      );
      // console.log(bankDatasetData, "bankDatasetData");
      setData(bankDatasetData.data);
    };

    loadData();
  }, [user]);

  const rowsWithId =
    data &&
    data?.map((row, index) => ({
      ...row,
      id: index,
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
        minWidth: 180,
        renderCell: (params) => {
          return params?.row?.date;
        },
      },
      {
        field: "domain",
        headerName: t("domain"),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          return params?.row?.domain;
        },
      },
      {
        field: "location",
        headerName: t("location"),
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          return params?.row?.location;
        },
      },
      {
        field: "value",
        headerName: t("value"),
        flex: 1,
        minWidth: 130,
        renderCell: (params) => {
          return params?.row?.value;
        },
      },
      {
        field: "transactionCount",
        headerName: t("transaction"),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          return params?.row?.transactionCount;
        },
      },
    ],
    [t, page, pageSize, nameLocale],
  );

  const columns = allColumns;

  if (location.pathname === "/user") {
    setTotalCount(data.length);
  }

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
      columns={columns}
      rows={rowsWithId}
      getRowId={(item) => item.id}
      pinnedColumns={{ right: ["actions"] }}
      isRowSelectable={() => false}
      showToolbar
      pageSizeOptions={[10, 20, 50, { value: 999999, label: t("all") }]}
      paginationModel={{
        page: page,
        pageSize: pageSize,
      }}
      onPaginationModelChange={(model) => {
        setPage(model.page);
        setPageSize(model.pageSize);
      }}
      pagination
      //   slots={{ toolbar: CustomToolbar }}
      rowCount={totalCount ?? 0}
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

export default SQLData;
