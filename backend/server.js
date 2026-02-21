const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 🔗 ربط المحرك بقاعدة بيانات نيون السحابية
const pool = new Pool({
  connectionString: 'ضع_هنا_الرابط_الذي_نسخته_من_نيون',
  ssl: { rejectUnauthorized: false }
});

// جلب المنتجات
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Products ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).send('خطأ في السحاب'); }
});

// إضافة منتج (مع السعر القديم والتصنيف)
app.post('/api/products', async (req, res) => {
  const { name, brand, category, price, old_price, image_url } = req.body;
  await pool.query(
    "INSERT INTO Products (name, brand, category, price, old_price, image_url) VALUES ($1, $2, $3, $4, $5, $6)",
    [name, brand, category, price, old_price, image_url]
  );
  res.json({ success: true });
});

// تسجيل الطلبات
app.post('/api/orders', async (req, res) => {
  const { customer_name, customer_phone, order_details, total_price } = req.body;
  await pool.query(
    "INSERT INTO Orders (customer_name, customer_phone, order_details, total_price) VALUES ($1, $2, $3, $4)",
    [customer_name, customer_phone, order_details, total_price]
  );
  res.json({ success: true });
});

app.listen(5000, () => console.log('🚀 محرك قطرة وشرارة متصل بالسحاب!'));