import { JwtLoginWithRecoveryCodeView } from "src/auth/view/jwt/jwt-login-with-recoveryCodes-view";
import { CONFIG } from "../../../global-config";

const metadata = {
  title: `Login With Recovery Codes | Jwt - ${CONFIG.appName}`,
};
export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <JwtLoginWithRecoveryCodeView />
    </>
  );
}
