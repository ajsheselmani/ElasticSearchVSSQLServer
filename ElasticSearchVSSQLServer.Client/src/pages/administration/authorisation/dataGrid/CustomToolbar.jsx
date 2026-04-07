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
  useGridApiContext,
  useGridSelector,
  gridFilteredSortedRowIdsSelector,
} from "@mui/x-data-grid-pro";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import ExcelExport from "src/utils/ExcelExport";
import { useSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setLoading } from "src/store/theme/themeSlice";
import moment from "moment";

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

  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] =
    (React.useState < null) | (HTMLElement > null);
  const exportMenuTriggerRef = React.useRef < HTMLButtonElement > null;

  const getVisibleRows = React.useCallback(
    () => visibleRowIds.map((id) => apiRef.current.getRow(id)).filter(Boolean),
    [apiRef, visibleRowIds],
  );

  const getNameByLocale = React.useCallback(
    (row) => {
      const lang = (i18n.language || "sq").toLowerCase();
      if (lang.startsWith("sq")) return row?.nameSq ?? "";
      if (lang.startsWith("sr")) return row?.nameSr ?? "";
      return row?.nameEn ?? "";
    },
    [i18n.language],
  );

  const getDataForReport = React.useCallback(async () => {
    try {
      const rows = getVisibleRows();

      return rows.map((row, index) => ({
        Id: index + 1,
        [t("module")]: getNameByLocale(row),
        [t("totalActions")]: row?.moduleOperation?.length ?? 0,
        [t("insertedFrom")]:
          (row?.insertedFromNavigation?.firstname ?? "") +
          " " +
          (row?.insertedFromNavigation?.lastname ?? ""),
        [t("insertedDate")]: row?.insertedDate
          ? moment(row.insertedDate).format("DD/MM/YYYY HH:mm:SS")
          : "",
        [t("updatedDate")]: row?.updatedDate
          ? moment(row.updatedDate).format("DD/MM/YYYY HH:mm:SS")
          : "",
      }));
    } catch (err) {
      enqueueSnackbar(err?.message ?? t("errorReportOccurred"), {
        variant: "error",
      });
      dispatch(setLoading(false));
      return null;
    }
  }, [dispatch, enqueueSnackbar, getNameByLocale, getVisibleRows, t]);

  const exportExcel = async () => {
    dispatch(setLoading(true));
    const data = await getDataForReport();
    if (data) ExcelExport(data, t("menus"));
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
        slotProps={{ list: { "aria-labelledby": "export-menu-trigger" } }}
      >
        {!location.pathname.includes("/administration/lookuptable/") ? (
          <ExportPrint
            render={<MenuItem />}
            onClick={() => setExportMenuOpen(false)}
          >
            {t("print")}
          </ExportPrint>
        ) : null}

        <MenuItem onClick={exportExcel}>Excel</MenuItem>
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
