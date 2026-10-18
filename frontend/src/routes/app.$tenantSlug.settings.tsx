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
      { name: "description", content: "Configure restaurant branding, theme colors, taxes, and third-party integrations." },
    ],
  }),
  component: () => (
    <RequirePermission perm="settings.manage">
      <SettingsPage />
    </RequirePermission>
  ),
});

const ACCENT_PRESETS = [
  { name: "Saffron Amber", value: "oklch(0.62 0.17 42)" },
  { name: "Harbor Ocean", value: "oklch(0.55 0.11 205)" },
  { name: "Café Emerald", value: "oklch(0.52 0.12 150)" },
  { name: "Royal Purple", value: "oklch(0.58 0.18 290)" },
  { name: "Crimson Rose", value: "oklch(0.57 0.20 25)" },
  { name: "Modern Slate", value: "oklch(0.48 0.05 240)" },
];

function SettingsPage() {
  const { tenant } = useTenant();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();
  const { data: integrations = [], isLoading: loadingIntegrations } = useIntegrationsQuery(tenant.id);
  const [toggleIntegration, { isLoading: toggling }] = useToggleIntegrationMutation();

  // Settings form state
  const [name, setName] = useState(tenant.name);
  const [tagline, setTagline] = useState(tenant.tagline ?? "");
  const [initials, setInitials] = useState(tenant.initials ?? "");
  const [accent, setAccent] = useState(tenant.accent ?? "oklch(0.62 0.17 42)");
  const [currency, setCurrency] = useState(tenant.currency);
  const [locale, setLocale] = useState(tenant.locale);
  const [taxRate, setTaxRate] = useState((tenant.taxRate * 100).toString());
  const [serviceChargeRate, setServiceChargeRate] = useState((tenant.serviceChargeRate * 100).toString());
  const [receiptFooter, setReceiptFooter] = useState(tenant.receiptFooter ?? "");

  // Configure modal for integration
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

  useEffect(() => {
    setName(tenant.name);
    setTagline(tenant.tagline ?? "");
    setInitials(tenant.initials ?? "");
    setAccent(tenant.accent ?? "oklch(0.62 0.17 42)");
    setCurrency(tenant.currency);
    setLocale(tenant.locale);
    setTaxRate((tenant.taxRate * 100).toString());
    setServiceChargeRate((tenant.serviceChargeRate * 100).toString());
    setReceiptFooter(tenant.receiptFooter ?? "");
  }, [tenant]);

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
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
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

            <Card>
              <CardHeader>
                <CardTitle>Brand Theme Color</CardTitle>
                <CardDescription>
                  Customizes the primary accent color across all buttons, highlights, badges, and headers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Color Presets</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ACCENT_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => setAccent(preset.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all ${
                          accent === preset.value
                            ? "border-foreground ring-2 ring-primary/40 bg-accent/40 font-semibold"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <span
                          className="size-5 rounded-full border shadow-sm shrink-0"
                          style={{ backgroundColor: preset.value }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-accent">Custom Accent Code (CSS Color / OKLCH / Hex)</Label>
                  <div className="flex gap-3 items-center">
                    <div
                      className="size-10 rounded-md border shadow-sm shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                    <Input
                      id="custom-accent"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

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
