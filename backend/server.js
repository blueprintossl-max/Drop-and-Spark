const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// --- أهم نقطة: السماح لمتجرك على Vercel بالوصول ---
// داخل ملف server.js
app.use(cors({
    origin: 'https://drop-and-spark-web.vercel.app' // رابط متجرك المباشر
}));

app.use(express.json());

// التوصيلة الصحيحة التي تقرأ الرابط من Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "خطأ في القاعدة" }); }
});

app.post('/api/products', async (req, res) => {
    const { name, price, category } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
            [name, price, category]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: "خطأ في الحفظ" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 محرك قطرة وشرارة يعمل الآن بنجاح`);
});