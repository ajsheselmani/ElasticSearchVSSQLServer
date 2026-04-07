import { merge } from "es-toolkit";

import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

import { AuthCenteredContent } from "./content";
import { MainSection } from "../core/main-section";
import { LayoutSection } from "../core/layout-section";
import { HeaderSection } from "../core/header-section";
// import { SettingsButton } from "../components/settings-button";
import { useLocation } from "react-router";
import { LanguagePopover } from "../components/language-popover";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CONFIG } from "../../global-config";

// ----------------------------------------------------------------------

export function AuthCenteredLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = "md",
}) {
  const { t } = useTranslation();
  const renderHeader = () => {
    const headerSlotProps = { container: { maxWidth: false } };

    const headerSlots = {
      topArea: (
        <Alert severity="info" sx={{ display: "none", borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <>
          {/** @slot Logo */}
          {/* <Logo /> {CONFIG.appName} */}
        </>
      ),
      rightArea: (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          <Tooltip title={t("language")} placement="bottom">
            <LanguagePopover
              data-testid="language-btn"
              data={[
                { value: "sq", label: "Shqip", countryCode: "AL" },
                { value: "en", label: "English", countryCode: "GB" },
                { value: "sr", label: "Serbian", countryCode: "SR" },
              ]}
            />
          </Tooltip>
          {/** @slot Settings button */}
          <Tooltip title={t("settings")} placement="bottom">
            {/* <SettingsButton /> */}
          </Tooltip>
        </Box>
      ),
    };

    return (
      <HeaderSection
        disableElevation
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={[
          { position: { [layoutQuery]: "fixed" } },
          ...(Array.isArray(slotProps?.header?.sx)
            ? (slotProps?.header?.sx ?? [])
            : [slotProps?.header?.sx]),
        ]}
      />
    );
  };
  const location = useLocation();

  const renderFooter = () => null;

  const renderMain = () => (
    <MainSection
      {...slotProps?.main}
      sx={[
        (theme) => ({
          alignItems: "center",
          p: theme.spacing(3, 2, 10, 2),
          [theme.breakpoints.up(layoutQuery)]: {
            justifyContent: "center",
            p: theme.spacing(10, 0, 10, 0),
          },
        }),
        ...(Array.isArray(slotProps?.main?.sx)
          ? (slotProps?.main?.sx ?? [])
          : [slotProps?.main?.sx]),
      ]}
    >
      <AuthCenteredContent {...slotProps?.content}>
        {children}
      </AuthCenteredContent>
    </MainSection>
  );

  return (
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={{
        "--layout-auth-content-width":
          location.pathname === "/auth/jwt/sign-up" ? "600px" : "420px",
        ...cssVars,
      }}
      sx={[
        (theme) => ({
          position: "relative",
          "&::before": backgroundStyles(theme),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
    </LayoutSection>
  );
}

// ----------------------------------------------------------------------

const backgroundStyles = (theme) => ({
  ...theme.mixins.bgGradient({
    images: [
      `url(${CONFIG.assetsDir}/assets/background/background-3-blur.webp)`,
    ],
  }),
  zIndex: 1,
  opacity: 0.24,
  width: "100%",
  height: "100%",
  content: "''",
  position: "absolute",
  ...theme.applyStyles("dark", {
    opacity: 0.08,
  }),
});
