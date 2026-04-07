import { Formik, Form } from "formik";
import {
  TextField,
  Button,
  InputAdornment,
  Grid,
  Card,
  Box,
} from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import axiosInstance from "src/lib/axios";
import PasswordInput from "src/components/password/password";
import { useAuthContext } from "src/auth/hooks";

const validationSchema = (t) =>
  Yup.object().shape({
    oldPassword: Yup.string().required(t("pleaseEnterYourOldPassword")),
    newPassword: Yup.string().required(t("pleaseEnterNewPassword")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], t("passwordNoMatch"))
      .required(t("pleaseConfirmPassword")),
  });

const ChangePassword = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [userId, setUserId] = useState(null);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchUsername = () => {
      try {
        setUserId(user.id);
      } catch (error) {
        console.error("Failed to fetch username", error);
        enqueueSnackbar(t("fetchUserErrorMessage"), { variant: "error" });
      }
    };

    fetchUsername();
  }, [enqueueSnackbar, t]);

  const handlePasswordSubmit = async (values, resetForm) => {
    try {
      const res = await axiosInstance.post(
        `/Administration/User/${userId}/ResetPasswordFromAdmin?currentPassword=${encodeURIComponent(values.oldPassword)}&newPassword=${encodeURIComponent(values.newPassword)}`,
      );
      if (res.status === 200) {
        enqueueSnackbar(t("successfullyUpdated"), {
          variant: "success",
        });
        resetForm();
      } else {
        enqueueSnackbar(res?.response?.data?.message ?? t("mistake"), {
          variant: "error",
        });
      }
    } catch (err) {
      enqueueSnackbar(t("mistake"), err, {
        variant: "error",
      });
    }
  };

  return (
    <Box sx={{ marginX: "6%" }}>
      <Card>
        <div className="gap-4 p-4">
          <Formik
            enableReinitialize
            initialValues={{
              userName: user.email,
              oldPassword: "",
              newPassword: "",
              confirmPassword: "",
            }}
            validationSchema={validationSchema(t)}
            onSubmit={(values, { setSubmitting, resetForm }) => {
              handlePasswordSubmit(values, resetForm);
              setSubmitting(false);
            }}
          >
            {({ touched, errors, isSubmitting, values, resetForm }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <TextField
                      disabled
                      id="userName"
                      name="userName"
                      label={t("userName")}
                      value={values.userName}
                      variant="outlined"
                      fullWidth
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccountCircle />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <PasswordInput
                      id="oldPassword"
                      name="oldPassword"
                      label={t("oldPassword")}
                      fullWidth
                      margin="normal"
                      autoComplete="off"
                      error={Boolean(touched.oldPassword && errors.oldPassword)}
                      helperText={touched.oldPassword && errors.oldPassword}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <PasswordInput
                      id="newPassword"
                      name="newPassword"
                      label={t("newPassword")}
                      fullWidth
                      margin="normal"
                      autoComplete="off"
                      error={Boolean(touched.newPassword && errors.newPassword)}
                      helperText={touched.newPassword && errors.newPassword}
                    />
                  </Grid>

                  <Grid item size={{ xs: 12, md: 6 }}>
                    <PasswordInput
                      id="confirmPassword"
                      name="confirmPassword"
                      label={t("confirmPassword")}
                      fullWidth
                      margin="normal"
                      autoComplete="off"
                      error={Boolean(
                        touched.confirmPassword && errors.confirmPassword,
                      )}
                      helperText={
                        touched.confirmPassword && errors.confirmPassword
                      }
                    />
                  </Grid>
                  <div className="flex w-full justify-end space-x-4 mt-6">
                    <Button
                      variant="outlined"
                      color="default"
                      onClick={resetForm}
                      style={{ marginRight: "24px" }}
                    >
                      {t("reset")}
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      loading={isSubmitting}
                    >
                      {t("userUpdatePassword")}
                    </Button>
                  </div>
                </Grid>
              </Form>
            )}
          </Formik>
        </div>
      </Card>
    </Box>
  );
};

export default ChangePassword;
