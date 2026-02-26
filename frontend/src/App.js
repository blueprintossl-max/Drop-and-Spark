/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import './App.css';

// الرابط المعتمد للسيرفر الجديد
const API_URL = 'https://drop-and-spark-1.onrender.com';

function App() {
  // ==============================
  // 1. تعريف المتغيرات (State)
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

  // Admin Views (نظام التنقل)
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

  // Client View States
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
  // 3. دوال المعالجة (Handlers)
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
      } else {
        setAlert("❌ بيانات الدخول غير صحيحة");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setAlert("❌ مشكلة في الاتصال بالسيرفر");
    }
  };

  const handleChangeMyPassword = async () => {
    if (!newPasswordInput) return setAlert("⚠️ يرجى إدخال الرمز");
    try {
      const res = await fetch(`${API_URL}/admins/${currentUser.id}/pin`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPin: newPasswordInput }) });
      if (res.ok) { const updatedUser = await res.json(); setCurrentUser(updatedUser); setAlert("✅ تم تغيير الرمز السري!"); setNewPasswordInput(''); fetchAllData(); }
    } catch (error) {}
  };

  const handleCheckoutPOS = async () => {
    if (adminCart.length === 0) return setAlert("⚠️ السلة فارغة");
    try {
      const subtotal = adminCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const discountValue = vipDiscount ? (subtotal * (Number(vipDiscount) / 100)) : 0;
      const finalTotal = subtotal - discountValue;

      const res = await fetch(`${API_URL}/pos/checkout`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ cart: adminCart, total: finalTotal, modified_by: currentUser.username }) 
      });
      if (res.ok) {
        if (editingOrderId) await fetch(`${API_URL}/orders/${editingOrderId}/complete`, { method: 'PUT' });
        setAlert("✅ تم اعتماد العملية وخصم المخزون");
        setAdminCart([]); setVipDiscount(''); setEditingOrderId(null); setAdminView('orders'); fetchAllData(); 
      }
    } catch (error) { setAlert("❌ حدث خطأ في الشبكة"); }
  };

  const handleSaveProduct = async () => {
    if (!formData.name) return setAlert("⚠️ يرجى إدخال اسم المنتج");
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, category: activeSubCat.name, modified_by: currentUser.username }) });
    setAlert("✅ تم حفظ المنتج بنجاح"); setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false }); fetchAllData();
  };

  const handleBulkInventoryUpdate = async (product, isAdding) => {
    const qtyInput = invBulkInputs[product.id]; const amount = Number(qtyInput);
    if (!qtyInput || isNaN(amount) || amount <= 0) return setAlert("⚠️ رقم غير صحيح");
    let newStock = Number(product.stock); let newSold = Number(product.sold || 0);
    if (isAdding) { newStock += amount; } else { if (newStock < amount) return setAlert("❌ تتجاوز المخزون!"); newStock -= amount; newSold += amount; }
    try { await fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, stock: newStock, sold: newSold, modified_by: currentUser.username }) }); setAlert("✅ تم التحديث"); setInvBulkInputs(prev => ({ ...prev, [product.id]: '' })); fetchAllData(); } catch (e) {}
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
  // 💻 واجهة الإدارة (Side-Bar + Content Navigation)
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
          {/* Dashboard Summary Cards */}
          {adminView !== 'pos' && adminView !== 'orders' && (
            <div className="admin-top-dashboard">
              <div className="dash-card"><h4>المنتجات</h4><h2>{products.length}</h2></div>
              <div className="dash-card"><h4>العمال</h4><h2>{workers.length}</h2></div>
              <div className="dash-card highlight-card"><h4>أرباح المبيعات</h4><h2>{totalSystemProfits} <span>ر.س</span></h2></div>
            </div>
          )}

          {/* 1. نظام الطلبات */}
          {adminView === 'orders' && (
            <div className="fade-in">
              <div className="panel-card mb-20">
                <h2>📥 الطلبات الواردة (معلقة)</h2>
                <table className="pro-table">
                  <thead><tr><th>رقم</th><th>العميل</th><th>الوقت</th><th>الإجمالي</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {pendingOrders.map(o => (
                      <tr key={o.id}>
                        <td>#{o.id}</td><td>{o.customer_name}</td><td>{new Date(o.created_at).toLocaleString('ar-SA')}</td><td>{o.total} ر.س</td>
                        <td><button className="add-btn" onClick={() => { setAdminCart(o.cart_data); setEditingOrderId(o.id); setAdminView('pos'); }}>مراجعة ✏️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. نظام الكاشير (POS) */}
          {adminView === 'pos' && (
            <div className="pos-container fade-in">
              <div className="pos-products-section">
                <input type="text" className="pos-search" placeholder="🔍 ابحث عن منتج بالاسم..." value={posSearch} onChange={e => setPosSearch(e.target.value)}/>
                <div className="pos-grid">
                  {products.filter(p => !posSearch || p.name.includes(posSearch)).map(p => (
                    <div key={p.id} className="pos-card" onClick={() => { if(p.stock > 0) setAdminCart([...adminCart, {...p, qty: 1}]) }}>
                      {p.stock <= 0 && <div className="pos-out">نفدت</div>}
                      <img src={p.image} alt=""/><h5>{p.name}</h5><span>{p.price} ر.س</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pos-cart-section">
                <h3>سلة المبيعات</h3>
                <div className="pos-cart-items">
                  {adminCart.map((item, i) => (
                    <div key={i} className="pos-cart-row">
                      <span>{item.name}</span>
                      <div className="qty-c"><b>{item.qty}</b></div>
                      <span>{item.price * item.qty} ر.س</span>
                    </div>
                  ))}
                </div>
                <div className="pos-totals">
                   المجموع: {adminCart.reduce((s, i) => s + (i.price * i.qty), 0)} ر.س
                </div>
                <button className="pos-checkout-btn" onClick={handleCheckoutPOS}>اعتماد البيع ✅</button>
              </div>
            </div>
          )}

          {/* 3. نظام المخزون (Inventory) */}
          {adminView === 'inventory' && (
            <div className="fade-in">
              {!invMainCat ? (
                <div className="panel-card"><h2>📦 الجرد: القسم الرئيسي</h2><div className="folders-grid">{mainCategoriesList.map(cat => (<div key={cat.id} className="folder-card main" onClick={() => setInvMainCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>
              ) : !invSubCat ? (
                <div className="panel-card"><button onClick={() => setInvMainCat(null)}>🔙 رجوع</button><h2>📦 القسم الفرعي لـ {invMainCat.name}</h2><div className="folders-grid">{categories.filter(c => c.parent === invMainCat.name).map(cat => (<div key={cat.id} className="folder-card sub" onClick={() => setInvSubCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>
              ) : (
                <div className="panel-card"><button onClick={() => setInvSubCat(null)}>🔙 رجوع</button>
                  <table className="pro-table">
                    <thead><tr><th>المنتج</th><th>الحالي</th><th>تعديل يدوياً</th></tr></thead>
                    <tbody>
                      {products.filter(p => p.category === invSubCat.name).map(p => (
                        <tr key={p.id}>
                          <td>{p.name}</td><td>{p.stock}</td>
                          <td>
                            <input type="number" className="bulk-input" value={invBulkInputs[p.id] || ''} onChange={e => setInvBulkInputs({...invBulkInputs, [p.id]: e.target.value})}/>
                            <button className="btn-plus-bulk" onClick={() => handleBulkInventoryUpdate(p, true)}>+</button>
                            <button className="btn-minus-bulk" onClick={() => handleBulkInventoryUpdate(p, false)}>-</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. إدارة المنتجات والأقسام */}
          {adminView === 'categories' && (
            <div className="panel-card fade-in">
              {!activeMainCat ? (
                <><h2>1. الأقسام الرئيسية</h2><div className="add-row"><input placeholder="قسم جديد..." value={newMainName} onChange={e => setNewMainName(e.target.value)}/><button onClick={() => { /* دالة الإضافة */ }}>إضافة</button></div><div className="folders-grid">{mainCategoriesList.map(c => <div className="folder-card main" onClick={() => setActiveMainCat(c)}>{c.name}</div>)}</div></>
              ) : !activeSubCat ? (
                <><h2>2. الأقسام الفرعية لـ {activeMainCat.name}</h2><button onClick={() => setActiveMainCat(null)}>🔙 رجوع</button><div className="folders-grid">{categories.filter(c => c.parent === activeMainCat.name).map(c => <div className="folder-card sub" onClick={() => setActiveSubCat(c)}>{c.name}</div>)}</div></>
              ) : (
                <>
                  <div className="path-header"><button onClick={() => setActiveSubCat(null)}>🔙</button> {activeMainCat.name} ⬅️ {activeSubCat.name}</div>
                  <div className="product-entry-form">
                    <input className="f-input" placeholder="اسم المنتج..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                    <input className="f-input" type="number" placeholder="السعر" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/>
                    <input type="file" onChange={e => handleImageUpload(e, 'image')}/>
                    <button className="save-btn" onClick={handleSaveProduct}>حفظ في القسم ✅</button>
                  </div>
                  <div className="mini-products-list">
                    {products.filter(p => p.category === activeSubCat.name).map(p => <div key={p.id} className="m-prod-row"><span>{p.name}</span><b>{p.price} ر.س</b></div>)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 5. إدارة العمال */}
          {adminView === 'workers' && (
            <div className="panel-card fade-in">
              <h2>👷‍♂️ إدارة عمال الصيانة</h2>
              <div className="product-entry-form">
                 <input placeholder="اسم العامل" value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})}/>
                 <input placeholder="رقم الجوال" value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}/>
                 <button className="save-btn" onClick={() => { /* دالة حفظ العامل */ }}>إضافة عامل 👷‍♂️</button>
              </div>
              <div className="folders-grid mt-30">
                {workers.map(w => <div key={w.id} className="worker-admin-card"><h4>{w.name}</h4><small>{w.profession}</small></div>)}
              </div>
            </div>
          )}

          {/* 6. التقارير المالية */}
          {adminView === 'reports' && (
            <div className="panel-card fade-in">
              <h2>📊 التقارير والأرباح</h2>
              <table className="pro-table">
                <thead><tr><th>القسم</th><th>المباع</th><th>الأرباح</th></tr></thead>
                <tbody>
                  {mainCategoriesList.map(cat => (
                    <tr key={cat.id}><td>{cat.name}</td><td>--</td><td>-- ر.س</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 7. إدارة الموظفين (للمدير فقط) */}
          {adminView === 'users' && isManager && (
            <div className="panel-card fade-in">
              <h2>👥 إدارة طاقم الإدارة</h2>
              <div className="add-row">
                 <input placeholder="الاسم" value={newAdminForm.username} onChange={e => setNewAdminForm({...newAdminForm, username: e.target.value})}/>
                 <input placeholder="الرمز" type="password" value={newAdminForm.pin} onChange={e => setNewAdminForm({...newAdminForm, pin: e.target.value})}/>
                 <button className="add-btn" onClick={() => { /* دالة حفظ الموظف */ }}>إضافة</button>
              </div>
              <table className="pro-table mt-20">
                <thead><tr><th>الاسم</th><th>الصلاحية</th><th>الرمز</th></tr></thead>
                <tbody>
                  {admins.map(a => <tr key={a.id}><td>{a.username}</td><td>{a.role}</td><td>****</td></tr>)}
                </tbody>
              </table>
            </div>
          )}

          {/* 8. إعدادات المتجر */}
          {adminView === 'settings' && isManager && (
            <div className="panel-card fade-in">
              <h2>⚙️ إعدادات المتجر العامة</h2>
              <div className="form-group"><label>اسم المتجر:</label><input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/></div>
              <div className="form-group"><label>واتساب التواصل:</label><input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/></div>
              <button className="save-btn" onClick={() => setAlert("✅ تم حفظ الإعدادات")}>حفظ التعديلات</button>
            </div>
          )}

          {/* 9. ملفي الشخصي */}
          {adminView === 'profile' && (
            <div className="panel-card fade-in">
              <h2>👤 إعدادات حسابي الشخصي</h2>
              <p>مرحباً بك: {currentUser.username}</p>
              <div className="form-group"><label>تغيير الرمز السري:</label><input type="password" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)}/></div>
              <button className="save-btn" onClick={handleChangeMyPassword}>تحديث الرمز 🔒</button>
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
    <div className={`App client-theme ${showCart || showWorkersHaraj ? 'no-scroll' : ''}`}>
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <div className="search-bar-wrapper"><input placeholder="🔍 ابحث عن أي منتج..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
         <div style={{display:'flex', gap:'10px'}}>
             <button className="open-cart-large" onClick={() => setShowWorkersHaraj(true)}>👷‍♂️ العمال</button>
             <button className="open-cart-large" onClick={() => setShowCart(true)}>🛒 السلة ({cart.length})</button>
         </div>
      </header>
      
      {!searchQuery && (
        <>
          <div className="client-main-bar">{mainCategoriesList.map(cat => (<button key={cat.id} className={clientMain === cat.name ? 'active' : ''} onClick={() => setClientMain(cat.name)}>{cat.name}</button>))}</div>
          {categories.filter(c => c.parent === clientMain).length > 0 && (<div className="client-sub-bar">{categories.filter(c => c.parent === clientMain).map(subCat => (<button key={subCat.id} className={clientSub === subCat.name ? 'active' : ''} onClick={() => setClientSub(subCat.name)}>{subCat.name}</button>))}</div>)}
        </>
      )}
      
      <div className="gallery-container">
        <div className="p-grid-royal">
          {products.filter(p => (!searchQuery || p.name.includes(searchQuery)) && (!clientSub || p.category === clientSub)).map(product => (
            <div key={product.id} className="royal-p-card" onClick={() => setSelectedProduct(product)}>
              <div className="p-img-box"><img src={product.image} alt={product.name} /></div>
              <div className="p-info-box">
                <h4>{product.name}</h4><span className="now-price">{product.price} ر.س</span>
                <button className="add-btn-p" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>أضف للسلة 🛒</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* نوافذ منبثقة (Modals) */}
      {showWorkersHaraj && (
        <div className="cart-overlay open">
          <div className="cart-inner-container-large">
             <div className="cart-header-fixed"><h2>👷‍♂️ حراج العمال والصيانة</h2><button onClick={() => setShowWorkersHaraj(false)}>✕</button></div>
             <div className="workers-grid" style={{padding:'20px'}}>
                {workers.map(w => (<div key={w.id} className="worker-card"><h3>{w.name}</h3><p>{w.profession}</p><button onClick={() => window.open(`https://wa.me/${w.phone}`)}>واتساب 💬</button></div>))}
             </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="cart-overlay open">
          <div className="cart-inner-container-large">
            <div className="cart-header-fixed"><h2>سلة المشتريات</h2><button onClick={() => setShowCart(false)}>✕</button></div>
            <div className="cart-products-scroll" style={{padding:'20px'}}>
              {cart.length === 0 ? <h3>السلة فارغة</h3> : cart.map((item, index) => <div key={index}>{item.name} - {item.price} ر.س</div>)}
              {cart.length > 0 && (
                <>
                  <input placeholder="الاسم" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  <input placeholder="رقم الجوال" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                  <button onClick={() => setAlert("✅ تم إرسال طلبك بنجاح")}>إرسال الطلب ✅</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;