import axios, { endpoints } from "src/lib/axios";

import { setSession } from "./utils";
import { JWT_STORAGE_KEY } from "./constant";
import axiosInstance from "src/lib/axios";

/** **************************************
 * Sign in
 *************************************** */

// ----------------------------------------------------------------------

export const signInWithPassword = async ({ email, password, t }) => {
  const params = { email, password };
  const res = await axios.post(endpoints.auth.signIn, params);
  const data = res.data ?? {};

  setSession(data?.token);
  if (res.data?.error) {
    throw new Error(res.data.error.message);
  }
  if (res.message == "Network Error") {
    if (!navigator.onLine) throw new Error(t("noInternetConnection"));
    throw new Error(t("noServerConnectionTryAgain"));
  }
  const { error } = data;
  if (error) {
    throw new Error(error.message);
  }
  if (!data.token) {
    throw new Error("Access token not found in response");
  }

  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get("returnTo") || "/dashboard";

  window.location.href = returnTo;

  return res;
};

/** **************************************
 * Sign up
 *************************************** */

// ----------------------------------------------------------------------

export const signUp = async ({ email, password, firstName, lastName }) => {
  const params = {
    email,
    password,
    firstName,
    lastName,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error("Access token not found in response");
    }

    sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
  } catch (error) {
    console.error("Error during sign up:", error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */

// ----------------------------------------------------------------------

export const signOut = async (userId) => {
  try {
    await setSession(null);
    if (userId) {
      try {
        await axiosInstance.post(
          `/Auth/Logout?userId=${encodeURIComponent(userId)}`,
        );
      } catch (e) {
        console.warn("Logout log endpoint failed:", e);
      }
    }
  } catch (error) {
    console.error("Error during sign out:", error);
    throw error;
  }
};
