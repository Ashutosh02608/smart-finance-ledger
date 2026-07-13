# Smart Finance Ledger 💰

> A production-quality personal finance application with AI-powered insights, offline support, a Financial Health Score system, and Firebase Suite (Auth + Firestore) integration.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Suite-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss)

---

## 📸 Screenshots

### Dashboard
![Dashboard](public/screenshots/dashboard.png)

### Transactions Ledger
![Transactions](public/screenshots/transactions.png)

### Budgets & Forecasts
![Budgets](public/screenshots/budgets.png)

### Trends & Analytics
![Analytics](public/screenshots/analytics.png)

### Notifications Dropdown
![Notifications](public/screenshots/notifications.png)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth** | **Firebase Auth** — Register, Login, Logout, Password Reset, Current Password verification, and full Account deletion |
| 📊 **Dashboard** | Stats cards, Health Score, Budget progress, AI insights, Recent transactions |
| 💸 **Transactions** | Full CRUD, search, filter, sort, bulk delete, CSV export, pagination |
| 🎯 **Budgets** | Monthly budgets per category, progress bars, burn rate predictions |
| 📈 **Analytics** | Interactive Recharts graphs — income vs. expense comparison, category breakdown, daily spending trends |
| 🔔 **Notifications** | Internal notification center with unread count, welcome triggers, and email alerts via Resend |
| 🧠 **AI Insights** | Rules-based spending analysis comparing month-over-month category changes |
| 💯 **Health Score** | Algorithmic score out of 100 with weighted factors and recommendations |
| 🔮 **Predictions** | Smart burn rate analysis predicting month-end spending |
| 🌐 **Offline Mode** | IndexedDB local storage + sync queue for offline-first support |
| 🌙 **Dark / Light Mode** | Smooth theme toggle via next-themes (React 19 & system-aware) |
| 📱 **Responsive** | Mobile-first design with collapsible sidebar and mobile drawer |
| ⌨️ **Keyboard Shortcuts** | Cmd+K global search |

---

## 🏗 Architecture

```
src/
├── app/
│   ├── api/                 # Route Handlers (Next.js App Router)
│   │   ├── auth/            # Registration seeding
│   │   ├── transactions/    # Full CRUD + bulk delete
│   │   ├── budgets/         # Monthly budget management
│   │   ├── notifications/   # Internal notification system
│   │   ├── analytics/       # Chart data aggregation
│   │   ├── insights/        # Health Score + AI insights + predictions
│   │   ├── dashboard/       # Aggregated dashboard endpoint
│   │   ├── export/          # CSV export
│   │   └── user/            # User profile management
│   ├── (auth)/              # Login, Register, Reset Password
│   └── (dashboard)/         # Dashboard layout + all pages
├── components/
│   ├── ui/                  # Button, Input, Modal, Badge, Skeleton, EmptyState
│   ├── providers/           # ThemeProvider (React 19), AuthProvider (Session synchronization)
│   ├── dashboard/           # Sidebar, TopNav, OfflineBanner, widgets
│   └── charts/              # Recharts wrapper components
├── lib/
│   ├── firebase/            # Firebase SDK Initializers
│   │   ├── client.js        # Client-side SDK & Auth Instance
│   │   ├── admin.js         # Firebase Admin SDK & Firestore Connection
│   │   ├── server-auth.js   # jose-powered Edge Session Parser
│   │   └── seed.js          # Firestore Collections Seeder
│   ├── health-score.js      # Financial Health Score engine
│   ├── predictions.js       # Budget prediction + insight generator
│   ├── db-local.js          # IndexedDB offline store
│   ├── resend.js            # Email templates & Resend Integration
│   ├── utils.js             # Shared utilities & Safe Date Parsers
│   └── validations.js       # Zod validation schemas
├── proxy.js                 # Next.js 16 Edge Route Middleware Protection
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase Project (Authentication + Cloud Firestore database enabled)
- Resend Account (for transactional emails)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/smart-finance-ledger.git
cd smart-finance-ledger

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local` with your values:

```env
# --- Firebase Client SDK (Public) ---
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="smart-finance-ledger-deaf3.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="smart-finance-ledger-deaf3"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="smart-finance-ledger-deaf3.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="937259392568"
NEXT_PUBLIC_FIREBASE_APP_ID="1:937259392568:web:31fc42dd890fad3694d0cd"

# --- Firebase Server SDK (Private Admin) ---
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@smart-finance-ledger-deaf3.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...\n-----END PRIVATE KEY-----\n"

# --- Resend (Email) ---
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Smart Finance <noreply@yourdomain.com>"

# --- App ---
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Smart Finance Ledger"
```

### Database Seeding

```bash
# Seed Firestore collections and create the demo Auth account
npm run db:seed
```
This registers the default account `demo@smartfinance.app` with the password `password123` in Firebase Auth, creates a user profile document in Firestore, and seeds realistic transaction history, category listings, and budgets.

### Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🧮 Financial Health Score Algorithm

The score (0–100) is calculated from 5 weighted factors:

| Factor | Weight | Calculation |
|---|---|---|
| **Savings Rate** | 30 pts | `(income - expense) / income` scaled 0–30% |
| **Expense Ratio** | 25 pts | `expense / income` scaled 50%–90% |
| **Budget Discipline** | 20 pts | `(1 - exceeded/total) × 20` |
| **Emergency Fund** | 15 pts | Net savings vs avg monthly expense (1, 3, 6+ months) |
| **Income Consistency** | 10 pts | Income in each of last 3 months |

Grade: **A** (85+) → **B** (70–84) → **C** (55–69) → **D** (40–54) → **F** (<40)

---

## 🔮 Smart Budget Predictions

```
Daily Burn Rate = Expenses to Date / Days Passed
Projected Month-End = Burn Rate × Total Days in Month
Projected Savings = Income - Projected Month-End Spend
Per-Category Risk = LOW / MEDIUM / HIGH based on projection vs limit
```

---

## 🤖 AI Usage Report

### AI Tools Used
* **UI Scaffolding**: Initial React component layout and style structures.
* **Firebase Seeding Templates**: Formulating basic mock transaction generator templates.
* **Zod Schemas**: Boilerplate schema configuration matching profile settings.

### Where AI Fell Short & Human Corrections
1. **Firestore Compound Query Failures (500 Crashes)**:
   * *The Issue*: AI wrote query logic joining equality checks (`userId == uid`) and date ranges (`month >= monthStart`) directly in Firestore queries. Because Firestore requires a custom composite index configured in the Firebase Console for compound queries, this caused query exceptions that crashed the server.
   * *Human Correction*: Refactored all API routes (`/api/dashboard`, `/api/insights`, `/api/budgets`) to fetch user-scoped documents and perform range checking/aggregations **in memory**. This guarantees a **zero-configuration** database setup that is immune to index-related 500 crashes.
2. **Firebase Admin Hot-Reload Crashes**:
   * *The Issue*: AI called `db.settings({ ignoreUndefinedProperties: true })` globally on re-imported Firestore connections. During local Next.js hot-reloads, this was invoked multiple times, causing Firestore to crash since settings can only be set once.
   * *Human Correction*: Cached the Firestore reference globally (`globalThis.firestoreDb`) and wrapped the settings initialization in a `try/catch` block to absorb duplicate calls safely.
3. **React 19 & Next.js 16 Hydration Mismatches**:
   * *The Issue*: AI generated timezone-dependent greeting strings ("Good evening") and raw `<script>` tags inside client-rendered components for theme flashes. React 19 flags these as hydration mismatches.
   * *Human Correction*: Replaced inline scripts with console warning interceptors and implemented client-side mounting state gates (`mounted` checks) on timezone-dependent elements, rendering placeholder strings during initial server loads and updating them on mount.
4. **Reference Variable Errors**:
   * *The Issue*: AI initialized `currentByCategory` but referenced `currentMonthByCategory` when invoking predictive analytics, causing a silent reference error crash.
   * *Human Correction*: Built diagnostic scripts (`scratch/test-endpoints.js`) simulating API calculations and pinpointed the syntax error.
5. **Session Verification Edge Security**:
   * *The Issue*: AI suggested Node-specific JWT verification libraries that are incompatible with Next.js edge runtime environments.
   * *Human Correction*: Programmed `src/proxy.js` utilizing `jose` for lightweight, Edge-native JWT payload decoding.
6. **Firebase Password Reauthentication UX**:
   * *The Issue*: AI omitted reauthenticating users when requesting password changes, causing Firebase Auth to reject updates with a `requires-recent-login` error.
   * *Human Correction*: Designed the "Change Password" dialog to capture current credentials and trigger a reauthentication credential handshake before executing the update.

### Human Engineering Decisions (Unique Twist)
* **Zero-Config Firestore In-Memory Engine**: By moving pagination, sorting, search, and date filters from the database layer to the application layer, the project requires zero database index configuration.
* **Offline sync queue with FIFO execution**: Uses an IndexedDB FIFO queue to store actions completed offline and sync them sequentially to Firestore upon reconnection, handling network latency elegantly.
