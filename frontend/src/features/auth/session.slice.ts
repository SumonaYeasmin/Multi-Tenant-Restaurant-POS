import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Holds only the signed-in user id (no tokens or passwords). User details come from RTK Query.
interface SessionState {
  userId: string | null;
  hydrated: boolean;
}

const initialState: SessionState = { userId: null, hydrated: false };

export const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    hydrateSession: (s, a: PayloadAction<string | null>) => {
      s.userId = a.payload;
      s.hydrated = true;
    },
    signedIn: (s, a: PayloadAction<string>) => {
      s.userId = a.payload;
    },
    signedOut: (s) => {
      s.userId = null;
    },
  },
});

export const { hydrateSession, signedIn, signedOut } = sessionSlice.actions;
