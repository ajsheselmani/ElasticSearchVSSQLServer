import React, { useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/system";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";

const HiddenInput = styled("input")({
  border: 0,
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  width: 1,
  whiteSpace: "nowrap",
});

const UploadBox = styled(Box)(({ theme }) => ({
  border: `1px dashed ${theme.palette.divider}`,
  borderRadius: "50%",
  position: "relative",
  width: 180,
  height: 180,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "visible",
  backgroundColor: theme.palette.background.default,
  cursor: "pointer",
}));

const UploadPlaceholder = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  color: theme.palette.text.disabled,
  "& svg": {
    width: "2em",
    height: "2em",
    fill: "currentColor",
    marginBottom: theme.spacing(1),
  },
}));

const PreviewImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%",
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 1,
});

const OverlayIcon = styled(Box)(({ theme }) => ({
  zIndex: 2,
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  opacity: 0,
  transition: "opacity 0.3s ease",
  pointerEvents: "none",
  "& svg": {
    width: "2em",
    height: "2em",
    fill: "currentColor",
    marginBottom: theme.spacing(1),
  },
}));

const TrashIconContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: -6,
  right: -6,
  zIndex: 30,
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderRadius: "50%",
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
  cursor: "pointer",
  transition: "all 0.25s ease-in-out",
  "&:hover": {
    backgroundColor: "rgba(128, 128, 128, 0.8)",
    "& svg": {
      color: "white",
      transform: "scale(1.15)",
    },
  },
  "& svg": {
    color: theme.palette.text.secondary,
    width: 18,
    height: 18,
    transition: "all 0.25s ease-in-out",
  },
}));

export default function ImageUpload({ imageData, setImageFile }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [isHoveringCircle, setIsHoveringCircle] = useState(false);
  const [openTooltip, setOpenTooltip] = useState(false);
  const { t } = useTranslation();

  React.useEffect(() => {
    let objectUrl;
    if (imageData) {
      if (typeof imageData === "string" && imageData.startsWith("data:image")) {
        setPreview(imageData);
      } else if (imageData instanceof File) {
        objectUrl = URL.createObjectURL(imageData);
        setPreview(objectUrl);
      }
    } else {
      setPreview(null);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageData]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <Box textAlign="center">
      <UploadBox
        onClick={handleClick}
        onMouseEnter={() => setIsHoveringCircle(true)}
        onMouseLeave={() => setIsHoveringCircle(false)}
      >
        <HiddenInput
          accept="image/*"
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
        />

        {preview ? (
          <>
            <PreviewImage src={preview} alt="Uploaded preview" />
            <Tooltip
              title={t("deleteTooltip")}
              placement="top"
              arrow
              open={openTooltip}
              onOpen={() => setOpenTooltip(true)}
              onClose={() => setOpenTooltip(false)}
              componentsProps={{
                tooltip: {
                  sx: {
                    fontSize: "0.9rem",
                    padding: "8px 12px",
                    bgcolor: "common.white",
                    color: "text.secondary",
                    boxShadow: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  },
                  onClick: (e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                    setOpenTooltip(false);
                  },
                },
                arrow: {
                  sx: {
                    color: "common.white",
                    "&:before": {
                      border: "1px solid",
                      borderColor: "divider",
                    },
                  },
                },
              }}
            >
              <TrashIconContainer
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setImageFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = null;
                  }
                }}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  setIsHoveringCircle(false);
                }}
                aria-label={t("deleteTooltip")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M3 6h18v2H3V6zm2 3h14v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm3-6h6v2H8V3z"
                  />
                </svg>
              </TrashIconContainer>
            </Tooltip>

            <OverlayIcon sx={{ opacity: isHoveringCircle ? 1 : 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                  <path d="M12 10.25a.75.75 0 0 1 .75.75v1.25H14a.75.75 0 0 1 0 1.5h-1.25V15a.75.75 0 0 1-1.5 0v-1.25H10a.75.75 0 0 1 0-1.5h1.25V11a.75.75 0 0 1 .75-.75" />
                  <path d="M9.778 21h4.444c3.121 0 4.682 0 5.803-.735a4.4 4.4 0 0 0 1.226-1.204c.749-1.1.749-2.633.749-5.697s0-4.597-.749-5.697a4.4 4.4 0 0 0-1.226-1.204c-.72-.473-1.622-.642-3.003-.702c-.659 0-1.226-.49-1.355-1.125A2.064 2.064 0 0 0 13.634 3h-3.268c-.988 0-1.839.685-2.033 1.636c-.129.635-.696 1.125-1.355 1.125c-1.38.06-2.282.23-3.003.702A4.4 4.4 0 0 0 2.75 7.667C2 8.767 2 10.299 2 13.364s0 4.596.749 5.697c.324.476.74.885 1.226 1.204C5.096 21 6.657 21 9.778 21M16 13a4 4 0 1 1-8 0a4 4 0 0 1 8 0m2-3.75a.75.75 0 0 0 0 1.5h1a.75.75 0 0 0 0-1.5z" />
                </g>
              </svg>
              <Typography variant="caption">{t("uploadPhoto")}</Typography>
            </OverlayIcon>
          </>
        ) : (
          <UploadPlaceholder>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                <path d="M12 10.25a.75.75 0 0 1 .75.75v1.25H14a.75.75 0 0 1 0 1.5h-1.25V15a.75.75 0 0 1-1.5 0v-1.25H10a.75.75 0 0 1 0-1.5h1.25V11a.75.75 0 0 1 .75-.75" />
                <path d="M9.778 21h4.444c3.121 0 4.682 0 5.803-.735a4.4 4.4 0 0 0 1.226-1.204c.749-1.1.749-2.633.749-5.697s0-4.597-.749-5.697a4.4 4.4 0 0 0-1.226-1.204c-.72-.473-1.622-.642-3.003-.702c-.659 0-1.226-.49-1.355-1.125A2.064 2.064 0 0 0 13.634 3h-3.268c-.988 0-1.839.685-2.033 1.636c-.129.635-.696 1.125-1.355 1.125c-1.38.06-2.282.23-3.003.702A4.4 4.4 0 0 0 2.75 7.667C2 8.767 2 10.299 2 13.364s0 4.596.749 5.697c.324.476.74.885 1.226 1.204C5.096 21 6.657 21 9.778 21M16 13a4 4 0 1 1-8 0a4 4 0 0 1 8 0m2-3.75a.75.75 0 0 0 0 1.5h1a.75.75 0 0 0 0-1.5z" />
              </g>
            </svg>
            <Typography variant="caption">{t("uploadPhoto")}</Typography>
          </UploadPlaceholder>
        )}
      </UploadBox>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1 }}
      >
        {t("allowedFileTypes")}
      </Typography>
    </Box>
  );
}
