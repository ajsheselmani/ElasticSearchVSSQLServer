import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { paths } from "src/routes/paths";
import { useParams, usePathname } from "src/routes/hooks";
import { RouterLink } from "src/routes/components";

import { DashboardContent } from "src/layouts/dashboard";
import { removeLastSlash } from "minimal-shared/utils";

import { Iconify } from "src/components/iconify";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import SimpleLoadingScreen from "src/components/loading-screen/simple-loading-screen";

const query = gql`
  query users($userId: String!) {
    users(where: { id: { eq: $userId } }) {
      items {
        firstname
        lastname
      }
    }
  }
`;

export function AccountLayout({ children, ...other }) {
  const { id } = useParams();

  const [getUserDetails, { data, loading }] = useLazyQuery(query, {
    variables: {
      userId: id,
    },
  });
  const pathname = usePathname();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    {
      label: "Profili",
      icon: <Iconify width={24} icon="solar:user-id-bold" />,
      href: `${paths.administration.user}/${id}/account`,
    },
    {
      label: "Fjalëkalimi",
      icon: <Iconify width={24} icon="ic:round-vpn-key" />,
      href: `${paths.administration.user}/${id}/password`,
    },
    {
      label: "Gjurmët e përdoruesit",
      icon: <Iconify width={24} icon="material-symbols:fingerprint" />,
      href: `${paths.administration.user}/${id}/logs`,
    },
  ];

  useEffect(() => {
    if (id)
      getUserDetails({
        variables: {
          userId: id,
        },
      });
  }, [id]);

  return (
    <>
      {loading && <SimpleLoadingScreen />}
      <DashboardContent {...other}>
        <CustomBreadcrumbs
          heading={`Llogaria përdoruesit: ${data?.users?.items[0].firstname} ${data?.users?.items[0].lastname}`}
          links={[
            { name: t("homepage"), href: paths.dashboard.root },
            { name: t("users"), href: paths.administration.user },
            { name: "Llogaria" },
          ]}
          sx={{ mb: 3 }}
        />

        <Tabs value={removeLastSlash(pathname)} sx={{ mb: { xs: 3, md: 5 } }}>
          {NAV_ITEMS.map((tab) => (
            <Tab
              component={RouterLink}
              key={tab.href}
              label={tab.label}
              icon={tab.icon}
              value={tab.href}
              href={tab.href}
            />
          ))}
        </Tabs>

        {children}
      </DashboardContent>
    </>
  );
}
