const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// ==========================================
// 1. إعدادات المتجر
// ==========================================
app.get('/api/settings', async (req, res) => {
  try {
    const s = await sql`SELECT * FROM settings WHERE id = 1`;
    res.json(s[0]);
  } catch (e) { res.status(500).send(e.message); }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { phone, email, shop_name, admin_pin } = req.body;
    const s = await sql`
      UPDATE settings 
      SET phone=${phone}, email=${email}, shop_name=${shop_name}, admin_pin=${admin_pin} 
      WHERE id=1 RETURNING *
    `;
    res.json(s[0]);
  } catch (e) { res.status(500).send(e.message); }
});

// ==========================================
// 2. حراج العمال (مع المنطقة والمحافظة)
// ==========================================
app.get('/api/workers', async (req, res) => {
  try {
    res.json(await sql`SELECT * FROM workers ORDER BY id DESC`);
  } catch (e) { res.json([]); }
});

app.post('/api/workers', async (req, res) => {
  try {
    const { name, phone, details, image, region, city } = req.body;
    const r = await sql`
      INSERT INTO workers (name, phone, details, image, region, city, hidden) 
      VALUES (${name}, ${phone}, ${details}, ${image}, ${region || ''}, ${city || ''}, FALSE) 
      RETURNING *
    `;
    res.json(r[0]);
  } catch (e) { res.status(500).send(e.message); }
});

app.put('/api/workers/:id', async (req, res) => {
  try {
    const { name, phone, details, image, hidden, region, city } = req.body;
    const r = await sql`
      UPDATE workers 
      SET name=${name}, phone=${phone}, details=${details}, image=${image}, 
          hidden=${hidden}, region=${region || ''}, city=${city || ''} 
      WHERE id=${req.params.id} RETURNING *
    `;
    res.json(r[0]);
  } catch (e) { res.status(500).send(e.message); }
});

app.delete('/api/workers/:id', async (req, res) => {
  try {
    await sql`DELETE FROM workers WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) { res.status(500).send(e.message); }
});

// ==========================================
// 3. نظام الأقسام (رئيسي وفرعي)
// ==========================================
app.get('/api/categories', async (req, res) => {
  try { res.json(await sql`SELECT * FROM categories ORDER BY id ASC`); } catch (e) { res.json([]); }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon, parent } = req.body;
    if (!name) return res.status(400).json({ error: 'الاسم مطلوب' });
    
    const exist = await sql`SELECT * FROM categories WHERE name = ${name}`;
    if (exist.length > 0) return res.status(400).json({ error: 'القسم موجود مسبقاً' });
    
    const r = await sql`
      INSERT INTO categories (name, icon, parent) 
      VALUES (${name}, ${icon}, ${parent || ''}) 
      RETURNING *
    `;
    res.json(r[0]);
  } catch (e) { res.status(500).json({ error: 'خطأ داخلي' }); }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await sql`DELETE FROM categories WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) { res.status(500).send(e.message); }
});

// ==========================================
// 4. المنتجات وإدارة المخزون
// ==========================================
app.get('/api/products', async (req, res) => {
  try { res.json(await sql`SELECT * FROM products ORDER BY id DESC`); } catch (e) { res.json([]); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, old_price, stock, details, category, image, is_sale, out_of_stock } = req.body;
    const r = await sql`
      INSERT INTO products (name, price, old_price, stock, sold, details, category, image, is_sale, out_of_stock) 
      VALUES (${name}, ${price}, ${old_price}, ${stock}, 0, ${details || ''}, ${category}, ${image}, ${is_sale}, ${out_of_stock}) 
      RETURNING *
    `;
    res.json(r[0]);
  } catch (e) { res.status(500).send(e.message); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, old_price, stock, sold, details, category, image, is_sale, out_of_stock } = req.body;
    const r = await sql`
      UPDATE products 
      SET name=${name}, price=${price}, old_price=${old_price}, stock=${stock}, sold=${sold}, 
          details=${details || ''}, category=${category}, image=${image}, is_sale=${is_sale}, out_of_stock=${out_of_stock} 
      WHERE id=${req.params.id} RETURNING *
    `;
    res.json(r[0]);
  } catch (e) { res.status(500).send(e.message); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await sql`DELETE FROM products WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e) { res.status(500).send(e.message); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل بشكل متكامل وشامل`));