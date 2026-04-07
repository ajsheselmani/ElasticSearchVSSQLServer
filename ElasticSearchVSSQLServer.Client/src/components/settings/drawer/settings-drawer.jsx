import { useEffect, useCallback, useState } from "react";
import { hasKeys, varAlpha } from "minimal-shared/utils";

import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import Drawer from "@mui/material/Drawer";
import SvgIcon from "@mui/material/SvgIcon";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useColorScheme } from "@mui/material/styles";

import { themeConfig } from "src/theme/theme-config";
import { primaryColorPresets } from "src/theme/with-settings";

import { settingIcons } from "./icons";
import { Iconify } from "../../iconify";
import { BaseOption } from "./base-option";
import { Scrollbar } from "../../scrollbar";
import { SmallBlock, LargeBlock } from "./styles";
import { PresetsOptions } from "./presets-options";
import { FullScreenButton } from "./fullscreen-button";
import { FontSizeOptions, FontFamilyOptions } from "./font-options";
import { useSettingsContext } from "../context/use-settings-context";
import { NavColorOptions, NavLayoutOptions } from "./nav-layout-option";
import { useTranslation } from "react-i18next";
import { LoadingScreen } from "src/components/loading-screen";
import { useSelector } from "react-redux";

// ----------------------------------------------------------------------

export function SettingsDrawer({ sx, defaultSettings }) {
  const settings = useSettingsContext();
  const { t } = useTranslation();
  const { mode, setMode } = useColorScheme();
  const [themeData, setThemeData] = useState(defaultSettings);

  const addTheme = (newSettings) => {
    const configToSave = {
      darkMode: newSettings.colorScheme === "dark",
      contrast: newSettings.contrast === "hight",
      compact: newSettings.compactLayout === true,
      navLayout: newSettings.navLayout,
      navColor: newSettings.navColor,
      presetsColor: newSettings.primaryColor || defaultSettings.primaryColor,
      fontFamily: newSettings.fontFamily,
      fontSize: String(newSettings.fontSize),
    };

    setThemeData(configToSave);
  };

  useEffect(() => {
    if (mode) {
      settings.setState({ colorScheme: mode });
    }
  }, [mode]);

  const isFontFamilyVisible = hasKeys(themeData, ["fontFamily"]);
  const isCompactLayoutVisible =
    hasKeys(themeData, ["compact"]) || hasKeys(themeData, ["compactLayout"]);
  const isDirectionVisible = hasKeys(defaultSettings, ["direction"]);
  const isColorSchemeVisible =
    hasKeys(themeData, ["darkMode"]) || hasKeys(themeData, ["colorScheme"]);
  const isContrastVisible = hasKeys(themeData, ["contrast"]);
  const isNavColorVisible = hasKeys(themeData, ["navColor"]);
  const isNavLayoutVisible = hasKeys(themeData, ["navLayout"]);
  const isPrimaryColorVisible =
    hasKeys(themeData, ["presetsColor"]) ||
    hasKeys(themeData, ["primaryColor"]);
  const isFontSizeVisible = hasKeys(themeData, ["fontSize"]);

  const handleReset = useCallback(() => {
    settings.onReset();
    setMode(defaultSettings.colorScheme);
    addTheme(settings.state);
  }, [defaultSettings.colorScheme, setMode, settings, addTheme]);

  const renderHead = () => (
    <Box
      sx={{
        py: 2,
        pr: 1,
        pl: 2.5,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        {t("settings")}
      </Typography>

      <FullScreenButton />

      <Tooltip title={t("resetAll")}>
        <IconButton onClick={handleReset}>
          <Badge color="error" variant="dot" invisible={!settings.canReset}>
            <Iconify icon="solar:restart-bold" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Tooltip title={t("close")}>
        <IconButton onClick={settings.onCloseDrawer}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const renderMode = () => (
    <BaseOption
      label={t("darkmode")}
      selected={settings.state.colorScheme === "dark"}
      icon={<SvgIcon>{settingIcons.moon}</SvgIcon>}
      onChangeOption={() => {
        const newColorScheme =
          settings.state.colorScheme === "light" ? "dark" : "light";
        setMode(newColorScheme);
        settings.setState({ colorScheme: newColorScheme });
        addTheme({ ...settings.state, colorScheme: newColorScheme });
      }}
    />
  );

  const renderContrast = () => (
    <BaseOption
      label={t("contrastMode")}
      selected={settings.state.contrast === "hight"}
      icon={<SvgIcon>{settingIcons.contrast}</SvgIcon>}
      onChangeOption={() => {
        const newContrast =
          settings.state.contrast === "default" ? "hight" : "default";

        const newSettings = {
          ...settings.state,
          contrast: newContrast,
        };

        settings.setState({ contrast: newContrast });
        addTheme(newSettings);
      }}
    />
  );

  const renderRtl = () => (
    <BaseOption
      label={t("rightToLeft")}
      selected={settings.state.direction === "rtl"}
      icon={<SvgIcon>{settingIcons.alignRight}</SvgIcon>}
      onChangeOption={() =>
        settings.setState({
          direction: settings.state.direction === "ltr" ? "rtl" : "ltr",
        })
      }
    />
  );

  const renderCompact = () => (
    <BaseOption
      tooltip={t("dashboardOnlyAvailableLargResultions")}
      label={t("compact")}
      selected={!!settings.state.compactLayout}
      icon={<SvgIcon>{settingIcons.autofitWidth}</SvgIcon>}
      onChangeOption={() => {
        const newCompact = !settings.state.compactLayout;

        const newSettings = {
          ...settings.state,
          compactLayout: newCompact,
        };

        settings.setState({ compactLayout: newCompact });
        addTheme(newSettings);
      }}
    />
  );

  const renderPresets = () => (
    <LargeBlock
      title="Presets"
      canReset={settings.state.primaryColor !== defaultSettings.primaryColor}
      onReset={() => {
        const newSettings = {
          ...settings.state,
          primaryColor: defaultSettings.primaryColor,
        };
        settings.setState({ primaryColor: defaultSettings.primaryColor });
        addTheme(newSettings);
      }}
    >
      <PresetsOptions
        icon={
          <SvgIcon sx={{ width: 28, height: 28 }}>
            {settingIcons.siderbarDuotone}
          </SvgIcon>
        }
        options={Object.keys(primaryColorPresets).map((key) => ({
          name: key,
          value: primaryColorPresets[key].main,
        }))}
        value={settings.state.primaryColor}
        onChangeOption={(newOption) => {
          const newSettings = { ...settings.state, primaryColor: newOption };
          settings.setState({ primaryColor: newOption });
          addTheme(newSettings);
        }}
      />
    </LargeBlock>
  );

  const renderNav = () => (
    <LargeBlock title="Nav" tooltip="Dashboard only" sx={{ gap: 2.5 }}>
      {isNavLayoutVisible && (
        <SmallBlock
          label={t("layout")}
          canReset={settings.state.navLayout !== defaultSettings.navLayout}
          onReset={() => {
            const newSettings = {
              ...settings.state,
              navLayout: defaultSettings.navLayout,
            };
            settings.setState({ navLayout: defaultSettings.navLayout });
            addTheme(newSettings);
          }}
        >
          <NavLayoutOptions
            value={settings.state.navLayout}
            onChangeOption={(newOption) => {
              const newSettings = { ...settings.state, navLayout: newOption };
              settings.setState({ navLayout: newOption });
              addTheme(newSettings);
            }}
            options={[
              {
                value: "vertical",
                icon: (
                  <SvgIcon sx={{ width: 1, height: "auto" }}>
                    {settingIcons.navVertical}
                  </SvgIcon>
                ),
              },
              {
                value: "horizontal",
                icon: (
                  <SvgIcon
                    aria-label="navHorizontal"
                    sx={{ width: 1, height: "auto" }}
                  >
                    {settingIcons.navHorizontal}
                  </SvgIcon>
                ),
              },
              {
                value: "mini",
                icon: (
                  <SvgIcon sx={{ width: 1, height: "auto" }}>
                    {settingIcons.navMini}
                  </SvgIcon>
                ),
              },
            ]}
          />
        </SmallBlock>
      )}
      {isNavColorVisible && (
        <SmallBlock
          label={t("color")}
          canReset={settings.state.navColor !== defaultSettings.navColor}
          onReset={() => {
            const newSettings = {
              ...settings.state,
              navColor: defaultSettings.navColor,
            };
            settings.setState({ navColor: defaultSettings.navColor });
            addTheme(newSettings);
          }}
        >
          <NavColorOptions
            value={settings.state.navColor}
            onChangeOption={(newOption) => {
              const newSettings = { ...settings.state, navColor: newOption };
              settings.setState({ navColor: newOption });
              addTheme(newSettings);
            }}
            options={[
              {
                label: t("integrate"),
                value: "integrate",
                icon: <SvgIcon>{settingIcons.sidebarOutline}</SvgIcon>,
              },
              {
                label: t("apparent"),
                value: "apparent",
                icon: <SvgIcon>{settingIcons.sidebarFill}</SvgIcon>,
              },
            ]}
          />
        </SmallBlock>
      )}
    </LargeBlock>
  );

  const renderFont = () => (
    <LargeBlock title="Font" sx={{ gap: 2.5 }}>
      {isFontFamilyVisible && (
        <SmallBlock
          label={t("family")}
          canReset={settings.state.fontFamily !== defaultSettings.fontFamily}
          onReset={() => {
            const newSettings = {
              ...settings.state,
              fontFamily: defaultSettings.fontFamily,
            };
            settings.setState({ fontFamily: defaultSettings.fontFamily });
            addTheme(newSettings);
          }}
        >
          <FontFamilyOptions
            value={settings.state.fontFamily}
            onChangeOption={(newOption) => {
              const newSettings = { ...settings.state, fontFamily: newOption };
              settings.setState({ fontFamily: newOption });
              addTheme(newSettings);
            }}
            options={[
              themeConfig.fontFamily.primary,
              "Inter Variable",
              "DM Sans Variable",
              "Nunito Sans Variable",
            ]}
            icon={
              <SvgIcon sx={{ width: 28, height: 28 }}>
                {settingIcons.font}
              </SvgIcon>
            }
          />
        </SmallBlock>
      )}
      {isFontSizeVisible && (
        <SmallBlock
          label={t("size")}
          canReset={settings.state.fontSize !== defaultSettings.fontSize}
          onReset={() => {
            const newSettings = {
              ...settings.state,
              fontSize: defaultSettings.fontSize,
            };
            settings.setState({ fontSize: defaultSettings.fontSize });
            addTheme(newSettings);
          }}
          sx={{ gap: 5 }}
        >
          <FontSizeOptions
            options={[12, 20]}
            value={settings.state.fontSize}
            onChangeOption={(newOption) => {
              const newSettings = { ...settings.state, fontSize: newOption };
              settings.setState({ fontSize: newOption });
              addTheme(newSettings);
            }}
          />
        </SmallBlock>
      )}
    </LargeBlock>
  );

  const { loading } = useSelector((store) => store.theme);

  return (
    <>
      {loading && <LoadingScreen />}

      <Drawer
        anchor="right"
        open={settings.openDrawer}
        onClose={settings.onCloseDrawer}
        slotProps={{
          backdrop: { invisible: true },
          paper: {
            sx: [
              (theme) => ({
                ...theme.mixins.paperStyles(theme, {
                  color: varAlpha(
                    theme.vars.palette.background.defaultChannel,
                    0.9,
                  ),
                }),
                width: 360,
              }),
              ...(Array.isArray(sx) ? sx : [sx]),
            ],
          },
        }}
      >
        {renderHead()}
        <Scrollbar>
          <Box
            sx={{
              pb: 5,
              gap: 6,
              px: 2.5,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                gap: 2,
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
            >
              {isColorSchemeVisible && renderMode()}
              {isContrastVisible && renderContrast()}
              {isDirectionVisible && renderRtl()}
              {isCompactLayoutVisible && renderCompact()}
            </Box>

            {(isNavColorVisible || isNavLayoutVisible) && renderNav()}
            {isPrimaryColorVisible && renderPresets()}
            {(isFontFamilyVisible || isFontSizeVisible) && renderFont()}
          </Box>
        </Scrollbar>
      </Drawer>
    </>
  );
}
