import axios, { endpoints } from "src/lib/axios";

import { set2FASession, setSession } from "./utils";
import { JWT_2FA_STORAGE_KEY, JWT_STORAGE_KEY } from "./constant";
// import { paths } from "src/routes/paths";
import axiosInstance from "src/lib/axios";
import { CONFIG } from "../../../global-config";

/** **************************************
 * Sign in
 *************************************** */

// ----------------------------------------------------------------------

export const signInWithPassword = async ({ email, password, t }) => {
  const params = { email, password };
  const res = await axios.post(endpoints.auth.signIn, params);
  if (res?.data?.twoFAEnabled) {
    set2FASession(res.data.token);
    window.location.href = "/auth/jwt/login-2fa";
  } else {
    setSession(res?.data?.token);
    if (res.data?.error) {
      throw new Error(res.data.error.message);
    }
    if (res.message == "Network Error") {
      if (!navigator.onLine) throw new Error(t("noInternetConnection"));
      throw new Error(t("noServerConnectionTryAgain"));
    }
    const { error } = res.data;
    if (error) {
      throw new Error(error.message);
    }
    if (!res.data.token) {
      throw new Error("Access token not found in response");
    }

    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get("returnTo") || "/dashboard";

    window.location.href = returnTo;
  }
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
          `/Administration/Auth/Logout?userId=${encodeURIComponent(userId)}`,
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

/** **************************************
 * Login with 2FA
 *************************************** */
export const loginWith2FA = async (code, t) => {
  const token = localStorage.getItem(JWT_2FA_STORAGE_KEY);
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  const res = await axiosInstance.post(
    `/Administration/TwoFactor/PassLogin?code=${code.code}`,
  );
  if (res.status !== 200) {
    const message = res?.response?.data?.message;
    throw new Error(message || t("loginFailed"));
  }
  const accessToken = res.data.token;
  if (typeof res.data === "string") {
    const message = res.data.trim();
    throw new Error(message);
  }
  if (res.status === 200) {
    window.location.href = CONFIG.auth.redirectPath;
  }
  if (!accessToken) {
    throw new Error(t("tokenFailed"));
  }
  setSession(accessToken);
};

/** **************************************
 * Login with recovery code
 *************************************** */
export const loginWithRecoveryCode = async (recoveryCode, t) => {
  const token = localStorage.getItem(JWT_2FA_STORAGE_KEY);
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  const res = await axiosInstance.post(
    `/Administration/TwoFactor/LoginWithRecoveryCode?recoveryCode=${recoveryCode}`,
  );
  if (res.status !== 200) {
    const message = res?.response?.data?.message;
    throw new Error(message || "Hyrja d�shtoi, ju lutemi provoni p�rs�ri.");
  }
  if (typeof res.data === "string") {
    const message = res.data.trim();
    throw new Error(message);
  }
  const accessToken = res.data.token;
  if (res.status === 200) {
    window.location.href = CONFIG.auth.redirectPath;
  }
  if (!accessToken) {
    throw new Error(t("tokenFailed"));
  }
  setSession(accessToken);
};

/** **************************************
 * Reset authenticator app
 *************************************** */
export const resetAuthentication = async (password, code) => {
  try {
    return await axiosInstance.post(
      `/Administration/TwoFactor/ResetAuthenticatorApp?password=${password}&code=${code}`,
    );
  } catch (error) {
    console.error("Error during reseting the authenticator app:", error);
    throw error;
  }
};

/** **************************************
 * Reset recovery codes
 *************************************** */
export const resetRecoveryCodes = async () => {
  try {
    const response = await axios.post(
      "/Administration/TwoFactor/ReGenerateRecoveryCodes",
    );
    return response;
  } catch (error) {
    console.error("Error during reseting the recovery codes:", error);
    throw error;
  }
};

/** **************************************
 * Get Qr Code and Secret Key
 *************************************** */
export const get2faCode = async () => {
  try {
    const response = await axios.get("/Administration/TwoFactor/generate");
    return response;
  } catch (error) {
    console.error("Error during getting the QR code:", error);
    throw error;
  }
};

/** **************************************
 * Set up code
 *************************************** */
export const setUpCode = async (code) => {
  try {
    const response = await axios.post(
      `/Administration/TwoFactor/SetupCode?code=${code.code}`,
    );
    return response;
  } catch (error) {
    console.error("Error during setting up the code:", error);
    throw error;
  }
};

/** **************************************
 * Disable 2FA
 *************************************** */
export const disable2FA = async () => {
  try {
    const response = await axios.post("/Administration/TwoFactor/Disable2FA");
    return response;
  } catch (error) {
    console.error("Error during reseting the recovery codes:", error);
    throw error;
  }
};

/** **************************************
 * Get 2FA Key
 *************************************** */
export const getAuthenticatorKey = async () => {
  try {
    const response = await axios.get(
      "/Administration/TwoFactor/getAuthenticatorKey",
    );
    return response;
  } catch (error) {
    console.error("Error during reseting the recovery codes:", error);
    throw error;
  }
};
