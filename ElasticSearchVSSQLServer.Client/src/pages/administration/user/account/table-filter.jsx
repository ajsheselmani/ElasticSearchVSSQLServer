import { InputAdornment, TextField } from "@mui/material";
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
import { debounce } from "lodash";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import React from "react";

export default function TableFilter() {
  const { t } = useTranslation();
  const { generalSearch, startDate, endDate } = useSelector(
    (store) => store?.userAccount?.state,
  );
  const dispatch = useDispatch();

  const handleFilterName = (event) => {
    dispatch(setGeneralSearch(event.currentTarget.value));
    debouncedChangeHandler(event.currentTarget.value);
  };

  const debouncedChangeHandler = React.useRef(
    debounce(() => {
      dispatch(fetchUserLogsData());
    }, 1000),
  ).current;

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

  return (
    <>
      <div className="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4 py-3 px-2">
        <DatePicker
          label="Data fillimit"
          disableFuture
          value={startDate}
          slotProps={{
            field: {
              clearable: true,
            },
            textField: {
              size: "small",
            },
          }}
          onChange={(newValue) => handleDateChange(newValue, 1)}
        />
        <DatePicker
          label="Data mbarimit"
          value={endDate}
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
          onChange={(newValue) => handleDateChange(newValue, 2)}
        />
        <TextField
          className="xl:col-span-3 lg:col-span-2 sm:col-span-2 md:col-span-1"
          fullWidth
          value={generalSearch}
          onChange={handleFilterName}
          placeholder="Kërko..."
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
    </>
  );
}
