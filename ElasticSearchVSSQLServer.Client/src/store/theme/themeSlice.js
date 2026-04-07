import { createSlice } from '@reduxjs/toolkit';

export const initialState = {
  loading: false,
  reportQueue: [],
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    upsertQueueItem: (state, action) => {
      const payload = action.payload;
      let currentItem = state.reportQueue.find((x) => x.queueId == payload.queueId);
      if (currentItem) {
        currentItem.progress = payload.progress;
        currentItem.queueProcessName = payload.queueProcessName;
        const indexToUpdate = state.reportQueue.findIndex((x) => x.queueId == payload.queueId);
        state.reportQueue[indexToUpdate] = currentItem;
      } else {
        state.reportQueue.push(payload);
      }
    },
  },
});

export const { setLoading, upsertQueueItem } = themeSlice.actions;

export default themeSlice.reducer;
