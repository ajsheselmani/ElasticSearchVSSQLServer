import { Icon } from "@iconify/react";
import {
  Box,
  Button,
  Card,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SvgIcon,
  Typography,
} from "@mui/material";
import moment from "moment";
import { useSnackbar } from "notistack";
import React, { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "src/auth/hooks";
import { Field, Form } from "src/components/hook-form";
import { LoadingScreen } from "src/components/loading-screen";
import { settingIcons } from "src/components/settings/drawer/icons";
import { UploadAvatar } from "src/components/upload";
import axiosInstance from "src/lib/axios";
import { fData } from "src/utils/format-number";

const Profile = () => {
  const { user, updateUserLanguage } = useAuthContext();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [img, setImg] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const nameLocale = useMemo(() => {
    if (user?.language === 1) return "languageSq";
    if (user?.language === 3) return "languageSr";
    return "languageEn";
  }, [user?.language]);

  const defaultValues = {
    email: user.email,
    personalNumber: user.personalNumber,
    gender: user.gender === 1 ? t("male") : t("female"),
    language: t(`${nameLocale}`),
    phoneNumber: user.phoneNumber,
    userName: user.userName,
    birthdate: moment(user.birthdate).format("DD/MM/YYYY"),
  };
  const methods = useForm({ defaultValues });

  const infoItems = [
    {
      icon: settingIcons.personaNumber,
      label: t("personalNumber"),
      value: user.personalNumber,
    },
    {
      icon: settingIcons.date,
      label: t("birthdate"),
      value: moment(user.birthdate).format("DD/MM/YYYY"),
    },
    {
      icon: settingIcons.gender,
      label: t("gender"),
      value: user.gender === 1 ? t("male") : t("female"),
    },
    { icon: settingIcons.user, label: t("userName"), value: user.userName },
    {
      icon: settingIcons.phone,
      label: t("phonenumber"),
      value: user.phoneNumber,
    },
    { icon: settingIcons.email, label: t("email"), value: user.email },
  ];

  useEffect(() => {
    axiosInstance
      .get(`/Administration/user/GetProfileImage?id=${user.id}`)
      .then((response) => {
        if (response.status !== 404) setImg(response.data);
      })
      .catch((error) => {
        console.error("Error fetching profile data:", error);
      });
  }, [user]);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleDropAvatar = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const newFile = acceptedFiles[0];
    const toBlob = await toBase64(newFile);
    setImg(toBlob.replace("data:image/png;base64,", ""));
    var formData = new FormData();
    formData.append("file", newFile);
    setLoading(true);
    axiosInstance
      .patch(`/Administration/user/UpdateUserProfileImage`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(t("dataSavedSuccessfully"), { variant: "success" });
        } else {
          enqueueSnackbar(
            response.response.data.message ?? t("errorOccurred"),
            {
              variant: "error",
            },
          );
        }
      })
      .catch((error) => {
        var message = t("errorOccurred");
        enqueueSnackbar(message, error, { variant: "error" });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const deleteAvatar = useCallback(() => {
    var formData = new FormData();
    formData.append("file", null);
    setLoading(true);
    axiosInstance
      .patch(`/Administration/user/UpdateUserProfileImage`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        if (response.status === 200) {
          enqueueSnackbar(t("dataSavedSuccessfully"), { variant: "success" });
          setImg(null);
        } else {
          enqueueSnackbar(
            response.response.data.message ?? t("errorOccurred"),
            {
              variant: "error",
            },
          );
        }
      })
      .catch((error) => {
        var message = t("errorOccurred");
        enqueueSnackbar(message, error, { variant: "error" });
      })
      .finally(() => {
        setLoading(false);
      });
  });

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    const nextLanguageCode =
      newLanguage == 1 ? "sq" : newLanguage == 2 ? "en" : "sr";

    axiosInstance
      .put(`/User/UpdateUserLanguage?languageId=` + newLanguage)
      .then(async (response) => {
        if (response.status === 200) {
          await updateUserLanguage(nextLanguageCode);
          enqueueSnackbar(t("languageUpdatedSuccessfully"), {
            variant: "success",
          });
        } else {
          enqueueSnackbar(
            response.response.data.message ?? t("errorOccurred"),
            {
              variant: "error",
            },
          );
        }
      })
      .catch((error) => {
        enqueueSnackbar(t("errorOccurred"), error, { variant: "error" });
      });
  };

  return (
    <>
      <div className=" mx-[6%]">
        <Form methods={methods}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  pt: 10,
                  pb: 5,
                  px: 3,
                  textAlign: "center",
                }}
              >
                {loading && (
                  <div className="mb-2">
                    <LoadingScreen />
                  </div>
                )}
                <div>
                  <UploadAvatar
                    value={
                      img
                        ? `data:image/png;base64,${img}`
                        : "/assets/images/mock/avatar/user.png"
                    }
                    onDrop={handleDropAvatar}
                    validator={(fileData) => {
                      if (fileData.size > 1050000) {
                        return {
                          code: "file-too-large",
                          message: `${t("fileTooLarge")} ${fData(1050000)}`,
                        };
                      }
                      return null;
                    }}
                    helperText={
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 3,
                          mx: "auto",
                          display: "block",
                          textAlign: "center",
                          color: "text.disabled",
                        }}
                      >
                        {t("allowed")} *.jpeg, *.jpg, *.png, *.gif
                        <br /> {t("maxFileSize")} {fData(1050000)}
                      </Typography>
                    }
                  />
                </div>
                {img && (
                  <div className="mt-1">
                    <Button
                      startIcon={
                        <Icon icon="material-symbols:delete-outline" />
                      }
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={deleteAvatar}
                    >
                      {t("deleteImage")}
                    </Button>
                  </div>
                )}
                <Typography variant="h6" sx={{ color: "text.primary", mt: 2 }}>
                  {user.firstname + " " + user.lastname}
                </Typography>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ p: 3 }}>
                <Box
                  sx={{
                    rowGap: 4,
                    columnGap: 2,
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(1, 1fr)",
                      sm: "repeat(2, 1fr)",
                    },
                  }}
                >
                  {infoItems.map(({ icon, label, value }, index) => (
                    <>
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <SvgIcon
                          sx={{ fontSize: 22, color: "text.secondary", mr: 1 }}
                        >
                          {icon}
                        </SvgIcon>
                        <Box sx={{ flex: 1 }}>
                          <Field.Text
                            name={label}
                            label={label}
                            value={value}
                            disabled
                          />
                        </Box>
                      </Box>
                    </>
                  ))}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <SvgIcon
                      sx={{ fontSize: 22, color: "text.secondary", mr: 1 }}
                    >
                      {settingIcons.languages}
                    </SvgIcon>
                    <Box sx={{ flex: 1 }}>
                      <FormControl fullWidth>
                        <InputLabel>{t("language")}</InputLabel>
                        <Select
                          value={user.language}
                          label={t("language")}
                          onChange={handleLanguageChange}
                        >
                          <MenuItem value={1}>{t("sq")}</MenuItem>
                          <MenuItem value={2}>{t("en")}</MenuItem>
                          <MenuItem value={3}>{t("sr")}</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Form>
      </div>
    </>
  );
};

export default Profile;
