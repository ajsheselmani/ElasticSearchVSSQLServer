import { m } from "framer-motion";
import { useCallback } from "react";
import { usePopover } from "minimal-shared/hooks";

import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";

import { CustomPopover } from "src/components/custom-popover";
import { varTap, varHover, transitionTap } from "src/components/animate";
import { Iconify } from "src/components/iconify";
import { useTranslation } from "react-i18next";
import axiosInstance from "src/lib/axios";
import { useSnackbar } from "notistack";
import { useAuthContext } from "src/auth/hooks";
import { persistLanguage } from "src/locales";

// ----------------------------------------------------------------------

export function LanguagePopover({ data = [], sx, ...other }) {
  const { open, anchorEl, onClose, onOpen } = usePopover();

  const { i18n, t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { user, updateUserLanguage } = useAuthContext();

  const handleChangeLang = useCallback(
    async (newLang) => {
      const previousLanguage = i18n.resolvedLanguage ?? i18n.language;

      if (newLang === previousLanguage) {
        onClose();
        return;
      }

      await i18n.changeLanguage(newLang);
      persistLanguage(newLang);

      const languageEnum = {
        sq: 1,
        en: 2,
        sr: 3,
      };

      if (user == null) {
        onClose();
        return;
      }

      const res = await axiosInstance.put(
        `/User/UpdateUserLanguage?languageId=${languageEnum[newLang]}`,
        {},
      );

      if (res.status == 200) {
        await updateUserLanguage(newLang);
        enqueueSnackbar(t("languageUpdatedSuccessfully"), {
          variant: "success",
          autoHideDuration: 1000,
        });
        onClose();
        return;
      }

      persistLanguage(previousLanguage);
      await i18n.changeLanguage(previousLanguage);
      enqueueSnackbar(t("languageNotUpdated"), {
        variant: "error",
        autoHideDuration: 4000,
      });
    },
    [i18n, enqueueSnackbar, onClose, t, updateUserLanguage, user],
  );

  const renderMenuList = () => (
    <CustomPopover open={open} anchorEl={anchorEl} onClose={onClose}>
      <MenuList sx={{ width: 160, minHeight: 72 }}>
        {data?.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value == i18n.language}
            onClick={() => handleChangeLang(option.value)}
          >
            <div className="flex justify-between w-100">
              <>{option.label}</>
              {i18n.language == option.value && (
                <Iconify
                  icon="material-symbols:check"
                  className="text-green-500 font-bold"
                />
              )}
            </div>
          </MenuItem>
        ))}
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap={varTap(0.96)}
        whileHover={varHover(1.04)}
        transition={transitionTap()}
        aria-label="Languages button"
        onClick={onOpen}
        sx={[
          (theme) => ({
            p: 0,
            width: 40,
            height: 40,
            ...(open && { bgcolor: theme.vars.palette.action.selected }),
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        <Iconify icon="ant-design:global-outlined" width={24} />
      </IconButton>

      {renderMenuList()}
    </>
  );
}
