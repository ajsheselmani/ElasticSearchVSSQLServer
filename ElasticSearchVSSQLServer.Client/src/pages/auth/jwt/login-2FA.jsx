import { JwtLoginWith2FAView } from "src/auth/view/jwt/jwt-login-with-2FA-view";
import { CONFIG } from "../../../global-config";

const metadata = { title: `Login With 2FA | Jwt - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <JwtLoginWith2FAView />
    </>
  );
}
