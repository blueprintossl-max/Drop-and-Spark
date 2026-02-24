const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();

// إعدادات الأمان وحجم الملفات المرفوعة
app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// الاتصال بقاعدة البيانات
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// ==================================================================
// 1. نظام الموظفين والمدراء (Admins)
// ==================================================================
app.get('/api/admins', async (req, res) => {
  try {
    const adminsList = await sql`
      SELECT * FROM admins 
      ORDER BY id ASC
    `;
    res.json(adminsList);
  } catch (error) {
    console.error("Admins Fetch Error:", error);
    res.json([]);
  }
});

app.post('/api/admins', async (req, res) => {
  try {
    const { username, pin, role } = req.body;
    
    // التحقق من عدم تكرار الاسم
    const existingAdmin = await sql`
      SELECT * FROM admins 
      WHERE username = ${username}
    `;
    
    if (existingAdmin.length > 0) {
      return res.status(400).json({ error: 'اسم المستخدم موجود مسبقاً' });
    }
    
    // إدخال الموظف الجديد
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
    const adminId = Number(req.params.id);
    await sql`
      DELETE FROM admins 
      WHERE id = ${adminId}
    `;
    res.json({ success: true, message: 'تم حذف الموظف' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================================================================
// 2. إعدادات المتجر (Settings)
// ==================================================================
app.get('/api/settings', async (req, res) => {
  try {
    const settingsData = await sql`
      SELECT * FROM settings 
      WHERE id = 1
    `;
    res.json(settingsData[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { phone, email, shop_name } = req.body;
    
    const updatedSettings = await sql`
      UPDATE settings 
      SET 
        phone = ${phone}, 
        email = ${email}, 
        shop_name = ${shop_name} 
      WHERE id = 1 
      RETURNING *
    `;
    
    res.json(updatedSettings[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================================================================
// 3. حراج العمال والمقاولين (Workers)
// ==================================================================
app.get('/api/workers', async (req, res) => {
  try {
    const workersList = await sql`
      SELECT * FROM workers 
      ORDER BY id DESC
    `;
    res.json(workersList);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/workers', async (req, res) => {
  try {
    const { 
      name, phone, details, image, region, city, 
      profession, portfolio_img, safety_details, 
      rating, is_busy, modified_by 
    } = req.body;
    
    const newWorker = await sql`
      INSERT INTO workers (
        name, phone, details, image, region, city, hidden, 
        profession, portfolio_img, safety_details, contact_clicks, 
        rating, is_busy, modified_by
      ) VALUES (
        ${name}, ${phone}, ${details || ''}, ${image || ''}, ${region || ''}, ${city || ''}, FALSE, 
        ${profession || ''}, ${portfolio_img || ''}, ${safety_details || ''}, 0, 
        ${rating || 5.0}, ${is_busy || false}, ${modified_by || 'نظام'}
      ) 
      RETURNING *
    `;
    
    res.json(newWorker[0]);
  } catch (error) {
    console.error("Worker Post Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/workers/:id', async (req, res) => {
  try {
    const workerId = Number(req.params.id);
    const { 
      name, phone, details, image, hidden, region, city, 
      profession, portfolio_img, safety_details, 
      rating, is_busy, modified_by 
    } = req.body;
    
    const updatedWorker = await sql`
      UPDATE workers 
      SET 
        name = ${name}, 
        phone = ${phone}, 
        details = ${details || ''}, 
        image = ${image || ''}, 
        hidden = ${hidden}, 
        region = ${region || ''}, 
        city = ${city || ''}, 
        profession = ${profession || ''}, 
        portfolio_img = ${portfolio_img || ''}, 
        safety_details = ${safety_details || ''},
        rating = ${rating || 5.0}, 
        is_busy = ${is_busy}, 
        modified_by = ${modified_by || 'نظام'}
      WHERE id = ${workerId} 
      RETURNING *
    `;
    
    res.json(updatedWorker[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/workers/:id', async (req, res) => {
  try {
    const workerId = Number(req.params.id);
    await sql`
      DELETE FROM workers 
      WHERE id = ${workerId}
    `;
    res.json({ success: true, message: 'Worker deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// مسار تسجيل نقرات التواصل مع العامل للتقارير
app.put('/api/workers/:id/click', async (req, res) => {
  try {
    const workerId = Number(req.params.id);
    const updatedClick = await sql`
      UPDATE workers 
      SET contact_clicks = COALESCE(contact_clicks, 0) + 1 
      WHERE id = ${workerId} 
      RETURNING *
    `;
    res.json(updatedClick[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================================================================
// 4. الأقسام (Categories)
// ==================================================================
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await sql`
      SELECT * FROM categories 
      ORDER BY id ASC
    `;
    res.json(cats);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon, parent } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'اسم القسم مطلوب' });
    }
    
    const existing = await sql`
      SELECT * FROM categories 
      WHERE name = ${name}
    `;
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'القسم موجود مسبقاً' });
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
    await sql`
      DELETE FROM categories 
      WHERE id = ${catId}
    `;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================================================================
// 5. المنتجات وإدارة المخزون (Products)
// ==================================================================
app.get('/api/products', async (req, res) => {
  try {
    const productsList = await sql`
      SELECT * FROM products 
      ORDER BY id DESC
    `;
    res.json(productsList);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { 
      name, price, old_price, stock, details, 
      category, image, is_sale, out_of_stock, modified_by 
    } = req.body;
    
    const newProduct = await sql`
      INSERT INTO products (
        name, price, old_price, stock, sold, details, 
        category, image, is_sale, out_of_stock, modified_by
      ) VALUES (
        ${name}, ${price}, ${old_price || 0}, ${stock}, 0, ${details || ''}, 
        ${category}, ${image || ''}, ${is_sale}, ${out_of_stock}, ${modified_by || 'نظام'}
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
    const { 
      name, price, old_price, stock, sold, details, 
      category, image, is_sale, out_of_stock, modified_by 
    } = req.body;
    
    const updatedProduct = await sql`
      UPDATE products 
      SET 
        name = ${name}, 
        price = ${price}, 
        old_price = ${old_price || 0}, 
        stock = ${stock}, 
        sold = ${sold}, 
        details = ${details || ''}, 
        category = ${category}, 
        image = ${image || ''}, 
        is_sale = ${is_sale}, 
        out_of_stock = ${out_of_stock}, 
        modified_by = ${modified_by || 'نظام'}
      WHERE id = ${productId} 
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
    await sql`
      DELETE FROM products 
      WHERE id = ${productId}
    `;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// تشغيل الخادم
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل بنظام التتبع وتعدد المستخدمين (Port: ${PORT})`);
});