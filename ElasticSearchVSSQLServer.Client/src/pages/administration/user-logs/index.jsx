import { Card, Tab, Tabs } from "@mui/material";
import { LicenseInfo } from "@mui/x-data-grid-pro";
import { useTranslation } from "react-i18next";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { CONFIG } from "src/global-config";
import { DashboardContent } from "src/layouts/dashboard";
import { paths } from "src/routes/paths";
import { injectReducer } from "src/store";
import reducer, { removeFilter, setStatus, upsertFilter } from "./store/slice";
import Table from "./table";
import SimpleLoadingScreen from "src/components/loading-screen/simple-loading-screen";
import { useDispatch, useSelector } from "react-redux";
import LogsFilter from "./logsFilter";
import { useCallback } from "react";
import { varAlpha } from "minimal-shared/utils";
import { Label } from "src/components/label";

LicenseInfo.setLicenseKey(import.meta.env.VITE_DATAGRID_KEY);
injectReducer("userLogs", reducer);

export default function Index() {
  const { t } = useTranslation();
  const metadata = { title: `${t("userLogs")} - ${CONFIG.appName}` };
  const { status, loading, aggregations } = useSelector(
    (store) => store.userLogs,
  );
  const dispatch = useDispatch();
  const tabItems = [
    { value: "all", label: t("all") },
    { value: "information", label: t("information") },
    { value: "warning", label: t("warningg") },
    { value: "error", label: t("errors") },
    { value: "debug", label: t("debug") },
  ];

  const handleFilterStatus = useCallback(
    (newValue) => {
      dispatch(setStatus(newValue));
      if (newValue == "all")
        dispatch(removeFilter({ propertyName: "level", operator: 0 }));
      else
        dispatch(
          upsertFilter({
            type: 0,
            propertyName: "level",
            operator: 0,
            value: newValue,
            caseSensitive: false,
          }),
        );
    },
    [dispatch],
  );

  const getTicks = (nCase) => {
    let ticks = aggregations?.find((x) => x.field == "level.raw")?.aggregations[
      nCase
    ];
    return ticks == undefined ? 0 : ticks;
  };

  const getTotalCount = () =>
    Object.values(
      aggregations?.find((x) => x.field == "level.raw")?.aggregations ?? {},
    )?.reduce((acc, item) => acc + item, 0);

  return (
    <>
      {loading && <SimpleLoadingScreen />}

      <title>{metadata.title}</title>
      <DashboardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <CustomBreadcrumbs
          heading={t("userLogs")}
          links={[
            { name: t("homepage"), href: paths.dashboard.root },
            { name: t("userLogs"), href: "/administration/userlogs" },
            { name: t("list") },
          ]}
          sx={{ mb: 3 }}
        />
        <Card>
          <Tabs
            value={status}
            onChange={handleFilterStatus}
            sx={[
              (theme) => ({
                px: 2.5,
                boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey["500Channel"], 0.08)}`,
              }),
            ]}
          >
            {tabItems
              .filter(
                (x) =>
                  x.value === "all" ||
                  getTicks(x.value[0].toUpperCase() + x.value.slice(1)) > 0,
              )
              .map((tab) => (
                <Tab
                  key={tab.value}
                  iconPosition="end"
                  value={tab.value}
                  label={tab.label}
                  icon={
                    <Label
                      variant={
                        ((tab.value === "all" || tab.value === status) &&
                          "filled") ||
                        "soft"
                      }
                      color={
                        (tab.value === "information" && "info") ||
                        (tab.value === "warning" && "warning") ||
                        (tab.value === "error" && "error") ||
                        (tab.value === "debug" && "success") ||
                        "default"
                      }
                    >
                      {(tab.value == "all" && getTotalCount()) ||
                        (tab.value == "information" &&
                          getTicks("Information")) ||
                        (tab.value == "warning" && getTicks("Warning")) ||
                        (tab.value == "error" && getTicks("Error")) ||
                        (tab.value == "debug" && getTicks("Debug"))}
                    </Label>
                  }
                />
              ))}
          </Tabs>
          <LogsFilter />
          <Table />
        </Card>
      </DashboardContent>
    </>
  );
}
