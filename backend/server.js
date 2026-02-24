const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 🌟 الاتصال بقاعدة بيانات نيون مع زيادة وقت الانتظار لتجنب الأخطاء
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', connect_timeout: 15 });

async function initDb() {
  try {
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
    console.log("✅ Database Initialized Successfully");
  } catch (e) {
    console.error("❌ DB Init Error:", e.message);
  }
}
initDb();

// =========================================================
// 📥 مسار استقبال الطلبات الجديدة من العميل
// =========================================================
app.post('/api/orders', async (req, res) => {
  const { customer_name, customer_phone, cart_data, total } = req.body;
  try {
    const newOrder = await sql`
      INSERT INTO orders (customer_name, customer_phone, cart_data, total)
      VALUES (${customer_name}, ${customer_phone}, ${cart_data}, ${total})
      RETURNING *
    `;
    res.status(201).json(newOrder[0]);
  } catch (err) {
    console.error("Error Saving Order:", err.message);
    res.status(500).json({ error: "فشل في حفظ الطلب في قاعدة البيانات" });
  }
});

// =========================================================
// 🛒 باقي مسارات المتجر الأساسية (منتجات، أقسام، عمال، الخ)
// =========================================================
app.get('/api/orders', async (req, res) => {
  try { res.json(await sql`SELECT * FROM orders ORDER BY created_at DESC`); } 
  catch(e) { res.status(500).json([]); }
});

app.delete('/api/orders/:id', async (req, res) => {
  try { await sql`DELETE FROM orders WHERE id = ${req.params.id}`; res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/orders/:id/complete', async (req, res) => {
  try { await sql`UPDATE orders SET status = 'مكتمل' WHERE id = ${req.params.id}`; res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products', async (req, res) => {
  try { res.json(await sql`SELECT * FROM products ORDER BY id DESC`); } 
  catch(e) { res.status(500).json([]); }
});

app.get('/api/categories', async (req, res) => {
  try { res.json(await sql`SELECT * FROM categories`); } 
  catch(e) { res.status(500).json([]); }
});

app.get('/api/workers', async (req, res) => {
  try { res.json(await sql`SELECT * FROM workers`); } 
  catch(e) { res.status(500).json([]); }
});

app.get('/api/admins', async (req, res) => {
  try { res.json(await sql`SELECT * FROM admins`); } 
  catch(e) { res.status(500).json([]); }
});

app.get('/api/settings', async (req, res) => {
  try { 
    const s = await sql`SELECT * FROM settings LIMIT 1`; 
    res.json(s.length ? s[0] : { phone: '', shop_name: '' }); 
  } 
  catch(e) { res.status(500).json({}); }
});

// مسار الكاشير وخصم المخزون
app.post('/api/pos/checkout', async (req, res) => {
  try {
    const { cart } = req.body;
    for (let item of cart) {
      await sql`UPDATE products SET stock = stock - ${item.qty}, sold = COALESCE(sold, 0) + ${item.qty} WHERE id = ${item.id}`;
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server Running on port ${PORT}`));