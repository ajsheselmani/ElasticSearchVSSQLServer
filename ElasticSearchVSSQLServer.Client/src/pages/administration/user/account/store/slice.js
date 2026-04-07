import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "src/lib/axios";

export const AUDIT_CATEGORIES = {
  all: { label: "all", filters: [] },
  login: {
    label: "login",
    icon: "solar:login-3-bold",
    filters: [
      {
        type: 0,
        propertyName: "fields.ActionName",
        operator: 2,
        value: "AuthController.Post",
        caseSensitive: false,
      },

      {
        type: 0,
        propertyName: "messageTemplate",
        operator: 2,
        value: "Kyçja u krye me sukses",
        caseSensitive: false,
      },
    ],
  },
  logout: {
    label: "logout",
    icon: "solar:logout-3-bold",
    filters: [
      {
        type: 0,
        propertyName: "fields.ActionName",
        operator: 2,
        value: "AuthController.Logout",
        caseSensitive: false,
      },
    ],
  },
  passwordChange: {
    label: "passwordChange",
    icon: "solar:lock-password-bold",
    filters: [
      {
        type: 0,
        propertyName: "noop",
        operator: 2,
        value: "noop",
        caseSensitive: false,
        or: [
          {
            type: 0,
            propertyName: "fields.ActionName",
            operator: 2,
            value: "AuthController.ResetPasswordEmail",
            caseSensitive: false,
            and: [
              {
                type: 0,
                propertyName: "messageTemplate",
                operator: 2,
                value: "Emaili për resetim të fjalëkalimit u dërgua",
                caseSensitive: false,
              },
            ],
          },
          {
            type: 0,
            propertyName: "fields.ActionName",
            operator: 2,
            value: "UserController.ResetPasswordFromAdmin",
            caseSensitive: false,
            and: [
              {
                type: 0,
                propertyName: "messageTemplate",
                operator: 2,
                value: "Reset i password-it përfundoi me sukses",
                caseSensitive: false,
              },
            ],
          },
          {
            type: 0,
            propertyName: "fields.RequestPath",
            operator: 2,
            value: "*/ResetPassword",
            caseSensitive: false,
            and: [
              {
                type: 0,
                propertyName: "messageTemplate",
                operator: 2,
                value: "Perditesimi i fjalekalimit te perdoruesit",
                caseSensitive: false,
              },
            ],
          },
          {
            type: 0,
            propertyName: "fields.ActionName",
            operator: 2,
            value: "UserController.ResetPasswordFromAdmin",
            caseSensitive: false,
            and: [
              {
                type: 0,
                propertyName: "messageTemplate",
                operator: 2,
                value: "Deshtoi perditesimi i fjalekalimit te perdoruesit",
                caseSensitive: false,
              },
            ],
          },

          {
            type: 0,
            propertyName: "fields.RequestPath",
            operator: 2,
            value: "*/ResetPassword",
            caseSensitive: false,
            and: [
              {
                type: 0,
                propertyName: "messageTemplate",
                operator: 2,
                value:
                  "Deshtoi perditesimi i fjalekalimit nga administratori te perdoruesit",
                caseSensitive: false,
              },
            ],
          },
          {
            type: 0,
            propertyName: "messageTemplate",
            operator: 2,
            value: "ResetPasswordEmail dështoi",
            caseSensitive: false,
          },
        ],
      },
    ],
  },

  accessLevelChange: {
    label: "accessLevelChange",
    icon: "solar:shield-user-bold",
    filters: [
      {
        type: 0,
        propertyName: "noop",
        operator: 2,
        value: "noop",
        caseSensitive: false,
        or: [
          {
            type: 0,
            propertyName: "fields.ActionName",
            operator: 2,
            value: "UserController.ChangeUserRole",
            caseSensitive: false,
            and: [
              {
                type: 0,
                propertyName: "messageTemplate",
                operator: 2,
                value: "Perditesimi i rolit te perdoruesit",
                caseSensitive: false,
              },
            ],
          },
          {
            type: 0,
            propertyName: "fields.ActionName",
            operator: 2,
            value: "UserController.ChangeUserRole",
            caseSensitive: false,
            and: [
              {
                type: 0,
                propertyName: "messageTemplate",
                operator: 2,
                value: "Ndryshimi i rolit dështoi",
                caseSensitive: false,
              },
            ],
          },
        ],
      },
    ],
  },

  failedLogin: {
    label: "failedLoginAttempts",
    icon: "solar:danger-triangle-bold",
    filters: [
      {
        type: 0,
        propertyName: "noop",
        operator: 2,
        value: "noop",
        caseSensitive: false,
        or: [
          {
            type: 0,
            propertyName: "messageTemplate",
            operator: 2,
            value: "Kyçja dështoi",
            caseSensitive: false,
          },
          {
            type: 0,
            propertyName: "messageTemplate",
            operator: 2,
            value:
              "Përdoruesi u bllokua për shkak të tentimeve të pasuksesshme",
            caseSensitive: false,
          },
          {
            type: 0,
            propertyName: "messageTemplate",
            operator: 2,
            value: "Kyçja u refuzua",
            caseSensitive: false,
          },
          {
            type: 0,
            propertyName: "messageTemplate",
            operator: 2,
            value: "Validimi në Domain dështoi",
            caseSensitive: false,
          },
        ],
      },
    ],
  },
};

export const fetchUserLogsData = createAsyncThunk(
  "users/acount/log/state/fetchHits",
  async (_, config) => {
    let state = config.getState().userAccount.state;

    const auditFilters = AUDIT_CATEGORIES[state.auditCategory]?.filters ?? [];
    const combinedFilters = [...state.filters, ...auditFilters];

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
        filter: combinedFilters,
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

export const fetchUserLogsDataReport = async (state) => {
  const auditFilters = AUDIT_CATEGORIES[state.auditCategory]?.filters ?? [];
  const combinedFilters = [...state.filters, ...auditFilters];

  const response = await axiosInstance.post(
    `/Administration/User/UserActionReport`,
    {
      aggregations: state.aggregatedItems,
      sortOrders: [
        {
          key: state.sortOrder.field,
          sortOrder: state.sortOrder.sort,
        },
      ],
      filter: combinedFilters,
    },
    {
      params: {
        page: 0,
        pageSize: 999999,
        query: state.generalSearch,
      },
    },
  );
  return response;
};

const slice = createSlice({
  name: "users/acount/log/state",
  initialState: {
    generalSearch: "",
    startDate: undefined,
    endDate: undefined,
    status: "all",
    auditCategory: "all",
    hits: [],
    aggregations: [],
    loading: false,
    totalCount: 0,
    filters: [],
    sortOrder: {
      field: "@timestamp",
      sort: "desc",
    },
    page: 0,
    pageSize: 10,
    aggregatedItems: [
      {
        property: "level",
        size: 10,
      },
    ],
    reportQueue: [],
  },
  reducers: {
    setGeneralSearch: (state, action) => {
      state.generalSearch = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setAuditCategory: (state, action) => {
      state.auditCategory = action.payload;
      state.page = 0;
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
      state.totalCount = action.payload?.metadata.totalCount;

      if (state.auditCategory === "all") {
        state.aggregations = action.payload?.globalAggregations;
      }
    });
    builder.addCase(fetchUserLogsData.pending, (state) => {
      state.loading = true;
    });
  },
});

export const {
  setGeneralSearch,
  setStatus,
  setAuditCategory,
  setPage,
  setPageSize,
  setSortOrder,
  upsertFilter,
  removeFilter,
  setStartDate,
  setEndDate,
} = slice.actions;

export default slice.reducer;
