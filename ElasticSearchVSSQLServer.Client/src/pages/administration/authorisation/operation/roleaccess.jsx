import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import { Autocomplete, TextField } from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import axiosInstance from "src/lib/axios";

const query = gql`
  query roles($id: Int!) {
    roles {
      items {
        id
        nameSq
        nameEn
        nameSr
      }
    }
    moduleOperations(
      where: { moduleOperationId: { eq: $id }, active: { eq: true } }
    ) {
      items {
        moduleOperationRole(where: { active: { eq: true } }) {
          roleId
          moduleOperationRoleId
        }
      }
    }
  }
`;

export default function RoleAccess() {
  const { id } = useParams();
  const [getItems, { data }] = useLazyQuery(query);
  const [selected, setSelected] = useState([]);
  const [roles, setRoles] = useState([]);
  const [inDbItems, setInDbItems] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  useEffect(() => {
    if (id)
      getItems({
        variables: {
          id: +id,
        },
      });
  }, [id]);

  useEffect(() => {
    if (data) {
      const tempRoles = data?.roles?.items.map((x) => ({
        label: x.nameSq,
        value: x.id,
      }));
      const tempInDbItems = data?.moduleOperations?.items?.flatMap(
        (x) => x?.moduleOperationRole,
      );

      setRoles(tempRoles);
      setSelected(
        tempRoles.filter((y) => tempInDbItems.some((x) => x.roleId == y.value)),
      );
      setInDbItems(tempInDbItems);
    }
  }, [data]);

  const handleChange = async (newValue) => {
    setSelected(newValue);

    var toAdd = newValue.find(
      (x) => !inDbItems.some((y) => y.roleId == x.value),
    );
    var toDelete = inDbItems.find(
      (x) => !newValue.map((y) => y.value).includes(x.roleId),
    );

    if (toAdd) {
      const result = await axiosInstance.post(
        "/Administration/ModuleOperationRole",
        {
          roleId: toAdd.value,
          moduleOperationId: +id,
        },
      );

      if (result.status === 200) {
        setInDbItems([
          ...inDbItems,
          {
            roleId: toAdd.value,
            moduleOperationRoleId: +result.data.moduleOperationRoleId,
          },
        ]);
        enqueueSnackbar(result?.data?.message ?? t("dataSavedSuccessfully"), {
          variant: "success",
        });
      } else {
        var message = result?.response?.data?.message ?? t("errorOccurred");
        enqueueSnackbar(message, { variant: "error" });
      }
    } else if (toDelete) {
      const result = await axiosInstance.delete(
        `/Administration/ModuleOperationRole/${toDelete.moduleOperationRoleId}`,
      );

      if (result.status === 200) {
        setInDbItems(inDbItems.filter((x) => x.roleId !== toDelete.roleId));
        enqueueSnackbar(result?.data?.message ?? t("dataSavedSuccessfully"), {
          variant: "success",
        });
      } else {
        enqueueSnackbar(result?.response?.data?.message ?? t("errorOccurred"), {
          variant: "error",
        });
      }
    }
  };

  return (
    <Autocomplete
      multiple
      options={roles}
      getOptionLabel={(option) => option.label}
      defaultValue={[]}
      value={selected}
      fullWidth
      filterSelectedOptions
      onChange={handleChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Grupet që kanë qasje në këtë veprim"
          placeholder="Zgjedh grupet"
        />
      )}
    />
  );
}
