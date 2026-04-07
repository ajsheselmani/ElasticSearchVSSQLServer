import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useNavigate, useParams } from "react-router";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import * as Yup from "yup";
import { LoadingScreen } from "src/components/loading-screen";
import { Formik } from "formik";
import { Divider, IconButton } from "@mui/material";
import { GridCloseIcon } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import axiosInstance from "src/lib/axios";
import Form from "./form";
import { useSnackbar } from "notistack";
import { useAuthContext } from "src/auth/hooks";
import { FormAccessService } from "src/services/FormAccessService";

const query = gql`
  query modules($id: Int!) {
    modules(where: { moduleId: { eq: $id } }) {
      items {
        moduleId
        nameSq
        nameEn
        nameSr
      }
    }
  }
`;

export default function Edit() {
  const { id } = useParams();
  const [isEditMode, setIsEditMode] = React.useState(!isNaN(Number(id)));
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [getItem, { data, loading }] = useLazyQuery(query);

  React.useEffect(() => {
    if (!isNaN(Number(id))) {
      getItem({ variables: { id: +id } });
    }
    setIsEditMode(!isNaN(Number(id)));
  }, [id]);
  const [formUserAccess, setFormUserAccess] = React.useState([]);
  const [formRoleAccess, setFormRoleAccess] = React.useState([]);

  React.useEffect(() => {
    async function fetchAccess() {
      try {
        const access = await FormAccessService.getAllFormUserAccess(4, user.id);
        setFormUserAccess(access);
        const roleaccess = await FormAccessService.getAllFormRoleAccess(
          4,
          user.roles[0].id,
        );
        setFormRoleAccess(roleaccess);
      } catch (error) {
        console.error("Failed to fetch form access:", error);
      }
    }

    fetchAccess();
  }, []);
  const [open, setOpen] = React.useState(true);
  const [formValues, setFormValues] = React.useState({
    nameSq: "",
    nameEn: "",
    nameSr: "",
  });

  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };

  const validationSchema = Yup.object().shape({
    nameSq: Yup.string().required(t("required")),
    nameEn: Yup.string().required(t("required")),
    nameSr: Yup.string().required(t("required")),
  });
  const nameLocale = React.useMemo(() => {
    if (user.language === 1) return "nameSq";
    if (user.language === 3) return "nameSr";
    return "nameEn";
  }, [user.language]);

  React.useEffect(() => {
    if (data && data.modules.items.length > 0) {
      const moduleData = data.modules.items[0];
      setFormValues({
        nameSq: moduleData.nameSq,
        nameEn: moduleData.nameEn,
        nameSr: moduleData.nameSr,
      });
    }
  }, [data]);

  const hasAccess = (fieldName) => {
    const userAccess = formUserAccess.find(
      (item) => item.selector === fieldName,
    );
    const roleAccess = formRoleAccess.find(
      (item) => item.selector === fieldName,
    );

    const canWriteUpdate = !isNaN(Number(id))
      ? (userAccess?.update ?? roleAccess?.update)
      : (userAccess?.write ?? roleAccess?.write);
    return canWriteUpdate === true;
  };
  const { enqueueSnackbar } = useSnackbar();

  return (
    <React.Fragment>
      <Formik
        initialValues={formValues}
        enableReinitialize="true"
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const result = isEditMode
            ? await axiosInstance.put(`/Administration/module/${id}`, values)
            : await axiosInstance.post("/Administration/module", values);
          if (result.status === 200) {
            enqueueSnackbar(t("dataSavedSuccessfully"), {
              variant: "success",
            });
            setSubmitting(false);
            setOpen(false);
            navigate(-1);
          } else {
            var message =
              result?.response?.data?.title ?? t("errorWhileSavingYourData");
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
        }) => (
          <Dialog
            fullWidth="true"
            maxWidth="sm"
            open={open}
            onClose={handleClose}
          >
            <DialogTitle>
              {isEditMode && (
                <span>
                  {t("editModule")} {id} - <b>{values[nameLocale]}</b>
                </span>
              )}
              {!isEditMode && <> {t("registerModule")}</>}
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
                <Form
                  errors={errors}
                  handleBlur={handleBlur}
                  handleChange={handleChange}
                  touched={touched}
                  values={values}
                  hasAccess={hasAccess}
                />
              )}
            </DialogContent>
            <Divider />

            <DialogActions>
              <div className="flex justify-between w-100">
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
