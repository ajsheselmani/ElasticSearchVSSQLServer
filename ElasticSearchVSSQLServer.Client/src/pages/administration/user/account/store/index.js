import { combineReducers } from '@reduxjs/toolkit';
import state from './slice';

const reducer = combineReducers({
  state,
});

export default reducer;
