import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    error: string | null;
    success: string | null;
    isLoading: boolean;
}

const initialState: UIState = {
    error: null,
    success: null,
    isLoading: false,
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setSuccess: (state, action: PayloadAction<string | null>) => {
            state.success = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const { setError, setSuccess, setLoading } = uiSlice.actions;
export default uiSlice.reducer;
