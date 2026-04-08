// import { gql } from "@apollo/client";
// import { useLazyQuery } from "@apollo/client/react";

// import {
//   Autocomplete,
//   Box,
//   Button,
//   Card,
//   FormControl,
//   FormControlLabel,
//   FormHelperText,
//   FormLabel,
//   Grid,
//   LinearProgress,
//   MenuItem,
//   Radio,
//   RadioGroup,
//   Stack,
//   TextField,
// } from "@mui/material";
// import { Formik } from "formik";
// import { useSnackbar } from "notistack";
// import React, { useMemo, useState, useEffect } from "react";
// import { useTranslation } from "react-i18next";
// import { useNavigate, useParams } from "react-router";
// import { useAuthContext } from "src/auth/hooks";
// import axiosInstance from "src/lib/axios";
// import * as Yup from "yup";
// import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
// import dayjs from "dayjs";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import PhoneNumberInput from "src/auth/components/PhoneNumberInput";
// import ImageUpload from "./imageUpload";

// const query = gql`
//   query users($id: String!) {
//     users(where: { id: { eq: $id } }) {
//       items {
//         lastname
//         firstname
//         userName
//         personalNumber
//         realRoleUser(where: { active: { eq: true } }) {
//           role {
//             id
//           }
//         }

//         email
//         phoneNumber
//         birthdate
//         gender
//         language
//         domainId
//         imageProfile
//       }
//     }
//   }
// `;

// const getRole = gql`
//   query roles {
//     roles {
//       items {
//         id
//         nameSq
//         nameEn
//         nameSr
//       }
//     }
//   }
// `;

// function ImagePreviewEffect({ imageFile, setFieldValue }) {
//   React.useEffect(() => {
//     let objectUrl;

//     if (imageFile instanceof File && !imageFile.preview) {
//       objectUrl = URL.createObjectURL(imageFile);
//       const withPreview = Object.assign(imageFile, { preview: objectUrl });
//       setFieldValue("ImageProfile", withPreview);
//     }

//     return () => {
//       if (objectUrl) {
//         URL.revokeObjectURL(objectUrl);
//       }
//     };
//   }, [imageFile, setFieldValue]);

//   return null;
// }

// export default function UserNewEditForm() {
//   const { id } = useParams();
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const [getItem, { data, loading }] = useLazyQuery(query);
//   const { user } = useAuthContext();
//   const [isEditMode, setIsEditMode] = React.useState(!isNaN(Number(id)));
//   const [getRoleItem, { data: roledata }] = useLazyQuery(getRole);
//   const [role, setRole] = useState([]);
//   const [domain, setDomain] = useState([]);

//   const nameLocale = useMemo(() => {
//     if (user.language === 1) return "nameSq";
//     if (user.language === 3) return "nameSr";
//     return "nameEn";
//   }, [user.language]);

//   const [imageFile, setImageFile] = useState(null);

//   const [formValues, setFormValues] = React.useState({
//     id: "",
//     firstname: "",
//     language: null,
//     lastname: "",
//     password: "",
//     email: "",
//     confirmPassword: "",
//     roles: [],
//     userName: "",
//     gender: null,
//     birthdate: "",
//     phoneNumber: "",
//     activationDate: "",
//     expirationDate: "",
//     InsertedFrom: user.id,
//     personalNumber: "",
//     domainId: null,
//     imageProfile: null,
//   });

//   React.useEffect(() => {
//     if (id !== undefined) {
//       getItem({ variables: { id } });
//       setIsEditMode(true);
//     } else {
//       setFormValues({
//         id: "",
//         firstname: "",
//         language: null,
//         lastname: "",
//         password: "",
//         email: "",
//         confirmPassword: "",
//         roles: [],
//         userName: "",
//         gender: null,
//         birthdate: "",
//         phoneNumber: "",
//         activationDate: "",
//         expirationDate: "",
//         InsertedFrom: user.id,
//         personalNumber: "",
//         domainId: null,
//         imageProfile: null,
//       });
//       setIsEditMode(false);
//     }
//   }, [id]);

//   const getDomainData = async () => {
//     const res = await axiosInstance.get(
//       `/Administration/LookupTable/all?name=Domain`,
//     );
//     const domainData = [
//       { value: "", label: t("choose") },
//       ...res.data.map((r) => ({
//         value: r.DomainId,
//         label: r.Name,
//       })),
//     ];

//     setDomain(domainData);
//   };

//   React.useEffect(() => {
//     getRoleItem();
//     getDomainData();
//   }, []);

//   React.useEffect(() => {
//     if (roledata?.roles?.items) {
//       const formattedRoles = roledata.roles.items.map((r) => ({
//         value: r.id,
//         label: r[nameLocale],
//       }));

//       setRole(formattedRoles);
//     }
//   }, [nameLocale, roledata]);

//   useEffect(() => {
//     async function getData() {
//       if (id) {
//         await axiosInstance
//           .get(`Administration/User/GetProfileImage?id=${id}`)
//           .then((res) => {
//             const base64 = res.data;
//             const src = base64 ? `data:image/png;base64,${base64}` : null;
//             setImageFile(src);
//           })
//           .catch((err) => {
//             console.error("Failed to load image", err);
//           });
//       }
//     }
//     getData();
//   }, [id]);

//   const hasAccess = () => true;
//   //   {
//   //   const userAccess = formUserAccess.find((item) => item.selector === fieldName);
//   //   const roleAccess = formRoleAccess.find((item) => item.selector === fieldName);

//   //   const canWriteUpdate =
//   //     id !== undefined
//   //       ? (userAccess?.update ?? roleAccess?.update)
//   //       : (userAccess?.write ?? roleAccess?.write);
//   //   return canWriteUpdate === true;
//   // }; //TODO: Temporary until we solve the form access

//   function base64ToFileFromAxios(base64Data, filename, mimeType) {
//     const byteString = atob(base64Data);
//     const byteNumbers = new Array(byteString.length);
//     for (let i = 0; i < byteString.length; i++) {
//       byteNumbers[i] = byteString.charCodeAt(i);
//     }
//     const byteArray = new Uint8Array(byteNumbers);
//     return new File([byteArray], filename, { type: mimeType });
//   }

//   function detectMimeTypeFromBase64(base64Data) {
//     const prefix = base64Data.slice(0, 4);
//     if (prefix === "/9j/") return "image/jpeg";
//     if (prefix === "iVBO") return "image/png";
//     if (prefix === "R0lG") return "image/gif";
//     if (prefix === "UklG") return "image/webp";
//     if (prefix === "Qk3G") return "image/bmp";
//     return "application/octet-stream";
//   }
//   async function appendProfileImage(formData, id, valuesData, imageFile) {
//     if (imageFile instanceof File) {
//       formData.append("ImageProfile", imageFile);
//     } else if (imageFile === null) {
//       formData.append("ImageProfile", "");
//     } else if (valuesData.imageProfile) {
//       const result = await axiosInstance.get(
//         "/Administration/User/GetProfileImage",
//         {
//           params: { id },
//         },
//       );
//       if (result.status === 200 && result.data) {
//         const base64 = result.data;
//         const mimeType = detectMimeTypeFromBase64(base64);
//         const ext = mimeType.split("/")[1];
//         const filename = `profile-${id}.${ext}`;
//         const image_File = base64ToFileFromAxios(base64, filename, mimeType);
//         formData.append("ImageProfile", image_File);
//       }
//     } else {
//       formData.append("ImageProfile", "");
//     }
//   }
//   React.useEffect(() => {
//     if (data && data?.users?.items?.length > 0) {
//       const userr = data.users.items[0];
//       const roleIds = userr.realRoleUser?.map((r) => r.role.id) ?? [];
//       setFormValues({
//         ...userr,
//         id: id,
//         roles: roleIds,
//         domainId: userr.domainId != null ? userr.domainId : "",
//       });
//     }
//   }, [data]);

//   const register_validationSchema = Yup.object().shape({
//     firstname: Yup.string().required(t("required")),
//     lastname: Yup.string().required(t("required")),
//     userName: Yup.string().required(t("required")),
//     email: Yup.string().email(t("validEmail")).required(t("required")),
//     language: Yup.number().required(t("required")),
//     phoneNumber: Yup.string().required(t("required")),
//     birthdate: Yup.string().required(t("required")),
//     personalNumber: Yup.string()
//       .required(t("required"))
//       .matches(/^[0-9]+$/, t("personalNumberMustHaveNumbers")),
//     password: Yup.string()
//       .nullable()
//       .when("domainId", {
//         is: (val) => val === null || val === "",
//         then: () => Yup.string().required("Password is required"),
//         otherwise: () => Yup.string().nullable(),
//       }),
//     confirmPassword: Yup.string()
//       .nullable()
//       .when("domainId", {
//         is: (val) => val === null || val === "",
//         then: () =>
//           Yup.string()
//             .required(t("required"))
//             .oneOf([Yup.ref("password")], t("passwordNoMatch")),
//         otherwise: () => Yup.string().nullable(),
//       }),
//     roles: Yup.array()
//       .of(Yup.string().required(t("required")))
//       .min(1, t("atLeastOneRole"))
//       .required(t("required")),
//     gender: Yup.number().required(t("required")),
//     domainId: Yup.number().nullable(),
//   });

//   const { enqueueSnackbar } = useSnackbar();

//   const langOptions = [
//     { value: 1, label: t("sq") },
//     { value: 2, label: t("en") },
//     { value: 3, label: t("sr") },
//   ];

//   return (
//     <React.Fragment>
//       <Formik
//         initialValues={formValues}
//         enableReinitialize="true"
//         validationSchema={register_validationSchema}
//         onSubmit={async (values, { setSubmitting }) => {
//           setSubmitting(true);

//           const valuesData = {
//             ...values,
//             domainId: values.domainId === "" ? null : Number(values.domainId),
//           };

//           if (
//             valuesData.birthdate instanceof Date &&
//             !isNaN(valuesData.birthdate)
//           ) {
//             valuesData.birthdate = valuesData.birthdate
//               .toISOString()
//               .split("T")[0];
//           }

//           const formData = new FormData();
//           Object.entries(valuesData).forEach(([key, value]) => {
//             if (key === "ImageProfile") return;
//             if (Array.isArray(value)) {
//               value.forEach((v) => formData.append(key, v));
//             } else {
//               formData.append(key, value ?? "");
//             }
//           });

//           await appendProfileImage(formData, id, valuesData, imageFile);
//           try {
//             const result = isEditMode
//               ? await axiosInstance.put(`/Administration/User/`, formData)
//               : await axiosInstance.post(
//                   "/Administration/User/RegisterNewUser",
//                   formData,
//                 );

//             if (result.status === 200) {
//               enqueueSnackbar(t("dataSavedSuccessfully"), {
//                 variant: "success",
//                 autoHideDuration: 1500,
//               });
//               if (!isEditMode) navigate(-1);
//             } else {
//               const message =
//                 result?.response?.data?.message ?? t("errorOccurred");
//               enqueueSnackbar(message, { variant: "error" });
//             }
//           } catch (err) {
//             enqueueSnackbar(t("errorOccurred"), err, {
//               variant: "error",
//               autoHideDuration: 1500,
//             });
//           } finally {
//             setSubmitting(false);
//           }
//         }}
//       >
//         {({
//           errors,
//           touched,
//           handleChange,
//           handleBlur,
//           values,
//           submitForm,
//           setFieldValue,
//           isSubmitting,
//         }) => (
//           <>
//             {isSubmitting && <LinearProgress sx={{ mb: 2 }} />}

//             <ImagePreviewEffect
//               imageData={imageFile}
//               setFieldValue={setFieldValue}
//             />
//             <Grid container spacing={3}>
//               <Grid size={{ xs: 12, md: 4 }}>
//                 <Card sx={{ pt: 10, pb: 5, px: 3 }}>
//                   <Box sx={{ display: "flex", justifyContent: "center" }}>
//                     <ImageUpload
//                       imageData={imageFile}
//                       setImageFile={setImageFile}
//                     />
//                   </Box>
//                 </Card>
//               </Grid>

//               <Grid size={{ xs: 12, md: 8 }}>
//                 <Card sx={{ p: 3 }}>
//                   <Box
//                     sx={{
//                       rowGap: 3,
//                       columnGap: 2,
//                       display: "grid",
//                       gridTemplateColumns: {
//                         xs: "repeat(1, 1fr)",
//                         sm: "repeat(2, 1fr)",
//                       },
//                     }}
//                   >
//                     {hasAccess("firstname") && (
//                       <TextField
//                         fullWidth
//                         label={t("firstname")}
//                         name="firstname"
//                         value={values.firstname}
//                         onChange={handleChange}
//                         onBlur={handleBlur}
//                         error={Boolean(touched.firstname && errors.firstname)}
//                         helperText={touched.firstname && errors.firstname}
//                       />
//                     )}{" "}
//                     {hasAccess("lastname") && (
//                       <TextField
//                         fullWidth
//                         label={t("lastname")}
//                         name="lastname"
//                         value={values.lastname}
//                         onChange={handleChange}
//                         onBlur={handleBlur}
//                         error={Boolean(touched.lastname && errors.lastname)}
//                         helperText={touched.lastname && errors.lastname}
//                       />
//                     )}{" "}
//                     {hasAccess("email") && (
//                       <TextField
//                         fullWidth
//                         label={t("email")}
//                         name="email"
//                         value={values.email}
//                         onChange={handleChange}
//                         onBlur={handleBlur}
//                         disabled={isEditMode}
//                         error={Boolean(touched.email && errors.email)}
//                         helperText={touched.email && errors.email}
//                       />
//                     )}{" "}
//                     {hasAccess("gender") && (
//                       <FormControl
//                         component="fieldset"
//                         error={Boolean(touched.gender && errors.gender)}
//                       >
//                         <FormLabel component="legend">{t("gender")}</FormLabel>
//                         <RadioGroup
//                           row
//                           aria-labelledby="gender-radio-group-label"
//                           name="gender"
//                           value={values.gender ?? ""}
//                           onChange={handleChange}
//                         >
//                           <FormControlLabel
//                             value="2"
//                             control={<Radio />}
//                             label={t("female")}
//                           />
//                           <FormControlLabel
//                             value="1"
//                             control={<Radio />}
//                             label={t("male")}
//                           />
//                         </RadioGroup>
//                         {touched.gender && errors.gender && (
//                           <FormHelperText>{errors.gender}</FormHelperText>
//                         )}
//                       </FormControl>
//                     )}{" "}
//                     {hasAccess("birthdate") && (
//                       <LocalizationProvider dateAdapter={AdapterDayjs}>
//                         <DatePicker
//                           format="DD/MM/YYYY"
//                           label={t("birthdate")}
//                           value={
//                             values.birthdate ? dayjs(values.birthdate) : null
//                           }
//                           onChange={(date) => {
//                             if (date && date.isValid()) {
//                               setFieldValue("birthdate", date.toDate());
//                             } else {
//                               setFieldValue("birthdate", null);
//                             }
//                           }}
//                           slotProps={{
//                             textField: {
//                               error: Boolean(
//                                 touched.birthdate && errors.birthdate,
//                               ),
//                               helperText: touched.birthdate && errors.birthdate,
//                             },
//                           }}
//                         />
//                       </LocalizationProvider>
//                     )}{" "}
//                     {hasAccess("phonenumber") && (
//                       <PhoneNumberInput
//                         label={t("phonenumber")}
//                         placeholder="+383 (__) ___-___"
//                         value={values.phoneNumber}
//                         onChange={handleChange}
//                         onBlur={handleBlur}
//                         error={Boolean(
//                           touched.phoneNumber && errors.phoneNumber,
//                         )}
//                         helperText={touched.phoneNumber && errors.phoneNumber}
//                         fullWidth
//                         name="phoneNumber"
//                         setFieldValue={setFieldValue}
//                       />
//                     )}{" "}
//                     {hasAccess("personalNumber") && (
//                       <TextField
//                         fullWidth
//                         label={t("personalNumber")}
//                         name="personalNumber"
//                         value={values.personalNumber}
//                         onChange={handleChange}
//                         onBlur={handleBlur}
//                         error={Boolean(
//                           touched.personalNumber && errors.personalNumber,
//                         )}
//                         helperText={
//                           touched.personalNumber && errors.personalNumber
//                         }
//                       />
//                     )}{" "}
//                     {hasAccess("language") && (
//                       <TextField
//                         select
//                         label={t("language")}
//                         placeholder={t("choose")}
//                         onChange={handleChange}
//                         name="language"
//                         value={values.language || ""}
//                         error={Boolean(touched.language && errors.language)}
//                         helperText={touched.language && errors.language}
//                       >
//                         {langOptions.map((option) => (
//                           <MenuItem key={option.value} value={option.value}>
//                             {option.label}
//                           </MenuItem>
//                         ))}{" "}
//                       </TextField>
//                     )}{" "}
//                     {hasAccess("roles") && (
//                       <Autocomplete
//                         multiple
//                         options={role}
//                         getOptionLabel={(option) => option.label}
//                         filterSelectedOptions
//                         value={role.filter((r) =>
//                           values.roles.includes(r.value),
//                         )}
//                         onChange={(event, selectedOptions) => {
//                           const selectedValues = selectedOptions.map(
//                             (option) => option.value,
//                           );
//                           setFieldValue("roles", selectedValues);
//                         }}
//                         renderInput={(params) => (
//                           <TextField
//                             {...params}
//                             label={t("role")}
//                             placeholder={t("selectGroup")}
//                             error={
//                               touched.roles && errors.roles ? true : undefined
//                             }
//                             helperText={
//                               touched.roles && errors.roles
//                                 ? errors.roles
//                                 : undefined
//                             }
//                           />
//                         )}
//                       />
//                     )}{" "}
//                     {hasAccess("domainId") && (
//                       <TextField
//                         select
//                         label={t("domain")}
//                         onChange={handleChange}
//                         value={values?.domainId || ""}
//                         name="domainId"
//                       >
//                         {domain.map((option) => (
//                           <MenuItem key={option.value} value={option.value}>
//                             {option.label}
//                           </MenuItem>
//                         ))}
//                       </TextField>
//                     )}{" "}
//                     {hasAccess("userName") && (
//                       <TextField
//                         fullWidth
//                         label={t("userName")}
//                         name="userName"
//                         value={values.userName}
//                         disabled={isEditMode}
//                         onChange={handleChange}
//                         onBlur={handleBlur}
//                         error={Boolean(touched.userName && errors.userName)}
//                         helperText={touched.userName && errors.userName}
//                       />
//                     )}
//                     {!isEditMode && !values.domainId && (
//                       <>
//                         {" "}
//                         {hasAccess("password") && (
//                           <TextField
//                             fullWidth
//                             label={t("password")}
//                             name="password"
//                             value={values.password}
//                             type="password"
//                             onChange={handleChange}
//                             onBlur={handleBlur}
//                             error={Boolean(touched.password && errors.password)}
//                             helperText={touched.password && errors.password}
//                           />
//                         )}{" "}
//                         {hasAccess("confirmPassword") && (
//                           <TextField
//                             fullWidth
//                             label={t("confirmPassword")}
//                             name="confirmPassword"
//                             value={values.confirmPassword}
//                             type="password"
//                             onChange={handleChange}
//                             onBlur={handleBlur}
//                             error={Boolean(
//                               touched.confirmPassword && errors.confirmPassword,
//                             )}
//                             helperText={
//                               touched.confirmPassword && errors.confirmPassword
//                             }
//                           />
//                         )}
//                       </>
//                     )}
//                   </Box>
//                   <Stack sx={{ mt: 3, alignItems: "flex-end" }}>
//                     <Button
//                       type="submit"
//                       variant="contained"
//                       loading={loading}
//                       onClick={submitForm}
//                     >
//                       {!isEditMode ? t("CreateUser") : t("save")}
//                     </Button>
//                   </Stack>
//                 </Card>
//               </Grid>
//             </Grid>
//           </>
//         )}
//       </Formik>
//     </React.Fragment>
//   );
// }
