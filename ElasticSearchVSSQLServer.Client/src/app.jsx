// import "./" // " src/global.css";

import { useEffect, useState, useRef } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { usePathname } from "src/routes/hooks";

import { themeConfig, ThemeProvider } from "src/theme";

import { ProgressBar } from "src/components/progress-bar";
import { MotionLazy } from "src/components/animate/motion-lazy";
import {
  SettingsDrawer,
  defaultSettings,
  SettingsProvider,
} from "src/components/settings";

import { AuthProvider } from "src/auth/context/jwt";
// import store, { persistor } from "./store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { SnackbarProvider } from "notistack";
// import notificationService from "./services/notificationService";
import "dayjs/locale/en-gb";
import "dayjs/locale/sq";
import "dayjs/locale/sr";
import ErrorPage from "./pages/shared/error-page";
import { useTranslation } from "react-i18next";
import { ErrorBoundary } from "react-error-boundary";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./theme/shared-style.css";
import store, { persistor } from "./store";
// ----------------------------------------------------------------------

export default function App({ children }) {
  const { t, i18n } = useTranslation();
  useScrollToTop();

  // useEffect(() => {
  //   notificationService.start();
  // }, []);

  const hasCapturedRef = useRef(false);

  const [pdfFile, setPdfFile] = useState(null);

  async function captureAndConvert() {
    if (hasCapturedRef.current) return;
    hasCapturedRef.current = true;
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        unit: "px",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

      let position = 0;
      let heightLeft = imgHeight;

      while (heightLeft > 0) {
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
        if (heightLeft > 0) pdf.addPage();
      }
      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], "errorScreenshot.pdf", {
        type: "application/pdf",
      });
      setPdfFile(file);
    } catch (err) {
      console.error("Screenshot capture failed", err);
    }
  }

  return (
    <SnackbarProvider
      maxSnack={8}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      autoHideDuration={4000}
    >
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale={i18n.language === "en" ? "en-gb" : i18n.language}
      >
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <AuthProvider>
              <SettingsProvider defaultSettings={defaultSettings}>
                <ThemeProvider
                  modeStorageKey={themeConfig.modeStorageKey}
                  defaultMode={
                    themeConfig.enableSystemMode
                      ? "system"
                      : themeConfig.defaultMode
                  }
                >
                  <MotionLazy>
                    <ProgressBar />
                    <ErrorBoundary
                      fallbackRender={({ error }) => {
                        if (error && !hasCapturedRef.current) {
                          captureAndConvert();
                        }
                        return <ErrorPage t={t} pdfFile={pdfFile} />;
                      }}
                    >
                      <SettingsDrawer defaultSettings={defaultSettings} />
                      {children}
                    </ErrorBoundary>
                  </MotionLazy>
                </ThemeProvider>
              </SettingsProvider>
            </AuthProvider>
          </PersistGate>
        </Provider>
      </LocalizationProvider>
    </SnackbarProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
