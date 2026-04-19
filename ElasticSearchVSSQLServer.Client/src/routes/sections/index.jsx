import { lazy } from "react";
import { Navigate } from "react-router";

import { authRoutes } from "./auth";
import { dashboardRoutes } from "./dashboard";
import { profileRoutes } from "./profile";
import { CONFIG } from "../../global-config";
import { sqlDataRoutes } from "./sqlData";

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
  ...profileRoutes,
  ...sqlDataRoutes,
  // No match
  { path: "*", element: <Page404 /> },
];
