import React, { useState, useEffect } from 'react';
import './App.css';

// الرابط الرسمي للمحرك على Render
const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('store'); // store أو reports
  const [formData, setFormData] = useState({ name: '', price: '', image: '', category: 'كهرباء ⚡' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = () => {
    fetch(API_URL).then(res => res.json()).then(data => setProducts(data))
    .catch(err => console.error("⚠️ فشل الاتصال بالمحرك:", err));
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price) return alert("يرجى إدخال الاسم والسعر");
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setFormData({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm("هل تريد حذف هذه القطعة من المخزن؟")) {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const filtered = products.filter(p => p.name.includes(search));
  const totalValue = products.reduce((acc, p) => acc + Number(p.price), 0);

  return (
    <div className="App">
      <header className="main-header">
        <h1>💧 متجر قطرة وشرارة ⚡</h1>
        <div className="nav">
          <button onClick={() => setView('store')}>🏠 المتجر</button>
          {isAdmin && <button onClick={() => setView('reports')}>📊 التقارير</button>}
          <button onClick={() => { if(prompt("كلمة المرور:") === "123") setIsAdmin(!isAdmin); }}>🔒</button>
        </div>
      </header>

      {isAdmin && view === 'store' && (
        <div className="admin-panel">
          <input placeholder="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input placeholder="السعر" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          <input placeholder="رابط الصورة من جوجل" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>كهرباء ⚡</option>
            <option>سباكة 💧</option>
          </select>
          <button className="add-btn" onClick={handleAdd}>إضافة للمخزن 📦</button>
        </div>
      )}

      {view === 'reports' ? (
        <div className="reports">
          <h2>📊 تقرير المخزون</h2>
          <div className="stat">القيمة الإجمالية: <strong>{totalValue} ريال</strong></div>
          <div className="stat">عدد القطع: <strong>{products.length}</strong></div>
        </div>
      ) : (
        <div className="container">
          <input className="search" placeholder="🔍 ابحث عن بضاعة..." onChange={e => setSearch(e.target.value)} />
          <div className="grid">
            {filtered.map(p => (
              <div key={p.id} className="card">
                <img src={p.image || 'https://via.placeholder.com/150'} alt={p.name} />
                <h4>{p.name}</h4>
                <p>{p.price} ريال</p>
                {isAdmin && <button className="del-btn" onClick={() => handleDelete(p.id)}>🗑️ حذف</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;