import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';

function App() {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState('store'); // store أو reports
  const [formData, setFormData] = useState({ name: '', price: '', image: '', category: 'كهرباء ⚡' });

  // التحقق من الرابط السري للإدارة (إذا انتهى الرابط بـ /admin)
  const isAdminPath = window.location.pathname.includes('/admin');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProducts(data);
    } catch (e) { alert("⚠️ السيرفر نائم، انتظر ثواني وحدث الصفحة"); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result });
      alert("✅ تم رفع الصورة بنجاح وتجهيزها للعرض");
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price || !formData.image) return alert("⚠️ يرجى إكمال البيانات ورفع صورة أولاً");
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      alert("🚀 رائع! تم حفظ المنتج بنجاح وسيظهر للعملاء فوراً");
      setFormData({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
      fetchProducts();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("🗑️ هل تريد حذف هذا الصنف من المستودع؟")) {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      alert("✅ تم الحذف بنجاح");
      fetchProducts();
    }
  };

  // لوحة الإدارة السريّة
  if (isAdminPath) {
    return (
      <div className="App admin-theme">
        <header className="admin-header">
          <h1>⚙️ لوحة تحكم المدير</h1>
          <div className="admin-nav">
            <button onClick={() => setView('add')}>➕ إضافة بضاعة</button>
            <button onClick={() => setView('reports')}>📊 التقارير</button>
            <a href="/" className="exit-btn">🏠 خروج للمتجر</a>
          </div>
        </header>

        <div className="admin-container">
          {view === 'reports' ? (
            <div className="reports-section">
              <h2>📊 جرد المستودع الحالي</h2>
              <div className="stats-box">
                <div className="stat-card"><h3>إجمالي المنتجات</h3><p>{products.length}</p></div>
                <div className="stat-card"><h3>قيمة المخزون</h3><p>{products.reduce((a,b)=>a+Number(b.price),0)} ريال</p></div>
              </div>
            </div>
          ) : (
            <div className="add-section">
              <h2>📦 توريد بضاعة جديدة</h2>
              <div className="modern-form">
                <input placeholder="اسم القطعة" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input placeholder="السعر" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                <label className="upload-zone">
                  {formData.image ? "🖼️ الصورة جاهزة" : "📤 رفع صورة القطعة"}
                  <input type="file" accept="image/*" onChange={handleFileUpload} />
                </label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>كهرباء ⚡</option>
                  <option>سباكة 💧</option>
                </select>
                <button onClick={handleAdd} className="action-btn">حفظ في المستودع 📦</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // صفحة العميل (المعرض)
  return (
    <div className="App client-theme">
      <header className="main-nav">
        <div className="brand-box">
          <span className="mini-title">مَتجر</span>
          <h1 className="gold-title">قَطرة وشرارة</h1>
        </div>
      </header>

      <main className="client-container">
        <div className="search-wrapper">
          <input type="text" placeholder="🔍 ابحث عن قطعة غيار..." />
        </div>

        <div className="items-grid">
          {products.map(p => (
            <div key={p.id} className="item-card">
              <div className="image-box"><img src={p.image} alt={p.name} /></div>
              <div className="info-box">
                <h4>{p.name}</h4>
                <div className="price-tag">{p.price} <span>ريال</span></div>
                <span className="category-label">{p.category}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
      <footer className="footer">جميع الحقوق محفوظة لمتجر قطرة وشرارة 2026</footer>
    </div>
  );
}

export default App;