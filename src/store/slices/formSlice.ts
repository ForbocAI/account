import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

interface FormState {
    login: {
        email: string;
        loading: boolean;
        error: string | null;
    };
    signup: {
        email: string;
        loading: boolean;
        error: string | null;
    };
    keys: {
        newKeyName: string;
        showModal: boolean;
        revealedKey: string | null;
        creating: boolean;
        error: string | null;
    };
    billing: {
        upgrading: string | null;
        portalLoading: boolean;
        error: string | null;
    };
}

const initialState: FormState = {
    login: {
        email: '',
        loading: false,
        error: null,
    },
    signup: {
        email: '',
        loading: false,
        error: null,
    },
    keys: {
        newKeyName: '',
        showModal: false,
        revealedKey: null,
        creating: false,
        error: null,
    },
    billing: {
        upgrading: null,
        portalLoading: false,
        error: null,
    },
};

export const formSlice = createSlice({
    name: 'form',
    initialState,
    reducers: {
        setLoginEmail: (state, action: PayloadAction<string>) => {
            state.login.email = action.payload;
        },
        setLoginError: (state, action: PayloadAction<string | null>) => {
            state.login.error = action.payload;
        },
        setLoginLoading: (state, action: PayloadAction<boolean>) => {
            state.login.loading = action.payload;
        },
        setSignupEmail: (state, action: PayloadAction<string>) => {
            state.signup.email = action.payload;
        },
        setSignupError: (state, action: PayloadAction<string | null>) => {
            state.signup.error = action.payload;
        },
        setSignupLoading: (state, action: PayloadAction<boolean>) => {
            state.signup.loading = action.payload;
        },
        setKeysNewKeyName: (state, action: PayloadAction<string>) => {
            state.keys.newKeyName = action.payload;
        },
        setKeysShowModal: (state, action: PayloadAction<boolean>) => {
            state.keys.showModal = action.payload;
        },
        setKeysRevealedKey: (state, action: PayloadAction<string | null>) => {
            state.keys.revealedKey = action.payload;
        },
        setKeysCreating: (state, action: PayloadAction<boolean>) => {
            state.keys.creating = action.payload;
        },
        setKeysError: (state, action: PayloadAction<string | null>) => {
            state.keys.error = action.payload;
        },
        setBillingUpgrading: (state, action: PayloadAction<string | null>) => {
            state.billing.upgrading = action.payload;
        },
        setBillingPortalLoading: (state, action: PayloadAction<boolean>) => {
            state.billing.portalLoading = action.payload;
        },
        setBillingError: (state, action: PayloadAction<string | null>) => {
            state.billing.error = action.payload;
        },
        resetForm: (state, action: PayloadAction<keyof FormState>) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            state[action.payload] = initialState[action.payload] as any;
        },
    },
});

export const {
    setLoginEmail,
    setLoginError,
    setLoginLoading,
    setSignupEmail,
    setSignupError,
    setSignupLoading,
    setKeysNewKeyName,
    setKeysShowModal,
    setKeysRevealedKey,
    setKeysCreating,
    setKeysError,
    setBillingUpgrading,
    setBillingPortalLoading,
    setBillingError,
    resetForm,
} = formSlice.actions;

// Selectors
const selectForm = (state: { form: FormState }) => state.form;

export const selectLoginForm = createSelector(selectForm, (form) => form.login);
export const selectSignupForm = createSelector(selectForm, (form) => form.signup);
export const selectKeysForm = createSelector(selectForm, (form) => form.keys);
export const selectBillingForm = createSelector(selectForm, (form) => form.billing);

export default formSlice.reducer;
