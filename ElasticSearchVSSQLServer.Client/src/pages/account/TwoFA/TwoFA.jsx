import { useSnackbar } from "notistack";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  disable2FA,
  resetAuthentication,
  resetRecoveryCodes,
} from "src/auth/context/jwt";
import RecoveryCodes from "./recoveryCodes";
import SetUpTwoFA from "./TwoFASetUp";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  TextField,
  Typography,
} from "@mui/material";
import { useAuthContext } from "src/auth/hooks";
import { Form, Formik } from "formik";
import * as Yup from "yup";

const TwoFA = () => {
  const [setPassword] = useState("");
  const [setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [dialog1IsOpen, setDialog1IsOpen] = useState(false);
  const [dialog2IsOpen, setDialog2IsOpen] = useState(false);
  const [dialog3IsOpen, setDialog3IsOpen] = useState(false);
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const { checkUserSession } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState("");
  const [goto, setGoto] = useState(false);

  const onOpenDialog = (e) => {
    if (e === 1) {
      setDialog1IsOpen(true);
    } else if (e === 2) {
      setDialog2IsOpen(true);
    } else {
      setDialog3IsOpen(true);
    }
  };
  const onCloseDialog = (e) => {
    if (e === 1) {
      setPassword("");
      setCode("");
      setErrorMessage("");
      setDialog1IsOpen(false);
    } else if (e === 2) {
      setDialog2IsOpen(false);
    } else setDialog3IsOpen(false);
  };
  const response = user?.twoFactorEnabled;

  const authenticationResetSchema = Yup.object().shape({
    code: Yup.string().required(t("required")),
    password: Yup.string().required(t("required")),
  });

  const onDialogAuthenticator = async (values, setSubmitting) => {
    const result = await resetAuthentication(values.password, values.code);

    if (result.status === 200) {
      if (typeof result.data === "string") {
        const message = result.data.trim();
        setErrorMessage(message);
        setSubmitting(false);
        return;
      } else {
        enqueueSnackbar(t("resetAuthenticatorSuccess"), { variant: "success" });
        await checkUserSession?.();
      }
      window.location.reload();
    } else {
      setErrorMessage(t("errorDuringResetAuthentication1"));
      setDialog1IsOpen(true);
      setSubmitting(false);
    }
  };

  const GoToSetUp = async () => {
    setGoto(true);
  };

  const on2FADisableDialog = async () => {
    await checkUserSession?.();
    const result = await disable2FA();

    if (result.status == 200) {
      enqueueSnackbar(t("2FADisabledSuccessfully"), {
        variant: "success",
      });
      window.location.reload();
    } else {
      enqueueSnackbar(t("errorDuring2FADisable"), {
        variant: "error",
      });
    }
  };

  const onDialogRecoveryCode = async () => {
    setDialog2IsOpen(false);
    const result = await resetRecoveryCodes();

    if (result.status == 200) {
      setRecoveryCodes(result.data.recoveryCodes);
      enqueueSnackbar(t("resetAuthenticatorSuccess"), {
        variant: "success",
      });
    } else {
      enqueueSnackbar(t("errorDuringResetAuthentication"), {
        variant: "error",
      });
    }
  };

  const buttonStyles = {
    margin: 2,
    width: "350px",
    px: 3,
    py: 1.5,
    borderRadius: 2,
    boxShadow: 2,
    fontWeight: 500,
    textTransform: "none",
    "&:hover": {
      borderColor: "rgba(0,0,0,0.4)",
    },
  };
  if (goto || !response) {
    return <SetUpTwoFA />;
  }
  if (recoveryCodes.length > 0) {
    return (
      <div className=" mx-[6%]">
        <Card>
          <RecoveryCodes recoveryCodes={recoveryCodes} />
        </Card>
      </div>
    );
  }
  return (
    <div className=" mx-[6%]  my-4">
      <Card className="p-3 shadow-md rounded-2xl">
        <div className="flex flex-col items-center w-full space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-1">
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => onOpenDialog(1)}
              sx={buttonStyles}
            >
              {t("resetAuthenticator")}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => onOpenDialog(2)}
              sx={buttonStyles}
            >
              {t("resetRecoveryCodes")}
            </Button>
            {response ? (
              <>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={GoToSetUp}
                  sx={buttonStyles}
                >
                  {t("setUpAuthApp")}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => onOpenDialog(3)}
                  sx={buttonStyles}
                >
                  {t("disable2fa")}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <Dialog open={dialog1IsOpen} onClose={() => onCloseDialog(1)}>
          <Box
            sx={{ m: 2, maxWidth: 600, p: 3, borderRadius: 4 }}
            color="default"
          >
            <Typography
              variant="h4"
              sx={{ mb: 2, color: "error.main", fontWeight: "600" }}
            >
              {t("resetAuthenticatorKey")}
            </Typography>

            <Typography variant="body1" sx={{ mb: 1, color: "text.primary" }}>
              <Box component="span" sx={{ color: "warning.main", mr: 1 }}>
                ⚠️
              </Box>
              <Box component="strong" sx={{ color: "error.main" }}>
                {t("afterAuthKeyReset")}
              </Box>
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("disable2FA")}
            </Typography>

            <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
              {t("writePasswordAndCode")}
            </Typography>
            {!!errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}
            <Formik
              initialValues={{
                code: "",
                password: "",
              }}
              validationSchema={authenticationResetSchema}
              onSubmit={(values, { setSubmitting }) => {
                onDialogAuthenticator(values, setSubmitting);
              }}
            >
              {({ values, errors, touched, handleChange }) => (
                <Form>
                  <div className="flex flex-row gap-2 items-center justify-center mt-4">
                    <TextField
                      label={t("password")}
                      type="password"
                      name="password"
                      value={values.password}
                      onChange={handleChange}
                      error={Boolean(touched.password && errors.password)}
                      helperText={touched.password && errors.password}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      label={t("code")}
                      name="code"
                      value={values.code}
                      onChange={handleChange}
                      error={Boolean(touched.code && errors.code)}
                      helperText={touched.code && errors.code}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </div>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 5,
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="default"
                      onClick={() => onCloseDialog(1)}
                    >
                      {t("no")}
                    </Button>
                    <Button variant="contained" color="primary" type="submit">
                      {t("yes")}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          </Box>
        </Dialog>
        <Dialog open={dialog2IsOpen} onClose={() => onCloseDialog(2)}>
          <Box
            sx={{ m: 2, maxWidth: 600, p: 3, borderRadius: 4 }}
            color="default"
          >
            <Typography
              variant="h4"
              sx={{ mb: 2, color: "primary.main", fontWeight: "600" }}
            >
              {t("twoFactorAuthRecCodes")}
            </Typography>

            <Typography variant="body2" sx={{ mb: 4, color: "text.secondary" }}>
              {t("newCodeIfYouLoseThem")}
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 5,
              }}
            >
              <Button
                variant="outlined"
                sx={{
                  color: "black",
                  borderColor: "black",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                    borderColor: "black",
                  },
                }}
                onClick={() => onCloseDialog(2)}
              >
                {t("no")}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={onDialogRecoveryCode}
              >
                {t("yes")}
              </Button>
            </Box>
          </Box>
        </Dialog>
        <Dialog
          maxWidth="md"
          open={dialog3IsOpen}
          onClose={() => onCloseDialog(3)}
        >
          <Box sx={{ m: 1, maxWidth: 800, p: 3, borderRadius: 4 }}>
            <Typography
              variant="h4"
              sx={{ mb: 2, color: "primary.main", fontWeight: "600" }}
            >
              {t("disable2fa")}
            </Typography>

            <Typography variant="h6" sx={{ mb: 4, color: "text.secondary" }}>
              {t("2faDisableTitle")}
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: "text.secondary" }}>
              {t("2faDisableText")}
              <Button
                onClick={() => {
                  onOpenDialog(1);
                  setDialog3IsOpen(false);
                }}
                sx={{ color: "primary.main" }}
                variant="body2"
              >
                {t("resetingAuthenticatorKey")}
              </Button>
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 5,
              }}
            >
              <Button
                variant="outlined"
                color="default"
                onClick={() => onCloseDialog(3)}
              >
                {t("no")}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={on2FADisableDialog}
              >
                {t("yes")}
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Card>
    </div>
  );
};

export default TwoFA;
