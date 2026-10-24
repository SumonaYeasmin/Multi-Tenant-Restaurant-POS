import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import {
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  Crown,
  Gift,
  HelpCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import { PageHeader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/app/$tenantSlug/customers")({
  head: () => ({
    meta: [
      { title: "Customers & Loyalty Program — Tablewise POS" },
      {
        name: "description",
        content:
          "Manage guest profiles, tier hierarchy, reward rules, and point balances.",
      },
    ],
  }),
  component: () => (
    <RequirePermission perm="customers.manage">
      <CustomersAndLoyaltyPage />
    </RequirePermission>
  ),
});

// ==========================================
// TYPES & MOCK DATA
// ==========================================

interface UICustomer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  points: number;
  totalSpent: number;
  visits: number;
  tierId: string;
  tierName: string;
  tierColor: string;
  notes?: string;
  lastVisitAt: string;
  ledger: {
    id: string;
    points: number;
    type: "EARNED" | "REDEEMED" | "ADJUSTED";
    reason: string;
    at: string;
    orderNumber?: string;
  }[];
}

interface UILoyaltyTier {
  id: string;
  name: string;
  minSpend: number;
  minPoints: number;
  pointMultiplier: number;
  discountPercent: number;
  description: string;
  color: string;
  membersCount: number;
  isActive: boolean;
  sortOrder: number;
}

const INITIAL_TIERS: UILoyaltyTier[] = [
  {
    id: "tier-bronze",
    name: "Bronze Member",
    minSpend: 0,
    minPoints: 0,
    pointMultiplier: 1.0,
    discountPercent: 0,
    description: "Welcome tier for all registered guests. Earn 1x points on every order.",
    color: "#B45309",
    membersCount: 840,
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "tier-silver",
    name: "Silver Elite",
    minSpend: 5000,
    minPoints: 50,
    pointMultiplier: 1.25,
    discountPercent: 3.0,
    description: "Guests who spend ৳5,000+ earn 1.25x points and enjoy 3% flat discount.",
    color: "#64748B",
    membersCount: 320,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "tier-gold",
    name: "Gold VIP",
    minSpend: 15000,
    minPoints: 150,
    pointMultiplier: 1.5,
    discountPercent: 5.0,
    description: "Frequent diners get 1.5x points, priority reservations, and 5% discount.",
    color: "#D97706",
    membersCount: 145,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "tier-platinum",
    name: "Platinum Royal",
    minSpend: 35000,
    minPoints: 350,
    pointMultiplier: 2.0,
    discountPercent: 10.0,
    description: "Our top tier diners. Double points on all orders plus 10% lifetime discount.",
    color: "#7C3AED",
    membersCount: 42,
    isActive: true,
    sortOrder: 3,
  },
];

const INITIAL_CUSTOMERS: UICustomer[] = [
  {
    id: "cust-1",
    name: "Tanvir Ahmed",
    phone: "+8801712345678",
    address: "House 14, Road 7, Dhanmondi, Dhaka",
    points: 240,
    totalSpent: 18500,
    visits: 14,
    tierId: "tier-gold",
    tierName: "Gold VIP",
    tierColor: "#D97706",
    notes: "Prefers corner table, likes extra spicy platters.",
    lastVisitAt: "2026-10-22T19:30:00.000Z",
    ledger: [
      { id: "tx-1", points: 45, type: "EARNED", reason: "Order #1042 Dining", at: "2026-10-22T19:30:00.000Z", orderNumber: "#1042" },
      { id: "tx-2", points: -50, type: "REDEEMED", reason: "Points Redeemed at Checkout", at: "2026-10-15T20:15:00.000Z", orderNumber: "#1028" },
      { id: "tx-3", points: 30, type: "EARNED", reason: "Order #1010 Dining", at: "2026-10-08T18:40:00.000Z", orderNumber: "#1010" },
      { id: "tx-4", points: 50, type: "ADJUSTED", reason: "Welcome Loyalty Bonus", at: "2026-09-01T12:00:00.000Z" },
    ],
  },
  {
    id: "cust-2",
    name: "Nusrat Jahan",
    phone: "+8801819876543",
    address: "Gulshan-2, Dhaka",
    points: 95,
    totalSpent: 8200,
    visits: 6,
    tierId: "tier-silver",
    tierName: "Silver Elite",
    tierColor: "#64748B",
    notes: "Vegetarian guest, allergic to peanuts.",
    lastVisitAt: "2026-10-23T14:15:00.000Z",
    ledger: [
      { id: "tx-5", points: 25, type: "EARNED", reason: "Order #1050 Takeaway", at: "2026-10-23T14:15:00.000Z", orderNumber: "#1050" },
      { id: "tx-6", points: 70, type: "EARNED", reason: "Order #1019 Family Dinner", at: "2026-10-11T21:00:00.000Z", orderNumber: "#1019" },
    ],
  },
  {
    id: "cust-3",
    name: "Mahmudul Hasan",
    phone: "+8801911223344",
    address: "Uttara Sector 3, Dhaka",
    points: 420,
    totalSpent: 42000,
    visits: 28,
    tierId: "tier-platinum",
    tierName: "Platinum Royal",
    tierColor: "#7C3AED",
    notes: "Corporate accounts, regular hosting.",
    lastVisitAt: "2026-10-24T08:45:00.000Z",
    ledger: [
      { id: "tx-7", points: 120, type: "EARNED", reason: "Order #1061 Executive Lunch", at: "2026-10-24T08:45:00.000Z", orderNumber: "#1061" },
      { id: "tx-8", points: -100, type: "REDEEMED", reason: "Discount redemption", at: "2026-10-18T13:20:00.000Z", orderNumber: "#1034" },
    ],
  },
  {
    id: "cust-4",
    name: "Farhan Kabir",
    phone: "+8801677889900",
    points: 15,
    totalSpent: 1650,
    visits: 2,
    tierId: "tier-bronze",
    tierName: "Bronze Member",
    tierColor: "#B45309",
    lastVisitAt: "2026-10-20T20:10:00.000Z",
    ledger: [
      { id: "tx-9", points: 15, type: "EARNED", reason: "Order #1039 Dinner", at: "2026-10-20T20:10:00.000Z", orderNumber: "#1039" },
    ],
  },
];

function CustomersAndLoyaltyPage() {
  const { tenant } = useTenant();
  const money = useMoney();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<"customers" | "tiers" | "settings">("customers");

  // State collections
  const [customers, setCustomers] = useState<UICustomer[]>(INITIAL_CUSTOMERS);
  const [tiers, setTiers] = useState<UILoyaltyTier[]>(INITIAL_TIERS);

  // Loyalty Settings State
  const [settings, setSettings] = useState({
    isEnabled: true,
    spendAmountPerPoint: 100,
    pointValue: 1.0,
    minPointsToRedeem: 20,
    maxPointsPerOrder: 500,
    expireAfterDays: 365,
  });

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");

  // Modals & Drawers
  const [selectedCustomer, setSelectedCustomer] = useState<UICustomer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<UICustomer | null>(null);

  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<UILoyaltyTier | null>(null);

  // Fast Point Adjustment State in Drawer
  const [adjustPts, setAdjustPts] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      c.phone.includes(searchQuery.trim());
    const matchesTier = tierFilter === "ALL" || c.tierId === tierFilter;
    return matchesSearch && matchesTier;
  });

  // Calculate high-level KPIs
  const totalPointsInCirculation = customers.reduce((sum, c) => sum + c.points, 0);
  const totalValueInCurrency = totalPointsInCirculation * settings.pointValue;
  const totalLifetimeSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  // Handle Quick Point Adjustment
  const handlePointAdjustment = (customer: UICustomer, isAdd: boolean) => {
    const pointsNum = parseInt(adjustPts, 10);
    if (!pointsNum || pointsNum <= 0) {
      toast.error("Please enter a valid positive points number");
      return;
    }
    if (!isAdd && customer.points < pointsNum) {
      toast.error(`Customer only has ${customer.points} points`);
      return;
    }

    const signedPoints = isAdd ? pointsNum : -pointsNum;
    const newPoints = customer.points + signedPoints;

    const newLedgerItem = {
      id: `tx-${Date.now()}`,
      points: signedPoints,
      type: (isAdd ? "ADJUSTED" : "REDEEMED") as "ADJUSTED" | "REDEEMED",
      reason: adjustReason.trim() || (isAdd ? "Manual Bonus by Manager" : "Manual Redemption"),
      at: new Date().toISOString(),
    };

    const updatedCustomer = {
      ...customer,
      points: newPoints,
      ledger: [newLedgerItem, ...customer.ledger],
    };

    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? updatedCustomer : c)));
    setSelectedCustomer(updatedCustomer);
    setAdjustPts("");
    setAdjustReason("");

    toast.success(
      isAdd
        ? `Added +${pointsNum} points to ${customer.name}`
        : `Redeemed -${pointsNum} points for ${customer.name}`,
    );
  };

  // Handle Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Loyalty program settings updated successfully!", {
      description: `Guests earn 1 pt per ${money(settings.spendAmountPerPoint)} spent. Redemption value: ${money(settings.pointValue)}/pt.`,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER                                                            */}
      {/* ========================================================================= */}
      <PageHeader
        title="Customers & Loyalty Program"
        description="Grow repeat visits with automated loyalty tiers, point earnings, and guest relationship management."
        actions={
          <div className="flex items-center gap-2">
            {activeTab === "customers" && (
              <Button
                onClick={() => {
                  setEditingCustomer(null);
                  setIsCustomerModalOpen(true);
                }}
                className="gap-2 shadow-sm"
              >
                <Plus className="size-4" /> Add Customer
              </Button>
            )}
            {activeTab === "tiers" && (
              <Button
                onClick={() => {
                  setEditingTier(null);
                  setIsTierModalOpen(true);
                }}
                className="gap-2 shadow-sm"
              >
                <Plus className="size-4" /> Create New Tier
              </Button>
            )}
            {activeTab === "settings" && (
              <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="size-3.5" /> Program Active
              </Badge>
            )}
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 2. STATS KPI CARDS                                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Registered Guests</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1">{customers.length + 1340}</h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <TrendingUp className="size-3" /> +18 this week
              </p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Tiers</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1">{tiers.length} Tiers</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                From Bronze to Platinum
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Crown className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Points in Balance</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 tabular-nums">
                {totalPointsInCirculation.toLocaleString()} pts
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Value: {money(totalValueInCurrency)}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Coins className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Guest Spend</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1">
                {money(totalLifetimeSpent + 142000)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <Sparkles className="size-3" /> High loyalty retention
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Wallet className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABS CONTAINER                                                         */}
      {/* ========================================================================= */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "customers" | "tiers" | "settings")}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
          <TabsList className="bg-muted/80 p-1 rounded-lg">
            <TabsTrigger value="customers" className="gap-2 px-4 py-2 text-sm">
              <Users className="size-4" />
              <span>Guests & Customers</span>
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 h-5">
                {filteredCustomers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tiers" className="gap-2 px-4 py-2 text-sm">
              <Crown className="size-4 text-amber-500" />
              <span>Loyalty Tiers</span>
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 h-5">
                {tiers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 px-4 py-2 text-sm">
              <Sliders className="size-4" />
              <span>Point Rules & Settings</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === "customers" && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <HelpCircle className="size-3.5" />
              Click any guest row to view their points history & redeem rewards.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: GUESTS & CUSTOMERS TABLE                                           */}
        {/* ========================================================================= */}
        <TabsContent value="customers" className="space-y-4 m-0 focus-visible:outline-none">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search guest by name or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-background"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Tier:</span>
              <Button
                variant={tierFilter === "ALL" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTierFilter("ALL")}
                className="text-xs h-8"
              >
                All
              </Button>
              {tiers.map((t) => (
                <Button
                  key={t.id}
                  variant={tierFilter === t.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTierFilter(t.id)}
                  className="text-xs h-8 flex items-center gap-1.5"
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Customers Data Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Guest Profile</th>
                    <th className="px-4 py-3">Phone Number</th>
                    <th className="px-4 py-3 text-center">Membership Tier</th>
                    <th className="px-4 py-3 text-right">Points Balance</th>
                    <th className="px-4 py-3 text-right">Total Spent</th>
                    <th className="px-4 py-3 text-right">Visits</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <Users className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="font-medium">No customers found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Try searching with a different name or phone number.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors group"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs ring-2 ring-primary/20">
                              {c.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                {c.name}
                              </p>
                              {c.address ? (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {c.address}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">No address</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-foreground/90 font-medium">
                          {c.phone}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <Badge
                            variant="outline"
                            className="font-medium text-xs border"
                            style={{
                              borderColor: `${c.tierColor}40`,
                              backgroundColor: `${c.tierColor}15`,
                              color: c.tierColor,
                            }}
                          >
                            <Crown className="size-3 mr-1" />
                            {c.tierName}
                          </Badge>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className="font-bold text-base text-foreground tabular-nums">{c.points}</span>
                          <span className="text-xs text-muted-foreground ml-1">pts</span>
                          <p className="text-[11px] text-emerald-600 font-medium">
                            ≈ {money(c.points * settings.pointValue)}
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-right font-medium">
                          {money(c.totalSpent)}
                        </td>

                        <td className="px-4 py-3.5 text-right text-muted-foreground">
                          {c.visits} visits
                        </td>

                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCustomer(c);
                                setIsCustomerModalOpen(true);
                              }}
                              className="size-8 p-0"
                              title="Edit Customer"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedCustomer(c)}
                              className="size-8 p-0 text-muted-foreground group-hover:text-primary"
                              title="View History"
                            >
                              <ChevronRight className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: LOYALTY TIERS GRID                                                 */}
        {/* ========================================================================= */}
        <TabsContent value="tiers" className="space-y-6 m-0 focus-visible:outline-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30 p-4 rounded-xl border">
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Crown className="size-5 text-amber-500" />
                Membership Tier Hierarchy
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Guests automatically advance tiers when their lifetime spending or points meet the threshold.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingTier(null);
                setIsTierModalOpen(true);
              }}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="size-4" /> Add New Tier
            </Button>
          </div>

          {/* Tier Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <Card
                key={tier.id}
                className="relative overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Accent top stripe */}
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: tier.color }}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="font-bold text-xs"
                      style={{
                        borderColor: `${tier.color}40`,
                        backgroundColor: `${tier.color}15`,
                        color: tier.color,
                      }}
                    >
                      <Crown className="size-3 mr-1" />
                      Level {tier.sortOrder + 1}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => {
                          setEditingTier(tier);
                          setIsTierModalOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <CardTitle className="text-lg font-bold mt-2">{tier.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  {/* Threshold Metric */}
                  <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      Qualification Threshold
                    </p>
                    <p className="text-base font-bold text-foreground">
                      {tier.minSpend === 0 ? "Entry Free (৳0)" : `${money(tier.minSpend)} spend`}
                    </p>
                    {tier.minPoints > 0 && (
                      <p className="text-xs text-muted-foreground">or {tier.minPoints} lifetime points</p>
                    )}
                  </div>

                  {/* Benefits Grid */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-md bg-muted/20 border">
                      <p className="text-[10px] text-muted-foreground">Earn Multiplier</p>
                      <p className="text-base font-bold text-primary">
                        {tier.pointMultiplier}x
                      </p>
                    </div>
                    <div className="p-2 rounded-md bg-muted/20 border">
                      <p className="text-[10px] text-muted-foreground">Order Discount</p>
                      <p className="text-base font-bold text-emerald-600">
                        {tier.discountPercent > 0 ? `${tier.discountPercent}%` : "0%"}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="size-3.5 text-muted-foreground" />
                    {tier.membersCount} Members
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {tier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: LOYALTY SETTINGS & POLICY FORM                                     */}
        {/* ========================================================================= */}
        <TabsContent value="settings" className="space-y-6 m-0 focus-visible:outline-none max-w-4xl">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Master Switch Card */}
            <Card className="border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="program-active" className="text-base font-semibold">
                    Enable Loyalty Program
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When active, guests earn reward points on eligible paid dine-in and delivery orders.
                  </p>
                </div>
                <Switch
                  id="program-active"
                  checked={settings.isEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, isEnabled: checked })}
                />
              </CardContent>
            </Card>

            {/* Core Earning & Redemption Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Coins className="size-4 text-amber-500" />
                    Point Earning Rules
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define how much money a guest must spend to accumulate points.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="spend-per-point">Spend Amount per 1 Point (৳)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                        ৳
                      </span>
                      <Input
                        id="spend-per-point"
                        type="number"
                        min={1}
                        className="pl-8"
                        value={settings.spendAmountPerPoint}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            spendAmountPerPoint: Number(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      e.g., At ৳100 per point, a ৳1,500 bill awards 15 points.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Gift className="size-4 text-emerald-500" />
                    Point Redemption Rules
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Specify the conversion value when customers redeem points on bill.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="point-value">Value of 1 Point in Currency (৳)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                        ৳
                      </span>
                      <Input
                        id="point-value"
                        type="number"
                        step="0.1"
                        min={0.1}
                        className="pl-8"
                        value={settings.pointValue}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            pointValue: Number(e.target.value) || 0.1,
                          })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      e.g., At ৳1.00 per point, 50 points give ৳50 bill discount.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Threshold & Expiry Constraints */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  Limits & Validity Restrictions
                </CardTitle>
                <CardDescription className="text-xs">
                  Guardrails to prevent abuse and manage loyalty liabilities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-redeem">Minimum Points to Redeem</Label>
                    <Input
                      id="min-redeem"
                      type="number"
                      min={0}
                      value={settings.minPointsToRedeem}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          minPointsToRedeem: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Guest must reach this threshold before redeeming.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-order">Max Points per Order</Label>
                    <Input
                      id="max-order"
                      type="number"
                      min={1}
                      value={settings.maxPointsPerOrder}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maxPointsPerOrder: Number(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Caps maximum discount allowable per invoice.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry-days">Expiry Duration (Days)</Label>
                    <Input
                      id="expiry-days"
                      type="number"
                      min={30}
                      value={settings.expireAfterDays}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          expireAfterDays: Number(e.target.value) || 365,
                        })
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Points expire if unused within this duration.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t flex justify-end py-3">
                <Button type="submit" className="gap-2">
                  <Check className="size-4" /> Save Loyalty Settings
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* 4. CUSTOMER DETAIL SHEET / DRAWER (SPACIOUS, NO OVERFLOW, POLISHED UI)    */}
      {/* ========================================================================= */}
      <Sheet open={!!selectedCustomer} onOpenChange={(o) => !o && setSelectedCustomer(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 overflow-hidden flex flex-col bg-background">
          {selectedCustomer && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header with Background Gradient */}
              <div className="p-6 pb-4 border-b bg-gradient-to-br from-muted/50 to-muted/20">
                <div className="flex items-start justify-between gap-3 pr-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm"
                      style={{
                        backgroundColor: `${selectedCustomer.tierColor}20`,
                        color: selectedCustomer.tierColor,
                        border: `1.5px solid ${selectedCustomer.tierColor}40`,
                      }}
                    >
                      {selectedCustomer.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">
                          {selectedCustomer.name}
                        </h2>
                        <Badge
                          variant="outline"
                          className="text-[11px] font-bold px-2 py-0.5"
                          style={{
                            borderColor: `${selectedCustomer.tierColor}50`,
                            backgroundColor: `${selectedCustomer.tierColor}15`,
                            color: selectedCustomer.tierColor,
                          }}
                        >
                          <Crown className="size-3 mr-1" />
                          {selectedCustomer.tierName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {selectedCustomer.phone}
                        {selectedCustomer.address && ` • ${selectedCustomer.address}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2-Column Wide Metric Cards (No text clipping, no overflow) */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3.5 rounded-xl bg-card border shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Points Balance</span>
                      <Coins className="size-3.5 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black tracking-tight text-primary tabular-nums">
                        {selectedCustomer.points}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">pts</span>
                    </div>
                    <Badge variant="secondary" className="text-[11px] font-medium text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/10 border-0">
                      ≈ {money(selectedCustomer.points * settings.pointValue)} value
                    </Badge>
                  </div>

                  <div className="p-3.5 rounded-xl bg-card border shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Lifetime Spend</span>
                      <Wallet className="size-3.5 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold tracking-tight text-foreground truncate">
                      {money(selectedCustomer.totalSpent)}
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      {selectedCustomer.visits} total visits recorded
                    </span>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {selectedCustomer.notes && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                    <span className="font-semibold block mb-0.5">Guest Notes:</span>
                    {selectedCustomer.notes}
                  </div>
                )}

                {/* Quick Point Adjustment Card */}
                <Card className="border shadow-xs">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Award className="size-4 text-primary" />
                      Adjust or Redeem Points
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Manually reward points or deduct redeemed points for this guest.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="adj-pts" className="text-xs">
                          Points
                        </Label>
                        <Input
                          id="adj-pts"
                          type="number"
                          placeholder="e.g. 50"
                          value={adjustPts}
                          onChange={(e) => setAdjustPts(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="adj-reason" className="text-xs">
                          Reason (Optional)
                        </Label>
                        <Input
                          id="adj-reason"
                          placeholder="e.g. Birthday reward"
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/70 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                        onClick={() => handlePointAdjustment(selectedCustomer, true)}
                      >
                        + Add Bonus
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-rose-700 bg-rose-50/50 hover:bg-rose-100/70 border-rose-300 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
                        onClick={() => handlePointAdjustment(selectedCustomer, false)}
                      >
                        − Redeem Points
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Points Activity History (Ledger) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      Points Activity History
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {selectedCustomer.ledger.length} entries
                    </span>
                  </div>

                  <div className="rounded-xl border divide-y bg-card overflow-hidden">
                    {selectedCustomer.ledger.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No points activity recorded for this customer yet.
                      </div>
                    ) : (
                      selectedCustomer.ledger.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-foreground">
                              {item.reason}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {format(new Date(item.at), "dd MMM yyyy, hh:mm a")}
                              {item.orderNumber && ` • Order ${item.orderNumber}`}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`font-semibold text-xs px-2 py-0.5 tabular-nums ${
                              item.points > 0
                                ? "text-emerald-700 bg-emerald-500/10 border-emerald-500/20"
                                : "text-rose-700 bg-rose-500/10 border-rose-500/20"
                            }`}
                          >
                            {item.points > 0 ? `+${item.points}` : item.points} pts
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ========================================================================= */}
      {/* 5. ADD / EDIT CUSTOMER DIALOG (NAME & PHONE MANDATORY, NO EMAIL)          */}
      {/* ========================================================================= */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer Profile" : "Register New Customer"}
            </DialogTitle>
            <DialogDescription>
              Name and phone number are required to create a loyalty profile.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem("name") as HTMLInputElement).value;
              const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
              const address = (form.elements.namedItem("address") as HTMLInputElement).value;
              const notes = (form.elements.namedItem("notes") as HTMLTextAreaElement).value;

              if (editingCustomer) {
                setCustomers((prev) =>
                  prev.map((c) =>
                    c.id === editingCustomer.id
                      ? { ...c, name, phone, address, notes }
                      : c,
                  ),
                );
                toast.success(`Updated customer: ${name}`);
              } else {
                const newCustomer: UICustomer = {
                  id: `cust-${Date.now()}`,
                  name,
                  phone,
                  address,
                  notes,
                  points: 50,
                  totalSpent: 0,
                  visits: 1,
                  tierId: "tier-bronze",
                  tierName: "Bronze Member",
                  tierColor: "#B45309",
                  lastVisitAt: new Date().toISOString(),
                  ledger: [
                    {
                      id: `tx-${Date.now()}`,
                      points: 50,
                      type: "ADJUSTED",
                      reason: "Welcome Registration Bonus",
                      at: new Date().toISOString(),
                    },
                  ],
                };
                setCustomers((prev) => [newCustomer, ...prev]);
                toast.success(`Registered new customer: ${name} (+50 Welcome Bonus awarded!)`);
              }
              setIsCustomerModalOpen(false);
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="cust-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cust-name"
                name="name"
                defaultValue={editingCustomer?.name || ""}
                placeholder="e.g. Tanvir Hossain"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cust-phone"
                name="phone"
                type="tel"
                defaultValue={editingCustomer?.phone || ""}
                placeholder="e.g. +8801712345678"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-address">Delivery Address (Optional)</Label>
              <Input
                id="cust-address"
                name="address"
                defaultValue={editingCustomer?.address || ""}
                placeholder="House, Road, Area, City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-notes">Guest Preferences & Notes (Optional)</Label>
              <Textarea
                id="cust-notes"
                name="notes"
                defaultValue={editingCustomer?.notes || ""}
                placeholder="Allergies, favorite table, spice tolerance..."
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCustomerModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCustomer ? "Save Changes" : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 6. ADD / EDIT LOYALTY TIER DIALOG                                         */}
      {/* ========================================================================= */}
      <Dialog open={isTierModalOpen} onOpenChange={setIsTierModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? "Edit Loyalty Tier" : "Create Membership Tier"}
            </DialogTitle>
            <DialogDescription>
              Set spending thresholds, point multipliers, and order discounts for this tier.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem("name") as HTMLInputElement).value;
              const minSpend = Number((form.elements.namedItem("minSpend") as HTMLInputElement).value) || 0;
              const pointMultiplier = Number((form.elements.namedItem("pointMultiplier") as HTMLInputElement).value) || 1.0;
              const discountPercent = Number((form.elements.namedItem("discountPercent") as HTMLInputElement).value) || 0;
              const description = (form.elements.namedItem("description") as HTMLInputElement).value;
              const color = (form.elements.namedItem("color") as HTMLInputElement).value || "#3B82F6";

              if (editingTier) {
                setTiers((prev) =>
                  prev.map((t) =>
                    t.id === editingTier.id
                      ? { ...t, name, minSpend, pointMultiplier, discountPercent, description, color }
                      : t,
                  ),
                );
                toast.success(`Updated tier: ${name}`);
              } else {
                const newTier: UILoyaltyTier = {
                  id: `tier-${Date.now()}`,
                  name,
                  minSpend,
                  minPoints: Math.round(minSpend / 100),
                  pointMultiplier,
                  discountPercent,
                  description,
                  color,
                  membersCount: 0,
                  isActive: true,
                  sortOrder: tiers.length,
                };
                setTiers((prev) => [...prev, newTier]);
                toast.success(`Created new tier: ${name}`);
              }
              setIsTierModalOpen(false);
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="tier-name">Tier Name</Label>
              <Input
                id="tier-name"
                name="name"
                defaultValue={editingTier?.name || ""}
                placeholder="e.g. Diamond VIP"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tier-spend">Min Spend (৳)</Label>
                <Input
                  id="tier-spend"
                  name="minSpend"
                  type="number"
                  min={0}
                  defaultValue={editingTier?.minSpend ?? 0}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tier-mult">Multiplier (x)</Label>
                <Input
                  id="tier-mult"
                  name="pointMultiplier"
                  type="number"
                  step="0.05"
                  min={1.0}
                  defaultValue={editingTier?.pointMultiplier ?? 1.0}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tier-disc">Discount (%)</Label>
                <Input
                  id="tier-disc"
                  name="discountPercent"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={editingTier?.discountPercent ?? 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tier-color">Badge Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="tier-color"
                    name="color"
                    type="color"
                    defaultValue={editingTier?.color || "#3B82F6"}
                    className="size-9 rounded-md border cursor-pointer p-0.5 bg-background"
                  />
                  <span className="text-xs text-muted-foreground font-mono">
                    {editingTier?.color || "#3B82F6"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier-desc">Benefits Description</Label>
              <Input
                id="tier-desc"
                name="description"
                defaultValue={editingTier?.description || ""}
                placeholder="Special perks for members of this tier..."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTierModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTier ? "Save Tier" : "Create Tier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
