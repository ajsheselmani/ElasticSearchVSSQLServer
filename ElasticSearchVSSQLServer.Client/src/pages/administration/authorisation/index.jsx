import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import { Button, Card } from "@mui/material";

import { DataGridPro } from "@mui/x-data-grid-pro";
// import { LicenseInfo } from "@mui/x-license";
import { LicenseInfo } from "@ag-grid-enterprise/core";
import moment from "moment";
import React, { useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router";
import ActionColumn from "./dataGrid/ActionColumn";
import { getDataGridLocale } from "src/locales/custom components/datagrid/utils";
import i18n from "src/locales";
import { useTranslation } from "react-i18next";
import { DashboardContent } from "src/layouts/dashboard";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { Iconify } from "src/components/iconify";
import { paths } from "src/routes/paths";
import { RouterLink } from "src/routes/components";
import { useAuthContext } from "src/auth/hooks";
import { FormAccessService } from "src/services/FormAccessService";
import DataGridToolbar from "./dataGrid/CustomToolbar";
import { CONFIG } from "../../../global-config";

LicenseInfo.setLicenseKey(import.meta.env.VITE_DATAGRID_KEY);

const query = gql`
  query modules {
    modules {
      items {
        nameSq
        nameEn
        nameSr
        moduleId
        insertedDate
        updatedDate
        insertedFromNavigation {
          firstname
          lastname
        }
        moduleOperation {
          moduleOperationId
        }
      }
    }
  }
`;

export default function Index() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const metadata = { title: `${t("moduleList")} - ${CONFIG.appName}` };

  const [getItems, { loading, data }] = useLazyQuery(query);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const nameLocale = useMemo(() => {
    if (user.language === 1) return "nameSq";
    if (user.language === 3) return "nameSr";
    return "nameEn";
  }, [user.language]);
  const [formUserAccess, setFormUserAccess] = React.useState([]);
  const [formRoleAccess, setFormRoleAccess] = React.useState([]);

  React.useEffect(() => {
    async function fetchAccess() {
      try {
        const access = await FormAccessService.getAllFormUserAccess(4, user.id);
        setFormUserAccess(access);
        const roleaccess = await FormAccessService.getAllFormRoleAccess(
          4,
          user.roles[0].id,
        );
        setFormRoleAccess(roleaccess);
      } catch (error) {
        console.error("Failed to fetch form access:", error);
      }
    }

    fetchAccess();
  }, []);
  const allColumns = [
    {
      field: "moduleId",
      headerName: "ID",
      width: 90,
      renderCell: (params) => {
        const rowIndex = Array.from(params.api.getAllRowIds()).indexOf(
          params.id,
        );
        return rowIndex !== -1 ? rowIndex + 1 : "";
      },
    },
    {
      field: [nameLocale],
      headerName: t("module"),
      flex: 1,
    },
    {
      field: "totalActions",
      headerName: t("totalActions"),
      flex: 1,
      valueGetter: (value, row) => row?.moduleOperation.length,
    },
    {
      field: "insertedFrom",
      headerName: t("insertedFrom"),
      flex: 1,
      valueGetter: (value, row) =>
        row?.insertedFromNavigation?.firstname +
        " " +
        row?.insertedFromNavigation?.lastname,
    },
    {
      field: "insertedDate",
      headerName: t("insertedDate"),
      type: "dateTime",
      flex: 1,
      valueFormatter: (params) => moment(params).format("DD/MM/YYYY HH:mm:SS"),
    },
    {
      field: "updatedDate",
      headerName: t("updatedDate"),
      type: "dateTime",
      flex: 1,
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
  ];
  const columns = allColumns.filter((col) => {
    const field = Array.isArray(col.field) ? col.field[0] : col.field;
    const userAccess = formUserAccess.find((item) => item.selector === field);
    const roleAccess = formRoleAccess.find((item) => item.selector === field);

    const canRead = userAccess?.read ?? roleAccess?.read;
    return canRead !== false;
  });
  useEffect(() => {
    getItems();
  }, []);

  useEffect(() => {
    if (location.pathname === "/administration/authorisation") {
      getItems();
    }
  }, [location]);

  return (
    <>
      <title>{metadata.title}</title>

      <DashboardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <CustomBreadcrumbs
          heading={t("moduleList")}
          links={[
            { name: t("homepage"), href: paths.dashboard.root },
            {
              name: t("modules"),
              href: paths.administration.authorisation.index,
            },
            { name: t("list") },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.administration.authorisation.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t("register")}
            </Button>
          }
          sx={{ mb: { xs: 1, md: 1 } }}
        />
        <Card>
          <DataGridPro
            columns={columns}
            rows={data?.modules?.items ?? []}
            getRowId={(item) => item.moduleId}
            pinnedColumns={{ right: ["actions"] }}
            slots={{ toolbar: DataGridToolbar }}
            showToolbar
            isRowSelectable={() => false}
            loading={loading}
            localeText={getDataGridLocale(i18n.language)}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            paginationModel={{
              page: page,
              pageSize: pageSize,
            }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            pagination
          />
        </Card>
        <Outlet />
      </DashboardContent>
    </>
  );
}
