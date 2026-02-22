import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';

function App() {
  const [products, setProducts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('store');
  const [formData, setFormData] = useState({ name: '', price: '', image: '', category: 'كهرباء ⚡' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProducts(data);
    } catch (e) { console.log("السيرفر نائم.."); }
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

  const login = () => {
    const p = prompt("أدخل كلمة المرور:");
    if (p === "123") {
      setIsAdmin(true);
      alert("🔓 أهلاً بك يا مدير المتجر، تم تفعيل لوحة التحكم");
    } else { alert("❌ عذراً، كلمة المرور خاطئة"); }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price || !formData.image) return alert("⚠️ يرجى إكمال البيانات ورفع الصورة أولاً");
    
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert("🚀 رائع! تم حفظ المنتج بنجاح وسيظهر الآن للعملاء");
      setFormData({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
      fetchProducts();
    } else {
      alert("❌ حدث خطأ أثناء الحفظ، حاول مرة أخرى");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("🗑️ هل تريد حذف هذا الصنف نهائياً؟")) {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      alert("✅ تم الحذف بنجاح");
      fetchProducts();
    }
  };

  return (
    <div className="App">
      <header className="navbar">
        <div className="brand">💧 قطرة وشرارة ⚡</div>
        <div className="nav-actions">
          <button onClick={() => setView('store')}>🏠 المعرض</button>
          {isAdmin && <button onClick={() => setView('reports')}>📊 التقارير</button>}
          <button onClick={login} className="admin-btn">{isAdmin ? "👑 مدير" : "🔒 دخول"}</button>
        </div>
      </header>

      {isAdmin && view === 'store' && (
        <section className="add-box">
          <h2>📦 إضافة قطعة جديدة للمخزن</h2>
          <div className="form-ui">
            <input placeholder="اسم القطعة" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input placeholder="السعر (ريال)" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            <label className="upload-btn">
               {formData.image ? "🖼️ صورة جاهزة" : "📤 رفع صورة القطعة"}
              <input type="file" accept="image/*" onChange={handleFileUpload} />
            </label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option>كهرباء ⚡</option>
              <option>سباكة 💧</option>
            </select>
            <button onClick={handleAdd} className="submit-btn">إضافة الآن 🚀</button>
          </div>
        </section>
      )}

      {view === 'reports' ? (
        <div className="reports-view">
          <h2>📊 جرد المستودع الحالي</h2>
          <div className="stat-grid">
            <div className="stat-item"><h3>عدد القطع</h3><p>{products.length}</p></div>
            <div className="stat-item"><h3>إجمالي القيمة</h3><p>{products.reduce((a,b)=>a+Number(b.price),0)} ريال</p></div>
          </div>
        </div>
      ) : (
        <main className="gallery">
          <div className="product-grid">
            {products.map(p => (
              <div key={p.id} className="item-card">
                <img src={p.image} alt={p.name} />
                <div className="details">
                  <h4>{p.name}</h4>
                  <p className="price-tag">{p.price} ريال</p>
                  {isAdmin && <button className="trash-btn" onClick={() => handleDelete(p.id)}>🗑️ حذف</button>}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;