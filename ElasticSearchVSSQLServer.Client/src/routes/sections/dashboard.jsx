import { Outlet } from "react-router";
import { lazy, Suspense } from "react";

import { DashboardLayout } from "src/layouts/dashboard";

import { LoadingScreen } from "src/components/loading-screen";

import { AuthGuard } from "src/auth/guard";

import { usePathname } from "../hooks";
import { CONFIG } from "../../global-config";

// ----------------------------------------------------------------------

const PerformanceDashboardPage = lazy(
  () => import("src/pages/testResults/testResults"),
);

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const dashboardRoutes = [
  {
    path: "dashboard",
    element: CONFIG.auth.skip ? (
      dashboardLayout()
    ) : (
      <AuthGuard>{dashboardLayout()}</AuthGuard>
    ),
    children: [{ element: <PerformanceDashboardPage />, index: true }],
  },
];
