import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./store";
import { useAppDispatch, useAppSelector } from "./hooks";
import { readJson, storageKey, writeJson } from "@/lib/persistence";
import { hydrateSession } from "@/features/auth/session.slice";
import { hydrateUi, type ColorMode } from "@/features/ui/ui.slice";

const SESSION_KEY = storageKey("session");
const UI_KEY = storageKey("ui");

function PersistenceSync() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.session.userId);
  const hydrated = useAppSelector((s) => s.session.hydrated);
  const ui = useAppSelector((s) => s.ui);

  useEffect(() => {
    const ui = readJson<{ sidebarCollapsed: boolean; colorMode: ColorMode }>(UI_KEY);
    if (ui) dispatch(hydrateUi(ui));
    dispatch(hydrateSession(readJson<{ userId: string }>(SESSION_KEY)?.userId ?? null));
  }, [dispatch]);

  useEffect(() => {
    if (hydrated) writeJson(SESSION_KEY, { userId });
  }, [userId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(UI_KEY, ui);
    document.documentElement.classList.toggle("dark", ui.colorMode === "dark");
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
