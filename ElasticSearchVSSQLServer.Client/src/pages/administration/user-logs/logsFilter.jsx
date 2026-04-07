import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  InputAdornment,
  ListItemText,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { debounce } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Iconify } from "src/components/iconify";
import {
  fetchUserLogsData,
  removeFilter,
  setEndDate,
  setGeneralSearch,
  setStartDate,
  upsertFilter,
} from "./store/slice";

export default function LogsFilter() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [personName, setPersonName] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const { generalSearch, startDate, endDate, aggregations } = useSelector(
    (store) => store?.userLogs,
  );
  const roleAggregations = aggregations?.find(
    (x) => x.field == "fields.Role.raw",
  )?.aggregations;
  const userAggregations = aggregations?.find(
    (x) => x.field == "fields.UserFullName.raw",
  )?.aggregations;

  const userOptions = userAggregations
    ? Object.entries(userAggregations).map(([userName, count]) => ({
        label: userName === " " ? t("noUserName") : userName,
        value: userName,
        count,
      }))
    : [];

  const roleOptions = roleAggregations
    ? Object.entries(roleAggregations).map(([roleName, count]) => ({
        label: roleName === "" ? t("noRole") : roleName,
        value: roleName,
        count,
      }))
    : [];

  const handleFilterName = (event) => {
    dispatch(setGeneralSearch(event.currentTarget.value));
    debouncedChangeHandler(event.currentTarget.value);
  };

  const debouncedChangeHandler = React.useRef(null);

  React.useEffect(() => {
    const handler = debounce(() => {
      dispatch(fetchUserLogsData());
    }, 1000);

    debouncedChangeHandler.current = handler;

    return () => {
      handler.cancel();
    };
  }, [dispatch]);

  const handleDateChange = (newValue, nCase) => {
    dispatch(nCase == 1 ? setStartDate(newValue) : setEndDate(newValue));
    if (newValue == null)
      dispatch(
        removeFilter({
          propertyName: "@timestamp",
          operator: nCase == 1 ? 7 : 6,
        }),
      );
    else
      dispatch(
        upsertFilter({
          type: 3,
          propertyName: "@timestamp",
          operator: nCase == 1 ? 7 : 6, //1 is for start date. 7 is to filter less than or equal and 6 is for greater than or equal when it is translated in ElasticSearch
          value: newValue,
          caseSensitive: false,
        }),
      );
  };

  const handleChangeUser = (value, selectedUserList) => {
    const selectedValues = selectedUserList.map((u) => u.value);
    const filterArray = [];
    if (Array.isArray(selectedValues) && selectedValues.length > 0) {
      const mainFilter = {
        type: 0,
        propertyName: "fields.UserFullName",
        operator: 0,
        value: selectedValues[0],
        caseSensitive: false,
        or: [],
        and: [],
      };
      for (let i = 1; i < selectedValues.length; i++) {
        mainFilter.or.push({
          type: 0,
          propertyName: "fields.UserFullName",
          operator: 0,
          value: selectedValues[i],
          caseSensitive: false,
          or: [],
          and: [],
        });
      }

      filterArray.push(mainFilter);
    }
    setPersonName(selectedValues);

    if (!selectedValues || selectedValues.length === 0) {
      dispatch(
        removeFilter({ propertyName: "fields.UserFullName", operator: 0 }),
      );
    } else {
      dispatch(upsertFilter(filterArray[0]));
    }
  };

  const handleChangeRole = (event, selectedRolesList) => {
    const selectedValues = selectedRolesList.map((u) => u.value);
    const filterArray = [];
    if (Array.isArray(selectedValues) && selectedValues.length > 0) {
      const mainFilter = {
        type: 0,
        propertyName: "fields.Role",
        operator: 0,
        value: selectedValues[0],
        caseSensitive: false,
        or: [],
        and: [],
      };
      for (let i = 1; i < selectedValues.length; i++) {
        mainFilter.or.push({
          type: 0,
          propertyName: "fields.Role",
          operator: 0,
          value: selectedValues[i],
          caseSensitive: false,
          or: [],
          and: [],
        });
      }

      filterArray.push(mainFilter);
    }
    setSelectedRoles(selectedValues);

    if (!selectedValues || selectedValues.length === 0) {
      dispatch(removeFilter({ propertyName: "fields.Role", operator: 0 }));
    } else {
      dispatch(upsertFilter(filterArray[0]));
    }
  };

  const date = new Date();
  const offsetInHours = date.getTimezoneOffset() / 60;

  return (
    <>
      <div className="grid xl:grid-cols-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-2 py-3 px-2">
        <DatePicker
          label={t("startDate")}
          disableFuture
          slotProps={{
            field: {
              clearable: true,
            },
            textField: {
              size: "small",
            },
          }}
          onChange={(newValue) => {
            newValue = newValue.add(-offsetInHours, "hour"); // Adjust for UTC+2 timezone
            handleDateChange(newValue, 1);
          }}
        />

        <DatePicker
          label={t("endDate")}
          minDate={startDate}
          slotProps={{
            field: {
              clearable: true,
            },
            textField: {
              size: "small",
              helperText:
                endDate &&
                endDate < startDate &&
                t("endDateGreaterThanStartDate"),
            },
          }}
          disableFuture
          onChange={(newValue) => {
            newValue = newValue.add(-offsetInHours, "hour"); // Adjust for UTC+2 timezone
            newValue = newValue.add(1, "day"); // Add one day to include the end date
            handleDateChange(newValue, 2);
          }}
        />

        <Autocomplete
          multiple
          disableCloseOnSelect
          options={userOptions}
          getOptionLabel={(option) => option.label}
          value={personName.map((name) => {
            const matched = userOptions.find((u) => u.value === name);
            return matched || { label: name, value: name };
          })}
          onChange={handleChangeUser}
          renderOption={(props, option, { selected }) => (
            <li key={option.value} {...props}>
              <Checkbox style={{ marginRight: 8 }} checked={selected} />
              <ListItemText
                primary={`${option.label === " " ? t("noUserName") : option.label}`}
              />
              {`(${option.count})`}
            </li>
          )}
          slotProps={(selected, getTagProps) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((option, index) => (
                <Chip
                  label={option.label === " " ? t("noUserName") : option.label}
                  {...getTagProps({ index })}
                  key={option.value}
                />
              ))}
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={t("selectUser")}
              placeholder={t("selectUser")}
            />
          )}
        />

        <Box sx={{ width: "100%" }}>
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={roleOptions}
            getOptionLabel={(option) => option.label}
            value={selectedRoles.map((name) => {
              const matched = roleOptions.find((u) => u.value === name);
              return matched || { label: name, value: name };
            })}
            onChange={handleChangeRole}
            renderOption={(props, option, { selected }) => (
              <li key={option.value} {...props}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
                <ListItemText
                  primary={`${option.label === " " ? t("noRole") : option.label}`}
                />
                {`(${option.count})`}
              </li>
            )}
            slotProps={(selected, getTagProps) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((option, index) => (
                  <Chip
                    label={option.label === "" ? t("noRole") : option.label}
                    {...getTagProps({ index })}
                    key={option.value}
                  />
                ))}
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label={t("selectGroup")}
                placeholder={t("selectGroup")}
              />
            )}
          />
        </Box>

        <div className="grid xl:grid-cols-6 lg:grid-cols-2 md:grid-cols-1 col-span-full mt-2 mr-2">
          <TextField
            className="xl:col-span-3 lg:col-span-2 sm:col-span-2 md:col-span-1"
            fullWidth
            value={generalSearch}
            onChange={handleFilterName}
            placeholder={t("searchPlaceholder")}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify
                      icon="eva:search-fill"
                      sx={{ color: "text.disabled" }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
        </div>
      </div>
    </>
  );
}
