import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '', shop_name: '' });
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  const [adminView, setAdminView] = useState('inventory'); // inventory, reports, settings
  const [adminSearch, setAdminSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showCart, setShowCart] = useState(false);
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
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData) });
    if (res.ok) { 
      setAlert("✅ تم حفظ التعديلات في النظام");
      setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: 0, category: 'كهرباء ⚡', image: '', is_sale: false, out_of_stock: false });
      fetchProducts();
    }
  };

  if (isAdmin) {
    const filtered = products.filter(p => p.name.includes(adminSearch));
    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ إدارة {settings.shop_name}</div>
          <div className="side-search-box">
             <input placeholder="🔍 ابحث عن صنف للتعديل..." onChange={e => setAdminSearch(e.target.value)} />
          </div>
          <nav className="side-nav">
            <button onClick={() => setAdminView('inventory')} className={adminView==='inventory'?'active':''}>📦 المستودع</button>
            <button onClick={() => setAdminView('reports')} className={adminView==='reports'?'active':''}>📊 التقارير</button>
            <button onClick={() => setAdminView('settings')} className={adminView==='settings'?'active':''}>🛠️ الإعدادات</button>
            <a href="/" className="exit-btn">🏠 المتجر</a>
          </nav>
          <div className="side-inventory-list">
             {filtered.map(p => (
               <div key={p.id} className={`p-row-item ${p.category.includes('كهرباء') ? 'elec' : 'plumb'}`} onClick={() => {setEditingItem(p); setFormData(p);}}>
                  <img src={p.image} className="mini-thumb" alt="" />
                  <div className="mini-meta"><span>{p.name}</span><br/><small>مخزون: {p.stock}</small></div>
               </div>
             ))}
          </div>
        </aside>

        <main className="content-70">
          {adminView === 'reports' ? (
            <div className="reports-view">
               <h2 className="gold-text">📊 التقرير المالي والجرد</h2>
               <div className="stats-grid">
                  <div className="stat-card"><h3>قيمة البضاعة</h3><p>{products.reduce((a,b)=>a+(Number(b.price)*Number(b.stock)),0)} ريال</p></div>
                  <div className="stat-box-total"><h3>إجمالي القطع</h3><p>{products.reduce((a,b)=>a+Number(b.stock),0)}</p></div>
               </div>
            </div>
          ) : adminView === 'settings' ? (
            <div className="card-ui">
              <h2 className="gold-text">🛠️ إعدادات النظام الإداري</h2>
              <div className="form-group"><label>رقم الواتساب</label><input value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})} /></div>
              <div className="form-group"><label>اسم المتجر</label><input value={settings.shop_name} onChange={e=>setSettings({...settings, shop_name:e.target.value})} /></div>
              <button className="gold-btn-action" onClick={async () => {
                await fetch(`${API_URL}/settings`, {method:'PUT', headers:{{'Content-Type':'application/json'}}, body:JSON.stringify(settings)});
                setAlert("✅ تم تحديث بيانات الإدارة");
              }}>حفظ الإعدادات 💾</button>
            </div>
          ) : (
            <div className="card-ui">
              <h2 className="gold-text">{editingItem ? '✏️ تعديل صنف مختار' : '➕ إضافة صنف جديد'}</h2>
              <div className="form-grid-3">
                 <input placeholder="الاسم" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                 <input placeholder="السعر" type="number" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                 <input placeholder="المخزون" type="number" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})}/>
                 <select value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                    <option>كهرباء ⚡</option><option>سباكة 💧</option>
                 </select>
              </div>
              <div className="btn-toggle-row">
                 {/* تغير الألوان فوراً عند الضغط */}
                 <button className={`t-btn ${formData.is_sale?'on':''}`} onClick={()=>{setFormData({...formData, is_sale:!formData.is_sale}); setAlert("🔥 تم تفعيل العرض");}}>🔥 عرض ناري</button>
                 <button className={`t-btn ${formData.out_of_stock?'on':''}`} onClick={()=>{setFormData({...formData, out_of_stock:!formData.out_of_stock}); setAlert("🚫 تم تغيير التوفر");}}>🚫 نفد</button>
              </div>
              <button className="btn-save-final" onClick={handleSave}>حفظ في المستودع الملكي 📦</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="App client-theme">
      {alert && <div className="toast-notification">{alert}</div>}
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <button className="open-cart-large" onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>
      <div className="gallery-container">
        <div className="p-grid-royal">
          {products.map(p => (
            <div key={p.id} className="royal-p-card">
              {p.is_sale && <div className="fire-tag">🔥 عرض ناري</div>}
              {p.out_of_stock && <div className="sold-tag">نفدت الكمية</div>}
              <div className="p-img-box"><img src={p.image} alt="" /></div>
              <div className="p-info-box">
                <h4>{p.name}</h4>
                <div className="p-price-tag">{p.price} ريال {p.old_price > 0 && <del>{p.old_price}</del>}</div>
                {!p.out_of_stock && <button className="add-btn-p" onClick={() => {setCart([...cart, p]); setAlert("✅ تم إضافة المنتج للسلة");}}>إضافة للسلة 🛒</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={`cart-left-panel ${showCart?'open':''}`}>
         <div className="cart-inner">
            <button className="close-btn-x" onClick={() => setShowCart(false)}>إغلاق ❌</button>
            <h2>🛍️ سلة مقتنياتك</h2>
            <div className="cart-list-scroll">
               {cart.map((item, i) => <div key={i} className="cart-row"><span>{item.name}</span><span>{item.price} ريال</span></div>)}
            </div>
            <div className="total-gold-box">الإجمالي: {cart.reduce((a,b)=>a+Number(b.price),0)} ريال</div>
            <button className="btn-wa-confirm" onClick={() => window.open(`https://wa.me/${settings.phone}?text=طلب جديد من المتجر`)}>تأكيد الطلب واتساب ✅</button>
         </div>
      </div>
    </div>
  );
}

export default App;