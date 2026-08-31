/**
 * OJABRIDGE — Seed Test Data (v3 — matches actual schema)
 * Run: node scripts/seed-data.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

function uuid() { return crypto.randomUUID(); }

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🌱 Seeding OjaBridge database...\n');

    const hash = await bcrypt.hash('Admin@123!', 12);
    const custHash = await bcrypt.hash('Customer@123!', 12);
    const vendHash = await bcrypt.hash('Vendor@123!', 12);
    const retHash = await bcrypt.hash('Retailer@123!', 12);

    const adminId = uuid();
    const customerId = uuid();
    const vendorUserId = uuid();
    const retailerId = uuid();

    // ========== USERS ==========
    await client.query(`INSERT INTO users (id, email, password_hash, name, role, country, currency, email_verified, status) VALUES 
      ($1, 'admin@ojabridge.dev', $2, 'OjaBridge Admin', 'admin', 'NG', 'NGN', true, 'active'),
      ($3, 'customer@ojabridge.dev', $4, 'Chidinma Eze', 'customer', 'NG', 'NGN', true, 'active'),
      ($5, 'vendor@ojabridge.dev', $6, 'Adebayo Stores', 'vendor', 'NG', 'NGN', true, 'active'),
      ($7, 'retailer@ojabridge.dev', $8, 'Fatima Retail Co', 'retailer', 'NG', 'NGN', true, 'active')
    ON CONFLICT (email) DO NOTHING
    `, [adminId, hash, customerId, custHash, vendorUserId, vendHash, retailerId, retHash]);
    console.log('✅ Users created/skipped');

    // Get actual IDs
    const vendUser = await client.query(`SELECT id FROM users WHERE email = 'vendor@ojabridge.dev'`);
    const actualVendorUserId = vendUser.rows[0]?.id || vendorUserId;
    const custUser = await client.query(`SELECT id FROM users WHERE email = 'customer@ojabridge.dev'`);
    const actualCustomerId = custUser.rows[0]?.id || customerId;

    // ========== VENDOR PROFILE ==========
    const existingVendor = await client.query(`SELECT id FROM vendors WHERE user_id = $1`, [actualVendorUserId]);
    let vendorId;
    if (existingVendor.rows.length > 0) {
      vendorId = existingVendor.rows[0].id;
      console.log('✅ Vendor profile exists');
    } else {
      vendorId = uuid();
      await client.query(`INSERT INTO vendors (id, user_id, store_name, store_slug, business_name, business_type, rc_number, business_address, business_city, business_country, business_phone, business_email, product_categories, kyc_status, bank_verification_status, total_earnings, pending_earnings, settled_earnings, total_commission_paid, average_rating, total_reviews, total_orders, store_views) VALUES 
        ($1, $2, 'Adebayo Electronics', 'adebayo-electronics', 'Adebayo Enterprises Ltd', 'Limited Liability Company', 'RC-123456', '15 Toyin Street, Ikeja', 'Lagos', 'NG', '+2348012345678', 'adebayo@ojabridge.dev', ARRAY['Electronics', 'Phones', 'Accessories'], 'VERIFIED', 'VERIFIED', 2450000, 180000, 2270000, 245000, 4.5, 89, 156, 3200)
      `, [vendorId, actualVendorUserId]);
      console.log('✅ Vendor profile created');
    }

    // ========== PRODUCTS ==========
    const existingProds = await client.query(`SELECT COUNT(*) as c FROM products WHERE vendor_id = $1`, [vendorId]);
    let productIds = [];
    if (parseInt(existingProds.rows[0].c) > 0) {
      const existing = await client.query(`SELECT id FROM products WHERE vendor_id = $1`, [vendorId]);
      productIds = existing.rows.map(r => r.id);
      console.log(`✅ ${productIds.length} products exist`);
    } else {
      const products = [
        { name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra', price: 899000, category: 'Phones', desc: 'Latest Samsung flagship with S Pen and 200MP camera', stock: 25 },
        { name: 'iPhone 15 Pro Max', slug: 'iphone-15-pro-max', price: 1200000, category: 'Phones', desc: 'Apple latest with titanium design and A17 Pro chip', stock: 18 },
        { name: 'MacBook Air M3', slug: 'macbook-air-m3', price: 1450000, category: 'Laptops', desc: 'Ultra-thin laptop with M3 chip, 15-inch display', stock: 12 },
        { name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5', price: 185000, category: 'Accessories', desc: 'Industry-leading noise cancelling headphones', stock: 45 },
        { name: 'JBL Charge 5', slug: 'jbl-charge-5', price: 75000, category: 'Accessories', desc: 'Portable Bluetooth speaker with deep bass', stock: 60 },
        { name: 'iPad Pro 12.9 M2', slug: 'ipad-pro-12-9-m2', price: 980000, category: 'Tablets', desc: 'Most powerful iPad with M2 chip and Liquid Retina XDR', stock: 15 },
        { name: 'Dell XPS 15', slug: 'dell-xps-15', price: 1100000, category: 'Laptops', desc: 'Premium laptop with 13th gen Intel and OLED display', stock: 8 },
        { name: 'AirPods Pro 2', slug: 'airpods-pro-2', price: 120000, category: 'Accessories', desc: 'Apple wireless earbuds with adaptive audio', stock: 80 },
        { name: 'Samsung 65" Smart TV', slug: 'samsung-65-smart-tv', price: 650000, category: 'Electronics', desc: '65-inch QLED 4K Smart TV with Tizen OS', stock: 10 },
        { name: 'PS5 Console', slug: 'ps5-console', price: 480000, category: 'Gaming', desc: 'Sony PlayStation 5 disc edition with DualSense controller', stock: 20 },
        { name: 'Nintendo Switch OLED', slug: 'nintendo-switch-oled', price: 250000, category: 'Gaming', desc: 'Handheld gaming console with vibrant OLED screen', stock: 30 },
        { name: 'Anker PowerBank 26800', slug: 'anker-powerbank-26800', price: 35000, category: 'Accessories', desc: 'High-capacity portable charger with fast charging', stock: 55 },
      ];

      for (const p of products) {
        const pid = uuid();
        productIds.push(pid);
        await client.query(`INSERT INTO products (id, vendor_id, name, slug, description, price, category, stock_quantity, moderation_status, is_active, is_featured, images, countries_available) VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', true, $9, '{}', ARRAY['NG'])
        `, [pid, vendorId, p.name, p.slug, p.desc, p.price, p.category, p.stock, p.price > 500000]);
      }
      console.log(`✅ ${products.length} products created`);
    }

    // ========== ORDERS ==========
    const existingOrders = await client.query(`SELECT COUNT(*) as c FROM orders`);
    if (parseInt(existingOrders.rows[0].c) === 0) {
      const orderStatuses = ['completed', 'processing', 'shipped', 'delivered', 'pending', 'completed', 'completed'];
      const paymentStatuses = ['paid', 'paid', 'paid', 'paid', 'pending', 'paid', 'paid'];
      const allProducts = [
        { name: 'Samsung Galaxy S24 Ultra', price: 899000 },
        { name: 'iPhone 15 Pro Max', price: 1200000 },
        { name: 'MacBook Air M3', price: 1450000 },
        { name: 'Sony WH-1000XM5', price: 185000 },
        { name: 'JBL Charge 5', price: 75000 },
        { name: 'iPad Pro 12.9 M2', price: 980000 },
        { name: 'Dell XPS 15', price: 1100000 },
      ];

      for (let i = 0; i < 7; i++) {
        const oid = uuid();
        const product = allProducts[i];
        const qty = Math.floor(Math.random() * 3) + 1;
        const subtotal = product.price * qty;
        const shipping = 2500;
        const total = subtotal + shipping;

        await client.query(`INSERT INTO orders (id, order_number, user_id, status, payment_status, subtotal, shipping_cost, total, currency, shipping_address, created_at) VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, 'NGN', $9, NOW() - INTERVAL '${i + 1} days')
        `, [
          oid, `ORD-${String(1000 + i).padStart(6, '0')}`, actualCustomerId,
          orderStatuses[i], paymentStatuses[i],
          subtotal, shipping, total,
          JSON.stringify({ line1: '12 Victoria Island', city: 'Lagos', state: 'Lagos', country: 'NG' })
        ]);

        await client.query(`INSERT INTO order_items (id, order_id, product_id, vendor_id, product_name, quantity, unit_price, total_price, vendor_payout, status) VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [uuid(), oid, productIds[i % productIds.length], vendorId, product.name, qty, product.price, subtotal, subtotal * 0.9, orderStatuses[i]]);
      }
      console.log('✅ 7 orders with items created');
    } else {
      console.log('✅ Orders exist, skipping');
    }

    // ========== TRANSACTIONS (correct columns) ==========
    const existingTxn = await client.query(`SELECT COUNT(*) as c FROM transactions`);
    if (parseInt(existingTxn.rows[0].c) === 0) {
      const orderRows = await client.query(`SELECT id, user_id, total, payment_status FROM orders`);
      for (const o of orderRows.rows) {
        const amount = o.total;
        await client.query(`INSERT INTO transactions (id, order_id, user_id, paystack_reference, amount, currency, status, payment_method, commission_amount, vendor_amount, verified_at, created_at) VALUES 
          ($1, $2, $3, $4, $5, 'NGN', $6, 'card', $7, $8, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
        `, [
          uuid(), o.id, o.user_id,
          `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          amount,
          o.payment_status === 'paid' ? 'completed' : 'pending',
          Math.round(amount * 0.1),
          Math.round(amount * 0.9),
        ]);
      }
      console.log('✅ Transactions created');
    } else {
      console.log('✅ Transactions exist, skipping');
    }

    // ========== REVIEWS (correct columns) ==========
    const existingRev = await client.query(`SELECT COUNT(*) as c FROM reviews`);
    if (parseInt(existingRev.rows[0].c) === 0) {
      const reviewTexts = [
        { title: 'Excellent product', comment: 'Excellent product! Fast delivery and great quality.' },
        { title: 'Good quality', comment: 'Good quality, exactly as described. Happy with my purchase.' },
        { title: 'Highly recommend', comment: 'Amazing seller, highly recommend! Will buy again.' },
        { title: 'Perfect condition', comment: 'Product arrived in perfect condition. Thank you!' },
        { title: 'Great value', comment: 'Great value for money. Very satisfied with this purchase.' },
      ];
      for (let i = 0; i < 5; i++) {
        await client.query(`INSERT INTO reviews (id, user_id, product_id, vendor_id, rating, title, comment, is_verified_purchase, created_at) VALUES 
          ($1, $2, $3, $4, $5, $6, $7, true, NOW() - INTERVAL '${i + 2} days')
        `, [uuid(), actualCustomerId, productIds[i], vendorId, 5 - Math.floor(i/2), reviewTexts[i].title, reviewTexts[i].comment]);
      }
      console.log('✅ 5 reviews created');
    } else {
      console.log('✅ Reviews exist, skipping');
    }

    // ========== NOTIFICATIONS (correct columns: is_read not read) ==========
    const existingNotif = await client.query(`SELECT COUNT(*) as c FROM notifications`);
    if (parseInt(existingNotif.rows[0].c) === 0) {
      const notifs = [
        { title: 'Order Confirmed', body: 'Your order ORD-001000 has been confirmed', type: 'order' },
        { title: 'Payment Received', body: 'Payment of ₦1,202,500 received successfully', type: 'payment' },
        { title: 'Order Shipped', body: 'Your order has been shipped via DHL Express', type: 'shipping' },
        { title: 'New Review', body: 'A customer left a 5-star review on your product', type: 'review' },
        { title: 'Welcome to OjaBridge', body: 'Thank you for joining the marketplace! Explore now.', type: 'system' },
      ];
      for (const n of notifs) {
        // Customer notifications
        await client.query(`INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES 
          ($1, $2, $3, $4, $5, false, NOW() - INTERVAL '1 day')
        `, [uuid(), actualCustomerId, n.type, n.title, n.body]);
        // Vendor notifications
        await client.query(`INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES 
          ($1, $2, $3, $4, $5, false, NOW() - INTERVAL '1 day')
        `, [uuid(), actualVendorUserId, n.type, n.title, n.body]);
      }
      console.log('✅ 10 notifications created');
    } else {
      console.log('✅ Notifications exist, skipping');
    }

    // ========== CURRENCIES ==========
    await client.query(`INSERT INTO currencies (code, name, symbol, is_active, exchange_rate_to_ngn) VALUES 
      ('NGN', 'Nigerian Naira', '₦', true, 1),
      ('USD', 'US Dollar', '$', true, 1550),
      ('GBP', 'British Pound', '£', true, 1960),
      ('EUR', 'Euro', '€', true, 1690)
    ON CONFLICT (code) DO NOTHING`);
    console.log('✅ Currencies seeded');

    // ========== BLOG POST ==========
    const existingBlog = await client.query(`SELECT COUNT(*) as c FROM blog_posts`);
    if (parseInt(existingBlog.rows[0].c) === 0) {
      await client.query(`INSERT INTO blog_posts (id, title, slug, excerpt, content, author, category, status, published_at) VALUES 
        ($1, 'Welcome to OjaBridge: Shop, Connect, Grow', 'welcome-to-ojabridge', 'Introducing OjaBridge — the marketplace connecting verified vendors with customers and retailers across Africa.', 'OjaBridge is a multi-vendor marketplace designed to bring trust, verification and secure payments to African commerce...', 'OjaBridge Team', 'OjaBridge Updates', 'published', NOW())
      `, [uuid()]);
      console.log('✅ Blog post seeded');
    } else {
      console.log('✅ Blog posts exist, skipping');
    }

    await client.query('COMMIT');
    console.log('\n🎉 All seed data created!');

    // Final summary
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM vendors) as vendors,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM orders) as orders,
        (SELECT COUNT(*) FROM order_items) as order_items,
        (SELECT COUNT(*) FROM transactions) as transactions,
        (SELECT COUNT(*) FROM reviews) as reviews,
        (SELECT COUNT(*) FROM notifications) as notifications
    `);
    const c = counts.rows[0];
    console.log(`\n📊 Database Summary:
   Users: ${c.users}
   Vendors: ${c.vendors}
   Products: ${c.products}
   Orders: ${c.orders}
   Order Items: ${c.order_items}
   Transactions: ${c.transactions}
   Reviews: ${c.reviews}
   Notifications: ${c.notifications}`);

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
