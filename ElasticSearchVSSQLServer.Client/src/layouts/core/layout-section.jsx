import { mergeClasses } from "minimal-shared/utils";

import { styled } from "@mui/material/styles";
import GlobalStyles from "@mui/material/GlobalStyles";

import { layoutClasses } from "./classes";
import { layoutSectionVars } from "./css-vars";
import { useTranslation } from "react-i18next";
import { CONFIG } from "../../global-config";

// ----------------------------------------------------------------------

export function LayoutSection({
  sx,
  cssVars,
  children,
  headerSection,
  sidebarSection,
  className,
  ...other
}) {
  const inputGlobalStyles = (
    <GlobalStyles
      styles={(theme) => ({
        body: { ...layoutSectionVars(theme), ...cssVars },
      })}
    />
  );
  const { t } = useTranslation();

  return (
    <>
      {inputGlobalStyles}

      <LayoutRoot
        id="root__layout"
        className={mergeClasses([layoutClasses.root, className])}
        sx={sx}
        {...other}
      >
        {sidebarSection ? (
          <>
            {sidebarSection}
            <LayoutSidebarContainer className={layoutClasses.sidebarContainer}>
              {headerSection}
              {children}
              <div className="w-full place-items-center bottom-0">
                <h6 className="z-100 flex place-items-center p-1">
                  <div className=" pr-1">
                    {" "}
                    {t("copyright")} &copy; {`${new Date().getFullYear()}`}
                  </div>
                  •<span className="font-semibold pl-1">{CONFIG.appName}</span>
                </h6>
              </div>
            </LayoutSidebarContainer>
          </>
        ) : (
          <>
            {headerSection}
            {children}
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                padding: "10px 0",
              }}
            >
              <h6
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.85rem",
                  color: "text.secondary",
                  marginBottom: 0,
                  fontWeight: 500,
                }}
              >
                <span>
                  {" "}
                  {t("copyright")} &copy; {`${new Date().getFullYear()}`}
                </span>
                •<span style={{ fontWeight: 600 }}>{CONFIG.appName}</span>
              </h6>
            </div>
          </>
        )}
      </LayoutRoot>
    </>
  );
}

// ----------------------------------------------------------------------

const LayoutRoot = styled("div")``;

const LayoutSidebarContainer = styled("div")(() => ({
  display: "flex",
  flex: "1 1 auto",
  flexDirection: "column",
  minHeight: "100vh",
}));
