import { useState } from "react";
import { useBoolean } from "minimal-shared/hooks";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { paths } from "src/routes/paths";
import { RouterLink } from "src/routes/components";
import { Iconify } from "src/components/iconify";
import { FormHead } from "../../components/form-head";
import { Formik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { MenuItem, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import moment from "moment";
import { useSnackbar } from "notistack";
import axiosInstance from "src/lib/axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router";
import PhoneNumberInput from "src/auth/components/PhoneNumberInput";

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const showPassword = useBoolean();
  const showConfirmPassword = useBoolean();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { enqueueSnackbar } = useSnackbar();
  const register_validationSchema = Yup.object().shape({
    personalNumber: Yup.string().required(t("required")),
    gender: Yup.string().required(t("required")),
    firstname: Yup.string().required(t("required")),
    lastname: Yup.string().required(t("required")),
    birthdate: Yup.string().required(t("required")),
    phoneNumber: Yup.string()
      .required(t("required"))
      .matches(
        /^(\+?\d{1,4}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?[\d\s.-]{7,14}$/,
        t("invalidPhoneNumber"),
      ),
    email: Yup.string().email(t("validEmail")).required(t("required")),
    confirmEmail: Yup.string()
      .email(t("validEmail"))
      .oneOf([Yup.ref("email"), null], t("emailNoMatch"))
      .required(t("required")),
    password: Yup.string()
      .required(t("enterYourPassword"))
      .min(3, t("tooShort")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], t("passwordNoMatch"))
      .required(t("required")),
  });

  const onSubmit = async (values) => {
    let languageId = 1;
    if (i18n.language === "sq") {
      languageId = 1;
    } else if (i18n.language === "en") {
      languageId = 2;
    } else if (i18n.language === "sr") {
      languageId = 3;
    }
    const data = {
      ...values,
      birthdate: moment(values.birthdate).toISOString(),
      language: languageId,
      gender: +values.gender,
    };
    const response = await axiosInstance.post("/Administration/User", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (response.status !== 200) {
      var message = response.response.data.message;
      enqueueSnackbar(message, {
        variant: "error",
      });
    } else if (response.status == 200) {
      message = t("dataSavedSuccessfully");
      enqueueSnackbar(message, {
        variant: "success",
      });
      navigate(paths.auth.jwt.signIn);
    }
  };
  const [formValues] = useState({
    personalNumber: "",
    firstname: "",
    lastname: "",
    email: "",
    confirmEmail: "",
    birthdate: "",
    password: "",
    confirmPassword: "",
    language: "",
    gender: "",
    phoneNumber: "",
  });

  return (
    <>
      <FormHead
        title={t("register")}
        description={
          <>
            {t("doYouHaveAnAccount")}{" "}
            <Link
              component={RouterLink}
              href={paths.auth.jwt.signIn}
              variant="subtitle2"
            >
              {t("login")}
            </Link>
          </>
        }
        sx={{ textAlign: { xs: "center", md: "center" } }}
      />
      <Box sx={{ gap: 3, display: "flex", flexDirection: "column" }}>
        <Box sx={{ gap: { xs: 3, sm: 2 } }}>
          <Formik
            initialValues={formValues}
            enableReinitialize="true"
            validationSchema={register_validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
              await onSubmit(values, setSubmitting);
              setSubmitting(false);
            }}
          >
            {({
              errors,
              touched,
              handleChange,
              handleBlur,
              values,
              submitForm,
              setFieldValue,
            }) => (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <TextField
                    fullWidth
                    size="small"
                    className="col-span-2 xl:col-span-1 "
                    label={t("personalNumber")}
                    name="personalNumber"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.personalNumber}
                    error={Boolean(
                      touched.personalNumber && errors.personalNumber,
                    )}
                    helperText={touched.personalNumber && errors.personalNumber}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={t("firstname")}
                    name="firstname"
                    className="col-span-2 xl:col-span-1"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.firstname}
                    error={Boolean(touched.firstname && errors.firstname)}
                    helperText={touched.firstname && errors.firstname}
                  />
                  <TextField
                    fullWidth
                    label={t("lastname")}
                    name="lastname"
                    className="col-span-2 xl:col-span-1"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    size="small"
                    value={values.lastname}
                    error={Boolean(touched.lastname && errors.lastname)}
                    helperText={touched.lastname && errors.lastname}
                  />
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      format="DD/MM/YYYY"
                      label={t("birthdate")}
                      value={values.birthdate ? dayjs(values.birthdate) : null}
                      onChange={(date) => {
                        if (date && date.isValid()) {
                          setFieldValue("birthdate", date.toDate());
                        } else {
                          setFieldValue("birthdate", null);
                        }
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          className: "col-span-2 xl:col-span-1",
                          error: Boolean(touched.birthdate && errors.birthdate),
                          helperText: touched.birthdate && errors.birthdate,
                        },
                      }}
                    />
                  </LocalizationProvider>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("email")}
                    name="email"
                    type="email"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="col-span-2 xl:col-span-1"
                    value={values.email}
                    error={Boolean(touched.email && errors.email)}
                    helperText={touched.email && errors.email}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={t("confirmEmail")}
                    name="confirmEmail"
                    type="confirmEmail"
                    className="col-span-2 xl:col-span-1"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.confirmEmail}
                    error={Boolean(touched.confirmEmail && errors.confirmEmail)}
                    helperText={touched.confirmEmail && errors.confirmEmail}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={t("password")}
                    type={showPassword.value ? "text" : "password"}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="col-span-2 xl:col-span-1"
                    name="password"
                    value={values.password}
                    error={Boolean(touched.password && errors.password)}
                    helperText={touched.password && errors.password}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={showPassword.onToggle}
                              edge="end"
                            >
                              <Iconify
                                icon={
                                  showPassword.value
                                    ? "solar:eye-bold"
                                    : "solar:eye-closed-bold"
                                }
                              />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t("confirmPassword")}
                    name="confirmPassword"
                    onChange={handleChange}
                    className="col-span-2 xl:col-span-1"
                    size="small"
                    onBlur={handleBlur}
                    value={values.confirmPassword}
                    error={Boolean(
                      touched.confirmPassword && errors.confirmPassword,
                    )}
                    helperText={
                      touched.confirmPassword && errors.confirmPassword
                    }
                    type={showConfirmPassword.value ? "text" : "password"}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={showConfirmPassword.onToggle}
                              edge="end"
                            >
                              <Iconify
                                icon={
                                  showConfirmPassword.value
                                    ? "solar:eye-bold"
                                    : "solar:eye-closed-bold"
                                }
                              />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    select
                    fullWidth
                    label={t("gender")}
                    name="gender"
                    value={values.gender}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    size="small"
                    className="col-span-2 xl:col-span-1"
                    error={Boolean(touched.gender && errors.gender)}
                    helperText={touched.gender && errors.gender}
                  >
                    <MenuItem value={1}>{t("male")}</MenuItem>
                    <MenuItem value={2}>{t("female")}</MenuItem>
                  </TextField>
                  <PhoneNumberInput
                    label={t("phonenumber")}
                    placeholder="+383 (__) ___-___"
                    value={values.phoneNumber}
                    className="col-span-2 xl:col-span-1"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.phoneNumber && errors.phoneNumber)}
                    helperText={touched.phoneNumber && errors.phoneNumber}
                    fullWidth
                    name="phoneNumber"
                    setFieldValue={setFieldValue}
                    size="small"
                  />
                  <br />
                  <Button
                    variant="contained"
                    className="col-span-2"
                    color="inherit"
                    type="submit"
                    onClick={submitForm}
                  >
                    {t("save")}
                  </Button>
                </div>
              </>
            )}
          </Formik>
        </Box>
      </Box>

      {/* <SignUpTerms /> */}
    </>
  );
}
