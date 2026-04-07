import { NotFoundView } from "src/sections/error";
import { CONFIG } from "../../global-config";

// ----------------------------------------------------------------------

const metadata = { title: `404 page not found! | Error - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <NotFoundView />
    </>
  );
}
