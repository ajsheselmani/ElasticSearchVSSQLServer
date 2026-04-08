import { paths } from "src/routes/paths";
import { Iconify } from "src/components/iconify";

// ----------------------------------------------------------------------

const icon = (name) => <Iconify icon={name} width={24} />;

export const ICONS = {
  dashboard: icon("solar:widget-3-bold-duotone"),
  user: icon("solar:users-group-rounded-bold-duotone"),
  menu: icon("streamline-logos:elastic-logo-block"),
};

// ----------------------------------------------------------------------

export const navData = [
  {
    items: [
      {
        title: "Dashboard",
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
      },
    ],
  },
  {
    subheader: "Administration",
    items: [
      {
        title: "Users",
        path: paths.administration.user,
        icon: ICONS.user,
      },
      {
        title: "Menus",
        path: paths.administration.menus,
        icon: ICONS.menu,
      },
    ],
  },
];
