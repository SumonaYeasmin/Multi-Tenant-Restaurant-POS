import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./store";
import { useAppDispatch, useAppSelector } from "./hooks";
import { readJson, storageKey, writeJson } from "@/lib/persistence";
import { hydrateSession } from "@/features/auth/session.slice";
import { hydrateUi, type UiState } from "@/features/ui/ui.slice";
import { applyRestaurantTheme, getThemePreset } from "@/features/theme/restaurant-themes";

const SESSION_KEY = storageKey("session");
const UI_KEY = storageKey("ui");

function PersistenceSync() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.session.userId);
  const hydrated = useAppSelector((s) => s.session.hydrated);
  const ui = useAppSelector((s) => s.ui);

  useEffect(() => {
    const savedUi = readJson<UiState>(UI_KEY);
    if (savedUi) {
      dispatch(hydrateUi(savedUi));
      const preset = getThemePreset(savedUi.themePresetId);
      applyRestaurantTheme(preset, savedUi.themeStyle);
    } else {
      const preset = getThemePreset(ui.themePresetId);
      applyRestaurantTheme(preset, ui.themeStyle);
    }
    dispatch(hydrateSession(readJson<{ userId: string }>(SESSION_KEY)?.userId ?? null));
  }, [dispatch]);

  useEffect(() => {
    if (hydrated) writeJson(SESSION_KEY, { userId });
  }, [userId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(UI_KEY, ui);
    const preset = getThemePreset(ui.themePresetId);
    applyRestaurantTheme(preset, ui.themeStyle);
  }, [ui, hydrated]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);
  return (
    <Provider store={store}>
      <PersistenceSync />
      {children}
    </Provider>
  );
}
