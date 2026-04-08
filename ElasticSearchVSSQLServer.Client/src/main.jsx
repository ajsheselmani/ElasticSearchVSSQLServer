import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setContext } from "@apollo/client/link/context";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router";
import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import "./locales/index";
import "./global.css";
import App from "./app";
import { routesSection } from "./routes/sections";
import { ErrorBoundary } from "./routes/components";
import { CONFIG } from "./global-config";

// ----------------------------------------------------------------------

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL,
});

const authLink = setContext(() => {
  const accessToken = localStorage.getItem("jwt_access_token");
  let headersTemp = {};
  headersTemp["x-api-key"] = import.meta.env.VITE_GRAPHQL_KEY;
  return {
    headers: {
      ...headersTemp,
      authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "no-cache",
    },
    watchQuery: {
      fetchPolicy: "no-cache",
    },
  },
});

const router = createBrowserRouter([
  {
    Component: () => (
      <ApolloProvider client={client}>
        <App>
          <Outlet />
        </App>
      </ApolloProvider>
    ),
    errorElement: <ErrorBoundary />,
    children: routesSection,
  },
]);
document.title = CONFIG.appName;
const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
