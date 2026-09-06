# OjaBridge — Shop • Connect • Grow

A multi-vendor marketplace connecting verified suppliers, retailers and customers through secure, transparent digital commerce.

## Features

### Marketplace
- **Multi-vendor marketplace** — Vendors list products, customers browse and buy
- **Product search** — Full-text search with category filtering
- **Favorites & wishlist** — Save products for later
- **Cart & checkout** — Multi-item cart with Paystack payment
- **Order tracking** — Real-time order status from placement to delivery

### Payments
- **Secure payments** — Paystack integration with webhook verification
- **Split payments** — 10% platform commission deducted before vendor settlement
- **Vendor payouts** — Automated settlement to vendor bank accounts
- **Multiple export formats** — CSV, Excel, JSON with custom date ranges

### Verification
- **KYC/KYB verification** — BVN, NIN, government ID, bank account, RC number
- **Admin review** — Approve, reject, suspend, or ban vendors/retailers
- **Email verification** — OTP-based email verification for all accounts

### Dashboards
- **Admin** (14 pages) — Users, vendors, retailers, products, orders, payments, disputes, reports, content, newsletter, security, audit logs, settings
- **Vendor** (9 pages) — Overview, products, orders, inventory, analytics, payouts, reviews, store settings, KYC
- **Retailer** (6 pages) — Overview, orders, sourcing, analytics, profile, KYC
- **Customer** (7 pages) — Account, orders, favorites, addresses, disputes, notifications, security

### AI Customer Care
- **Floating chat widget** — Appears on every page, bottom-right
- **AI-powered responses** — OpenAI GPT-4o-mini with OjaBridge knowledge base
- **Smart routing** — Only answers platform questions, redirects complex issues to support
- **Conversation history** — All chats stored in database for review

### Content Management
- **Blog, Careers, Press, Announcements** — Admin creates, public pages display
- **Image & video upload** — Featured images, gallery, YouTube embeds
- **Newsletter** — Admin composes and sends to subscribers via Brevo

### Security
- JWT authentication with HTTP-only cookies
- Rate limiting on auth and payment endpoints
- Role-based access control (RBAC)
- Webhook signature verification (HMAC-SHA512)
- Input validation and SQL injection prevention
- Security headers (CSP, XSS protection)
- AI crawler blocking (robots.txt)

## Tech Stack

- **Frontend:** Next.js 14 (React), Tailwind CSS, Recharts
- **Database:** PostgreSQL (Railway)
- **Authentication:** JWT with HTTP-only cookies
- **Payments:** Paystack
- **Email:** Brevo (Sendinblue)
- **AI Chat:** OpenAI GPT-4o-mini
- **Caching:** Redis (Upstash)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Paystack account (test mode)
- Brevo account (free tier)
- OpenAI API key (free $5 credit on signup)

### Installation

```bash
git clone https://github.com/YOUR-USERNAME/OJABRIDGE.git
cd OJABRIDGE
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

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
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=your@email.com

# OpenAI (Customer Care Chatbot)
OPENAI_API_KEY=sk-...

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

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ojabridge.dev | Admin@123! |
| Vendor | vendor@ojabridge.dev | Vendor@123! |
| Customer | customer@ojabridge.dev | Customer@123! |
| Retailer | retailer@ojabridge.dev | Retailer@123! |

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/              # 45+ API routes
│   │   │   ├── auth/         # Login, register, verify, forgot-password
│   │   │   ├── chat/         # AI customer care chatbot
│   │   │   ├── cms/          # Content management (blog, careers, press, announcements)
│   │   │   ├── contact/      # Contact form submissions
│   │   │   ├── disputes/     # Customer dispute creation and resolution
│   │   │   ├── favorites/    # Product wishlist
│   │   │   ├── kyc/          # KYC/KYB submission
│   │   │   ├── newsletter/   # Newsletter subscribe and send
│   │   │   ├── notifications/# In-app notifications
│   │   │   ├── orders/       # Order management
│   │   │   ├── payments/     # Paystack payment processing
│   │   │   ├── products/     # Product CRUD
│   │   │   ├── upload/       # File upload (base64 for Vercel)
│   │   │   ├── users/        # User management
│   │   │   └── vendors/      # Vendor management and KYC review
│   │   ├── admin-dashboard/  # 14 admin pages
│   │   ├── vendor-dashboard/ # 9 vendor pages
│   │   ├── retailer-dashboard/# 6 retailer pages
│   │   ├── account/          # 7 customer account pages
│   │   ├── blog/             # Public blog
│   │   ├── careers/          # Public careers
│   │   ├── press/            # Public press releases
│   │   ├── announcements/    # Public announcements
│   │   ├── shop/             # Product listing
│   │   ├── cart/             # Shopping cart
│   │   ├── checkout/         # Payment checkout
│   │   └── ...               # 30+ other pages
│   ├── components/           # React components
│   │   ├── ChatWidget.js     # AI customer care floating chat
│   │   ├── DashboardLayout.js# Shared dashboard layout with sidebar
│   │   ├── ExportButton.js   # Multi-format export with date range
│   │   ├── NotificationBell.js# Notification dropdown (inline, no navigation)
│   │   ├── OnboardingDemo.js # iPhone mockup interactive demo
│   │   ├── NewsletterBanner.js# Newsletter subscribe section
│   │   ├── FirstVisitPopup.js# Welcome popup for new visitors
│   │   └── ...
│   ├── context/              # React Context (Auth, Cart, Favorites)
│   └── lib/
│       ├── ai-knowledge.js   # AI chatbot knowledge base
│       ├── auth.js           # JWT authentication utilities
│       ├── csvExport.js      # CSV/Excel/JSON export utilities
│       ├── db.js             # PostgreSQL database connection
│       ├── email.js          # Brevo email service
│       ├── platform.js       # Platform configuration
│       └── paystack.js       # Paystack payment utilities
├── scripts/
│   ├── add-chat-tables.js    # Chat database migration
│   ├── run-schema.js         # Main schema migration
│   └── seed-data.js          # Test data seeder
├── supabase/
│   ├── schema.sql            # Full database schema
│   └── add-chat-tables.sql   # Chat tables migration
└── .env.local                # Environment variables (gitignored)
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
1. Set webhook URL to `https://your-domain.vercel.app/api/payments/webhook`
2. Copy webhook secret to Vercel environment variables

## License

All rights reserved.
