# Smart Finance Ledger 💰

> A production-quality personal finance SaaS application with AI-powered insights, offline support, and a Financial Health Score system.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss)

---

## 📸 Screenshots

> _(Add screenshots of: Dashboard, Transactions, Analytics, Budgets, Settings here)_

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth** | Supabase Auth — Register, Login, Logout, Password Reset, Email Verification |
| 📊 **Dashboard** | Stats cards, Health Score, Budget progress, AI insights, Recent transactions |
| 💸 **Transactions** | Full CRUD, search, filter, sort, bulk delete, CSV export, pagination |
| 🎯 **Budgets** | Monthly budgets per category, progress bars, burn rate predictions |
| 📈 **Analytics** | 6 interactive Recharts graphs — income, expense, savings, daily, category, net worth |
| 🔔 **Notifications** | Internal notification center with unread count, bulk clear, email alerts via Resend |
| 🧠 **AI Insights** | Rules-based spending analysis comparing month-over-month category changes |
| 💯 **Health Score** | Algorithmic score out of 100 with weighted factors and recommendations |
| 🔮 **Predictions** | Smart burn rate analysis predicting month-end spending |
| 🌐 **Offline Mode** | IndexedDB local storage + sync queue for offline-first support |
| 🌙 **Dark / Light Mode** | Smooth theme toggle via next-themes |
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
│   ├── dashboard/           # Sidebar, TopNav, OfflineBanner, widgets
│   └── charts/              # Recharts wrapper components
├── lib/
│   ├── prisma.js            # Prisma singleton
│   ├── supabase/            # Client + Server Supabase factories
│   ├── health-score.js      # Financial Health Score engine
│   ├── predictions.js       # Budget prediction + insight generator
│   ├── db-local.js          # IndexedDB offline store
│   ├── resend.js            # Email templates
│   ├── utils.js             # Shared utilities
│   └── validations.js       # Zod schemas
├── middleware.js             # Auth route protection
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Supabase project
- Resend account (for emails)

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
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Smart Finance <noreply@yourdomain.com>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Setup

```bash
# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed

# (Optional) Open Prisma Studio
npm run db:studio
```

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

## 📦 Deployment

### Vercel (Recommended)

```bash
vercel deploy

# Set environment variables in Vercel Dashboard → Settings → Environment Variables
```

### Environment Variables Required on Vercel

Same as `.env.local` above.

---

## 🐳 Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🤖 AI Usage Report

### AI Tools Used

AI assistance accelerated development in the following areas:

- **UI Scaffolding**: Initial component structure and layout patterns
- **CRUD Generation**: Basic API route handler boilerplate
- **Prisma Models**: Initial schema drafts and relation definitions
- **Form Validation**: Initial Zod schema structures
- **Boilerplate**: Repetitive pattern generation (loading states, error handling patterns)

### Where AI Failed

AI tools produced code that required significant human correction:

- **Incorrect validation logic**: AI missed edge cases in amount/date validation (negative amounts, future dates)
- **Redundant state management**: Multiple useState calls that should have been consolidated into a single object or custom hook
- **Inefficient Prisma queries**: AI suggested N+1 query patterns for budget enrichment (fetching spent amount per budget in a loop) — replaced with a single aggregated query pattern
- **Hallucinated APIs**: Referenced non-existent Supabase SSR APIs (`createMiddlewareClient` which was deprecated)
- **Poor component structure**: Over-engineered prop drilling without proper composition
- **Missing edge cases**: Offline mode sync queue didn't handle race conditions or retry failures
- **Weak error handling**: API routes returned generic 500 errors without proper user-facing messages

### Human Engineering Decisions

The following were designed, architected, and implemented entirely through engineering judgment:

1. **Financial Health Score Engine** (`lib/health-score.js`): Designed the 5-factor weighted scoring algorithm with thresholds calibrated for Indian financial context (30% savings rate target, ₹10k large expense threshold)

2. **Offline Sync Architecture**: Chose IndexedDB with FIFO sync queue over Service Workers for simpler mental model and predictable conflict resolution behavior

3. **Database Indexing Strategy**: Added compound indexes on `[userId, date]`, `[userId, type]`, and `[userId, category]` to ensure O(log n) performance on all common filter combinations

4. **Optimistic UI Pattern**: Dashboard updates immediately in IndexedDB; server sync happens asynchronously. This ensures zero-latency UX even on slow connections

5. **Email Fire-and-Forget**: Budget exceeded and large expense emails use `setImmediate()` to not block the API response, preventing email failures from affecting transaction saving

6. **`/api/dashboard` Aggregation Endpoint**: A single endpoint that runs all dashboard queries in parallel using `Promise.all()`, reducing page load from 6 sequential requests to 1 parallel batch

7. **Burn Rate Prediction Algorithm**: Designed using statistical daily average rather than linear projections to handle irregular spending patterns correctly

8. **Sidebar Collapse with CSS Variables**: Used a combination of Framer Motion width animation and CSS custom properties (rather than conditional rendering) to preserve sidebar state across navigation

9. **Category Seeding on Registration**: Default categories are seeded per-user on registration (not globally) to support future per-user customization without schema changes

10. **Upsert Pattern for Budgets**: Used Prisma's `upsert` with compound unique key `[userId, category, month]` to prevent duplicate budget records from form re-submissions

---

## 🔮 Future Improvements

- [ ] Recurring transactions with CRON jobs
- [ ] Investment portfolio tracking
- [ ] Shared accounts / household budgets
- [ ] Bank statement CSV import
- [ ] Mobile app (React Native)
- [ ] Advanced debt tracking module
- [ ] AI-powered anomaly detection using ML models
- [ ] Multi-currency conversion with live rates
- [ ] Receipt photo scanning

---

## 📄 License

MIT © 2024 Smart Finance Ledger
