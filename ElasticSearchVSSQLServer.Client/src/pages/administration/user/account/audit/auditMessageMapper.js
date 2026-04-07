export function getAuditMessageKey(row) {
  const action = row?.fields?.actionName || row?.fields?.ActionName || "";
  const template = row?.messageTemplate || row?.message || "";

  const lower = (s) => (s || "").toLowerCase();
  const contains = (s) => lower(template).includes(lower(s));

  if (
    action.includes("AuthController.Post") &&
    contains("kyçja u krye me sukses")
  )
    return "audit.login.success";

  if (contains("kyçja dështoi") || contains("kyçja deshtoi"))
    return "audit.login.failed";

  if (contains("përdoruesi u bllokua") || contains("perdoruesi u bllokua"))
    return "audit.login.blocked";

  if (contains("kyçja u refuzua") || contains("kyçja u refuzua"))
    return "audit.login.refused";

  if (
    contains("validimi në domain dështoi") ||
    contains("validimi ne domain deshtoi")
  )
    return "audit.login.domainFailed";

  if (action.includes("AuthController.Logout")) return "audit.logout.success";

  if (
    action.includes("AuthController.ResetPasswordEmail") &&
    contains("u dërgua")
  )
    return "audit.password.email.sent";

  if (
    action.includes("UserController.ResetPassword") &&
    contains("Perditesimi i fjalekalimit te perdoruesit")
  )
    return "audit.password.admin.success";

  if (
    action.includes("UserController.ResetPassword") &&
    contains(
      "Deshtoi perditesimi i fjalekalimit nga administratori te perdoruesit",
    )
  )
    return "audit.password.admin.failed";

  if (
    action.includes("UserController.ResetPassword") &&
    contains("Deshtoi perditesimi i fjalekalimit te perdoruesit")
  )
    return "audit.password.user.failed";

  if (
    action.includes("UserController.ResetPasswordFromAdmin") &&
    contains("Reset i password-it përfundoi me sukses")
  )
    return "audit.password.user.success";

  if (
    contains("resetpasswordemail dështoi") ||
    contains("resetpasswordemail deshtoi")
  )
    return "audit.password.email.failed";

  if (
    action.includes("UserController.ChangeUserRole") ||
    contains("perditesimi i rolit te perdoruesit")
  )
    return "audit.accessLevel.changed";

  if (
    action.includes("UserController.ChangeUserRole") ||
    contains("Ndryshimi i rolit dështoi")
  )
    return "audit.accessLevel.failed";

  return "audit.generic";
}

export function getAuditMessageText(row, t) {
  const key = getAuditMessageKey(row);
  const translated = t(key);
  if (translated && translated !== key) return translated;

  return row?.messageTemplate || row?.message || "";
}
