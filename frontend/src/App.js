import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '' });
  const [cart, setCart] = useState([]);
  const [adminView, setAdminView] = useState('inventory');
  const [alert, setAlert] = useState(null); // نظام الإشعارات
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: 0, category: 'كهرباء ⚡', image: '', is_sale: false, out_of_stock: false });
  const [showCart, setShowCart] = useState(false);

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => {
    fetchProducts();
    fetchSettings();
    if (alert) setTimeout(() => setAlert(null), 3000); // إخفاء الإشعار تلقائياً
  }, [alert]);

  const fetchProducts = () => fetch(`${API_URL}/products`).then(r => r.json()).then(setProducts);
  const fetchSettings = () => fetch(`${API_URL}/settings`).then(r => r.json()).then(setSettings);

  const saveProduct = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    const res = await fetch(url, {
      method,
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setAlert("✅ تم حفظ التعديلات بنجاح في المستودع");
      setEditingItem(null);
      setFormData({ name: '', price: '', old_price: '', stock: 0, category: 'كهرباء ⚡', image: '', is_sale: false, out_of_stock: false });
      fetchProducts();
    }
  };

  const handleWhatsApp = () => {
    let msg = `*طلب جديد - مَتجر قطرة وشرارة* 💧⚡\n\n`;
    cart.forEach(i => msg += `- ${i.name} | ${i.price} ريال\n`);
    msg += `\n*الإجمالي: ${cart.reduce((a,b)=>a+Number(b.price), 0)} ريال*`;
    window.open(`https://wa.me/${settings.phone}?text=${encodeURIComponent(msg)}`);
  };

  if (isAdmin) {
    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ مَتجر قَطرة وشرارة</div>
          <nav className="side-links">
            <button onClick={() => setAdminView('inventory')} className={adminView==='inventory'?'active':''}>📦 المستودع</button>
            <button onClick={() => setAdminView('reports')} className={adminView==='reports'?'active':''}>📊 التقارير</button>
            <button onClick={() => setAdminView('settings')} className={adminView==='settings'?'active':''}>🛠️ الإعدادات</button>
            <a href="/" className="view-store">🏠 معاينة المتجر</a>
          </nav>
        </aside>

        <main className="content-70">
          {adminView === 'inventory' ? (
            <div className="editor-container">
              <div className="royal-form-card">
                <h2>{editingItem ? '✏️ تعديل صنف' : '➕ إضافة صنف جديد'}</h2>
                <div className="form-grid">
                  <input placeholder="اسم المنتج" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
                  <input placeholder="السعر الحالي" type="number" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} />
                  <input placeholder="السعر القديم" type="number" value={formData.old_price} onChange={e=>setFormData({...formData, old_price:e.target.value})} />
                  <input placeholder="الكمية المتوفرة" type="number" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})} />
                </div>
                
                <div className="status-toggles">
                  {/* أزرار الحالة التفاعلية التي يتغير لونها */}
                  <button 
                    className={`toggle-btn sale ${formData.is_sale ? 'active' : ''}`} 
                    onClick={() => {setFormData({...formData, is_sale: !formData.is_sale}); setAlert("🔥 تم تغيير حالة العرض");}}
                  >🔥 عرض خاص</button>
                  
                  <button 
                    className={`toggle-btn stock ${formData.out_of_stock ? 'active' : ''}`} 
                    onClick={() => {setFormData({...formData, out_of_stock: !formData.out_of_stock}); setAlert("🚫 تم تغيير حالة التوفر");}}
                  >🚫 نفذت الكمية</button>
                </div>

                <button className="save-action-btn" onClick={saveProduct}>حفظ في قاعدة البيانات 📦</button>
              </div>

              <div className="admin-p-list">
                <h3>🔍 جرد المنتجات ({products.length})</h3>
                <div className="p-scroll-box">
                  {products.map(p => (
                    <div key={p.id} className="p-admin-row" onClick={() => {setEditingItem(p); setFormData(p);}}>
                      <img src={p.image} alt="" />
                      <div className="p-row-text">
                        <p><strong>{p.name}</strong></p>
                        <p>المخزون: {p.stock} | {p.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : adminView === 'reports' ? (
            <div className="reports-section">
              {/* كود التقارير المفصل كما في الرد السابق */}
            </div>
          ) : (
            <div className="settings-section">
               {/* كود تعديل الجوال والإيميل */}
            </div>
          )}
        </main>
      </div>
    );
  }

  // واجهة العميل
  return (
    <div className="App customer-theme">
      {alert && <div className="toast-notification">{alert}</div>}
      <header className="royal-nav">
        <div className="brand">💧 مَتجر قَطرة وشرارة ⚡</div>
        <button className="cart-link" onClick={() => setShowCart(true)}>🛒 السلة ({cart.length})</button>
      </header>
      {/* ... بقية المعرض مع السلة اليسرى الكبيرة ... */}
    </div>
  );
}

export default App;