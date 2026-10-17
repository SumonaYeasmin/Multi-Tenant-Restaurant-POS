import type {
  Category,
  DiningTable,
  Ingredient,
  MenuItem,
  ModifierGroup,
  Notification,
  Order,
  OrderLine,
  StockMovement,
} from "@/types/domain";
import { computeTotals } from "@/lib/pricing";
import { BRANCHES, TENANTS } from "./platform";
import { buildBackoffice, type BackofficeData } from "./seed-backoffice";
import { buildPeople, type PeopleData } from "./seed-people";

export interface TenantDb extends BackofficeData, PeopleData {
  version: number;
  categories: Category[];
  modifierGroups: ModifierGroup[];
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  movements: StockMovement[];
  tables: DiningTable[];
  orders: Order[];
  notifications: Notification[];
  orderSeq: number;
}

export const DB_VERSION = 3;

interface ItemSpec {
  cat: string;
  name: string;
  desc: string;
  price: number;
  variants?: [string, number][];
  mods?: string[];
  recipe: [string, number][];
  tags?: string[];
}

interface TenantSpec {
  categories: string[];
  modifiers: { key: string; name: string; min: number; max: number; options: [string, number][] }[];
  ingredients: [string, string, string, number, number, number][]; // key,name,unit,stock,reorder,cost
  items: ItemSpec[];
  areas: string[];
}

const SPECS: Record<string, TenantSpec> = {
  t_saffron: {
    categories: ["Grill", "Curries", "Rice & Breads", "Drinks"],
    modifiers: [
      { key: "spice", name: "Spice level", min: 1, max: 1, options: [["Mild", 0], ["Medium", 0], ["Hot", 0], ["Ember hot", 20]] },
      { key: "extras", name: "Extras", min: 0, max: 3, options: [["Extra raita", 60], ["Green chutney", 40], ["Fried onions", 50]] },
      { key: "ice", name: "Ice", min: 0, max: 1, options: [["No ice", 0], ["Light ice", 0]] },
    ],
    ingredients: [
      ["chicken", "Chicken thigh", "kg", 24, 8, 420],
      ["lamb", "Lamb shoulder", "kg", 12, 5, 980],
      ["rice", "Basmati rice", "kg", 40, 10, 160],
      ["flour", "Atta flour", "kg", 30, 8, 70],
      ["yogurt", "Yogurt", "kg", 15, 5, 180],
      ["paneer", "Paneer", "kg", 6, 3, 650],
      ["mango", "Mango pulp", "l", 3, 4, 320],
      ["spices", "Masala blend", "kg", 5, 2, 900],
    ],
    items: [
      { cat: "Grill", name: "Chicken Tikka", desc: "Charcoal-grilled, yogurt-marinated thigh", price: 520, variants: [["Half", 0], ["Full", 380]], mods: ["spice", "extras"], recipe: [["chicken", 0.25], ["yogurt", 0.05], ["spices", 0.01]], tags: ["bestseller"] },
      { cat: "Grill", name: "Seekh Kebab", desc: "Minced lamb skewers, mint chutney", price: 640, mods: ["spice", "extras"], recipe: [["lamb", 0.2], ["spices", 0.01]] },
      { cat: "Grill", name: "Paneer Shashlik", desc: "Paneer, peppers, onions", price: 480, mods: ["spice"], recipe: [["paneer", 0.18], ["spices", 0.01]], tags: ["veg"] },
      { cat: "Curries", name: "Butter Chicken", desc: "Tomato-cream gravy, fenugreek", price: 590, mods: ["spice", "extras"], recipe: [["chicken", 0.22], ["yogurt", 0.03], ["spices", 0.01]], tags: ["bestseller"] },
      { cat: "Curries", name: "Lamb Rogan Josh", desc: "Kashmiri chilli, slow-braised", price: 780, mods: ["spice"], recipe: [["lamb", 0.25], ["spices", 0.015]] },
      { cat: "Curries", name: "Palak Paneer", desc: "Spinach, paneer, garlic", price: 460, mods: ["spice"], recipe: [["paneer", 0.15]], tags: ["veg"] },
      { cat: "Rice & Breads", name: "Kacchi Biryani", desc: "Dhaka-style mutton biryani", price: 650, variants: [["Single", 0], ["Family (3)", 1200]], recipe: [["lamb", 0.2], ["rice", 0.2], ["spices", 0.01]], tags: ["bestseller"] },
      { cat: "Rice & Breads", name: "Garlic Naan", desc: "Tandoor-baked", price: 120, recipe: [["flour", 0.12]] },
      { cat: "Rice & Breads", name: "Jeera Rice", desc: "Cumin basmati", price: 220, recipe: [["rice", 0.15]] },
      { cat: "Drinks", name: "Mango Lassi", desc: "Alphonso mango, yogurt", price: 260, mods: ["ice"], recipe: [["mango", 0.12], ["yogurt", 0.15]] },
      { cat: "Drinks", name: "Masala Chai", desc: "Spiced milk tea", price: 140, recipe: [["spices", 0.002]] },
      { cat: "Drinks", name: "Fresh Lime Soda", desc: "Sweet or salted", price: 180, variants: [["Sweet", 0], ["Salted", 0]], mods: ["ice"], recipe: [] },
    ],
    areas: ["Main hall", "Terrace"],
  },
  t_harbor: {
    categories: ["Noodles", "Bao & Small plates", "Drinks"],
    modifiers: [
      { key: "broth", name: "Broth", min: 1, max: 1, options: [["Tonkotsu", 0], ["Spicy miso", 1], ["Shoyu", 0]] },
      { key: "toppings", name: "Add toppings", min: 0, max: 4, options: [["Soft egg", 2], ["Chashu", 4], ["Bok choy", 1.5], ["Chili oil", 0.5]] },
      { key: "sweet", name: "Sweetness", min: 0, max: 1, options: [["Less sweet", 0], ["No sugar", 0]] },
    ],
    ingredients: [
      ["noodles", "Fresh noodles", "kg", 30, 10, 3.2],
      ["pork", "Pork belly", "kg", 14, 6, 9.5],
      ["broth", "Broth base", "l", 60, 20, 2.1],
      ["egg", "Eggs", "pc", 120, 40, 0.3],
      ["bao", "Bao buns", "pc", 80, 30, 0.45],
      ["tofu", "Tofu", "kg", 8, 3, 4],
      ["tea", "Milk tea base", "l", 10, 4, 3],
    ],
    items: [
      { cat: "Noodles", name: "Harbor Ramen", desc: "House noodles, chashu, egg", price: 16, variants: [["Regular", 0], ["Large", 3]], mods: ["broth", "toppings"], recipe: [["noodles", 0.18], ["pork", 0.08], ["broth", 0.5], ["egg", 1]], tags: ["bestseller"] },
      { cat: "Noodles", name: "Dan Dan Noodles", desc: "Sesame, chili, pork mince", price: 14, mods: ["toppings"], recipe: [["noodles", 0.16], ["pork", 0.06]] },
      { cat: "Noodles", name: "Tofu Udon", desc: "Kombu dashi, crispy tofu", price: 15, mods: ["toppings"], recipe: [["noodles", 0.2], ["tofu", 0.12], ["broth", 0.4]], tags: ["veg"] },
      { cat: "Bao & Small plates", name: "Pork Belly Bao", desc: "Hoisin, pickles, peanuts", price: 6.5, variants: [["1 pc", 0], ["3 pcs", 11]], recipe: [["bao", 1], ["pork", 0.06]], tags: ["bestseller"] },
      { cat: "Bao & Small plates", name: "Crispy Tofu Bao", desc: "Gochujang mayo", price: 6, recipe: [["bao", 1], ["tofu", 0.06]], tags: ["veg"] },
      { cat: "Bao & Small plates", name: "Pork Gyoza", desc: "Pan-fried, 6 pcs", price: 9, recipe: [["pork", 0.08]] },
      { cat: "Drinks", name: "Brown Sugar Milk Tea", desc: "Boba, fresh milk", price: 6.5, mods: ["sweet"], recipe: [["tea", 0.3]] },
      { cat: "Drinks", name: "Yuzu Soda", desc: "Sparkling citrus", price: 5, recipe: [] },
    ],
    areas: ["Counter", "Dining room"],
  },
  t_lumen: {
    categories: ["Coffee", "Bakery"],
    modifiers: [
      { key: "milk", name: "Milk", min: 1, max: 1, options: [["Whole", 0], ["Oat", 0.5], ["Almond", 0.5]] },
      { key: "shot", name: "Extras", min: 0, max: 2, options: [["Extra shot", 0.8], ["Vanilla syrup", 0.5]] },
    ],
    ingredients: [
      ["beans", "Espresso beans", "kg", 9, 3, 24],
      ["milk", "Milk", "l", 30, 10, 1.1],
      ["butter", "Butter", "kg", 6, 2, 8],
      ["flour", "Flour", "kg", 25, 8, 0.9],
    ],
    items: [
      { cat: "Coffee", name: "Flat White", desc: "Double ristretto", price: 3.9, mods: ["milk", "shot"], recipe: [["beans", 0.018], ["milk", 0.15]] },
      { cat: "Coffee", name: "Cortado", desc: "Equal parts", price: 3.4, mods: ["milk"], recipe: [["beans", 0.018], ["milk", 0.06]] },
      { cat: "Bakery", name: "Butter Croissant", desc: "Laminated daily", price: 2.9, recipe: [["butter", 0.03], ["flour", 0.05]] },
      { cat: "Bakery", name: "Cardamom Bun", desc: "Swedish style", price: 3.5, recipe: [["butter", 0.02], ["flour", 0.06]] },
    ],
    areas: ["Café"],
  },
};

/** Deterministic PRNG so seeded history is stable across reloads. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function buildTenantSeed(tenantId: string): TenantDb {
  const spec = SPECS[tenantId];
  const tenant = TENANTS.find((t) => t.id === tenantId);
  if (!spec || !tenant) throw new Error(`Unknown tenant ${tenantId}`);
  const branches = BRANCHES.filter((b) => b.tenantId === tenantId);
  const p = tenantId.slice(2, 5);

  const categories: Category[] = spec.categories.map((name, i) => ({ id: `${p}_cat_${i}`, tenantId, name, sort: i }));
  const modifierGroups: ModifierGroup[] = spec.modifiers.map((m) => ({
    id: `${p}_mg_${m.key}`,
    tenantId,
    name: m.name,
    min: m.min,
    max: m.max,
    options: m.options.map(([name, price], i) => ({ id: `${p}_mo_${m.key}_${i}`, name, price })),
  }));
  const menuItems: MenuItem[] = spec.items.map((it, i) => ({
    id: `${p}_item_${i}`,
    tenantId,
    categoryId: categories[spec.categories.indexOf(it.cat)]!.id,
    name: it.name,
    description: it.desc,
    price: it.price,
    variants: (it.variants ?? []).map(([name, d], vi) => ({ id: `${p}_v_${i}_${vi}`, name, priceDelta: d })),
    modifierGroupIds: (it.mods ?? []).map((k) => `${p}_mg_${k}`),
    recipe: it.recipe.map(([ingredientKey, qty]) => ({ ingredientKey, qty })),
    available: true,
    tags: it.tags ?? [],
  }));

  const ingredients: Ingredient[] = [];
  const tables: DiningTable[] = [];
  for (const b of branches) {
    spec.ingredients.forEach(([key, name, unit, stock, reorder, cost]) =>
      ingredients.push({ id: `${b.id}_ing_${key}`, tenantId, branchId: b.id, key, name, unit, stock, reorderLevel: reorder, unitCost: cost }),
    );
    const count = spec.areas.length > 1 ? 10 : 6;
    for (let i = 0; i < count; i++) {
      const area = spec.areas[i < count / 2 || spec.areas.length === 1 ? 0 : 1];
      const col = i % 5;
      const row = Math.floor(i / 5);
      tables.push({
        id: `${b.id}_tbl_${i + 1}`,
        tenantId,
        branchId: b.id,
        name: `T${i + 1}`,
        seats: [2, 4, 4, 6, 2, 4, 8, 2, 4, 4][i % 10]!,
        area: area ?? "Main",
        status: i === 3 ? "reserved" : "available",
        currentOrderId: null,
        x: col,
        y: row,
        shape: i % 10 === 6 ? "long" : i % 3 === 0 ? "round" : "square",
      });
    }
  }

  // Historic completed orders over the last 7 days for dashboard history.
  const rand = rng(tenantId.length * 7919 + 13);
  const orders: Order[] = [];
  let seq = 1000;
  const now = Date.now();
  const types = ["dine_in", "takeaway", "dine_in", "pickup", "counter"] as const;
  for (const b of branches) {
    for (let d = 7; d >= 1; d--) {
      const perDay = 6 + Math.floor(rand() * 6);
      for (let k = 0; k < perDay; k++) {
        const created = new Date(now - d * 86400000 + (10 + rand() * 11) * 3600000);
        const nLines = 1 + Math.floor(rand() * 3);
        const lines: OrderLine[] = [];
        for (let l = 0; l < nLines; l++) {
          const item = menuItems[Math.floor(rand() * menuItems.length)]!;
          lines.push({
            id: `l${seq}_${l}`,
            itemId: item.id,
            name: item.name,
            variantId: null,
            variantName: null,
            modifiers: [],
            qty: 1 + Math.floor(rand() * 2),
            unitPrice: item.price,
            notes: "",
          });
        }
        const type = types[Math.floor(rand() * types.length)]!;
        const totals = computeTotals({ lines, discount: null, orderType: type, taxRate: tenant.taxRate, serviceChargeRate: tenant.serviceChargeRate });
        seq++;
        orders.push({
          id: `${p}_ord_${seq}`,
          tenantId,
          branchId: b.id,
          number: `#${seq}`,
          type,
          tableId: null,
          tableName: null,
          customerName: "",
          customerPhone: "",
          lines,
          discount: null,
          notes: "",
          totals,
          status: "completed",
          kitchenStatus: "bumped",
          payments: [{ id: `pay_${seq}`, method: rand() > 0.5 ? "card" : "cash", amount: totals.total, tendered: totals.total, change: 0, reference: "", at: created.toISOString() }],
          paid: totals.total,
          refunds: [],
          refunded: 0,
          delivery: null,
          inventoryDeducted: true,
          createdBy: "seed",
          createdAt: created.toISOString(),
          sentToKitchenAt: created.toISOString(),
          readyAt: created.toISOString(),
          completedAt: new Date(created.getTime() + 40 * 60000).toISOString(),
        });
      }
    }
  }

  const notifications: Notification[] = [
    { id: `${p}_n1`, tenantId, title: "Low stock", body: "Some ingredients are below reorder level.", createdAt: new Date(now - 3600000).toISOString(), read: false },
    { id: `${p}_n2`, tenantId, title: "Welcome", body: `${tenant.name} workspace is ready (demo data).`, createdAt: new Date(now - 86400000).toISOString(), read: true },
  ];

  const backoffice = buildBackoffice(tenantId, menuItems, ingredients, branches.map((b) => b.id));
  const people = buildPeople(tenantId, orders);
  return { ...backoffice, ...people, version: DB_VERSION, categories, modifierGroups, menuItems, ingredients, movements: [], tables, orders, notifications, orderSeq: seq };
}
