import { Button, Card } from "@mui/material";
import { LicenseInfo } from "@mui/x-data-grid-pro";
import { useTranslation } from "react-i18next";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { Iconify } from "src/components/iconify";
import { DashboardContent } from "src/layouts/dashboard";
import { RouterLink } from "src/routes/components";
import { paths } from "src/routes/paths";
import React from "react";
import UserTable from "./userTable";
import { Outlet, useParams } from "react-router";
import UserNewEditForm from "./user-new-edit-form";
import { CONFIG } from "../../../global-config";

LicenseInfo.setLicenseKey(import.meta.env.VITE_DATAGRID_KEY);

export default function Index() {
  const { t } = useTranslation();
  const { id } = useParams();

  const metadata = {
    title: `${!id ? t("userList") : id === "create" ? t("registerUser") : t("UserEdit")} - ${CONFIG.appName}`,
  };

  return (
    <>
      <title>{metadata.title}</title>
      <DashboardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <CustomBreadcrumbs
          heading={
            !id
              ? t("userList")
              : id === "create"
                ? t("registerUser")
                : t("UserEdit")
          }
          links={[
            { name: t("homepage"), href: paths.dashboard.root },
            { name: t("users"), href: paths.administration.user },
            {
              name: !id
                ? t("userList")
                : id === "create"
                  ? t("registers")
                  : t("changes"),
            },
          ]}
          action={
            <Button
              component={RouterLink}
              href="create"
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t("addNewUser")}
            </Button>
          }
          sx={{ mb: { xs: 1, md: 1 } }}
        />
        <Card>{!id ? <UserTable /> : <UserNewEditForm />}</Card>
        <Outlet />
      </DashboardContent>
    </>
  );
}
