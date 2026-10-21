import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Building2,
  Check,
  CreditCard,
  DollarSign,
  Palette,
  Percent,
  Receipt,
  Save,
  Sliders,
  Sparkles,
  Zap,
} from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useIntegrationsQuery, useToggleIntegrationMutation, useUpdateSettingsMutation } from "@/features/stage4/api";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  RESTAURANT_THEMES,
  type RestaurantThemePreset,
  getThemePreset,
  applyRestaurantTheme,
} from "@/features/theme/restaurant-themes";
import { RestaurantThemeModal } from "@/features/theme/restaurant-theme-modal";
import { setThemePreset } from "@/features/ui/ui.slice";
import { PageHeader, SkeletonCard } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Integration } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Branding — Tablewise POS" },
      { name: "description", content: "Configure restaurant branding, theme atmosphere, taxes, and third-party integrations." },
    ],
  }),
  component: () => (
    <RequirePermission perm="settings.manage">
      <SettingsPage />
    </RequirePermission>
  ),
});

function SettingsPage() {
  const { tenant } = useTenant();
  const dispatch = useAppDispatch();
  const themePresetId = useAppSelector((s) => s.ui.themePresetId);
  const themeStyle = useAppSelector((s) => s.ui.themeStyle);
  const activePreset = getThemePreset(themePresetId);

  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();
  const { data: integrations = [], isLoading: loadingIntegrations } = useIntegrationsQuery(tenant.id);
  const [toggleIntegration, { isLoading: toggling }] = useToggleIntegrationMutation();

  // Settings form state
  const [name, setName] = useState(tenant.name);
  const [tagline, setTagline] = useState(tenant.tagline ?? "");
  const [initials, setInitials] = useState(tenant.initials ?? "");
  const [accent, setAccent] = useState(tenant.accent ?? activePreset.colors.accent);
  const [currency, setCurrency] = useState(tenant.currency);
  const [locale, setLocale] = useState(tenant.locale);
  const [taxRate, setTaxRate] = useState((tenant.taxRate * 100).toString());
  const [serviceChargeRate, setServiceChargeRate] = useState((tenant.serviceChargeRate * 100).toString());
  const [receiptFooter, setReceiptFooter] = useState(tenant.receiptFooter ?? "");

  // Configure modal for theme & integration
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

  useEffect(() => {
    setName(tenant.name);
    setTagline(tenant.tagline ?? "");
    setInitials(tenant.initials ?? "");
    setAccent(tenant.accent ?? activePreset.colors.accent);
    setCurrency(tenant.currency);
    setLocale(tenant.locale);
    setTaxRate((tenant.taxRate * 100).toString());
    setServiceChargeRate((tenant.serviceChargeRate * 100).toString());
    setReceiptFooter(tenant.receiptFooter ?? "");
  }, [tenant]);

  const handleSelectPreset = (preset: RestaurantThemePreset) => {
    dispatch(setThemePreset(preset.id));
    setAccent(preset.colors.accent);
    applyRestaurantTheme(preset, preset.style);
    toast.success(`Switched ambience to ${preset.name}`);
  };

  const handleThemeModalSaved = (preset: RestaurantThemePreset) => {
    setAccent(preset.colors.accent);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedTax = parseFloat(taxRate) / 100 || 0;
      const parsedService = parseFloat(serviceChargeRate) / 100 || 0;

      await updateSettings({
        tenantId: tenant.id,
        name,
        tagline,
        initials,
        accent,
        currency,
        locale,
        taxRate: parsedTax,
        serviceChargeRate: parsedService,
        receiptFooter,
      }).unwrap();

      // Instantly update live CSS variable for live feedback
      document.documentElement.style.setProperty("--primary", accent);
      toast.success("Restaurant settings updated successfully.");
    } catch {
      toast.error("Failed to update settings.");
    }
  };

  const handleToggle = async (item: Integration, enabled: boolean) => {
    try {
      await toggleIntegration({
        tenantId: tenant.id,
        integrationId: item.id,
        enabled,
      }).unwrap();
      toast.success(`${item.name} is now ${enabled ? "connected" : "disconnected"}.`);
    } catch {
      toast.error("Failed to update integration status.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Branding"
        description="Customize your restaurant identity, receipt styling, tax rates, and connect external services."
      />

      <form onSubmit={handleSave}>
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="size-4" /> Identity & Theme
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <Percent className="size-4" /> Taxes & Receipts
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Zap className="size-4" /> Integrations
            </TabsTrigger>
          </TabsList>

          {/* ==================== TAB 1: BRANDING & THEME ==================== */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Identity</CardTitle>
                <CardDescription>Brand name, initials, and tagline displayed on receipts and screens.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tenant-name">Restaurant Name</Label>
                    <Input id="tenant-name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-initials">Initials / Badge</Label>
                    <Input
                      id="tenant-initials"
                      value={initials}
                      onChange={(e) => setInitials(e.target.value)}
                      maxLength={4}
                      className="font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant-tagline">Tagline or Concept</Label>
                  <Input
                    id="tenant-tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Specialty coffee & artisanal bakery"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Restaurant Ambience & Theme Studio</CardTitle>
                    <Badge variant="secondary" className="font-mono text-xs">POS Curated</Badge>
                  </div>
                  <CardDescription className="mt-1">
                    Harmonized atmospheric palettes designed specifically for restaurant concepts, dining rooms, and service shifts.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={() => setThemeModalOpen(true)}
                  className="gap-2 shrink-0 self-start sm:self-auto shadow-sm"
                >
                  <Palette className="size-4" /> Open Theme Studio
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Active Concept Banner */}
                <div
                  className="rounded-xl border p-4.5 transition-all relative overflow-hidden"
                  style={{
                    background:
                      themeStyle === "gradient"
                        ? activePreset.previewGradient
                        : activePreset.colors.card,
                    borderColor: activePreset.colors.border,
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3.5 rounded-full shadow-sm ring-2 ring-black/30 shrink-0"
                          style={{ backgroundColor: activePreset.accentDot }}
                        />
                        <h4
                          className="font-bold text-base tracking-tight"
                          style={{ color: activePreset.colors.foreground }}
                        >
                          {activePreset.name}
                        </h4>
                        <Badge
                          variant="outline"
                          className="text-[11px] font-semibold uppercase px-2 py-0.5 border"
                          style={{
                            borderColor: activePreset.colors.border,
                            color: activePreset.colors.foreground,
                            backgroundColor: "rgba(0, 0, 0, 0.2)",
                          }}
                        >
                          {activePreset.mode === "dark" ? "Night Shift" : "Day Shift"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[11px] font-semibold uppercase px-2 py-0.5 border"
                          style={{
                            borderColor: activePreset.colors.border,
                            color: activePreset.colors.foreground,
                            backgroundColor: "rgba(0, 0, 0, 0.2)",
                          }}
                        >
                          {themeStyle === "gradient" ? "Gradient Ambient" : "Solid High-Contrast"}
                        </Badge>
                      </div>
                      <p
                        className="text-xs max-w-lg"
                        style={{ color: activePreset.colors.mutedForeground }}
                      >
                        {activePreset.concept}
                      </p>
                    </div>

                    {/* Active colors swatch strip */}
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.25)",
                          borderColor: activePreset.colors.border,
                          color: activePreset.colors.foreground,
                        }}
                      >
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: activePreset.colors.accent }}
                        />
                        <span className="font-mono text-[11px]">Primary</span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.25)",
                          borderColor: activePreset.colors.border,
                          color: activePreset.colors.foreground,
                        }}
                      >
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: activePreset.colors.background }}
                        />
                        <span className="font-mono text-[11px]">Canvas</span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.25)",
                          borderColor: activePreset.colors.border,
                          color: activePreset.colors.foreground,
                        }}
                      >
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: activePreset.colors.card }}
                        />
                        <span className="font-mono text-[11px]">Cards</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restaurant Presets Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      Curated Restaurant Atmospheres ({activePreset.mode === "dark" ? "Night Shift" : "Day Shift"})
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      Click any concept to instantly adapt the POS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {RESTAURANT_THEMES.filter((p) => p.mode === activePreset.mode).map((preset) => {
                      const isSelected = preset.id === activePreset.id;
                      return (
                        <button
                          type="button"
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`flex flex-col gap-2 p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm font-semibold"
                              : "border-border/70 hover:bg-muted/40 hover:border-border"
                          }`}
                        >
                          <div
                            className="w-full h-8 rounded-lg relative overflow-hidden flex items-center justify-between px-2.5 shadow-inner"
                            style={{ background: preset.previewGradient }}
                          >
                            {isSelected ? (
                              <div className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                <Check className="size-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div />
                            )}
                            <span
                              className="size-3 rounded-full shadow-sm ring-2 ring-black/20 shrink-0"
                              style={{ backgroundColor: preset.accentDot }}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{preset.name}</div>
                            <div className="truncate text-[11px] text-muted-foreground">{preset.concept}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <RestaurantThemeModal
              open={themeModalOpen}
              onOpenChange={setThemeModalOpen}
              onSaved={handleThemeModalSaved}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="size-4" /> {saving ? "Saving Changes..." : "Save Identity Settings"}
              </Button>
            </div>
          </TabsContent>

          {/* ==================== TAB 2: TAXES & RECEIPTS ==================== */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Currency & Regional Localization</CardTitle>
                <CardDescription>Used for price formatting, receipt generation, and reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency Code</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($ - US Dollar)</SelectItem>
                        <SelectItem value="BDT">BDT (৳ - Bangladeshi Taka)</SelectItem>
                        <SelectItem value="EUR">EUR (€ - Euro)</SelectItem>
                        <SelectItem value="GBP">GBP (£ - British Pound)</SelectItem>
                        <SelectItem value="CAD">CAD ($ - Canadian Dollar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locale">Locale Formatting</Label>
                    <Select value={locale} onValueChange={setLocale}>
                      <SelectTrigger id="locale">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">en-US (United States)</SelectItem>
                        <SelectItem value="en-BD">en-BD (Bangladesh)</SelectItem>
                        <SelectItem value="de-DE">de-DE (Germany)</SelectItem>
                        <SelectItem value="en-GB">en-GB (United Kingdom)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rates & Fees</CardTitle>
                <CardDescription>Applied automatically to order subtotals during checkout.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Value Added Tax (VAT / Sales Tax %)</Label>
                    <div className="relative">
                      <Input
                        id="tax-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service-charge">Service Charge (% of subtotal)</Label>
                    <div className="relative">
                      <Input
                        id="service-charge"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={serviceChargeRate}
                        onChange={(e) => setServiceChargeRate(e.target.value)}
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Printed Thermal Receipt Footer</CardTitle>
                <CardDescription>Closing message printed at the bottom of customer receipts.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="receipt-footer">Footer Message</Label>
                  <Textarea
                    id="receipt-footer"
                    rows={3}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="e.g. Thank you for dining with us! Follow us on Instagram @ourrestaurant"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="size-4" /> {saving ? "Saving Changes..." : "Save Billing Settings"}
              </Button>
            </div>
          </TabsContent>

          {/* ==================== TAB 3: INTEGRATIONS ==================== */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Simulated Third-Party Integrations</h3>
              <p className="text-sm text-muted-foreground">
                Connect external payment terminals, food delivery aggregators, accounting software, and SMS gateways.
              </p>
            </div>

            {loadingIntegrations ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {integrations.map((item) => (
                  <Card key={item.id} className="flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {item.name}
                          </CardTitle>
                          <Badge variant="outline" className="capitalize text-xs">
                            {item.category}
                          </Badge>
                        </div>
                        <Switch
                          checked={item.enabled}
                          disabled={toggling}
                          onCheckedChange={(val) => handleToggle(item, val)}
                        />
                      </div>
                      <CardDescription className="pt-2 text-xs leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </CardHeader>

                    <CardFooter className="pt-0 flex items-center justify-between border-t py-3 bg-muted/20 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            item.status === "connected" ? "bg-emerald-500" : "bg-muted-foreground"
                          }`}
                        />
                        <span className="capitalize text-muted-foreground">{item.status}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingIntegration(item)}
                        className="h-7 text-xs"
                      >
                        Configure
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </form>

      {/* Integration Config Dialog */}
      {editingIntegration && (
        <Dialog open={!!editingIntegration} onOpenChange={() => setEditingIntegration(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configure {editingIntegration.name}</DialogTitle>
              <DialogDescription>
                API credentials and webhook parameters for {editingIntegration.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {Object.entries(editingIntegration.config ?? {}).map(([key, val]) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key} className="capitalize text-xs font-mono">
                    {key.replace(/([A-Z])/g, " $1")}
                  </Label>
                  <Input
                    id={key}
                    defaultValue={val}
                    onChange={(e) => {
                      editingIntegration.config = {
                        ...(editingIntegration.config ?? {}),
                        [key]: e.target.value,
                      };
                    }}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingIntegration(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await toggleIntegration({
                      tenantId: tenant.id,
                      integrationId: editingIntegration.id,
                      enabled: editingIntegration.enabled,
                      config: editingIntegration.config,
                    }).unwrap();
                    toast.success("Integration settings saved.");
                    setEditingIntegration(null);
                  } catch {
                    toast.error("Failed to save integration settings.");
                  }
                }}
              >
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
