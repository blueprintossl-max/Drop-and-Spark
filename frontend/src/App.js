/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import './App.css';

// الرابط المعتمد للسيرفر الجديد
const API_URL = 'https://drop-and-spark-1.onrender.com';

function App() {
  // ==============================
  // 1. التعريفات الأساسية (State)
  // ==============================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '', shop_name: '' });
  const [admins, setAdmins] = useState([]); 
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const isManager = currentUser && currentUser.role && currentUser.role.trim() === 'مدير';
  const [showPin, setShowPin] = useState({});

  // Admin Views & Navigation
  const [adminView, setAdminView] = useState('orders'); 
  const [activeMainCat, setActiveMainCat] = useState(null);
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [newMainName, setNewMainName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  
  // Inventory
  const [invMainCat, setInvMainCat] = useState(null);
  const [invSubCat, setInvSubCat] = useState(null);
  const [invBulkInputs, setInvBulkInputs] = useState({});

  // Forms
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false });
  const [editingItem, setEditingItem] = useState(null);
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', portfolio_img: '', safety_details: '', rating: '5.0', is_busy: false });
  const [editingWorker, setEditingWorker] = useState(null);
  const [newAdminForm, setNewAdminForm] = useState({ username: '', pin: '', role: 'موظف' });
  const [editingAdmin, setEditingAdmin] = useState(null);

  // POS
  const [adminCart, setAdminCart] = useState([]);
  const [vipDiscount, setVipDiscount] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [posMainCat, setPosMainCat] = useState('');
  const [posSubCat, setPosSubCat] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);

  // Client states
  const [showCart, setShowCart] = useState(false);
  const [showWorkersHaraj, setShowWorkersHaraj] = useState(false); 
  const [harajRegion, setHarajRegion] = useState('');
  const [harajCity, setHarajCity] = useState('');
  const [clientMain, setClientMain] = useState('');
  const [clientSub, setClientSub] = useState('');
  const [itemQtys, setItemQtys] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const isAdminPanel = window.location.pathname.includes('/admin');

  // ==============================
  // 2. جلب البيانات (Effect)
  // ==============================
  useEffect(() => { fetchAllData(); }, []); 
  useEffect(() => { if (alert) { const timer = setTimeout(() => { setAlert(null); }, 4500); return () => clearTimeout(timer); } }, [alert]);

  const fetchAllData = async () => {
    try {
      const [pRes, cRes, wRes, sRes, aRes, oRes] = await Promise.all([
        fetch(`${API_URL}/products`), fetch(`${API_URL}/categories`), fetch(`${API_URL}/workers`), 
        fetch(`${API_URL}/settings`), fetch(`${API_URL}/admins`), fetch(`${API_URL}/orders`)
      ]);
      const catsData = await cRes.json();
      setProducts(await pRes.json());
      setCategories(catsData);
      setWorkers(await wRes.json());
      setSettings(await sRes.json());
      setAdmins(await aRes.json());
      setOrders(await oRes.json());
      
      const mainCategories = catsData.filter(c => !c.parent);
      if (!isAdminPanel && mainCategories.length > 0 && !clientMain) {
         setClientMain(mainCategories[0].name);
         const subCategories = catsData.filter(c => c.parent === mainCategories[0].name);
         if (subCategories.length > 0) { setClientSub(subCategories[0].name); }
      }
    } catch (error) { console.error("Fetch Error"); }
  };

  // ==============================
  // 3. دوال الإدارة والعمليات (Handlers)
  // ==============================
  const handleLogin = async () => {
    if (!loginUsername || !loginPin) return setAlert("⚠️ يرجى إدخال اسم المستخدم والرمز السري");
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), pin: loginPin })
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        setAdminView('orders');
        setAlert("✅ تم تسجيل الدخول بنجاح");
      } else { setAlert("❌ بيانات الدخول غير صحيحة"); }
    } catch (error) { setAlert("❌ مشكلة في الاتصال بالسيرفر"); }
  };

  const handleSaveProduct = async () => {
    if (!formData.name) return setAlert("⚠️ يرجى إدخال اسم المنتج");
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, category: activeSubCat.name, modified_by: currentUser.username }) });
      if (res.ok) {
        setAlert("✅ تم حفظ المنتج بنجاح"); setEditingItem(null); 
        setFormData({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false }); 
        fetchAllData();
      }
    } catch (e) { setAlert("❌ خطأ في الحفظ"); }
  };

  const handleAddMainCategory = async () => {
    if (!newMainName) return;
    await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newMainName, icon: '📁', parent: '' }) });
    setNewMainName(''); fetchAllData();
  };

  const handleAddSubCategory = async () => {
    if (!newSubName) return;
    await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSubName, icon: '📂', parent: activeMainCat.name }) });
    setNewSubName(''); fetchAllData();
  };

  const handleBulkInventoryUpdate = async (product, isAdding) => {
    const qtyInput = invBulkInputs[product.id]; const amount = Number(qtyInput);
    if (!qtyInput || isNaN(amount) || amount <= 0) return setAlert("⚠️ رقم غير صحيح");
    let newStock = Number(product.stock); let newSold = Number(product.sold || 0);
    if (isAdding) { newStock += amount; } else { if (newStock < amount) return setAlert("❌ تتجاوز المخزون!"); newStock -= amount; newSold += amount; }
    try { await fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, stock: newStock, sold: newSold, modified_by: currentUser.username }) }); setAlert("✅ تم التحديث"); setInvBulkInputs(prev => ({ ...prev, [product.id]: '' })); fetchAllData(); } catch (e) {}
  };

  const handleCheckoutPOS = async () => {
    if (adminCart.length === 0) return setAlert("⚠️ السلة فارغة");
    try {
      const res = await fetch(`${API_URL}/pos/checkout`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ cart: adminCart, modified_by: currentUser.username }) 
      });
      if (res.ok) {
        if (editingOrderId) await fetch(`${API_URL}/orders/${editingOrderId}/complete`, { method: 'PUT' });
        setAlert("✅ تم اعتماد العملية بنجاح"); setAdminCart([]); setEditingOrderId(null); setAdminView('orders'); fetchAllData(); 
      }
    } catch (error) { setAlert("❌ حدث خطأ"); }
  };

  const handleImageUpload = (e, targetField, isWorker = false) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => { 
      if (isWorker) setWorkerForm({ ...workerForm, [targetField]: event.target.result });
      else {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => { 
          const cvs = document.createElement('canvas'); cvs.width = 500; cvs.height = img.height * (500 / img.width); 
          const ctx = cvs.getContext('2d'); ctx.drawImage(img, 0, 0, cvs.width, cvs.height); 
          setFormData({ ...formData, [targetField]: cvs.toDataURL('image/jpeg', 0.6) }); 
        };
      }
    };
  };

  const addToCart = (product, fallbackQty = 1) => {
    const customQty = itemQtys[product.id] || fallbackQty;
    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) { const newCart = [...cart]; newCart[existingIndex].qty += customQty; setCart(newCart); 
    } else { setCart([...cart, { ...product, qty: customQty }]); }
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'تمت الإضافة للسلة 🛒', showConfirmButton: false, timer: 1500 });
  };

  // =========================================================================
  // 💻 واجهة الإدارة (Side-Bar + Views)
  // =========================================================================
  if (isAdminPanel) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          <div className="login-box glass-effect">
            <h1 className="gradient-text-large">نظام الإدارة</h1>
            <input className="login-input" type="text" placeholder="اسم المستخدم..." value={loginUsername} onChange={e => setLoginUsername(e.target.value)} />
            <input className="login-input" type="password" placeholder="الرمز السري..." value={loginPin} onChange={e => setLoginPin(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleLogin(); }}/>
            <button onClick={handleLogin}>دخول 🗝️</button>
            <a href="/" className="login-back-link">للمتجر 🏠</a>
          </div>
          {alert && <div className="toast-notification">{alert}</div>}
        </div>
      );
    }

    const pendingOrders = orders.filter(o => o.status === 'معلق');
    const mainCategoriesList = categories.filter(c => !c.parent);
    const totalSystemProfits = products.reduce((sum, p) => sum + ((Number(p.sold) || 0) * Number(p.price)), 0);

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ الإدارة<div className="user-badge">👤 {currentUser.username}</div></div>
          <nav className="side-nav">
            <button className={adminView === 'orders' ? 'active' : ''} onClick={() => setAdminView('orders')}>📥 الطلبات الواردة {pendingOrders.length > 0 && <span className="notification-badge">{pendingOrders.length}</span>}</button>
            <button className={adminView === 'pos' ? 'active' : ''} onClick={() => setAdminView('pos')}>🛒 نقطة البيع (كاشير)</button>
            <button className={adminView === 'inventory' ? 'active' : ''} onClick={() => setAdminView('inventory')}>📦 المخزون اليدوي</button>
            <button className={adminView === 'categories' ? 'active' : ''} onClick={() => setAdminView('categories')}>🗂️ المنتجات</button>
            <button className={adminView === 'workers' ? 'active' : ''} onClick={() => setAdminView('workers')}>👷‍♂️ العمال</button>
            {isManager && (
              <>
                <button className={adminView === 'reports' ? 'active' : ''} onClick={() => setAdminView('reports')}>📊 التقارير</button>
                <button className={adminView === 'users' ? 'active' : ''} onClick={() => setAdminView('users')}>👥 الموظفين</button>
                <button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>⚙️ الإعدادات</button>
              </>
            )}
            <button className={adminView === 'profile' ? 'active' : ''} onClick={() => setAdminView('profile')}>👤 حسابي</button>
          </nav>
          <div className="side-footer"><button className="logout-btn" onClick={() => setIsAuthenticated(false)}>خروج 🚪</button></div>
        </aside>

        <main className="content-70">
          {adminView !== 'pos' && adminView !== 'orders' && (
            <div className="admin-top-dashboard">
              <div className="dash-card"><h4>المنتجات</h4><h2>{products.length}</h2></div>
              <div className="dash-card"><h4>العمال</h4><h2>{workers.length}</h2></div>
              <div className="dash-card highlight-card"><h4>أرباح المبيعات</h4><h2>{totalSystemProfits} <span>ر.س</span></h2></div>
            </div>
          )}

          {adminView === 'orders' && (
            <div className="fade-in">
              <div className="panel-card">
                <h2>📥 الطلبات الواردة (معلقة)</h2>
                <table className="pro-table">
                  <thead><tr><th>رقم</th><th>العميل</th><th>الإجمالي</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {pendingOrders.map(o => (<tr key={o.id}><td>#{o.id}</td><td>{o.customer_name}</td><td>{o.total} ر.س</td><td><button className="add-btn" onClick={() => { setAdminCart(o.cart_data); setEditingOrderId(o.id); setAdminView('pos'); }}>مراجعة ✏️</button></td></tr>))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminView === 'pos' && (
            <div className="pos-container fade-in">
              <div className="pos-products-section">
                <input type="text" className="pos-search" placeholder="🔍 بحث سريع..." value={posSearch} onChange={e => setPosSearch(e.target.value)}/>
                <div className="pos-grid">
                  {products.filter(p => !posSearch || p.name.includes(posSearch)).map(p => (
                    <div key={p.id} className="pos-card" onClick={() => { if(p.stock > 0) setAdminCart([...adminCart, {...p, qty: 1}]) }}>
                      <img src={p.image} alt=""/><h5>{p.name}</h5><span>{p.price} ر.س</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pos-cart-section"><h3>السلة</h3><button className="pos-checkout-btn" onClick={handleCheckoutPOS}>اعتماد ✅</button></div>
            </div>
          )}

          {adminView === 'categories' && (
            <div className="panel-card fade-in">
              {!activeMainCat ? (
                <><h2>الأقسام الرئيسية</h2><div className="add-row"><input placeholder="قسم جديد..." value={newMainName} onChange={e => setNewMainName(e.target.value)}/><button className="add-btn" onClick={handleAddMainCategory}>إضافة</button></div><div className="folders-grid">{mainCategoriesList.map(c => <div className="folder-card main" onClick={() => setActiveMainCat(c)}>{c.name}</div>)}</div></>
              ) : !activeSubCat ? (
                <><h2>الأقسام الفرعية لـ {activeMainCat.name}</h2><button onClick={() => setActiveMainCat(null)}>🔙</button><div className="add-row"><input placeholder="قسم فرعي..." value={newSubName} onChange={e => setNewSubName(e.target.value)}/><button className="add-btn" onClick={handleAddSubCategory}>إضافة</button></div><div className="folders-grid">{categories.filter(c => c.parent === activeMainCat.name).map(c => <div className="folder-card sub" onClick={() => setActiveSubCat(c)}>{c.name}</div>)}</div></>
              ) : (
                <>
                  <h2>إضافة منتج في {activeSubCat.name}</h2><button onClick={() => setActiveSubCat(null)}>🔙</button>
                  <div className="product-entry-form">
                    <input placeholder="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                    <input placeholder="السعر" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/>
                    <input type="file" onChange={e => handleImageUpload(e, 'image')}/>
                    <button className="save-btn" onClick={handleSaveProduct}>حفظ المنتج ✅</button>
                  </div>
                </>
              )}
            </div>
          )}

          {adminView === 'inventory' && (
            <div className="fade-in">
              {!invMainCat ? (<div className="panel-card"><h2>📦 المخزون اليدوي</h2><div className="folders-grid">{mainCategoriesList.map(cat => (<div key={cat.id} className="folder-card main" onClick={() => setInvMainCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>) : !invSubCat ? (<div className="panel-card"><button onClick={() => setInvMainCat(null)}>🔙</button><h2>📦 الفرعي لـ {invMainCat.name}</h2><div className="folders-grid">{categories.filter(c => c.parent === invMainCat.name).map(cat => (<div key={cat.id} className="folder-card sub" onClick={() => setInvSubCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>) : (
                <div className="panel-card"><button onClick={() => setInvSubCat(null)}>🔙</button>
                  <table className="pro-table"><thead><tr><th>المنتج</th><th>المخزون</th><th>تعديل</th></tr></thead><tbody>{products.filter(p => p.category === invSubCat.name).map(p => (<tr key={p.id}><td>{p.name}</td><td>{p.stock}</td><td><input type="number" value={invBulkInputs[p.id] || ''} onChange={e => setInvBulkInputs({...invBulkInputs, [p.id]: e.target.value})}/><button className="btn-plus-bulk" onClick={() => handleBulkInventoryUpdate(p, true)}>+</button><button className="btn-minus-bulk" onClick={() => handleBulkInventoryUpdate(p, false)}>-</button></td></tr>))}</tbody></table>
                </div>
              )}
            </div>
          )}
          
          {adminView === 'settings' && isManager && (
            <div className="panel-card fade-in">
              <h2>⚙️ إعدادات المتجر العامة</h2>
              <div className="form-group"><label>اسم المتجر</label><input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/></div>
              <div className="form-group"><label>واتساب التواصل</label><input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/></div>
              <button className="save-btn full-w-btn" onClick={async () => { await fetch(`${API_URL}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); setAlert("✅ تم الحفظ");}}>حفظ التعديلات</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================================
  // 💻 واجهة العميل (Storefront)
  // =========================================================================
  return (
    <div className={`App client-theme`}>
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <div style={{display:'flex', gap:'10px'}}>
             <button onClick={() => setShowWorkersHaraj(true)}>👷‍♂️ العمال</button>
             <button onClick={() => setShowCart(true)}>🛒 السلة ({cart.length})</button>
         </div>
      </header>
      <div className="gallery-container">
        <div className="p-grid-royal">
          {products.filter(p => (!clientSub || p.category === clientSub)).map(p => (
            <div key={p.id} className="royal-p-card">
              <img src={p.image} alt="" /><h4>{p.name}</h4><span className="now-price">{p.price} ر.س</span>
              <button onClick={() => addToCart(p)}>أضف للسلة</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;