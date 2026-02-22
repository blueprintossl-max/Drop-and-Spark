import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';

function App() {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState('add');
  const [formData, setFormData] = useState({ name: '', price: '', image: '', category: 'كهرباء ⚡' });

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProducts(data);
    } catch (e) { console.log("تحقق من اتصال السيرفر.."); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result });
      alert("✅ تم رفع الصورة بنجاح");
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price || !formData.image) return alert("⚠️ أكمل البيانات وارفع الصورة");
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      alert("🚀 تم الحفظ بنجاح! ستظهر الآن للعملاء");
      setFormData({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
      fetchProducts();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("حذف القطعة نهائياً؟")) {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  // لوحة الإدارة
  if (isAdmin) {
    return (
      <div className="App admin-page">
        <header className="header-admin">
          <h1>⚙️ لوحة الإدارة - قطرة وشرارة</h1>
          <div className="nav-admin">
            <button onClick={() => setView('add')}>➕ إضافة منتج</button>
            <button onClick={() => setView('reports')}>📊 التقارير</button>
            <a href="/">🏠 عرض المتجر</a>
          </div>
        </header>

        <div className="container">
          {view === 'reports' ? (
            <div className="reports-card">
              <h2>📊 جرد المستودع الحالي</h2>
              <div className="stats">
                <div className="stat-box"><h3>عدد القطع</h3><p>{products.length}</p></div>
                <div className="stat-box"><h3>القيمة الإجمالية</h3><p>{products.reduce((a,b)=>a+Number(b.price),0)} ريال</p></div>
              </div>
            </div>
          ) : (
            <div className="add-box">
              <h2>📦 توريد بضاعة جديدة</h2>
              <input placeholder="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="السعر" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              <label className="file-label">
                {formData.image ? "✅ صورة جاهزة" : "📤 ارفع صورة المنتج"}
                <input type="file" accept="image/*" onChange={handleFileUpload} />
              </label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>كهرباء ⚡</option>
                <option>سباكة 💧</option>
              </select>
              <button onClick={handleAdd} className="btn-save">حفظ في المخزن 📦</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // صفحة العميل
  return (
    <div className="App client-page">
      <header className="hero">
        <div className="brand">
          <p className="sub-text">مَتجر</p>
          <h1 className="title-gold">قَطرة وشرارة</h1>
        </div>
      </header>

      <div className="container">
        <div className="search-bar">
          <input placeholder="🔍 ابحث عن قطعة غيار أو أداة..." />
        </div>

        <div className="store-grid">
          {products.map(p => (
            <div key={p.id} className="product-card">
              <div className="img-holder"><img src={p.image} alt={p.name} /></div>
              <div className="info">
                <h4>{p.name}</h4>
                <p className="price-label">{p.price} <span>ريال</span></p>
                <span className="cat-tag">{p.category}</span>
                {isAdmin && <button className="btn-del" onClick={() => handleDelete(p.id)}>🗑️ حذف</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <footer className="footer-gold">فخر الصناعة والخدمة السعودية 🇸🇦 2026</footer>
    </div>
  );
}

export default App;