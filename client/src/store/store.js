import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'

import authSlice from './slices/authSlice'
import userSlice from './slices/userSlice'
import gameSlice from './slices/gameSlice'
import performanceSlice from './slices/performanceSlice'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'user'] // Only persist auth and user data
}

const rootReducer = combineReducers({
  auth: authSlice,
  user: userSlice,
  game: gameSlice,
  performance: performanceSlice,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)
export default store