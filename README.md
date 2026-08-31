# OjaBridge — Shop • Connect • Grow

A multi-vendor marketplace connecting verified suppliers, retailers and customers through secure, transparent digital commerce.

## Features

- **Multi-vendor marketplace** — Vendors list products, customers browse and buy
- **Secure payments** — Paystack integration with webhook verification and idempotency
- **Role-based dashboards** — Admin, Vendor, Customer and Retailer interfaces
- **Vendor verification** — KYC/KYB with BVN, NIN, bank account and RC number verification
- **Order management** — Full order lifecycle from payment to delivery
- **Real-time notifications** — In-app notifications for orders, payments and account events
- **Email notifications** — Transactional emails via Brevo for order confirmations and updates
- **Analytics** — Dashboard charts for sales, orders and revenue tracking
- **Search & favorites** — Product search with category filtering and wishlist
- **Responsive design** — Works on desktop, tablet and mobile

## Tech Stack

- **Frontend:** Next.js 14 (React), Tailwind CSS
- **Database:** PostgreSQL (Railway)
- **Authentication:** JWT with HTTP-only cookies
- **Payments:** Paystack
- **Email:** Brevo (Sendinblue)
- **File Storage:** Cloudinary
- **Charts:** Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Paystack account (test mode)
- Brevo account (free tier)

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
PAYSTACK_PUBLIC_KEY=pk_test_...

# Brevo Email
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=your@email.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
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
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── admin-dashboard/
│   │   ├── vendor-dashboard/
│   │   ├── retailer-dashboard/
│   │   └── account/
│   ├── components/       # React components
│   ├── context/          # React Context providers
│   └── lib/              # Utilities (auth, email, paystack, db)
├── public/               # Static assets
└── .env                  # Environment variables (not committed)
```

## Security

- JWT authentication with HTTP-only cookies
- Rate limiting on auth and payment endpoints
- CSRF protection
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- Webhook signature verification (HMAC-SHA512)
- Role-based access control (RBAC)
- Security headers (CSP, XSS protection, etc.)

## License

All rights reserved.
