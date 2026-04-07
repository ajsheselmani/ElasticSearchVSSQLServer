import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Divider,
  Chip,
  Box,
  TextField,
  Tooltip,
} from "@mui/material";
import { GridCloseIcon } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import axiosInstance from "src/lib/axios";
import moment from "moment";

export default function LogDetails() {
  const { t } = useTranslation();
  const { logId } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(true);
  const [logData, setLogData] = useState(null);

  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };
  const searchParamsNew = {
    filter: [
      {
        PropertyName: "_id",
        Value: logId,
      },
    ],
  };
  const page = 0;
  const pageSize = 1;
  const query = null;
  const fetchData = async () => {
    try {
      const response = await axiosInstance.put(
        `/Administration/Index/Search-New?page=${page}&pageSize=${pageSize}&query=${encodeURIComponent(query || "")}`,
        JSON.stringify(searchParamsNew),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      setLogData(response.data.hits[0]);
      return response.data.hits;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!open) return;
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [logId]);

  const getLevelColor = (level) => {
    switch (level) {
      case "Information":
        return { color: "info", label: t("information") };
      case "Warning":
        return { color: "warning", label: t("careful") };
      case "Error":
        return { color: "error", label: t("errors") };
      default:
        return { color: "default", label: level };
    }
  };

  const { color, label } = getLevelColor(logData?.level || "");
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Typography variant="h6"> {t("logDetails")}</Typography>
          <Chip color={color} label={label} size="small" />
        </div>
        <IconButton size="small" onClick={handleClose}>
          <GridCloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent dividers>
        <Box mb={2}>
          <div className="my-4 grid grid-cols-3 gap-4">
            <TextField
              fullWidth
              label={t("logId")}
              value={logData?.id ?? ""}
              variant="outlined"
              size="small"
              aria-readonly
            />
            <TextField
              fullWidth
              label={t("roles")}
              value={logData?.fields?.role ?? ""}
              variant="outlined"
              size="small"
              aria-readonly
            />
            <TextField
              fullWidth
              label={t("email")}
              value={logData?.fields?.email ?? ""}
              variant="outlined"
              size="small"
              aria-readonly
            />
            <TextField
              fullWidth
              label={t("username")}
              value={logData?.fields?.userFullName ?? ""}
              variant="outlined"
              size="small"
              aria-readonly
            />
            <Tooltip title={logData?.fields?.userId || ""} placement="top">
              <TextField
                fullWidth
                label={t("userId")}
                value={logData?.fields?.userId ?? ""}
                variant="outlined"
                size="small"
                aria-readonly
              />
            </Tooltip>
            <TextField
              fullWidth
              label={t("tablename")}
              value={logData?.fields?.name ?? ""}
              variant="outlined"
              size="small"
              aria-readonly
            />
            <TextField
              fullWidth
              label={t("requestId")}
              value={logData?.fields?.requestId ?? ""}
              variant="outlined"
              size="small"
              aria-readonly
            />
            <TextField
              fullWidth
              label={t("requestPath")}
              value={logData?.fields?.requestPath ?? ""}
              variant="outlined"
              size="small"
              aria-readonly
            />
            <Tooltip title={logData?.fields?.actionId || ""} placement="top">
              <TextField
                fullWidth
                label={t("actionId")}
                value={logData?.fields?.actionId ?? ""}
                variant="outlined"
                size="small"
                aria-readonly
              />
            </Tooltip>
            <Tooltip title={logData?.fields?.actionName || ""} placement="top">
              <TextField
                fullWidth
                label={t("actionName")}
                value={logData?.fields?.actionName ?? ""}
                variant="outlined"
                size="small"
                aria-readonly
              />
            </Tooltip>
            <TextField
              fullWidth
              label={t("environment")}
              value={logData?.fields?.environment ?? ""}
              variant="outlined"
              size="small"
              aria-readonly
            />
            <TextField
              fullWidth
              label={t("date")}
              value={
                logData?.timestamp
                  ? moment(logData.timestamp).format("DD/MM/YYYY HH:mm:SS")
                  : ""
              }
              variant="outlined"
              size="small"
              aria-readonly
            />
          </div>
          <div className="grid grid-cols-1 gap-2 ">
            <TextField
              fullWidth
              label={t("notificationMessage")}
              value={logData?.message ?? ""}
              variant="outlined"
              size="small"
              aria-readonly
              multiline
            />
          </div>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
