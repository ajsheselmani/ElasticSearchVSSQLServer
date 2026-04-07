import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
  Typography,
} from "@mui/material";
import ReportErrorDialog from "./reportErrorDialog";
import { useState } from "react";
import { paths } from "src/routes/paths";
import { SimpleLayout } from "src/layouts/simple";
import { MotionContainer, varBounce } from "src/components/animate";
import { m } from "framer-motion";
import { RouterLink } from "src/routes/components";
import { ServerErrorIllustration } from "src/assets/illustrations";

export default function ErrorPage({ t, pdfFile }) {
  const [openDialog, setOpenDialog] = useState(false);
  const url = window.location.href;

  return (
    <>
      <SimpleLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "80vh",
            textAlign: "center",
          }}
        >
          <Container component={MotionContainer}>
            <m.div variants={varBounce("in")} className="mb-4">
              <Typography variant="h3" sx={{ mb: 2 }}>
                {t("error500")}
              </Typography>
            </m.div>

            <m.div variants={varBounce("in")}>
              <Alert variant="outlined" severity="error">
                <AlertTitle className="flex justify-start ">
                  {t("appError")}
                </AlertTitle>
                {t("errorDescription")}
              </Alert>
            </m.div>

            <m.div variants={varBounce("in")}>
              <ServerErrorIllustration sx={{ my: { xs: 5, sm: 10 } }} />
            </m.div>
            <m.div variants={varBounce("in")}>
              <div className="flex justify-center items-center gap-2 mt-2">
                <Button
                  component={RouterLink}
                  onClick={() => {
                    window.location.href = paths.dashboard.root;
                  }}
                  size="large"
                  color="primary"
                  variant="contained"
                >
                  {t("returnHome")}
                </Button>

                <Button
                  onClick={() => setOpenDialog(true)}
                  size="large"
                  variant="contained"
                  color="error"
                >
                  {t("reportError")}
                </Button>
                <ReportErrorDialog
                  open={openDialog}
                  onClose={() => setOpenDialog(false)}
                  url={url}
                  pdfFile={pdfFile}
                />
              </div>
            </m.div>
          </Container>
        </Box>
      </SimpleLayout>
    </>
  );
}
