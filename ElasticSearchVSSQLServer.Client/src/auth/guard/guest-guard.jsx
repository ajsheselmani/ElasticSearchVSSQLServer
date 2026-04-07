import { useState, useEffect } from "react";

import { useSearchParams } from "src/routes/hooks";

import { SplashScreen } from "src/components/loading-screen";

import { useAuthContext } from "../hooks";
import { CONFIG } from "../../global-config";

// ----------------------------------------------------------------------

export function GuestGuard({ children }) {
  const user = useAuthContext();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || CONFIG.auth.redirectPath;

  const [isChecking, setIsChecking] = useState(true);

  const checkPermissions = async () => {
    if (user?.loading) {
      return;
    }
    if (user?.authenticated) {
      // Redirect authenticated users to the returnTo path
      // Using `window.location.href` instead of `router.replace` to avoid unnecessary re-rendering
      // that might be caused by the AuthGuard component
      window.location.href = returnTo;
      return;
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.authenticated, user?.loading]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
