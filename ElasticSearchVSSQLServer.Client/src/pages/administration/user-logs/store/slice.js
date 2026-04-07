import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "src/lib/axios";

const initialState = {
  generalSearch: "",
  startDate: undefined,
  endDate: undefined,
  status: "all",
  hits: [],
  aggregations: [],
  loading: false,
  totalCount: 0,
  filters: [],
  sortOrder: {
    field: "@timestamp",
    // sort: 'desc',
  },
  page: 0,
  pageSize: 10,
  aggregatedItems: [
    {
      property: "level",
      size: 10,
    },
    {
      property: "fields.UserFullName",
      size: 10000000,
    },
    {
      property: "fields.Role",
      size: 10000000,
    },
  ],
};

export const fetchUserLogsData = createAsyncThunk(
  "users/log/state/fetchHits",
  async (_, config) => {
    let state = config.getState().userLogs;
    const response = await axiosInstance.put(
      `/Administration/Index/Search-new`,
      {
        aggregations: state.aggregatedItems,
        sortOrders: [
          {
            key: state.sortOrder.field,
            sortOrder: state.sortOrder.sort,
          },
        ],
        filter: state.filters,
      },
      {
        params: {
          page: state.page,
          pageSize: state.pageSize,
          query: state.generalSearch,
        },
      },
    );
    return response?.data;
  },
);

const slice = createSlice({
  name: "user/logs/state",
  initialState: initialState,
  reducers: {
    setGeneralSearch: (state, action) => {
      state.generalSearch = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    removeFilter: (state, action) => {
      state.filters = state.filters.filter(
        (x) =>
          !(
            x.propertyName == action.payload.propertyName &&
            x.operator == action.payload.operator
          ),
      );
    },
    upsertFilter: (state, action) => {
      if (action.payload.operator == 0) {
        state.filters = state.filters.filter(
          (f) => f.propertyName !== action.payload.propertyName,
        );
        state.filters.push(action.payload);
      } else {
        let currentItem = state.filters.find(
          (x) =>
            x.propertyName == action.payload.propertyName &&
            x.operator == action.payload.operator,
        );
        if (currentItem) {
          currentItem.value = action.payload.value;
          const indexToUpdate = state.filters.findIndex(
            (x) =>
              x.propertyName == action.payload.propertyName &&
              x.operator == action.payload.operator,
          );
          state.filters[indexToUpdate] = currentItem;
        } else state.filters.push(action.payload);
      }
    },
    setStartDate: (state, action) => {
      state.startDate = action.payload;
    },
    setEndDate: (state, action) => {
      state.endDate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserLogsData.fulfilled, (state, action) => {
      state.loading = false;
      state.hits = action.payload?.hits?.map((item, index) => ({
        ...item,
        id: item.id || index,
      }));
      state.aggregations = action.payload?.globalAggregations;
      state.totalCount = action.payload?.metadata.totalCount;
    });
    builder.addCase(fetchUserLogsData.pending, () => {
      //state.loading = true;
    });
  },
});

export const {
  setGeneralSearch,
  setStatus,
  setPage,
  setPageSize,
  setSortOrder,
  upsertFilter,
  removeFilter,
  setStartDate,
  setEndDate,
} = slice.actions;

export default slice.reducer;
