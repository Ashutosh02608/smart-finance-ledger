<div align="center">

# 💰 Smart Finance Ledger

**A production-grade personal finance application — built beyond the boilerplate.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Suite-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet?style=flat-square)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://smart-finance-ledger.vercel.app)

> Built for the **Bytex Challenge** — a full-stack financial ledger with AI-powered insights, real-time notifications, offline sync, and a Financial Health Score engine.

</div>

---

## 📖 Project Overview

Smart Finance Ledger is a lightweight but feature-rich personal finance web application. Users can track income and expenses, manage monthly budgets, visualize trends through interactive charts, and receive intelligent spending insights.

The project was built with a deliberate focus on **production quality** — not just functionality. Every feature includes proper error handling, input validation, loading states, empty states, optimistic UI patterns, and responsive design. The backend uses **Firebase Auth** for secure authentication and **Cloud Firestore** as a zero-configuration NoSQL database, with all compound queries handled in-memory to eliminate index configuration requirements.

---

## ✨ Features

### Core (Challenge Requirements)
| Feature | Details |
|---|---|
| ➕ **Add Transactions** | Title, amount, type (Income/Expense), category, date, payment method, notes |
| 📋 **View Transactions** | Paginated ledger with search, sort by date/amount/title, and filter by type/date range |
| 🏷️ **Categorize** | Pre-seeded categories (Food, Rent, Travel, Shopping, Salary, etc.) color-coded with icons |
| 📊 **Dashboard Summary** | Total balance, monthly income, expenses, net savings — all updated instantly on change |
| 🔔 **Notifications** | Internal notification center (bell dropdown + full page) with email alerts via Resend API |

### Beyond the Requirements (Unique Twist)
| Feature | Details |
|---|---|
| 💯 **Financial Health Score** | Algorithmic score (0–100) from 5 weighted factors: savings rate, expense ratio, budget discipline, emergency fund, income consistency |
| 🔮 **AI-Powered Predictions** | Daily burn rate analysis projecting month-end spend, savings, and per-category overspend risk (Low/Medium/High) |
| 🧠 **Spending Insights** | Rules-based engine comparing month-over-month category changes, flagging unusual spikes |
| 🌐 **Offline Mode** | IndexedDB FIFO sync queue — view data and queue changes while offline, syncs automatically on reconnect |
| 📧 **Email Alerts** | Resend-powered transactional emails triggered on budget exceeded and large expense events |
| 📈 **Analytics Charts** | 4 interactive Recharts graphs: monthly income vs expense, savings trend, category breakdown pie, daily spending line |
| ✏️ **Full CRUD** | Edit and delete individual transactions; bulk-select and delete multiple at once |
| 📤 **CSV Export** | One-click export of filtered transaction history to CSV |
| 🔐 **Secure Password Change** | Reauthentication-first password update flow using Firebase Client SDK |
| 🌙 **Dark / Light Mode** | Smooth system-aware theme toggle (React 19 hydration-safe) |
| 📱 **Responsive Design** | Mobile-first layout with collapsible sidebar and mobile navigation drawer |
| ⌨️ **Keyboard Search** | Cmd+K / Ctrl+K global transaction search shortcut |

---

## 🛠️ Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) | Server components, API routes, edge middleware, fast builds |
| **Language** | JavaScript (React 19) | Broad ecosystem, hooks-first UI patterns |
| **Auth** | Firebase Authentication | Passwordless setup, secure token management, edge-compatible JWTs |
| **Database** | Cloud Firestore | Document store, real-time capable, free tier sufficient for demo |
| **Styling** | TailwindCSS v4 + CSS Variables | Design token system, dark/light mode via custom properties |
| **Animations** | Framer Motion | Page transitions, micro-interactions, dropdown animations |
| **Charts** | Recharts | Composable, responsive chart components |
| **Forms** | React Hook Form + Zod | Schema-validated forms with field-level error messages |
| **Email** | Resend SDK | Reliable transactional email delivery |
| **Offline** | idb (IndexedDB) | Structured offline storage with sync queue |
| **Edge Auth** | jose | Edge-runtime-compatible JWT decoding for Next.js middleware |

---

## 📸 Screenshots

### Dashboard
![Dashboard](public/screenshots/dashboard.png)

### Transactions Ledger
![Transactions](public/screenshots/transactions.png)

### Budgets & Burn Rate Forecasts
![Budgets](public/screenshots/budgets.png)

### Analytics & Trends
![Analytics](public/screenshots/analytics.png)

### Notification Center
![Notifications](public/screenshots/notifications.png)

---

## 🏗️ Architecture

```
smart-finance-ledger/
├── src/
│   ├── app/
│   │   ├── api/                        # Next.js Route Handlers (server)
│   │   │   ├── auth/register/          # New user seeding — Firestore + welcome notification
│   │   │   ├── dashboard/              # Aggregated parallel fetch endpoint
│   │   │   ├── transactions/           # CRUD + bulk delete + CSV export
│   │   │   ├── transactions/[id]/      # Single-record PUT / DELETE (async params fix)
│   │   │   ├── budgets/                # Monthly budget management
│   │   │   ├── budgets/[id]/           # Budget edit / delete (async params fix)
│   │   │   ├── analytics/              # Chart data aggregation (6-month window)
│   │   │   ├── insights/               # Health Score + AI insights + predictions
│   │   │   ├── notifications/          # Read, mark-read, delete notifications
│   │   │   ├── export/                 # CSV generation and streaming
│   │   │   └── user/                   # Profile read / update / account delete
│   │   ├── (auth)/                     # Public routes: login, register, reset-password
│   │   └── (dashboard)/                # Protected routes: dashboard, transactions, budgets,
│   │                                   # analytics, notifications, settings
│   ├── components/
│   │   ├── ui/                         # Design system: Button, Input, Modal, Badge,
│   │   │                               # Skeleton, EmptyState, Toaster
│   │   ├── providers/                  # ThemeProvider (React 19), AuthProvider (cookie sync)
│   │   ├── dashboard/                  # Sidebar, TopNav, TransactionModal, OfflineBanner
│   │   └── charts/                     # Recharts wrapper components
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.js               # Firebase Client SDK (Auth instance)
│   │   │   ├── admin.js                # Firebase Admin SDK (Firestore, hot-reload safe)
│   │   │   ├── server-auth.js          # Edge-safe session parser using jose
│   │   │   └── seed.js                 # Firestore seeder + demo Auth account creation
│   │   ├── health-score.js             # Financial Health Score algorithm
│   │   ├── predictions.js              # Burn rate + month-end prediction engine
│   │   ├── db-local.js                 # IndexedDB offline store + FIFO sync queue
│   │   ├── resend.js                   # Email template functions (budget exceeded, large expense)
│   │   ├── utils.js                    # parseFirestoreDate helper, formatCurrency, debounce
│   │   └── validations.js              # Zod schemas for all API inputs
│   └── proxy.js                        # Next.js 16 Edge Middleware — JWT-based route protection
```

### Request Flow
```
Browser → proxy.js (Edge Middleware)
             ↓ verifies Firebase JWT via jose
             ↓ redirects unauthenticated → /login
         Next.js API Route Handler
             ↓ getSessionUser() decodes session cookie
             ↓ Firestore Admin SDK query
             ↓ in-memory filter / aggregation
         JSON Response → React Client Component
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 20+
- Firebase project with **Authentication** (Email/Password) and **Firestore** enabled
- Resend account (optional — for email notifications)

### 1. Clone & Install
```bash
git clone https://github.com/Ashutosh02608/smart-finance-ledger.git
cd smart-finance-ledger
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:

```env
# Firebase Client SDK (safe to expose publicly)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="000000000000"
NEXT_PUBLIC_FIREBASE_APP_ID="1:000000000000:web:abc123"

# Firebase Admin SDK (keep secret — from Service Account JSON)
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Resend (optional — email notifications)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Smart Finance <noreply@yourdomain.com>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Smart Finance Ledger"
```

> **Getting Firebase Admin credentials**: Firebase Console → Project Settings → Service Accounts → Generate New Private Key. Copy `client_email` and `private_key` into the env vars above.

### 3. Seed the Database
```bash
npm run db:seed
```
This will:
- Create a demo user account in Firebase Auth: `demo@smartfinance.app` / `password123`
- Populate Firestore with 60+ realistic transactions across 6 months
- Create category budgets and a welcome notification

### 4. Run Locally
```bash
npm run dev
# Open http://localhost:3000
```

Log in with `demo@smartfinance.app` / `password123` or register a new account.

---

## 🧮 Financial Health Score Algorithm

The score (0–100) is calculated server-side from 5 weighted factors using the last 3 months of data:

| Factor | Weight | Logic |
|---|---|---|
| **Savings Rate** | 30 pts | `(income − expense) / income`, scaled from 0% → 30% |
| **Expense Ratio** | 25 pts | `expense / income`, penalized when ratio exceeds 70% |
| **Budget Discipline** | 20 pts | `(1 − budgets_exceeded / total_budgets) × 20` |
| **Emergency Fund** | 15 pts | Net savings vs. average monthly expense (1, 3, 6+ months thresholds) |
| **Income Consistency** | 10 pts | Income recorded in each of the last 3 months |

**Grade scale**: A (85+) → B (70–84) → C (55–69) → D (40–54) → F (<40)

---

## 🔮 Burn Rate Prediction Engine

```
Daily Burn Rate  = Total Expenses This Month / Days Elapsed
Projected Spend  = Daily Burn Rate × Total Days In Month
Projected Saving = Total Income − Projected Spend
Per-Category Risk = LOW  (projection < 80% of budget limit)
                   MEDIUM (80–100%)
                   HIGH  (projection > 100% of limit)
```

Uses statistical daily average (not linear regression) to handle irregular spending patterns more accurately.

---

## 🤖 AI Tools Used & Where They Fell Short

### Tools Used
| Tool | How It Helped |
|---|---|
| AI code assistant | UI scaffolding, Firestore schema drafts, Zod schema boilerplate, repetitive CRUD patterns |

### Where AI Made Mistakes (and How I Fixed Them)

#### 1. 🔴 Firestore Compound Query Failures → 500 Crashes
**AI-generated code:**
```js
// AI wrote this — crashes without a manually configured Firestore composite index
db.collection('transactions')
  .where('userId', '==', uid)
  .where('date', '>=', startOfMonth(now))
  .orderBy('date', 'desc')
```
**The problem:** Firestore requires a custom composite index created in the Firebase Console for compound queries mixing equality + range filters. AI had no awareness of this operational requirement.

**My fix:** Moved all range filtering and aggregations to application-layer in-memory processing. Fetch all user-scoped documents once, then filter/sort/paginate in JavaScript. This makes the app **zero-configuration** — no index setup required on a fresh Firebase project.

---

#### 2. 🔴 Firebase Admin Hot-Reload Crashes
**AI-generated code:**
```js
// Called every time the module was imported during dev hot-reloads
db.settings({ ignoreUndefinedProperties: true }) // CRASHES on 2nd call
```
**The problem:** `settings()` can only be called once per Firestore instance. Next.js dev server hot-reloads re-import modules, triggering this multiple times and crashing the server.

**My fix:**
```js
// Cache globally, wrap settings in try/catch
if (!globalThis.firestoreDb) {
  globalThis.firestoreDb = adminApp.firestore()
  try { globalThis.firestoreDb.settings({ ignoreUndefinedProperties: true }) } catch {}
}
```

---

#### 3. 🔴 React 19 Hydration Mismatches
**AI-generated code:**
```jsx
// Renders "Good evening" on server, "Good morning" on client → hydration mismatch
const greeting = getGreeting(new Date().getHours())
return <h1>{greeting}, {user.name}</h1>
```
**The problem:** The time-of-day greeting differs between the server render (at request time) and the client render (at hydration time), which React 19 flags as an error.

**My fix:** Render a neutral placeholder during SSR and update it client-side after mount:
```jsx
const [greeting, setGreeting] = useState('Welcome')
useEffect(() => setGreeting(getGreeting(new Date().getHours())), [])
```

---

#### 4. 🔴 Next.js 16 Async `params` Bug
**AI-generated code:**
```js
// Works in Next.js 14, breaks silently in Next.js 15/16
export async function PUT(request, { params }) {
  const docRef = db.collection('transactions').doc(params.id) // params.id = undefined
}
```
**The problem:** In Next.js 15+, route segment `params` became a Promise. Accessing `.id` directly returns `undefined`, causing every update and delete API call to silently fail with a 404.

**My fix:**
```js
const { id } = await params  // must await before accessing properties
const docRef = db.collection('transactions').doc(id)
```
Applied to both `transactions/[id]/route.js` and `budgets/[id]/route.js`.

---

#### 5. 🔴 Variable Reference Error Crashing Insights API
**AI-generated code:**
```js
const currentByCategory = {}  // declared here
// ... 80 lines later ...
generateInsights(currentMonthByCategory, ...)  // referenced with wrong name → ReferenceError
```
**The problem:** AI initialized the variable as `currentByCategory` but referenced it as `currentMonthByCategory` in the prediction call 80 lines later, causing a silent server crash on every `/api/insights` request.

**My fix:** Renamed consistently to `currentMonthByCategory` throughout. Built a standalone diagnostic script to simulate the API calculation in isolation, which pinpointed the exact line.

---

#### 6. 🔴 Password Change Without Reauthentication
**AI-generated code:**
```js
await updatePassword(auth.currentUser, newPassword)
// → Firebase throws: auth/requires-recent-login
```
**The problem:** Firebase requires users who have been logged in for a while to reauthenticate before sensitive operations. AI omitted this step, making the change password feature broken for most real users.

**My fix:** Added a "Current Password" field to the dialog and implemented `reauthenticateWithCredential()` before calling `updatePassword()`:
```js
const credential = EmailAuthProvider.credential(user.email, currentPassword)
await reauthenticateWithCredential(user, credential)
await updatePassword(user, newPassword)
```

---

### Key Human Engineering Decisions

1. **Zero-Config Firestore Engine**: All compound queries replaced with in-memory filters — no Firebase Console setup required to run this project on a fresh Firebase account.

2. **Global DB Cache with Hot-Reload Safety**: `globalThis.firestoreDb` pattern prevents dev server crashes without affecting production.

3. **Dashboard Aggregation Endpoint**: Single `/api/dashboard` endpoint runs all queries in parallel via `Promise.all()`, reducing the dashboard from 6 sequential requests to 1 parallel batch.

4. **Offline FIFO Sync Queue**: Operations queued in IndexedDB are replayed sequentially to Firestore on reconnect, avoiding race conditions and data ordering issues.

5. **Signup Password Strength Validation**: Upgraded registration from a basic 6-char minimum to a full strength policy (uppercase + lowercase + number + special character) using Zod regex chains.

6. **parseFirestoreDate Utility**: Centralized safe date parser handles Firestore Timestamps, ISO strings, and Date objects uniformly — eliminating `date.toDate is not a function` crashes scattered across all API routes.

---

## 🗺️ Future Improvements

- [ ] Recurring transactions with scheduled CRON jobs (Vercel Cron or Firebase Cloud Functions)
- [ ] Bank statement CSV/PDF import with automatic categorization
- [ ] Investment portfolio tracking with live price feeds
- [ ] Shared accounts / household budget collaboration
- [ ] Mobile app with React Native + Expo (shared Firebase backend)
- [ ] Advanced ML anomaly detection for unusual spending patterns
- [ ] Multi-currency support with live exchange rates
- [ ] Two-factor authentication (SMS or TOTP)
- [ ] Data export to Excel / PDF statements

---

## 📦 Deployment

### 🌐 Live Demo
> **[https://smart-finance-ledger.vercel.app](https://smart-finance-ledger.vercel.app)**
>
> Demo credentials: `demo@smartfinance.app` / `password123`

### Deploy Your Own (Vercel)
```bash
npm install -g vercel
vercel deploy
```
Add all `.env.local` variables in **Vercel Dashboard → Project → Settings → Environment Variables**.

> ⚠️ For `FIREBASE_PRIVATE_KEY`, paste the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Vercel handles the newlines correctly.

---

## 📄 License

MIT © 2026 Ashutosh Sharma
