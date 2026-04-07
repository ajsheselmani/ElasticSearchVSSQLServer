import rootReducer from "./rootReducer";
import { configureStore } from "@reduxjs/toolkit";
// import persistReducer from "redux-persist/es/persistReducer";
// import persistStore from "redux-persist/es/persistStore";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { CONFIG } from "src/global-config";

const middlewares = [];

const persistConfig = {
  key: CONFIG.PERSIST_STORE_NAME,
  keyPrefix: "",
  storage: storage.default ?? storage,
  whitelist: ["auth"],
};

const store = configureStore({
  reducer: persistReducer(persistConfig, rootReducer()),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(middlewares),
  // devTools: import.meta.env.MODE === "development",
  // devTools: process.env.NODE_ENV === "development",
  devTools: import.meta.env.DEV,
});

store.asyncReducers = {};

export const persistor = persistStore(store);

export const injectReducer = (key, reducer) => {
  if (store.asyncReducers[key]) {
    return false;
  }
  store.asyncReducers[key] = reducer;
  store.replaceReducer(
    persistReducer(persistConfig, rootReducer(store.asyncReducers)),
  );
  persistor.persist();
  return store;
};

export default store;
