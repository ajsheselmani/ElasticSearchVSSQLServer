import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import axiosInstance from "src/lib/axios";

export default function SetLockState() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { action } = useParams();
  const [open, setOpen] = React.useState(true);
  const lockUser = action === "lock";
  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };
  const params = useParams();
  const userId = params.tId;
  const lockState = async () => {
    const result = await axiosInstance.put(
      `/Administration/User/SetLockStatus?userId=${userId}&lockUser=${lockUser}`,
    );

    if (result.status === 200) {
      enqueueSnackbar(t("dataSavedSuccessfully"), {
        variant: "success",
        timeduration: 1000,
      });
      handleClose();
    } else {
      var message = result?.response?.data?.title ?? t("errorOccurred");
      enqueueSnackbar(message, {
        variant: "error",
      });
    }
  };
  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
      <DialogTitle>{t("confirmAction")}</DialogTitle>
      <DialogContent>
        <Alert severity="info">
          {lockUser ? t("confirmLockction") : t("confirmUnlockction")}
        </Alert>
      </DialogContent>
      <DialogActions>
        <div className="flex justify-between w-full">
          <Button variant="contained" color="warning" onClick={handleClose}>
            {t("close")}
          </Button>
          <Button
            variant="contained"
            color="error"
            type="submit"
            onClick={lockState}
          >
            {lockUser ? t("locked") : t("unlocked")}
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
