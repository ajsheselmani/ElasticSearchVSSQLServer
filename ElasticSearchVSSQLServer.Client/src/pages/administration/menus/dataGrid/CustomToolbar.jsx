import { Icon } from "@iconify/react";
import React from "react";
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
  useGridApiContext,
  useGridSelector,
  gridFilteredSortedRowIdsSelector,
  gridVisibleColumnFieldsSelector,
} from "@mui/x-data-grid-pro";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import ExcelExport from "src/utils/ExcelExport";
import CSVExport from "src/utils/CSVExport";
import { useSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setLoading } from "src/store/theme/themeSlice";

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

export default function DataGridToolbar() {
  const apiRef = useGridApiContext();
  const visibleRowIds = useGridSelector(
    apiRef,
    gridFilteredSortedRowIdsSelector,
  );
  const visibleFields = useGridSelector(
    apiRef,
    gridVisibleColumnFieldsSelector,
  );

  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const location = useLocation();

  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] =
    (React.useState < null) | (HTMLElement > null);
  const exportMenuTriggerRef = React.useRef < HTMLButtonElement > null;

  const getVisibleRows = React.useCallback(
    () => visibleRowIds.map((id) => apiRef.current.getRow(id)).filter(Boolean),
    [apiRef, visibleRowIds],
  );

  const getColumnsForExport = React.useCallback(() => {
    const cols = apiRef.current.getAllColumns?.() || [];
    const byField = new Map(cols.map((c) => [c.field, c]));
    return (visibleFields || [])
      .map((f) => byField.get(f))
      .filter(Boolean)
      .filter(
        (c) => c.field && c.field !== "actions" && c.disableExport !== true,
      );
  }, [apiRef, visibleFields]);

  const formatCell = React.useCallback((row, col) => {
    const raw = row?.[col.field];

    if (typeof col.valueGetter === "function") {
      try {
        const v = col.valueGetter(raw, row);
        if (typeof col.valueFormatter === "function")
          return col.valueFormatter(v, row);
        return v ?? "";
      } catch {
        return raw ?? "";
      }
    }

    if (typeof col.valueFormatter === "function") {
      try {
        return col.valueFormatter(raw, row) ?? "";
      } catch {
        return raw ?? "";
      }
    }

    return raw ?? "";
  }, []);

  const getHeader = React.useCallback((col) => col.headerName || col.field, []);

  const getDataForReport = React.useCallback(async () => {
    try {
      const rows = getVisibleRows();
      const cols = getColumnsForExport();

      return rows.map((row, index) => {
        const out = { Id: index + 1 };
        cols.forEach((col) => {
          out[getHeader(col)] = formatCell(row, col);
        });
        return out;
      });
    } catch (err) {
      enqueueSnackbar(err?.message ?? t("errorReportOccurred"), {
        variant: "error",
      });
      dispatch(setLoading(false));
      return null;
    }
  }, [
    dispatch,
    enqueueSnackbar,
    formatCell,
    getColumnsForExport,
    getHeader,
    getVisibleRows,
    t,
  ]);

  const exportExcel = async () => {
    dispatch(setLoading(true));
    const data = await getDataForReport();
    if (data) ExcelExport(data, t("menus"));
    dispatch(setLoading(false));
    setExportMenuOpen(false);
  };

  const exportCsv = async () => {
    dispatch(setLoading(true));
    const data = await getDataForReport();
    if (data) CSVExport(data, t("exportData"));
    dispatch(setLoading(false));
    setExportMenuOpen(false);
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

      <Tooltip title={t("exportData")}>
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
        slotProps={{ list: { "aria-labelledby": "export-menu-trigger" } }}
      >
        <MenuItem onClick={exportExcel}>Excel</MenuItem>

        {!location.pathname.includes("/administration/lookuptable/") ? (
          <ExportPrint
            render={<MenuItem />}
            onClick={() => {
              setExportMenuOpen(false);
            }}
          >
            {t("print")}
          </ExportPrint>
        ) : null}

        <MenuItem onClick={exportCsv}>{t("exportCsv")}</MenuItem>
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
              onChange={(e) => onChange?.(e)}
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
