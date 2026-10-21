import { useState, useEffect } from "react";
import {
  Check,
  Moon,
  Sparkles,
  Square,
  Sun,
  X,
  Palette,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  RESTAURANT_THEMES,
  type RestaurantThemePreset,
  type ThemeMode,
  type ThemeStyle,
  getThemePreset,
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME_ID,
  applyRestaurantTheme,
} from "./restaurant-themes";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  setThemePreset,
  setThemeStyle,
  setColorMode,
} from "@/features/ui/ui.slice";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface RestaurantThemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (preset: RestaurantThemePreset) => void;
}

export function RestaurantThemeModal({
  open,
  onOpenChange,
  onSaved,
}: RestaurantThemeModalProps) {
  const dispatch = useAppDispatch();
  const currentPresetId = useAppSelector((s) => s.ui.themePresetId);
  const currentMode = useAppSelector((s) => s.ui.colorMode);
  const currentStyle = useAppSelector((s) => s.ui.themeStyle);

  // Local draft state for live previewing before saving
  const [selectedId, setSelectedId] = useState<string>(currentPresetId);
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(currentMode);
  const [selectedStyle, setSelectedStyle] = useState<ThemeStyle>(currentStyle);

  // Sync state whenever modal opens
  useEffect(() => {
    if (open) {
      setSelectedId(currentPresetId);
      setSelectedMode(currentMode);
      setSelectedStyle(currentStyle);
    }
  }, [open, currentPresetId, currentMode, currentStyle]);

  const activePreset = getThemePreset(selectedId);

  // Handle switching light / dark tab
  const handleModeChange = (mode: ThemeMode) => {
    setSelectedMode(mode);
    // Auto-select a matching theme for that mode
    if (activePreset.mode !== mode) {
      const nextId =
        mode === "dark" ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID;
      setSelectedId(nextId);
      const nextPreset = getThemePreset(nextId);
      applyRestaurantTheme(nextPreset, selectedStyle);
    }
  };

  // Handle clicking a preset card
  const handleSelectPreset = (preset: RestaurantThemePreset) => {
    setSelectedId(preset.id);
    setSelectedMode(preset.mode);
    setSelectedStyle(preset.style);
    // Instant live preview
    applyRestaurantTheme(preset, preset.style);
  };

  // Handle style switch (gradient vs solid)
  const handleStyleChange = (style: ThemeStyle) => {
    setSelectedStyle(style);
    applyRestaurantTheme(activePreset, style);
  };

  // Reset to default
  const handleResetToStandard = () => {
    const defaultPreset = getThemePreset(DEFAULT_DARK_THEME_ID);
    setSelectedId(defaultPreset.id);
    setSelectedMode(defaultPreset.mode);
    setSelectedStyle(defaultPreset.style);
    applyRestaurantTheme(defaultPreset, defaultPreset.style);
    toast.info("Reset to default Tablewise POS theme preview");
  };

  // Handle dialog open/close with preview rollback if not saved
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      const savedPreset = getThemePreset(currentPresetId);
      applyRestaurantTheme(savedPreset, currentStyle);
    }
    onOpenChange(nextOpen);
  };

  // Save theme permanently
  const handleSaveTheme = () => {
    dispatch(setThemePreset(selectedId));
    dispatch(setColorMode(selectedMode));
    dispatch(setThemeStyle(selectedStyle));
    applyRestaurantTheme(activePreset, selectedStyle);

    toast.success(`Applied ${activePreset.name} atmosphere!`);
    if (onSaved) onSaved(activePreset);
    onOpenChange(false);
  };

  // Filter presets matching the currently selected mode
  const displayedPresets = RESTAURANT_THEMES.filter(
    (t) => t.mode === selectedMode
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[480px] p-0 overflow-hidden border border-border/70 bg-card/95 backdrop-blur-xl shadow-2xl rounded-2xl"
        aria-describedby={undefined}
      >
        <div className="p-6 space-y-6">
          {/* ================= HEADER: LIGHT / DARK PILL SWITCH ================= */}
          <div className="flex items-center justify-between">
            <DialogTitle className="sr-only">Customize Restaurant Theme</DialogTitle>
            <div className="flex-1 max-w-[340px] mx-auto flex items-center p-1 rounded-full border border-border/60 bg-muted/50">
              <button
                type="button"
                onClick={() => handleModeChange("light")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-semibold transition-all duration-200",
                  selectedMode === "light"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sun className="size-3.5" />
                Day Shift (Light)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("dark")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-semibold transition-all duration-200",
                  selectedMode === "dark"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Moon className="size-3.5" />
                Night Shift (Dark)
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors ml-2"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* ================= STYLE SELECTION: GRADIENT VS SOLID ================= */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ambience Style
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleStyleChange("gradient")}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all",
                  selectedStyle === "gradient"
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                )}
              >
                <Sparkles
                  className={cn(
                    "size-5 shrink-0 mt-0.5",
                    selectedStyle === "gradient"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Gradient
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    Glass panels with soft ambient glows
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStyleChange("solid")}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all",
                  selectedStyle === "solid"
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                )}
              >
                <Square
                  className={cn(
                    "size-5 shrink-0 mt-0.5",
                    selectedStyle === "solid"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Solid
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    Crisp flat colors, high POS contrast
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ================= RESTAURANT PRESETS GRID ================= */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Restaurant Concept Presets
              </h4>
              <span className="text-[11px] text-muted-foreground">
                {displayedPresets.length} curated palettes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1.5">
              {displayedPresets.map((preset) => {
                const isSelected = selectedId === preset.id;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      "flex flex-col gap-2 p-2.5 rounded-xl border text-left transition-all relative group",
                      isSelected
                        ? "border-primary bg-primary/15 ring-2 ring-primary/50 shadow-sm"
                        : "border-border/60 bg-muted/20 hover:bg-muted/50"
                    )}
                  >
                    {/* Glowing preview pill */}
                    <div
                      className="w-full h-8 rounded-lg relative overflow-hidden flex items-center justify-between px-2.5 shadow-inner"
                      style={{ background: preset.previewGradient }}
                    >
                      {/* Active checkmark */}
                      {isSelected ? (
                        <div className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div />
                      )}
                      {/* Glowing accent dot */}
                      <span
                        className="size-3 rounded-full shadow-sm ring-2 ring-black/20 shrink-0"
                        style={{ backgroundColor: preset.accentDot }}
                      />
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <div className="truncate text-xs font-semibold text-foreground">
                        {preset.name}
                      </div>
                      <span className="text-muted-foreground shrink-0 ml-1">
                        {preset.mode === "dark" ? (
                          <Moon className="size-3" />
                        ) : (
                          <Sun className="size-3" />
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= HARMONIZED COLORS PREVIEW ================= */}
          <div className="space-y-2 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Atmosphere Colors
              </h4>
              <span className="text-[11px] text-primary font-medium">
                Auto-balanced for readability
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-background/50">
                <span
                  className="size-4 rounded-md border shrink-0 shadow-xs"
                  style={{ backgroundColor: activePreset.colors.accent }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Accent</div>
                  <div className="text-[11px] font-mono truncate">{activePreset.colors.accent}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-background/50">
                <span
                  className="size-4 rounded-md border shrink-0 shadow-xs"
                  style={{ backgroundColor: activePreset.colors.background }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Canvas</div>
                  <div className="text-[11px] font-mono truncate">{activePreset.colors.background}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-background/50">
                <span
                  className="size-4 rounded-md border shrink-0 shadow-xs"
                  style={{ backgroundColor: activePreset.colors.card }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Cards</div>
                  <div className="text-[11px] font-mono truncate">{activePreset.colors.card}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-background/50">
                <span
                  className="size-4 rounded-md border shrink-0 shadow-xs"
                  style={{ backgroundColor: activePreset.colors.foreground }}
                />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Text</div>
                  <div className="text-[11px] font-mono truncate">{activePreset.colors.foreground}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= FOOTER ACTIONS ================= */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={handleResetToStandard}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reset to Default
            </button>

            <button
              type="button"
              onClick={handleSaveTheme}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-95 shadow-md transition-all active:scale-[0.98]"
            >
              Save & Apply Theme
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
