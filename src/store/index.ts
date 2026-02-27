import { configureStore, combineReducers, Middleware } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import billingReducer from './slices/billingSlice';
import formReducer from './slices/formSlice';
import { baseApi } from './api';

import { billingListener } from './middleware/billingListener';
import logger from 'redux-logger';

const rootReducer = combineReducers({
    auth: authReducer,
    ui: uiReducer,
    billing: billingReducer,
    form: formReducer,
    [baseApi.reducerPath]: baseApi.reducer,
});

const persistConfig = {
    key: 'root',
    version: 1,
    storage,
    whitelist: ['auth', 'billing'], // Only persist these
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
            .concat(baseApi.middleware)
            .prepend(billingListener.middleware);

        if (process.env.NODE_ENV === 'development') {
            return middleware.concat(logger as Middleware);
        }

        return middleware;
    },
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
