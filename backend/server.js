const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// --- إعدادات الأمان (CORS) ---
// قمنا بإضافة رابط Vercel الجديد الخاص بك لكي يسمح السيرفر باستقبال الطلبات منه
app.use(cors({
    origin: [
        'https://drop-and-spark-web.vercel.app', // رابط المتجر الجديد على Vercel
        'http://localhost:3000'                 // للعمل المحلي أثناء التطوير
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// --- الاتصال بقاعدة بيانات Neon ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- المسارات (Endpoints) ---

// 1. جلب جميع المنتجات
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في جلب البيانات من القاعدة' });
    }
});

// 2. إضافة منتج جديد
app.post('/api/products', async (req, res) => {
    const { name, price, category } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
            [name, price, category]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في حفظ المنتج' });
    }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});