import {
  Box,
  Button,
  Card,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";
import { varAlpha } from "minimal-shared/utils";
import { useCallback, useEffect, useState } from "react";
import { Label } from "src/components/label";
import { Iconify } from "src/components/iconify";
import { injectReducer } from "src/store";
import reducer from "./store";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserLogsDataReport,
  removeFilter,
  setAuditCategory,
  setStatus,
  upsertFilter,
} from "./store/slice";
import Table from "./table";
import { useParams } from "src/routes/hooks";
import SimpleLoadingScreen from "src/components/loading-screen/simple-loading-screen";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import TableFilter from "./table-filter";
import { useSnackbar } from "notistack";
import notificationService from "src/services/notificationService";

injectReducer("userAccount", reducer);

const LEVEL_KEYS = new Set(["all", "information", "warning", "error"]);

export default function UserLogs({ userId }) {
  const { t } = useTranslation();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [reportLoading, setReportLoading] = useState(false);
  const state = useSelector((state) => state.userAccount.state);
  const { status, auditCategory, loading, aggregations } = useSelector(
    (store) => store.userAccount.state,
  );
  const [progress, setProgress] = useState(0);
  const dispatch = useDispatch();

  const activeTab = auditCategory !== "all" ? auditCategory : status;

  const tabItems = [
    { value: "all", label: t("all"), group: "level" },
    { value: "information", label: t("information"), group: "level" },
    { value: "warning", label: t("careful"), group: "level" },
    { value: "error", label: t("errors"), group: "level" },
    {
      value: "login",
      label: t("logins"),
      group: "audit",
      icon: "solar:login-3-bold",
    },
    {
      value: "logout",
      label: t("logouts"),
      group: "audit",
      icon: "solar:logout-3-bold",
    },
    {
      value: "passwordChange",
      label: t("passwordChanges"),
      group: "audit",
      icon: "solar:lock-password-bold",
    },
    {
      value: "accessLevelChange",
      label: t("accessLevelChanges"),
      group: "audit",
      icon: "solar:shield-user-bold",
    },
    {
      value: "failedLogin",
      label: t("failedLoginAttempts"),
      group: "audit",
      icon: "solar:danger-triangle-bold",
    },
  ];

  useEffect(() => {
    if (userId) {
      dispatch(
        upsertFilter({
          type: 0,
          propertyName: "fields.UserId",
          operator: 0,
          value: userId,
          caseSensitive: false,
        }),
      );
    }
  }, [userId]);

  useEffect(() => {
    if (id) {
      dispatch(
        upsertFilter({
          type: 0,
          propertyName: "fields.UserId",
          operator: 0,
          value: id,
          caseSensitive: false,
        }),
      );
    }
  }, [id]);

  useEffect(() => {
    notificationService.start();
    const unsubscribe = notificationService.onReceiveNotification(
      (notification) => {
        if (notification.type === 6) {
          const msg = notification.message || "";
          let milestone = 0;

          if (msg.includes("25%")) milestone = 25;
          else if (msg.includes("50%")) milestone = 50;
          else if (msg.includes("75%")) milestone = 75;
          else if (msg.includes("100%")) milestone = 100;

          setProgress(milestone);
          if (milestone === 100) {
            setReportLoading(false);
            setProgress(100);
          }
          localStorage.setItem("progress", milestone);
          localStorage.setItem("reportLoading", reportLoading);
        }
      },
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [reportLoading]);

  const handleTabChange = useCallback(
    (_event, newValue) => {
      if (LEVEL_KEYS.has(newValue)) {
        dispatch(setAuditCategory("all"));
        dispatch(setStatus(newValue));

        if (newValue === "all") {
          dispatch(removeFilter({ propertyName: "level", operator: 0 }));
        } else {
          dispatch(
            upsertFilter({
              type: 0,
              propertyName: "level",
              operator: 0,
              value: newValue,
              caseSensitive: false,
            }),
          );
        }
      } else {
        dispatch(setStatus("all"));
        dispatch(removeFilter({ propertyName: "level", operator: 0 }));
        dispatch(setAuditCategory(newValue));
      }
    },
    [dispatch, LEVEL_KEYS],
  );

  const downloadReport = async () => {
    try {
      setReportLoading(true);
      setProgress(0);
      localStorage.setItem("progress", 0);
      localStorage.setItem("reportLoading", true);
      await fetchUserLogsDataReport(state);
      setProgress(100);
      setReportLoading(false);
    } catch (err) {
      enqueueSnackbar(t("downloadFaild"), err, { variant: "error" });
      setReportLoading(false);
      localStorage.setItem("progress", progress);
      localStorage.setItem("reportLoading", false);
    }
  };

  const getTicks = (nCase) => {
    let ticks = aggregations?.find((x) => x.field === "level.raw")
      ?.aggregations[nCase];
    return ticks === undefined ? 0 : ticks;
  };

  const getTotalCount = () =>
    Object.values(
      aggregations?.find((x) => x.field === "level.raw")?.aggregations ?? {},
    )?.reduce((acc, item) => acc + item, 0);

  const getLevelCount = (tabValue) => {
    if (tabValue === "all") return getTotalCount();
    if (tabValue === "information") return getTicks("Information");
    if (tabValue === "warning") return getTicks("Warning");
    if (tabValue === "error") return getTicks("Error");
    return null;
  };

  const getLevelColor = (tabValue) => {
    if (tabValue === "information") return "info";
    if (tabValue === "warning") return "warning";
    if (tabValue === "error") return "error";
    return "default";
  };

  return (
    <>
      {loading && <SimpleLoadingScreen />}
      {reportLoading && (
        <Tooltip title={`${progress}% progress`}>
          <LinearProgress
            value={progress}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
            }}
            variant="determinate"
          />
        </Tooltip>
      )}

      <Card>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2.5,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={[
              (theme) => ({
                px: 2.5,
                boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey["500Channel"], 0.08)}`,
              }),
            ]}
          >
            {tabItems.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                iconPosition={tab.group === "audit" ? "start" : "end"}
                label={tab.label}
                icon={
                  tab.group === "level" ? (
                    <Label
                      variant={
                        ((tab.value === "all" || tab.value === activeTab) &&
                          "filled") ||
                        "soft"
                      }
                      color={getLevelColor(tab.value)}
                    >
                      {getLevelCount(tab.value)}
                    </Label>
                  ) : (
                    <Iconify icon={tab.icon} width={20} />
                  )
                }
                sx={tab.group === "audit" ? { minHeight: 48 } : {}}
              />
            ))}
          </Tabs>

          <Button
            variant="outlined"
            size="medium"
            sx={{
              ml: "auto",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onClick={() => downloadReport()}
          >
            <Iconify icon="solar:import-bold" />
            {t("donwloadReport")}
          </Button>
        </Box>

        <TableFilter />
        <Table userId={userId} />
        <Outlet />
      </Card>
    </>
  );
}
