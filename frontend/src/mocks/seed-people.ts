import type {
  AttendanceRecord,
  Branch,
  CashSession,
  Customer,
  Expense,
  LoyaltySettings,
  Order,
  Promotion,
  Reservation,
  Rider,
  Shift,
  StaffMember,
} from "@/types/domain";
import { BRANCHES, USERS } from "./platform";

// Stage 3 seed: customers & loyalty, reservations, riders, cash, expenses,
// staff, shifts, attendance, branches and promotions.

export interface PeopleData {
  branches: Branch[];
  customers: Customer[];
  loyalty: LoyaltySettings;
  reservations: Reservation[];
  riders: Rider[];
  cashSessions: CashSession[];
  expenses: Expense[];
  staff: StaffMember[];
  shifts: Shift[];
  attendance: AttendanceRecord[];
  promotions: Promotion[];
}

const LOYALTY: Record<string, LoyaltySettings> = {
  t_saffron: { spendPerPoint: 100, pointValue: 1 },
  t_harbor: { spendPerPoint: 1, pointValue: 0.05 },
  t_lumen: { spendPerPoint: 1, pointValue: 0.05 },
};

const CUSTOMERS: Record<string, [string, string, string, number, number, number][]> = {
  // name, phone, email, points, visits, spent
  t_saffron: [
    ["Ayesha Siddiqua", "+8801711223344", "ayesha@mail.bd", 142, 18, 14200],
    ["Rahim Uddin", "+8801819556677", "", 38, 5, 3800],
    ["Farhana Kabir", "+8801915889900", "farhana.k@mail.bd", 610, 41, 61000],
  ],
  t_harbor: [
    ["Jamie Chen", "+14155550101", "jamie@mail.com", 86, 9, 86],
    ["Priya Nair", "+14155550144", "priya.n@mail.com", 412, 33, 412],
  ],
  t_lumen: [["Jonas Weber", "+4915550101", "jonas@mail.de", 54, 22, 54]],
};

const EXTRA_STAFF: Record<string, [string, StaffMember["role"], number][]> = {
  t_saffron: [["Sumaiya Islam", "waiter", 150], ["Karim Hossain", "kitchen", 180]],
  t_harbor: [["Diego Ramos", "kitchen", 22], ["Ava Thompson", "cashier", 19]],
  t_lumen: [["Mia Schulz", "cashier", 14]],
};

const RIDERS: Record<string, [string, string][]> = {
  t_saffron: [["Babul Mia", "+8801611000123"], ["Shohel Rana", "+8801611000456"]],
  t_harbor: [["Tom Becker", "+14155550190"]],
  t_lumen: [["Lukas Braun", "+4915550190"]],
};

const PROMOS: Record<string, [string, string, "percent" | "amount", number, number][]> = {
  t_saffron: [["Weekday lunch", "LUNCH10", "percent", 10, 800], ["Family feast", "FEAST200", "amount", 200, 2500]],
  t_harbor: [["Happy hour", "HAPPY15", "percent", 15, 20]],
  t_lumen: [["Morning combo", "MORNING1", "amount", 1, 5]],
};

const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

export function buildPeople(tenantId: string, orders: Order[]): PeopleData {
  const p = tenantId.slice(2, 5);
  const branches = BRANCHES.filter((b) => b.tenantId === tenantId).map((b) => ({ ...b }));
  const first = branches[0]!.id;
  const now = Date.now();

  const customers: Customer[] = (CUSTOMERS[tenantId] ?? []).map(([name, phone, email, points, visits, spent], i) => ({
    id: `${p}_cus_${i}`,
    tenantId,
    name,
    phone,
    email,
    notes: "",
    points,
    lifetimePoints: points,
    visits,
    totalSpent: spent,
    lastVisitAt: new Date(now - (i + 1) * 86400000 * 2).toISOString(),
    ledger: [{ id: `${p}_led_${i}`, points, reason: "Opening balance", reference: "", at: new Date(now - 30 * 86400000).toISOString() }],
    createdAt: new Date(now - 60 * 86400000).toISOString(),
  }));

  const staff: StaffMember[] = [];
  for (const u of USERS) {
    const m = u.memberships.find((x) => x.tenantId === tenantId);
    if (m) staff.push({ id: `${p}_stf_${u.id}`, tenantId, userId: u.id, name: u.name, email: u.email, phone: "", role: m.role, branchIds: m.branchIds, hourlyRate: 0, active: true });
  }
  (EXTRA_STAFF[tenantId] ?? []).forEach(([name, role, rate], i) =>
    staff.push({ id: `${p}_stf_x${i}`, tenantId, userId: null, name, email: "", phone: "", role, branchIds: [first], hourlyRate: rate, active: true }),
  );

  const shifts: Shift[] = staff
    .filter((s) => s.role !== "owner")
    .flatMap((s, i) =>
      [0, 1, 2].map((d) => ({ id: `${p}_sh_${i}_${d}`, tenantId, branchId: first, staffId: s.id, staffName: s.name, date: day(d), start: i % 2 ? "15:00" : "09:00", end: i % 2 ? "23:00" : "17:00", notes: "" })),
    );

  const reservations: Reservation[] = [
    { name: "Ayesha Siddiqua", size: 4, h: 3 },
    { name: "Walk-in hold", size: 2, h: 26 },
  ].map((r, i) => ({
    id: `${p}_res_${i}`,
    tenantId,
    branchId: first,
    customerName: r.name,
    phone: customers[0]?.phone ?? "",
    partySize: r.size,
    at: new Date(Math.ceil((now + r.h * 3600000) / 1800000) * 1800000).toISOString(),
    durationMin: 90,
    tableId: null,
    tableName: null,
    status: "booked",
    notes: i === 0 ? "Window seat if possible" : "",
    createdAt: new Date(now - 86400000).toISOString(),
  }));

  const expenses: Expense[] = [
    ["utilities", "Electricity bill", 0.6],
    ["supplies", "Cleaning supplies", 0.08],
    ["maintenance", "Fridge repair", 0.25],
  ].map(([category, description, factor], i) => {
    const avg = orders.slice(0, 20).reduce((s, o) => s + o.totals.total, 0) / 20 || 10;
    return {
      id: `${p}_exp_${i}`,
      tenantId,
      branchId: first,
      category: category as Expense["category"],
      description: description as string,
      amount: Math.round(avg * 30 * (factor as number) * 100) / 100,
      paidFrom: "bank",
      date: day(-(i + 1) * 2),
      createdBy: "seed",
      createdAt: new Date(now - (i + 1) * 2 * 86400000).toISOString(),
    };
  });

  const promotions: Promotion[] = (PROMOS[tenantId] ?? []).map(([name, code, kind, value, minSpend], i) => ({
    id: `${p}_promo_${i}`,
    tenantId,
    name,
    code,
    kind,
    value,
    minSpend,
    startsAt: day(-14),
    endsAt: day(30),
    active: true,
    uses: 3 + i * 4,
    maxUses: null,
  }));

  const riders: Rider[] = (RIDERS[tenantId] ?? []).map(([name, phone], i) => ({ id: `${p}_rider_${i}`, tenantId, branchId: first, name, phone }));

  return {
    branches,
    customers,
    loyalty: { ...(LOYALTY[tenantId] ?? { spendPerPoint: 1, pointValue: 0.05 }) },
    reservations,
    riders,
    cashSessions: [] as CashSession[],
    expenses,
    staff,
    shifts,
    attendance: [] as AttendanceRecord[],
    promotions,
  };
}
