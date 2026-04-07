import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  get2faCode,
  getAuthenticatorKey,
  setUpCode,
} from "src/auth/context/jwt";
import * as Yup from "yup";
import RecoveryCodes from "./recoveryCodes";
import { Form, Formik } from "formik";
import { Button, TextField, Typography, Card, useTheme } from "@mui/material";
import QRCode from "react-qr-code";
import { useSnackbar } from "notistack";
import { useAuthContext } from "src/auth/hooks";

const SetUpTwoFA = () => {
  const disableSubmit = false;
  const [secretKey, setSecretKey] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const twoFAEnable = user?.twoFactorEnabled;
  const theme = useTheme();

  const validationSchema = Yup.object().shape({
    code: Yup.string().required(t("required")),
  });

  const getCode = async () => {
    if (!twoFAEnable) {
      const response = await get2faCode();
      if (response.status == 200) {
        setQrCode(response.data.authQrCode);
        setSecretKey(response.data.sharedKey);
      } else {
        enqueueSnackbar(t("errorDuringResetAuthentication"), {
          variant: "error",
        });
      }
    } else {
      const result = await getAuthenticatorKey();
      if (result.status == 200) {
        setQrCode(result.data.authQrCode);
        setSecretKey(result.data.sharedKey);
      } else {
        enqueueSnackbar(t("errorDuringSetUpAuthentication"), {
          variant: "error",
        });
      }
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      getCode();
    }, 0);

    return () => clearTimeout(id);
  }, [getCode]);

  const onSetUpCode = async (values, setSubmitting) => {
    setSubmitting(true);
    const response = await setUpCode(values);

    if (response.status == 200) {
      setRecoveryCodes(response.data);
      setSubmitting(true);
      window.location.reload();
    } else {
      enqueueSnackbar(response.response.data, {
        variant: "error",
      });
    }
    setSubmitting(false);
  };

  if (recoveryCodes.length > 0) {
    return <RecoveryCodes recoveryCodes={recoveryCodes} />;
  } else {
    return (
      <>
        <div className=" mx-[6%] ">
          <Card className="shadow-md rounded-2xl">
            <div className="m-4">
              <Typography variant="h3" gutterBottom>
                {t("configureAuthentication")}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {t("useAuthAppToGoInThisStep")}
              </Typography>
              <ol>
                <li>{t("downloadAuthAppsDesc")}</li>
                <li>
                  {t("scanQRCode")}
                  <i>
                    {"  "}
                    <Typography
                      component="span"
                      variant="body1"
                      fontWeight="bold"
                    >
                      {secretKey}
                    </Typography>
                  </i>
                  {"  "}
                  {t("scanQRCodeCont")}
                </li>

                <QRCode className="m-3 w-20 h-20" value={qrCode} />
                <li>{t("unicCodeDesc")}</li>

                <br />
                <div className="flex flex-start">
                  <Formik
                    initialValues={{
                      code: "",
                    }}
                    validationSchema={validationSchema}
                    onSubmit={(values, { setSubmitting }) => {
                      if (!disableSubmit) {
                        onSetUpCode(values, setSubmitting);
                      } else {
                        setSubmitting(false);
                      }
                    }}
                  >
                    {({ touched, errors, isSubmitting, getFieldProps }) => (
                      <Form>
                        <TextField
                          type="text"
                          name="code"
                          placeholder={t("code")}
                          margin="normal"
                          {...getFieldProps("code")}
                          error={touched.code && Boolean(errors.code)}
                          helperText={touched.code && errors.code}
                          autoComplete="off"
                          variant="outlined"
                          id="outlined-basic"
                        />
                        <br />
                        <div className="flex items-center w-full mt-2 z-10 relative">
                          <Button
                            variant="contained"
                            size="large"
                            loading={isSubmitting}
                            type="submit"
                            fullWidth
                            sx={{
                              backgroundColor: theme.palette.primary.main,
                              "&:hover": {
                                backgroundColor: theme.palette.primary.dark,
                              },
                            }}
                            disabled={isSubmitting || disableSubmit}
                          >
                            {isSubmitting ? t("verifying") : t("verify")}
                          </Button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </ol>
            </div>
          </Card>
        </div>
      </>
    );
  }
};

export default SetUpTwoFA;
