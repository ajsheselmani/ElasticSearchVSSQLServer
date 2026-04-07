import { Box, Switch } from "@mui/material";
import { blue, green, orange, red } from "@mui/material/colors";

export const Action = ({
  type,
  controller,
  name,
  description,
  onChange,
  checked,
}) => {
  const label = { inputProps: { "aria-label": "Switch demo" } };
  const controllerName = controller || "";
  return (
    <Box
      mb={1}
      border={1}
      borderRadius={1}
      borderColor={
        type === "GET"
          ? blue[300]
          : type === "POST"
            ? green[300]
            : type === "PUT"
              ? orange[300]
              : red[300]
      }
      display="flex"
      justifyContent="space-between"
    >
      <Box display="flex" alignItems="center">
        <Box
          paddingX={4}
          bgcolor={
            type === "GET"
              ? blue[300]
              : type === "POST"
                ? green[300]
                : type === "PUT"
                  ? orange[300]
                  : red[300]
          }
          ml={1}
          mr={2}
          borderRadius={1}
          height={27}
        >
          <p className="items-center text-white mt-0.5 font-bold">{type}</p>
        </Box>
        <div>
          /api/{controllerName.replace("Controller", "")}/{name} -{" "}
          <span>{description}</span>
        </div>
      </Box>
      <div>
        <Switch
          color={
            type === "GET"
              ? "primary"
              : type === "POST"
                ? "success"
                : type === "PUT"
                  ? "warning"
                  : "error"
          }
          {...label}
          onChange={(e) => onChange(e.target.checked)}
          checked={checked}
        />
      </div>
    </Box>
  );
};
