# Multi-Tenant Restaurant POS: Frontend vs Backend Gap Analysis Report

> **তারিখ**: ৩০ অক্টোবর ২০২৬  
> **প্রজেক্টের ধরন**: Multi-Tenant Restaurant POS & Management System (Monorepo: NestJS + React TanStack Router)  
> **বিশ্লেষণের উদ্দেশ্য**: সম্পূর্ণ কোডবেস অডিট করে কোন কোন ফিচার এখনও শুধুমাত্র Frontend-এ (Mock / Local Storage / In-memory) সীমাবদ্ধ আছে এবং Backend-এর সাথে কোনো সংযোগ নেই বা ইন্টিগ্রেশন বাকি আছে তা চিহ্নিত করা।

---

## ১. সারাংশ (Executive Summary)

প্রজেক্টের আর্কিটেকচার পর্যালোচনা করে দেখা গেছে যে, অ্যাপ্লিকেশনটির প্রধান কোর মডিউলসমূহ (যেমন: ক্যাটাগরি, মেনু আইটেম, পিওএস অর্ডার তৈরি, কিচেন স্ট্যাটাস আপডেট, টেবিল ম্যানেজমেন্ট, সাপ্লায়ার ও পারচেজ অর্ডার, কাস্টমার এবং লয়্যালটি টায়ার) সফলভাবে NestJS ব্যাকএন্ড ও PostgreSQL ডাটাবেজের সাথে যুক্ত হয়েছে।

তবে এখনও এমন বেশ কিছু ক্রিটিক্যাল বিজনেস মডিউল রয়েছে যা **সম্পূর্ণ ফ্রন্টএন্ড মক (In-Memory `tenantDb` বা `localStorage`)**-এ চলছে। এগুলোকে ৩টি প্রধান ক্যাটাগরিতে ভাগ করা হয়েছে:
1. **Category A (সম্পূর্ণ অনুপস্থিত Backend)**: ব্যাকএন্ডে কোনো ডাটাবেজ মডেল (Prisma), সার্ভিস বা কন্ট্রোলার নেই—পুরোটাই ফ্রন্টএন্ডে সিমুলেট করা।
2. **Category B (Backend তৈরি আছে, কিন্তু Frontend যুক্ত হয়নি)**: ব্যাকএন্ডে API রেডি থাকা সত্ত্বেও ফ্রন্টএন্ড এখনও মক ডাটা ব্যবহার করছে।
3. **Category C (আংশিক বা একমুখী ইন্টিগ্রেশন)**: মূল ভিউ ব্যাকএন্ড থেকে আসলেও কিছু গুরুত্বপূর্ণ অ্যাকশন (যেমন Void/Cancel বা Refund) লোকাল স্টেটে রয়ে গেছে।

---

## ২. Category A: সম্পূর্ণ Frontend-Only ফিচার (Backend-এ কোনো অস্তিত্ব নেই)

এই ফিচারগুলোর জন্য ব্যাকএন্ডে কোনো Prisma Schema মডেল, সার্ভিস বা REST API কন্ট্রোলার নেই। এগুলো অবিলম্বে ব্যাকএন্ডে ডেভেলপ করা প্রয়োজন:

### ১. ক্যাশ ড্রয়ার সেশন ও শিফট ম্যানেজমেন্ট (Cash Drawer / Shift Register)
* **ফ্রন্টএন্ড ফাইল**: [`app.$tenantSlug.finance.cash.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.finance.cash.tsx), [`money.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/money.service.ts#L100-L150)
* **বর্তমান অবস্থা**: সম্পূর্ণ ইন-মেমোরি মক (`tenantDb(tenantId).cashSessions`)।
* **যেসব ফাংশনালিটি ফ্রন্টএন্ডে সীমাবদ্ধ**:
  * ক্যাশ ড্রয়ার ওপেন করা (`openCashSession` - ওপেনিং ব্যালেন্স/ফ্লোট ইনপুট)।
  * পে-ইন এবং পে-আউট এন্ট্রি দেওয়া (`addCashEntry` - ড্রয়ার থেকে ক্যাশ উত্তোলন বা জমা)।
  * শিফট ক্লোজ ও ক্যাশ কাউন্ট রিকনসিলিয়েশন (`closeCashSession` - ক্লোজিং ক্যাশ হিসাব এবং শর্টেজ/সারপ্লাস চেক)।
* **প্রয়োজনীয় Backend কাজ**: `CashSession` ও `CashEntry` প্রিজমা মডেল তৈরি এবং `CashDrawerModule` (কন্ট্রোলার + সার্ভিস) তৈরি।

### ২. খরচের হিসাব / পেটি ক্যাশ (Expenses & Petty Cash)
* **ফ্রন্টএন্ড ফাইল**: [`app.$tenantSlug.finance.expenses.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.finance.expenses.tsx), [`money.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/money.service.ts#L157-L190)
* **বর্তমান অবস্থা**: সম্পূর্ণ ইন-মেমোরি মক (`tenantDb(tenantId).expenses`)।
* **যেসব ফাংশনালিটি ফ্রন্টএন্ডে সীমাবদ্ধ**:
  * রেস্তোরাঁর দৈনন্দিন খরচ এন্ট্রি (`createExpense` - ইউটিলিটি, মজুরি, ভাড়া, সাপ্লাই ইত্যাদি)।
  * ব্যাংক বনাম ক্যাশ ড্রয়ার থেকে খরচ পে করার হিসাব।
  * খরচের তালিকা ও ডিলিট করা (`listExpenses`, `deleteExpense`)।
* **প্রয়োজনীয় Backend কাজ**: `Expense` প্রিজমা মডেল এবং `ExpenseController` (`GET/POST/DELETE /tenants/:slug/expenses`) তৈরি।

### ৩. ডেলিভারি ডিসপ্যাচ ও রাইডার ম্যানেজমেন্ট (Delivery & Riders Dispatch)
* **ফ্রন্টএন্ড ফাইল**: [`app.$tenantSlug.delivery.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.delivery.tsx), [`money.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/money.service.ts#L195-L235)
* **বর্তমান অবস্থা**: রাইডার তালিকা ও ডেলিভারি ট্র্যাকিং সম্পূর্ণ মক (`tenantDb(tenantId).riders`)। ব্যাকএন্ডের `Order` মডেলে কেবল `riderId` ও `riderName` ফিল্ড আছে, কিন্তু রাইডার ম্যানেজমেন্টের কোনো অস্তিত্ব নেই।
* **যেসব ফাংশনালিটি ফ্রন্টএন্ডে সীমাবদ্ধ**:
  * নতুন রাইডার যুক্ত করা (`saveRider`).
  * অর্ডারে রাইডার অ্যাসাইন করা এবং ডেলিভারি স্ট্যাটাস ট্র্যাকিং (`updateDelivery` - pending, assigned, out, delivered)।
* **প্রয়োজনীয় Backend কাজ**: `Rider` মডেল, রাইডারদের CRUD API, এবং অর্ডারে রাইডার ডিসপ্যাচ করার স্পেসিফিক এন্ডপয়েন্ট (`PATCH /orders/:id/delivery`)।

### ৪. স্টাফ শিডিউলিং ও শিফট (Staff Shifts)
* **ফ্রন্টএন্ড ফাইল**: [`app.$tenantSlug.team.shifts.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.team.shifts.tsx), [`people.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/people.service.ts#L618-L670)
* **বর্তমান অবস্থা**: রাউটটিতে রিডাইরেক্ট দেওয়া হয়েছে (`redirect to /team`)। সার্ভিসে `listShifts`, `saveShift`, `deleteShift` কোড রয়েছে যা সম্পূর্ণ লোকাল মক। ব্যাকএন্ডে কোনো শিফট মডেল নেই।
* **প্রয়োজনীয় Backend কাজ**: `StaffShift` মডেল এবং রোস্টার শিডিউলিং API।

### ৫. স্টাফ অ্যাটেনডেন্স ও ক্লক-ইন/আউট (Staff Attendance & Time Clock)
* **ফ্রন্টএন্ড ফাইল**: [`app.$tenantSlug.team.attendance.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.team.attendance.tsx), [`people.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/people.service.ts#L671-L710)
* **বর্তমান অবস্থা**: রাউটটি রিডাইরেক্ট করা। সার্ভিসে `listAttendance`, `toggleClock` শুধুমাত্র মক।
* **প্রয়োজনীয় Backend কাজ**: `StaffAttendance` মডেল এবং ক্লক-ইন/ক্লক-আউট API।

### ৬. কাস্টম রোল তৈরি (Custom Roles & Dynamic Permissions)
* **ফ্রন্টএন্ড ফাইল**: [`app.$tenantSlug.team.roles.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.team.roles.tsx#L50-L60), [`people.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/people.service.ts#L1085-L1140)
* **বর্তমান অবস্থা**: ফিক্সড সিস্টেম রোলগুলোর (`manager`, `cashier`, `waiter`, `kitchen`) পারমিশন আপডেট ব্যাকএন্ডের সাথে যুক্ত। কিন্তু ইউজার যখন নতুন কোনো কাস্টম রোল তৈরি করে (`saveCustomRole`), তখন তা ব্রাউজারের `localStorage` (`tenant_custom_roles_<tenantId>`) এ সেভ হয়!
* **প্রয়োজনীয় Backend কাজ**: ডাইনামিক `Role` ও `RolePermission` টেবিল আর্কিটেকচার (বর্তমানে ব্যাকএন্ডে কেবল ফিক্সড `Role` enum রয়েছে)।

### ৭. রেস্তোরাঁ ব্র্যান্ডিং, অ্যাম্বিয়েন্স, থিম ও ট্যাক্স সেটিংস (Tenant Settings)
* **ফ্রন্টএন্ড ফাইল**: [`app.$tenantSlug.settings.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.settings.tsx), [`brand-ambience-tab.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/features/settings/brand-ambience-tab.tsx), [`taxes-charges-tab.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/features/settings/taxes-charges-tab.tsx), [`receipt-security-tab.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/features/settings/receipt-security-tab.tsx)
* **বর্তমান অবস্থা**: সেটিংস পেজে লোগো পরিবর্তন, প্রিভিউ কালার থিম সিলেকশন, ট্যাক্স রেট, সার্ভিস চার্জ এবং রিসিট ফুটার নোট পরিবর্তন করা হলে তা শুধুমাত্র ইন-মেমোরি `TENANTS` অবজেক্ট এবং `localStorage`-এ সেভ হয় (`stage4.updateTenantSettings`)। ব্যাকএন্ডে কোনো সেটিংস আপডেট কন্ট্রোলার নেই।
* **প্রয়োজনীয় Backend কাজ**: `PATCH /tenants/:tenantSlug/settings` এন্ডপয়েন্ট তৈরি করা যা লোগো URL, থিম আইডি, ট্যাক্স রেট ও রিসিট কনফিগারেশন ডাটাবেজে সংরক্ষণ করবে।

### ৮. ড্যাশবোর্ড ওভারভিউ মেট্রিক্স (Dashboard Aggregated Summary)
* **ফ্রন্টএন্ড ফাইল**: [`app.$tenantSlug.dashboard.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.dashboard.tsx), [`operations.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/operations.service.ts#L1271-L1307)
* **বর্তমান অবস্থা**: ড্যাশবোর্ডের সেলস চার্ট, দৈনিক সেলস, মোট অর্ডার সংখ্যা, টপ সেলিং আইটেম ইত্যাদি ফ্রন্টএন্ডে ক্লায়েন্ট-সাইডে লুপ চালিয়ে গণনা করা হয়। ব্যাকএন্ডে ড্যাশবোর্ডের কোনো অ্যাগ্রিগেশন সার্ভিস বা এন্ডপয়েন্ট নেই।
* **প্রয়োজনীয় Backend কাজ**: `GET /tenants/:tenantSlug/dashboard/summary?branchId=...` তৈরি করা।

### ৯. ইনভেন্টরি ও অপারেশন রিপোর্টস (Inventory & Operations Reports)
* **ফ্রন্টএন্ড ফাইল**: [`app.$tenantSlug.reports.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.reports.tsx), [`stage4.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/stage4.service.ts#L430-L530)
* **বর্তমান অবস্থা**: সেলস ও ফাইন্যান্সিয়াল রিপোর্ট ব্যাকএন্ডের অর্ডার লিস্ট থেকে হিসেব করে। কিন্তু **ইনভেন্টরি ভ্যালুয়েশন রিপোর্ট** (`getInventoryReport`) এবং **অপারেশন স্ট্যাটাস রিপোর্ট** (`getOperationsReport`) ১০০% লোকাল মক।
* **প্রয়োজনীয় Backend কাজ**: ইনভেন্টরি স্টক ভ্যালুয়েশন এবং রেস্তোরাঁ অপারেশন মেকানিক্সের ডেডিকেটেড অ্যানালিটিক্স কুয়েরি তৈরি।

### ১০. থার্ড পার্টি ইন্টিগ্রেশন (Integrations / Marketplace)
* **ফ্রন্টএন্ড ফাইল**: [`stage4.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/stage4.service.ts#L750-L780)
* **বর্তমান অবস্থা**: `listIntegrations` এবং `toggleIntegration` ১০০% মক।

---

## ৩. Category B: Backend API তৈরি আছে, কিন্তু Frontend এখনও Mock ব্যবহার করছে

এই ফিচারগুলোর জন্য ব্যাকএন্ডে NestJS কন্ট্রোলার ও ডাটাবেজ মডেল সম্পূর্ণ প্রস্তুত আছে, কিন্তু ফ্রন্টএন্ড সার্ভিস এখনও ব্যাকএন্ডে কল না দিয়ে লোকাল স্টোরেজে কাজ করছে:

| ফিচার | ফ্রন্টএন্ড ফাইল | বর্তমান ফ্রন্টএন্ড অবস্থা | প্রস্তুত থাকা Backend এন্ডপয়েন্ট | করণীয় |
| :--- | :--- | :--- | :--- | :--- |
| **Stock Counts (ইনভেন্টরি ফিজিক্যাল কাউন্ট)** | [`stock-counts.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.inventory.stock-counts.tsx), [`stock.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/stock.service.ts#L170-L210) | `tenantDb(tenantId).stockCounts` এ পুশ হচ্ছে | `POST /tenants/:tenantSlug/inventory/stock-counts`<br>`GET /tenants/:tenantSlug/inventory/stock-counts` | ফ্রন্টএন্ড সার্ভিসে `backendFetch` দিয়ে কল যুক্ত করা। |
| **Stock Movements (স্টক হিস্ট্রি লগ)** | [`stock-movements.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.inventory.stock-movements.tsx), [`operations.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/operations.service.ts#L1143-L1147) | লোকাল মক `tenantDb.movements` থেকে ১০০টি আইটেম পড়ে | `GET /tenants/:tenantSlug/inventory/movements`<br>`GET /tenants/:tenantSlug/stock-movements` | `listMovements()`-এ ব্যাকএন্ড কল বসানো। |
| **Stock Manual Adjustment (স্টক সমন্বয়/ওয়েস্টেজ)** | [`inventory.index.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.inventory.index.tsx), [`stock.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/stock.service.ts#L150-L168) | `adjustStock()` শুধু লোকাল অবজেক্ট আপডেট করে | `POST /tenants/:tenantSlug/inventory/adjust`<br>`POST /tenants/:tenantSlug/stock-movements/adjust` | ব্যাকএন্ড অ্যাডজাস্টমেন্ট API কল করা। |
| **Change Password (পাসওয়ার্ড পরিবর্তন)** | [`password-change-card.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/features/settings/password-change-card.tsx#L35-L45) | `setTimeout(resolve, 600)` দিয়ে ফেক সাকসেস টোস্ট দেখায় | `POST /auth/change-password` | রিয়েল ব্যাকএন্ড কল বসানো। |
| **Top Bar Branch Switcher (ব্রাঞ্চ ড্রপডাউন)** | [`app.$tenantSlug.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.tsx#L70), [`platform.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/platform.service.ts#L125) | হার্ডকোডেড `BRANCHES` কনস্ট্যান্ট থেকে ফিল্টার করে | `GET /tenants/:tenantSlug/branches` | `peopleApi.allBranches` বা ব্যাকএন্ড ব্রাঞ্চ লিস্ট ব্যবহার করা। |
| **Reservation Rules & Settings** | [`reservations.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/app.$tenantSlug.reservations.tsx) | কোনো সেটিংস সেভ হয় না | `GET/PUT /tenants/:tenantSlug/reservation-settings` | বুকিং উইন্ডো, ক্যান্সেলেশন রুল ইত্যাদি ইন্টিগ্রেট করা। |

---

## ৪. Category C: আংশিক ইন্টিগ্রেশন ও মিসিং ওয়ার্কফ্লো

কিছু মডিউলে প্রধান কাজগুলো ব্যাকএন্ডে হলেও নিচের সাব-ফিচারগুলো লোকাল স্টেটে রয়ে গেছে:

1. **অর্ডার রিফান্ড (Order Refunds)**:
   * **কোড**: [`RefundDialog`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/features/payments/refund-dialog.tsx), [`money.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/money.service.ts#L40-L75)
   * **সমস্যা**: ডাটাবেজ মডেলে `OrderRefund` টেবিল রয়েছে এবং `FinanceController`-এ রিফান্ড হিস্ট্রি দেখা যায়। কিন্তু **নতুন রিফান্ড ইস্যু করার জন্য কোনো ব্যাকএন্ড এন্ডপয়েন্ট নেই**। ফ্রন্টএন্ডে রিফান্ড ইস্যু করলে তা ডাটাবেজে যায় না।
2. **অর্ডার বাতিল / ভয়েড (Order Void / Cancel)**:
   * **কোড**: [`operations.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/operations.service.ts#L727-L745)
   * **সমস্যা**: পিওএস থেকে কোনো রানিং বা আনপেইড অর্ডার ক্যানসেল করা হলে (`cancelOrder`) ব্যাকএন্ডে কোনো API কল হয় না। শুধু লোকাল মকে স্ট্যাটাস `cancelled` হয়। ব্যাকএন্ডে `PATCH /tenants/:slug/orders/:id/cancel` প্রয়োজন।
3. **ক্যাটাগরি রি-অর্ডারিং (Category Drag/Move Order)**:
   * **কোড**: [`catalog.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/catalog.service.ts#L75-L100)
   * **সমস্যা**: ক্যাটাগরি উপরে বা নিচে মুভ করলে (`moveCategory`) কোনো ব্যাকএন্ড কল হয় না।
4. **পাসওয়ার্ড রিসেট ফ্লো (Forgot/Reset Password)**:
   * **কোড**: [`forgot-password.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/forgot-password.tsx), [`reset-password.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/reset-password.tsx)
   * **সমস্যা**: এখানে লেখা রয়েছে `MockNotice: Passwords are not stored.` এবং কোনো ইমেইল পাঠানো বা টোকেন ভ্যালিডেশনের ব্যাকএন্ড সার্ভিস নেই।
5. **মাল্টি-টেন্যান্ট ওয়ার্কস্পেস সিলেকশন (Workspace Select)**:
   * **কোড**: [`workspace.select.tsx`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/routes/workspace.select.tsx), [`platform.service.ts`](file:///d:/Orvio/multi-tenant-restaurant-pos/apps/frontend/src/services/platform.service.ts#L115)
   * **সমস্যা**: ব্যবহারকারী কোন কোন রেস্তোরাঁয় অ্যাক্সেস রাখে তা ব্যাকএন্ডের পরিবর্তে হার্ডকোডেড `TENANTS` অ্যারে থেকে আনা হয়। `GET /auth/me/tenants` ব্যাকএন্ডে নেই।

---

## ৫. Category D: যে ফিচারগুলো ইতিমধ্যেই সফলভাবে Backend-এ যুক্ত আছে

তুলনা করার সুবিধার্থে নিচে অলরেডি কানেক্টেড মডিউলগুলোর তালিকা দেওয়া হলো:
* ✅ **অথেনটিকেশন**: লগইন (`/auth/login`), রিফ্রেশ টোকেন, স্টাফ ইনভাইট ডিটেইলস ও অ্যাকসেপ্ট ইনভাইট।
* ✅ **মেনু ও ক্যাটালগ**: মেনু ক্যাটাগরি (CRUD), মেনু আইটেম (CRUD + Availability), মডিফায়ার গ্রুপস (CRUD), কম্বো মিলস (CRUD), রেসিপি কস্টিং ও রেসিপি সেভ।
* ✅ **পিওএস অর্ডার প্রসেসিং**: নতুন অর্ডার ক্রিয়েট, অ্যাডিশনাল অর্ডার লাইনস যুক্ত করা, কিচেন স্ট্যাটাস অ্যাডভান্স (`/kitchen/advance`, `/kitchen/status`), সার্ভড মার্ক করা, অর্ডারের বিপরীতে পেমেন্ট রেকর্ড করা।
* ✅ **ডাইনিং টেবিল**: টেবিল তৈরি, আপডেট, ডিলিট, লেআউট পজিশন এবং টেবিল অকুপেন্সি স্ট্যাটাস আপডেট।
* ✅ **সাপ্লায়ার ও পারচেজিং**: সাপ্লায়ার CRUD, পারচেজ অর্ডার তৈরি/আপডেট/স্ট্যাটাস চেঞ্জ, গুডস রিসিট (GRN) গ্রহণ, সাপ্লায়ার রিটার্ন।
* ✅ **ইনভেন্টরি আইটেমস**: ইনগ্রেডিয়েন্ট তৈরি, আপডেট ও ডিলিট।
* ✅ **কাস্টমার ও লয়্যালটি**: কাস্টমার CRUD, লয়্যালটি পয়েন্ট অ্যাডজাস্ট, লয়্যালটি টিয়ারস (CRUD), লয়্যালটি গ্লোবাল সেটিংস।
* ✅ **প্রমোশন / ডিসকাউন্ট**: প্রমোশন কোড তৈরি, কুপন ভ্যালিডেশন এবং ডিলিট।
* ✅ **টিম ও স্টাফ**: স্টাফ মেম্বার তৈরি, ইনভাইটেশন পাঠানো, এডিট, ডিলিট এবং সিস্টেম রোল পারমিশন ম্যাট্রিক্স আপডেট।
* ✅ **ফাইন্যান্স লেজার**: অল ট্রানজ্যাকশন লেজার (পেমেন্টস হিস্ট্রি)।
* ✅ **অডিট লগ**: রিয়েল-টাইম সিস্টেম অডিট লগিং, ফিল্টারিং ও স্ট্যাটস।
* ✅ **নোটিফিকেশন**: Socket.io রিয়েল-টাইম গেটওয়ে, নোটিফিকেশন ফেচ ও মার্ক অ্যাজ রিড।

---

## ৬. প্রায়োরিটি অ্যাকশন প্ল্যান (Recommended Roadmap)

| প্রায়োরিটি | মডিউল | কী কাজ করতে হবে |
| :--- | :--- | :--- |
| **High** (P0) | **Cash Drawer & Sessions** | ব্যাকএন্ডে শিফট ওপেন/ক্লোজ এবং ক্যাশ এন্ট্রি মডেল ও API তৈরি করা। |
| **High** (P0) | **Order Refund & Cancel API** | ব্যাকএন্ডে `POST /orders/:id/refund` এবং `PATCH /orders/:id/cancel` যুক্ত করা। |
| **High** (P0) | **Stock Counts & Adjustments Integration** | অলরেডি রেডি থাকা ব্যাকএন্ড এন্ডপয়েন্টগুলোতে ফ্রন্টএন্ড কোড যুক্ত করা। |
| **Medium** (P1) | **Tenant Settings API** | রেস্তোরাঁর ট্যাক্স, সার্ভিস চার্জ, কারেন্সি, লোগো ও রিসিট ফুটার ডাটাবেজে সংরক্ষণের API তৈরি। |
| **Medium** (P1) | **Dashboard Aggregation API** | ক্লায়েন্ট-সাইড ক্যালকুলেশন বাদ দিয়ে ব্যাকএন্ড থেকে দ্রুত সারাংশ কুয়েরি দেওয়া। |
| **Medium** (P1) | **Expenses Management** | পেটি ক্যাশ ও খরচ এন্ট্রি মডেল এবং কন্ট্রোলার তৈরি। |
| **Low** (P2) | **Delivery & Riders Module** | রাইডারদের জন্য ডাটাবেজ মডেল এবং ডেলিভারি ট্র্যাকিং API। |
| **Low** (P2) | **Shifts & Attendance** | স্টাফদের রোস্টার ও সময় গণনা ফিচার ব্যাকএন্ডে আনা। |
