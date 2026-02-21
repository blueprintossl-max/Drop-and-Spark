const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// --- إعدادات أساسية ---
app.use(cors()); 
app.use(express.json()); // 🔴 هذا هو السطر السحري الذي كان مفقوداً لقراءة بيانات المنتجات

// --- التوصيلة بقاعدة البيانات ---
// يجب أن تكون في الأعلى حتى تستطيع المسارات (Routes) استخدامها
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

// --- مسار إضافة المنتجات (تم دمجهم في مسار واحد صحيح) ---
app.post('/api/products', async (req, res) => {
    try {
        // نقلنا هذا السطر داخل الـ try block لتجنب انهيار السيرفر إذا كانت البيانات ناقصة
        const { name, price, category } = req.body;
        
        const result = await pool.query(
            'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
            [name, price, category]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("❌ عطل في الحفظ:", err.message); // سيظهر في سجلات Render
        // نعيد الخطأ بصيغة JSON سليمة لتفادي خطأ Unexpected token في الواجهة
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 محرك قطرة وشرارة متصل بالسحاب ويعمل على المنفذ ${PORT}`);
});
