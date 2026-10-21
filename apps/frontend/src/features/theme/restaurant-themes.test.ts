import { describe, it, expect, beforeEach } from "vitest";
import {
  RESTAURANT_THEMES,
  getThemePreset,
  applyRestaurantTheme,
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME_ID,
} from "./restaurant-themes";
import {
  uiSlice,
  setThemePreset,
  setColorMode,
  setThemeStyle,
  type UiState,
} from "../ui/ui.slice";

describe("Restaurant Themes Engine", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme-style");
    document.documentElement.removeAttribute("style");
  });

  it("should provide 16 well-formed curated restaurant presets with zero missing color tokens", () => {
    expect(RESTAURANT_THEMES.length).toBe(16);

    const ids = new Set<string>();
    for (const preset of RESTAURANT_THEMES) {
      expect(ids.has(preset.id)).toBe(false);
      ids.add(preset.id);

      expect(preset.name).toBeTruthy();
      expect(preset.concept).toBeTruthy();
      expect(["light", "dark"]).toContain(preset.mode);
      expect(["gradient", "solid"]).toContain(preset.style);
      expect(preset.previewGradient).toContain("linear-gradient");
      expect(preset.accentDot).toBeTruthy();

      // Check required color keys
      const { colors } = preset;
      expect(colors.accent).toBeTruthy();
      expect(colors.accentForeground).toBeTruthy();
      expect(colors.background).toBeTruthy();
      expect(colors.foreground).toBeTruthy();
      expect(colors.card).toBeTruthy();
      expect(colors.cardForeground).toBeTruthy();
      expect(colors.border).toBeTruthy();
      expect(colors.muted).toBeTruthy();
      expect(colors.sidebar).toBeTruthy();
    }
  });

  it("getThemePreset should retrieve exact preset or fallback to default", () => {
    const harbor = getThemePreset("harbor-ocean");
    expect(harbor.id).toBe("harbor-ocean");
    expect(harbor.name).toBe("Harbor & Ocean");

    const fallback = getThemePreset("non-existent-theme-id");
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe(RESTAURANT_THEMES[0]!.id);
  });

  it("applyRestaurantTheme should properly inject CSS variables and attributes to documentElement", () => {
    const preset = getThemePreset("matcha-zen");
    applyRestaurantTheme(preset, "solid");

    const root = document.documentElement;
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.getAttribute("data-theme-style")).toBe("solid");
    expect(root.style.getPropertyValue("--primary")).toBe(preset.colors.accent);
    expect(root.style.getPropertyValue("--background")).toBe(preset.colors.background);
    expect(root.style.getPropertyValue("--card")).toBe(preset.colors.card);
    expect(root.style.getPropertyValue("--foreground")).toBe(preset.colors.foreground);
    expect(root.style.getPropertyValue("--sidebar")).toBe(preset.colors.sidebar);
  });

  it("applyRestaurantTheme should toggle dark class off for day shift presets", () => {
    const lightPreset = getThemePreset(DEFAULT_LIGHT_THEME_ID);
    applyRestaurantTheme(lightPreset);

    const root = document.documentElement;
    expect(root.classList.contains("dark")).toBe(false);
    expect(root.getAttribute("data-theme-style")).toBe(lightPreset.style);
    expect(root.style.getPropertyValue("--primary")).toBe(lightPreset.colors.accent);
  });
});

describe("UI Redux Slice Theme Actions", () => {
  const initial: UiState = {
    sidebarCollapsed: false,
    colorMode: "dark",
    themePresetId: DEFAULT_DARK_THEME_ID,
    themeStyle: "gradient",
  };

  it("setThemePreset switches preset and synchronizes mode and style", () => {
    const lightPreset = getThemePreset("tuscan-terracotta");
    const state = uiSlice.reducer(initial, setThemePreset(lightPreset.id));

    expect(state.themePresetId).toBe("tuscan-terracotta");
    expect(state.colorMode).toBe("light");
    expect(state.themeStyle).toBe(lightPreset.style);
  });

  it("setColorMode auto-switches to matching mode preset if current is incompatible", () => {
    const state = uiSlice.reducer(initial, setColorMode("light"));
    expect(state.colorMode).toBe("light");
    expect(state.themePresetId).toBe(DEFAULT_LIGHT_THEME_ID);
  });

  it("setThemeStyle toggles between gradient and solid", () => {
    const state = uiSlice.reducer(initial, setThemeStyle("solid"));
    expect(state.themeStyle).toBe("solid");
  });
});
