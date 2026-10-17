import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ColorMode = "light" | "dark";

interface UiState {
  sidebarCollapsed: boolean;
  colorMode: ColorMode;
}

const initialState: UiState = { sidebarCollapsed: false, colorMode: "light" };

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    hydrateUi: (_s, a: PayloadAction<UiState>) => a.payload,
    toggleSidebar: (s) => {
      s.sidebarCollapsed = !s.sidebarCollapsed;
    },
    setColorMode: (s, a: PayloadAction<ColorMode>) => {
      s.colorMode = a.payload;
    },
  },
});

export const { hydrateUi, toggleSidebar, setColorMode } = uiSlice.actions;
