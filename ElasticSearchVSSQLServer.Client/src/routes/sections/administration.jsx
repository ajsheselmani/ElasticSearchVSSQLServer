import { AuthGuard } from "src/auth/guard";
import { Outlet } from "react-router";
import { DashboardLayout } from "src/layouts/dashboard";
import { lazy } from "react";
import { AccountLayout } from "src/pages/administration/user/account/account-layout";

const MenuIndexPage = lazy(
  () => import("src/pages/administration/menus/index"),
);
const MenuEditPage = lazy(() => import("src/pages/administration/menus/edit"));
// const ThemePage = lazy(() => import("src/pages/administration/themes/index"));
// const ThemeUpsertPage = lazy(
//   () => import("src/pages/administration/themes/upsert"),
// );

const UserUpsertPage = lazy(
  () => import("src/pages/administration/user/user-new-edit-form"),
);
const UserRegisterForm = lazy(
  () => import("src/pages/administration/user/user-register-form"),
);
const UserResetPasswordPage = lazy(
  () => import("src/pages/administration/user/userResetPassword"),
);
const AccountUserLogsPage = lazy(
  () => import("src/pages/administration/user/account/user-logs"),
);
const UserLockState = lazy(
  () => import("src/pages/administration/user/setLockState"),
);
const AccountUserLogsDetails = lazy(
  () => import("src/pages/administration/user/account/logDetails"),
);

const UserPage = lazy(() => import("src/pages/administration/user/index"));

const UserLogsPage = lazy(
  () => import("src/pages/administration/user-logs/index"),
);

const administrationLayout = () => (
  <DashboardLayout>
    <Outlet />{" "}
  </DashboardLayout>
);

const accountLayout = () => (
  <AccountLayout>
    <Outlet />
  </AccountLayout>
);

export const administrationRoutes = [
  // {
  //   path: "administration/authorisation",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <IndexPage />,
  //       children: [
  //         {
  //           path: ":id",
  //           element: <EditModuleDialog />,
  //         },
  //       ],
  //     },
  //     {
  //       path: "operation/:id",
  //       element: <ModuleOperationPage />,
  //       children: [
  //         {
  //           path: "create",
  //           element: <ModuleOperationUpsertPage />,
  //         },
  //         {
  //           path: "edit/:operationId",
  //           element: <ModuleOperationUpsertPage />,
  //         },
  //         {
  //           path: ":operationId",
  //           element: <ModuleOperationWrapper />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  {
    path: "administration/menu",
    element: <AuthGuard>{administrationLayout()}</AuthGuard>,
    children: [
      {
        path: "",
        element: <MenuIndexPage />,
        children: [
          {
            path: ":id",
            element: <MenuEditPage />,
          },
        ],
      },
    ],
  },
  // {
  //   path: "administration/reportParameter",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <ReportParameterPage />,
  //       children: [
  //         {
  //           path: ":id",
  //           element: <ReportParameterUpsertPage />,
  //         },
  //         {
  //           path: "delete/:id/*",
  //           element: <ReportParameterDeactivePage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/moduleAccess",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <ModuleAccessPages />,
  //       children: [
  //         {
  //           path: ":moduleOperationId",
  //           element: <ModuleAccessPages />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/menu",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <MenuIndexPage />,
  //       children: [
  //         {
  //           path: ":id",
  //           element: <MenuEditPage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/reportConfig",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <ReportConfigure />,
  //       children: [
  //         {
  //           path: ":id",
  //           element: <ReportConfigEditor />,
  //         },
  //         {
  //           path: "addReportType",
  //           element: <AddReportConfigure />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/role",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <RolePage />,
  //       children: [
  //         {
  //           path: ":id",
  //           element: <RoleUpsertPage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/email-configuration",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <EmailConfigurationIndexPage />,
  //       children: [
  //         {
  //           path: "delete/:id",
  //           element: <EmailConfigurationDeletePage />,
  //         },
  //         {
  //           path: "activate/:id",
  //           element: <EmailConfigurationActivatePage />,
  //         },
  //         {
  //           path: ":id",
  //           element: <EmailConfigurationRegisterPage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/themes",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <ThemePage />,
  //       children: [
  //         {
  //           path: ":id",
  //           element: <ThemeUpsertPage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/form",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <FormPage />,
  //       children: [
  //         {
  //           path: "delete/:id",
  //           element: <FormDeletePage />,
  //         },
  //         {
  //           path: "activate/:id",
  //           element: <FormActivatePage />,
  //         },
  //         {
  //           path: ":id",
  //           element: <FormUpsertPage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/configuration",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <ConfigurationPage />,
  //       children: [
  //         {
  //           path: "delete/:id",
  //           element: <ConfigurationDeletePage />,
  //         },
  //         {
  //           path: "activate/:id",
  //           element: <ConfigurationActivatePage />,
  //         },
  //         {
  //           path: ":id",
  //           element: <ConfigurationUpsertPage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/payment",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <ConfirmPaymentsPage />,
  //     },
  //   ],
  // },
  // {
  //   path: "administration/lookuptable/*",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "*",
  //       element: <LookUpTableIndexPage />,
  //       children: [
  //         {
  //           path: ":tid/create",
  //           element: <LookUpTablePostPage />,
  //         },
  //         {
  //           path: ":tid/:id",
  //           element: <LookUpTableEditPage />,
  //         },
  //         {
  //           path: ":tid/deactivate/:id/*",
  //           element: <LookUpTableActivePage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  {
    path: "administration/user",
    element: <AuthGuard>{administrationLayout()}</AuthGuard>,
    children: [
      {
        path: "",
        element: <UserPage />,
        children: [
          {
            path: "create",
            element: <UserRegisterForm />,
          },
          {
            path: "setLockState/:tId/:action",
            element: <UserLockState />,
          },
        ],
      },
      {
        path: ":id/account",
        element: accountLayout(),
        children: [{ index: true, element: <UserUpsertPage /> }],
      },
      {
        path: ":id/password",
        element: accountLayout(),
        children: [{ index: true, element: <UserResetPasswordPage /> }],
      },
      {
        path: ":id/logs",
        element: accountLayout(),
        children: [
          {
            index: true,
            element: <AccountUserLogsPage />,
          },
          {
            path: ":logId",
            element: <AccountUserLogsPage />,
            children: [
              {
                index: true,
                element: <AccountUserLogsDetails />,
              },
            ],
          },
        ],
      },
    ],
  },
  // {
  //   path: "administration/manuals",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <Manuals />,
  //       children: [
  //         {
  //           path: ":id",
  //           element: <ManualsUpsertPage />,
  //         },
  //         {
  //           path: "delete/:id",
  //           element: <ManualsDeletePage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/graphql-access",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <GraphQLAccess />,
  //     },
  //   ],
  // },
  // {
  //   path: "administration/statistics",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <Statistics />,
  //       children: [
  //         {
  //           path: "edit/:id",
  //           element: <StatisticsUpsertPage />,
  //         },
  //         {
  //           path: "create",
  //           element: <StatisticsUpsertPage />,
  //         },
  //         {
  //           path: "delete/:id/*",
  //           element: <StatisticsDeletePage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
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
  // {
  //   path: "administration/kibanaReports/*",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <KibanaReportsConfigure />,
  //       children: [
  //         {
  //           path: "kibana/:id",
  //           element: <KibanaReportsMainContent />,
  //         },
  //         {
  //           path: "custom/:workspaceId",
  //           element: (
  //             <div className="h-full">
  //               <WorkspaceViewer />
  //             </div>
  //           ),
  //         },
  //         {
  //           path: "",
  //           element: (
  //             <div className="flex h-20 items-center justify-center gap 1">
  //               <Icon icon="iconoir:3d-select-solid" fontSize="42px" />
  //               Zgjedhni një raport nga lista e raporteve
  //             </div>
  //           ),
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   path: "administration/hangfire",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [{ path: "", element: <HangfirePage /> }],
  // },
  // {
  //   path: "administration/formAccess",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [{ path: "", element: <FormAccessPage /> }],
  // },
  // {
  //   path: "administration/search-in-arc",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <SearchInARC>{administrationLayout()}</SearchInARC>,
  //     },
  //   ],
  // },
  // {
  //   path: "administration/workflow",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <Workflow />,
  //       children: [
  //         {
  //           path: "edit/:id",
  //           element: <WorkflowEdit />,
  //         },
  //         {
  //           path: "create",
  //           element: <WorkflowEdit />,
  //         },
  //       ],
  //     },
  //     {
  //       path: "design/:id",
  //       element: <WorkflowDesign />,
  //     },
  //   ],
  // },
  // {
  //   path: "administration/payments",
  //   element: <AuthGuard>{administrationLayout()}</AuthGuard>,
  //   children: [
  //     {
  //       path: "",
  //       element: <FinancialInstitutionPage />,
  //       children: [
  //         {
  //           path: "edit/:id",
  //           element: <FinancialInstitutionUpsertPage />,
  //         },
  //         {
  //           path: "create",
  //           element: <FinancialInstitutionUpsertPage />,
  //         },
  //         {
  //           path: "delete/:id",
  //           element: <FinancialInstitutionDeletePage />,
  //         },
  //       ],
  //     },
  //   ],
  // },
];
