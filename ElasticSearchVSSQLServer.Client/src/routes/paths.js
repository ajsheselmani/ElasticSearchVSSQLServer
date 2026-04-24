// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  ADMINISTRATION: "/administration",
  REPORTING: "/reporting",
};

// ----------------------------------------------------------------------

export const paths = {
  minimalStore: "https://mui.com/store/items/minimal-dashboard/",
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
  },
  sql: {
    electronicsData: "/sql/electronicsData",
    hmTransactionsData: "/sql/hmTransactionsData",
    logsData: "/sql/logsData",
  },
  elastic: {
    electronicsData: "/elastic/electronicsData",
    hmTransactionsData: "/elastic/hmTransactionsData",
    logsData: "/elastic/logsData",
    testResults: "/elastic/testResults",
  },
};
