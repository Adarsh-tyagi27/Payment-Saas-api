# Walkthrough — Payment SaaS Integration

We built a subscription billing engine using **Node.js, Express, PostgreSQL, Redis, and Razorpay**.

## 🛠️ What We Did

### 1. Database Model
- Configured a schema containing 6 relational tables: `User`, `Plan`, `Subscription`, `Invoice`, `RefreshToken`, and `IdempotencyKey`.
- Implemented state enums for billing cycles, subscription statuses, invoice captures, and access control.

### 2. Backend Modules & Flow
- **Authentication**: JWT validation paired with Refresh Token rotation storage on logins, registration, and refresh.
- **Plans & Pricing**: Admin pricing management with public endpoint fetching.
- **Subscriptions**: Razorpay API Order mapping, and cryptographically verified payment verify handlers using standard SHA-256 HMAC tokens.
- **Billing**: Metric usage calculations and invoices history table logging.
- **Webhooks**: Timing-safe verification on incoming Razorpay requests, parsing `payment.captured`, `payment.failed`, and `subscription.cancelled` with webhook idempotency.

### 3. Frontend Implementation
- Created 4 vanilla HTML pages:
  - `index.html` (pricing selection)
  - `login.html` (auth state)
  - `dashboard.html` (active plan dashboard with Razorpay checkout triggers)
  - `billing.html` (invoices grid)
- Embedded the Razorpay Checkout standard Javascript SDK window.
- Handled API requests and token refresh rotation inside a single client wrapper `api.js`.

---

## ⚡ How to Run Locally

1. Install backend node packages:
   ```bash
   cd payment-saas/backend
   npm install
   ```

2. Make sure you have **PostgreSQL** running locally (or spin up a container) and update the `DATABASE_URL` inside `backend/.env`.

3. Run migrations and database seeder:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. Launch the Express server:
   ```bash
   npm run dev
   ```

5. Launch the frontend by opening `frontend/index.html` with your browser (e.g. using VS Code's Live Server extension running on port 5500).
