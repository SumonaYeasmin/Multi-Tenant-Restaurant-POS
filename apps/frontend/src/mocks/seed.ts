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
import { buildStage4, type Stage4Data } from "./seed-stage4";

export interface TenantDb extends BackofficeData, PeopleData, Stage4Data {
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

export const DB_VERSION = 6;

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
    categories: [
      "বিরিয়ানি ও পোলাও (Biryani & Polao)",
      "কারি ও রেজালা (Curries & Gravy)",
      "কাবাব ও রোস্ট (Grills & Roasts)",
      "পানীয় ও বোরহানি (Beverages & Borhani)",
      "মিষ্টি ও ডেজার্ট (Desserts & Sweets)",
    ],
    modifiers: [
      {
        key: "spice",
        name: "মশলার মাত্রা (Spice Level)",
        min: 1,
        max: 1,
        options: [
          ["রেগুলার শাহী ফ্লেভার", 0],
          ["ঝাল মেজবানি স্পাইস", 0],
        ],
      },
      {
        key: "extras",
        name: "কাচ্চি অ্যাড-অনস (Add-ons)",
        min: 0,
        max: 3,
        options: [
          ["সেদ্ধ ডিম (Extra Boiled Egg)", 25],
          ["স্পেশাল আলু (Extra Shahi Potato)", 30],
          ["আলু বোখরা চাটনি (Aloo Bokhara Chutney)", 40],
        ],
      },
      {
        key: "ice",
        name: "বরফের পরিমাণ (Ice Level)",
        min: 0,
        max: 1,
        options: [
          ["বরফ ছাড়া (No Ice)", 0],
          ["হালকা বরফ (Light Ice)", 0],
        ],
      },
    ],
    ingredients: [
      ["rice", "চিনিগুঁড়া সুগন্ধি চাল (Chinigura Rice)", "kg", 85, 25, 130],
      ["mutton", "তাজা দেশি খাসির মাংস (Fresh Desi Mutton)", "kg", 35, 10, 980],
      ["beef", "তাজা গরুর সিনার মাংস (Prime Beef Shank)", "kg", 40, 12, 780],
      ["oil", "ঘানি ভাঙা সরিষার তেল (Pure Mustard Oil)", "l", 28, 8, 290],
      ["ghee", "খাঁটি গাওয়া ঘি (Pure Desi Ghee)", "kg", 14, 4, 1200],
      ["curd", "মিষ্টি-টক দই ও ফ্রেশ দুধ (Fresh Yogurt & Milk)", "l", 45, 15, 95],
    ],
    items: [
      {
        cat: "বিরিয়ানি ও পোলাও (Biryani & Polao)",
        name: "ঢাকা শাহী কাচ্চি বিরিয়ানি (Shahi Kacchi Biryani)",
        desc: "খাসির নরম মাংস, সুগন্ধি চিনিগুঁড়া চাল, জাফরান ও শাহী আলুর নিখুঁত দমে রান্না কাচ্চি।",
        price: 480,
        variants: [["হাফ প্লেট", 0], ["ফুল প্লেট", 220]],
        mods: ["spice", "extras"],
        recipe: [["rice", 0.25], ["mutton", 0.3], ["ghee", 0.03]],
        tags: ["bestseller", "kacchi"],
      },
      {
        cat: "কারি ও রেজালা (Curries & Gravy)",
        name: "চট্টগ্রাম মেজবানি গরুর কালা ভুনা (Beef Kala Bhuna)",
        desc: "চট্টগ্রামের ঐতিহ্যবাহী খাঁটি সরিষার তেলে গাঢ় মসলায় ধীমে আঁচে কষানো গরুর কালা ভুনা।",
        price: 420,
        mods: ["spice"],
        recipe: [["beef", 0.35], ["oil", 0.04]],
        tags: ["traditional", "spicy"],
      },
      {
        cat: "কাবাব ও রোস্ট (Grills & Roasts)",
        name: "পুরান ঢাকা শাহী চিকেন রোস্ট (Old Dhaka Chicken Roast)",
        desc: "বিয়েবাড়ির স্পেশাল বাদাম বাটা, মাওয়া ও খাঁটি ঘিয়ে ভাজা সোনালী শাহী চিকেন রোস্ট।",
        price: 220,
        recipe: [["ghee", 0.03], ["oil", 0.02]],
        tags: ["wedding-special"],
      },
      {
        cat: "পানীয় ও বোরহানি (Beverages & Borhani)",
        name: "স্পেশাল মশলাদার বোরহানি (Special Spiced Borhani)",
        desc: "ঘন টক দই, পুদিনা পাতা, বিট লবণ, কাঁচা মরিচ ও শাহী জিরার খাঁটি রিফ্রেশিং বোরহানি।",
        price: 80,
        variants: [["গ্লাস (Glass 250ml)", 0], ["বড় বোতল (Bottle 1L)", 200]],
        mods: ["ice"],
        recipe: [["curd", 0.25]],
        tags: ["refreshing"],
      },
      {
        cat: "মিষ্টি ও ডেজার্ট (Desserts & Sweets)",
        name: "নবাবী শাহী টুকরা ও রাবড়ি (Nawabi Shahi Tukra)",
        desc: "ঘিয়ে মচমচে ভাজা জাফরানি টোস্ট, ঘন ক্ষীরসা, এলাচ ও পেস্তা-বাদামের রাজকীয় মিষ্টি।",
        price: 150,
        recipe: [["ghee", 0.03], ["curd", 0.2]],
        tags: ["sweet", "royal"],
      },
    ],
    areas: ["Main hall", "Lakeview Window", "VIP Cabin", "Family Hall", "Terrace Garden"],
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
  const tenantSpec = SPECS[tenantId];
  const tenant = TENANTS.find((targetTenant) => targetTenant.id === tenantId);
  if (!tenantSpec || !tenant) throw new Error(`Unknown tenant ${tenantId}`);
  const branches = BRANCHES.filter((branch) => branch.tenantId === tenantId);
  const tenantPrefix = tenantId.replace(/^t_/, "").slice(0, 3);

  const categories: Category[] = tenantSpec.categories.map((categoryName, categoryIndex) => ({
    id: `${tenantPrefix}_cat_${categoryIndex}`,
    tenantId,
    name: categoryName,
    sort: categoryIndex,
  }));

  const modifierGroups: ModifierGroup[] = tenantSpec.modifiers.map((modifierGroupSpec) => ({
    id: `${tenantPrefix}_mg_${modifierGroupSpec.key}`,
    tenantId,
    name: modifierGroupSpec.name,
    min: modifierGroupSpec.min,
    max: modifierGroupSpec.max,
    options: modifierGroupSpec.options.map(([optionName, optionPrice], optionIndex) => ({
      id: `${tenantPrefix}_mo_${modifierGroupSpec.key}_${optionIndex}`,
      name: optionName,
      price: optionPrice,
    })),
  }));

  const menuItems: MenuItem[] = tenantSpec.items.map((menuItemSpec, itemIndex) => ({
    id: `${tenantPrefix}_item_${itemIndex}`,
    tenantId,
    categoryId: categories[tenantSpec.categories.indexOf(menuItemSpec.cat)]!.id,
    name: menuItemSpec.name,
    description: menuItemSpec.desc,
    price: menuItemSpec.price,
    variants: (menuItemSpec.variants ?? []).map(([variantName, priceDelta], variantIndex) => ({
      id: `${tenantPrefix}_v_${itemIndex}_${variantIndex}`,
      name: variantName,
      priceDelta,
    })),
    modifierGroupIds: (menuItemSpec.mods ?? []).map((modifierGroupKey) => `${tenantPrefix}_mg_${modifierGroupKey}`),
    recipe: menuItemSpec.recipe.map(([ingredientKey, quantity]) => ({ ingredientKey, qty: quantity })),
    available: true,
    tags: menuItemSpec.tags ?? [],
  }));

  const ingredients: Ingredient[] = [];
  const tables: DiningTable[] = [];
  for (const branch of branches) {
    tenantSpec.ingredients.forEach(([ingredientKey, ingredientName, unit, currentStock, reorderLevel, unitCost]) =>
      ingredients.push({
        id: `${branch.id}_ing_${ingredientKey}`,
        tenantId,
        branchId: branch.id,
        key: ingredientKey,
        name: ingredientName,
        unit,
        stock: currentStock,
        reorderLevel,
        unitCost,
      }),
    );
    const tableCount = tenantSpec.areas.length > 1 ? 10 : 6;
    for (let tableIndex = 0; tableIndex < tableCount; tableIndex++) {
      const area = tenantSpec.areas[tableIndex < tableCount / 2 || tenantSpec.areas.length === 1 ? 0 : 1];
      const column = tableIndex % 5;
      const row = Math.floor(tableIndex / 5);
      tables.push({
        id: `${branch.id}_tbl_${tableIndex + 1}`,
        tenantId,
        branchId: branch.id,
        name: `T${tableIndex + 1}`,
        seats: [2, 4, 4, 6, 2, 4, 8, 2, 4, 4][tableIndex % 10]!,
        area: area ?? "Main",
        status: tableIndex === 3 ? "reserved" : "available",
        currentOrderId: null,
        x: column,
        y: row,
        shape: tableIndex % 10 === 6 ? "long" : tableIndex % 3 === 0 ? "round" : "square",
      });
    }
  }

  // Historic completed orders over the last 7 days for dashboard history.
  const randomGenerator = rng(tenantId.length * 7919 + 13);
  const orders: Order[] = [];
  let orderSequence = 1000;
  const currentTimestamp = Date.now();
  const orderTypes = ["dine_in", "takeaway", "dine_in", "pickup", "counter"] as const;

  for (const branch of branches) {
    for (let dayOffset = 7; dayOffset >= 1; dayOffset--) {
      const ordersPerDay = 6 + Math.floor(randomGenerator() * 6);
      for (let orderIndex = 0; orderIndex < ordersPerDay; orderIndex++) {
        const orderCreatedAt = new Date(currentTimestamp - dayOffset * 86400000 + (10 + randomGenerator() * 11) * 3600000);
        const orderLineCount = 1 + Math.floor(randomGenerator() * 3);
        const orderLines: OrderLine[] = [];

        for (let lineIndex = 0; lineIndex < orderLineCount; lineIndex++) {
          const selectedMenuItem = menuItems[Math.floor(randomGenerator() * menuItems.length)]!;
          orderLines.push({
            id: `l${orderSequence}_${lineIndex}`,
            itemId: selectedMenuItem.id,
            name: selectedMenuItem.name,
            variantId: null,
            variantName: null,
            modifiers: [],
            qty: 1 + Math.floor(randomGenerator() * 2),
            unitPrice: selectedMenuItem.price,
            notes: "",
          });
        }
        const orderType = orderTypes[Math.floor(randomGenerator() * orderTypes.length)]!;
        const orderTotals = computeTotals({
          lines: orderLines,
          discount: null,
          orderType,
          taxRate: tenant.taxRate,
          serviceChargeRate: tenant.serviceChargeRate,
        });
        orderSequence++;

        orders.push({
          id: `${tenantPrefix}_ord_${orderSequence}`,
          tenantId,
          branchId: branch.id,
          number: `#${orderSequence}`,
          type: orderType,
          tableId: null,
          tableName: null,
          customerName: "",
          customerPhone: "",
          lines: orderLines,
          discount: null,
          notes: "",
          totals: orderTotals,
          status: "completed",
          kitchenStatus: "bumped",
          payments: [
            {
              id: `pay_${orderSequence}`,
              method: randomGenerator() > 0.5 ? "card" : "cash",
              amount: orderTotals.total,
              tendered: orderTotals.total,
              change: 0,
              reference: "",
              at: orderCreatedAt.toISOString(),
            },
          ],
          paid: orderTotals.total,
          refunds: [],
          refunded: 0,
          delivery: null,
          inventoryDeducted: true,
          createdBy: "seed",
          createdAt: orderCreatedAt.toISOString(),
          sentToKitchenAt: orderCreatedAt.toISOString(),
          readyAt: orderCreatedAt.toISOString(),
          completedAt: new Date(orderCreatedAt.getTime() + 40 * 60000).toISOString(),
        });
      }
    }

    // Active demo orders for today: Kitchen tickets, active POS orders, and Delivery tracking
    const isSaffron = tenantId === "t_saffron";
    const isHarbor = tenantId === "t_harbor";

    const branchPeople = isSaffron
      ? {
          guests: ["Tanvir Hossain", "Nusrat Jahan", "Kamrul Islam", "Farhan Ahmed", "Sadia Rahman", "Anisur Rahman", "Mehnaz Hossain"],
          phones: ["+8801711998877", "+8801819223344", "+8801911445566", "+8801712334455", "+8801815667788", "+8801912889900", "+8801715443322"],
          addresses: [
            "House 42, Road 11, Banani, Dhaka",
            "Flat 4A, Concord Tower, Gulshan-2, Dhaka",
            "House 15, Road 7, Dhanmondi, Dhaka",
            "Road 27, House 88, Dhanmondi, Dhaka",
          ],
          riders: ["Babul Mia", "Shohel Rana"],
        }
      : isHarbor
        ? {
            guests: ["Alex Johnson", "Sarah Connor", "Michael Chang", "Emily Watson", "James Rodriguez", "Chloe Bennett", "Liam Garcia"],
            phones: ["+14155550211", "+14155550222", "+14155550233", "+14155550244", "+14155550255", "+14155550266", "+14155550277"],
            addresses: [
              "450 Valencia St, Apt 3B, San Francisco",
              "1200 Market St, Suite 500, San Francisco",
              "789 Mission St, San Francisco",
              "2100 Chestnut St, San Francisco",
            ],
            riders: ["Tom Becker", "Kavita Patel"],
          }
        : {
            guests: ["Max Müller", "Sophie Becker", "Felix Wagner", "Hannah Weber", "Leon Schmidt", "Emma Fischer", "Noah Richter"],
            phones: ["+4915550201", "+4915550202", "+4915550203", "+4915550204", "+4915550205", "+4915550206", "+4915550207"],
            addresses: [
              "Torstraße 12, 10119 Berlin",
              "Friedrichstraße 44, 10117 Berlin",
              "Alexanderplatz 5, 10178 Berlin",
              "Kastanienallee 21, 10435 Berlin",
            ],
            riders: ["Lukas Braun", "Mia Fischer"],
          };

    const makeLines = (specs: { idx: number; qty: number; notes?: string }[]) =>
      specs.map((spec, lineIdx) => {
        const item = menuItems[spec.idx % menuItems.length]!;
        return {
          id: `l${orderSequence}_${lineIdx}`,
          itemId: item.id,
          name: item.name,
          variantId: null,
          variantName: null,
          modifiers: [],
          qty: spec.qty,
          unitPrice: item.price,
          notes: spec.notes ?? "",
        };
      });

    // 1. Dine-in: Table 2, Kitchen Status: "new" (Freshly placed)
    orderSequence++;
    const lines1 = makeLines([
      { idx: 0, qty: 2, notes: "Extra spicy" },
      { idx: 1, qty: 1 },
    ]);
    const totals1 = computeTotals({ lines: lines1, discount: null, orderType: "dine_in", taxRate: tenant.taxRate, serviceChargeRate: tenant.serviceChargeRate });
    const order1Id = `${tenantPrefix}_ord_${orderSequence}`;
    const activeOrder1: Order = {
      id: order1Id,
      tenantId,
      branchId: branch.id,
      number: `#${orderSequence}`,
      type: "dine_in",
      tableId: `${branch.id}_tbl_2`,
      tableName: "T2",
      customerName: branchPeople.guests[0]!,
      customerPhone: branchPeople.phones[0]!,
      lines: lines1,
      discount: null,
      notes: "Extra napkins requested",
      totals: totals1,
      status: "in_kitchen",
      kitchenStatus: "new",
      payments: [],
      paid: 0,
      refunds: [],
      refunded: 0,
      delivery: null,
      inventoryDeducted: true,
      createdBy: "seed",
      createdAt: new Date(currentTimestamp - 4 * 60000).toISOString(),
      sentToKitchenAt: new Date(currentTimestamp - 4 * 60000).toISOString(),
      readyAt: null,
      completedAt: null,
    };
    orders.push(activeOrder1);

    // 2. Dine-in: Table 1, Kitchen Status: "preparing" (In preparation)
    orderSequence++;
    const lines2 = makeLines([
      { idx: 1, qty: 1 },
      { idx: 2, qty: 1 },
      { idx: 3, qty: 2, notes: "No onions" },
    ]);
    const totals2 = computeTotals({ lines: lines2, discount: null, orderType: "dine_in", taxRate: tenant.taxRate, serviceChargeRate: tenant.serviceChargeRate });
    const order2Id = `${tenantPrefix}_ord_${orderSequence}`;
    const activeOrder2: Order = {
      id: order2Id,
      tenantId,
      branchId: branch.id,
      number: `#${orderSequence}`,
      type: "dine_in",
      tableId: `${branch.id}_tbl_1`,
      tableName: "T1",
      customerName: branchPeople.guests[1]!,
      customerPhone: branchPeople.phones[1]!,
      lines: lines2,
      discount: null,
      notes: "Serve starters together",
      totals: totals2,
      status: "in_kitchen",
      kitchenStatus: "preparing",
      payments: [],
      paid: 0,
      refunds: [],
      refunded: 0,
      delivery: null,
      inventoryDeducted: true,
      createdBy: "seed",
      createdAt: new Date(currentTimestamp - 12 * 60000).toISOString(),
      sentToKitchenAt: new Date(currentTimestamp - 11 * 60000).toISOString(),
      readyAt: null,
      completedAt: null,
    };
    orders.push(activeOrder2);

    // 3. Takeaway: Ready for pickup, Kitchen Status: "ready"
    orderSequence++;
    const lines3 = makeLines([
      { idx: 0, qty: 1 },
      { idx: 2, qty: 2 },
    ]);
    const totals3 = computeTotals({ lines: lines3, discount: null, orderType: "takeaway", taxRate: tenant.taxRate, serviceChargeRate: tenant.serviceChargeRate });
    const activeOrder3: Order = {
      id: `${tenantPrefix}_ord_${orderSequence}`,
      tenantId,
      branchId: branch.id,
      number: `#${orderSequence}`,
      type: "takeaway",
      tableId: null,
      tableName: null,
      customerName: branchPeople.guests[2]!,
      customerPhone: branchPeople.phones[2]!,
      lines: lines3,
      discount: null,
      notes: "Pack sauce separately in paper bag",
      totals: totals3,
      status: "ready",
      kitchenStatus: "ready",
      payments: [
        {
          id: `pay_${orderSequence}`,
          method: "card",
          amount: totals3.total,
          tendered: totals3.total,
          change: 0,
          reference: "TXN-88219",
          at: new Date(currentTimestamp - 20 * 60000).toISOString(),
        },
      ],
      paid: totals3.total,
      refunds: [],
      refunded: 0,
      delivery: null,
      inventoryDeducted: true,
      createdBy: "seed",
      createdAt: new Date(currentTimestamp - 20 * 60000).toISOString(),
      sentToKitchenAt: new Date(currentTimestamp - 19 * 60000).toISOString(),
      readyAt: new Date(currentTimestamp - 3 * 60000).toISOString(),
      completedAt: null,
    };
    orders.push(activeOrder3);

    // 4. Delivery: Awaiting rider (status: "pending")
    orderSequence++;
    const lines4 = makeLines([
      { idx: 1, qty: 2 },
      { idx: 3, qty: 1 },
    ]);
    const totals4 = computeTotals({ lines: lines4, discount: null, orderType: "delivery", taxRate: tenant.taxRate, serviceChargeRate: tenant.serviceChargeRate });
    const activeOrder4: Order = {
      id: `${tenantPrefix}_ord_${orderSequence}`,
      tenantId,
      branchId: branch.id,
      number: `#${orderSequence}`,
      type: "delivery",
      tableId: null,
      tableName: null,
      customerName: branchPeople.guests[3]!,
      customerPhone: branchPeople.phones[3]!,
      lines: lines4,
      discount: null,
      notes: "Ring bell and call on arrival",
      totals: totals4,
      status: "in_kitchen",
      kitchenStatus: "preparing",
      payments: [
        {
          id: `pay_${orderSequence}`,
          method: "mobile",
          amount: totals4.total,
          tendered: totals4.total,
          change: 0,
          reference: "BKASH-99120",
          at: new Date(currentTimestamp - 15 * 60000).toISOString(),
        },
      ],
      paid: totals4.total,
      refunds: [],
      refunded: 0,
      delivery: {
        address: branchPeople.addresses[0]!,
        riderId: null,
        riderName: null,
        status: "pending",
        dispatchedAt: null,
        deliveredAt: null,
      },
      inventoryDeducted: true,
      createdBy: "seed",
      createdAt: new Date(currentTimestamp - 15 * 60000).toISOString(),
      sentToKitchenAt: new Date(currentTimestamp - 14 * 60000).toISOString(),
      readyAt: null,
      completedAt: null,
    };
    orders.push(activeOrder4);

    // 5. Delivery: Rider assigned (status: "assigned"), food ready
    orderSequence++;
    const lines5 = makeLines([
      { idx: 0, qty: 1 },
      { idx: 1, qty: 1 },
      { idx: 2, qty: 1 },
    ]);
    const totals5 = computeTotals({ lines: lines5, discount: null, orderType: "delivery", taxRate: tenant.taxRate, serviceChargeRate: tenant.serviceChargeRate });
    const activeOrder5: Order = {
      id: `${tenantPrefix}_ord_${orderSequence}`,
      tenantId,
      branchId: branch.id,
      number: `#${orderSequence}`,
      type: "delivery",
      tableId: null,
      tableName: null,
      customerName: branchPeople.guests[4]!,
      customerPhone: branchPeople.phones[4]!,
      lines: lines5,
      discount: null,
      notes: "Handle with care, hot soup",
      totals: totals5,
      status: "ready",
      kitchenStatus: "ready",
      payments: [
        {
          id: `pay_${orderSequence}`,
          method: "card",
          amount: totals5.total,
          tendered: totals5.total,
          change: 0,
          reference: "TXN-77312",
          at: new Date(currentTimestamp - 26 * 60000).toISOString(),
        },
      ],
      paid: totals5.total,
      refunds: [],
      refunded: 0,
      delivery: {
        address: branchPeople.addresses[1]!,
        riderId: `${tenantPrefix}_rider_${branch.id}_0`,
        riderName: branchPeople.riders[0]!,
        status: "assigned",
        dispatchedAt: null,
        deliveredAt: null,
      },
      inventoryDeducted: true,
      createdBy: "seed",
      createdAt: new Date(currentTimestamp - 26 * 60000).toISOString(),
      sentToKitchenAt: new Date(currentTimestamp - 25 * 60000).toISOString(),
      readyAt: new Date(currentTimestamp - 5 * 60000).toISOString(),
      completedAt: null,
    };
    orders.push(activeOrder5);

    // 6. Delivery: Out for delivery (status: "out")
    orderSequence++;
    const lines6 = makeLines([
      { idx: 2, qty: 1 },
      { idx: 0, qty: 2 },
    ]);
    const totals6 = computeTotals({ lines: lines6, discount: null, orderType: "delivery", taxRate: tenant.taxRate, serviceChargeRate: tenant.serviceChargeRate });
    const activeOrder6: Order = {
      id: `${tenantPrefix}_ord_${orderSequence}`,
      tenantId,
      branchId: branch.id,
      number: `#${orderSequence}`,
      type: "delivery",
      tableId: null,
      tableName: null,
      customerName: branchPeople.guests[5]!,
      customerPhone: branchPeople.phones[5]!,
      lines: lines6,
      discount: null,
      notes: "Leave with building reception if unreachable",
      totals: totals6,
      status: "served",
      kitchenStatus: "bumped",
      payments: [
        {
          id: `pay_${orderSequence}`,
          method: "cash",
          amount: totals6.total,
          tendered: totals6.total,
          change: 0,
          reference: "",
          at: new Date(currentTimestamp - 38 * 60000).toISOString(),
        },
      ],
      paid: totals6.total,
      refunds: [],
      refunded: 0,
      delivery: {
        address: branchPeople.addresses[2]!,
        riderId: `${tenantPrefix}_rider_${branch.id}_1`,
        riderName: branchPeople.riders[1] ?? branchPeople.riders[0]!,
        status: "out",
        dispatchedAt: new Date(currentTimestamp - 12 * 60000).toISOString(),
        deliveredAt: null,
      },
      inventoryDeducted: true,
      createdBy: "seed",
      createdAt: new Date(currentTimestamp - 38 * 60000).toISOString(),
      sentToKitchenAt: new Date(currentTimestamp - 37 * 60000).toISOString(),
      readyAt: new Date(currentTimestamp - 18 * 60000).toISOString(),
      completedAt: null,
    };
    orders.push(activeOrder6);

    // 7. Delivery: Delivered today (status: "delivered")
    orderSequence++;
    const lines7 = makeLines([
      { idx: 1, qty: 1 },
      { idx: 0, qty: 1 },
    ]);
    const totals7 = computeTotals({ lines: lines7, discount: null, orderType: "delivery", taxRate: tenant.taxRate, serviceChargeRate: tenant.serviceChargeRate });
    const activeOrder7: Order = {
      id: `${tenantPrefix}_ord_${orderSequence}`,
      tenantId,
      branchId: branch.id,
      number: `#${orderSequence}`,
      type: "delivery",
      tableId: null,
      tableName: null,
      customerName: branchPeople.guests[6]!,
      customerPhone: branchPeople.phones[6]!,
      lines: lines7,
      discount: null,
      notes: "",
      totals: totals7,
      status: "completed",
      kitchenStatus: "bumped",
      payments: [
        {
          id: `pay_${orderSequence}`,
          method: "card",
          amount: totals7.total,
          tendered: totals7.total,
          change: 0,
          reference: "TXN-66421",
          at: new Date(currentTimestamp - 70 * 60000).toISOString(),
        },
      ],
      paid: totals7.total,
      refunds: [],
      refunded: 0,
      delivery: {
        address: branchPeople.addresses[3]!,
        riderId: `${tenantPrefix}_rider_${branch.id}_0`,
        riderName: branchPeople.riders[0]!,
        status: "delivered",
        dispatchedAt: new Date(currentTimestamp - 45 * 60000).toISOString(),
        deliveredAt: new Date(currentTimestamp - 15 * 60000).toISOString(),
      },
      inventoryDeducted: true,
      createdBy: "seed",
      createdAt: new Date(currentTimestamp - 70 * 60000).toISOString(),
      sentToKitchenAt: new Date(currentTimestamp - 69 * 60000).toISOString(),
      readyAt: new Date(currentTimestamp - 50 * 60000).toISOString(),
      completedAt: new Date(currentTimestamp - 15 * 60000).toISOString(),
    };
    orders.push(activeOrder7);

    // Link tables to active dine-in orders
    const tbl1 = tables.find((t) => t.id === `${branch.id}_tbl_1`);
    if (tbl1) {
      tbl1.status = "occupied";
      tbl1.currentOrderId = order2Id;
    }
    const tbl2 = tables.find((t) => t.id === `${branch.id}_tbl_2`);
    if (tbl2) {
      tbl2.status = "occupied";
      tbl2.currentOrderId = order1Id;
    }
    const tbl3 = tables.find((t) => t.id === `${branch.id}_tbl_3`);
    if (tbl3) {
      tbl3.status = "reserved";
    }
  }

  const notifications: Notification[] = [
    {
      id: `${tenantPrefix}_n1`,
      tenantId,
      title: "Low stock",
      body: "Some ingredients are below reorder level.",
      createdAt: new Date(currentTimestamp - 3600000).toISOString(),
      read: false,
    },
    {
      id: `${tenantPrefix}_n2`,
      tenantId,
      title: "Welcome",
      body: `${tenant.name} workspace is ready (demo data).`,
      createdAt: new Date(currentTimestamp - 86400000).toISOString(),
      read: true,
    },
  ];

  const backoffice = buildBackoffice(tenantId, menuItems, ingredients, branches.map((branch) => branch.id));
  const people = buildPeople(tenantId, orders);
  const stage4 = buildStage4(tenantId);
  return {
    ...backoffice,
    ...people,
    ...stage4,
    version: DB_VERSION,
    categories,
    modifierGroups,
    menuItems,
    ingredients,
    movements: [],
    tables,
    orders,
    notifications,
    orderSeq: orderSequence,
  };
}
