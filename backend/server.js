const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

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

// 📥 التحديث: استقبال الطلبات وحفظها في قاعدة بيانات نيون
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
    console.error("خطأ في حفظ الطلب:", err.message);
    res.status(500).json({ error: "فشل في حفظ الطلب" });
  }
});

// باقي المسارات (المنتجات، العمال، الكاشير)
app.get('/api/products', async (req, res) => { res.json(await sql`SELECT * FROM products`); });
app.get('/api/categories', async (req, res) => { res.json(await sql`SELECT * FROM categories`); });
app.get('/api/workers', async (req, res) => { res.json(await sql`SELECT * FROM workers`); });
app.get('/api/settings', async (req, res) => { const s = await sql`SELECT * FROM settings LIMIT 1`; res.json(s[0]); });
app.get('/api/admins', async (req, res) => { res.json(await sql`SELECT * FROM admins`); });
app.get('/api/orders', async (req, res) => { res.json(await sql`SELECT * FROM orders ORDER BY created_at DESC`); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server Running on port ${PORT}`));