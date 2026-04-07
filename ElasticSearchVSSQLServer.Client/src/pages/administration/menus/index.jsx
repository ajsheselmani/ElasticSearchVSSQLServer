import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

import { Icon } from "@iconify/react";
import { Alert, Button, Card } from "@mui/material";
import { DataGridPro, LicenseInfo } from "@mui/x-data-grid-pro";
import moment from "moment";
import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { ICONS } from "src/layouts/nav-config-dashboard";
import { useTranslation } from "react-i18next";
import { getDataGridLocale } from "src/locales/custom components/datagrid/utils";

import { CONFIG } from "src/global-config";
import { Iconify } from "src/components/iconify";
import { paths } from "src/routes/paths";
import { RouterLink } from "src/routes/components";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { DashboardContent } from "src/layouts/dashboard";
import { FormAccessService } from "src/services/FormAccessService";
import { useAuthContext } from "src/auth/hooks";
import DataGridToolbar from "./dataGrid/CustomToolbar";

LicenseInfo.setLicenseKey(import.meta.env.VITE_DATAGRID_KEY);

const query = gql`
  query menus {
    menus {
      items {
        active
        icon
        insertedDate
        menuId
        nameEn
        nameSq
        nameSr
        orderNo
        parentId
        path
        type
        updatedDate
        insertedFromNavigation {
          firstname
          lastname
        }
        parent {
          nameSq
          nameEn
          nameSr
        }
      }
    }
  }
`;
export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [getItems, { loading, error, data }] = useLazyQuery(query);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const { user } = useAuthContext();

  const metadata = { title: `${t("menus")} - ${CONFIG.appName}` };
  const [formUserAccess, setFormUserAccess] = React.useState([]);
  const [formRoleAccess, setFormRoleAccess] = React.useState([]);

  React.useEffect(() => {
    async function fetchAccess() {
      try {
        const access = await FormAccessService.getAllFormUserAccess(1, user.id);
        setFormUserAccess(access);
        const roleaccess = await FormAccessService.getAllFormRoleAccess(
          1,
          user.roles[0].id,
        );
        setFormRoleAccess(roleaccess);
      } catch (error) {
        console.error("Failed to fetch form access:", error);
      }
    }

    fetchAccess();
  }, []);
  useEffect(() => {
    getItems();
  }, []);

  useEffect(() => {
    if (location.pathname === "/administration/menu") {
      getItems();
    }
  }, [location]);

  const allColumns = [
    {
      field: "menuId",
      headerName: "ID",
      width: 90,
    },
    {
      field: "nameSq",
      headerName: t("menu"),
      flex: 1,
    },
    {
      field: "groupMenu",
      headerName: t("group"),
      flex: 1,
      renderCell: (params) => params.row.parent?.nameSq ?? "///",
      valueGetter: (value, row) => row.parent?.nameSq ?? "///",
    },
    {
      field: "icon",
      headerName: t("icon"),
      flex: 1,
      renderCell: (params) => (
        <span className="flex items-center w-full justify-center mt-1">
          {params.row.icon in ICONS ? (
            ICONS[params.row.icon]
          ) : (
            <Icon icon={params.row.icon} fontSize={26} />
          )}
        </span>
      ),
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
      minWidth: 120,
      maxWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          className="w-full"
          startIcon={<Icon icon="solar:pen-2-bold" />}
          onClick={() => navigate(`${params.row.menuId}`)}
        >
          {t("edit")}
        </Button>
      ),
    },
  ];

  const columns = allColumns.filter((col) => {
    const userAccess = formUserAccess.find(
      (item) => item.selector === col.field,
    );
    const roleAccess = formRoleAccess.find(
      (item) => item.selector === col.field,
    );
    const canRead = userAccess?.read ?? roleAccess?.read;
    return canRead !== false;
  });

  return (
    <>
      <title>{metadata.title}</title>

      <DashboardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <CustomBreadcrumbs
          heading={t("menus")}
          links={[
            { name: t("homepage"), href: paths.dashboard.root },
            { name: t("menus"), href: paths.administration.menus },
            { name: t("list") },
          ]}
          action={
            <Button
              component={RouterLink}
              href="create"
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t("register")}
            </Button>
          }
          sx={{ mb: { xs: 1, md: 1 } }}
        />
        <Card>
          {error && <Alert severity="error">{error?.message}</Alert>}
          {!error && (
            <DataGridPro
              columns={columns}
              rows={data?.menus?.items ?? []}
              getRowId={(item) => item.menuId}
              pinnedColumns={{ right: ["actions"] }}
              isRowSelectable={() => false}
              loading={loading}
              showToolbar
              pageSizeOptions={[
                5,
                10,
                20,
                50,
                { value: 999999, label: t("all") },
              ]}
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
              localeText={getDataGridLocale(i18n.language)}
            />
          )}
        </Card>
      </DashboardContent>
      <Outlet />
    </>
  );
}
