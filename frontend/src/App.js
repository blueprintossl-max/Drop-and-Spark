import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';
const WHATSAPP_NUM = "9665XXXXXXXX"; 

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [adminSearch, setAdminSearch] = useState(''); // بحث الإدارة
  const [adminCat, setAdminCat] = useState('الكل'); // فلتر الإدارة
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', image: '', category: 'كهرباء ⚡', is_sale: false });
  const [showCart, setShowCart] = useState(false);

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProducts(data);
    } catch (e) { console.log("السيرفر نائم.."); }
  };

  const saveProduct = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/${editingItem.id}` : API_URL;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      alert("✅ تمت العملية بنجاح");
      setEditingItem(null);
      setFormData({ name: '', price: '', old_price: '', image: '', category: 'كهرباء ⚡', is_sale: false });
      fetchProducts();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, image: reader.result });
    if (file) reader.readAsDataURL(file);
  };

  // تصفية المنتجات في لوحة الإدارة حسب البحث والقسم
  const filteredAdmin = products.filter(p => 
    p.name.includes(adminSearch) && (adminCat === 'الكل' || p.category === adminCat)
  );

  if (isAdmin) {
    return (
      <div className="App admin-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-header">📦 قائمة المنتجات</div>
          <div className="sidebar-controls">
            <input 
              className="admin-search" 
              placeholder="🔍 ابحث بالاسم..." 
              value={adminSearch} 
              onChange={(e) => setAdminSearch(e.target.value)} 
            />
            <div className="admin-filters">
              <button onClick={() => setAdminCat('الكل')} className={adminCat === 'الكل' ? 'active' : ''}>الكل</button>
              <button onClick={() => setAdminCat('كهرباء ⚡')} className={adminCat === 'كهرباء ⚡' ? 'active' : ''}>كهرباء</button>
              <button onClick={() => setAdminCat('سباكة 💧')} className={adminCat === 'سباكة 💧' ? 'active' : ''}>سباكة</button>
            </div>
          </div>
          <div className="sidebar-list">
            {filteredAdmin.map(p => (
              <div key={p.id} className={`list-item ${p.category.includes('كهرباء') ? 'elec-row' : 'plumb-row'}`}>
                <img src={p.image} className="thumb" alt="" />
                <div className="item-meta">
                  <span className="item-name">{p.name}</span>
                  <span className="item-price">{p.price} ريال</span>
                </div>
                <div className="item-btns">
                  <button onClick={() => {setEditingItem(p); setFormData(p);}}>✏️</button>
                  <button onClick={async () => {if(window.confirm('حذف؟')){await fetch(`${API_URL}/${p.id}`,{method:'DELETE'}); fetchProducts();}}}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="admin-main">
          <header className="royal-admin-nav">
            <div className="logo-gold">💧 مَتجر قَطرة وشرارة ⚡</div>
            <a href="/" className="back-link">🏠 العودة للمتجر</a>
          </header>

          <div className="form-container">
            <div className="royal-card">
              <h2>{editingItem ? '✏️ تعديل بيانات القطعة' : '➕ إضافة صنف جديد'}</h2>
              <div className="form-grid">
                <div className="input-group">
                  <label>اسم المنتج</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>السعر الحالي</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>السعر القديم (للخصم)</label>
                  <input type="number" value={formData.old_price} onChange={e => setFormData({...formData, old_price: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>القسم</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>كهرباء ⚡</option>
                    <option>سباكة 💧</option>
                  </select>
                </div>
              </div>
              
              <label className={`fire-toggle ${formData.is_sale ? 'on' : ''}`}>
                <input type="checkbox" checked={formData.is_sale} onChange={e => setFormData({...formData, is_sale: e.target.checked})} />
                🔥 تفعيل شعار "عرض خاص" على الصورة
              </label>

              <div className="upload-area">
                {formData.image && <img src={formData.image} className="preview-img" alt="" />}
                <label className="custom-upload">
                  📤 {formData.image ? "تغيير الصورة" : "رفع صورة المنتج"}
                  <input type="file" accept="image/*" onChange={handleFileUpload} />
                </label>
              </div>

              <button className="save-btn-royal" onClick={saveProduct}>
                {editingItem ? 'تحديث البيانات الآن 💾' : 'حفظ في قاعدة البيانات 📦'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ... (كود صفحة العميل يبقى كما هو في الرد السابق لضمان استقراره)
  return (
    <div className="App client-theme">
      <header className="royal-header">
        <div className="logo">💧 <span>مَتجر</span> قَطرة وشرارة ⚡</div>
        <button className="cart-btn" onClick={() => setShowCart(true)}>🛒 السلة ({cart.length})</button>
      </header>
      <main className="container">
        <div className="store-grid">
          {products.map(p => (
            <div key={p.id} className="product-card">
              {p.is_sale && <div className="fire-badge">🔥 عرض خاص</div>}
              <div className="img-holder"><img src={p.image} alt="" /></div>
              <div className="p-info">
                <h3>{p.name}</h3>
                <div className="price-row">
                  <span className="now">{p.price} ريال</span>
                  {p.old_price && <span className="old">{p.old_price} ريال</span>}
                </div>
                <button className="add-cart" onClick={() => setCart([...cart, p])}>إضافة للسلة 🛒</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;