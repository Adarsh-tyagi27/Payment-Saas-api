# PaySaaS — Subscription Billing Engine

A production-ready, multi-tenant subscription billing engine built with **Node.js, PostgreSQL, Redis, and Razorpay**.

This project demonstrates clean architecture patterns, secure webhook signature verification, webhook idempotency checks, token-based authentication (JWT + Refresh rotation), and rate-limiting.

---

## 🏗️ Architecture

```
                       ┌────────────────────────┐
                       │  Frontend (HTML5/CSS3) │
                       └───────────┬────────────┘
                                   │ HTTPS
                       ┌───────────▼────────────┐
                       │   Express API Server   │
                       └───────────┬────────────┘
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
  │  PostgreSQL  │          │    Redis     │          │   Razorpay   │
  │ (Prisma ORM) │          │ (Rate limit) │          │ (Payments)   │
  └──────────────┘          └──────────────┘          └──────────────┘
```

---

## ⚡ Technical Highlights

1. **Robust Payment Flows**: Leverages Razorpay Checkout integration with cryptographic signature verification (HMAC SHA-256) on payment validation.
2. **Webhook Security**: Timing-safe signature checks on Razorpay webhooks to prevent spoofing and timing attacks.
3. **Webhook Idempotency**: Stores processed event IDs to prevent duplicate database operations/renewals from delivery retries.
4. **Token Security**: JWT Access Tokens (15m expiry) paired with stored database Refresh Tokens (7d expiry) implementing secure Token Rotation.
5. **Rate Limiting**: Custom limits backed by Redis per endpoint category (Auth, Core API, Admin).
6. **Data Integrity**: Uses PostgreSQL transaction layers (`$transaction`) when modifying user subscriptions and recording invoice state.

---

## 🚀 Local Setup

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (v18+)

### 2. Start Infrastructure
Start PostgreSQL and Redis:
```bash
docker-compose up -d
```

### 3. Configure Environment
Create a `.env` file in the `backend/` directory following `.env.example`:
```ini
DATABASE_URL="postgresql://admin:secret123@localhost:5432/payment_saas?schema=public"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-minimum-32-characters"
RAZORPAY_KEY_ID="rzp_test_xxxxxx"
RAZORPAY_KEY_SECRET="xxxxxx"
RAZORPAY_WEBHOOK_SECRET="xxxxxx"
```

### 4. Install & Run Backend
Navigate to the `backend/` directory:
```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

### 5. Launch Frontend
Open `frontend/index.html` in your browser (e.g. using VS Code Live Server running at `http://127.0.0.1:5500` or `http://localhost:5500`).
