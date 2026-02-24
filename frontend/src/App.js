/* eslint-disable */
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  // =========================================================================
  // 1. حالات النظام الأساسية
  // =========================================================================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '', shop_name: '' });
  const [admins, setAdmins] = useState([]); 
  const [orders, setOrders] = useState([]); // 🌟 حالة الطلبات الواردة
  
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  
  // =========================================================================
  // 2. نظام تسجيل الدخول اليدوي والحماية
  // =========================================================================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // 🔒 جدار الحماية
  const isManager = currentUser && currentUser.role && currentUser.role.trim() === 'مدير';

  // 👁️ إخفاء وإظهار الرمز السري
  const [showPin, setShowPin] = useState({});

  // =========================================================================
  // 3. حالات شاشة الإدارة 
  // =========================================================================
  const [adminView, setAdminView] = useState('orders'); // orders, pos, inventory, categories, workers, reports, users, profile
  
  const [activeMainCat, setActiveMainCat] = useState(null);
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [newMainName, setNewMainName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  
  const [invMainCat, setInvMainCat] = useState(null);
  const [invSubCat, setInvSubCat] = useState(null);
  const [invBulkInputs, setInvBulkInputs] = useState({});

  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false });
  const [editingItem, setEditingItem] = useState(null);
  
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', portfolio_img: '', safety_details: '', rating: '5.0', is_busy: false });
  const [editingWorker, setEditingWorker] = useState(null);
  
  const [newAdminForm, setNewAdminForm] = useState({ username: '', pin: '', role: 'موظف' });
  const [editingAdmin, setEditingAdmin] = useState(null);

  // 🛒 حالات نقطة البيع (الكاشير) المنظمة
  const [adminCart, setAdminCart] = useState([]);
  const [vipDiscount, setVipDiscount] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [posMainCat, setPosMainCat] = useState('');
  const [posSubCat, setPosSubCat] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null); // 🌟 لحفظ رقم الطلب الذي يتم التعديل عليه

  // =========================================================================
  // 4. حالات واجهة العميل
  // =========================================================================
  const [showCart, setShowCart] = useState(false);
  const [showWorkersHaraj, setShowWorkersHaraj] = useState(false); 
  const [clientMain, setClientMain] = useState('');
  const [clientSub, setClientSub] = useState('');
  const [itemQtys, setItemQtys] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [harajRegion, setHarajRegion] = useState('');
  const [harajCity, setHarajCity] = useState('');
  const [sortOption, setSortOption] = useState('default');

  const isAdminPanel = window.location.pathname.includes('/admin');

  useEffect(() => { fetchAllData(); }, []); 
  useEffect(() => { if (alert) { const timer = setTimeout(() => { setAlert(null); }, 4000); return () => clearTimeout(timer); } }, [alert]);

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

      if (isAdminPanel && mainCategories.length > 0 && !posMainCat) {
        setPosMainCat(mainCategories[0].name);
        const subCategories = catsData.filter(c => c.parent === mainCategories[0].name);
        if (subCategories.length > 0) { setPosSubCat(subCategories[0].name); }
      }

    } catch (error) { console.error("Data Fetch Error:", error); }
  };

  const handleLogin = () => {
    if (!loginUsername || !loginPin) return setAlert("⚠️ يرجى إدخال اسم المستخدم والرمز السري");
    const user = admins.find(a => a.username.trim() === loginUsername.trim() && a.pin === loginPin);
    if (user) { 
      setCurrentUser(user); setIsAuthenticated(true); setAdminView('orders'); setAlert(`✅ أهلاً بك يا ${user.username}`); 
    } else { 
      setAlert("❌ بيانات الدخول غير صحيحة"); 
    }
  };

  const handleChangeMyPassword = async () => {
    if (!newPasswordInput) return setAlert("⚠️ يرجى إدخال الرمز السري الجديد");
    try {
      const res = await fetch(`${API_URL}/admins/${currentUser.id}/pin`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin: newPasswordInput })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setCurrentUser(updatedUser); 
        setAlert("✅ تم تغيير الرمز السري بنجاح!");
        setNewPasswordInput('');
        fetchAllData();
      }
    } catch (error) { setAlert("❌ حدث خطأ"); }
  };

  // =========================================================================
  // 🌟 نظام الطلبات والكاشير
  // =========================================================================

  // إرسال طلب العميل للمتجر الوارد
  const handleCustomerSubmitOrder = async () => {
    if (cart.length === 0) return;
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart_data: cart, total: totalAmount })
      });
      
      const newOrder = await res.json();
      
      // فتح الواتساب برسالة منسقة
      let message = `*طلب جديد من المتجر* 🛒\n*رقم الطلب للاعتماد: #${newOrder.id}*\n\n`; 
      cart.forEach(c => { message += `▪️ ${c.name}\n   الكمية: ${c.qty} | السعر: ${c.price} ر.س\n`; }); 
      message += `\n*الإجمالي: ${totalAmount} ر.س*`;
      
      window.open(`https://wa.me/${settings.phone}?text=${encodeURIComponent(message)}`);
      
      setCart([]);
      setShowCart(false);
      setAlert("✅ تم تسجيل الطلب وإرساله للإدارة بنجاح!");
    } catch (e) {
      setAlert("❌ حدث خطأ في الاتصال بالخادم");
    }
  };

  // نقل الطلب الوارد إلى الكاشير للتعديل والاعتماد
  const loadOrderToPOS = (order) => {
    setAdminCart(order.cart_data);
    setEditingOrderId(order.id);
    setAdminView('pos');
    setAlert(`✏️ جاري تعديل طلب رقم #${order.id}`);
  };

  const deletePendingOrder = async (id) => {
    if (window.confirm("إلغاء هذا الطلب وحذفه نهائياً؟")) {
      await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
      fetchAllData();
    }
  };

  const addToAdminCart = (product) => {
    if (product.stock <= 0) return setAlert("❌ هذا المنتج غير متوفر في المستودع");
    const existingIndex = adminCart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) { 
      const newCart = [...adminCart];
      if (newCart[existingIndex].qty >= product.stock) return setAlert("❌ لا يوجد كمية إضافية في المستودع");
      newCart[existingIndex].qty += 1; 
      setAdminCart(newCart); 
    } else { 
      setAdminCart([...adminCart, { ...product, qty: 1 }]); 
    }
  };

  const updateAdminCartQty = (index, change) => {
    const newCart = [...adminCart]; 
    const item = newCart[index];
    if (change > 0 && item.qty >= item.stock) return setAlert("❌ الكمية المطلوبة تتجاوز المخزون");
    item.qty += change; 
    if (item.qty <= 0) newCart.splice(index, 1); 
    setAdminCart(newCart); 
  };

  // اعتماد الفاتورة النهائية من الكاشير
  const handleCheckoutPOS = async () => {
    if (adminCart.length === 0) return setAlert("⚠️ السلة فارغة");
    try {
      const res = await fetch(`${API_URL}/pos/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: adminCart, modified_by: currentUser.username })
      });
      if (res.ok) {
        // إذا كان هذا طلباً وارداً وعدلناه، يجب أن نغير حالته لمكتمل
        if (editingOrderId) {
          await fetch(`${API_URL}/orders/${editingOrderId}/complete`, { method: 'PUT' });
        }
        
        setAlert(editingOrderId ? `✅ تم اعتماد الطلب #${editingOrderId} وخصم المخزون بنجاح!` : "✅ تم البيع المباشر وخصم المخزون بنجاح!");
        setAdminCart([]); 
        setVipDiscount(''); 
        setEditingOrderId(null);
        setAdminView('orders'); // العودة للطلبات
        fetchAllData(); 
      }
    } catch (error) { setAlert("❌ حدث خطأ أثناء الاعتماد"); }
  };

  // =========================================================================
  // دوال الإدارة الأخرى (موظفين، مخزون، منتجات، عمال)
  // =========================================================================
  const togglePinVisibility = (id) => { setShowPin(prev => ({ ...prev, [id]: !prev[id] })); };

  const handleSaveAdmin = async () => {
    if (!newAdminForm.username || !newAdminForm.pin) return setAlert("⚠️ يرجى إدخال اسم الموظف والرمز");
    const method = editingAdmin ? 'PUT' : 'POST';
    const url = editingAdmin ? `${API_URL}/admins/${editingAdmin.id}` : `${API_URL}/admins`;
    try {
      const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAdminForm) });
      if (res.ok) { 
        setAlert(editingAdmin ? "✅ تم التحديث بنجاح" : "✅ تم الإضافة بنجاح"); 
        setNewAdminForm({ username: '', pin: '', role: 'موظف' }); setEditingAdmin(null); fetchAllData(); 
      } else { setAlert("❌ الاسم مسجل مسبقاً"); }
    } catch (e) { console.error(e); }
  };

  const handleDeleteAdmin = async (id) => { if (window.confirm("حذف الموظف نهائياً؟")) { await fetch(`${API_URL}/admins/${id}`, { method: 'DELETE' }); setAlert("🗑️ تم الحذف"); fetchAllData(); } };

  const handleSaveProduct = async () => {
    if (!formData.name) return setAlert("⚠️ يرجى إدخال اسم المنتج");
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    const payload = { ...formData, category: activeSubCat.name, modified_by: currentUser.username };
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setAlert("✅ تم حفظ المنتج"); setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false }); fetchAllData();
  };

  const handleBulkInventoryUpdate = async (product, isAdding) => {
    const qtyInput = invBulkInputs[product.id];
    const amount = Number(qtyInput);
    if (!qtyInput || isNaN(amount) || amount <= 0) return setAlert("⚠️ يرجى كتابة رقم صحيح وموجب في المربع أولاً");

    let newStock = Number(product.stock);
    let newSold = Number(product.sold || 0);

    if (isAdding) { newStock += amount; } 
    else {
      if (newStock < amount) return setAlert("❌ الكمية المراد بيعها أكبر من المخزون!");
      newStock -= amount; newSold += amount;  
    }
    const payload = { ...product, stock: newStock, sold: newSold, modified_by: currentUser.username };
    try {
      await fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); 
      setAlert(isAdding ? `✅ تم تزويد المستودع بـ ${amount} قطعة` : `✅ تم تسجيل بيع ${amount} قطعة بنجاح`);
      setInvBulkInputs(prev => ({ ...prev, [product.id]: '' })); fetchAllData();
    } catch (e) { setAlert("❌ حدث خطأ في تحديث الجرد"); }
  };

  const handleDeleteProduct = async (id) => { if (window.confirm("حذف المنتج؟")) { await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }); setAlert("🗑️ تم حذف المنتج"); fetchAllData(); } };
  const handleAddMainCategory = async () => { if (!newMainName) return; await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newMainName, icon: '📁', parent: '' }) }); setNewMainName(''); fetchAllData(); };
  const handleAddSubCategory = async () => { if (!newSubName) return; await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSubName, icon: '📂', parent: activeMainCat.name }) }); setNewSubName(''); fetchAllData(); };
  const handleDeleteCategory = async (id) => { if (window.confirm("حذف القسم؟")) { await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' }); fetchAllData(); setActiveSubCat(null); setInvSubCat(null); } };

  const handleSaveWorker = async () => {
    if (!workerForm.name || !workerForm.phone) return setAlert("⚠️ يرجى إدخال اسم العامل ورقم الجوال");
    if (workerForm.region && !workerForm.city) return setAlert("⚠️ يرجى كتابة المحافظة");
    const method = editingWorker ? 'PUT' : 'POST';
    const url = editingWorker ? `${API_URL}/workers/${editingWorker.id}` : `${API_URL}/workers`;
    const payload = editingWorker ? { ...workerForm, hidden: editingWorker.hidden, modified_by: currentUser.username } : { ...workerForm, modified_by: currentUser.username };
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setAlert("✅ تم حفظ العامل!"); setWorkerForm({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', portfolio_img: '', safety_details: '', rating: '5.0', is_busy: false }); setEditingWorker(null); fetchAllData(); }
  };

  const handleToggleWorker = async (w) => { await fetch(`${API_URL}/workers/${w.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...w, hidden: !w.hidden, modified_by: currentUser.username }) }); fetchAllData(); };
  const handleDeleteWorker = async (id) => { if (window.confirm("حذف العامل؟")) { await fetch(`${API_URL}/workers/${id}`, { method: 'DELETE' }); fetchAllData(); } };
  const handleClientContactWorker = async (w) => { await fetch(`${API_URL}/workers/${w.id}/click`, { method: 'PUT' }); window.open(`https://wa.me/${w.phone}?text=مرحباً، أريد الاستفسار عن خدماتك عبر منصة ${settings.shop_name}`); setTimeout(fetchAllData, 1500); };

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

  const addToCart = (product, qty = 1) => {
    const customQty = itemQtys[product.id] || qty;
    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) { const newCart = [...cart]; newCart[existingIndex].qty += customQty; setCart(newCart); } 
    else { setCart([...cart, { ...product, qty: customQty }]); }
    setAlert(`✅ تمت الإضافة للسلة`); setItemQtys(prev => ({ ...prev, [product.id]: 1 })); setSelectedProduct(null); 
  };
  const updateCartItemQuantity = (index, change) => { const newCart = [...cart]; newCart[index].qty += change; if (newCart[index].qty <= 0) { newCart.splice(index, 1); } setCart(newCart); };
  const handleProductQuantityChange = (id, change) => { setItemQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + change) })); };
  const calculateDiscountPercentage = (oldPrice, newPrice) => { if (!oldPrice || oldPrice <= newPrice) return null; return Math.round(((oldPrice - newPrice) / oldPrice) * 100); };

  const mainCategoriesList = categories.filter(c => !c.parent);
  const totalSystemProducts = products.length;
  const totalSystemWorkers = workers.length;
  const totalSystemProfits = products.reduce((sum, p) => sum + ((Number(p.sold) || 0) * Number(p.price)), 0);

  // =========================================================================
  // 💻 واجهة الإدارة المحمية 
  // =========================================================================
  if (isAdminPanel) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          <div className="login-box glass-effect">
            <h1 className="gradient-text-large">نظام الإدارة المركزية</h1>
            <p className="sub-login">يرجى كتابة بيانات الدخول الخاصة بك</p>
            <input className="login-input" type="text" placeholder="اسم المستخدم..." value={loginUsername} onChange={e => setLoginUsername(e.target.value)} />
            <input className="login-input" type="password" placeholder="الرمز السري..." value={loginPin} onChange={e => setLoginPin(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleLogin(); }}/>
            <button onClick={handleLogin}>تسجيل الدخول الآمن 🗝️</button>
            <a href="/" className="login-back-link">العودة للواجهة الرئيسية 🏠</a>
          </div>
          {alert && <div className="toast-notification">{alert}</div>}
        </div>
      );
    }

    let posProcessedProducts = products;
    if (posSearch) { 
      posProcessedProducts = products.filter(p => p.name.includes(posSearch)); 
    } else { 
      posProcessedProducts = products.filter(p => p.category === posSubCat); 
    }

    const pendingOrders = orders.filter(o => o.status === 'معلق');

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ الإدارة<div className="user-badge">👤 {currentUser.username} | {currentUser.role}</div></div>
          
          <nav className="side-nav">
            {/* 🌟 زر الطلبات الواردة الجديد يظهر للجميع وفيه إشعار بالعدد */}
            <button className={adminView === 'orders' ? 'active' : ''} onClick={() => setAdminView('orders')} style={{position: 'relative'}}>
              📥 الطلبات الواردة 
              {pendingOrders.length > 0 && <span className="notification-badge">{pendingOrders.length}</span>}
            </button>

            <button className={adminView === 'pos' ? 'active' : ''} onClick={() => {setAdminView('pos'); setEditingOrderId(null); setAdminCart([]);}} style={{background: adminView === 'pos' ? 'var(--gold)' : '#2ecc71', color: adminView === 'pos' ? 'var(--navy)' : 'white', marginBottom:'15px', border:'2px solid var(--gold)'}}>🛒 نقطة البيع (كاشير)</button>
            <button className={adminView === 'inventory' ? 'active' : ''} onClick={() => {setAdminView('inventory'); setInvMainCat(null); setInvSubCat(null);}}>📦 المخزون الهرمي</button>
            <button className={adminView === 'categories' ? 'active' : ''} onClick={() => {setAdminView('categories'); setActiveMainCat(null); setActiveSubCat(null); setEditingItem(null);}}>🗂️ المنتجات والأقسام</button>
            <button className={adminView === 'workers' ? 'active' : ''} onClick={() => setAdminView('workers')}>👷‍♂️ حراج العمال</button>
            
            {isManager && (
              <>
                <button className={adminView === 'reports' ? 'active' : ''} onClick={() => setAdminView('reports')}>📊 التقارير والأرباح</button>
                <button className={adminView === 'users' ? 'active' : ''} onClick={() => {setAdminView('users'); setEditingAdmin(null); setNewAdminForm({username:'', pin:'', role:'موظف'});}}>👥 الموظفين والصلاحيات</button>
                <button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>⚙️ إعدادات المتجر</button>
              </>
            )}
            
            <button className={adminView === 'profile' ? 'active' : ''} onClick={() => setAdminView('profile')} style={{marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0'}}>👤 حسابي (تغيير الرمز)</button>
          </nav>
          
          <div className="side-footer"><button className="logout-btn" onClick={() => {setIsAuthenticated(false); setCurrentUser(null); setLoginUsername(''); setLoginPin('');}}>تسجيل الخروج 🚪</button></div>
        </aside>

        <main className="content-70">
          {isManager && adminView !== 'pos' && adminView !== 'orders' && (
            <div className="admin-top-dashboard">
              <div className="dash-card"><h4>المنتجات المسجلة</h4><h2>{totalSystemProducts}</h2></div>
              <div className="dash-card"><h4>العمال والمقاولين</h4><h2>{totalSystemWorkers}</h2></div>
              <div className="dash-card highlight-card"><h4>إجمالي أرباح المبيعات</h4><h2>{totalSystemProfits} <span>ر.س</span></h2></div>
            </div>
          )}

          {/* ==================== 0. شاشة الطلبات الواردة (الجديدة) ==================== */}
          {adminView === 'orders' && (
            <div className="panel-card fade-in">
              <h2>📥 الطلبات الواردة (المعلقة للاعتماد)</h2>
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>تاريخ الطلب</th>
                    <th>عدد الأصناف</th>
                    <th>الإجمالي المبدئي</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.length === 0 && (
                    <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color:'#888'}}>لا يوجد طلبات معلقة حالياً.</td></tr>
                  )}
                  {pendingOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{color:'var(--gold)', fontWeight:'bold'}}>#{order.id}</td>
                      <td>{new Date(order.created_at).toLocaleString('ar-SA')}</td>
                      <td>{order.cart_data.length} أصناف</td>
                      <td style={{color:'var(--green)'}}>{order.total} ر.س</td>
                      <td>
                        <button className="add-btn" style={{marginRight:'5px'}} onClick={() => loadOrderToPOS(order)}>مراجعة واعتماد في الكاشير ✏️</button>
                        <button className="del-btn-sq" onClick={() => deletePendingOrder(order.id)}>إلغاء 🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ==================== 1. الكاشير المنظم بالأقسام ==================== */}
          {adminView === 'pos' && (
            <div className="pos-container fade-in">
              <div className="pos-products-section">
                
                <input type="text" className="pos-search" placeholder="🔍 ابحث عن منتج بالاسم..." value={posSearch} onChange={e => setPosSearch(e.target.value)}/>
                
                {/* 🌟 شريط الأقسام الخاص بالكاشير */}
                {!posSearch && (
                  <div className="pos-categories-container">
                    <div className="pos-cats-row">
                      {mainCategoriesList.map(cat => (
                        <button 
                          key={cat.id} 
                          className={`pos-cat-btn ${posMainCat === cat.name ? 'active' : ''}`}
                          onClick={() => { 
                            setPosMainCat(cat.name); 
                            const sub = categories.filter(x => x.parent === cat.name); 
                            if(sub.length > 0) setPosSubCat(sub[0].name); else setPosSubCat(''); 
                          }}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    
                    {categories.filter(c => c.parent === posMainCat).length > 0 && (
                      <div className="pos-subcats-row">
                        {categories.filter(c => c.parent === posMainCat).map(subCat => (
                          <button 
                            key={subCat.id} 
                            className={`pos-subcat-btn ${posSubCat === subCat.name ? 'active' : ''}`}
                            onClick={() => setPosSubCat(subCat.name)}
                          >
                            {subCat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="pos-grid">
                  {posProcessedProducts.length === 0 ? (
                     <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#888'}}>لا يوجد منتجات في هذا القسم.</div>
                  ) : (
                    posProcessedProducts.map(product => (
                      <div key={product.id} className="pos-card" onClick={() => addToAdminCart(product)}>
                        {product.stock <= 0 && <div className="pos-out">نفدت الكمية</div>}
                        <img src={product.image || 'https://via.placeholder.com/100'} alt=""/>
                        <h5>{product.name}</h5><span className="pos-price">{product.price} ر.س</span><span className="pos-stock">المتوفر: {product.stock}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="pos-cart-section">
                <h3>{editingOrderId ? `تعديل طلب رقم #${editingOrderId}` : `سلة البيع المباشر (كاشير)`}</h3>
                <div className="pos-cart-items">
                  {adminCart.length === 0 && <div className="pos-empty">السلة فارغة حالياً</div>}
                  {adminCart.map((item, index) => (
                    <div key={index} className="pos-cart-row">
                      <div className="pos-cart-info"><b>{item.name}</b><span>{item.price} ر.س</span></div>
                      <div className="pos-qty-controls"><button onClick={() => updateAdminCartQty(index, 1)}>+</button><span>{item.qty}</span><button onClick={() => updateAdminCartQty(index, -1)}>-</button></div>
                    </div>
                  ))}
                </div>
                
                <div className="pos-checkout-area">
                  <div className="vip-discount-box"><label>🎁 خصم عميل مميز (%):</label><input type="number" placeholder="10" value={vipDiscount} onChange={e => setVipDiscount(e.target.value)} min="0" max="100"/></div>
                  <div className="pos-totals">
                    {(() => {
                      const subtotal = adminCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
                      const discountValue = vipDiscount ? (subtotal * (Number(vipDiscount) / 100)) : 0;
                      const finalTotal = subtotal - discountValue;
                      return (
                        <>
                          <div className="p-row"><span>المجموع:</span> <span>{subtotal} ر.س</span></div>
                          {vipDiscount && <div className="p-row discount"><span>الخصم:</span> <span>- {discountValue.toFixed(2)} ر.س</span></div>}
                          <div className="p-row final"><span>الإجمالي النهائي:</span> <span>{finalTotal.toFixed(2)} ر.س</span></div>
                        </>
                      );
                    })()}
                  </div>
                  <button className="pos-checkout-btn" onClick={handleCheckoutPOS}>اعتماد الطلب وخصم المخزون ✅</button>
                  {editingOrderId && (
                    <button className="del-btn-sq" style={{width:'100%', marginTop:'10px', padding:'10px'}} onClick={() => {setEditingOrderId(null); setAdminCart([]); setAdminView('orders');}}>إلغاء التعديل والعودة</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== إعدادات الحساب ==================== */}
          {adminView === 'profile' && (
            <div className="panel-card fade-in">
              <h2>👤 إعدادات حسابي</h2>
              <div className="settings-grid">
                <div className="form-group"><label>اسم المستخدم الحالي</label><input value={currentUser.username} disabled style={{background: '#eee', color: '#888'}} /></div>
                <div className="form-group"><label>صلاحيات الحساب</label><input value={currentUser.role} disabled style={{background: '#eee', color: '#888'}} /></div>
                <div className="form-group"><label>تغيير الرمز السري الجديد 🔒</label><input type="password" placeholder="اكتب الرمز الجديد هنا..." value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} /></div>
              </div>
              <button className="save-btn full-w-btn" onClick={handleChangeMyPassword}>حفظ الرمز السري الجديد 💾</button>
            </div>
          )}

          {/* ==================== المخزون اليدوي ==================== */}
          {adminView === 'inventory' && (
            <div className="fade-in">
              {!invMainCat ? (
                <div className="panel-card"><h2>📦 الجرد: القسم الرئيسي</h2><div className="folders-grid">{mainCategoriesList.map(cat => (<div key={cat.id} className="folder-card main" onClick={() => setInvMainCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>
              ) : !invSubCat ? (
                <div className="panel-card"><button className="back-btn" onClick={() => setInvMainCat(null)}>🔙 رجوع</button><h2>📦 الجرد: القسم الفرعي لـ ({invMainCat.name})</h2><div className="folders-grid">{categories.filter(c => c.parent === invMainCat.name).map(cat => (<div key={cat.id} className="folder-card sub" onClick={() => setInvSubCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>
              ) : (
                <div className="panel-card">
                  <button className="back-btn" onClick={() => setInvSubCat(null)}>🔙 رجوع</button>
                  <div className="path-header">مستودع: {invMainCat.name} ⬅️ {invSubCat.name}</div>
                  <div style={{background:'#fff3cd', padding:'15px', borderRadius:'10px', marginBottom:'20px', color:'#856404', fontWeight:'bold', borderLeft:'5px solid #f1c40f'}}>💡 طريقة الجرد الفردي: اكتب الكمية في المربع الأبيض، ثم اضغط (إضافة) أو (بيع). وللطلبات الكبيرة استخدم (الكاشير).</div>

                  <table className="pro-table">
                    <thead><tr><th>المنتج</th><th>بالمستودع</th><th>تم بيعه</th><th>إجراءات الجرد اليدوي</th><th>آخر تحديث</th></tr></thead>
                    <tbody>
                      {products.filter(p => p.category === invSubCat.name).length === 0 && (<tr><td colSpan="5" style={{textAlign:'center'}}>المستودع فارغ</td></tr>)}
                      {products.filter(p => p.category === invSubCat.name).map(product => (
                        <tr key={product.id}>
                          <td>{product.name}</td><td className="stk-td">{product.stock}</td><td className="sld-td">{product.sold || 0}</td>
                          <td className="act-td">
                            <div className="bulk-action-wrapper">
                              <input type="number" className="bulk-input" placeholder="الكمية هنا..." value={invBulkInputs[product.id] || ''} onChange={(e) => setInvBulkInputs({...invBulkInputs, [product.id]: e.target.value})}/>
                              <div className="bulk-buttons"><button className="btn-minus-bulk" onClick={() => handleBulkInventoryUpdate(product, false)}>تسجيل بيع</button><button className="btn-plus-bulk" onClick={() => handleBulkInventoryUpdate(product, true)}>إضافة للمستودع</button></div>
                            </div>
                          </td>
                          <td className="mod-td">👤 {product.modified_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==================== المنتجات ==================== */}
          {adminView === 'categories' && (
            <div className="fade-in">
              {!activeMainCat ? (
                <div className="panel-card"><h2>1. الأقسام الرئيسية</h2><div className="add-row mb-20"><input placeholder="قسم رئيسي..." value={newMainName} onChange={e => setNewMainName(e.target.value)}/><button className="add-btn" onClick={handleAddMainCategory}>إضافة</button></div><div className="folders-grid">{mainCategoriesList.map(c => (<div key={c.id} className="folder-card main" onClick={() => setActiveMainCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => {e.stopPropagation(); handleDeleteCategory(c.id);}}>حذف</button></div>))}</div></div>
              ) : !activeSubCat ? (
                <div className="panel-card"><button className="back-btn" onClick={() => setActiveMainCat(null)}>🔙 رجوع</button><h2>2. الفرعية لـ ({activeMainCat.name})</h2><div className="add-row mb-20"><input placeholder="قسم فرعي..." value={newSubName} onChange={e => setNewSubName(e.target.value)}/><button className="add-btn" onClick={handleAddSubCategory}>إضافة</button></div><div className="folders-grid">{categories.filter(c => c.parent === activeMainCat.name).map(c => (<div key={c.id} className="folder-card sub" onClick={() => setActiveSubCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => {e.stopPropagation(); handleDeleteCategory(c.id);}}>حذف</button></div>))}</div></div>
              ) : (
                <div className="panel-card"><button className="back-btn" onClick={() => {setActiveSubCat(null); setEditingItem(null);}}>🔙 رجوع</button><div className="path-header">{activeMainCat.name} ⬅️ {activeSubCat.name}</div>
                  <div className="product-entry-form"><div className="img-upload-box">{formData.image ? (<img src={formData.image} alt="prod"/>) : (<div className="img-ph">صورة المنتج</div>)}<label className="upload-label">اختر صورة <input type="file" onChange={(e) => handleImageUpload(e, 'image', false)} style={{display:'none'}}/></label></div>
                    <div className="data-entry-box">
                      <input className="f-input full" placeholder="اسم المنتج..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                      <textarea className="f-input full" rows="3" placeholder="التفاصيل..." value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}></textarea>
                      <div className="f-row"><input className="f-input" type="number" placeholder="السعر" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/><input className="f-input" type="number" placeholder="السعر القديم" value={formData.old_price} onChange={e => setFormData({...formData, old_price: e.target.value})}/><input className="f-input" type="number" placeholder="الكمية" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}/></div>
                      <div className="f-toggles"><button className={`t-btn ${formData.is_sale ? 'active' : ''}`} onClick={() => setFormData({...formData, is_sale: !formData.is_sale})}>🔥 عرض خاص</button><button className={`t-btn ${formData.out_of_stock ? 'active-out' : ''}`} onClick={() => setFormData({...formData, out_of_stock: !formData.out_of_stock})}>🚫 نفدت</button><button className="save-btn" onClick={handleSaveProduct}>{editingItem ? 'تحديث' : 'حفظ'}</button></div>
                    </div>
                  </div>
                  <div className="mini-products-list mt-30">
                    {products.filter(p => p.category === activeSubCat.name).map(product => (
                      <div key={product.id} className="m-prod-row" onClick={() => {setEditingItem(product); setFormData(product);}}><img src={product.image || 'https://via.placeholder.com/50'} alt=""/><b>{product.name}</b><span className="mod-span">بواسطة: {product.modified_by}</span><span style={{color:'var(--green)', fontWeight:'bold'}}>{product.price} ر.س</span><button className="del-btn-sq" onClick={(e) => {e.stopPropagation(); handleDeleteProduct(product.id);}}>حذف</button></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== العمال ==================== */}
          {adminView === 'workers' && (
            <div className="panel-card fade-in"><h2>👷‍♂️ إضافة وإدارة العمال</h2>
              <div className="product-entry-form" style={{flexDirection: 'column'}}><div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                  <div className="worker-images-upload" style={{flex: '0 0 200px'}}><div className="img-upload-box mb-20">{workerForm.image ? (<img src={workerForm.image} alt="worker"/>) : (<div className="img-ph">صورة</div>)}<label className="upload-label">رفع صورة <input type="file" onChange={(e) => handleImageUpload(e, 'image', true)} style={{display:'none'}}/></label></div><div className="img-upload-box">{workerForm.portfolio_img ? (<img src={workerForm.portfolio_img} alt="portfolio"/>) : (<div className="img-ph" style={{background:'#e8f4f8'}}>أعماله</div>)}<label className="upload-label">رفع أعماله <input type="file" onChange={(e) => handleImageUpload(e, 'portfolio_img', true)} style={{display:'none'}}/></label></div></div>
                  <div className="data-entry-box" style={{flex: '1'}}>
                    <div className="f-row"><input className="f-input" placeholder="اسم العامل..." value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})}/><input className="f-input" placeholder="المهنة..." value={workerForm.profession} onChange={e => setWorkerForm({...workerForm, profession: e.target.value})}/></div>
                    <div className="f-row"><input className="f-input" placeholder="رقم الجوال..." value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}/>
                      <select className="f-input" value={workerForm.region} onChange={e => setWorkerForm({...workerForm, region: e.target.value})}><option value="">-- المنطقة --</option><option value="الرياض">الرياض</option><option value="مكة المكرمة">مكة المكرمة</option><option value="المدينة المنورة">المدينة المنورة</option><option value="الشرقية">الشرقية</option><option value="القصيم">القصيم</option><option value="عسير">عسير</option><option value="تبوك">تبوك</option><option value="حائل">حائل</option><option value="الحدود الشمالية">الحدود الشمالية</option><option value="جازان">جازان</option><option value="نجران">نجران</option><option value="الباحة">الباحة</option><option value="الجوف">الجوف</option></select>
                      <input className="f-input" placeholder="المحافظة..." value={workerForm.city} onChange={e => setWorkerForm({...workerForm, city: e.target.value})}/>
                    </div>
                    <div className="f-row"><input className="f-input" type="number" placeholder="التقييم" value={workerForm.rating} step="0.1" max="5" min="1" onChange={e => setWorkerForm({...workerForm, rating: e.target.value})}/><button className={`t-btn ${workerForm.is_busy ? 'active-out' : 'active-green'}`} onClick={() => setWorkerForm({...workerForm, is_busy: !workerForm.is_busy})}>{workerForm.is_busy ? '🔴 مشغول' : '🟢 متاح'}</button></div>
                    <textarea className="f-input full" rows="2" placeholder="نبذة عن العامل..." value={workerForm.details} onChange={e => setWorkerForm({...workerForm, details: e.target.value})}></textarea>
                    <textarea className="f-input full" rows="2" placeholder="السيفتي والأمان..." value={workerForm.safety_details} onChange={e => setWorkerForm({...workerForm, safety_details: e.target.value})}></textarea>
                    <button className="save-btn" onClick={handleSaveWorker}>{editingWorker ? 'تحديث العامل' : 'إضافة عامل جديد'}</button>
                  </div>
                </div>
              </div>
              <div className="folders-grid mt-30">
                {workers.map(worker => (
                  <div key={worker.id} className={`worker-admin-card ${worker.hidden ? 'dimmed' : ''}`} style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                    <div style={{display: 'flex', gap: '15px', width: '100%'}}>
                      {worker.image ? (<img src={worker.image} alt={worker.name} />) : (<div className="default-avatar-small">👷‍♂️</div>)}
                      <div className="w-info"><h4>{worker.name} <span style={{color:'var(--gold)', fontSize:'0.9rem'}}>({worker.profession})</span></h4><p className="w-loc">📍 {worker.region} - {worker.city}</p><p style={{fontSize:'0.9rem'}}>⭐️ {worker.rating} | {worker.is_busy ? '🔴 مشغول' : '🟢 متاح'} | 👤 {worker.modified_by}</p></div>
                    </div>
                    <div className="worker-stats-bar">📊 تم الطلب: <b>{worker.contact_clicks || 0}</b> مرة</div>
                    <div className="w-actions" style={{width: '100%', marginTop: '10px', justifyContent: 'center'}}><button className="act-btn edit" onClick={() => {setEditingWorker(worker); setWorkerForm(worker);}}>✏️ تعديل</button><button className="act-btn hide" onClick={() => handleToggleWorker(worker)}>{worker.hidden ? '👁 إظهار' : '🚫 إخفاء'}</button><button className="act-btn del" onClick={() => handleDeleteWorker(worker.id)}>🗑️ حذف</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== التقارير ==================== */}
          {adminView === 'reports' && isManager && (
            <div className="panel-card fade-in"><h2>📊 التقارير المالية</h2>
              <div className="reports-split-container">
                {mainCategoriesList.map(mainCat => {
                  const subCatNames = categories.filter(c => c.parent === mainCat.name).map(x => x.name);
                  const myProducts = products.filter(p => subCatNames.includes(p.category));
                  const sectionProfit = myProducts.reduce((sum, item) => sum + ((Number(item.sold) || 0) * Number(item.price)), 0);
                  const sectionSoldQty = myProducts.reduce((sum, item) => sum + (Number(item.sold) || 0), 0);
                  return (
                    <div key={mainCat.id} className="report-main-section"><h3 className="r-header">تقرير: {mainCat.name}</h3><div style={{display:'flex', gap:'20px', marginBottom:'20px'}}><div className="kpi-box light-blue"><h4>أرباح القسم</h4><h2>{sectionProfit} ر.س</h2></div><div className="kpi-box light-gold"><h4>القطع المباعة</h4><h2>{sectionSoldQty}</h2></div></div>
                      <table className="pro-table"><thead><tr><th>المنتج</th><th>الفرعي</th><th>المتبقي</th><th>المباع</th><th>أرباح</th><th>تعديل بواسطة</th></tr></thead>
                        <tbody>
                          {myProducts.length === 0 && (<tr><td colSpan="6" style={{textAlign:'center'}}>لا يوجد مبيعات</td></tr>)}
                          {myProducts.map(product => (<tr key={product.id}><td>{product.name}</td><td><span className="sc-badge">{product.category}</span></td><td className="stk-td">{product.stock}</td><td className="sld-td">{product.sold || 0}</td><td className="profit-td">{(Number(product.sold) || 0) * Number(product.price)}</td><td className="mod-td">{product.modified_by}</td></tr>))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ==================== الموظفين (مع ميزة العين 👁️) ==================== */}
          {adminView === 'users' && isManager && (
            <div className="panel-card fade-in"><h2>👥 إدارة الموظفين والصلاحيات</h2>
              <div className="add-row mb-20" style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px'}}>
                <input placeholder="اسم الموظف..." value={newAdminForm.username} onChange={e => setNewAdminForm({...newAdminForm, username: e.target.value})}/>
                <input placeholder="الرمز السري..." type="password" value={newAdminForm.pin} onChange={e => setNewAdminForm({...newAdminForm, pin: e.target.value})}/>
                <select value={newAdminForm.role} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})} style={{padding:'12px', borderRadius:'8px'}}>
                  <option value="موظف">موظف (مخزون ومنتجات وكاشير)</option>
                  <option value="مدير">مدير (كافة الصلاحيات)</option>
                </select>
                <button className="add-btn" onClick={handleSaveAdmin} style={{background: editingAdmin ? 'var(--navy)' : 'var(--gold)', color: editingAdmin ? 'white' : 'var(--navy)'}}>
                  {editingAdmin ? 'حفظ التعديلات 💾' : 'إضافة موظف ➕'}
                </button>
                {editingAdmin && (<button className="del-btn-sq" style={{background:'#aaa'}} onClick={() => {setEditingAdmin(null); setNewAdminForm({username:'', pin:'', role:'موظف'});}}>إلغاء</button>)}
              </div>
              
              <table className="pro-table">
                <thead><tr><th>اسم الموظف</th><th>الصلاحية</th><th>الرمز السري</th><th>إجراءات</th></tr></thead>
                <tbody>
                  {admins.map(adminUser => (
                    <tr key={adminUser.id}>
                      <td>{adminUser.username}</td>
                      <td><span className="sc-badge">{adminUser.role}</span></td>
                      <td style={{fontFamily: 'monospace', letterSpacing: showPin[adminUser.id] ? 'normal' : '2px'}}>
                        {showPin[adminUser.id] ? adminUser.pin : '••••••'}
                        <button onClick={() => togglePinVisibility(adminUser.id)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.1rem', marginLeft:'10px'}} title={showPin[adminUser.id] ? "إخفاء" : "إظهار"}>
                          {showPin[adminUser.id] ? '🙈' : '👁️'}
                        </button>
                      </td>
                      <td>
                        <button className="act-btn edit" style={{marginRight: '5px'}} onClick={() => { setEditingAdmin(adminUser); setNewAdminForm({ username: adminUser.username, pin: adminUser.pin, role: adminUser.role }); }}>تعديل ✏️</button>
                        {adminUser.id !== currentUser.id ? (
                          <button className="del-btn-sq" onClick={() => handleDeleteAdmin(adminUser.id)}>حذف 🗑️</button>
                        ) : (<span style={{color: '#888', fontSize: '0.8rem'}}>حسابك الحالي</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ==================== الإعدادات ==================== */}
          {adminView === 'settings' && isManager && (
            <div className="panel-card fade-in"><h2>⚙️ إعدادات المتجر</h2><div className="settings-grid"><div className="form-group"><label>اسم المتجر</label><input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/></div><div className="form-group"><label>رقم واتساب الطلبات</label><input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/></div></div><button className="save-btn full-w-btn" onClick={async () => { await fetch(`${API_URL}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); setAlert("✅ تم الحفظ");}}>حفظ</button></div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================================
  // 💻 واجهة العميل 
  // =========================================================================
  let processedProducts = products;
  if (searchQuery) { processedProducts = processedProducts.filter(p => p.name.includes(searchQuery)); } 
  else { processedProducts = processedProducts.filter(p => p.category === clientSub); }
  if (sortOption === 'priceLow') { processedProducts.sort((a, b) => Number(a.price) - Number(b.price)); } 
  else if (sortOption === 'priceHigh') { processedProducts.sort((a, b) => Number(b.price) - Number(a.price)); }

  const availableWorkers = workers.filter(w => !w.hidden);
  const availableRegionsList = [...new Set(availableWorkers.map(w => w.region).filter(Boolean))];
  const availableCitiesList = harajRegion ? [...new Set(availableWorkers.filter(w => w.region === harajRegion).map(w => w.city).filter(Boolean))] : [];
  const filteredWorkersList = availableWorkers.filter(w => { if (!harajRegion || !harajCity) return false; return w.region === harajRegion && w.city === harajCity; });

  return (
    <div className={`App client-theme ${showCart || selectedProduct || showWorkersHaraj ? 'no-scroll' : ''}`}>
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <div className="search-bar-wrapper"><input placeholder="🔍 ابحث عن أي منتج..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
         <button className="worker-haraj-btn" onClick={() => {setShowWorkersHaraj(true); setHarajRegion(''); setHarajCity('');}}>👷‍♂️ <span className="hide-mobile">العمال</span></button>
         <button className="open-cart-large desktop-only" onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>
      
      {!searchQuery && (
        <>
          <div className="client-main-bar">{mainCategoriesList.map(cat => (<button key={cat.id} className={clientMain === cat.name ? 'active' : ''} onClick={() => { setClientMain(cat.name); const subCategories = categories.filter(x => x.parent === cat.name); if (subCategories.length > 0) { setClientSub(subCategories[0].name); } else { setClientSub(''); } }}>{cat.name}</button>))}</div>
          {categories.filter(c => c.parent === clientMain).length > 0 && (<div className="client-sub-bar">{categories.filter(c => c.parent === clientMain).map(subCat => (<button key={subCat.id} className={clientSub === subCat.name ? 'active' : ''} onClick={() => setClientSub(subCat.name)}>{subCat.name}</button>))}</div>)}
        </>
      )}
      
      <div className="gallery-container">
        <div className="store-toolbar">
          {searchQuery ? (<h2 className="search-title">نتائج البحث:</h2>) : (<div></div>)}
          <div className="sort-dropdown"><label>ترتيب المنتجات:</label><select value={sortOption} onChange={e => setSortOption(e.target.value)}><option value="default">الافتراضي</option><option value="priceLow">السعر: أرخص للأغلى</option><option value="priceHigh">السعر: أغلى للأرخص</option></select></div>
        </div>
        
        {processedProducts.length === 0 ? (
          <div className="empty-state"><div style={{fontSize:'4rem', marginBottom:'15px'}}>🧐</div><h3>لم نتمكن من إيجاد منتجات هنا.</h3></div>
        ) : (
          <div className="p-grid-royal">
            {processedProducts.map(product => {
              const discountPercentage = calculateDiscountPercentage(product.old_price, product.price);
              const isStockLow = Number(product.stock) > 0 && Number(product.stock) <= 3;
              const isBestSeller = Number(product.sold) >= 5; 
              
              return (
                <div key={product.id} className="royal-p-card" onClick={() => setSelectedProduct(product)}>
                  {product.out_of_stock && <div className="sold-tag">نفدت الكمية</div>}
                  {product.is_sale && <div className="fire-inline">🔥 عرض خاص</div>}
                  {discountPercentage && <div className="discount-badge">خصم {discountPercentage}%</div>}
                  {isBestSeller && !product.out_of_stock && <div className="best-seller-badge">👑 الأكثر مبيعاً</div>}
                  <div className="p-img-box"><img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} /></div>
                  <div className="p-info-box">
                    <h4>{product.name}</h4>
                    <div className="price-area"><span className="now-price">{product.price} ر.س</span>{Number(product.old_price) > 0 && <del className="old-price">{product.old_price}</del>}</div>
                    {isStockLow && !product.out_of_stock && (<div className="low-stock-alert">⏳ سارع بالطلب! باقي {product.stock} فقط</div>)}
                    <div className="action-area">
                      {!product.out_of_stock && (<div className="qty-controls" onClick={e => e.stopPropagation()}><button onClick={() => handleProductQuantityChange(product.id, 1)}>+</button><span>{itemQtys[product.id] || 1}</span><button onClick={() => handleProductQuantityChange(product.id, -1)}>-</button></div>)}
                      <button className={`add-btn-p ${product.out_of_stock ? 'disabled' : ''}`} disabled={product.out_of_stock} onClick={(e) => { e.stopPropagation(); if (!product.out_of_stock) { addToCart(product); } }}>{product.out_of_stock ? 'غير متوفر' : 'أضف للسلة 🛒'}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      {cart.length > 0 && (<div className="mobile-sticky-cart" onClick={() => setShowCart(true)}><div className="m-cart-info">🛒 في السلة: <b>{cart.length}</b></div><div className="m-cart-total">{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س</div></div>)}

      {showWorkersHaraj && (
        <div className="product-modal-overlay" onClick={() => setShowWorkersHaraj(false)}>
          <div className="worker-haraj-modal fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="haraj-header"><h2>👷‍♂️ حراج العمال</h2><button onClick={() => setShowWorkersHaraj(false)}>✕</button></div>
            <div className="haraj-filters">
              <select value={harajRegion} onChange={e => { setHarajRegion(e.target.value); setHarajCity(''); }}><option value="">🌍 1. اختر منطقتك...</option>{availableRegionsList.map(region => (<option key={region} value={region}>{region}</option>))}</select>
              <select value={harajCity} onChange={e => setHarajCity(e.target.value)} disabled={!harajRegion}><option value="">🏙️ 2. اختر المحافظة...</option>{availableCitiesList.map(city => (<option key={city} value={city}>{city}</option>))}</select>
            </div>
            <div className="workers-list-client">
              {!harajRegion ? (<div className="empty-msg"><span style={{fontSize:'3rem'}}>🗺️</span><p>الرجاء تحديد المنطقة.</p></div>) : !harajCity ? (<div className="empty-msg"><span style={{fontSize:'3rem'}}>📍</span><p>الرجاء تحديد المحافظة.</p></div>) : filteredWorkersList.length === 0 ? (<div className="empty-msg"><span style={{fontSize:'3rem'}}>👷‍♂️</span><p>لا يتوفر عمال في هذه المحافظة.</p></div>) : (
                filteredWorkersList.map(worker => (
                  <div key={worker.id} className="worker-client-card" style={{flexDirection: 'column'}}>
                    <div style={{display:'flex', gap:'15px', width:'100%', alignItems:'center'}}>
                      {worker.image ? (<img src={worker.image} alt={worker.name} />) : (<div className="default-avatar">👷‍♂️</div>)}
                      <div className="wc-info">
                        <h3>{worker.name} <span style={{fontSize:'0.9rem', color:'var(--gold)', marginRight: '5px'}}>({worker.profession})</span></h3>
                        <p className="w-loc">📍 يتواجد في: {worker.region} - {worker.city}</p>
                        <div className="w-status-row"><span className="w-rating">⭐️ {worker.rating}</span><span className={`w-avail ${worker.is_busy ? 'busy' : 'free'}`}>{worker.is_busy ? '🔴 مشغول' : '🟢 متاح'}</span></div>
                        {worker.details && (<p className="w-details-text">{worker.details}</p>)}
                      </div>
                    </div>
                    {worker.safety_details && (<div className="safety-box">🛡️ <b>السلامة:</b> {worker.safety_details}</div>)}
                    {worker.portfolio_img && (<div className="portfolio-box"><b>🖼️ أعماله السابقة:</b><img src={worker.portfolio_img} alt="أعمال" className="pf-img" /></div>)}
                    <button className="wa-contact-btn" onClick={() => handleClientContactWorker(worker)}>طلب وتواصل (واتساب) 💬</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content fade-in-up" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="modal-body-split">
              <div className="m-img-side">
                {calculateDiscountPercentage(selectedProduct.old_price, selectedProduct.price) && (<div className="m-discount">خصم {calculateDiscountPercentage(selectedProduct.old_price, selectedProduct.price)}%</div>)}
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>
              <div className="m-details-side">
                <h2>{selectedProduct.name}</h2>
                <div className="m-price-box"><span className="m-now">{selectedProduct.price} ر.س</span>{Number(selectedProduct.old_price) > 0 && (<del className="m-old">{selectedProduct.old_price} ر.س</del>)}</div>
                <div className="m-desc-box"><h3>المواصفات:</h3><div className="m-desc">{selectedProduct.details || 'لا توجد تفاصيل.'}</div></div>
                {!selectedProduct.out_of_stock ? (<button className="m-add-btn" onClick={() => addToCart(selectedProduct)}>إضافة للسلة 🛒</button>) : (<button className="m-add-btn disabled" disabled>🚫 نفدت</button>)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showCart && (
        <div className={`cart-overlay open`}>
          <div className="cart-inner-container">
            <div className="cart-header-fixed"><h2>سلة المشتريات</h2><button className="close-btn-x" onClick={() => setShowCart(false)}>✕</button></div>
            <div className="cart-products-scroll">
              {cart.length === 0 && (<p className="empty-cart-msg">سلتك فارغة</p>)}
              {cart.map((item, index) => (
                <div key={index} className="cart-product-row">
                  <img src={item.image} alt="" className="cart-p-img" />
                  <div className="cart-p-details">
                    <div className="cart-p-title">{item.name}</div>
                    <div className="qty-controls-mini"><button onClick={() => updateCartItemQuantity(index, 1)}>+</button><span>{item.qty}</span><button onClick={() => updateCartItemQuantity(index, -1)}>-</button></div>
                  </div>
                  <div className="cart-item-total">{item.price * item.qty} ر.س</div>
                </div>
              ))}
            </div>
            <div className="cart-action-fixed">
              <div className="total-gold-box">الإجمالي: <span>{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)}</span> ر.س</div>
              <div className="cart-buttons-row">
                <button className="btn-continue-shopping" onClick={() => setShowCart(false)}>العودة للتسوق</button>
                {/* 🌟 زر إرسال الطلب المحدث الذي يحفظ الطلب في الإدارة */}
                <button className="btn-wa-confirm" onClick={handleCustomerSubmitOrder}>تأكيد وإرسال الطلب ✅</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;