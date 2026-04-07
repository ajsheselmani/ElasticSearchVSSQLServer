import { gql } from "@apollo/client";
import { Icon } from "@iconify/react";
import { useLazyQuery } from "@apollo/client/react";

import {
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { ICONS } from "src/layouts/nav-config-dashboard";
import axiosInstance from "src/lib/axios";

const query = gql`
  query menusAndSelectedMenus($operationId: Int!) {
    menus(skip: 0, take: 999999) {
      items {
        menuId
        nameEn
        nameSq
        nameSr
        orderNo
        icon
      }
    }
    moduleOperations(where: { moduleOperationId: { eq: $operationId } }) {
      items {
        moduleOperationMenu {
          moduleOperationMenuId
          menuId
          active
        }
      }
    }
  }
`;
export default function MenuIndex() {
  const { operationId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { t, i18n } = useTranslation();
  const [geItems, { loading, error, data }] = useLazyQuery(query, {
    variables: { operationId: +operationId },
  });
  const [checked, setChecked] = React.useState([]);

  useEffect(() => {
    if (operationId) geItems();
  }, [operationId]);

  useEffect(() => {
    if (data) {
      setChecked(
        data?.moduleOperations?.items
          .flatMap((item) => item?.moduleOperationMenu)
          .filter((x) => x.active)
          .flatMap((x) => ({
            menuId: x.menuId,
            menuOperationId: x.moduleOperationMenuId,
          })) ?? [],
      );
    }
  }, [data]);

  const handleToggle = async (value) => {
    const currentIndex = checked.map((x) => x.menuId).indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      var result = await axiosInstance.post(
        `/Administration/Module/1/operations/${operationId}/menu`,
        {
          moduleOperationId: operationId,
          menuId: value,
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
        menuId: value,
        menuOperationId: result.data.moduleOperationMenuId,
      });
    } else {
      var resultDelete = await axiosInstance.delete(
        `/Administration/Module/1/operations/${operationId}/menu/${checked.find((x) => x.menuId == value).menuOperationId}`,
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
            {t("menus")}
          </Typography>
          <Divider />
          <List
            sx={{
              marginTop: "5px",
              width: "100%",
              bgcolor: "background.paper",
              overflow: "auto",
              maxHeight: "calc(100vh - 400px)",
            }}
            dense
          >
            {data?.menus.items.map((item) => (
              <ListItem dense>
                <ListItemIcon>
                  {item.icon in ICONS ? (
                    ICONS[item.icon]
                  ) : (
                    <Icon icon={item.icon} fontSize={24} color="primary" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    item[
                      `name${i18n.language.charAt(0).toUpperCase() + i18n.language.slice(1)}`
                    ]
                  }
                />
                <Switch
                  edge="end"
                  onChange={() => handleToggle(item.menuId)}
                  checked={checked?.some((x) => x.menuId == item.menuId)}
                />
              </ListItem>
            ))}
          </List>
        </div>
      )}
    </>
  );
}
