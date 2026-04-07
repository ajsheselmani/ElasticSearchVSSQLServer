// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  ADMINISTRATION: '/administration',
  REPORTING: '/reporting',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
      resetPassword: `${ROOTS.AUTH}/jwt/reset-password`,
      updatePassword: `${ROOTS.AUTH}/jwt/update-password`,
      login2FA: `${ROOTS.AUTH}/jwt/login-2fa`,
      recoveryCodes: `${ROOTS.AUTH}/jwt/recovery-codes`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    notifications: `/all_notifications`,
  },
  administration: {
    root: ROOTS.ADMINISTRATION,
    authorisation: {
      index: `${ROOTS.ADMINISTRATION}/authorisation`,
      create: `${ROOTS.ADMINISTRATION}/authorisation/create`,
    },
    menus: `${ROOTS.ADMINISTRATION}/menu`,
    emailConfiguration: {
      index: `${ROOTS.ADMINISTRATION}/email-configuration`,
      create: `${ROOTS.ADMINISTRATION}/email-configuration/create`,
    },
    lookuptable: `${ROOTS.ADMINISTRATION}/lookuptable`,
    user: `${ROOTS.ADMINISTRATION}/user`,
    forms: `${ROOTS.ADMINISTRATION}/form`,
    roles: `${ROOTS.ADMINISTRATION}/role`,
    graphQLAccess: `${ROOTS.ADMINISTRATION}/graphql-access`,
    hangfire: `${ROOTS.ADMINISTRATION}/hangfire`,
  },
  banking: {
    root: ROOTS.BANKING,
    bankPayments: `${ROOTS.BANKING}/bankPayments`,
  },
  reporting: {
    index: `${ROOTS.REPORTING}`,
    create: `${ROOTS.REPORTING}/create`,
  },
};
