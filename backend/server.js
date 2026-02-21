const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// --- إعدادات أساسية ---
app.use(cors()); 
app.use(express.json()); // 🔴 السطر الأهم لقراءة البيانات المضافة

// --- التوصيلة بقاعدة البيانات ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- مسار جلب المنتجات ---
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { 
        console.error("❌ عطل في جلب القاعدة:", err.message);
        res.status(500).json({ error: "خطأ في القاعدة" }); 
    }
});

// --- مسار إضافة المنتجات ---
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
    console.log(`🚀 محرك قطرة وشرارة متصل بالسحاب ويعمل على المنفذ ${PORT}`);
});