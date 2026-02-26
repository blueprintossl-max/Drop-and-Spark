/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import './App.css';

// الرابط المعتمد للسيرفر بناءً على ملف server.js الخاص بك
const API_URL = 'https://drop-and-spark-1.onrender.com';

function App() {
  // =========================================================
  // 1. التعريفات الأساسية (State Management)
  // =========================================================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [settings, setSettings] = useState({ phone: '', shop_name: '' });
  const [admins, setAdmins] = useState([]); 
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);

  // نظام الحماية والدخول (Auth)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPin, setShowPin] = useState({});
  const isManager = currentUser && currentUser.role && currentUser.role.trim() === 'مدير';

  // نظام التنقل (Navigation)
  const [adminView, setAdminView] = useState('orders'); 
  const [activeMainCat, setActiveMainCat] = useState(null);
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [newMainName, setNewMainName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  
  // المخزون والكاشير (POS & Inventory)
  const [invMainCat, setInvMainCat] = useState(null);
  const [invSubCat, setInvSubCat] = useState(null);
  const [invBulkInputs, setInvBulkInputs] = useState({});
  const [adminCart, setAdminCart] = useState([]);
  const [vipDiscount, setVipDiscount] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [posMainCat, setPosMainCat] = useState('');
  const [posSubCat, setPosSubCat] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);

  // النماذج (Forms)
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false });
  const [editingItem, setEditingItem] = useState(null);
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', rating: '5.0', is_busy: false });
  const [editingWorker, setEditingWorker] = useState(null);
  const [newAdminForm, setNewAdminForm] = useState({ username: '', pin: '', role: 'موظف' });
  const [editingAdmin, setEditingAdmin] = useState(null);

  // واجهة العميل (Storefront)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
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

  // =========================================================
  // 2. محرك جلب البيانات (The Fetch Engine)
  // =========================================================
  useEffect(() => { fetchAllData(); }, []); 
  useEffect(() => { if (alert) { const timer = setTimeout(() => { setAlert(null); }, 4500); return () => clearTimeout(timer); } }, [alert]);

  const fetchAllData = async () => {
    try {
      // استدعاء كافة البيانات بناءً على مسارات السيرفر
      const [pRes, cRes, wRes, sRes, aRes, oRes] = await Promise.all([
        fetch(`${API_URL}/api/products`), 
        fetch(`${API_URL}/api/categories`), 
        fetch(`${API_URL}/api/workers`), 
        fetch(`${API_URL}/api/settings`), 
        fetch(`${API_URL}/api/admins`), 
        fetch(`${API_URL}/api/orders`)
      ]);
      
      const productsData = await pRes.json();
      const categoriesData = await cRes.json();
      const workersData = await wRes.json();
      const settingsData = await sRes.json();
      const adminsData = await aRes.json();
      const ordersData = await oRes.json();

      setProducts(productsData);
      setCategories(categoriesData);
      setWorkers(workersData);
      setSettings(settingsData);
      setAdmins(adminsData);
      setOrders(ordersData);
      
      // إعداد الأقسام الافتراضية لواجهة العميل
      const mainCategories = categoriesData.filter(c => !c.parent);
      if (!isAdminPanel && mainCategories.length > 0 && !clientMain) {
         setClientMain(mainCategories[0].name);
         const subCategories = categoriesData.filter(c => c.parent === mainCategories[0].name);
         if (subCategories.length > 0) setClientSub(subCategories[0].name);
      }
    } catch (error) { console.error("Database connection error"); }
  };

  // =========================================================
  // 3. دوال العمليات (Handlers) - مطابقة 100% للسيرفر
  // =========================================================

  // 🔐 نظام الدخول
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

  // ⚙️ حفظ إعدادات المتجر
  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'تم الحفظ', text: 'تم تحديث إعدادات المتجر بنجاح' });
        fetchAllData();
      }
    } catch (e) { setAlert("❌ خطأ في الحفظ"); }
  };

  // 📦 إدارة المنتجات
  const handleSaveProduct = async () => {
    if (!formData.name || !activeSubCat) return setAlert("⚠️ يرجى اختيار القسم واسم المنتج");
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/api/products/${editingItem.id}` : `${API_URL}/api/products`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, category: activeSubCat.name, modified_by: currentUser.username })
    });
    if (res.ok) {
      setAlert("✅ تم حفظ المنتج");
      setEditingItem(null);
      setFormData({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false });
      fetchAllData();
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      const res = await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAllData();
    }
  };

  // 👷‍♂️ إدارة العمال
  const handleSaveWorker = async () => {
    if (!workerForm.name || !workerForm.phone) return setAlert("⚠️ الاسم والجوال مطلوبان");
    const method = editingWorker ? 'PUT' : 'POST';
    const url = editingWorker ? `${API_URL}/api/workers/${editingWorker.id}` : `${API_URL}/api/workers`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...workerForm, modified_by: currentUser.username })
    });
    if (res.ok) {
      setAlert("✅ تم حفظ بيانات العامل");
      setWorkerForm({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', rating: '5.0', is_busy: false });
      setEditingWorker(null);
      fetchAllData();
    }
  };

  // 👥 إدارة الموظفين
  const handleSaveAdmin = async () => {
    if (!newAdminForm.username || !newAdminForm.pin) return setAlert("⚠️ يرجى إكمال البيانات");
    const method = editingAdmin ? 'PUT' : 'POST';
    const url = editingAdmin ? `${API_URL}/api/admins/${editingAdmin.id}` : `${API_URL}/api/admins`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAdminForm)
    });
    if (res.ok) {
      setAlert("✅ تم حفظ الموظف");
      setNewAdminForm({ username: '', pin: '', role: 'موظف' });
      setEditingAdmin(null);
      fetchAllData();
    } else { setAlert("❌ الاسم مسجل مسبقاً"); }
  };

  // 🛒 نظام البيع POS
  const handleCheckoutPOS = async () => {
    if (adminCart.length === 0) return setAlert("⚠️ السلة فارغة");
    const res = await fetch(`${API_URL}/api/pos/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: adminCart, modified_by: currentUser.username })
    });
    if (res.ok) {
      if (editingOrderId) await fetch(`${API_URL}/api/orders/${editingOrderId}/complete`, { method: 'PUT' });
      Swal.fire({ icon: 'success', title: 'تم الاعتماد', text: 'تم خصم الكميات وتسجيل العملية' });
      setAdminCart([]);
      setEditingOrderId(null);
      setAdminView('orders');
      fetchAllData();
    }
  };

  // 📦 الجرد اليدوي
  const handleBulkInventoryUpdate = async (product, isAdding) => {
    const qty = Number(invBulkInputs[product.id]);
    if (!qty || qty <= 0) return setAlert("⚠️ أدخل كمية صحيحة");
    let newStock = Number(product.stock) + (isAdding ? qty : -qty);
    if (newStock < 0) return setAlert("❌ المخزون غير كافٍ");
    
    const res = await fetch(`${API_URL}/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, stock: newStock, modified_by: currentUser.username })
    });
    if (res.ok) {
      setAlert("✅ تم تحديث المخزون");
      setInvBulkInputs({ ...invBulkInputs, [product.id]: '' });
      fetchAllData();
    }
  };

  // 🖼️ معالجة الصور
  const handleImageUpload = (e, target) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (ev) => {
       const img = new Image(); img.src = ev.target.result;
       img.onload = () => {
          const canvas = document.createElement('canvas'); canvas.width = 500; canvas.height = img.height * (500/img.width);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          if (target === 'worker') setWorkerForm({...workerForm, image: dataUrl});
          else setFormData({...formData, image: dataUrl});
       }
    }
  };

  // =========================================================
  // 4. واجهة لوحة التحكم (Admin Panel)
  // =========================================================
  if (isAdminPanel) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          <div className="login-box glass-effect">
            <h1 className="gradient-text-large">نظام الإدارة</h1>
            <input className="login-input" placeholder="اسم المستخدم" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} />
            <input className="login-input" type="password" placeholder="الرمز السري" value={loginPin} onChange={e => setLoginPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button onClick={handleLogin}>دخول 🗝️</button>
            <a href="/" className="login-back-link">العودة للمتجر 🏠</a>
          </div>
          {alert && <div className="toast-notification">{alert}</div>}
        </div>
      );
    }

    const mainCategoriesList = categories.filter(c => !c.parent);
    const pendingOrders = orders.filter(o => o.status === 'معلق');

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ إدارة تشاطيب<div className="user-badge">👤 {currentUser.username}</div></div>
          <nav className="side-nav">
            <button className={adminView === 'orders' ? 'active' : ''} onClick={() => setAdminView('orders')}>📥 الطلبات {pendingOrders.length > 0 && <span className="notification-badge">{pendingOrders.length}</span>}</button>
            <button className={adminView === 'pos' ? 'active' : ''} onClick={() => { setAdminView('pos'); setEditingOrderId(null); setAdminCart([]); }}>🛒 الكاشير (POS)</button>
            <button className={adminView === 'inventory' ? 'active' : ''} onClick={() => setAdminView('inventory')}>📦 المخزون اليدوي</button>
            <button className={adminView === 'categories' ? 'active' : ''} onClick={() => setAdminView('categories')}>🗂️ المنتجات والأقسام</button>
            <button className={adminView === 'workers' ? 'active' : ''} onClick={() => setAdminView('workers')}>👷‍♂️ العمال</button>
            {isManager && (
              <>
                <button className={adminView === 'reports' ? 'active' : ''} onClick={() => setAdminView('reports')}>📊 التقارير المالية</button>
                <button className={adminView === 'users' ? 'active' : ''} onClick={() => setAdminView('users')}>👥 الموظفين</button>
                <button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>⚙️ الإعدادات</button>
              </>
            )}
            <button className={adminView === 'profile' ? 'active' : ''} onClick={() => setAdminView('profile')}>👤 حسابي</button>
          </nav>
          <div className="side-footer"><button className="logout-btn" onClick={() => setIsAuthenticated(false)}>خروج 🚪</button></div>
        </aside>

        <main className="content-70">
          {/* Dashboard KPI */}
          {adminView !== 'pos' && adminView !== 'orders' && (
            <div className="admin-top-dashboard">
              <div className="dash-card"><h4>المنتجات</h4><h2>{products.length}</h2></div>
              <div className="dash-card"><h4>العمال</h4><h2>{workers.length}</h2></div>
              <div className="dash-card highlight-card"><h4>الأرباح</h4><h2>{products.reduce((s,p)=>s+(Number(p.sold||0)*Number(p.price)),0)} <span>ر.س</span></h2></div>
            </div>
          )}

          {/* 📥 الطلبات */}
          {adminView === 'orders' && (
            <div className="panel-card fade-in">
              <h2>📥 الطلبات الواردة</h2>
              <table className="pro-table">
                <thead><tr><th>#</th><th>العميل</th><th>الأصناف</th><th>الإجمالي</th><th>إجراء</th></tr></thead>
                <tbody>
                  {pendingOrders.map(o => (
                    <tr key={o.id}>
                      <td>{o.id}</td><td>{o.customer_name}<br/><small>{o.customer_phone}</small></td>
                      <td>{o.cart_data.length} صنف</td><td>{o.total} ر.س</td>
                      <td><button className="add-btn" onClick={() => { setAdminCart(o.cart_data); setEditingOrderId(o.id); setAdminView('pos'); }}>اعتماد ✏️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 🛒 الكاشير */}
          {adminView === 'pos' && (
            <div className="pos-container fade-in">
              <div className="pos-products-section">
                <input className="pos-search" placeholder="🔍 بحث عن منتج..." value={posSearch} onChange={e => setPosSearch(e.target.value)}/>
                <div className="pos-grid">
                  {products.filter(p => !posSearch || p.name.includes(posSearch)).map(p => (
                    <div key={p.id} className="pos-card" onClick={() => p.stock > 0 && setAdminCart([...adminCart, {...p, qty: 1}])}>
                      {p.stock <= 0 && <div className="pos-out">نفدت</div>}
                      <img src={p.image} alt=""/><h5>{p.name}</h5><span>{p.price} ر.س</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pos-cart-section">
                <h3>{editingOrderId ? `تعديل طلب #${editingOrderId}` : 'سلة البيع المباشر'}</h3>
                <div className="pos-cart-items">{adminCart.map((i, idx) => <div key={idx} className="pos-cart-row"><span>{i.name}</span><b>x{i.qty}</b></div>)}</div>
                <button className="pos-checkout-btn" onClick={handleCheckoutPOS}>تأكيد العملية ✅</button>
              </div>
            </div>
          )}

          {/* 🗂️ المنتجات والأقسام */}
          {adminView === 'categories' && (
            <div className="panel-card fade-in">
              {!activeMainCat ? (
                <><h2>الأقسام الرئيسية</h2><div className="add-row"><input placeholder="اسم القسم..." value={newMainName} onChange={e => setNewMainName(e.target.value)}/><button className="add-btn" onClick={() => handleAddCategory(false)}>إضافة</button></div><div className="folders-grid">{mainCategoriesList.map(c => <div className="folder-card main" onClick={() => setActiveMainCat(c)}>{c.name}</div>)}</div></>
              ) : !activeSubCat ? (
                <><h2>الفرعية لـ {activeMainCat.name}</h2><button className="back-btn" onClick={() => setActiveMainCat(null)}>🔙</button><div className="add-row"><input placeholder="فرعي جديد..." value={newSubName} onChange={e => setNewSubName(e.target.value)}/><button className="add-btn" onClick={() => handleAddCategory(true)}>إضافة</button></div><div className="folders-grid">{categories.filter(c => c.parent === activeMainCat.name).map(c => <div className="folder-card sub" onClick={() => setActiveSubCat(c)}>{c.name}</div>)}</div></>
              ) : (
                <>
                  <h2>المنتجات في {activeSubCat.name}</h2><button className="back-btn" onClick={() => setActiveSubCat(null)}>🔙</button>
                  <div className="product-entry-form">
                    <div className="img-upload-box"><img src={formData.image || 'https://via.placeholder.com/150'} alt=""/><label className="upload-label">صورة <input type="file" onChange={e => handleImageUpload(e, 'product')} style={{display:'none'}}/></label></div>
                    <div className="data-entry-box">
                      <input className="f-input" placeholder="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                      <div className="f-row"><input className="f-input" type="number" placeholder="السعر" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/><input className="f-input" type="number" placeholder="المخزون" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}/></div>
                      <button className="save-btn" onClick={handleSaveProduct}>حفظ ✅</button>
                    </div>
                  </div>
                  <div className="mini-products-list mt-30">{products.filter(p => p.category === activeSubCat.name).map(p => <div key={p.id} className="m-prod-row"><span>{p.name}</span><b>{p.price} ر.س</b><button onClick={() => handleDeleteProduct(p.id)}>❌</button></div>)}</div>
                </>
              )}
            </div>
          )}

          {/* 👷‍♂️ العمال */}
          {adminView === 'workers' && (
            <div className="panel-card fade-in">
              <h2>👷‍♂️ إدارة العمال</h2>
              <div className="product-entry-form">
                <input className="f-input" placeholder="اسم العامل" value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})}/>
                <input className="f-input" placeholder="الجوال" value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}/>
                <button className="save-btn" onClick={handleSaveWorker}>إضافة عامل</button>
              </div>
              <div className="folders-grid mt-30">{workers.map(w => <div key={w.id} className="worker-admin-card"><h4>{w.name}</h4><small>{w.profession}</small></div>)}</div>
            </div>
          )}

          {/* 👥 الموظفين */}
          {adminView === 'users' && isManager && (
            <div className="panel-card fade-in">
              <h2>👥 طاقم الإدارة</h2>
              <div className="add-row"><input placeholder="الاسم" value={newAdminForm.username} onChange={e => setNewAdminForm({...newAdminForm, username: e.target.value})}/><input placeholder="الرمز" value={newAdminForm.pin} onChange={e => setNewAdminForm({...newAdminForm, pin: e.target.value})}/><select value={newAdminForm.role} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})}><option value="موظف">موظف</option><option value="مدير">مدير</option></select><button className="add-btn" onClick={handleSaveAdmin}>إضافة</button></div>
              <table className="pro-table mt-20"><thead><tr><th>الاسم</th><th>الصلاحية</th><th>إجراء</th></tr></thead><tbody>{admins.map(a => <tr key={a.id}><td>{a.username}</td><td>{a.role}</td><td><button onClick={() => { if(window.confirm("حذف؟")) fetch(`${API_URL}/api/admins/${a.id}`, {method:'DELETE'}).then(()=>fetchAllData()) }}>❌</button></td></tr>)}</tbody></table>
            </div>
          )}

          {/* ⚙️ الإعدادات */}
          {adminView === 'settings' && isManager && (
            <div className="panel-card fade-in">
              <h2>⚙️ إعدادات المتجر العامة</h2>
              <div className="form-group"><label>اسم المتجر</label><input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/></div>
              <div className="form-group"><label>رقم الجوال</label><input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/></div>
              <button className="save-btn full-w-btn" onClick={handleSaveSettings}>حفظ التعديلات ✅</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================
  // 5. واجهة العميل (Storefront)
  // =========================================================
  return (
    <div className={`App client-theme ${showCart || showWorkersHaraj ? 'no-scroll' : ''}`}>
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name || 'تشاطيب'} ⚡</div>
         <div className="search-bar-wrapper"><input placeholder="🔍 ابحث عن أي منتج..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
         <div style={{display:'flex', gap:'10px'}}>
             <button className="open-cart-large" onClick={() => setShowWorkersHaraj(true)}>👷‍♂️ العمال</button>
             <button className="open-cart-large" onClick={() => setShowCart(true)}>🛒 السلة ({cart.length})</button>
         </div>
      </header>
      
      {!searchQuery && (
        <div className="client-main-bar">
          {categories.filter(c => !c.parent).map(cat => (<button key={cat.id} className={clientMain === cat.name ? 'active' : ''} onClick={() => { setClientMain(cat.name); const sub = categories.filter(x => x.parent === cat.name); if(sub.length > 0) setClientSub(sub[0].name); else setClientSub(''); }}>{cat.name}</button>))}
        </div>
      )}
      
      <div className="gallery-container">
        <div className="p-grid-royal">
          {products.filter(p => (!searchQuery || p.name.includes(searchQuery)) && (!clientSub || p.category === clientSub)).map(product => (
            <div key={product.id} className="royal-p-card" onClick={() => setSelectedProduct(product)}>
              <div className="p-img-box"><img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} /></div>
              <div className="p-info-box">
                <h4>{product.name}</h4><span className="now-price">{product.price} ر.س</span>
                <button className="add-btn-p" onClick={(e) => { e.stopPropagation(); if(!product.out_of_stock) { const existing = cart.findIndex(i => i.id === product.id); if(existing >= 0) { const newC = [...cart]; newC[existing].qty += 1; setCart(newC); } else { setCart([...cart, {...product, qty: 1}]); } Swal.fire({toast:true, position:'top-end', icon:'success', title:'أضيف للسلة', showConfirmButton:false, timer:1500}); } }}>أضف للسلة 🛒</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🛠️ حراج العمال */}
      {showWorkersHaraj && (
        <div className="cart-overlay open">
          <div className="cart-inner-container-large">
             <div className="cart-header-fixed"><h2>👷‍♂️ حراج العمال</h2><button className="close-btn-x" onClick={() => setShowWorkersHaraj(false)}>✕</button></div>
             <div className="workers-grid" style={{padding:'20px'}}>
                {workers.map(w => (<div key={w.id} className="worker-card"><h3>{w.name}</h3><p>{w.profession}</p><button onClick={() => window.open(`https://wa.me/${w.phone}`)}>تواصل 💬</button></div>))}
             </div>
          </div>
        </div>
      )}

      {/* 🛒 سلة العميل */}
      {showCart && (
        <div className="cart-overlay open">
          <div className="cart-inner-container-large">
            <div className="cart-header-fixed"><h2>سلة المشتريات</h2><button className="close-btn-x" onClick={() => setShowCart(false)}>✕</button></div>
            <div className="cart-products-scroll">
              {cart.map((i, idx) => <div key={idx} className="cart-product-row"><span>{i.name}</span><b>{i.price * i.qty} ر.س</b></div>)}
              <div className="customer-info-box"><input className="c-input" placeholder="الاسم" value={customerName} onChange={e => setCustomerName(e.target.value)} /><input className="c-input" placeholder="رقم الجوال" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} /></div>
              <button className="btn-wa-confirm-giant" onClick={async () => {
                const res = await fetch(`${API_URL}/api/orders`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({customer_name:customerName, customer_phone:customerPhone, cart_data:cart, total:cart.reduce((s,i)=>s+(i.price*i.qty),0)}) });
                if(res.ok) { Swal.fire('تم!', 'استلمنا طلبك بنجاح', 'success'); setCart([]); setShowCart(false); fetchAllData(); }
              }}>إرسال الطلب ✅</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;