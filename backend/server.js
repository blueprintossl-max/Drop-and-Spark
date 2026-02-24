const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// ==================================================================
// 1. نظام الموظفين والصلاحيات
// ==================================================================
app.get('/api/admins', async (req, res) => {
  try {
    const adminsList = await sql`SELECT * FROM admins ORDER BY id ASC`;
    res.json(adminsList);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/admins', async (req, res) => {
  try {
    const { username, pin, role } = req.body;
    
    const existing = await sql`SELECT * FROM admins WHERE username = ${username}`;
    if (existing.length > 0) {
      return res.status(400).json({ error: 'اسم المستخدم موجود مسبقاً' });
    }
    
    const newAdmin = await sql`
      INSERT INTO admins (username, pin, role) 
      VALUES (${username}, ${pin}, ${role || 'موظف'}) 
      RETURNING *
    `;
    res.json(newAdmin[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admins/:id', async (req, res) => {
  try {
    await sql`DELETE FROM admins WHERE id = ${Number(req.params.id)}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🌟 مسار جديد: لتغيير الرقم السري للموظف نفسه
app.put('/api/admins/:id/pin', async (req, res) => {
  try {
    const { newPin } = req.body;
    const adminId = Number(req.params.id);
    
    const updatedAdmin = await sql`
      UPDATE admins 
      SET pin = ${newPin} 
      WHERE id = ${adminId} 
      RETURNING *
    `;
    
    res.json(updatedAdmin[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================================================================
// 2. إعدادات المتجر
// ==================================================================
app.get('/api/settings', async (req, res) => {
  try {
    const s = await sql`SELECT * FROM settings WHERE id = 1`;
    res.json(s[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { phone, email, shop_name } = req.body;
    const s = await sql`
      UPDATE settings 
      SET phone=${phone}, email=${email}, shop_name=${shop_name} 
      WHERE id=1 
      RETURNING *
    `;
    res.json(s[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================================================================
// 3. حراج العمال والمقاولين
// ==================================================================
app.get('/api/workers', async (req, res) => {
  try {
    const workers = await sql`SELECT * FROM workers ORDER BY id DESC`;
    res.json(workers);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/workers', async (req, res) => {
  try {
    const { name, phone, details, image, region, city, profession, portfolio_img, safety_details, rating, is_busy, modified_by } = req.body;
    const newWorker = await sql`
      INSERT INTO workers (
        name, phone, details, image, region, city, hidden, profession, 
        portfolio_img, safety_details, contact_clicks, rating, is_busy, modified_by
      ) VALUES (
        ${name}, ${phone}, ${details || ''}, ${image || ''}, ${region || ''}, ${city || ''}, FALSE, ${profession || ''}, 
        ${portfolio_img || ''}, ${safety_details || ''}, 0, ${rating || 5.0}, ${is_busy || false}, ${modified_by || 'نظام'}
      ) RETURNING *
    `;
    res.json(newWorker[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/workers/:id', async (req, res) => {
  try {
    const { name, phone, details, image, hidden, region, city, profession, portfolio_img, safety_details, rating, is_busy, modified_by } = req.body;
    const updatedWorker = await sql`
      UPDATE workers 
      SET name=${name}, phone=${phone}, details=${details || ''}, image=${image || ''}, hidden=${hidden}, 
          region=${region || ''}, city=${city || ''}, profession=${profession || ''}, 
          portfolio_img=${portfolio_img || ''}, safety_details=${safety_details || ''},
          rating=${rating || 5.0}, is_busy=${is_busy}, modified_by=${modified_by || 'نظام'}
      WHERE id=${Number(req.params.id)} 
      RETURNING *
    `;
    res.json(updatedWorker[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/workers/:id', async (req, res) => {
  try {
    await sql`DELETE FROM workers WHERE id = ${Number(req.params.id)}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/workers/:id/click', async (req, res) => {
  try {
    const updated = await sql`UPDATE workers SET contact_clicks = COALESCE(contact_clicks, 0) + 1 WHERE id=${Number(req.params.id)} RETURNING *`;
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================================================================
// 4. الأقسام
// ==================================================================
app.get('/api/categories', async (req, res) => {
  try { res.json(await sql`SELECT * FROM categories ORDER BY id ASC`); } catch (error) { res.json([]); }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon, parent } = req.body;
    const exist = await sql`SELECT * FROM categories WHERE name = ${name}`;
    if (exist.length > 0) return res.status(400).json({ error: 'القسم موجود مسبقاً' });
    const r = await sql`INSERT INTO categories (name, icon, parent) VALUES (${name}, ${icon}, ${parent || ''}) RETURNING *`;
    res.json(r[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/categories/:id', async (req, res) => {
  try { await sql`DELETE FROM categories WHERE id = ${Number(req.params.id)}`; res.json({ success: true }); } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==================================================================
// 5. المنتجات والمخزون
// ==================================================================
app.get('/api/products', async (req, res) => {
  try { res.json(await sql`SELECT * FROM products ORDER BY id DESC`); } catch (error) { res.json([]); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, old_price, stock, details, category, image, is_sale, out_of_stock, modified_by } = req.body;
    const r = await sql`
      INSERT INTO products (
        name, price, old_price, stock, sold, details, category, image, is_sale, out_of_stock, modified_by
      ) VALUES (
        ${name}, ${price}, ${old_price || 0}, ${stock}, 0, ${details || ''}, ${category}, ${image || ''}, ${is_sale}, ${out_of_stock}, ${modified_by || 'نظام'}
      ) RETURNING *
    `;
    res.json(r[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, old_price, stock, sold, details, category, image, is_sale, out_of_stock, modified_by } = req.body;
    const r = await sql`
      UPDATE products 
      SET name=${name}, price=${price}, old_price=${old_price || 0}, stock=${stock}, sold=${sold}, 
          details=${details || ''}, category=${category}, image=${image || ''}, is_sale=${is_sale}, 
          out_of_stock=${out_of_stock}, modified_by=${modified_by || 'نظام'}
      WHERE id=${Number(req.params.id)} 
      RETURNING *
    `;
    res.json(r[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try { await sql`DELETE FROM products WHERE id = ${Number(req.params.id)}`; res.json({ success: true }); } catch (error) { res.status(500).json({ error: error.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server Running Securely on port ${PORT}`));