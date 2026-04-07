import { z as zod } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useBoolean } from "minimal-shared/hooks";
import { zodResolver } from "@hookform/resolvers/zod";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

import { paths } from "src/routes/paths";
import { RouterLink } from "src/routes/components";

import { Iconify } from "src/components/iconify";
import { Form, Field } from "src/components/hook-form";

import { useAuthContext } from "../../hooks";
import { getErrorMessage } from "../../utils";
import { FormHead } from "../../components/form-head";
import { signInWithPassword } from "../../context/jwt";
import { useTranslation } from "react-i18next";
import { CONFIG } from "../../../global-config";
import { Card, CardContent } from "@mui/material";

export function JwtSignInView() {
  const { t } = useTranslation();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState("");

  const SignInSchema = zod.object({
    email: zod.string().min(1, { message: t("required") }),
    password: zod.string().min(1, { message: t("required") }),
  });

  const defaultValues = {
    email: "",
    password: "",
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signInWithPassword({
        email: data.email,
        password: data.password,
        t: t,
      });
      await checkUserSession?.();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: "flex", flexDirection: "column" }}>
      <Field.Text
        name="email"
        label={t("username")}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Box sx={{ gap: 1.5, display: "flex", flexDirection: "column" }}>
        <Link
          component={RouterLink}
          href={paths.auth.jwt.resetPassword}
          variant="body2"
          color="inherit"
          sx={{ alignSelf: "flex-end" }}
        >
          {t("forgotPassword")}
        </Link>

        <Field.Text
          name="password"
          label={t("password")}
          type={showPassword.value ? "text" : "password"}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
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
      </Box>

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t("signIn") + "..."}
        style={{ marginTop: 7 }}
      >
        {t("signIn")}
      </Button>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          height: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          sx={{
            minWidth: 450,
            height: "73vh",
            mt: 3,
            p: 1,
            borderRadius: 3,
            boxShadow: 3,
            textAlign: "center",
          }}
        >
          <CardContent>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "1.10rem",
                }}
              >
                <img
                  src={CONFIG.appLogo}
                  width={150}
                  height={150}
                  style={{
                    borderRadius: "16px",
                    border: "0.5px solid var(--color-border-tertiary)",
                    objectFit: "contain",
                  }}
                />
              </div>

              <p
                style={{
                  margin: "0 0 6px",
                  fontWeight: 500,
                }}
              >
                {t("welcomeToSystem")}: <strong>{CONFIG.appName}</strong>
              </p>

              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                {t("signInToYourAccount")}
              </p>
            </div>
            <FormHead
              description={
                <>
                  {t("noAccount") + " "}
                  <Link
                    component={RouterLink}
                    href={paths.auth.jwt.signUp}
                    variant="subtitle2"
                  >
                    {t("openAccount")}
                  </Link>
                </>
              }
              sx={{ textAlign: "center" }}
            />

            {!!errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}

            <Form methods={methods} onSubmit={onSubmit}>
              {renderForm()}
            </Form>

            <Box sx={{ mt: 2 }}>
              <p style={{ fontSize: "0.8rem", color: "text.secondary" }}>
                {t("version")} {CONFIG.version}
              </p>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
