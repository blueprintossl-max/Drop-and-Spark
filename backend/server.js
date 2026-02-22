const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// --- إدارة إعدادات المتجر ---
app.get('/api/settings', async (req, res) => {
  const s = await sql`SELECT * FROM settings WHERE id = 1`;
  res.json(s[0]);
});

app.put('/api/settings', async (req, res) => {
  const { phone, email, shop_name } = req.body;
  const s = await sql`UPDATE settings SET phone=${phone}, email=${email}, shop_name=${shop_name} WHERE id=1 RETURNING *`;
  res.json(s[0]);
});

// --- إدارة المنتجات والمخزون ---
app.get('/api/products', async (req, res) => {
  res.json(await sql`SELECT * FROM products ORDER BY id DESC`);
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
app.listen(PORT, () => console.log(`🚀 نظام قطرة وشرارة جاهز`));