import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ phone: '' });
  const [alert, setAlert] = useState(null);
  const [adminView, setAdminView] = useState('inventory');
  const [adminSearch, setAdminSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: 0, category: 'كهرباء ⚡', image: '', is_sale: false, out_of_stock: false });

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => {
    fetchProducts(); fetchSettings();
    if (alert) setTimeout(() => setAlert(null), 3000);
  }, [alert]);

  const fetchProducts = () => fetch(`${API_URL}/products`).then(r => r.json()).then(setProducts);
  const fetchSettings = () => fetch(`${API_URL}/settings`).then(r => r.json()).then(setSettings);

  const handleSave = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    const res = await fetch(url, {
      method, headers: {'Content-Type':'application/json'},
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setAlert("✅ تم الحفظ بنجاح");
      setEditingItem(null);
      setFormData({ name: '', price: '', old_price: '', stock: 0, category: 'كهرباء ⚡', image: '', is_sale: false, out_of_stock: false });
      fetchProducts();
    }
  };

  if (isAdmin) {
    const filtered = products.filter(p => p.name.includes(adminSearch));
    return (
      <div className="admin-root">
        {alert && <div className="toast">{alert}</div>}
        <aside className="sidebar-30">
          <div className="side-head">⚙️ الإدارة الملكية</div>
          <input className="side-search" placeholder="🔍 ابحث عن قطعة..." onChange={e => setAdminSearch(e.target.value)} />
          <nav className="side-nav">
            <button onClick={() => setAdminView('inventory')} className={adminView==='inventory'?'active':''}>📦 المستودع</button>
            <button onClick={() => setAdminView('settings')} className={adminView==='settings'?'active':''}>🛠️ الإعدادات</button>
            <a href="/" className="btn-exit">🏠 المتجر</a>
          </nav>
          <div className="side-list">
            {filtered.map(p => (
              <div key={p.id} className="p-row-mini" onClick={() => {setEditingItem(p); setFormData(p);}}>
                <img src={p.image} alt="" />
                <span>{p.name} | {p.stock}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="content-70">
          {adminView === 'settings' ? (
            <div className="card-ui">
              <h2>🛠️ بيانات التواصل الإدارية</h2>
              <input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} placeholder="9665xxxxxxxx" />
              <button className="btn-gold" onClick={async () => {
                await fetch(`${API_URL}/settings`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(settings)});
                setAlert("✅ تم تحديث رقم الجوال");
              }}>حفظ بيانات الإدارة 💾</button>
            </div>
          ) : (
            <div className="card-ui">
              <h2>{editingItem ? '✏️ تعديل صنف' : '➕ صنف جديد'}</h2>
              <div className="form-grid-2">
                <input placeholder="الاسم" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                <input placeholder="السعر" type="number" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                <input placeholder="المخزون" type="number" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})}/>
                <select value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                  <option>كهرباء ⚡</option><option>سباكة 💧</option>
                </select>
              </div>
              <div className="admin-toggles">
                {/* تغير الألوان فوراً عند الضغط */}
                <button className={`t-btn sale ${formData.is_sale?'on':''}`} onClick={()=>setFormData({...formData, is_sale:!formData.is_sale})}>🔥 عرض خاص</button>
                <button className={`t-btn stock ${formData.out_of_stock?'on':''}`} onClick={()=>setFormData({...formData, out_of_stock:!formData.out_of_stock})}>🚫 نفذت الكمية</button>
              </div>
              <button className="btn-save-final" onClick={handleSave}>حفظ في المستودع 📦</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="App client-theme">
      <header className="royal-header">
        <div className="logo">💧 <span>مَتجر</span> قَطرة وشرارة ⚡</div>
      </header>
      <div className="container-p">
        <div className="grid-p">
          {products.map(p => (
            <div key={p.id} className="card-p">
              {p.is_sale && <div className="badge-fire">🔥 عرض ناري</div>}
              {p.out_of_stock && <div className="badge-sold">نفد</div>}
              <div className="img-p"><img src={p.image} alt="" /></div>
              <div className="info-p">
                <h4>{p.name}</h4>
                <p>{p.price} ريال</p>
                <button className="btn-cart">إضافة للسلة 🛒</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;