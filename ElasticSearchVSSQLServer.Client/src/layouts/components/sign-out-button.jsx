import { useCallback } from "react";

import Button from "@mui/material/Button";

import { useRouter } from "src/routes/hooks";

import { useAuthContext } from "src/auth/hooks";
import { signOut } from "src/auth/context/jwt/action";
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------

export function SignOutButton({ onClose, sx, ...other }) {
  const router = useRouter();
  const { t } = useTranslation();

  const { checkUserSession, user } = useAuthContext();
  const handleLogout = useCallback(async () => {
    try {
      await signOut(user?.id);
      await checkUserSession?.();
      onClose?.();
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }, [checkUserSession, onClose, router, user]);

  return (
    <Button
      fullWidth
      variant="soft"
      size="large"
      color="error"
      onClick={handleLogout}
      sx={sx}
      {...other}
    >
      {t("signOut")}
    </Button>
  );
}
