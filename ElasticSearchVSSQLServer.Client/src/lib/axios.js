import axios from "axios";
import { CONFIG } from "../global-config";

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => error,
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error("Failed to fetch:", error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: "/api/Administration/chat",
  kanban: "/api/Administration/kanban",
  calendar: "/api/Administration/calendar",
  auth: {
    me: "/Administration/user/currentuser",
    signIn: "/Administration/auth",
    signUp: "/Administration/auth/sign-up",
  },
  mail: {
    list: "/api/Administration/mail/list",
    details: "/api/Administration/mail/details",
    labels: "/api/Administration/mail/labels",
  },
  post: {
    list: "/api/Administration/post/list",
    details: "/api/Administration/post/details",
    latest: "/api/Administration/post/latest",
    search: "/api/Administration/post/search",
  },
  product: {
    list: "/api/Administration/product/list",
    details: "/api/Administration/product/details",
    search: "/api/Administration/product/search",
  },
};
