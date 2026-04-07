import { JwtUpdatePasswordView } from "src/auth/view/jwt";
import { CONFIG } from "../../../global-config";

// ----------------------------------------------------------------------

const metadata = { title: `Update password - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <JwtUpdatePasswordView />
    </>
  );
}
