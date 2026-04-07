import { lazy } from "react";
import { Navigate } from "react-router";

import { authRoutes } from "./auth";
import { dashboardRoutes } from "./dashboard";
import { administrationRoutes } from "./administration";
import { profileRoutes } from "./profile";
import { CONFIG } from "../../global-config";

// ----------------------------------------------------------------------

const Page404 = lazy(() => import("../../pages/error/404"));

export const routesSection = [
  {
    path: "/",
    element: <Navigate to={CONFIG.auth.redirectPath} replace />,
  },

  // Auth
  ...authRoutes,

  // Dashboard
  ...dashboardRoutes,
  ...administrationRoutes,
  ...profileRoutes,
  // No match
  { path: "*", element: <Page404 /> },
];
