import { AuthGuard } from "src/auth/guard";
import { Outlet } from "react-router";
import { DashboardLayout } from "src/layouts/dashboard";
import { lazy } from "react";

const AccountUserLogsDetails = lazy(
  () => import("src/pages/administration/user/account/logDetails"),
);

const UserLogsPage = lazy(
  () => import("src/pages/administration/user-logs/index"),
);

const administrationLayout = () => (
  <DashboardLayout>
    <Outlet />{" "}
  </DashboardLayout>
);

export const administrationRoutes = [
  {
    path: "administration/userlogs",
    element: <AuthGuard>{administrationLayout()}</AuthGuard>,
    children: [
      {
        path: "",
        element: <UserLogsPage />,
        children: [
          {
            path: ":logId",
            element: <AccountUserLogsDetails />,
          },
        ],
      },
    ],
  },
];
