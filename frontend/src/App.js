import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('store'); // store أو reports

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = () => {
    fetch(API_URL).then(res => res.json()).then(data => setProducts(data));
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price) return alert("الرجاء إكمال البيانات");
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setFormData({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const filtered = products.filter(p => p.name.includes(search));
  
  // التقارير (إحصائيات ذكية)
  const totalValue = products.reduce((acc, p) => acc + Number(p.price), 0);
  const electricityCount = products.filter(p => p.category.includes('كهرباء')).length;
  const plumbingCount = products.filter(p => p.category.includes('سباكة')).length;

  return (
    <div className="App">
      <header className="main-header">
        <h1>💧 متجر قطرة وشرارة ⚡</h1>
        <div className="nav-btns">
          <button onClick={() => setView('store')}>🏠 المتجر</button>
          {isAdmin && <button onClick={() => setView('reports')}>📊 التقارير</button>}
          <button className="lock-btn" onClick={() => { if(prompt("كلمة المرور:") === "123") setIsAdmin(!isAdmin); }}>🔒</button>
        </div>
      </header>

      {isAdmin && view === 'store' && (
        <div className="admin-panel">
          <h3>➕ إضافة بضاعة جديدة</h3>
          <input placeholder="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input placeholder="السعر" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          <input placeholder="رابط الصورة من جوجل" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option>كهرباء ⚡</option>
            <option>سباكة 💧</option>
          </select>
          <button className="add-btn" onClick={handleAdd}>تخزين في المستودع 📦</button>
        </div>
      )}

      {view === 'reports' ? (
        <div className="reports-section">
          <h2>📊 تقرير المخزون الحالي</h2>
          <div className="stats-grid">
            <div className="stat-card"><h3>إجمالي المنتجات</h3><p>{products.length}</p></div>
            <div className="stat-card"><h3>قيمة البضائع</h3><p>{totalValue} ريال</p></div>
            <div className="stat-card"><h3>أدوات الكهرباء</h3><p>{electricityCount}</p></div>
            <div className="stat-card"><h3>أدوات السباكة</h3><p>{plumbingCount}</p></div>
          </div>
        </div>
      ) : (
        <>
          <div className="search-bar">
            <input placeholder="🔍 ابحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid">
            {filtered.map(p => (
              <div key={p.id} className="card">
                <img src={p.image || 'https://via.placeholder.com/150'} alt={p.name} />
                <div className="card-info">
                  <h4>{p.name}</h4>
                  <p className="price">{p.price} ريال</p>
                  <span className="cat-tag">{p.category}</span>
                  {isAdmin && <button className="del-btn" onClick={() => handleDelete(p.id)}>🗑️ حذف</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;