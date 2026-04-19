import { Icon } from "@iconify/react";
import {
  Divider,
  InputAdornment,
  styled,
  TextField,
  Tooltip,
} from "@mui/material";
import React from "react";
import {
  Toolbar,
  ToolbarButton,
  ColumnsPanelTrigger,
} from "@mui/x-data-grid-pro";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";

const StyledToolbarButton = styled(ToolbarButton)(() => ({
  width: "min-content",
  height: "min-content",
}));

const StyledTextField = styled(TextField)(({ theme, ownerState }) => ({
  overflowX: "clip",
  width: ownerState.expanded ? 260 : 0,
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(["width", "opacity"]),
}));

export default function DataGridToolbar(props) {
  const { onSearchChange } = props;
  console.log(props, "props");
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(false);
  const [value, setValue] = React.useState("");

  const debouncedSearch = React.useMemo(
    () => debounce((val) => onSearchChange?.(val), 500),
    [onSearchChange],
  );

  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);
  const handleChange = (e) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleClear = () => {
    setValue("");
    onSearchChange?.("");
  };

  return (
    <Toolbar>
      <Tooltip title={t("columns")}>
        <ColumnsPanelTrigger render={<ToolbarButton />}>
          <Icon icon="lucide:columns-3" />
        </ColumnsPanelTrigger>
      </Tooltip>
      <Divider
        orientation="vertical"
        variant="middle"
        flexItem
        sx={{ mx: 0.5 }}
      />

      <Tooltip title={t("searchPlaceholder")} enterDelay={0}>
        <StyledToolbarButton
          onClick={() => setExpanded((prev) => !prev)}
          color="default"
        >
          <Icon icon="material-symbols:search" />
        </StyledToolbarButton>
      </Tooltip>

      <StyledTextField
        ownerState={{ expanded }}
        value={value}
        aria-label="Search"
        placeholder={t("searchPlaceholder")}
        size="small"
        onChange={handleChange}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="material-symbols:search" />
              </InputAdornment>
            ),
            endAdornment: value ? (
              <InputAdornment position="end">
                <StyledToolbarButton
                  edge="end"
                  size="small"
                  aria-label="Clear search"
                  onClick={handleClear}
                  sx={{ marginRight: -0.75 }}
                >
                  <Icon icon="material-symbols:cancel-outline" />
                </StyledToolbarButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />
    </Toolbar>
  );
}
