import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import formReducer from './slices/formSlice';
import { baseApi } from './api';

import {
    safeReduxLogger,
    safeReduxLoggingEnabled,
} from '@/components/state/safeReduxLogger';

const rootReducer = combineReducers({
    auth: authReducer,
    ui: uiReducer,
    form: formReducer,
    [baseApi.reducerPath]: baseApi.reducer,
});

const persistConfig = {
    key: 'root',
    version: 1,
    storage,
    whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer as unknown as typeof rootReducer,
    middleware: (getDefaultMiddleware) => {
        const middleware = getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        })
            .concat(baseApi.middleware);

        return safeReduxLoggingEnabled()
            ? middleware.concat(safeReduxLogger)
            : middleware;
    },
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
