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
import React, { useEffect, useMemo, useState } from "react";
import {
  Toolbar,
  ToolbarButton,
  FilterPanelTrigger,
  ColumnsPanelTrigger,
  QuickFilterTrigger,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilter,
} from "@mui/x-data-grid-pro";
import { useTranslation } from "react-i18next";
import { debounce } from "es-toolkit";
import { injectReducer } from "src/store";
import reducer from "../store";
import { useDispatch, useSelector } from "react-redux";
import { setExpanded, setGeneralSearch } from "../store/slice";
import axiosInstance from "src/lib/axios";
import { mapFiltersToGraphQL } from "src/utils/DataTableFilter";
import { Base64toBlob } from "src/utils/Base64toBlob";
import ExcelExport from "src/utils/ExcelExport";
import { useApolloClient } from "@apollo/client";
import moment from "moment";
import CSVExport from "src/utils/CSVExport";
import JSONExport from "src/utils/JSONExport";
import { setLoading } from "src/store/theme/themeSlice";
import { useSnackbar } from "notistack";

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

injectReducer("users", reducer);

export default function CustomToolbar({
  onGlobalSearch,
  filter,
  logicType,
  columns,
  query,
}) {
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const exportMenuTriggerRef = React.useRef(null);
  const searchData = useSelector((state) => state.users.state.generalSearch);
  const expanded = useSelector((state) => state.users.state.expanded);
  const [where, setwhere] = useState({});
  const client = useApolloClient();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setwhere(mapFiltersToGraphQL(filter, logicType, columns));
  }, [filter, logicType, columns]);

  const dispatch = useDispatch();

  const { t } = useTranslation();

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        onGlobalSearch(value);
      }, 1000),
    [onGlobalSearch],
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    dispatch(setGeneralSearch(value));
    if (value && !expanded) {
      dispatch(setExpanded(true));
    }
    debouncedSearch(value);
  };

  const handleClear = () => {
    dispatch(setGeneralSearch(""));
    dispatch(setExpanded(false));
    onGlobalSearch("");
  };

  const exportPdf = async () => {
    dispatch(setLoading(true));
    setExportMenuOpen(false);
    var response = await axiosInstance.post(
      "/Administration/user/report",
      JSON.stringify(JSON.stringify(where)),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (response.data != undefined) {
      const blob = new Blob([Base64toBlob(response.data, "application/pdf")], {
        type: "application/pdf",
      });
      const fileURL = window.URL.createObjectURL(blob);
      window.open(fileURL, "_blank");
    } else {
      var message =
        response?.response?.data?.message ?? t("errorReportOccurred");
      enqueueSnackbar(message, { variant: "error" });
    }
    dispatch(setLoading(false));
  };

  const exportExcel = async () => {
    dispatch(setLoading(true));
    ExcelExport(await getDataForReport(), t("userList"));
    dispatch(setLoading(false));
  };

  const getDataForReport = async () => {
    try {
      const { data, error } = await client.query({
        query: query,
        variables: {
          where: where,
          skip: 0,
          take: 999999,
          order: [
            {
              ["id"]: "ASC",
            },
          ],
        },
      });
      if (error) {
        var message = error?.message ?? t("errorReportOccurred");
        enqueueSnackbar(message, { variant: "error" });
      }
      return data?.users?.items.map((item) => ({
        Id: item.id,
        Emri: item.firstname,
        Mbiemri: item.lastname,
        "Emri Përdoruesit": item.userName,
        "Numri personal": item.personalNumber,
        "Niveli qasjes": item.realRoleUser
          .map((role) => role.role.nameSq)
          .join(", "),
        Email: item.email,
        "Numri telefonit": item.phoneNumber,
        "Data regjistrimit": moment(item.insertedDate).format(
          "DD/MM/YYYY HH:mm:SS",
        ),
      }));
    } catch (err) {
      enqueueSnackbar(err?.message ?? t("errorReportOccurred"), {
        variant: "error",
      });
      dispatch(setLoading(false));
      return null;
    }
  };

  const exportCSV = async () => {
    dispatch(setLoading(true));
    CSVExport(await getDataForReport(), t("userList"));
    dispatch(setLoading(false));
  };

  const exportJSON = async () => {
    dispatch(setLoading(true));
    JSONExport(await getDataForReport(), t("userList"));
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
                badgeContent={state?.filterCount}
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
          onClick={() => setExportMenuOpen(true)}
        >
          <Icon icon="lucide:download" />
        </ToolbarButton>
      </Tooltip>
      <Menu
        id="export-menu"
        anchorEl={exportMenuTriggerRef.current}
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
        <MenuItem render={<MenuItem />} onClick={exportPdf}>
          {t("print")}
        </MenuItem>
        <MenuItem render={<MenuItem />} onClick={exportExcel}>
          Excel
        </MenuItem>
        <MenuItem render={<MenuItem />} onClick={exportCSV}>
          {t("exportCsv")}
        </MenuItem>
        <MenuItem render={<MenuItem />} onClick={exportJSON}>
          Json
        </MenuItem>
      </Menu>
      <StyledQuickFilter>
        <QuickFilterTrigger
          render={(triggerProps) => (
            <Tooltip title={t("searchPlaceholder")} enterDelay={0}>
              <StyledToolbarButton
                {...triggerProps}
                ownerState={{ expanded: expanded }}
                color="default"
                aria-disabled={expanded}
                onClick={() => dispatch(setExpanded((prev) => !prev))}
              >
                <Icon icon="material-symbols:search" />
              </StyledToolbarButton>
            </Tooltip>
          )}
        />
        <QuickFilterControl
          render={({ ref, ...controlProps }) => (
            <StyledTextField
              {...controlProps}
              ownerState={{ expanded: expanded }}
              inputRef={ref}
              aria-label="Search"
              placeholder={t("searchPlaceholder")}
              size="small"
              value={searchData}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="material-symbols:search" />
                    </InputAdornment>
                  ),
                  endAdornment: searchData ? (
                    <InputAdornment position="end">
                      <QuickFilterClear
                        onClick={handleClear}
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
