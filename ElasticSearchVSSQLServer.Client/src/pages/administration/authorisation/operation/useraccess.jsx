import { Autocomplete, TextField } from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import axiosInstance from "src/lib/axios";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

const query = gql`
  query users($id: Int!) {
    users {
      items {
        id
        firstname
        lastname
      }
    }
    moduleOperations(
      where: { moduleOperationId: { eq: $id }, active: { eq: true } }
    ) {
      items {
        moduleOperationUser(where: { active: { eq: true } }) {
          userId
          moduleOperationUserId
        }
      }
    }
  }
`;

export default function UserAccess() {
  const { id } = useParams();
  const [getItems, { data }] = useLazyQuery(query);
  const [selected, setSelected] = useState([]);
  const [users, setUsers] = useState([]);
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
      const tempUsers = data?.users?.items.map((x) => ({
        label: x.firstname + " " + x.lastname,
        value: x.id,
      }));
      const tempInDbItems = data?.moduleOperations?.items?.flatMap(
        (x) => x?.moduleOperationUser,
      );

      setUsers(tempUsers);
      setSelected(
        tempUsers.filter((y) => tempInDbItems.some((x) => x.userId == y.value)),
      );
      setInDbItems(tempInDbItems);
    }
  }, [data]);

  const handleChange = async (event, newValue) => {
    setSelected(newValue);

    var toAdd = newValue.find(
      (x) => !inDbItems.some((y) => y.userId == x.value),
    );
    var toDelete = inDbItems.find(
      (x) => !newValue.map((y) => y.value).includes(x.userId),
    );

    if (toAdd) {
      const result = await axiosInstance.post(
        "/Administration/ModuleOperationUser",
        {
          userId: toAdd.value,
          moduleOperationId: +id,
        },
      );

      if (result.status === 200) {
        setInDbItems([
          ...inDbItems,
          {
            userId: toAdd.value,
            moduleOperationUserId: +result.data.moduleOperationUserId,
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
        `/Administration/ModuleOperationUser/${toDelete.moduleOperationUserId}`,
      );

      if (result.status === 200) {
        setInDbItems(inDbItems.filter((x) => x.roleId !== toDelete.userId));
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
      options={users}
      getOptionLabel={(option) => option.label}
      defaultValue={[]}
      value={selected}
      fullWidth
      filterSelectedOptions
      onChange={handleChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Përdoruesit që kanë qasje në këtë veprim"
          placeholder="Zgjedh përdoruesit"
        />
      )}
    />
  );
}
