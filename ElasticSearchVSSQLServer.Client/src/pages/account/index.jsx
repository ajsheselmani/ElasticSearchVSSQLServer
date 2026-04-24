import React from "react";
import Profile from "./profile/Profile";
import { Route, Routes } from "react-router";
import { useTranslation } from "react-i18next";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { paths } from "src/routes/paths";

export default function Index() {
  const { t } = useTranslation();

  return (
    <>
      <div className=" mx-[6%]">
        <CustomBreadcrumbs
          heading={t("profile")}
          links={[
            { name: t("dashboard"), href: paths.dashboard.root },
            { name: t("profile") },
          ]}
          sx={{ mb: { xs: 1, md: 3 } }}
        />
      </div>

      <Routes>
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
}
