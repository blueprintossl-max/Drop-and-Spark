const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // زيادة الحد لضمان رفع الصور بدون مشاكل

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// ==========================================
// 1. إعدادات النظام
// ==========================================
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await sql`SELECT * FROM settings WHERE id = 1`;
    res.json(settings[0]);
  } catch (error) {
    console.error("Settings Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { phone, email, shop_name, admin_pin } = req.body;
    const updatedSettings = await sql`
      UPDATE settings 
      SET phone=${phone}, email=${email}, shop_name=${shop_name}, admin_pin=${admin_pin} 
      WHERE id=1 
      RETURNING *
    `;
    res.json(updatedSettings[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. إدارة حراج العمال والمقاولين
// ==========================================
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
    const { name, phone, details, image, region, city, profession, portfolio_img, safety_details, rating, is_busy } = req.body;
    
    const newWorker = await sql`
      INSERT INTO workers (
        name, phone, details, image, region, city, hidden, profession, 
        portfolio_img, safety_details, contact_clicks, rating, is_busy
      ) VALUES (
        ${name}, ${phone}, ${details || ''}, ${image || ''}, ${region || ''}, ${city || ''}, FALSE, ${profession || ''}, 
        ${portfolio_img || ''}, ${safety_details || ''}, 0, ${rating || 5.0}, ${is_busy || false}
      ) 
      RETURNING *
    `;
    res.json(newWorker[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/workers/:id', async (req, res) => {
  try {
    // إصلاح مشكلة عدم التعديل: تحويل الـ ID إلى رقم بشكل صريح
    const workerId = Number(req.params.id);
    const { name, phone, details, image, hidden, region, city, profession, portfolio_img, safety_details, rating, is_busy } = req.body;
    
    const updatedWorker = await sql`
      UPDATE workers 
      SET 
        name=${name}, 
        phone=${phone}, 
        details=${details || ''}, 
        image=${image || ''}, 
        hidden=${hidden}, 
        region=${region || ''}, 
        city=${city || ''}, 
        profession=${profession || ''}, 
        portfolio_img=${portfolio_img || ''}, 
        safety_details=${safety_details || ''},
        rating=${rating || 5.0},
        is_busy=${is_busy}
      WHERE id=${workerId} 
      RETURNING *
    `;
    res.json(updatedWorker[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/workers/:id', async (req, res) => {
  try {
    // إصلاح مشكلة عدم الحذف: تحويل الـ ID إلى رقم
    const workerId = Number(req.params.id);
    await sql`DELETE FROM workers WHERE id = ${workerId}`;
    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/workers/:id/click', async (req, res) => {
  try {
    const workerId = Number(req.params.id);
    const updatedWorker = await sql`
      UPDATE workers 
      SET contact_clicks = COALESCE(contact_clicks, 0) + 1 
      WHERE id=${workerId} 
      RETURNING *
    `;
    res.json(updatedWorker[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. إدارة الأقسام
// ==========================================
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await sql`SELECT * FROM categories ORDER BY id ASC`;
    res.json(categories);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon, parent } = req.body;
    
    const existing = await sql`SELECT * FROM categories WHERE name = ${name}`;
    if (existing.length > 0) {
      return res.status(400).json({ error: 'هذا القسم موجود مسبقاً' });
    }
    
    const newCategory = await sql`
      INSERT INTO categories (name, icon, parent) 
      VALUES (${name}, ${icon}, ${parent || ''}) 
      RETURNING *
    `;
    res.json(newCategory[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const catId = Number(req.params.id);
    await sql`DELETE FROM categories WHERE id = ${catId}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. إدارة المنتجات
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const products = await sql`SELECT * FROM products ORDER BY id DESC`;
    res.json(products);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, old_price, stock, details, category, image, is_sale, out_of_stock } = req.body;
    const newProduct = await sql`
      INSERT INTO products (
        name, price, old_price, stock, sold, details, category, image, is_sale, out_of_stock
      ) VALUES (
        ${name}, ${price}, ${old_price || 0}, ${stock}, 0, ${details || ''}, ${category}, ${image || ''}, ${is_sale}, ${out_of_stock}
      ) 
      RETURNING *
    `;
    res.json(newProduct[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { name, price, old_price, stock, sold, details, category, image, is_sale, out_of_stock } = req.body;
    
    const updatedProduct = await sql`
      UPDATE products 
      SET 
        name=${name}, 
        price=${price}, 
        old_price=${old_price || 0}, 
        stock=${stock}, 
        sold=${sold}, 
        details=${details || ''}, 
        category=${category}, 
        image=${image || ''}, 
        is_sale=${is_sale}, 
        out_of_stock=${out_of_stock} 
      WHERE id=${productId} 
      RETURNING *
    `;
    res.json(updatedProduct[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    await sql`DELETE FROM products WHERE id = ${productId}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 السيرفر الشامل يعمل بقوة واستقرار تام`));