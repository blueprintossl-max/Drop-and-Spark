import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';

function App() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('store');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = () => {
    fetch(API_URL).then(res => res.json()).then(data => setProducts(data)).catch(err => console.log("السيرفر نائم.."));
  };

  const handleCapture = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, image: reader.result });
    if (file) reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price || !formData.image) return alert("⚠️ صور المنتج وأكمل البيانات");
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setFormData({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm("حذف القطعة؟")) {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const totalValue = products.reduce((acc, p) => acc + Number(p.price), 0);
  const filtered = products.filter(p => p.name.includes(search));

  return (
    <div className="App">
      <header className="header">
        <h1>💧 قطرة وشرارة ⚡</h1>
        <div className="menu">
          <button onClick={() => setView('store')}>🏠 المتجر</button>
          {isAdmin && <button onClick={() => setView('reports')}>📊 التقارير</button>}
          <button onClick={() => { if(prompt("كلمة السر:") === "123") setIsAdmin(!isAdmin); }}>🔒</button>
        </div>
      </header>

      {isAdmin && view === 'store' && (
        <div className="admin-box">
          <input placeholder="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input placeholder="السعر" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          <label className="cam-btn">
            📷 {formData.image ? "تم التصوير ✅" : "اضغط لتصوير المنتج"}
            <input type="file" accept="image/*" onChange={handleCapture} style={{display:'none'}} />
          </label>
          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>كهرباء ⚡</option>
            <option>سباكة 💧</option>
          </select>
          <button className="save-btn" onClick={handleAdd}>إضافة للمخزن 📦</button>
        </div>
      )}

      {view === 'reports' ? (
        <div className="reports">
          <h2>📊 ملخص المستودع</h2>
          <div className="stat-card">إجمالي البضائع: {products.length} قطعة</div>
          <div className="stat-card">قيمة المخزون: {totalValue} ريال</div>
        </div>
      ) : (
        <main>
          <input className="search" placeholder="🔍 ابحث عن بضاعة..." onChange={e => setSearch(e.target.value)} />
          <div className="grid">
            {filtered.map(p => (
              <div key={p.id} className="card">
                <img src={p.image} alt={p.name} />
                <h4>{p.name}</h4>
                <p>{p.price} ريال</p>
                {isAdmin && <button className="del" onClick={() => handleDelete(p.id)}>🗑️ حذف</button>}
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;