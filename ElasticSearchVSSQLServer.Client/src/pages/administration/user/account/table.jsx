import { DataGridPro } from "@mui/x-data-grid-pro";
import { LicenseInfo } from "@mui/x-data-grid-pro";
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
import moment from "moment";
import { Box, Chip, Tooltip } from "@mui/material";
import ActionColumn from "./dataGrid/ActionColumn";
import { getAuditMessageText } from "./audit/auditMessageMapper";

LicenseInfo.setLicenseKey(import.meta.env.VITE_DATAGRID_KEY);

const AUDIT_TABS_WITH_REPLACEMENT = new Set([
  "login",
  "logout",
  "accessLevelChange",
  "passwordChange",
  "failedLogin",
]);

export default function Table({ userId }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const {
    hits,
    totalCount,
    page,
    pageSize,
    sortOrder,
    filters,
    auditCategory,
  } = useSelector((store) => store.userAccount.state);

  const shouldReplaceMessage = AUDIT_TABS_WITH_REPLACEMENT.has(auditCategory);

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
            <Chip color="info" label="Informacion" size="small" />
          )) ||
          (value == "Warning" && (
            <Chip color="warning" label="Kujdes" size="small" />
          )) ||
          (value == "Error" && (
            <Chip color="error" label="Gabim" size="small" />
          )),
      },
      {
        field: "message",
        flex: 1,
        headerName: t("message"),
        filterable: false,
        sortable: false,
        renderCell: (params) => {
          const text = shouldReplaceMessage
            ? getAuditMessageText(params.row, t)
            : (params.value ?? "");

          return (
            <Tooltip title={text}>
              <span>{text}</span>
            </Tooltip>
          );
        },
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
      ...(!userId
        ? [
            {
              field: "actions",
              headerName: t("actions"),
              flex: 1,
              maxWidth: 120,
              sortable: false,
              filterable: false,
              renderCell: (params) => <ActionColumn row={params.row} />,
            },
          ]
        : []),
    ],
    [t, userId, shouldReplaceMessage],
  );

  useEffect(() => {
    dispatch(fetchUserLogsData());
  }, [page, pageSize, sortOrder, filters, auditCategory]);

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

  return (
    <Box sx={{ position: "relative" }}>
      <DataGridPro
        rows={hits ?? []}
        columns={columns}
        rowCount={totalCount ?? 0}
        isRowSelectable={() => false}
        localeText={getDataGridLocale(i18n.language)}
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
    </Box>
  );
}
