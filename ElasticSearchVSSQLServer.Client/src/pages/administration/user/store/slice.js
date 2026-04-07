import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "users/state",
  initialState: {
    generalSearch: "",
    expanded: false,
  },
  reducers: {
    setGeneralSearch: (state, action) => {
      state.generalSearch = action.payload;
    },
    setExpanded: (state, action) => {
      state.expanded = action.payload;
    },
  },
});

export const { setGeneralSearch, setExpanded } = slice.actions;

export default slice.reducer;
