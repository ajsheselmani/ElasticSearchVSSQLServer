import { JwtSignUpView } from "src/auth/view/jwt";
import { CONFIG } from "../../../global-config";

// ----------------------------------------------------------------------

const metadata = { title: `Sign up | Jwt - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <JwtSignUpView />
    </>
  );
}
