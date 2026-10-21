export type ThemeMode = "light" | "dark";
export type ThemeStyle = "gradient" | "solid";

export interface RestaurantThemePreset {
  id: string;
  name: string;
  concept: string;
  mode: ThemeMode;
  style: ThemeStyle;
  /** CSS gradient representation for the preview pill in the modal */
  previewGradient: string;
  accentDot: string;
  colors: {
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    muted: string;
    mutedForeground: string;
    sidebar: string;
    sidebarForeground: string;
    sidebarBorder: string;
  };
}

export const RESTAURANT_THEMES: RestaurantThemePreset[] = [
  // ==================== DARK MOODS (Night Shift) ====================
  {
    id: "harbor-ocean",
    name: "Harbor & Ocean",
    concept: "Noodle Bar, Asian Fusion & Seafood",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #04121f 0%, #0b2236 60%, #154261 100%)",
    accentDot: "#38bdf8",
    colors: {
      accent: "#38bdf8",
      accentForeground: "#04121f",
      background: "#04121f",
      foreground: "#e6f4ff",
      card: "#0b2236",
      cardForeground: "#e6f4ff",
      border: "rgba(56, 189, 248, 0.2)",
      muted: "#071b2b",
      mutedForeground: "#8bb2d1",
      sidebar: "#030e18",
      sidebarForeground: "#d6ecfb",
      sidebarBorder: "rgba(56, 189, 248, 0.15)",
    },
  },
  {
    id: "saffron-amber",
    name: "Saffron & Amber",
    concept: "Fine Dining, Mughlai & Spice House",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #180902 0%, #2f1304 60%, #522106 100%)",
    accentDot: "#f97316",
    colors: {
      accent: "#f97316",
      accentForeground: "#180902",
      background: "#140702",
      foreground: "#fef3c7",
      card: "#260f04",
      cardForeground: "#fef3c7",
      border: "rgba(249, 115, 22, 0.25)",
      muted: "#1d0c03",
      mutedForeground: "#d4a373",
      sidebar: "#0e0501",
      sidebarForeground: "#fde68a",
      sidebarBorder: "rgba(249, 115, 22, 0.18)",
    },
  },
  {
    id: "bistro-charcoal",
    name: "Bistro & Smoke",
    concept: "Steakhouse, BBQ & Classic Grill",
    mode: "dark",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #09090b 0%, #18181b 60%, #27272a 100%)",
    accentDot: "#fbbf24",
    colors: {
      accent: "#fbbf24",
      accentForeground: "#18181b",
      background: "#09090b",
      foreground: "#f4f4f5",
      card: "#18181b",
      cardForeground: "#f4f4f5",
      border: "rgba(255, 255, 255, 0.12)",
      muted: "#121215",
      mutedForeground: "#a1a1aa",
      sidebar: "#09090b",
      sidebarForeground: "#e4e4e7",
      sidebarBorder: "rgba(255, 255, 255, 0.08)",
    },
  },
  {
    id: "midnight-lounge",
    name: "Midnight Velvet",
    concept: "Cocktail Bar & Rooftop Lounge",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #110424 0%, #230847 60%, #4c1d95 100%)",
    accentDot: "#c084fc",
    colors: {
      accent: "#c084fc",
      accentForeground: "#110424",
      background: "#0e031e",
      foreground: "#f3e8ff",
      card: "#1c0936",
      cardForeground: "#f3e8ff",
      border: "rgba(192, 132, 252, 0.22)",
      muted: "#15062a",
      mutedForeground: "#c4b5fd",
      sidebar: "#090214",
      sidebarForeground: "#e9d5ff",
      sidebarBorder: "rgba(192, 132, 252, 0.15)",
    },
  },
  {
    id: "crimson-wine",
    name: "Crimson Rose",
    concept: "Italian Wine Bar & Romantic Dining",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #160309 0%, #310714 60%, #500720 100%)",
    accentDot: "#fb7185",
    colors: {
      accent: "#fb7185",
      accentForeground: "#160309",
      background: "#130207",
      foreground: "#ffe4e6",
      card: "#260610",
      cardForeground: "#ffe4e6",
      border: "rgba(251, 113, 133, 0.22)",
      muted: "#1c040c",
      mutedForeground: "#f472b6",
      sidebar: "#0d0105",
      sidebarForeground: "#fecdd3",
      sidebarBorder: "rgba(251, 113, 133, 0.15)",
    },
  },
  {
    id: "matcha-zen",
    name: "Matcha & Emerald",
    concept: "Tea House, Sushi & Organic Cuisine",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #03140c 0%, #072a1a 60%, #064e3b 100%)",
    accentDot: "#34d399",
    colors: {
      accent: "#34d399",
      accentForeground: "#03140c",
      background: "#03140c",
      foreground: "#ecfdf5",
      card: "#08291a",
      cardForeground: "#ecfdf5",
      border: "rgba(52, 211, 153, 0.2)",
      muted: "#051d12",
      mutedForeground: "#a7f3d0",
      sidebar: "#020f09",
      sidebarForeground: "#d1fae5",
      sidebarBorder: "rgba(52, 211, 153, 0.15)",
    },
  },
  {
    id: "truffle-gold",
    name: "Truffle & Gold",
    concept: "Michelin-Star, Fine Dining & Luxury Steakhouse",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #09090b 0%, #171510 60%, #302610 100%)",
    accentDot: "#eab308",
    colors: {
      accent: "#eab308",
      accentForeground: "#09090b",
      background: "#09090b",
      foreground: "#fefce8",
      card: "#181611",
      cardForeground: "#fefce8",
      border: "rgba(234, 179, 8, 0.24)",
      muted: "#14120e",
      mutedForeground: "#ca8a04",
      sidebar: "#070708",
      sidebarForeground: "#fef08a",
      sidebarBorder: "rgba(234, 179, 8, 0.18)",
    },
  },
  {
    id: "tokyo-neon",
    name: "Tokyo Neon",
    concept: "Izakaya, Late-Night Ramen & Street Dining",
    mode: "dark",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #090814 0%, #1a0b2e 60%, #3b0764 100%)",
    accentDot: "#f43f5e",
    colors: {
      accent: "#f43f5e",
      accentForeground: "#090814",
      background: "#090814",
      foreground: "#fff1f2",
      card: "#170b28",
      cardForeground: "#fff1f2",
      border: "rgba(244, 63, 94, 0.24)",
      muted: "#120720",
      mutedForeground: "#fda4af",
      sidebar: "#05040a",
      sidebarForeground: "#ffe4e6",
      sidebarBorder: "rgba(244, 63, 94, 0.18)",
    },
  },
  {
    id: "bourbon-cask",
    name: "Bourbon & Oak",
    concept: "Speakeasy, Craft Brewery & Gastropub",
    mode: "dark",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #0f0a06 0%, #1e1309 60%, #3a220d 100%)",
    accentDot: "#d97706",
    colors: {
      accent: "#d97706",
      accentForeground: "#0f0a06",
      background: "#0d0805",
      foreground: "#fef3c7",
      card: "#1c1209",
      cardForeground: "#fef3c7",
      border: "rgba(217, 119, 6, 0.24)",
      muted: "#150d06",
      mutedForeground: "#b45309",
      sidebar: "#080503",
      sidebarForeground: "#fde68a",
      sidebarBorder: "rgba(217, 119, 6, 0.18)",
    },
  },

  // ==================== LIGHT MOODS (Day Shift) ====================
  {
    id: "espresso-cream",
    name: "Espresso & Bakery",
    concept: "Artisan Café, Bakery & Patisserie",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #fefce8 0%, #fef3c7 60%, #fde68a 100%)",
    accentDot: "#b45309",
    colors: {
      accent: "#b45309",
      accentForeground: "#ffffff",
      background: "#faf8f5",
      foreground: "#3c1a05",
      card: "#ffffff",
      cardForeground: "#3c1a05",
      border: "#ede4d8",
      muted: "#f4eee4",
      mutedForeground: "#856046",
      sidebar: "#f4eee4",
      sidebarForeground: "#3c1a05",
      sidebarBorder: "#e5dac9",
    },
  },
  {
    id: "fresh-sky",
    name: "Sky & Coastal",
    concept: "Daytime Brunch, Breakfast & Seafood",
    mode: "light",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 60%, #bae6fd 100%)",
    accentDot: "#0284c7",
    colors: {
      accent: "#0284c7",
      accentForeground: "#ffffff",
      background: "#f8fafc",
      foreground: "#0f172a",
      card: "#ffffff",
      cardForeground: "#0f172a",
      border: "#e2e8f0",
      muted: "#f1f5f9",
      mutedForeground: "#64748b",
      sidebar: "#ffffff",
      sidebarForeground: "#0f172a",
      sidebarBorder: "#e2e8f0",
    },
  },
  {
    id: "tuscan-terracotta",
    name: "Tuscan Terracotta",
    concept: "Pizzeria, Trattoria & Pasta Bar",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 60%, #fed7aa 100%)",
    accentDot: "#ea580c",
    colors: {
      accent: "#ea580c",
      accentForeground: "#ffffff",
      background: "#faf6f0",
      foreground: "#431407",
      card: "#ffffff",
      cardForeground: "#431407",
      border: "#eddcd0",
      muted: "#f6ece4",
      mutedForeground: "#9a5538",
      sidebar: "#f5ece3",
      sidebarForeground: "#431407",
      sidebarBorder: "#e6d5c5",
    },
  },
  {
    id: "nordic-slate",
    name: "Nordic Minimalist",
    concept: "Salad Bar, Clean Bowls & Modern Deli",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 60%, #cbd5e1 100%)",
    accentDot: "#334155",
    colors: {
      accent: "#334155",
      accentForeground: "#ffffff",
      background: "#f1f5f9",
      foreground: "#0f172a",
      card: "#ffffff",
      cardForeground: "#0f172a",
      border: "#cbd5e1",
      muted: "#e2e8f0",
      mutedForeground: "#64748b",
      sidebar: "#ffffff",
      sidebarForeground: "#0f172a",
      sidebarBorder: "#e2e8f0",
    },
  },
  {
    id: "olive-grove",
    name: "Olive & Taverna",
    concept: "Mediterranean Taverna, Tapas & Mezze",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #f7fee7 0%, #ecfccb 60%, #d9f99d 100%)",
    accentDot: "#65a30d",
    colors: {
      accent: "#65a30d",
      accentForeground: "#ffffff",
      background: "#f9fbf4",
      foreground: "#1a2e05",
      card: "#ffffff",
      cardForeground: "#1a2e05",
      border: "#dce8cd",
      muted: "#eff5e7",
      mutedForeground: "#4d7c0f",
      sidebar: "#f3f8ec",
      sidebarForeground: "#1a2e05",
      sidebarBorder: "#d3e2be",
    },
  },
  {
    id: "berry-gelato",
    name: "Berry & Gelato",
    concept: "Dessert Parlour, Patisserie & Boba Tea",
    mode: "light",
    style: "gradient",
    previewGradient: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 60%, #fbcfe8 100%)",
    accentDot: "#db2777",
    colors: {
      accent: "#db2777",
      accentForeground: "#ffffff",
      background: "#fdf8fa",
      foreground: "#500724",
      card: "#ffffff",
      cardForeground: "#500724",
      border: "#f5d0e3",
      muted: "#fae8f2",
      mutedForeground: "#9d174d",
      sidebar: "#faf0f6",
      sidebarForeground: "#500724",
      sidebarBorder: "#f0c2dc",
    },
  },
  {
    id: "citrus-cantina",
    name: "Citrus & Cantina",
    concept: "Mexican Taqueria, Burrito & Ceviche Bar",
    mode: "light",
    style: "solid",
    previewGradient: "linear-gradient(135deg, #fefce8 0%, #fef9c3 60%, #fef08a 100%)",
    accentDot: "#ca8a04",
    colors: {
      accent: "#ca8a04",
      accentForeground: "#ffffff",
      background: "#fdfcf7",
      foreground: "#422006",
      card: "#ffffff",
      cardForeground: "#422006",
      border: "#fae8b4",
      muted: "#fcf6dc",
      mutedForeground: "#854d0e",
      sidebar: "#faf5dc",
      sidebarForeground: "#422006",
      sidebarBorder: "#f3dc9b",
    },
  },
];

export const DEFAULT_DARK_THEME_ID = "harbor-ocean";
export const DEFAULT_LIGHT_THEME_ID = "fresh-sky";

export function getThemePreset(id: string): RestaurantThemePreset {
  return RESTAURANT_THEMES.find((t) => t.id === id) ?? RESTAURANT_THEMES[0]!;
}

/**
 * Applies all CSS variables of the given theme preset into the document root.
 */
export function applyRestaurantTheme(preset: RestaurantThemePreset, styleOverride?: ThemeStyle) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const isDark = preset.mode === "dark";
  const activeStyle = styleOverride ?? preset.style;

  // Toggle .dark class on html
  root.classList.toggle("dark", isDark);

  // Set style attribute (gradient vs solid)
  root.setAttribute("data-theme-style", activeStyle);

  // Inject primary & surface colors
  root.style.setProperty("--primary", preset.colors.accent);
  root.style.setProperty("--primary-foreground", preset.colors.accentForeground);
  root.style.setProperty(
    "--primary-soft",
    `color-mix(in srgb, ${preset.colors.accent} 15%, transparent)`
  );

  root.style.setProperty("--background", preset.colors.background);
  root.style.setProperty("--foreground", preset.colors.foreground);

  root.style.setProperty("--card", preset.colors.card);
  root.style.setProperty("--card-foreground", preset.colors.cardForeground);

  root.style.setProperty("--popover", preset.colors.card);
  root.style.setProperty("--popover-foreground", preset.colors.cardForeground);

  root.style.setProperty("--border", preset.colors.border);
  root.style.setProperty("--input", preset.colors.border);

  root.style.setProperty("--muted", preset.colors.muted);
  root.style.setProperty("--muted-foreground", preset.colors.mutedForeground);

  root.style.setProperty("--sidebar", preset.colors.sidebar);
  root.style.setProperty("--sidebar-foreground", preset.colors.sidebarForeground);
  root.style.setProperty("--sidebar-border", preset.colors.sidebarBorder);
  root.style.setProperty("--sidebar-primary", preset.colors.accent);
  root.style.setProperty("--sidebar-accent", preset.colors.muted);
}
