const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// --- الإعدادات ---
app.get('/api/settings', async (req, res) => {
  const s = await sql`SELECT * FROM settings WHERE id = 1`;
  res.json(s[0]);
});
app.put('/api/settings', async (req, res) => {
  const { phone, email, shop_name, admin_pin } = req.body;
  const s = await sql`UPDATE settings SET phone=${phone}, email=${email}, shop_name=${shop_name}, admin_pin=${admin_pin} WHERE id=1 RETURNING *`;
  res.json(s[0]);
});

// --- الأقسام (المحدثة والذكية) ---
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await sql`SELECT * FROM categories ORDER BY id ASC`;
    res.json(cats);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon } = req.body;
    // حماية: التأكد من أن القسم غير موجود مسبقاً
    const existing = await sql`SELECT * FROM categories WHERE name = ${name}`;
    if (existing.length > 0) {
      return res.status(400).json({ error: 'القسم موجود مسبقاً' });
    }
    const r = await sql`INSERT INTO categories (name, icon) VALUES (${name}, ${icon}) RETURNING *`;
    res.json(r[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  await sql`DELETE FROM categories WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

// --- المنتجات ---
app.get('/api/products', async (req, res) => {
  const p = await sql`SELECT * FROM products ORDER BY id DESC`;
  res.json(p);
});
app.post('/api/products', async (req, res) => {
  const { name, price, old_price, stock, category, image, is_sale, out_of_stock } = req.body;
  const r = await sql`INSERT INTO products (name, price, old_price, stock, category, image, is_sale, out_of_stock) 
  VALUES (${name}, ${price}, ${old_price}, ${stock}, ${category}, ${image}, ${is_sale}, ${out_of_stock}) RETURNING *`;
  res.json(r[0]);
});
app.put('/api/products/:id', async (req, res) => {
  const { name, price, old_price, stock, category, image, is_sale, out_of_stock } = req.body;
  const r = await sql`UPDATE products SET name=${name}, price=${price}, old_price=${old_price}, stock=${stock}, 
  category=${category}, image=${image}, is_sale=${is_sale}, out_of_stock=${out_of_stock} WHERE id=${req.params.id} RETURNING *`;
  res.json(r[0]);
});
app.delete('/api/products/:id', async (req, res) => {
  await sql`DELETE FROM products WHERE id = ${req.params.id}`;
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 المحرك يعمل بقوة ومستعد للأقسام الديناميكية`));