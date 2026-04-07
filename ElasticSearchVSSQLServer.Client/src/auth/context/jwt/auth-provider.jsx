import { useSetState } from "minimal-shared/hooks";
import { useMemo, useEffect, useCallback } from "react";

import axios, { endpoints } from "src/lib/axios";

import { JWT_STORAGE_KEY } from "./constant";
import { AuthContext } from "../auth-context";
import { setSession, isValidToken } from "./utils";
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({ user: null, loading: true });
  const { i18n } = useTranslation();

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem(JWT_STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        const res = await axios.get(endpoints.auth.me);
        const user = res.data;
        if (user.language == 1) i18n.changeLanguage("sq");
        else if (user.language == 2) i18n.changeLanguage("en");
        else if (user.language == 3) i18n.changeLanguage("sr");
        setState({ user: { ...user, accessToken }, loading: false });
      } else {
        setState({ user: null, loading: false, role: null });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false, role: null });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? "authenticated" : "unauthenticated";

  const status = state.loading ? "loading" : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? { ...state.user, role: state.user?.role ?? "admin" }
        : null,
      checkUserSession,
      loading: status === "loading",
      authenticated: status === "authenticated",
      unauthenticated: status === "unauthenticated",
    }),
    [checkUserSession, state.user, status],
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
