import { gql, useLazyQuery, useQuery } from "@apollo/client";
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
} from "@mui/material";
import { GridCloseIcon } from "@mui/x-data-grid";
import { Formik } from "formik";
import { useSnackbar } from "notistack";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useAuthContext } from "src/auth/hooks";
import { LoadingScreen } from "src/components/loading-screen";
import axiosInstance from "src/lib/axios";
import { FormAccessService } from "src/services/FormAccessService";
import * as Yup from "yup";

const query = gql`
  query menus($id: Int!) {
    menus(where: { menuId: { eq: $id } }, take: 999999) {
      items {
        menuId
        parentId
        nameSq
        nameEn
        nameSr
        path
        icon
        type
        orderNo
      }
    }
  }
`;

const queryToGetMenus = gql`
  query menus {
    menus(where: { type: { in: [1, 2] } }, take: 999999) {
      items {
        menuId
        nameEn
        nameSq
        nameSr
      }
    }
  }
`;

export default function Edit() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [formUserAccess, setFormUserAccess] = React.useState([]);
  const [formRoleAccess, setFormRoleAccess] = React.useState([]);
  const [getItem, { data, loading }] = useLazyQuery(query);
  const { data: menusData, loading: menusLoading } = useQuery(queryToGetMenus);

  const [isEditMode, setIsEditMode] = React.useState(!isNaN(Number(id)));
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };

  const [formValues, setFormValues] = React.useState({
    parentId: null,
    nameSq: "",
    nameEn: "",
    nameSr: "",
    path: "",
    icon: "",
    type: null,
    orderNo: 0,
  });

  React.useEffect(() => {
    if (!isNaN(Number(id))) {
      getItem({ variables: { id: +id } });
    }
    setIsEditMode(!isNaN(Number(id)));
  }, [id]);

  React.useEffect(() => {
    if (data && data.menus.items.length > 0) {
      const menuData = data.menus.items[0];
      setFormValues({
        parentId: menuData.parentId,
        nameSq: menuData.nameSq,
        nameEn: menuData.nameEn,
        nameSr: menuData.nameSr,
        path: menuData.path,
        icon: menuData.icon,
        type: menuData.type,
        orderNo: menuData.orderNo,
      });
    }
  }, [data]);

  const validationSchema = Yup.object().shape({
    parentId: Yup.number().nullable(),
    nameSq: Yup.string().required(t("required")),
    nameEn: Yup.string().required(t("required")),
    nameSr: Yup.string().required(t("required")),
    path: Yup.string().required(t("required")),
    icon: Yup.string().required(t("required")),
    type: Yup.number().required(t("required")),
    orderNo: Yup.number().required(t("required")),
  });

  const { enqueueSnackbar } = useSnackbar();

  const menuTypes = [
    { label: "Grup", value: 1 },
    { label: "Menu", value: 2 },
    { label: "Nenmenu", value: 3 },
  ];

  const submenuOf = menusData?.menus?.items.map((x) => ({
    label: x.nameSq,
    value: x.menuId,
  }));
  React.useEffect(() => {
    async function fetchAccess() {
      try {
        const access = await FormAccessService.getAllFormUserAccess(1, user.id);
        setFormUserAccess(access);
        const roleaccess = await FormAccessService.getAllFormRoleAccess(
          1,
          user.roles[0].id,
        );
        setFormRoleAccess(roleaccess);
      } catch (error) {
        console.error("Failed to fetch form access:", error);
      }
    }

    fetchAccess();
  }, []);

  const hasAccess = (fieldName) => {
    const userAccess = formUserAccess.find(
      (item) => item.selector === fieldName,
    );
    const roleAccess = formRoleAccess.find(
      (item) => item.selector === fieldName,
    );

    const canWriteUpdate =
      id != "create"
        ? (userAccess?.update ?? roleAccess?.update)
        : (userAccess?.write ?? roleAccess?.write);
    return canWriteUpdate !== false;
  };
  return (
    <React.Fragment>
      <Formik
        initialValues={formValues}
        enableReinitialize="true"
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const result = isEditMode
            ? await axiosInstance.put(`/Administration/menu/${id}`, values)
            : await axiosInstance.post("/Administration/menu", values);
          if (result.status === 200) {
            enqueueSnackbar("Të dhënat u ruajtën me sukses!", {
              variant: "success",
            });
            setSubmitting(false);
            setOpen(false);
            navigate(-1);
          } else {
            var message =
              result?.response?.data?.title ??
              "Ka ndodhur një gabim gjatë ruajtjes së të dhënave!";
            enqueueSnackbar(message, {
              variant: "error",
            });
          }
        }}
      >
        {({
          errors,
          touched,
          handleChange,
          handleBlur,
          values,
          submitForm,
          setFieldValue,
        }) => (
          <Dialog
            fullWidth="true"
            maxWidth="lg"
            open={open}
            onClose={handleClose}
          >
            <DialogTitle>
              {isEditMode
                ? t("editMenu", { id, name: values.nameSq })
                : t("createMenu")}
            </DialogTitle>

            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={(theme) => ({
                position: "absolute",
                right: 16,
                top: 16,
                color: theme.palette.grey[500],
              })}
            >
              <GridCloseIcon />
            </IconButton>
            <Divider />
            <DialogContent>
              {loading && (
                <div className="my-4">
                  <LoadingScreen />
                </div>
              )}
              {!loading && (
                <div className="my-4 grid grid-cols-3 gap-4">
                  {hasAccess("nameSq") && (
                    <TextField
                      fullWidth
                      label={t("nameSq")}
                      name="nameSq"
                      value={values.nameSq}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.nameSq && errors.nameSq)}
                      helperText={touched.nameSq && errors.nameSq}
                    />
                  )}
                  {hasAccess("nameEn") && (
                    <TextField
                      fullWidth
                      label={t("nameEn")}
                      name="nameEn"
                      value={values.nameEn}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.nameEn && errors.nameEn)}
                      helperText={touched.nameEn && errors.nameEn}
                    />
                  )}
                  {hasAccess("nameSr") && (
                    <TextField
                      fullWidth
                      label={t("nameSr")}
                      name="nameSr"
                      value={values.nameSr}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.nameSr && errors.nameSr)}
                      helperText={touched.nameSr && errors.nameSr}
                    />
                  )}
                  {hasAccess("path") && (
                    <TextField
                      fullWidth
                      label={t("path")}
                      name="path"
                      value={values.path}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.path && errors.path)}
                      helperText={touched.path && errors.path}
                    />
                  )}
                  {hasAccess("icon") && (
                    <TextField
                      fullWidth
                      label={t("icon")}
                      name="icon"
                      value={values.icon}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.icon && errors.icon)}
                      helperText={touched.icon && errors.icon}
                    />
                  )}
                  {hasAccess("type") && (
                    <Autocomplete
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t("type")}
                          error={Boolean(touched.type && errors.type)}
                          helperText={touched.type && errors.type}
                        />
                      )}
                      options={menuTypes}
                      fullWidth
                      getOptionLabel={(option) => option.label}
                      value={
                        menuTypes.find(
                          (option) => option.value === values.type,
                        ) || null
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.value === value
                      }
                      onChange={(event, newValue) => {
                        setFieldValue("type", newValue ? newValue.value : null);
                      }}
                    />
                  )}
                  {hasAccess("orderNo") && (
                    <TextField
                      fullWidth
                      label={t("orderNo")}
                      name="orderNo"
                      min={0}
                      type="number"
                      value={values.orderNo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.orderNo && errors.orderNo)}
                      helperText={touched.orderNo && errors.orderNo}
                    />
                  )}

                  {menusLoading && (
                    <div className="my-4">
                      <LoadingScreen />
                    </div>
                  )}
                  {!menusLoading && [1, 2].includes(values.type) && (
                    <Autocomplete
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t("submenuOf")}
                          error={Boolean(touched.parentId && errors.parentId)}
                          helperText={touched.parentId && errors.parentId}
                        />
                      )}
                      options={submenuOf}
                      fullWidth
                      getOptionLabel={(option) => option.label}
                      value={
                        submenuOf.find(
                          (option) => option.value === values.parentId,
                        ) || null
                      }
                      isOptionEqualToValue={(option, value) =>
                        option.value === value
                      }
                      onChange={(event, newValue) => {
                        setFieldValue(
                          "parentId",
                          newValue ? newValue.value : null,
                        );
                      }}
                    />
                  )}
                </div>
              )}
            </DialogContent>
            <Divider />

            <DialogActions>
              <div className="flex justify-between w-full">
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleClose}
                >
                  {t("close")}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={submitForm}
                >
                  {t("save")}
                </Button>
              </div>
            </DialogActions>
          </Dialog>
        )}
      </Formik>
    </React.Fragment>
  );
}
