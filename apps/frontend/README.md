# Multi-Tenant Restaurant POS & Management SaaS (Frontend)

A production-grade, multi-tenant cloud **Point of Sale (POS)** and **Restaurant Operations Management** web application built with **React 19**, **TypeScript**, **TanStack Router**, **Redux Toolkit & RTK Query**, and **Tailwind CSS 4**.

---

## 🚀 Key Modules & Feature Highlights

### 1. Point of Sale (POS) & Service
- **Interactive POS Terminal (`/pos`)**: Fast search, category filtering, combo builders, variants and modifier group dialogs, and split billing with $O(1)$ Redux line item management.
- **Keyboard Shortcuts**: `F2` to trigger checkout & payment, `Escape` to close dialogs.
- **Table Management (`/tables`)**: Visual dining floor plan, table statuses (Available, Occupied, Reserved, Billing, Dirty), party sizes, and order assignment.
- **Kitchen Display System (`/kitchen`)**: Live Kanban ticket queue (New → Preparing → Ready) with automatic updates and fullscreen mode.
- **Order Tracking & Delivery (`/orders`, `/delivery`)**: 5 order types (`dine_in`, `takeaway`, `pickup`, `counter`, `delivery`) with rider dispatching.

### 2. Guests, Money & Finance
- **Customer CRM & Loyalty (`/customers`)**: Automatic point accumulation on checkout, spend history, and tier management.
- **Promotions & Discounts (`/promotions`)**: Percentage and fixed discount codes with minimum spend rules.
- **Payments & Refunds (`/finance`)**: Cash, card, and digital QR payments with split tenders, change calculation, and full/partial refund tracking.
- **Cash Drawer & Shifts (`/finance/cash`)**: Cash In/Out auditing, opening floats, closing reconciliation, and variance tracking.
- **Expenses Ledger (`/finance/expenses`)**: Categorized petty cash and operating expenses.

### 3. Menu, Inventory & Purchasing
- **Menu Engineering (`/menu`, `/recipes`)**: Categories, items, variants, modifiers, and food costing recipes with automated stock deduction.
- **Inventory Operations (`/inventory`)**: Real-time stock counts, waste recording, and movement logs.
- **Purchasing & Suppliers (`/purchasing/*`, `/suppliers`)**: Purchase order lifecycle, receiving, and supplier returns.

### 4. Team, Analytics & Platform (Stage 4)
- **Reports & Analytics (`/reports`)**:
  - **Sales**: Daily trends, hourly rush distributions, and top selling dishes.
  - **Financial**: Gross vs Net sales, taxes collected, discounts, refunds, and payment method shares.
  - **Inventory**: Stock valuation, wastage cost, and low-stock reorder warnings.
  - **Operations**: Kitchen fulfillment time, table turnover, and staff roster summaries.
  - **Exporting**: One-click CSV report downloads.
- **Notifications Center (`/notifications`)**: Real-time operational alerts and low-stock notices with read/unread filtering.
- **Audit Logs (`/audit-logs`)**: Complete audit trail of administrative actions, price updates, order voids, and refunds.
- **Settings & Tenant Branding (`/settings`)**:
  - Customizable restaurant identity, initials, tagline, and live theme accent colors.
  - Currency codes and regional tax & service charge rates.
  - Printed 80mm thermal receipt footer customization.
  - Simulated third-party integrations (Stripe, bKash, Uber Eats, DoorDash, Xero, Twilio).

---

## 🛠️ Technology Stack

- **UI Framework**: React 19 + TypeScript 5.8
- **Bundler**: Vite 8.1.5 with Rolldown
- **Routing**: TanStack Router (File-based, 100% type-safe routing)
- **State Management**: Redux Toolkit (Cart draft with `createEntityAdapter`, Session, UI)
- **Server Data Layer**: RTK Query (Centralized caching, tags, and mock services)
- **Styling**: Tailwind CSS 4 + Radix UI Primitives + Lucide React Icons
- **Data Visualization**: Recharts (Sales area charts, hourly bar charts, category pies)
- **Testing**: Vitest + React Testing Library

---

## 🔑 Demo Access Credentials

The frontend prototype includes pre-seeded demo restaurants and user accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Owner** | `owner@demo.pos` | `demo1234` |
| **Manager** | `manager@demo.pos` | `demo1234` |
| **Cashier** | `cashier@demo.pos` | `demo1234` |
| **Kitchen** | `kitchen@demo.pos` | `demo1234` |

Demo Tenants:
- **Saffron & Ember** (`saffron-ember`) — Charcoal grill & curry house (BDT)
- **Harbor Noodle Co.** (`harbor-noodle`) — Hand-pulled noodles & bao (USD)
- **Café Lumen** (`cafe-lumen`) — Specialty coffee & bakery (EUR)

---

## 💻 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit and service test suites
npm run test

# Type-check TypeScript codebase
npx tsc --noEmit

# Check and fix formatting
npm run format:fix
npm run lint

# Production build
npm run build
```
