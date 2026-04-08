import { merge } from "es-toolkit";
import { useBoolean } from "minimal-shared/hooks";

import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";
import { iconButtonClasses } from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Logo } from "src/components/logo";
import { useSettingsContext } from "src/components/settings";
import { useAuthContext } from "src/auth/hooks";
import { NavMobile } from "./nav-mobile";
import { VerticalDivider } from "./content";
import { NavVertical } from "./nav-vertical";
import { layoutClasses } from "../core/classes";
import { NavHorizontal } from "./nav-horizontal";
import { _account } from "../nav-config-account";
import { MainSection } from "../core/main-section";
import { Searchbar } from "../components/searchbar";
import { MenuButton } from "../components/menu-button";
import { HeaderSection } from "../core/header-section";
import { LayoutSection } from "../core/layout-section";
import { AccountDrawer } from "../components/account-drawer";
import { LanguagePopover } from "../components/language-popover";
import { dashboardLayoutVars, dashboardNavColorVars } from "./css-vars";
import { useEffect, useMemo } from "react";
import { useNotifications } from "src/auth/hooks/useNotifications";
import { useSnackbar } from "notistack";
import { Typography } from "@mui/material";
import { Tooltip } from "@mui/material";
import QueueWork from "../queue-work";
import { navData } from "../nav-config-dashboard";

// ----------------------------------------------------------------------

export function DashboardLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = "lg",
}) {
  const theme = useTheme();
  const APP_NAME = import.meta.env.VITE_APP_NAME;

  const settings = useSettingsContext();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const navVars = dashboardNavColorVars(
    theme,
    settings.state.navColor,
    settings.state.navLayout,
  );
  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  // const navData = menus;

  const isNavMini = settings.state.navLayout === "mini";
  const isNavHorizontal = settings.state.navLayout === "horizontal";
  const isNavVertical = isNavMini || settings.state.navLayout === "vertical";
  const isSmallScreen = !useMediaQuery(theme.breakpoints.up("sm"));
  const isDesktopNav = useMediaQuery(theme.breakpoints.up(layoutQuery));

  const canDisplayItemByRole = (allowedRoles) =>
    !allowedRoles?.includes(user?.role);

  const notifications = useNotifications();
  const roleName = useMemo(() => {
    if (user?.language === 1) return "nameSq";
    if (user?.language === 3) return "nameSr";
    return "nameEn";
  }, [user?.language]);

  const userRoleObj = user?.roles?.[0] ?? null;
  const userRole = userRoleObj ? userRoleObj[roleName] : "";

  const getSeverity = (type) => {
    switch (type) {
      case 1:
        return "info";
      case 5:
        return "warning";
      case 8:
        return "error";
      case 6:
        return "success";
      default:
        return "default";
    }
  };

  useEffect(() => {
    notifications.forEach((n) => {
      enqueueSnackbar(
        <div>
          <strong>{n.title}</strong>
          <div style={{ whiteSpace: "normal", maxWidth: "300px" }}>
            {n.message}
          </div>
        </div>,
        {
          variant: getSeverity(n.type),
          anchorOrigin: { vertical: "top", horizontal: "right" },
          autoHideDuration: 4000,
        },
      );
    });
  }, [notifications]);

  useEffect(() => {
    if (isDesktopNav && open) {
      onClose();
    }
  }, [isDesktopNav, open, onClose]);

  const renderHeader = () => {
    const headerSlotProps = {
      container: {
        maxWidth: false,
        sx: {
          ...(isNavVertical && { px: { [layoutQuery]: 5 } }),
          ...(isNavHorizontal && {
            bgcolor: "var(--layout-nav-bg)",
            height: { [layoutQuery]: "var(--layout-nav-horizontal-height)" },
            [`& .${iconButtonClasses.root}`]: {
              color: "var(--layout-nav-text-secondary-color)",
            },
          }),
        },
      },
    };

    const headerSlots = {
      topArea: (
        <Alert severity="info" sx={{ display: "none", borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      bottomArea: isNavHorizontal ? (
        <NavHorizontal
          data={navData}
          layoutQuery={layoutQuery}
          cssVars={navVars.section}
          checkPermissions={canDisplayItemByRole}
        />
      ) : null,
      leftArea: (
        <>
          {/** @slot Nav mobile */}
          <MenuButton
            onClick={onOpen}
            sx={{
              mr: 1,
              ml: -1,
              [theme.breakpoints.up(layoutQuery)]: { display: "none" },
            }}
          />
          <Tooltip
            title={APP_NAME}
            disableHoverListener={!isSmallScreen}
            disableFocusListener={!isSmallScreen}
            disableTouchListener={!isSmallScreen}
          >
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                fontWeight: 700,
                opacity: 0.9,
                textAlign: "center",
                fontSize: { xs: 18, sm: 14, md: 16 },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginRight: 2,
              }}
            >
              {isSmallScreen ? APP_NAME : APP_NAME}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                fontWeight: 500,
                opacity: 0.8,
                marginLeft: 1,
                fontSize: { xs: 11, sm: 12 },
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userRole}
            </Typography>
          </Tooltip>

          <NavMobile
            data={navData}
            open={open}
            onClose={onClose}
            cssVars={navVars.section}
            checkPermissions={canDisplayItemByRole}
          />

          {/** @slot Logo */}
          {isNavHorizontal && (
            <Logo
              sx={{
                display: "none",
                [theme.breakpoints.up(layoutQuery)]: { display: "inline-flex" },
              }}
            />
          )}

          {/** @slot Divider */}
          {isNavHorizontal && (
            <VerticalDivider
              sx={{ [theme.breakpoints.up(layoutQuery)]: { display: "flex" } }}
            />
          )}
        </>
      ),
      rightArea: (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0, sm: 0.75 },
          }}
        >
          <QueueWork />
          <Searchbar data={navData} />
          <LanguagePopover
            data={[
              { value: "sq", label: "Shqip", countryCode: "AL" },
              { value: "en", label: "English", countryCode: "GB" },
              { value: "sr", label: "Serbian", countryCode: "SR" },
            ]}
          />

          {/** @slot Settings button */}
          {/* <SettingsButton /> */}

          {/** @slot Account drawer */}
          <AccountDrawer data={_account} />
        </Box>
      ),
    };

    return (
      <HeaderSection
        layoutQuery={layoutQuery}
        disableElevation={isNavVertical}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderSidebar = () => (
    <NavVertical
      data={navData}
      isNavMini={isNavMini}
      layoutQuery={layoutQuery}
      cssVars={navVars.section}
      checkPermissions={canDisplayItemByRole}
      onToggleNav={() =>
        settings.setField(
          "navLayout",
          settings.state.navLayout === "vertical" ? "mini" : "vertical",
        )
      }
    />
  );

  const renderFooter = () => null;

  const renderMain = () => (
    <MainSection {...slotProps?.main}>{children}</MainSection>
  );

  return (
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Sidebar
       *************************************** */
      sidebarSection={isNavHorizontal ? null : renderSidebar()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={{ ...dashboardLayoutVars(theme), ...navVars.layout, ...cssVars }}
      sx={[
        {
          [`& .${layoutClasses.sidebarContainer}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              pl: isNavMini
                ? "var(--layout-nav-mini-width)"
                : "var(--layout-nav-vertical-width)",
              transition: theme.transitions.create(["padding-left"], {
                easing: "var(--layout-transition-easing)",
                duration: "var(--layout-transition-duration)",
              }),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
      {/* <Box sx={{ position: 'relative' }}>
        <Box sx={{ position: 'fixed', bottom: 100, right: 5, zIndex: 1200 }}>
          <NotificationButton
            onClick={() => {
              setActivePanel((prev) => {
                const isChatOpen = prev === 'chat';
                if (isChatOpen) {
                  setConfirmVisible(true);
                  return prev;
                }
                return prev === 'notification' ? null : 'notification';
              });
            }}
            sx={{
              ...(activePanel === 'notification' && {
                backgroundColor: '#edf5dc',
                color: '#606060',
                borderRadius: '50%',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                transform: 'scale(0.8)',
                ':hover': {
                  transform: 'scale(0.85)',
                  backgroundColor: '#edf5dc',
                },
              }),
            }}
          />
        </Box>

        {activePanel === 'notification' && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 25,
              right: 90,
              zIndex: 1200,
              bgcolor: 'background.paper',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              borderRadius: 1,
              p: 2,
              width: 400,
              maxWidth: '100%',
            }}
          >
            <NotificationSender onClose={() => setActivePanel(null)} />
          </Box>
        )}

        <Box sx={{ position: 'fixed', bottom: 25, right: 5, zIndex: 1200 }}>
          <ChatButton
            onClick={handleChatClick}
            onClose={handleConfirmCloseChat}
            sx={{
              ...(activePanel === 'chat' && {
                backgroundColor: '#edf5dc',
                color: '#606060',
                borderRadius: '50%',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                transform: 'scale(0.8)',
                ':hover': {
                  transform: 'scale(0.85)',
                  backgroundColor: '#edf5dc',
                },
              }),
            }}
          />
        </Box>

        {activePanel === 'chat' && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 25,
              right: 90,
              zIndex: 1200,
              bgcolor: 'background.paper',
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              borderRadius: 1,
              p: 1,
              width: 500,
              maxWidth: '100%',
            }}
          >
            <ChatComponent
              onClose={() => {
                ChatService.stop();
                setActivePanel(null);
              }}
              confirmVisible={confirmVisible}
              setConfirmVisible={setConfirmVisible}
              onConfirmClose={handleConfirmCloseChat}
            />
          </Box>
        )}
      </Box> */}
    </LayoutSection>
  );
}
