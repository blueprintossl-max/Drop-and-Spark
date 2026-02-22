const express = require('express');
const cors = require('cors');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

app.get('/api/products', async (req, res) => {
  try {
    const products = await sql`SELECT * FROM products ORDER BY id DESC`;
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/products', async (req, res) => {
  const { name, price, old_price, category, image, is_sale } = req.body;
  try {
    const result = await sql`
      INSERT INTO products (name, price, old_price, category, image, is_sale) 
      VALUES (${name}, ${price}, ${old_price}, ${category}, ${image}, ${is_sale}) 
      RETURNING *`;
    res.json(result[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// إضافة أمر التعديل (جديد ✨)
app.put('/api/products/:id', async (req, res) => {
  const { name, price, old_price, category, image, is_sale } = req.body;
  try {
    const result = await sql`
      UPDATE products SET name=${name}, price=${price}, old_price=${old_price}, 
      category=${category}, image=${image}, is_sale=${is_sale} 
      WHERE id=${req.params.id} RETURNING *`;
    res.json(result[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await sql`DELETE FROM products WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 المحرك الملكي جاهز`));