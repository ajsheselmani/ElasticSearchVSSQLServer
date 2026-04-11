import { Outlet } from "react-router-dom";
import { CONFIG } from "../../global-config";

// ----------------------------------------------------------------------

const metadata = { title: `Ballina - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <Outlet />
    </>
  );
}
