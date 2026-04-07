import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { GridExpandMoreIcon } from "@mui/x-data-grid";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Action } from "./action";
import axiosInstance from "src/lib/axios";
import { useSnackbar } from "notistack";

const query = gql`
  query controllersAndAccessToThem($operationId: Int!) {
    moduleOperations(where: { moduleOperationId: { eq: $operationId } }) {
      items {
        moduleOperationAction {
          moduleOperationActionId
          actionId
          active
        }
      }
    }
    controllers(where: { active: { eq: true } }) {
      items {
        controllerId
        name
        action(where: { active: { eq: true } }) {
          actionId
          name
          type
          title
          description
        }
      }
    }
  }
`;

export default function ApiIndex() {
  const { operationId } = useParams();
  const { t } = useTranslation();
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
          .flatMap((item) => item?.moduleOperationAction)
          .filter((x) => x.active)
          .flatMap((x) => ({
            actionId: x.actionId,
            actionOperationId: x.moduleOperationActionId,
          })) ?? [],
      );
    }
  }, [data]);

  const handleChange = async (value) => {
    const currentIndex = checked.map((x) => x.actionId).indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      var result = await axiosInstance.post(
        `/Administration/ModuleOperationAction`,
        {
          moduleOperationId: operationId,
          actionId: value,
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
        actionId: value,
        actionOperationId: result.data.moduleOperationActionId,
      });
    } else {
      var resultDelete = await axiosInstance.delete(
        `/Administration/ModuleOperationAction/${checked.find((x) => x.actionId == value).actionOperationId}`,
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
    <div>
      <Typography variant="p" component="div">
        {t("apiAccess")}
      </Typography>
      <Divider />
      {loading && <CircularProgress />}
      {error && (
        <Typography variant="p" component="div">
          {JSON.stringify(error)}
        </Typography>
      )}
      {!loading && !error && data && (
        <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 400px)" }}>
          {data?.controllers?.items
            .sort((a, b) => a > b)
            .map((controller) => (
              <div key={controller.controllerId}>
                <Accordion>
                  <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
                    <Typography variant="p" component="div">
                      {controller.name}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {controller.action.map((action) => (
                      <Action
                        key={action.actionId}
                        type={action.type}
                        controller={controller.name}
                        name={action.name}
                        id={action.actionId}
                        description={action.description}
                        checked={checked?.some(
                          (x) => x.actionId == action.actionId,
                        )}
                        onChange={() => handleChange(action.actionId)}
                      />
                    ))}
                  </AccordionDetails>
                </Accordion>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
