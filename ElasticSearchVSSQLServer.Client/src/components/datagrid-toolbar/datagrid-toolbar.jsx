import { Icon } from "@iconify/react";
import { Divider, Tooltip } from "@mui/material";
import React from "react";
import {
  Toolbar,
  ToolbarButton,
  ColumnsPanelTrigger,
} from "@mui/x-data-grid-pro";
import { useTranslation } from "react-i18next";

export default function DataGridToolbar() {
  const { t } = useTranslation();

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
    </Toolbar>
  );
}
