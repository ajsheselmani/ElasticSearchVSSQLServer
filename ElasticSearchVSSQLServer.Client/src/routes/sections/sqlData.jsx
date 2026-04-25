import { lazy, Suspense } from "react";
import { Outlet } from "react-router";
import { usePathname } from "../hooks";
import { LoadingScreen } from "src/components/loading-screen";
import { DashboardLayout } from "src/layouts/dashboard";
import { AuthGuard } from "src/auth/guard";

const IndexPage = lazy(() => import("src/pages/dashboard/one"));
const ElectronicsDataPage = lazy(
  () => import("../../pages/sqlData/electronicsDataset"),
);
const HMTransactionsDataPage = lazy(
  () => import("../../pages/sqlData/hmTransactionsDataset"),
);
const ElectronicsElasticDataPage = lazy(
  () => import("../../pages/elasticData/electronicsElasticData"),
);
const HMTransactionsElasticDataPage = lazy(
  () => import("../../pages/elasticData/hmTransactionsElasticData"),
);
const LogsElasticDataPage = lazy(
  () => import("../../pages/elasticData/logsElasticSearch"),
);
const TestResultsPage = lazy(
  () => import("../../pages/testResults/testResults"),
);
const LogsSQLDataPage = lazy(() => import("../../pages/sqlData/logsSQLServer"));
const QueryComparisonPage = lazy(
  () => import("../../pages/compare/queryDatasetComparison"),
);

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
            path: "electronicsData",
            element: <ElectronicsDataPage />,
          },
          {
            path: "hmTransactionsData",
            element: <HMTransactionsDataPage />,
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
            path: "electronicsData",
            element: <ElectronicsElasticDataPage />,
          },
          {
            path: "hmTransactionsData",
            element: <HMTransactionsElasticDataPage />,
          },
          {
            path: "logsData",
            element: <LogsElasticDataPage />,
          },
          {
            path: "testResults",
            element: <TestResultsPage />,
          },
        ],
      },
      {
        path: "/compare",
        element: <IndexPage />,
        children: [
          {
            path: "querySearch",
            element: <QueryComparisonPage />,
          },
        ],
      },
    ],
  },
];
