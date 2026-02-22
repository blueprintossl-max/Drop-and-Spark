// App.js - نسخة دعم الرفع المباشر من الكاميرا والجهاز
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';

function App() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
  const [isAdmin, setIsAdmin] = useState(false);

  // وظيفة تحويل الصورة المرفوعة إلى نص Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result }); // حفظ الصورة كنص في حالة الفورم
    };
    if (file) reader.readAsDataURL(file);
  };

  const addProduct = async () => {
    if (!formData.name || !formData.price || !formData.image) return alert("⚠️ الرجاء إكمال البيانات وتصوير المنتج");
    
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert("✅ تم رفع المنتج بنجاح");
      setFormData({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
      // تحديث القائمة بعد الإضافة
      fetch(API_URL).then(r => r.json()).then(data => setProducts(data));
    }
  };

  // ... (بقية الكود الخاص بالـ useEffect والـ return)
  // في جزء الـ Admin Panel، استبدل خانة الرابط بهذا:
  /*
    <label className="upload-btn">
      📷 {formData.image ? "تم اختيار الصورة" : "اضغط لتصوير المنتج أو رفعه"}
      <input type="file" accept="image/*" onChange={handleFileChange} style={{display: 'none'}} />
    </label>
    {formData.image && <img src={formData.image} width="100" alt="معاينة" />}
  */
}