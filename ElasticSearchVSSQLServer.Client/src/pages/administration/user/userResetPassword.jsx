import { Button, Card, DialogActions, Grid } from "@mui/material";
import { Form, Formik } from "formik";
import { useSnackbar } from "notistack";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import PasswordInput from "src/components/password/password";
import axiosInstance from "src/lib/axios";
import * as Yup from "yup";

const validationSchema = (t) =>
  Yup.object().shape({
    newPassword: Yup.string().required(t("pleaseEnterNewPassword")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], t("passwordNoMatch"))
      .required(t("pleaseConfirmPassword")),
  });

export default function Edit() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const params = useParams();
  const userId = params.id;

  const handlePasswordSubmit = async (values, resetForm) => {
    try {
      const res = await axiosInstance.post(
        `/Administration/User/${userId}/ResetPassword?newPassword=${encodeURIComponent(values.newPassword)}`,
      );
      if (res.status === 200) {
        enqueueSnackbar(t("successfullyUpdated"), {
          variant: "success",
        });
        resetForm();
      } else {
        enqueueSnackbar(res?.response?.data?.message, {
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
    <>
      <Formik
        enableReinitialize
        initialValues={{
          newPassword: "",
          confirmPassword: "",
        }}
        validationSchema={validationSchema(t)}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          handlePasswordSubmit(values, resetForm);
          setSubmitting(false);
        }}
      >
        {({ touched, errors, submitForm }) => (
          <Card>
            <div className="gap-4 p-4">
              <Form>
                <Grid container spacing={2}>
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
                </Grid>
              </Form>
            </div>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Button
                variant="outlined"
                color="default"
                style={{ marginRight: "24px" }}
                type="reset"
              >
                {t("reset")}
              </Button>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                onClick={submitForm}
              >
                {t("userUpdatePassword")}
              </Button>
            </DialogActions>
          </Card>
        )}
      </Formik>
    </>
  );
}
