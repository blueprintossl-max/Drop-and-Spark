const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

app.use(cors()); 
app.use(express.json()); 

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { 
        console.error("❌ عطل في جلب القاعدة:", err.message);
        res.status(500).json({ error: "خطأ في القاعدة" }); 
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, price, category } = req.body;
        const result = await pool.query(
            'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
            [name, price, category]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("❌ عطل في الحفظ:", err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    // 👇 هنا تم تحديث رسالة السجلات 👇
    console.log(`🚀 محرك متجر 💧 قطرة و⚡ شرارة متصل بالسحاب ويعمل على المنفذ ${PORT}`);
});