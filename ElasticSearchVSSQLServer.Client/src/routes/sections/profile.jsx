import { lazy, Suspense } from "react";
import { Outlet } from "react-router";
import { usePathname } from "../hooks";
import { LoadingScreen } from "src/components/loading-screen";
import { DashboardLayout } from "src/layouts/dashboard";
import { AuthGuard } from "src/auth/guard";

const IndexPage = lazy(() => import("../../pages/account/index.jsx"));
const Profile = lazy(() => import("src/pages/account/profile/Profile"));
const ChangePassword = lazy(
  () => import("src/pages/account/changePassword/changePassword"),
);

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const profileLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const profileRoutes = [
  {
    path: "",
    element: <AuthGuard>{profileLayout()}</AuthGuard>,
    children: [
      {
        path: "",
        element: <IndexPage />,
        children: [
          {
            path: "/profile",
            element: <Profile />,
          },
          {
            path: "/password",
            element: <ChangePassword />,
          },
        ],
      },
    ],
  },
];
