const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();

// إعدادات الكورس (CORS) لفك الحظر عن Vercel والسماح بمرور بيانات الدخول
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '50mb' }));

// متغير اتصال قاعدة البيانات
let sql;

// =========================================================
// 🚀 إعداد السيرفر والاتصال بقاعدة البيانات
// =========================================================
async function initSecureDB() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("🚨 DATABASE_URL غير موجود في متغيرات البيئة!");
    return;
  }

  try {
    sql = postgres(dbUrl, { ssl: 'require', connect_timeout: 15 });

    await sql`CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, username VARCHAR(255) UNIQUE, pin VARCHAR(255), role VARCHAR(50))`;
    await sql`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255), price NUMERIC, old_price NUMERIC, stock INT, sold INT DEFAULT 0, details TEXT, image TEXT, category VARCHAR(255), is_sale BOOLEAN, out_of_stock BOOLEAN, modified_by VARCHAR(255))`;
    await sql`CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(255), icon VARCHAR(50), parent VARCHAR(255))`;
    await sql`CREATE TABLE IF NOT EXISTS workers (id SERIAL PRIMARY KEY, name VARCHAR(255), phone VARCHAR(255), details TEXT, image TEXT, region VARCHAR(255), city VARCHAR(255), profession VARCHAR(255), portfolio_img TEXT, safety_details TEXT, rating VARCHAR(50), is_busy BOOLEAN, hidden BOOLEAN DEFAULT false, modified_by VARCHAR(255))`;
    await sql`CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, phone VARCHAR(255), email VARCHAR(255), shop_name VARCHAR(255))`;
    await sql`CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, customer_name VARCHAR(255), customer_phone VARCHAR(255), cart_data JSONB NOT NULL, total NUMERIC NOT NULL, status VARCHAR(50) DEFAULT 'معلق', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    // إنشاء مدير افتراضي إذا لم يوجد
    const adminsCount = await sql`SELECT COUNT(*) FROM admins`;
    if (Number(adminsCount[0].count) === 0) {
      await sql`INSERT INTO admins (username, pin, role) VALUES ('adeeb', '0000', 'مدير')`;
      console.log("✅ تم إنشاء حساب المدير الافتراضي (adeeb/0000)");
    }

    // إنشاء إعدادات افتراضية
    const settingsCount = await sql`SELECT COUNT(*) FROM settings`;
    if (Number(settingsCount[0].count) === 0) {
      await sql`INSERT INTO settings (shop_name, phone) VALUES ('تشاطيب', '966500000000')`;
    }

    console.log("✅ قاعدة البيانات جاهزة ومتصلة 100%");
  } catch (e) {
    console.error("❌ خطأ في قاعدة البيانات:", e.message);
  }
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
  initSecureDB();
});

const checkDB = (req, res, next) => {
  if (!sql) return res.status(503).json({ error: "قاعدة البيانات قيد الاتصال..." });
  next();
};

app.use(checkDB);

// =========================================================
// 🔐 تسجيل الدخول (Login) - الدالة التي كانت مفقودة!
// =========================================================
app.post(['/admin/login', '/api/admin/login'], async (req, res) => {
  const { username, pin } = req.body;
  try {
    const admin = await sql`SELECT * FROM admins WHERE username = ${username} AND pin = ${pin}`;
    if (admin.length > 0) {
      res.json({ success: true, user: admin[0] });
    } else {
      res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =========================================================
// 🛒 1. إدارة الطلبات (Orders) & POS
// =========================================================
app.get('/api/orders', async (req, res) => {
  try { const r = await sql`SELECT * FROM orders ORDER BY created_at DESC`; res.json(r); } catch (e) { res.status(500).json([]); }
});
app.post('/api/orders', async (req, res) => {
  const { customer_name, customer_phone, cart_data, total } = req.body;
  try { const r = await sql`INSERT INTO orders (customer_name, customer_phone, cart_data, total) VALUES (${customer_name}, ${customer_phone}, ${cart_data}, ${total}) RETURNING *`; res.status(201).json(r[0]); } catch (e) { res.status(500).json({ error: "فشل الحفظ" }); }
});
app.delete('/api/orders/:id', async (req, res) => {
  try { await sql`DELETE FROM orders WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/orders/:id/complete', async (req, res) => {
  try { await sql`UPDATE orders SET status = 'مكتمل' WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/pos/checkout', async (req, res) => {
  try { const { cart } = req.body; for (let item of cart) { await sql`UPDATE products SET stock = stock - ${item.qty}, sold = COALESCE(sold, 0) + ${item.qty} WHERE id = ${item.id}`; } res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/pos/refund', async (req, res) => {
  try { const { cart, order_id } = req.body; for (let item of cart) { await sql`UPDATE products SET stock = stock + ${item.qty}, sold = GREATEST(0, sold - ${item.qty}) WHERE id = ${item.id}`; } if(order_id) await sql`DELETE FROM orders WHERE id = ${order_id}`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// =========================================================
// 📦 2. المنتجات (Products)
// =========================================================
app.get('/api/products', async (req, res) => {
  try { const r = await sql`SELECT * FROM products ORDER BY id DESC`; res.json(r); } catch (e) { res.status(500).json([]); }
});
app.post('/api/products', async (req, res) => {
  const p = req.body;
  try { await sql`INSERT INTO products (name, price, old_price, stock, details, image, category, is_sale, out_of_stock, modified_by) VALUES (${p.name}, ${p.price}, ${p.old_price}, ${p.stock}, ${p.details}, ${p.image}, ${p.category}, ${p.is_sale}, ${p.out_of_stock}, ${p.modified_by})`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/products/:id', async (req, res) => {
  const p = req.body;
  try { await sql`UPDATE products SET name=${p.name}, price=${p.price}, old_price=${p.old_price}, stock=${p.stock}, details=${p.details}, image=${p.image}, is_sale=${p.is_sale}, out_of_stock=${p.out_of_stock}, sold=${p.sold || 0}, modified_by=${p.modified_by} WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/products/:id', async (req, res) => {
  try { await sql`DELETE FROM products WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// =========================================================
// 🗂️ 3. الأقسام (Categories)
// =========================================================
app.get('/api/categories', async (req, res) => {
  try { const r = await sql`SELECT * FROM categories`; res.json(r); } catch (e) { res.status(500).json([]); }
});
app.post('/api/categories', async (req, res) => {
  try { await sql`INSERT INTO categories (name, icon, parent) VALUES (${req.body.name}, ${req.body.icon}, ${req.body.parent})`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/categories/:id', async (req, res) => {
  try { await sql`DELETE FROM categories WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// =========================================================
// 👷‍♂️ 4. العمال (Workers)
// =========================================================
app.get('/api/workers', async (req, res) => {
  try { const r = await sql`SELECT * FROM workers ORDER BY id DESC`; res.json(r); } catch (e) { res.status(500).json([]); }
});
app.post('/api/workers', async (req, res) => {
  const w = req.body;
  try { await sql`INSERT INTO workers (name, phone, details, image, region, city, profession, portfolio_img, safety_details, rating, is_busy, hidden, modified_by) VALUES (${w.name}, ${w.phone}, ${w.details}, ${w.image}, ${w.region}, ${w.city}, ${w.profession}, ${w.portfolio_img}, ${w.safety_details}, ${w.rating}, ${w.is_busy}, false, ${w.modified_by})`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/workers/:id', async (req, res) => {
  const w = req.body;
  try { await sql`UPDATE workers SET name=${w.name}, phone=${w.phone}, details=${w.details}, image=${w.image}, region=${w.region}, city=${w.city}, profession=${w.profession}, portfolio_img=${w.portfolio_img}, safety_details=${w.safety_details}, rating=${w.rating}, is_busy=${w.is_busy}, hidden=${w.hidden}, modified_by=${w.modified_by} WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/workers/:id', async (req, res) => {
  try { await sql`DELETE FROM workers WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/workers/:id/click', async (req, res) => { res.json({ success: true }); });

// =========================================================
// 👥 5. المدراء (Admins)
// =========================================================
app.get('/api/admins', async (req, res) => {
  try { const r = await sql`SELECT * FROM admins`; res.json(r); } catch (e) { res.status(500).json([]); }
});
app.post('/api/admins', async (req, res) => {
  try { await sql`INSERT INTO admins (username, pin, role) VALUES (${req.body.username}, ${req.body.pin}, ${req.body.role})`; res.json({ success: true }); } catch (e) { res.status(400).json({ error: "الاسم مكرر" }); }
});
app.put('/api/admins/:id', async (req, res) => {
  try { await sql`UPDATE admins SET username=${req.body.username}, pin=${req.body.pin}, role=${req.body.role} WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/admins/:id/pin', async (req, res) => {
  try { const r = await sql`UPDATE admins SET pin=${req.body.newPin} WHERE id = ${req.params.id} RETURNING *`; res.json(r[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/admins/:id', async (req, res) => {
  try { await sql`DELETE FROM admins WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// =========================================================
// ⚙️ 6. الإعدادات (Settings)
// =========================================================
app.get('/api/settings', async (req, res) => {
  try { const r = await sql`SELECT * FROM settings LIMIT 1`; res.json(r.length ? r[0] : { shop_name: '', phone: '' }); } catch (e) { res.status(500).json({}); }
});
app.put('/api/settings', async (req, res) => {
  try {
    const check = await sql`SELECT id FROM settings LIMIT 1`;
    if (check.length > 0) { await sql`UPDATE settings SET shop_name=${req.body.shop_name}, phone=${req.body.phone} WHERE id = ${check[0].id}`; } 
    else { await sql`INSERT INTO settings (shop_name, phone) VALUES (${req.body.shop_name}, ${req.body.phone})`; }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});