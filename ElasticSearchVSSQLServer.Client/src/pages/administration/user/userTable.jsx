// import { LicenseInfo } from "@mui/x-data-grid-pro";
// import { DataGridPro } from "@mui/x-data-grid-pro";
// import { useTranslation } from "react-i18next";
// import { gql, useLazyQuery, useQuery } from "@apollo/client";
// import ActionColumn from "./dataGrid/ActionColumn";
// import React, { useEffect, useMemo } from "react";
// import { useAuthContext } from "src/auth/hooks";
// import CustomToolbar from "./dataGrid/CustomToolbar";
// import { getDataGridLocale } from "src/locales/custom components/datagrid/utils";
// import i18n from "src/locales";
// import moment from "moment";
// import { mapFiltersToGraphQL } from "src/utils/DataTableFilter";
// import { useLocation } from "react-router";
// import { Chip, Tooltip } from "@mui/material";
// import { debounce } from "lodash";
// import { Iconify } from "src/components/iconify";
// import { getGridSingleSelectOperators } from "@mui/x-data-grid-pro";

// LicenseInfo.setLicenseKey(import.meta.env.VITE_DATAGRID_KEY);

// const query = gql`
//   query users(
//     $where: AspNetUsersFilterInput
//     $skip: Int!
//     $take: Int!
//     $order: [AspNetUsersSortInput!]
//   ) {
//     users(where: $where, skip: $skip, take: $take, order: $order) {
//       totalCount
//       items {
//         id
//         lastname
//         firstname
//         userName
//         personalNumber
//         role {
//           nameEn
//           nameSq
//           nameSr
//         }
//         realRoleUser(where: { active: { eq: true } }) {
//           role {
//             id
//             nameEn
//             nameSq
//             nameSr
//           }
//         }

//         email
//         phoneNumber
//         insertedDate
//         lockoutEnd
//       }
//     }
//   }
// `;
// const rolesQuery = gql`
//   query roles {
//     roles {
//       items {
//         id
//         nameEn
//         nameSq
//         nameSr
//       }
//     }
//   }
// `;
// const UserTable = () => {
//   const { t } = useTranslation();
//   const { user } = useAuthContext();
//   const [page, setPage] = React.useState(0);
//   const [pageSize, setPageSize] = React.useState(10);
//   const [filter, setFilter] = React.useState([]);
//   const [logicType, setLogicalType] = React.useState(null);
//   const [getItems] = useLazyQuery(query);
//   const [totalCount, setTotalCount] = React.useState(null);
//   const [sortBy, setSortBy] = React.useState("id");
//   const [sortByAsc, setSortByAsc] = React.useState(false);
//   const location = useLocation();
//   const [displayedRows, setDisplayedRows] = React.useState([]);
//   const { data: rolesData } = useQuery(rolesQuery);

//   const nameLocale = useMemo(() => {
//     if (user.language === 1) return "nameSq";
//     if (user.language === 3) return "nameSr";
//     return "nameEn";
//   }, [user.language]);

//   const roleOptions = useMemo(() => {
//     const items = rolesData?.roles?.items ?? [];
//     return items
//       .map((r) => ({
//         value: r.id,
//         label: r?.[nameLocale] ?? "",
//       }))
//       .filter((x) => x.label);
//   }, [rolesData, nameLocale]);

//   const expandRealRoleFilter = (item) => {
//     const { operator, value } = item;
//     const ids = Array.isArray(value) ? value : value ? [value] : [];
//     if (operator === "isAnyOf") {
//       return [
//         {
//           field: "realRoleUser",
//           operator: "some",
//           value: {
//             active: { eq: true },
//             role: { id: { in: ids } },
//           },
//         },
//       ];
//     }

//     if (operator === "is") {
//       return [
//         {
//           field: "realRoleUser",
//           operator: "some",
//           value: {
//             active: { eq: true },
//             role: { id: { eq: ids[0] } },
//           },
//         },
//       ];
//     }

//     if (operator === "isNot") {
//       return [
//         {
//           field: "realRoleUser",
//           operator: "none",
//           value: {
//             active: { eq: true },
//             role: { id: { eq: ids[0] } },
//           },
//         },
//       ];
//     }

//     return [];
//   };

//   const roleFilterOperators = useMemo(() => {
//     const ops = getGridSingleSelectOperators();

//     const isOp = ops.find((o) => o.value === "is");
//     const anyOfOp = ops.find((o) => o.value === "isAnyOf");

//     const isNotOp = isOp
//       ? {
//           ...isOp,
//           value: "isNot",
//           label: "nuk është",
//         }
//       : null;

//     return [isOp, anyOfOp, isNotOp].filter(Boolean);
//   }, []);

//   const allColumns = useMemo(
//     () => [
//       {
//         field: "rowNumber",
//         headerName: t("rowNumber"),
//         width: 90,
//         sortable: false,
//         filterable: false,
//         renderCell: (params) => {
//           const rowIndex = params.api.getRowIndexRelativeToVisibleRows(
//             params.id,
//           );
//           return rowIndex !== -1 ? page * pageSize + rowIndex + 1 : "";
//         },
//       },
//       {
//         field: "firstname",
//         headerName: t("firstname"),
//         flex: 1,
//         minWidth: 180,
//       },
//       {
//         field: "lastname",
//         headerName: t("lastname"),
//         flex: 1,
//         minWidth: 180,
//       },
//       {
//         field: "userName",
//         headerName: t("userName"),
//         flex: 1,
//         minWidth: 180,
//       },
//       {
//         field: "lockoutEnd",
//         headerName: t("lockedUser"),
//         flex: 1,
//         minWidth: 130,
//         renderCell: (params) => {
//           const now = new Date();
//           const lockoutEndDate = params.row.lockoutEnd
//             ? new Date(params.row.lockoutEnd)
//             : null;
//           const isLocked = lockoutEndDate && lockoutEndDate > now;
//           return (
//             <Tooltip title={isLocked ? t("lockedUser") : t("unLocked")}>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "center",
//                   alignItems: "center",
//                   width: "100%",
//                   height: "100%",
//                 }}
//               >
//                 {isLocked ? (
//                   <Iconify icon="tdesign:user-blocked" />
//                 ) : (
//                   <Iconify icon="tdesign:user" />
//                 )}
//               </div>
//             </Tooltip>
//           );
//         },
//       },
//       {
//         field: "personalNumber",
//         headerName: t("personalNumber"),
//         flex: 1,
//         minWidth: 120,
//       },
//       {
//         field: "realRoleUser",
//         headerName: t("role"),
//         flex: 1,
//         minWidth: 210,
//         sortable: false,
//         filterable: true,
//         filterOperators: roleFilterOperators,
//         type: "singleSelect",
//         valueOptions: roleOptions,
//         getOptionLabel: (opt) => opt.label,
//         getOptionValue: (opt) => opt.value,

//         valueGetter: (params) => {
//           const roles = params?.row?.realRoleUser;
//           if (!Array.isArray(roles)) return "";
//           return roles
//             .map((r) => r?.role?.[nameLocale])
//             .filter(Boolean)
//             .join(", ");
//         },

//         renderCell: (params) => {
//           const roles = params?.row?.realRoleUser;
//           const activeRole = params?.row?.role?.[0]?.[nameLocale];

//           if (!Array.isArray(roles) || roles.length === 0) return "";

//           const roleNames = roles
//             .map((r) => r?.role?.[nameLocale])
//             .filter(Boolean);

//           return roleNames.map((role) => {
//             const isActive = role === activeRole;

//             return (
//               <Chip
//                 key={role}
//                 className="m-0.5 !rounded-full"
//                 sx={{
//                   backgroundColor: isActive
//                     ? "rgba(51, 209, 56, 0.2)"
//                     : "transparent",
//                   border: !isActive ? "2px solid #40bd27ff" : "transparent",
//                   color: "#40bd27ff",
//                   "& .MuiChip-label": { color: "#40bd27ff" },
//                   "&:hover": { backgroundColor: "rgba(51, 209, 56, 0.4)" },
//                 }}
//                 size="medium"
//                 label={role}
//               />
//             );
//           });
//         },
//       },

//       {
//         field: "email",
//         headerName: t("email"),
//         flex: 1,
//         minWidth: 180,
//       },
//       {
//         field: "phoneNumber",
//         headerName: t("phonenumber"),
//         flex: 1,
//         minWidth: 180,
//       },
//       {
//         field: "insertedDate",
//         headerName: t("insertedDate"),
//         flex: 1,
//         maxWidth: 180,
//         minWidth: 180,
//         type: "dateTime",
//         valueFormatter: (params) =>
//           moment(params).format("DD/MM/YYYY HH:mm:SS"),
//       },
//       {
//         field: "actions",
//         headerName: t("actions"),
//         flex: 1,
//         minWidth: 120,
//         sortable: false,
//         filterable: false,
//         renderCell: (params) => <ActionColumn row={params.row} />,
//       },
//     ],
//     [t, page, pageSize, nameLocale, roleOptions],
//   );

//   const columns = allColumns;

//   useEffect(() => {
//     if (location.pathname === "/user") {
//       getItems({
//         variables: {
//           where: mapFiltersToGraphQL(filter, logicType, columns),
//           skip: page * pageSize,
//           take: pageSize,
//           order: [
//             {
//               [sortBy]: sortByAsc ? "ASC" : "DESC",
//             },
//           ],
//         },
//       }).then((response) => {
//         const count = response?.data?.users?.totalCount ?? 0;
//         setTotalCount(count);
//         setDisplayedRows(response?.data?.users?.items ?? []);
//       });
//     }
//   }, [location, filter, page, pageSize, logicType, sortBy, sortByAsc]);

//   const onFilterChange = React.useCallback(
//     () =>
//       debounce((filterModel) => {
//         setPage(0);
//         if (filterModel.items.length > 0) {
//           const validFilters = filterModel.items
//             .filter((item) => {
//               if (["isEmpty", "isNotEmpty"].includes(item.operator))
//                 return true;
//               if (Array.isArray(item.value)) return item.value.length > 0;
//               return (
//                 item.value !== undefined &&
//                 item.value !== null &&
//                 item.value !== ""
//               );
//             })
//             .flatMap((item) =>
//               item.field === "realRoleUser"
//                 ? expandRealRoleFilter(item)
//                 : [item],
//             );

//           setFilter(validFilters);
//           setLogicalType(filterModel.logicOperator);
//         } else {
//           setFilter([]);
//           setLogicalType(null);
//         }
//       }, 1000),
//     [nameLocale],
//   );

//   const onGlobalSearch = React.useCallback(
//     (searchValue) => {
//       setPage(0);
//       if (!searchValue) {
//         setFilter([]);
//         setLogicalType(null);
//         return;
//       }
//       const filters = columns
//         .filter(
//           (x) =>
//             x.field !== "actions" &&
//             x.field !== "realRoleUser" &&
//             x.field !== "insertedDate" &&
//             x.field !== "lockoutEnd" &&
//             x.field !== "rowNumber",
//         )
//         .map((field) => ({
//           field: field.field,
//           operator: "contains",
//           value: searchValue,
//         }));

//       const date = moment(searchValue, "DD/MM/YYYY", true);

//       if (columns.some((x) => x.field === "insertedDate" && date.isValid())) {
//         const startOfDay = date
//           .clone()
//           .startOf("day")
//           .utc()
//           .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
//         const endOfDay = date
//           .clone()
//           .endOf("day")
//           .utc()
//           .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

//         filters.push({
//           field: "insertedDate",
//           operator: "contains",
//           value: { gte: startOfDay, lte: endOfDay },
//         });
//       }
//       if (columns.some((x) => x.field === "realRoleUser")) {
//         filters.push({
//           field: "realRoleUser",
//           operator: "some",
//           value: {
//             active: { eq: true },
//             role: {
//               [nameLocale]: { contains: searchValue },
//             },
//           },
//         });
//       }
//       setFilter(filters);
//       setLogicalType("or");
//     },
//     [columns, nameLocale],
//   );

//   return (
//     <DataGridPro
//       columns={columns}
//       rows={displayedRows}
//       getRowId={(item) => item.id}
//       pinnedColumns={{ right: ["actions"] }}
//       isRowSelectable={() => false}
//       showToolbar
//       pageSizeOptions={[10, 20, 50, { value: 999999, label: t("all") }]}
//       paginationModel={{
//         page: page,
//         pageSize: pageSize,
//       }}
//       onPaginationModelChange={(model) => {
//         setPage(model.page);
//         setPageSize(model.pageSize);
//       }}
//       pagination
//       slots={{ toolbar: CustomToolbar }}
//       rowCount={totalCount ?? 0}
//       localeText={getDataGridLocale(i18n.language)}
//       onSortModelChange={(model) => {
//         if (model.length === 0) {
//           setSortBy("id");
//           setSortByAsc(true);
//         }
//         let field = model[0].field;
//         setSortBy(field);
//         setSortByAsc(model[0].sort === "asc");
//       }}
//       sortingMode="server"
//       paginationMode="server"
//       filterMode="server"
//       onFilterModelChange={onFilterChange}
//       slotProps={{
//         toolbar: {
//           onGlobalSearch,
//           filter,
//           logicType,
//           columns,
//           query,
//         },
//       }}
//     />
//   );
// };

// export default UserTable;
