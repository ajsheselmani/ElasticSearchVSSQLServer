import { useState, useEffect } from "react";
import { z as zod } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

import { paths } from "src/routes/paths";

// import { PasswordIcon } from "src/assets/icons";

import { Form, Field } from "src/components/hook-form";

import { FormHead } from "../../components/form-head";
import { FormReturnLink } from "../../components/form-return-link";
import { useTranslation } from "react-i18next";
import axiosInstance from "src/lib/axios";
import { useSnackbar } from "notistack";
import { CONFIG } from "../../../global-config";

export function JwtResetPasswordView() {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [emailSent, setEmailSent] = useState(false);

  const defaultValues = {
    email: "",
  };

  const ResetPasswordSchema = zod.object({
    email: zod
      .string()
      .min(1, { message: t("required") })
      .email({ message: t("emailValidation") }),
  });

  const methods = useForm({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    watch,
  } = methods;

  const emailValue = watch("email");

  useEffect(() => {
    if (emailSent && emailValue) {
      setEmailSent(false);
    }
  }, [emailValue, emailSent]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const result = await axiosInstance.post(
        `/Administration/Auth/ResetPasswordEmail?email=${data.email}`,
      );
      if (result.status === 200) {
        setEmailSent(true);
        methods.reset();
      } else {
        var message = result?.response?.data?.message ?? t("errorOccurred");
        enqueueSnackbar(message, { variant: "error" });
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar(t("errorOccurred"), { variant: "error" });
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: "flex", flexDirection: "column" }}>
      {emailSent && (
        <Alert severity="success">{t("checkYourEmailForReset")}</Alert>
      )}

      <Field.Text
        autoFocus
        name="email"
        label={t("email")}
        placeholder="filan_fisteku@gmail.com"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Button
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Send request..."
      >
        {t("sendRequest")}
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        // icon={<PasswordIcon />}
        title={
          <>
            <div style={{ fontWeight: "800" }}>{CONFIG.appName}</div>
            {t("forgotPassword")}
          </>
        }
        description={t("forgotPasswordText")}
      />

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <FormReturnLink href={paths.auth.jwt.signIn} />
      <div className="mt-2 text-center">
        <p style={{ fontSize: "0.9rem" }}>
          {t("version")} {CONFIG.version}
        </p>
      </div>
    </>
  );
}
