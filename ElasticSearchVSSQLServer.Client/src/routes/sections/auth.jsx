import { Outlet } from "react-router";
import { lazy, Suspense } from "react";

import { AuthCenteredLayout } from "src/layouts/auth-centered";

import { SplashScreen } from "src/components/loading-screen";

import { GuestGuard } from "src/auth/guard";
// import { JwtLoginWith2FAView } from "src/auth/view/jwt/jwt-login-with-2FA-view";
// import { JwtLoginWithRecoveryCodeView } from "src/auth/view/jwt/jwt-login-with-recoveryCodes-view";

// ----------------------------------------------------------------------

/** **************************************
 * Jwt
 *************************************** */
const Jwt = {
  SignInPage: lazy(() => import("src/pages/auth/jwt/sign-in")),
  SignUpPage: lazy(() => import("src/pages/auth/jwt/sign-up")),
  ResetPasswordPage: lazy(() => import("src/pages/auth/jwt/reset-password")),
  UpdatePasswordPage: lazy(() => import("src/pages/auth/jwt/update-password")),
};

const authJwt = {
  path: "jwt",
  children: [
    {
      path: "sign-in",
      element: (
        <GuestGuard>
          <AuthCenteredLayout
            slotProps={{
              section: { title: "Hi, Welcome back" },
            }}
          >
            <Jwt.SignInPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: "sign-up",
      element: (
        <GuestGuard>
          <AuthCenteredLayout>
            <Jwt.SignUpPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: "reset-password",
      element: (
        <GuestGuard>
          <AuthCenteredLayout>
            <Jwt.ResetPasswordPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: "update-password",
      element: (
        <GuestGuard>
          <AuthCenteredLayout>
            <Jwt.UpdatePasswordPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    // {
    //   path: "login-2fa",
    //   element: (
    //     <GuestGuard>
    //       <AuthCenteredLayout>
    //         <JwtLoginWith2FAView />
    //       </AuthCenteredLayout>
    //     </GuestGuard>
    //   ),
    // },
    // {
    //   path: "recovery-codes",
    //   element: (
    //     <GuestGuard>
    //       <AuthCenteredLayout>
    //         <JwtLoginWithRecoveryCodeView />
    //       </AuthCenteredLayout>
    //     </GuestGuard>
    //   ),
    // },
  ],
};

// ----------------------------------------------------------------------

export const authRoutes = [
  {
    path: "auth",
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [authJwt],
  },
];
