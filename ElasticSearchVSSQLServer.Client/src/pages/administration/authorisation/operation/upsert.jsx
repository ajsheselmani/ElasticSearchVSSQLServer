import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

import {
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
import { LoadingScreen } from "src/components/loading-screen";
import axiosInstance from "src/lib/axios";
import * as Yup from "yup";

const query = gql`
  query moduleOperation($moduleOperationId: Int!) {
    modules(
      where: {
        moduleOperation: {
          any: true
          some: { moduleOperationId: { eq: $moduleOperationId } }
        }
      }
    ) {
      items {
        moduleOperation(
          where: { moduleOperationId: { eq: $moduleOperationId } }
        ) {
          moduleOperationId
          nameSq
          nameEn
          nameSr
        }
      }
    }
  }
`;

export default function Upsert() {
  const { id, operationId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [getItem, { data, loading }] = useLazyQuery(query);

  React.useEffect(() => {
    if (operationId) {
      getItem({ variables: { moduleOperationId: Number(operationId) } });
    }
  }, [operationId]);

  React.useEffect(() => {
    if (data && data.modules.items.length > 0) {
      const moduleData = data.modules.items[0].moduleOperation[0];
      setFormValues({
        nameSq: moduleData.nameSq,
        nameEn: moduleData.nameEn,
        nameSr: moduleData.nameSr,
      });
    }
  }, [data]);

  const [open, setOpen] = React.useState(true);
  const [formValues, setFormValues] = React.useState({
    nameSq: "",
    nameEn: "",
    nameSr: "",
  });

  const [isEditMode] = React.useState(!isNaN(Number(operationId)));

  const handleClose = () => {
    setOpen(false);
    navigate(-1);
  };

  const validationSchema = Yup.object().shape({
    nameSq: Yup.string().required(t("required")),
    nameEn: Yup.string().required(t("required")),
    nameSr: Yup.string().required(t("required")),
  });

  return (
    <React.Fragment>
      <Formik
        initialValues={formValues}
        enableReinitialize="true"
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const result = isEditMode
            ? await axiosInstance.put(
                `/Administration/Module/${id}/operations/${operationId}`,
                values,
              )
            : await axiosInstance.post(
                `/Administration/Module/${id}/operations`,
                values,
              );
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
                  {t("editOperation")}: {operationId} - <b>{values.nameSq}</b>
                </span>
              )}
              {!isEditMode && <> {t("addNewOperation")} </>}
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
              {loading && <LoadingScreen />}
              {!loading && (
                <div className="my-4 grid grid-cols-1 gap-4">
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
                </div>
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
