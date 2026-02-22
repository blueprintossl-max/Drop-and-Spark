const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// تحديث المخزون يدوياً (بيع أو إرجاع)
app.patch('/api/products/:id/stock', async (req, res) => {
  const { amount } = req.body; // يمكن أن يكون سالباً للخصم أو موجباً للإرجاع
  try {
    const result = await sql`UPDATE products SET stock = stock + ${amount} WHERE id = ${req.params.id} RETURNING *`;
    res.json(result[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// بقية المسارات (GET, POST, PUT, DELETE) تبقى كما هي لدعم استقرار النظام
app.get('/api/products', async (req, res) => {
  try { res.json(await sql`SELECT * FROM products ORDER BY id DESC`); } catch (err) { res.status(500).send(err); }
});

app.post('/api/products', async (req, res) => {
  const { name, price, old_price, category, image, is_sale, stock, out_of_stock } = req.body;
  try {
    const res_db = await sql`INSERT INTO products (name, price, old_price, category, image, is_sale, stock, out_of_stock) 
    VALUES (${name}, ${price}, ${old_price}, ${category}, ${image}, ${is_sale}, ${stock}, ${out_of_stock}) RETURNING *`;
    res.json(res_db[0]);
  } catch (err) { res.status(500).send(err); }
});

app.put('/api/products/:id', async (req, res) => {
  const { name, price, old_price, category, image, is_sale, stock, out_of_stock } = req.body;
  try {
    const res_db = await sql`UPDATE products SET name=${name}, price=${price}, old_price=${old_price}, 
    category=${category}, image=${image}, is_sale=${is_sale}, stock=${stock}, out_of_stock=${out_of_stock} WHERE id=${req.params.id} RETURNING *`;
    res.json(res_db[0]);
  } catch (err) { res.status(500).send(err); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 نظام قطرة وشرارة جاهز`));