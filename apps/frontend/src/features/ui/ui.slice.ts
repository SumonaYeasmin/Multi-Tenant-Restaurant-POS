import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_DARK_THEME_ID, DEFAULT_LIGHT_THEME_ID, getThemePreset } from "../theme/restaurant-themes";

export type ColorMode = "light" | "dark";
export type ThemeStyle = "gradient" | "solid";

export interface UiState {
  sidebarCollapsed: boolean;
  colorMode: ColorMode;
  themePresetId: string;
  themeStyle: ThemeStyle;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  colorMode: "dark",
  themePresetId: DEFAULT_DARK_THEME_ID,
  themeStyle: "gradient",
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    hydrateUi: (_s, a: PayloadAction<UiState>) => ({
      ...initialState,
      ...a.payload,
    }),
    toggleSidebar: (s) => {
      s.sidebarCollapsed = !s.sidebarCollapsed;
    },
    setColorMode: (s, a: PayloadAction<ColorMode>) => {
      s.colorMode = a.payload;
      const current = getThemePreset(s.themePresetId);
      // If current preset's mode does not match the newly selected mode, switch to default preset for that mode
      if (current.mode !== a.payload) {
        s.themePresetId = a.payload === "dark" ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID;
      }
    },
    setThemePreset: (s, a: PayloadAction<string>) => {
      s.themePresetId = a.payload;
      const preset = getThemePreset(a.payload);
      s.colorMode = preset.mode;
      s.themeStyle = preset.style;
    },
    setThemeStyle: (s, a: PayloadAction<ThemeStyle>) => {
      s.themeStyle = a.payload;
    },
  },
});

export const { hydrateUi, toggleSidebar, setColorMode, setThemePreset, setThemeStyle } = uiSlice.actions;
