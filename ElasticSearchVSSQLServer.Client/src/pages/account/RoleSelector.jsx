import { useEffect, useState } from "react";
import axiosInstance from "src/lib/axios";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";

import {
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuthContext } from "src/auth/hooks";

const RoleSelector = (allRolesRes) => {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // get all roles assigned to the user

        const userRoles = allRolesRes.allRolesRes;
        const currentRole = user.roles[0]; // first active role
        const currentRoleId = currentRole?.id;

        // fetch full details of each role
        let rolesWithNames = await Promise.all(
          userRoles.map(async (ur) => {
            const roleDetail = await axiosInstance.get(
              `/Administration/role/${ur.roleId}`,
            );
            const roleData = roleDetail.data;

            const name =
              user.language === 2
                ? roleData.nameEn
                : user.language === 3
                  ? roleData.nameSr
                  : roleData.nameSq;

            return {
              id: ur.roleId,
              name,
              realRoleId: ur.realRoleId,
            };
          }),
        );

        // sort roles so current is first
        if (currentRoleId) {
          rolesWithNames.sort((a, b) =>
            a.id === currentRoleId ? -1 : b.id === currentRoleId ? 1 : 0,
          );
        }

        setRoles(rolesWithNames);
        setSelectedRoleId(currentRoleId || rolesWithNames[0]?.id || "");
      } catch (err) {
        setError(t("errorGettingRoles"), err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = async (event) => {
    const newRoleId = event.target.value;
    setLoading(true);
    setError("");

    try {
      const changeResponse = await axiosInstance.post(
        `/Administration/user/changeUserRole?id=${newRoleId}`,
      );

      if (changeResponse.status !== 200) {
        const message = changeResponse.data?.message || t("errorChangingRole");
        enqueueSnackbar(message, { variant: "error" });
      } else {
        const message = t("dataSavedSuccessfully");
        enqueueSnackbar(message, { variant: "success" });

        setSelectedRoleId(newRoleId);

        // reload the page after role change
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      setError(t("errorChangingRole") + " " + err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <FormControl component="fieldset" sx={{ width: "100%" }}>
      <RadioGroup
        aria-label="role"
        name="role"
        value={selectedRoleId}
        onChange={handleChange}
      >
        {roles.map((role) => (
          <Box
            key={role.id}
            sx={{
              border: "1px solid #ccc",
              borderRadius: 1,
              padding: 0.5,
              marginBottom: 1,
            }}
          >
            <FormControlLabel
              value={role.id}
              control={<Radio disabled={loading} />}
              label={role.name}
              labelPlacement="start"
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                paddingLeft: 0.5,
                paddingRight: 0,
                margin: 0,
                "& .MuiFormControlLabel-label": {
                  fontWeight: 600,
                },
              }}
            />
          </Box>
        ))}
      </RadioGroup>
    </FormControl>
  );
};

export default RoleSelector;
