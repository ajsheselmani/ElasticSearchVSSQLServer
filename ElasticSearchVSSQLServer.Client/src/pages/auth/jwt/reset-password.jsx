import { JwtResetPasswordView } from "src/auth/view/jwt";
import { CONFIG } from "../../../global-config";

// ----------------------------------------------------------------------

const metadata = { title: `Reset password - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <JwtResetPasswordView />
    </>
  );
}
