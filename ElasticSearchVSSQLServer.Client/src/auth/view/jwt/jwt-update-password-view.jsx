// import { z as zod } from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useBoolean } from "minimal-shared/hooks";

// import Box from "@mui/material/Box";
// import Button from "@mui/material/Button";
// import IconButton from "@mui/material/IconButton";
// import InputAdornment from "@mui/material/InputAdornment";

// import { paths } from "src/routes/paths";
// import { useRouter, useSearchParams } from "src/routes/hooks";

// // import { SentIcon } from "src/assets/icons";

// import { Iconify } from "src/components/iconify";
// import { Form, Field } from "src/components/hook-form";

// import { FormHead } from "../../components/form-head";
// import { FormReturnLink } from "../../components/form-return-link";
// import axiosInstance from "src/lib/axios";
// import { useTranslation } from "react-i18next";
// import { useSnackbar } from "notistack";
// import { CONFIG } from "../../../global-config";

// export function JwtUpdatePasswordView() {
//   const router = useRouter();

//   const searchParams = useSearchParams();

//   const { t } = useTranslation();
//   const email = searchParams.get("email");
//   const token = searchParams.get("token");
//   const { enqueueSnackbar } = useSnackbar();
//   const showPassword = useBoolean();

//   const UpdatePasswordSchema = zod
//     .object({
//       email: zod
//         .string()
//         .min(1, { message: t("required") })
//         .email({ message: t("emailValidation") }),
//       token: zod.string(),
//       password: zod
//         .string()
//         .min(1, { message: t("required") })
//         .min(6, { message: t("password6characters") }),
//       confirmPassword: zod.string().min(1, { message: t("confirmPassword") }),
//     })
//     .refine((data) => data.password === data.confirmPassword, {
//       message: t("passwordDontMatch"),
//       path: ["confirmPassword"],
//     });

//   const defaultValues = {
//     email: email || "",
//     token: token || "",
//     password: "",
//     confirmPassword: "",
//   };

//   const methods = useForm({
//     resolver: zodResolver(UpdatePasswordSchema),
//     defaultValues,
//   });

//   const {
//     handleSubmit,
//     formState: { isSubmitting },
//   } = methods;

//   const onSubmit = handleSubmit(async (data) => {
//     try {
//       const result = await axiosInstance.post(
//         `/Administration/Auth/ResetPassword`,
//         {
//           email: data.email,
//           token: data.token,
//           newPassword: data.password,
//           confirmPassword: data.confirmPassword,
//         },
//       );
//       if (result.status === 200) {
//         enqueueSnackbar(t("dataSavedSuccessfully"), { variant: "success" });

//         router.push(paths.auth.jwt.signIn);
//       } else {
//         var message = result?.response?.data?.message ?? t("errorOccurred");
//         enqueueSnackbar(message, { variant: "error" });
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   });

//   const renderForm = () => (
//     <Box sx={{ gap: 3, display: "flex", flexDirection: "column" }}>
//       <Field.Text
//         name="email"
//         label={t("email")}
//         placeholder={email}
//         slotProps={{ inputLabel: { shrink: true } }}
//         disabled
//       />
//       <Field.Text name="token" style={{ display: "none" }} />
//       <Field.Text
//         name="password"
//         label={t("newPassword")}
//         type={showPassword.value ? "text" : "password"}
//         slotProps={{
//           inputLabel: { shrink: true },
//           input: {
//             endAdornment: (
//               <InputAdornment position="end">
//                 <IconButton onClick={showPassword.onToggle} edge="end">
//                   <Iconify
//                     icon={
//                       showPassword.value
//                         ? "solar:eye-bold"
//                         : "solar:eye-closed-bold"
//                     }
//                   />
//                 </IconButton>
//               </InputAdornment>
//             ),
//           },
//         }}
//       />

//       <Field.Text
//         name="confirmPassword"
//         label={t("confirmPassword")}
//         type={showPassword.value ? "text" : "password"}
//         slotProps={{
//           inputLabel: { shrink: true },
//           input: {
//             endAdornment: (
//               <InputAdornment position="end">
//                 <IconButton onClick={showPassword.onToggle} edge="end">
//                   <Iconify
//                     icon={
//                       showPassword.value
//                         ? "solar:eye-bold"
//                         : "solar:eye-closed-bold"
//                     }
//                   />
//                 </IconButton>
//               </InputAdornment>
//             ),
//           },
//         }}
//       />

//       <Button
//         fullWidth
//         size="large"
//         type="submit"
//         variant="contained"
//         loading={isSubmitting}
//         loadingIndicator="Update password..."
//       >
//         {t("save")}
//       </Button>
//     </Box>
//   );

//   return (
//     <>
//       <FormHead
//         // icon={<SentIcon />}
//         title={
//           <>
//             <div style={{ fontWeight: "800" }}>{CONFIG.appName}</div>
//             {t("updatePassword")}
//           </>
//         }
//         description={t("updatePasswordText")}
//       />

//       <Form methods={methods} onSubmit={onSubmit}>
//         {renderForm()}
//       </Form>

//       <FormReturnLink href={paths.auth.jwt.signIn} />
//       <div className="mt-2 text-center">
//         <p style={{ fontSize: "0.9rem" }}>
//           {t("version")} {CONFIG.version}
//         </p>
//       </div>
//     </>
//   );
// }
