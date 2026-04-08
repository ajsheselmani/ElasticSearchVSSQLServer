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
      <Card
        sx={{
          minWidth: 450,
          mt: 3,
          p: 1,
          borderRadius: 3,
          boxShadow: 3,
          textAlign: "center",
        }}
      >
        <CardContent>
          <div className="flex flex-col items-center justify-center mb-4 gap-2">
            <img src={CONFIG.appLogo} width={84} height={84} />
            <div>
              <div className="text-center">
                <h1 style={{ fontSize: "1.0rem" }}>
                  {t("welcomeToSystem")} {CONFIG.appName}
                </h1>
                <h2 style={{ fontSize: "0.9rem" }}>
                  {t("signInToYourAccount")}
                </h2>
              </div>
            </div>
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
            sx={{ textAlign: { xs: "center", md: "left" } }}
          />

          {!!errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            {renderForm()}
          </Form>

          <div className="mt-2 text-center">
            <p style={{ fontSize: "0.9rem" }}>
              {t("version")} {CONFIG.version}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
