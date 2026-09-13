# OjaBridge — Shop • Connect • Grow

A multi-vendor e-commerce marketplace connecting verified suppliers, retailers and customers through secure, transparent digital commerce. Built for Nigeria-first launch with Paystack-powered payments.

## Live Demo

Visit [ojabridge.vercel.app](https://ojabridge.vercel.app)

## Features

### Marketplace
- **Multi-vendor marketplace** — Vendors list products, customers browse and buy
- **Product search** — Full-text search with category filtering
- **Favorites & wishlist** — Save products for later
- **Cart & checkout** — Multi-item cart with Paystack payment
- **Order tracking** — Real-time order status from placement to delivery
- **Vendor stores** — Each vendor has their own branded storefront

### Payments (Paystack)
- **Secure payments** — Card, bank transfer, USSD via Paystack
- **Split payments** — 10% platform commission deducted before vendor settlement
- **Buyer protection** — Money held in escrow until the customer confirms delivery
- **Vendor payouts** — Withdraw earnings to bank account after delivery confirmation
- **Double-payment protection** — One Paystack reference per order; duplicate charges are flagged for refund review, never double-counted
- **Escrow lifecycle** — Wallet entry `pending` (paid, escrow) → `eligible` (delivery confirmed, withdrawable) → `settled` (paid out)

### Verification (KYC/KYB)
- **4-step verification** — Personal info, BVN/NIN, bank account, business info
- **Admin review** — Approve, reject, suspend, ban, or request more documents from vendors/retailers
- **Email verification** — OTP-based verification for all accounts
- **Private documents** — KYC identity files are stored non-public and served only to the owner and authorized reviewers through an SSRF-hardened proxy; sensitive numbers (BVN/NIN/account) are always masked in API responses
- **Bank details editing** — Vendors/retailers can update their payout bank record from the KYC page after verification

### Dashboards
- **Admin** (18 pages) — Overview, users, customers, vendors, retailers, products, orders, payments, disputes, reports, content, newsletter, security, audit logs, settings, settlements, sub-admins, live chats
- **Vendor** (11 pages) — Overview, products, orders, inventory, analytics, payouts, reviews, store settings, KYC, disputes, notifications
- **Retailer** (8 pages) — Overview, orders, sourcing, analytics, profile, KYC, disputes, notifications
- **Customer** (7 pages) — Account, orders, addresses, profile, disputes, notifications, security

### Live Support Chat
- **Real-time chat widget** — Customers, vendors and retailers chat with support from any dashboard
- **Admin dashboard** — Super admins see all conversations; authorized live-support sub-admins see their assigned and unassigned/open conversations
- **Assignment workflow** — Super admin assigns conversations to live-support sub-admins; assignments persist server-side and drive inbox visibility
- **Conversation status** — Open, Active, Closed states with real-time polling
- **User identification** — Shows sender name, email and role in admin view
- **Conversation history** — All messages stored in database for review
- **Mobile-stable input** — Chat textarea uses visualViewport sizing so the iOS keyboard never hides the composer

### Content Management (Admin)
- **Blog, Careers, Press, Announcements** — Admin creates, public pages display
- **Image & video upload** — Featured images, gallery, YouTube embeds
- **Newsletter** — Admin composes and sends to subscribers via Brevo
- **Announcements** — Platform-wide announcements visible to all users

### Export & Reporting
- **Multiple formats** — CSV, Excel, JSON with OjaBridge branding
- **Custom date ranges** — Filter exports by any date period
- **Available on** — Admin, Vendor, and Retailer dashboards
- **Covers** — Orders, payments, disputes, analytics, settlements

### Security
- JWT authentication with HTTP-only cookies
- Rate limiting on auth, payment, chat, and upload endpoints
- Role-based access control (RBAC); sub-admin permissions enforced server-side on every API route (never trusted from the client)
- Payment initialization requires an authenticated session and order ownership; amounts are always server-calculated
- Payment verification is idempotent per transaction AND per order, with duplicate payments flagged for refund review
- Webhook signature verification (HMAC-SHA512, timing-safe comparison)
- Input validation and SQL injection prevention (parameterized queries)
- Security headers (CSP, XSS protection) and suspicious user-agent blocking
- Chat conversation isolation between users
- KYC documents private by default with owner/reviewer-only access and SSRF protection

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14, Tailwind CSS, Recharts | SSR for speed, utility CSS, charts |
| Database | PostgreSQL (Railway) | ACID compliance for payments |
| Auth | JWT + HTTP-only cookies | Stateless, secure, scalable |
| Payments | Paystack | Africa's leading processor, split payments |
| Email | Brevo (Sendinblue) | Free tier, transactional + newsletter |
| Live Chat | In-app polling chat | Human support, zero third-party dependency |
| Cache | Redis (Upstash) | Serverless-friendly caching |
| Deployment | Vercel | One-click deploy, serverless functions |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Railway)
- Paystack account (test mode)
- Brevo account (free tier)

### Installation

```bash
git clone https://github.com/YOUR-USERNAME/OJABRIDGE.git
cd OJABRIDGE
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your own keys:

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-key

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_WEBHOOK_SECRET=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...

# Brevo Email
BREVO_API_KEY=your-brevo-key
BREVO_SENDER_EMAIL=your@email.com


# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/              # 49 API routes
│   │   ├── auth/         # Login, register, verify, forgot-password
│   │   ├── live-chat/    # Live customer support chat
│   │   ├── cms/          # Content management
│   │   ├── contact/      # Contact form submissions
│   │   ├── disputes/     # Customer dispute creation and resolution
│   │   ├── favorites/    # Product wishlist
│   │   ├── kyc/          # KYC/KYB submission
│   │   ├── newsletter/   # Newsletter subscribe and send
│   │   ├── notifications/# In-app notifications
│   │   ├── orders/       # Order management
│   │   ├── payments/     # Paystack payment processing
│   │   ├── products/     # Product CRUD
│   │   ├── upload/       # File upload (base64 for Vercel)
│   │   ├── users/        # User management
│   │   └── vendors/      # Vendor management and KYC review
│   ├── admin-dashboard/  # 15 admin pages
│   ├── vendor-dashboard/ # 10 vendor pages
│   ├── retailer-dashboard/# 7 retailer pages
│   ├── account/          # 7 customer account pages
│   ├── shop/             # Product listing
│   ├── cart/             # Shopping cart
│   ├── checkout/         # Payment checkout
│   └── ...               # 30+ other pages
├── components/           # React components
│   ├── LiveChat.js       # Live support chat widget
│   ├── DashboardLayout.js# Shared dashboard layout with sidebar
│   ├── ExportButton.js   # Multi-format export with date range
│   ├── NotificationBell.js# Notification dropdown
│   ├── OnboardingDemo.js # iPhone mockup interactive demo
│   └── ...
├── context/              # React Context (Auth, Cart, Favorites)
└── lib/
    ├── auth.js           # JWT authentication utilities
    ├── csvExport.js      # CSV/Excel/JSON export utilities
    ├── db.js             # PostgreSQL database connection
    ├── email.js          # Brevo email service
    ├── platform.js       # Platform configuration
    └── paystack.js       # Paystack payment utilities
```

## Deployment

### Vercel (Frontend + API)
1. Push to GitHub
2. Connect repository on vercel.com
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Railway (Database)
1. Create PostgreSQL database on railway.app
2. Run `schema.sql` on the database console
3. Run `add-chat-tables.sql` for chat feature
4. Copy the `DATABASE_URL` to Vercel environment variables

### Paystack Webhook
1. Set webhook URL to `https://your-domain.vercel.app/api/webhooks/paystack`
2. Copy webhook secret to Vercel environment variables

## Page Count

- **34 public pages** — Homepage, shop, categories, about, contact, policies, how-it-works, favorites, support, product detail, vendor storefronts, order tracking
- **7 customer pages** — Account, orders, addresses, profile, disputes, notifications, security
- **11 vendor pages** — Overview, products, orders, inventory, analytics, payouts, reviews, store, KYC, disputes, notifications
- **8 retailer pages** — Overview, orders, sourcing, analytics, KYC, profile, disputes, notifications
- **17 admin pages** — Overview, users, vendors, retailers, products, orders, payments, disputes, reports, content, newsletter, security, audit, settings, settlements, sub-admins, live chats
- **4 auth pages** — Login, register, verify-email, forgot-password

**Total: 77 pages**

## License

All rights reserved.
