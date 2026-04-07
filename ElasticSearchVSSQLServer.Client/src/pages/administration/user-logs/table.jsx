import { Button, Chip, Tooltip } from "@mui/material";
import { DataGridPro } from "@mui/x-data-grid-pro";
import { LicenseInfo } from "@mui/x-data-grid-pro";
import moment from "moment";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserLogsData,
  setPage,
  setPageSize,
  setSortOrder,
} from "./store/slice";
import { getDataGridLocale } from "src/locales/custom components/datagrid/utils";
import { Route, Routes, useLocation, useNavigate } from "react-router";
import { Icon } from "@iconify/react";
import LogDetails from "../user/account/logDetails";

LicenseInfo.setLicenseKey(import.meta.env.VITE_DATAGRID_KEY);

const ActionColumn = ({ row }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <Button
      startIcon={<Icon icon="eva:search-fill" width="20" height="20" />}
      onClick={() =>
        navigate(`${row.id}`, {
          state: { background: location },
        })
      }
    >
      {t("details")}
    </Button>
  );
};

export default function Table() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const { hits, totalCount, page, pageSize, sortOrder, filters } = useSelector(
    (store) => store.userLogs,
  );

  useEffect(() => {
    dispatch(fetchUserLogsData());
  }, [page, pageSize, sortOrder, filters]);

  const handleSortChange = (params) =>
    dispatch(
      setSortOrder({
        field:
          params[0].field === "timestamp"
            ? "@" + params[0].field
            : params[0].field,
        sort: params[0].sort,
      }),
    );

  const columns = useMemo(
    () => [
      {
        field: "level",
        flex: 1,
        headerName: t("level"),
        filterable: false,
        minWidth: 120,
        maxWidth: 120,
        renderCell: ({ value }) =>
          (value == "Information" && (
            <Chip color="info" label={t("information")} size="small" />
          )) ||
          (value == "Warning" && (
            <Chip color="warning" label={t("warningg")} size="small" />
          )) ||
          (value == "Error" && (
            <Chip color="error" label={t("errors")} size="small" />
          )) ||
          (value == "Debug" && (
            <Chip color="success" label={t("debug")} size="small" />
          )),
      },
      {
        field: "message",
        flex: 1,
        headerName: t("message"),
        filterable: false,
        sortable: false,
        renderCell: ({ value }) => <Tooltip title={value}>{value}</Tooltip>,
      },
      {
        field: "fields.UserFullName",
        flex: 1,
        headerName: t("userName"),
        minWidth: 150,
        maxWidth: 150,
        align: "center",
        valueGetter: (row, value) => value?.fields?.userFullName,
        renderCell: ({ value }) => (
          <span className="px-2 py-1 !rounded bg-emerald-100 text-center text-emerald-900">
            <Tooltip title={value}>
              {value == " " || value == "" || !value ? "///" : value}
            </Tooltip>
          </span>
        ),
      },
      {
        field: "fields.Role",
        flex: 1,
        headerName: t("group"),
        minWidth: 180,
        maxWidth: 180,
        align: "center",
        valueGetter: (row, value) => value?.fields?.role,
        renderCell: ({ value }) => (
          <span className="px-2 py-1 !rounded bg-blue-100 text-center text-blue-900">
            <Tooltip title={value}>{value ? value : "///"}</Tooltip>
          </span>
        ),
      },
      {
        field: "fields.RequestPath",
        flex: 1,
        headerName: t("requestPath"),
        minWidth: 280,
        maxWidth: 280,
        valueGetter: (row, value) => value?.fields?.requestPath,
        renderCell: ({ value }) => <Tooltip title={value}>{value}</Tooltip>,
      },
      {
        field: "timestamp",
        flex: 1,
        headerName: t("date"),
        filterable: false,
        minWidth: 165,
        maxWidth: 165,
        valueFormatter: (params) =>
          params && moment(params).format("DD/MM/YYYY HH:mm:SS"),
      },
      {
        field: "actions",
        headerName: t("actions"),
        flex: 1,
        maxWidth: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => <ActionColumn row={params.row} />,
      },
    ],
    [t],
  );

  return (
    <>
      <DataGridPro
        rows={hits ?? []}
        columns={columns}
        rowCount={totalCount ?? 0}
        isRowSelectable={() => false}
        localeText={getDataGridLocale(i18n.language)}
        pinnedColumns={{ right: ["actions"] }}
        pageSizeOptions={[10, 20, 50, 100, 200]}
        paginationModel={{
          page: page,
          pageSize: pageSize,
        }}
        onPaginationModelChange={({ page, pageSize }) => {
          dispatch(setPage(page));
          dispatch(setPageSize(pageSize));
        }}
        onSortModelChange={handleSortChange}
        sortingMode="server"
        paginationMode="server"
        pagination
        filterMode="server"
        density="compact"
      />
      <Routes>
        <Route path="/:logId" element={<LogDetails />} />
      </Routes>
    </>
  );
}
