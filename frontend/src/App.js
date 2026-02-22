import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';

function App() {
  const [products, setProducts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('store');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', image: '', category: 'كهرباء ⚡' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProducts(data);
    } catch (e) { console.log("السيرفر نائم.."); }
  };

  const handleCapture = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, image: reader.result });
    if (file) reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price || !formData.image) return alert("⚠️ صور المنتج وأكمل البيانات");
    setLoading(true);
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setFormData({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
    await fetchProducts();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalValue = products.reduce((acc, p) => acc + Number(p.price), 0);

  return (
    <div className="App">
      <nav className="navbar">
        <div className="logo">💧 قطرة وشرارة ⚡</div>
        <div className="nav-links">
          <button onClick={() => setView('store')}>🏠 المعرض</button>
          {isAdmin && <button onClick={() => setView('reports')}>📊 التقارير</button>}
          <button onClick={() => { if(prompt("كلمة السر:") === "123") setIsAdmin(!isAdmin); }}>🔒</button>
        </div>
      </nav>

      {isAdmin && view === 'store' && (
        <div className="admin-section">
          <h2>📦 إضافة بضاعة جديدة</h2>
          <div className="form">
            <input placeholder="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input placeholder="السعر" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            <label className="camera-label">
              {formData.image ? "✅ تم التصوير" : "📸 تصوير المنتج الآن"}
              <input type="file" accept="image/*" capture="environment" onChange={handleCapture} />
            </label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option>كهرباء ⚡</option>
              <option>سباكة 💧</option>
            </select>
            <button onClick={handleAdd} disabled={loading}>{loading ? "جاري الحفظ..." : "إضافة للمخزن 🚀"}</button>
          </div>
        </div>
      )}

      {view === 'reports' ? (
        <div className="reports-page">
          <h2>📊 التحليل المالي للمستودع</h2>
          <div className="stats-grid">
            <div className="stat"><h3>إجمالي الأصناف</h3><p>{products.length}</p></div>
            <div className="stat"><h3>قيمة المخزون</h3><p>{totalValue} ريال</p></div>
          </div>
        </div>
      ) : (
        <main>
          <div className="search-box">
            <input placeholder="🔍 ابحث عن قطعة غيار..." onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="product-grid">
            {filtered.map(p => (
              <div key={p.id} className="product-card">
                <div className="img-container"><img src={p.image} alt={p.name} /></div>
                <h3>{p.name}</h3>
                <p className="price">{p.price} ريال</p>
                <span className="tag">{p.category}</span>
                {isAdmin && <button className="del-btn" onClick={() => handleDelete(p.id)}>🗑️ حذف</button>}
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;