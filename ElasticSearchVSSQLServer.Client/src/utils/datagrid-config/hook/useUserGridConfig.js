import { useEffect, useRef } from "react";
import { useGridApiRef } from "@mui/x-data-grid-pro";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

const GET_GRID_CONFIG = gql`
  query GetGridConfig($gridKey: String!) {
    dataGridConfig(gridKey: $gridKey) {
      items {
        gridKey
        configJson
        updatedDate
      }
    }
  }
`;

export function useUserGridConfig(gridKey, save) {
  const apiRef = useGridApiRef();

  const readyRef = useRef(false);
  const hasAppliedInitialRef = useRef(false);
  const saveTimerRef = useRef(null);

  const [execLoad] = useLazyQuery(GET_GRID_CONFIG, {
    fetchPolicy: "network-only",
  });

  const applyConfig = (api, cfg) => {
    if (!api || !cfg) return;

    const model = {};
    api.getAllColumns().forEach((c) => {
      model[c.field] = cfg.visibleColumns
        ? cfg.visibleColumns.includes(c.field)
        : true;
    });
    api.setColumnVisibilityModel(model);

    if (Array.isArray(cfg.order) && cfg.order.length) {
      cfg.order.forEach((field, idx) => {
        if (api.getColumn(field)) api.setColumnIndex(field, idx);
      });
    }

    if (cfg.widths) {
      Object.entries(cfg.widths).forEach(([field, w]) => {
        if (api.getColumn(field) && typeof w === "number")
          api.setColumnWidth(field, w);
      });
    }

    if (cfg.pinned && api.setPinnedColumns) {
      const currentPinned = api.exportState()?.pinnedColumns;
      const hasInitialPinned =
        (currentPinned?.left?.length || 0) > 0 ||
        (currentPinned?.right?.length || 0) > 0;

      if (!hasInitialPinned) {
        const left = Array.isArray(cfg.pinned.left) ? cfg.pinned.left : [];
        const right = Array.isArray(cfg.pinned.right) ? cfg.pinned.right : [];
        api.setPinnedColumns({ left, right });
      }
    }

    if (cfg.density && api.setDensity) api.setDensity(cfg.density);

    readyRef.current = true;
  };

  const extractConfig = (api) => {
    const visibleColumns =
      typeof api.getVisibleColumns === "function"
        ? api.getVisibleColumns().map((c) => c.field)
        : api
            .getAllColumns()
            .filter(
              (c) =>
                (api.getColumnVisibilityModel?.() || {})[c.field] !== false,
            )
            .map((c) => c.field);

    const order = api.getAllColumns().map((c) => c.field);

    const widths = {};
    api.getAllColumns().forEach((c) => {
      const w = c.computedWidth ?? c.width ?? 100;
      widths[c.field] = typeof w === "number" ? w : 100;
    });

    let pinned;
    if (api.exportState) {
      const state = api.exportState();
      if (state?.pinnedColumns) {
        pinned = {
          left: state.pinnedColumns.left || [],
          right: state.pinnedColumns.right || [],
        };
      }
    }

    const density = api.state?.density?.value;

    return { version: 1, visibleColumns, order, widths, pinned, density };
  };

  const scheduleSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (!apiRef.current) return;
      const cfg = extractConfig(apiRef.current);
      save(gridKey, cfg);
    }, 800);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let loadedCfg = null;
      try {
        const { data } = await execLoad({ variables: { gridKey } });
        const item = data?.dataGridConfig?.items?.[0] || null;
        const raw = item?.configJson ?? null;
        loadedCfg = raw ? JSON.parse(raw) : null;
      } catch {
        loadedCfg = null;
      }
      if (cancelled) return;

      let tries = 0;
      while (
        !cancelled &&
        (!apiRef.current || apiRef.current.getAllColumns().length === 0) &&
        tries < 50
      ) {
        await new Promise((r) => setTimeout(r, 20));
        tries++;
      }
      if (cancelled || !apiRef.current) return;

      if (loadedCfg) {
        applyConfig(apiRef.current, loadedCfg);
      } else {
        const initial = extractConfig(apiRef.current);
        await save(gridKey, initial);
      }

      hasAppliedInitialRef.current = true;
      readyRef.current = true;
    })();

    return () => {
      cancelled = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [gridKey]);

  const onVisibilityChanged = () => {
    if (!readyRef.current || !hasAppliedInitialRef.current) return;
    scheduleSave();
  };
  const onWidthChanged = () => {
    if (!readyRef.current || !hasAppliedInitialRef.current) return;
    scheduleSave();
  };
  const onPinnedChanged = () => {
    if (!readyRef.current || !hasAppliedInitialRef.current) return;
    scheduleSave();
  };

  const handlers = {
    onColumnVisibilityModelChange: onVisibilityChanged,
    onColumnWidthChange: onWidthChanged,
    onPinnedColumnsChange: onPinnedChanged,
    onColumnOrderChange: undefined,
    onDensityChange: undefined,
  };

  return { apiRef, handlers };
}
