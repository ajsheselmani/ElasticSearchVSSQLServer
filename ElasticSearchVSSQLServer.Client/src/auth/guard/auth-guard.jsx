import { useState, useEffect } from "react";

import { paths } from "src/routes/paths";
import { useRouter } from "src/routes/hooks";

import { SplashScreen } from "src/components/loading-screen";

import { useAuthContext } from "../hooks";
import { CONFIG } from "../../global-config";

// ----------------------------------------------------------------------

const signInPaths = {
  jwt: paths.auth.jwt.signIn,
  auth0: paths.auth.auth0.signIn,
  amplify: paths.auth.amplify.signIn,
  firebase: paths.auth.firebase.signIn,
  supabase: paths.auth.supabase.signIn,
};

export function AuthGuard({ children }) {
  const router = useRouter();
  // const pathname = usePathname();
  const user = useAuthContext();
  const [isChecking, setIsChecking] = useState(true);

  const createRedirectPath = (currentPath) => {
    const queryString = new URLSearchParams({
      returnTo:
        // pathname
        paths.dashboard.root || paths.auth.jwt.login2FA,
    }).toString();
    return `${currentPath}?${queryString}`;
  };

  const checkPermissions = async () => {
    if (user?.loading) {
      return;
    }

    if (!user?.authenticated) {
      const { method } = CONFIG.auth;

      const signInPath = signInPaths[method];
      const redirectPath = createRedirectPath(signInPath);

      router.replace(redirectPath);

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
