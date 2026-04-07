import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

import {
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Switch,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import axiosInstance from "src/lib/axios";

const query = gql`
  query formsAndSelectedForms($operationId: Int!) {
    forms(where: { active: { eq: true } }) {
      items {
        formId
        nameEn
        nameSq
        nameSr
      }
    }
    moduleOperations(where: { moduleOperationId: { eq: $operationId } }) {
      items {
        moduleOperationForm {
          moduleOperationFormId
          formId
          active
        }
      }
    }
  }
`;

export default function FormIndex() {
  const { operationId } = useParams();

  const { t, i18n } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [checked, setChecked] = React.useState([]);

  const [geItems, { loading, error, data }] = useLazyQuery(query, {
    variables: { operationId: +operationId },
  });

  useEffect(() => {
    if (operationId) geItems();
  }, [operationId]);

  useEffect(() => {
    if (data) {
      setChecked(
        data?.moduleOperations?.items
          .flatMap((item) => item?.moduleOperationForm)
          .filter((x) => x.active)
          .flatMap((x) => ({
            formId: x.formId,
            formOperationId: x.moduleOperationFormId,
          })) ?? [],
      );
    }
  }, [data]);

  const handleToggle = async (value) => {
    const currentIndex = checked.map((x) => x.formId).indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      var result = await axiosInstance.post(
        `/Administration/ModuleOperationForm`,
        {
          moduleOperationId: operationId,
          formId: value,
        },
      );
      if (result.status === 200)
        enqueueSnackbar(t("dataSavedSuccessfully"), {
          variant: "success",
        });
      else {
        enqueueSnackbar(result?.response?.data?.title ?? t("errorOccurred"), {
          variant: "error",
        });
        return;
      }
      newChecked.push({
        formId: value,
        formOperationId: result.data.moduleOperationFormId,
      });
    } else {
      var resultDelete = await axiosInstance.delete(
        `/Administration/ModuleOperationForm/${checked.find((x) => x.formId == value).formOperationId}`,
      );
      if (resultDelete.status === 200)
        enqueueSnackbar(t("dataDeletedSuccessfully"), {
          variant: "success",
        });
      else {
        enqueueSnackbar(
          resultDelete?.response?.data?.title ?? t("errorOccurredDeletion"),
          {
            variant: "error",
          },
        );
        return;
      }
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  return (
    <>
      {loading && <CircularProgress />}
      {error && (
        <Typography component="span">Error: {error.message}</Typography>
      )}
      {!loading && !error && (
        <div>
          <Typography variant="p" component="div">
            {t("forms")}
          </Typography>
          <Divider />
          <List
            sx={{
              marginTop: "5px",
              width: "100%",
              bgcolor: "background.paper",
              overflow: "auto",
              maxHeight: 400,
            }}
            dense
          >
            {data?.forms?.items.map((item) => (
              <ListItem dense>
                <ListItemText
                  primary={
                    item[
                      `name${i18n.language.charAt(0).toUpperCase() + i18n.language.slice(1)}`
                    ]
                  }
                />
                <Switch
                  edge="end"
                  onChange={() => handleToggle(item.formId)}
                  checked={checked?.some((x) => x.formId == item.formId)}
                />
              </ListItem>
            ))}
          </List>
        </div>
      )}
    </>
  );
}
