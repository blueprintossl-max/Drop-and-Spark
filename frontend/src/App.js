/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '', shop_name: '' });
  const [admins, setAdmins] = useState([]); 
  const [orders, setOrders] = useState([]);
  
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  
  // 🌟 بيانات العميل في السلة
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const isManager = currentUser && currentUser.role && currentUser.role.trim() === 'مدير';
  const [showPin, setShowPin] = useState({});

  const [adminView, setAdminView] = useState('orders'); 
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

  const [adminCart, setAdminCart] = useState([]);
  const [vipDiscount, setVipDiscount] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [posMainCat, setPosMainCat] = useState('');
  const [posSubCat, setPosSubCat] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);

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
      if (isAdminPanel && mainCategories.length > 0 && !posMainCat) {
        setPosMainCat(mainCategories[0].name);
        const subCategories = catsData.filter(c => c.parent === mainCategories[0].name);
        if (subCategories.length > 0) { setPosSubCat(subCategories[0].name); }
      }
    } catch (error) { console.error("Fetch Error"); }
  };

  const handleLogin = () => {
    if (!loginUsername || !loginPin) return setAlert("⚠️ يرجى إدخال اسم المستخدم والرمز السري");
    const user = admins.find(a => a.username.trim() === loginUsername.trim() && a.pin === loginPin);
    if (user) { setCurrentUser(user); setIsAuthenticated(true); setAdminView('orders'); setAlert(`✅ أهلاً بك يا ${user.username}`); } 
    else { setAlert("❌ بيانات الدخول غير صحيحة"); }
  };

  const handleChangeMyPassword = async () => {
    if (!newPasswordInput) return setAlert("⚠️ يرجى إدخال الرمز");
    try {
      const res = await fetch(`${API_URL}/admins/${currentUser.id}/pin`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPin: newPasswordInput }) });
      if (res.ok) { const updatedUser = await res.json(); setCurrentUser(updatedUser); setAlert("✅ تم تغيير الرمز السري!"); setNewPasswordInput(''); fetchAllData(); }
    } catch (error) {}
  };

  // 🌟 التحديث: إرسال الطلب للسيرفر وإظهار رسالة الشكر (بدون واتساب)
  const handleCustomerSubmitOrder = async () => {
    if (cart.length === 0) return setAlert("⚠️ السلة فارغة");
    if (!customerName || !customerPhone) return setAlert("⚠️ الرجاء إدخال الاسم ورقم الجوال لتسهيل التواصل");

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: customerName, customer_phone: customerPhone, cart_data: cart, total: totalAmount })
      });
      
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'شكراً لكم على ثقتكم!',
          text: 'تم استلام طلبكم بنجاح، وسنقوم بالتواصل معكم في أقرب وقت ممكن لتأكيده.',
          confirmButtonColor: '#28a745',
          confirmButtonText: 'حسناً'
        }).then(() => {
          setCart([]);
          setCustomerName('');
          setCustomerPhone('');
          setShowCart(false);
          fetchAllData();
        });
      } else {
        setAlert("❌ حدث خطأ أثناء إرسال الطلب");
      }
    } catch (e) {
      setAlert("❌ خطأ في الاتصال بالخادم");
    }
  };

  const loadOrderToPOS = (order) => {
    setAdminCart(order.cart_data); setEditingOrderId(order.id); setAdminView('pos'); setAlert(`✏️ جاري مراجعة طلب رقم #${order.id}`);
  };

  const deletePendingOrder = async (id) => {
    if (window.confirm("إلغاء وحذف الطلب نهائياً؟")) { await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' }); fetchAllData(); }
  };

  const handleRefundOrder = async (order) => {
    if (window.confirm("تأكيد إرجاع هذه البضاعة للمخزون وخصمها من المبيعات؟")) {
      try {
        await fetch(`${API_URL}/pos/refund`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: order.cart_data, order_id: order.id, modified_by: currentUser.username })
        });
        setAlert("🔄 تم إرجاع البضاعة للمستودع بنجاح");
        fetchAllData();
      } catch (e) { setAlert("❌ خطأ في الإرجاع"); }
    }
  };

  const addToAdminCart = (product) => {
    if (product.stock <= 0) return setAlert("❌ المنتج غير متوفر");
    const existingIndex = adminCart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) { 
      const newCart = [...adminCart];
      if (newCart[existingIndex].qty >= product.stock) return setAlert("❌ لا يوجد كمية إضافية");
      newCart[existingIndex].qty += 1; setAdminCart(newCart); 
    } else { setAdminCart([...adminCart, { ...product, qty: 1 }]); }
  };

  const updateAdminCartQty = (index, change) => {
    const newCart = [...adminCart]; const item = newCart[index];
    if (change > 0 && item.qty >= item.stock) return setAlert("❌ تتجاوز المخزون");
    item.qty += change; if (item.qty <= 0) newCart.splice(index, 1); setAdminCart(newCart); 
  };

  const handleCheckoutPOS = async () => {
    if (adminCart.length === 0) return setAlert("⚠️ السلة فارغة");
    try {
      const res = await fetch(`${API_URL}/pos/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: adminCart, modified_by: currentUser.username })
      });
      if (res.ok) {
        if (editingOrderId) { await fetch(`${API_URL}/orders/${editingOrderId}/complete`, { method: 'PUT' }); }
        setAlert(editingOrderId ? `✅ تم اعتماد الطلب وخصم المخزون!` : "✅ تم البيع المباشر وخصم المخزون!");
        setAdminCart([]); setVipDiscount(''); setEditingOrderId(null); setAdminView('orders'); fetchAllData(); 
      }
    } catch (error) { setAlert("❌ حدث خطأ"); }
  };

  const togglePinVisibility = (id) => { setShowPin(prev => ({ ...prev, [id]: !prev[id] })); };

  const handleSaveAdmin = async () => {
    if (!newAdminForm.username || !newAdminForm.pin) return setAlert("⚠️ يرجى إدخال اسم الموظف والرمز");
    const method = editingAdmin ? 'PUT' : 'POST';
    const url = editingAdmin ? `${API_URL}/admins/${editingAdmin.id}` : `${API_URL}/admins`;
    try {
      const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAdminForm) });
      if (res.ok) { setAlert("✅ تم الحفظ بنجاح"); setNewAdminForm({ username: '', pin: '', role: 'موظف' }); setEditingAdmin(null); fetchAllData(); } 
      else { setAlert("❌ الاسم مسجل مسبقاً"); }
    } catch (e) { }
  };

  const handleDeleteAdmin = async (id) => { if (window.confirm("حذف الموظف؟")) { await fetch(`${API_URL}/admins/${id}`, { method: 'DELETE' }); fetchAllData(); } };
  const handleSaveProduct = async () => {
    if (!formData.name) return setAlert("⚠️ يرجى إدخال اسم المنتج");
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, category: activeSubCat.name, modified_by: currentUser.username }) });
    setAlert("✅ تم حفظ المنتج"); setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false }); fetchAllData();
  };

  const handleBulkInventoryUpdate = async (product, isAdding) => {
    const qtyInput = invBulkInputs[product.id]; const amount = Number(qtyInput);
    if (!qtyInput || isNaN(amount) || amount <= 0) return setAlert("⚠️ رقم غير صحيح");
    let newStock = Number(product.stock); let newSold = Number(product.sold || 0);
    if (isAdding) { newStock += amount; } else { if (newStock < amount) return setAlert("❌ تتجاوز المخزون!"); newStock -= amount; newSold += amount; }
    try { await fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, stock: newStock, sold: newSold, modified_by: currentUser.username }) }); setAlert("✅ تم التحديث"); setInvBulkInputs(prev => ({ ...prev, [product.id]: '' })); fetchAllData(); } catch (e) {}
  };

  const handleDeleteProduct = async (id) => { if (window.confirm("حذف المنتج؟")) { await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }); fetchAllData(); } };
  const handleAddMainCategory = async () => { if (!newMainName) return; await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newMainName, icon: '📁', parent: '' }) }); setNewMainName(''); fetchAllData(); };
  const handleAddSubCategory = async () => { if (!newSubName) return; await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSubName, icon: '📂', parent: activeMainCat.name }) }); setNewSubName(''); fetchAllData(); };
  const handleDeleteCategory = async (id) => { if (window.confirm("حذف القسم؟")) { await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' }); fetchAllData(); setActiveSubCat(null); setInvSubCat(null); } };

  const handleSaveWorker = async () => {
    if (!workerForm.name || !workerForm.phone) return setAlert("⚠️ أكمل البيانات");
    const method = editingWorker ? 'PUT' : 'POST'; const url = editingWorker ? `${API_URL}/workers/${editingWorker.id}` : `${API_URL}/workers`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...workerForm, modified_by: currentUser.username }) });
    setAlert("✅ تم الحفظ"); setWorkerForm({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', portfolio_img: '', safety_details: '', rating: '5.0', is_busy: false }); setEditingWorker(null); fetchAllData();
  };

  const handleToggleWorker = async (w) => { await fetch(`${API_URL}/workers/${w.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...w, hidden: !w.hidden, modified_by: currentUser.username }) }); fetchAllData(); };
  const handleDeleteWorker = async (id) => { if (window.confirm("حذف العامل؟")) { await fetch(`${API_URL}/workers/${id}`, { method: 'DELETE' }); fetchAllData(); } };
  const handleClientContactWorker = async (w) => { await fetch(`${API_URL}/workers/${w.id}/click`, { method: 'PUT' }); window.open(`https://wa.me/${w.phone}?text=مرحباً`); setTimeout(fetchAllData, 1500); };
  const handleImageUpload = (e, targetField, isWorker = false) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => { 
      if (isWorker) setWorkerForm({ ...workerForm, [targetField]: event.target.result });
      else {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => { const cvs = document.createElement('canvas'); cvs.width = 500; cvs.height = img.height * (500 / img.width); const ctx = cvs.getContext('2d'); ctx.drawImage(img, 0, 0, cvs.width, cvs.height); setFormData({ ...formData, [targetField]: cvs.toDataURL('image/jpeg', 0.6) }); };
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
  const updateCartItemQuantity = (index, change) => { const newCart = [...cart]; newCart[index].qty += change; if (newCart[index].qty <= 0) newCart.splice(index, 1); setCart(newCart); };
  const handleProductQuantityChange = (id, change) => { setItemQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + change) })); };

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
          <div className="login-box glass-effect"><h1 className="gradient-text-large">نظام الإدارة</h1><input className="login-input" type="text" placeholder="اسم المستخدم..." value={loginUsername} onChange={e => setLoginUsername(e.target.value)} /><input className="login-input" type="password" placeholder="الرمز السري..." value={loginPin} onChange={e => setLoginPin(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleLogin(); }}/><button onClick={handleLogin}>دخول 🗝️</button><a href="/" className="login-back-link">للمتجر 🏠</a></div>{alert && <div className="toast-notification">{alert}</div>}
        </div>
      );
    }

    let posProcessedProducts = products;
    if (posSearch) { posProcessedProducts = products.filter(p => p.name.includes(posSearch)); } 
    else { posProcessedProducts = products.filter(p => p.category === posSubCat); }

    const pendingOrders = orders.filter(o => o.status === 'معلق');
    const completedOrders = orders.filter(o => o.status === 'مكتمل');

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ الإدارة<div className="user-badge">👤 {currentUser.username}</div></div>
          <nav className="side-nav">
            <button className={adminView === 'orders' ? 'active' : ''} onClick={() => setAdminView('orders')} style={{position: 'relative'}}>📥 الطلبات الواردة {pendingOrders.length > 0 && <span className="notification-badge">{pendingOrders.length}</span>}</button>
            <button className={adminView === 'pos' ? 'active' : ''} onClick={() => {setAdminView('pos'); setEditingOrderId(null); setAdminCart([]);}} style={{background: adminView === 'pos' ? 'var(--gold)' : '#2ecc71', color: adminView === 'pos' ? 'var(--navy)' : 'white', marginBottom:'15px', border:'2px solid var(--gold)'}}>🛒 نقطة البيع (كاشير)</button>
            <button className={adminView === 'inventory' ? 'active' : ''} onClick={() => {setAdminView('inventory'); setInvMainCat(null); setInvSubCat(null);}}>📦 المخزون اليدوي</button>
            <button className={adminView === 'categories' ? 'active' : ''} onClick={() => setAdminView('categories')}>🗂️ المنتجات</button>
            <button className={adminView === 'workers' ? 'active' : ''} onClick={() => setAdminView('workers')}>👷‍♂️ العمال</button>
            {isManager && (<><button className={adminView === 'reports' ? 'active' : ''} onClick={() => setAdminView('reports')}>📊 التقارير</button><button className={adminView === 'users' ? 'active' : ''} onClick={() => setAdminView('users')}>👥 الموظفين</button><button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>⚙️ الإعدادات</button></>)}
            <button className={adminView === 'profile' ? 'active' : ''} onClick={() => setAdminView('profile')} style={{marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0'}}>👤 حسابي</button>
          </nav>
          <div className="side-footer"><button className="logout-btn" onClick={() => {setIsAuthenticated(false); setCurrentUser(null); setLoginUsername(''); setLoginPin('');}}>خروج 🚪</button></div>
        </aside>

        <main className="content-70">
          {isManager && adminView !== 'pos' && adminView !== 'orders' && (
            <div className="admin-top-dashboard"><div className="dash-card"><h4>المنتجات</h4><h2>{totalSystemProducts}</h2></div><div className="dash-card"><h4>العمال</h4><h2>{totalSystemWorkers}</h2></div><div className="dash-card highlight-card"><h4>أرباح المبيعات</h4><h2>{totalSystemProfits} <span>ر.س</span></h2></div></div>
          )}

          {adminView === 'orders' && (
            <div className="fade-in">
              <div className="panel-card mb-20">
                <h2>📥 الطلبات المعلقة (تحتاج اعتماد)</h2>
                <table className="pro-table">
                  <thead><tr><th>الرقم</th><th>العميل وجواله</th><th>الوقت</th><th>الأصناف</th><th>الإجمالي</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {pendingOrders.length === 0 && (<tr><td colSpan="6" style={{textAlign:'center', padding:'30px'}}>لا يوجد طلبات معلقة.</td></tr>)}
                    {pendingOrders.map(order => (
                      <tr key={order.id}>
                        <td style={{color:'var(--gold)', fontWeight:'bold'}}>#{order.id}</td>
                        <td>{order.customer_name} <br/><span style={{fontSize:'0.85rem', color:'#888'}}>{order.customer_phone}</span></td>
                        <td>{new Date(order.created_at).toLocaleString('ar-SA')}</td>
                        <td>{order.cart_data.length}</td><td style={{color:'var(--green)'}}>{order.total} ر.س</td>
                        <td><button className="add-btn" style={{marginRight:'5px'}} onClick={() => loadOrderToPOS(order)}>مراجعة بالكاشير ✏️</button><button className="del-btn-sq" onClick={() => deletePendingOrder(order.id)}>إلغاء</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel-card">
                <h2>✅ الطلبات المكتملة (مخصومة من المخزون)</h2>
                <table className="pro-table">
                  <thead><tr><th>الرقم</th><th>العميل</th><th>الوقت</th><th>الإجمالي</th><th>إجراء الإرجاع</th></tr></thead>
                  <tbody>
                    {completedOrders.length === 0 && (<tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>لا يوجد طلبات مكتملة.</td></tr>)}
                    {completedOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id}</td><td>{order.customer_name}</td><td>{new Date(order.created_at).toLocaleString('ar-SA')}</td><td style={{color:'var(--green)'}}>{order.total} ر.س</td>
                        <td><button className="del-btn-sq" style={{background:'#f39c12'}} onClick={() => handleRefundOrder(order)}>إرجاع للمخزون 🔄</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminView === 'pos' && (
            <div className="pos-container fade-in">
              <div className="pos-products-section">
                <input type="text" className="pos-search" placeholder="🔍 ابحث عن منتج بالاسم..." value={posSearch} onChange={e => setPosSearch(e.target.value)}/>
                {!posSearch && (
                  <div className="pos-categories-container">
                    <div className="pos-cats-row">{mainCategoriesList.map(cat => (<button key={cat.id} className={`pos-cat-btn ${posMainCat === cat.name ? 'active' : ''}`} onClick={() => { setPosMainCat(cat.name); const sub = categories.filter(x => x.parent === cat.name); if(sub.length > 0) setPosSubCat(sub[0].name); else setPosSubCat(''); }}>{cat.name}</button>))}</div>
                    {categories.filter(c => c.parent === posMainCat).length > 0 && (<div className="pos-subcats-row">{categories.filter(c => c.parent === posMainCat).map(subCat => (<button key={subCat.id} className={`pos-subcat-btn ${posSubCat === subCat.name ? 'active' : ''}`} onClick={() => setPosSubCat(subCat.name)}>{subCat.name}</button>))}</div>)}
                  </div>
                )}
                <div className="pos-grid">
                  {posProcessedProducts.map(product => (
                    <div key={product.id} className="pos-card" onClick={() => addToAdminCart(product)}>
                      {product.stock <= 0 && <div className="pos-out">نفدت</div>}
                      <img src={product.image || 'https://via.placeholder.com/100'} alt=""/><h5>{product.name}</h5><span className="pos-price">{product.price}</span><span className="pos-stock">بالمستودع: {product.stock}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pos-cart-section">
                <h3>{editingOrderId ? `تعديل طلب رقم #${editingOrderId}` : `سلة البيع المباشر`}</h3>
                <div className="pos-cart-items">
                  {adminCart.length === 0 && <div className="pos-empty">السلة فارغة</div>}
                  {adminCart.map((item, index) => (<div key={index} className="pos-cart-row"><div className="pos-cart-info"><b>{item.name}</b><span>{item.price} ر.س</span></div><div className="pos-qty-controls"><button onClick={() => updateAdminCartQty(index, 1)}>+</button><span>{item.qty}</span><button onClick={() => updateAdminCartQty(index, -1)}>-</button></div></div>))}
                </div>
                <div className="pos-checkout-area">
                  <div className="pos-totals">
                    {(() => {
                      const finalTotal = adminCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
                      return (<div className="p-row final"><span>النهائي:</span> <span>{finalTotal.toFixed(2)} ر.س</span></div>);
                    })()}
                  </div>
                  <button className="pos-checkout-btn" onClick={handleCheckoutPOS}>اعتماد وخصم المخزون ✅</button>
                </div>
              </div>
            </div>
          )}

          {adminView === 'profile' && (<div className="panel-card fade-in"><h2>👤 إعدادات حسابي</h2><div className="settings-grid"><div className="form-group"><label>اسم المستخدم الحالي</label><input value={currentUser.username} disabled style={{background: '#eee'}} /></div><div className="form-group"><label>تغيير الرمز السري الجديد 🔒</label><input type="password" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} /></div></div><button className="save-btn full-w-btn" onClick={handleChangeMyPassword}>حفظ الرمز السري</button></div>)}
          
          {adminView === 'inventory' && (
            <div className="fade-in">
              {!invMainCat ? (<div className="panel-card"><h2>📦 الجرد: القسم الرئيسي</h2><div className="folders-grid">{mainCategoriesList.map(cat => (<div key={cat.id} className="folder-card main" onClick={() => setInvMainCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>) : !invSubCat ? (<div className="panel-card"><button className="back-btn" onClick={() => setInvMainCat(null)}>🔙 رجوع</button><h2>📦 القسم الفرعي لـ ({invMainCat.name})</h2><div className="folders-grid">{categories.filter(c => c.parent === invMainCat.name).map(cat => (<div key={cat.id} className="folder-card sub" onClick={() => setInvSubCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>) : (
                <div className="panel-card"><button className="back-btn" onClick={() => setInvSubCat(null)}>🔙 رجوع</button><div className="path-header">مستودع: {invMainCat.name} ⬅️ {invSubCat.name}</div>
                  <table className="pro-table">
                    <thead><tr><th>المنتج</th><th>بالمستودع</th><th>مباع</th><th>إجراءات الجرد اليدوي</th><th>تحديث</th></tr></thead>
                    <tbody>
                      {products.filter(p => p.category === invSubCat.name).map(product => (
                        <tr key={product.id}><td>{product.name}</td><td className="stk-td">{product.stock}</td><td className="sld-td">{product.sold || 0}</td>
                          <td className="act-td"><div className="bulk-action-wrapper"><input type="number" className="bulk-input" placeholder="الكمية..." value={invBulkInputs[product.id] || ''} onChange={(e) => setInvBulkInputs({...invBulkInputs, [product.id]: e.target.value})}/><div className="bulk-buttons"><button className="btn-minus-bulk" onClick={() => handleBulkInventoryUpdate(product, false)}>تسجيل بيع</button><button className="btn-plus-bulk" onClick={() => handleBulkInventoryUpdate(product, true)}>إضافة</button></div></div></td>
                          <td className="mod-td">👤 {product.modified_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {adminView === 'categories' && (<div className="fade-in">{!activeMainCat ? (<div className="panel-card"><h2>1. الأقسام الرئيسية</h2><div className="add-row mb-20"><input placeholder="قسم رئيسي..." value={newMainName} onChange={e => setNewMainName(e.target.value)}/><button className="add-btn" onClick={handleAddMainCategory}>إضافة</button></div><div className="folders-grid">{mainCategoriesList.map(c => (<div key={c.id} className="folder-card main" onClick={() => setActiveMainCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => {e.stopPropagation(); handleDeleteCategory(c.id);}}>حذف</button></div>))}</div></div>) : !activeSubCat ? (<div className="panel-card"><button className="back-btn" onClick={() => setActiveMainCat(null)}>🔙 رجوع</button><h2>2. الفرعية لـ ({activeMainCat.name})</h2><div className="add-row mb-20"><input placeholder="قسم فرعي..." value={newSubName} onChange={e => setNewSubName(e.target.value)}/><button className="add-btn" onClick={handleAddSubCategory}>إضافة</button></div><div className="folders-grid">{categories.filter(c => c.parent === activeMainCat.name).map(c => (<div key={c.id} className="folder-card sub" onClick={() => setActiveSubCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => {e.stopPropagation(); handleDeleteCategory(c.id);}}>حذف</button></div>))}</div></div>) : (<div className="panel-card"><button className="back-btn" onClick={() => {setActiveSubCat(null); setEditingItem(null);}}>🔙 رجوع</button><div className="path-header">{activeMainCat.name} ⬅️ {activeSubCat.name}</div><div className="product-entry-form"><div className="img-upload-box">{formData.image ? (<img src={formData.image} alt="prod"/>) : (<div className="img-ph">صورة المنتج</div>)}<label className="upload-label">اختر صورة <input type="file" onChange={(e) => handleImageUpload(e, 'image', false)} style={{display:'none'}}/></label></div><div className="data-entry-box"><input className="f-input full" placeholder="اسم المنتج..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/><textarea className="f-input full" rows="3" placeholder="التفاصيل..." value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}></textarea><div className="f-row"><input className="f-input" type="number" placeholder="السعر" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/><input className="f-input" type="number" placeholder="السعر القديم" value={formData.old_price} onChange={e => setFormData({...formData, old_price: e.target.value})}/><input className="f-input" type="number" placeholder="الكمية" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}/></div><div className="f-toggles"><button className={`t-btn ${formData.is_sale ? 'active' : ''}`} onClick={() => setFormData({...formData, is_sale: !formData.is_sale})}>🔥 عرض خاص</button><button className={`t-btn ${formData.out_of_stock ? 'active-out' : ''}`} onClick={() => setFormData({...formData, out_of_stock: !formData.out_of_stock})}>🚫 نفدت</button><button className="save-btn" onClick={handleSaveProduct}>{editingItem ? 'تحديث' : 'حفظ'}</button></div></div></div><div className="mini-products-list mt-30">{products.filter(p => p.category === activeSubCat.name).map(product => (<div key={product.id} className="m-prod-row" onClick={() => {setEditingItem(product); setFormData(product);}}><img src={product.image || 'https://via.placeholder.com/50'} alt=""/><b>{product.name}</b><span className="mod-span">بواسطة: {product.modified_by}</span><span style={{color:'var(--green)', fontWeight:'bold'}}>{product.price} ر.س</span><button className="del-btn-sq" onClick={(e) => {e.stopPropagation(); handleDeleteProduct(product.id);}}>حذف</button></div>))}</div></div>)}</div>)}
          
          {adminView === 'workers' && (<div className="panel-card fade-in"><h2>👷‍♂️ العمال</h2><div className="product-entry-form" style={{flexDirection: 'column'}}><div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}><div className="worker-images-upload" style={{flex: '0 0 200px'}}><div className="img-upload-box mb-20">{workerForm.image ? (<img src={workerForm.image} alt="worker"/>) : (<div className="img-ph">صورة</div>)}<label className="upload-label">رفع صورة <input type="file" onChange={(e) => handleImageUpload(e, 'image', true)} style={{display:'none'}}/></label></div></div><div className="data-entry-box" style={{flex: '1'}}><div className="f-row"><input className="f-input" placeholder="الاسم..." value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})}/><input className="f-input" placeholder="الجوال..." value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}/></div><button className="save-btn" onClick={handleSaveWorker}>{editingWorker ? 'تحديث' : 'إضافة'}</button></div></div></div><div className="folders-grid mt-30">{workers.map(worker => (<div key={worker.id} className={`worker-admin-card`}><div className="w-info"><h4>{worker.name}</h4></div><button className="del-btn-sq" onClick={() => handleDeleteWorker(worker.id)}>حذف</button></div>))}</div></div>)}

          {adminView === 'reports' && isManager && (<div className="panel-card fade-in"><h2>📊 التقارير المالية</h2><div className="reports-split-container">{mainCategoriesList.map(mainCat => { const subCatNames = categories.filter(c => c.parent === mainCat.name).map(x => x.name); const myProducts = products.filter(p => subCatNames.includes(p.category)); const sectionProfit = myProducts.reduce((sum, item) => sum + ((Number(item.sold) || 0) * Number(item.price)), 0); return ( <div key={mainCat.id} className="report-main-section"><h3 className="r-header">{mainCat.name} - أرباح: {sectionProfit} ر.س</h3><table className="pro-table"><thead><tr><th>المنتج</th><th>المباع</th><th>أرباح</th></tr></thead><tbody>{myProducts.map(product => (<tr key={product.id}><td>{product.name}</td><td>{product.sold || 0}</td><td className="profit-td">{(Number(product.sold) || 0) * Number(product.price)}</td></tr>))}</tbody></table></div> ) })}</div></div>)}

          {adminView === 'users' && isManager && (<div className="panel-card fade-in"><h2>👥 إدارة الموظفين</h2><div className="add-row mb-20" style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px'}}><input placeholder="الاسم..." value={newAdminForm.username} onChange={e => setNewAdminForm({...newAdminForm, username: e.target.value})}/><input placeholder="الرمز..." type="password" value={newAdminForm.pin} onChange={e => setNewAdminForm({...newAdminForm, pin: e.target.value})}/><select value={newAdminForm.role} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})} style={{padding:'12px', borderRadius:'8px'}}><option value="موظف">موظف</option><option value="مدير">مدير</option></select><button className="add-btn" onClick={handleSaveAdmin}>{editingAdmin ? 'تحديث' : 'إضافة'}</button></div><table className="pro-table"><thead><tr><th>الاسم</th><th>الصلاحية</th><th>الرمز</th><th>إجراء</th></tr></thead><tbody>{admins.map(adminUser => (<tr key={adminUser.id}><td>{adminUser.username}</td><td><span className="sc-badge">{adminUser.role}</span></td><td style={{fontFamily: 'monospace', letterSpacing: showPin[adminUser.id] ? 'normal' : '2px'}}>{showPin[adminUser.id] ? adminUser.pin : '••••••'}<button onClick={() => togglePinVisibility(adminUser.id)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.1rem', marginLeft:'10px'}}>{showPin[adminUser.id] ? '🙈' : '👁️'}</button></td><td><button className="act-btn edit" style={{marginRight: '5px'}} onClick={() => { setEditingAdmin(adminUser); setNewAdminForm({ username: adminUser.username, pin: adminUser.pin, role: adminUser.role }); }}>تعديل</button>{adminUser.id !== currentUser.id && (<button className="del-btn-sq" onClick={() => handleDeleteAdmin(adminUser.id)}>حذف</button>)}</td></tr>))}</tbody></table></div>)}

          {adminView === 'settings' && isManager && (<div className="panel-card fade-in"><h2>⚙️ الإعدادات</h2><div className="settings-grid"><div className="form-group"><label>اسم المتجر</label><input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/></div><div className="form-group"><label>رقم واتساب</label><input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/></div></div><button className="save-btn full-w-btn" onClick={async () => { await fetch(`${API_URL}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); setAlert("✅ تم الحفظ");}}>حفظ</button></div>)}
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

  return (
    <div className={`App client-theme ${showCart || selectedProduct || showWorkersHaraj ? 'no-scroll' : ''}`}>
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <div className="search-bar-wrapper"><input placeholder="🔍 ابحث عن أي منتج..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
         <button className="open-cart-large desktop-only" onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>
      
      {!searchQuery && (
        <>
          <div className="client-main-bar">{mainCategoriesList.map(cat => (<button key={cat.id} className={clientMain === cat.name ? 'active' : ''} onClick={() => { setClientMain(cat.name); const subCategories = categories.filter(x => x.parent === cat.name); if (subCategories.length > 0) { setClientSub(subCategories[0].name); } else { setClientSub(''); } }}>{cat.name}</button>))}</div>
          {categories.filter(c => c.parent === clientMain).length > 0 && (<div className="client-sub-bar">{categories.filter(c => c.parent === clientMain).map(subCat => (<button key={subCat.id} className={clientSub === subCat.name ? 'active' : ''} onClick={() => setClientSub(subCat.name)}>{subCat.name}</button>))}</div>)}
        </>
      )}
      
      <div className="gallery-container">
        <div className="p-grid-royal">
          {processedProducts.map(product => (
            <div key={product.id} className="royal-p-card" onClick={() => setSelectedProduct(product)}>
              <div className="p-img-box"><img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} /></div>
              <div className="p-info-box">
                <h4>{product.name}</h4>
                <div className="price-area"><span className="now-price">{product.price} ر.س</span></div>
                <div className="action-area">
                  <button className="add-btn-p" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>أضف للسلة 🛒</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCart && (
        <div className="cart-overlay open">
          <div className="cart-inner-container-large fade-in-up">
            <div className="cart-header-fixed"><h2>سلة المشتريات 🛒</h2><button className="close-btn-x" onClick={() => setShowCart(false)}>✕</button></div>
            <div className="cart-products-scroll">
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
              {cart.length > 0 && (
                <div className="customer-info-box">
                  <h4 style={{color:'var(--navy)', marginBottom:'10px'}}>لتسهيل التواصل وتأكيد الطلب:</h4>
                  <input type="text" placeholder="الاسم الكريم..." value={customerName} onChange={e => setCustomerName(e.target.value)} className="c-input"/>
                  <input type="tel" placeholder="رقم الجوال..." value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="c-input"/>
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="cart-floating-action">
                <div className="total-gold-box">الإجمالي: <span>{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)}</span> ر.س</div>
                <button className="btn-wa-confirm-giant" onClick={handleCustomerSubmitOrder}>إرسال الطلب واعتماده ✅</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;