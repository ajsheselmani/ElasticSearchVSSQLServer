import { useSetState } from "minimal-shared/hooks";
import { useMemo, useEffect, useCallback } from "react";

import axios, { endpoints } from "src/lib/axios";

import { JWT_STORAGE_KEY } from "./constant";
import { AuthContext } from "../auth-context";
import { setSession, isValidToken } from "./utils";
import { useTranslation } from "react-i18next";
import { persistLanguage } from "src/locales";

// ----------------------------------------------------------------------

function getLanguageCode(languageId) {
  if (languageId == 1) return "sq";
  if (languageId == 2) return "en";
  if (languageId == 3) return "sr";
  return "sq";
}

function getLanguageId(languageCode) {
  if (languageCode === "sq") return 1;
  if (languageCode === "en") return 2;
  if (languageCode === "sr") return 3;
  return 1;
}

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
        const languageCode = getLanguageCode(user.language);

        persistLanguage(languageCode);
        await i18n.changeLanguage(languageCode);
        setState({ user: { ...user, accessToken }, loading: false });
      } else {
        setState({ user: null, loading: false, role: null });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false, role: null });
    }
  }, [i18n, setState]);

  const updateUserLanguage = useCallback(
    async (languageCode) => {
      const normalizedLanguage = persistLanguage(languageCode);

      await i18n.changeLanguage(normalizedLanguage);

      if (state.user) {
        setState({
          user: {
            ...state.user,
            language: getLanguageId(normalizedLanguage),
          },
        });
      }
    },
    [i18n, setState, state.user],
  );

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
      updateUserLanguage,
      loading: status === "loading",
      authenticated: status === "authenticated",
      unauthenticated: status === "unauthenticated",
    }),
    [checkUserSession, state.user, status, updateUserLanguage],
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
