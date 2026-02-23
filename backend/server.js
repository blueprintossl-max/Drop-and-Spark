const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

app.get('/api/settings', async (req, res) => {
  try { const s = await sql`SELECT * FROM settings WHERE id = 1`; res.json(s[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { phone, email, shop_name, admin_pin } = req.body;
    const s = await sql`UPDATE settings SET phone=${phone}, email=${email}, shop_name=${shop_name}, admin_pin=${admin_pin} WHERE id=1 RETURNING *`;
    res.json(s[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// الأقسام (الرئيسية والفرعية)
app.get('/api/categories', async (req, res) => {
  try { res.json(await sql`SELECT * FROM categories ORDER BY id ASC`); } catch (err) { res.json([]); }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon, parent } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'الاسم مطلوب' });
    const p = parent || '';
    const exist = await sql`SELECT * FROM categories WHERE name = ${name}`;
    if (exist.length > 0) return res.status(400).json({ error: 'القسم موجود مسبقاً' });
    
    const r = await sql`INSERT INTO categories (name, icon, parent) VALUES (${name}, ${icon}, ${p}) RETURNING *`;
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: 'خطأ في قاعدة البيانات' }); }
});

app.delete('/api/categories/:id', async (req, res) => {
  try { await sql`DELETE FROM categories WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// المنتجات
app.get('/api/products', async (req, res) => {
  try { res.json(await sql`SELECT * FROM products ORDER BY id DESC`); } catch (err) { res.json([]); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, old_price, stock, category, image, is_sale, out_of_stock } = req.body;
    const r = await sql`INSERT INTO products (name, price, old_price, stock, category, image, is_sale, out_of_stock) 
    VALUES (${name}, ${price}, ${old_price}, ${stock}, ${category}, ${image}, ${is_sale}, ${out_of_stock}) RETURNING *`;
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, old_price, stock, category, image, is_sale, out_of_stock } = req.body;
    const r = await sql`UPDATE products SET name=${name}, price=${price}, old_price=${old_price}, stock=${stock}, 
    category=${category}, image=${image}, is_sale=${is_sale}, out_of_stock=${out_of_stock} WHERE id=${req.params.id} RETURNING *`;
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try { await sql`DELETE FROM products WHERE id = ${req.params.id}`; res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل بنظام المجلدات الهرمية`));