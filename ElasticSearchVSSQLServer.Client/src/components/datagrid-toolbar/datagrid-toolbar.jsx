import { Icon } from "@iconify/react";
import {
  Badge,
  Divider,
  InputAdornment,
  Menu,
  MenuItem,
  styled,
  TextField,
  Tooltip,
} from "@mui/material";
import React from "react";
import {
  Toolbar,
  ToolbarButton,
  FilterPanelTrigger,
  ColumnsPanelTrigger,
  ExportPrint,
  QuickFilterTrigger,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilter,
} from "@mui/x-data-grid-pro";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import ExcelExport from "src/utils/ExcelExport";
import { useDispatch } from "react-redux";
import { setLoading } from "src/store/theme/themeSlice";
import CSVExport from "src/utils/CSVExport";
import { useSnackbar } from "notistack";
import { useAuthContext } from "src/auth/hooks";

const StyledQuickFilter = styled(QuickFilter)({
  display: "grid",
  alignItems: "center",
});

const StyledToolbarButton = styled(ToolbarButton)(({ theme, ownerState }) => ({
  gridArea: "1 / 1",
  width: "min-content",
  height: "min-content",
  zIndex: 1,
  opacity: ownerState.expanded ? 0 : 1,
  pointerEvents: ownerState.expanded ? "none" : "auto",
  transition: theme.transitions.create(["opacity"]),
}));

const StyledTextField = styled(TextField)(({ theme, ownerState }) => ({
  gridArea: "1 / 1",
  overflowX: "clip",
  width: ownerState.expanded ? 260 : "var(--trigger-width)",
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(["width", "opacity"]),
}));

export default function DataGridToolbar(props) {
  const { rows } = props;
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthContext();
  const language = user.language || "sq";
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] =
    (React.useState < null) | (HTMLElement > null);
  const exportMenuTriggerRef = React.useRef < HTMLButtonElement > null;
  const { t } = useTranslation();
  const location = useLocation();
  const [filteredRows, setFilteredRows] = React.useState([]);

  const [searchValue, setSearchValue] = React.useState("");

  const debouncedSetSearchValue = React.useMemo(
    () =>
      debounce((value) => {
        setSearchValue(value);
        const filtered = rows.filter(
          (item) =>
            item.NameSq.toLowerCase().includes(value.toLowerCase()) ||
            item.NameEn.toLowerCase().includes(value.toLowerCase()) ||
            item.NameSr.toLowerCase().includes(value.toLowerCase()),
        );
        setFilteredRows(filtered);
      }, 1000),
    [rows],
  );

  React.useEffect(() => {
    if (!searchValue) {
      setFilteredRows(rows);
    }
  }, [rows, searchValue]);
  React.useEffect(
    () => () => debouncedSetSearchValue.cancel(),
    [debouncedSetSearchValue],
  );
  const exportExcel = async () => {
    ExcelExport(await getDataForReport(), t("lookupTables"));
  };

  const getDataForReport = async () => {
    try {
      return filteredRows.map((item, index) => ({
        Id: index + 1,
        [t("parameterName")]: item.parameterName,
        [t("reportConfiguration")]:
          language === "sq"
            ? item.reportConfiguration.nameSq
            : language === "en"
              ? item.reportConfiguration.nameEn
              : item.reportConfiguration.nameSr,
        [t("state")]: item.active ? t("active") : t("passive"),
      }));
    } catch (err) {
      enqueueSnackbar(err?.message ?? t("errorReportOccurred"), {
        variant: "error",
      });
      dispatch(setLoading(false));
      return null;
    }
  };

  const handleExport = async () => {
    dispatch(setLoading(true));
    CSVExport(await getDataForReport(), t("exportData"));
    dispatch(setLoading(false));
  };
  return (
    <Toolbar>
      <Tooltip title={t("columns")}>
        <ColumnsPanelTrigger render={<ToolbarButton />}>
          <Icon icon="lucide:columns-3" />
        </ColumnsPanelTrigger>
      </Tooltip>
      <Tooltip title={t("search")}>
        <FilterPanelTrigger
          render={(props, state) => (
            <ToolbarButton {...props} color="default">
              <Badge
                badgeContent={state.filterCount}
                color="primary"
                variant="standard"
              >
                <Icon icon="lucide:list-filter" />
              </Badge>
            </ToolbarButton>
          )}
        />
      </Tooltip>
      <Divider
        orientation="vertical"
        variant="middle"
        flexItem
        sx={{ mx: 0.5 }}
      />
      <Tooltip title="Eksportimi rezultatit">
        <ToolbarButton
          ref={exportMenuTriggerRef}
          id="export-menu-trigger"
          aria-controls="export-menu"
          aria-haspopup="true"
          aria-expanded={exportMenuOpen ? "true" : undefined}
          onClick={() => {
            setExportMenuAnchor(exportMenuTriggerRef.current);
            setExportMenuOpen(true);
          }}
        >
          <Icon icon="lucide:download" />
        </ToolbarButton>
      </Tooltip>
      <Menu
        id="export-menu"
        anchorEl={exportMenuAnchor}
        open={exportMenuOpen}
        onClose={() => setExportMenuOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: {
            "aria-labelledby": "export-menu-trigger",
          },
        }}
      >
        {!location.pathname.includes("/administration/lookuptable/") ? (
          <ExportPrint
            render={<MenuItem />}
            onClick={() => setExportMenuOpen(false)}
          >
            {t("print")}
          </ExportPrint>
        ) : (
          <MenuItem render={<MenuItem />} onClick={exportExcel}>
            Excel
          </MenuItem>
        )}
        <MenuItem onClick={handleExport}>{t("exportCsv")}</MenuItem>
      </Menu>
      <StyledQuickFilter>
        <QuickFilterTrigger
          render={(triggerProps, state) => (
            <Tooltip title={t("searchPlaceholder")} enterDelay={0}>
              <StyledToolbarButton
                {...triggerProps}
                ownerState={{ expanded: state.expanded }}
                color="default"
                aria-disabled={state.expanded}
              >
                <Icon icon="material-symbols:search" />
              </StyledToolbarButton>
            </Tooltip>
          )}
        />
        <QuickFilterControl
          render={({ ref, onChange, ...controlProps }, state) => (
            <StyledTextField
              {...controlProps}
              ownerState={{ expanded: state.expanded }}
              inputRef={ref}
              aria-label="Search"
              placeholder={t("searchPlaceholder")}
              size="small"
              onChange={(e) => {
                onChange?.(e);
                debouncedSetSearchValue(e.target.value);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="material-symbols:search" />
                    </InputAdornment>
                  ),
                  endAdornment: state.value ? (
                    <InputAdornment position="end">
                      <QuickFilterClear
                        edge="end"
                        size="small"
                        aria-label="Clear search"
                        material={{ sx: { marginRight: -0.75 } }}
                      >
                        <Icon icon="material-symbols:cancel-outline" />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                  ...controlProps.slotProps?.input,
                },
                ...controlProps.slotProps,
              }}
            />
          )}
        />
      </StyledQuickFilter>
    </Toolbar>
  );
}
