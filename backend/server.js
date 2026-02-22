const express = require('express');
const cors = require('cors');
const postgres = require('postgres'); // التأكد من الاستيراد الصحيح للمكتبة
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة البيانات باستخدام الرابط السري
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// 1. جلب المنتجات
app.get('/api/products', async (req, res) => {
  try {
    const products = await sql`SELECT * FROM products ORDER BY id DESC`;
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. إضافة منتج جديد (الاسم، السعر، الفئة، ورابط الصورة)
app.post('/api/products', async (req, res) => {
  const { name, price, category, image } = req.body;
  try {
    const result = await sql`
      INSERT INTO products (name, price, category, image) 
      VALUES (${name}, ${price}, ${category}, ${image}) 
      RETURNING *`;
    res.json(result[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. حذف منتج نهائياً
app.delete('/api/products/:id', async (req, res) => {
  try {
    await sql`DELETE FROM products WHERE id = ${req.params.id}`;
    res.json({ message: "تم الحذف بنجاح" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 المحرك يعمل بنجاح على المنفذ ${PORT}`));