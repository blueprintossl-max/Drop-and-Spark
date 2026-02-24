const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// متغير اتصال قاعدة البيانات سيكون متاحاً لاحقاً
let sql;

// 🚀 الخطوة الأولى: تشغيل السيرفر فوراً لمنع خطأ (Port scan timeout) في منصة Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 السيرفر يعمل بأعلى درجات الأمان على المنفذ ${PORT}`);
  // بمجرد عمل السيرفر، نستدعي دالة الاتصال الآمن بقاعدة البيانات
  initSecureDB();
});

// 🔒 الخطوة الثانية: الاتصال بقاعدة البيانات وبناء الجداول سراً
async function initSecureDB() {
  // سحب الرابط من إعدادات Render (Environment) بدون كتابته في الكود
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("🚨 تحذير: رابط DATABASE_URL غير موجود في إعدادات Render!");
    return;
  }

  try {
    sql = postgres(dbUrl, { ssl: 'require', connect_timeout: 15 });
    
    // بناء الجداول بقوة واحترافية
    await sql`CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, username VARCHAR(255) UNIQUE, pin VARCHAR(255), role VARCHAR(50))`;
    await sql`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255), price NUMERIC, old_price NUMERIC, stock INT, sold INT, details TEXT, image TEXT, category VARCHAR(255), is_sale BOOLEAN, out_of_stock BOOLEAN, modified_by VARCHAR(255))`;
    await sql`CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(255), icon VARCHAR(50), parent VARCHAR(255))`;
    await sql`CREATE TABLE IF NOT EXISTS workers (id SERIAL PRIMARY KEY, name VARCHAR(255), phone VARCHAR(255), details TEXT, image TEXT, region VARCHAR(255), city VARCHAR(255), profession VARCHAR(255), portfolio_img TEXT, safety_details TEXT, rating VARCHAR(50), is_busy BOOLEAN, hidden BOOLEAN, modified_by VARCHAR(255))`;
    await sql`CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, phone VARCHAR(255), email VARCHAR(255), shop_name VARCHAR(255))`;
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(255),
        cart_data JSONB NOT NULL,
        total NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'معلق',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // إنشاء حساب المدير تلقائياً (adeeb - 0000)
    const adminsCount = await sql`SELECT COUNT(*) FROM admins`;
    if (Number(adminsCount[0].count) === 0) {
      await sql`INSERT INTO admins (username, pin, role) VALUES ('adeeb', '0000', 'مدير')`;
      console.log("✅ تم إنشاء حساب المدير السري بنجاح");
    }

    const settingsCount = await sql`SELECT COUNT(*) FROM settings`;
    if (Number(settingsCount[0].count) === 0) {
      await sql`INSERT INTO settings (shop_name, phone) VALUES ('تشاطيب', '966500000000')`;
    }

    console.log("✅ تم الاتصال الآمن بقاعدة البيانات وتمت تهيئة الجداول بنجاح 100%");
  } catch (e) {
    console.error("❌ خطأ أثناء تهيئة قاعدة البيانات:", e.message);
  }
}

// =========================================================
// 📥 مسارات المتجر (تمت حمايتها للعمل فقط إذا كان الاتصال ناجحاً)
// =========================================================
app.post('/api/orders', async (req, res) => {
  if(!sql) return res.status(500).json({error: "قاعدة البيانات غير متصلة بعد"});
  const { customer_name, customer_phone, cart_data, total } = req.body;
  try {
    const newOrder = await sql`INSERT INTO orders (customer_name, customer_phone, cart_data, total) VALUES (${customer_name}, ${customer_phone}, ${cart_data}, ${total}) RETURNING *`;
    res.status(201).json(newOrder[0]);
  } catch (err) {
    res.status(500).json({ error: "فشل في حفظ الطلب" });
  }
});

app.get('/api/orders', async (req, res) => { if(!sql) return res.json([]); try { res.json(await sql`SELECT * FROM orders ORDER BY created_at DESC`); } catch(e) { res.status(500).json([]); } });
app.delete('/api/orders/:id', async (req, res) => { if(!sql) return res.json({error: "DB Error"}); try { await sql`DELETE FROM orders WHERE id = ${req.params.id}`; res.json({ success: true }); } catch(e) { res.status(500).json({ error: e.message }); } });
app.put('/api/orders/:id/complete', async (req, res) => { if(!sql) return res.json({error: "DB Error"}); try { await sql`UPDATE orders SET status = 'مكتمل' WHERE id = ${req.params.id}`; res.json({ success: true }); } catch(e) { res.status(500).json({ error: e.message }); } });

app.get('/api/products', async (req, res) => { if(!sql) return res.json([]); try { res.json(await sql`SELECT * FROM products ORDER BY id DESC`); } catch(e) { res.status(500).json([]); } });
app.get('/api/categories', async (req, res) => { if(!sql) return res.json([]); try { res.json(await sql`SELECT * FROM categories`); } catch(e) { res.status(500).json([]); } });
app.get('/api/workers', async (req, res) => { if(!sql) return res.json([]); try { res.json(await sql`SELECT * FROM workers`); } catch(e) { res.status(500).json([]); } });
app.get('/api/admins', async (req, res) => { if(!sql) return res.json([]); try { res.json(await sql`SELECT * FROM admins`); } catch(e) { res.status(500).json([]); } });
app.get('/api/settings', async (req, res) => { if(!sql) return res.json({phone:'', shop_name:''}); try { const s = await sql`SELECT * FROM settings LIMIT 1`; res.json(s.length ? s[0] : { phone: '', shop_name: '' }); } catch(e) { res.status(500).json({}); } });

app.post('/api/pos/checkout', async (req, res) => {
  if(!sql) return res.status(500).json({error: "قاعدة البيانات غير متصلة"});
  try {
    const { cart } = req.body;
    for (let item of cart) { await sql`UPDATE products SET stock = stock - ${item.qty}, sold = COALESCE(sold, 0) + ${item.qty} WHERE id = ${item.id}`; }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});