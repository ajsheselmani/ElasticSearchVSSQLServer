import { lazy, Suspense } from "react";
import { Outlet } from "react-router";
import { usePathname } from "../hooks";
import { LoadingScreen } from "src/components/loading-screen";
import { DashboardLayout } from "src/layouts/dashboard";
import { AuthGuard } from "src/auth/guard";

const IndexPage = lazy(() => import("src/pages/dashboard/one"));
const SQLDataPage = lazy(() => import("../../pages/sqlData/bankDataset"));
const ElectronicsDataPage = lazy(
  () => import("../../pages/sqlData/electronicsDataset"),
);
const ElectronicsElasticDataPage = lazy(
  () => import("../../pages/elasticData/electronicsElasticData"),
);
const LogsElasticDataPage = lazy(
  () => import("../../pages/elasticData/logsElasticSearch"),
);
const LogsSQLDataPage = lazy(() => import("../../pages/sqlData/logsSQLServer"));

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const sqlDataLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const sqlDataRoutes = [
  {
    path: "",
    element: <AuthGuard>{sqlDataLayout()}</AuthGuard>,
    children: [
      {
        path: "/sql",
        element: <IndexPage />,
        children: [
          {
            path: "bankData",
            element: <SQLDataPage />,
          },
          {
            path: "electronicsData",
            element: <ElectronicsDataPage />,
          },
          {
            path: "logsData",
            element: <LogsSQLDataPage />,
          },
        ],
      },
      {
        path: "/elastic",
        element: <IndexPage />,
        children: [
          {
            path: "bankData",
            element: <SQLDataPage />,
          },
          {
            path: "electronicsData",
            element: <ElectronicsElasticDataPage />,
          },
          {
            path: "logsData",
            element: <LogsElasticDataPage />,
          },
        ],
      },
    ],
  },
];
