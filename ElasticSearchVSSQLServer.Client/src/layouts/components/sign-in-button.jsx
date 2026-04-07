import Button from "@mui/material/Button";

import { RouterLink } from "src/routes/components";

// ----------------------------------------------------------------------

export function SignInButton({ sx, ...other }) {
  return (
    <Button
      component={RouterLink}
      // href={CONFIG.auth.redirectPath}
      variant="outlined"
      sx={sx}
      {...other}
    >
      Sign in
    </Button>
  );
}
