/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import './App.css';

const API_URL = 'https://drop-and-spark.onrender.com/api';

function App() {
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

  // 🌟 نظام إرسال الطلب (محمي وقوي وتفاعلي)
  const handleCustomerSubmitOrder = async () => {
    if (cart.length === 0) return Swal.fire('تنبيه', 'سلة المشتريات فارغة، الرجاء إضافة منتجات.', 'warning');
    if (!customerName || !customerPhone) return Swal.fire('بيانات ناقصة', 'الرجاء إدخال الاسم الكريم ورقم الجوال لتسهيل التواصل وتأكيد الطلب.', 'warning');

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // إظهار واجهة التحميل للمستخدم ليعرف أن الزر يعمل
    Swal.fire({
      title: 'جاري رفع الطلب...',
      text: 'الرجاء الانتظار لحظات',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: customerName, customer_phone: customerPhone, cart_data: cart, total: totalAmount })
      });
      
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'تم استلام طلبك بنجاح!',
          text: 'شكراً لكم على ثقتكم في متجرنا. سيتم التواصل معكم في أقرب وقت ممكن لتأكيد الطلب.',
          confirmButtonColor: '#28a745',
          confirmButtonText: 'حسناً، شكراً'
        }).then(() => {
          setCart([]);
          setCustomerName('');
          setCustomerPhone('');
          setShowCart(false);
          setItemQtys({});
          fetchAllData();
        });
      } else {
        Swal.fire('عذراً', 'حدث خطأ في الخادم (السيرفر) ولم نتمكن من إرسال طلبك. الرجاء المحاولة بعد قليل.', 'error');
      }
    } catch (e) {
      Swal.fire('خطأ في الاتصال', 'لا يمكن الوصول للسيرفر. يرجى التأكد من اتصالك بالإنترنت.', 'error');
    }
  };

  const loadOrderToPOS = (order) => { setAdminCart(order.cart_data); setEditingOrderId(order.id); setAdminView('pos'); setAlert(`✏️ جاري مراجعة طلب رقم #${order.id}`); };
  const deletePendingOrder = async (id) => { if (window.confirm("هل أنت متأكد من إلغاء وحذف هذا الطلب نهائياً؟")) { await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' }); fetchAllData(); } };
  
  const handleRefundOrder = async (order) => {
    if (window.confirm("تأكيد إرجاع هذه البضاعة للمخزون وخصمها من المبيعات؟")) {
      try {
        await fetch(`${API_URL}/pos/refund`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: order.cart_data, order_id: order.id, modified_by: currentUser.username }) });
        setAlert("🔄 تم إرجاع البضاعة للمستودع بنجاح"); fetchAllData();
      } catch (e) { setAlert("❌ خطأ في عملية الإرجاع"); }
    }
  };

  const addToAdminCart = (product) => {
    if (product.stock <= 0) return setAlert("❌ المنتج غير متوفر بالمستودع");
    const existingIndex = adminCart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) { 
      const newCart = [...adminCart];
      if (newCart[existingIndex].qty >= product.stock) return setAlert("❌ لا توجد كمية إضافية في المخزون");
      newCart[existingIndex].qty += 1; setAdminCart(newCart); 
    } else { setAdminCart([...adminCart, { ...product, qty: 1 }]); }
  };

  const updateAdminCartQty = (index, change) => {
    const newCart = [...adminCart]; const item = newCart[index];
    if (change > 0 && item.qty >= item.stock) return setAlert("❌ الكمية المطلوبة تتجاوز المخزون المتوفر");
    item.qty += change; if (item.qty <= 0) newCart.splice(index, 1); setAdminCart(newCart); 
  };

  const handleCheckoutPOS = async () => {
    if (adminCart.length === 0) return setAlert("⚠️ سلة الكاشير فارغة");
    try {
      const res = await fetch(`${API_URL}/pos/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: adminCart, modified_by: currentUser.username }) });
      if (res.ok) {
        if (editingOrderId) { await fetch(`${API_URL}/orders/${editingOrderId}/complete`, { method: 'PUT' }); }
        setAlert(editingOrderId ? `✅ تم اعتماد الطلب وخصم الكميات من المخزون بنجاح!` : "✅ تم البيع المباشر وخصم الكميات بنجاح!");
        setAdminCart([]); setVipDiscount(''); setEditingOrderId(null); setAdminView('orders'); fetchAllData(); 
      }
    } catch (error) { setAlert("❌ حدث خطأ أثناء عملية البيع"); }
  };

  const togglePinVisibility = (id) => { setShowPin(prev => ({ ...prev, [id]: !prev[id] })); };

  const handleSaveAdmin = async () => {
    if (!newAdminForm.username || !newAdminForm.pin) return setAlert("⚠️ يرجى إدخال اسم الموظف والرمز السري");
    const method = editingAdmin ? 'PUT' : 'POST';
    const url = editingAdmin ? `${API_URL}/admins/${editingAdmin.id}` : `${API_URL}/admins`;
    try {
      const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAdminForm) });
      if (res.ok) { setAlert("✅ تم الحفظ بنجاح"); setNewAdminForm({ username: '', pin: '', role: 'موظف' }); setEditingAdmin(null); fetchAllData(); } 
      else { setAlert("❌ عذراً، هذا الاسم مسجل مسبقاً"); }
    } catch (e) { }
  };

  const handleDeleteAdmin = async (id) => { if (window.confirm("هل أنت متأكد من حذف هذا الموظف؟")) { await fetch(`${API_URL}/admins/${id}`, { method: 'DELETE' }); fetchAllData(); } };
  
  const handleSaveProduct = async () => {
    if (!formData.name) return setAlert("⚠️ يرجى إدخال اسم المنتج");
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, category: activeSubCat.name, modified_by: currentUser.username }) });
    setAlert("✅ تم حفظ بيانات المنتج بنجاح"); setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false }); fetchAllData();
  };

  const handleBulkInventoryUpdate = async (product, isAdding) => {
    const qtyInput = invBulkInputs[product.id]; const amount = Number(qtyInput);
    if (!qtyInput || isNaN(amount) || amount <= 0) return setAlert("⚠️ الرجاء إدخال رقم صحيح وموجب");
    let newStock = Number(product.stock); let newSold = Number(product.sold || 0);
    if (isAdding) { newStock += amount; } else { if (newStock < amount) return setAlert("❌ خطأ: الكمية المباعة تتجاوز المخزون المتوفر!"); newStock -= amount; newSold += amount; }
    try { await fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, stock: newStock, sold: newSold, modified_by: currentUser.username }) }); setAlert("✅ تم تحديث الجرد بنجاح"); setInvBulkInputs(prev => ({ ...prev, [product.id]: '' })); fetchAllData(); } catch (e) {}
  };

  const handleDeleteProduct = async (id) => { if (window.confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) { await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }); fetchAllData(); } };
  const handleAddMainCategory = async () => { if (!newMainName) return; await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newMainName, icon: '📁', parent: '' }) }); setNewMainName(''); fetchAllData(); };
  const handleAddSubCategory = async () => { if (!newSubName) return; await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSubName, icon: '📂', parent: activeMainCat.name }) }); setNewSubName(''); fetchAllData(); };
  const handleDeleteCategory = async (id) => { if (window.confirm("حذف هذا القسم سيؤدي إلى إخفاء منتجاته، هل أنت متأكد؟")) { await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' }); fetchAllData(); setActiveSubCat(null); setInvSubCat(null); } };

  const handleSaveWorker = async () => {
    if (!workerForm.name || !workerForm.phone) return setAlert("⚠️ الرجاء إكمال بيانات العامل الأساسية");
    const method = editingWorker ? 'PUT' : 'POST'; const url = editingWorker ? `${API_URL}/workers/${editingWorker.id}` : `${API_URL}/workers`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...workerForm, modified_by: currentUser.username }) });
    setAlert("✅ تم حفظ بيانات العامل بنجاح"); setWorkerForm({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', portfolio_img: '', safety_details: '', rating: '5.0', is_busy: false }); setEditingWorker(null); fetchAllData();
  };

  const handleDeleteWorker = async (id) => { if (window.confirm("هل أنت متأكد من حذف هذا العامل من النظام؟")) { await fetch(`${API_URL}/workers/${id}`, { method: 'DELETE' }); fetchAllData(); } };
  
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

  // 🌟 وظائف إضافة وتعديل الكميات للعميل
  const addToCart = (product, fallbackQty = 1) => {
    const customQty = itemQtys[product.id] || fallbackQty;
    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) { 
      const newCart = [...cart]; 
      newCart[existingIndex].qty += customQty; 
      setCart(newCart); 
    } else { 
      setCart([...cart, { ...product, qty: customQty }]); 
    }
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'تمت الإضافة للسلة 🛒', showConfirmButton: false, timer: 1500 });
    setItemQtys(prev => ({ ...prev, [product.id]: 1 })); 
    setSelectedProduct(null); 
  };
  
  const updateCartItemQuantity = (index, change) => { 
    const newCart = [...cart]; 
    newCart[index].qty += change; 
    if (newCart[index].qty <= 0) newCart.splice(index, 1); 
    setCart(newCart); 
  };
  
  const handleProductQuantityChange = (id, change) => { 
    setItemQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + change) })); 
  };

  const mainCategoriesList = categories.filter(c => !c.parent);
  const totalSystemProducts = products.length;
  const totalSystemWorkers = workers.length;
  const totalSystemProfits = products.reduce((sum, p) => sum + ((Number(p.sold) || 0) * Number(p.price)), 0);

  // =========================================================================
  // 💻 واجهة الإدارة المحمية بالكامل
  // =========================================================================
  if (isAdminPanel) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          <div className="login-box glass-effect"><h1 className="gradient-text-large">نظام الإدارة الشامل</h1><input className="login-input" type="text" placeholder="اسم المستخدم..." value={loginUsername} onChange={e => setLoginUsername(e.target.value)} /><input className="login-input" type="password" placeholder="الرمز السري..." value={loginPin} onChange={e => setLoginPin(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleLogin(); }}/><button onClick={handleLogin}>تسجيل الدخول 🗝️</button><a href="/" className="login-back-link">العودة للمتجر 🏠</a></div>{alert && <div className="toast-notification">{alert}</div>}
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
            <button className={adminView === 'pos' ? 'active' : ''} onClick={() => {setAdminView('pos'); setEditingOrderId(null); setAdminCart([]);}} style={{background: adminView === 'pos' ? 'var(--gold)' : '#2ecc71', color: adminView === 'pos' ? 'var(--navy)' : 'white', marginBottom:'15px', border:'2px solid var(--gold)'}}>🛒 نقطة البيع (الكاشير)</button>
            <button className={adminView === 'inventory' ? 'active' : ''} onClick={() => {setAdminView('inventory'); setInvMainCat(null); setInvSubCat(null);}}>📦 المخزون اليدوي</button>
            <button className={adminView === 'categories' ? 'active' : ''} onClick={() => setAdminView('categories')}>🗂️ المنتجات والأقسام</button>
            <button className={adminView === 'workers' ? 'active' : ''} onClick={() => setAdminView('workers')}>👷‍♂️ دليل العمال</button>
            {isManager && (<><button className={adminView === 'reports' ? 'active' : ''} onClick={() => setAdminView('reports')}>📊 التقارير المالية</button><button className={adminView === 'users' ? 'active' : ''} onClick={() => setAdminView('users')}>👥 إدارة الموظفين</button><button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>⚙️ إعدادات المتجر</button></>)}
            <button className={adminView === 'profile' ? 'active' : ''} onClick={() => setAdminView('profile')} style={{marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0'}}>👤 إعدادات حسابي</button>
          </nav>
          <div className="side-footer"><button className="logout-btn" onClick={() => {setIsAuthenticated(false); setCurrentUser(null); setLoginUsername(''); setLoginPin('');}}>تسجيل الخروج 🚪</button></div>
        </aside>

        <main className="content-70">
          {isManager && adminView !== 'pos' && adminView !== 'orders' && (
            <div className="admin-top-dashboard"><div className="dash-card"><h4>إجمالي المنتجات</h4><h2>{totalSystemProducts}</h2></div><div className="dash-card"><h4>إجمالي العمال</h4><h2>{totalSystemWorkers}</h2></div><div className="dash-card highlight-card"><h4>أرباح المبيعات التقريبية</h4><h2>{totalSystemProfits} <span>ر.س</span></h2></div></div>
          )}

          {adminView === 'orders' && (
            <div className="fade-in">
              <div className="panel-card mb-20">
                <h2>📥 الطلبات المعلقة (بانتظار الاعتماد)</h2>
                <table className="pro-table">
                  <thead><tr><th>رقم الطلب</th><th>العميل وجواله</th><th>وقت الطلب</th><th>عدد الأصناف</th><th>الإجمالي</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {pendingOrders.length === 0 && (<tr><td colSpan="6" style={{textAlign:'center', padding:'30px'}}>لا يوجد طلبات معلقة حالياً.</td></tr>)}
                    {pendingOrders.map(order => (
                      <tr key={order.id}>
                        <td style={{color:'var(--gold)', fontWeight:'bold'}}>#{order.id}</td>
                        <td>{order.customer_name} <br/><span style={{fontSize:'0.85rem', color:'#888'}}>{order.customer_phone}</span></td>
                        <td>{new Date(order.created_at).toLocaleString('ar-SA')}</td>
                        <td>{order.cart_data.length} أصناف</td><td style={{color:'var(--green)', fontWeight:'bold'}}>{order.total} ر.س</td>
                        <td><button className="add-btn" style={{marginRight:'5px'}} onClick={() => loadOrderToPOS(order)}>مراجعة بالكاشير ✏️</button><button className="del-btn-sq" onClick={() => deletePendingOrder(order.id)}>إلغاء الطلب</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel-card">
                <h2>✅ الطلبات المكتملة (تم خصمها من المخزون)</h2>
                <table className="pro-table">
                  <thead><tr><th>رقم الطلب</th><th>العميل</th><th>وقت الاعتماد</th><th>الإجمالي</th><th>إجراء الإرجاع</th></tr></thead>
                  <tbody>
                    {completedOrders.length === 0 && (<tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>لا توجد طلبات مكتملة حتى الآن.</td></tr>)}
                    {completedOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id}</td><td>{order.customer_name}</td><td>{new Date(order.created_at).toLocaleString('ar-SA')}</td><td style={{color:'var(--green)', fontWeight:'bold'}}>{order.total} ر.س</td>
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
                <input type="text" className="pos-search" placeholder="🔍 ابحث عن منتج بالاسم لبيعه..." value={posSearch} onChange={e => setPosSearch(e.target.value)}/>
                {!posSearch && (
                  <div className="pos-categories-container">
                    <div className="pos-cats-row">{mainCategoriesList.map(cat => (<button key={cat.id} className={`pos-cat-btn ${posMainCat === cat.name ? 'active' : ''}`} onClick={() => { setPosMainCat(cat.name); const sub = categories.filter(x => x.parent === cat.name); if(sub.length > 0) setPosSubCat(sub[0].name); else setPosSubCat(''); }}>{cat.name}</button>))}</div>
                    {categories.filter(c => c.parent === posMainCat).length > 0 && (<div className="pos-subcats-row">{categories.filter(c => c.parent === posMainCat).map(subCat => (<button key={subCat.id} className={`pos-subcat-btn ${posSubCat === subCat.name ? 'active' : ''}`} onClick={() => setPosSubCat(subCat.name)}>{subCat.name}</button>))}</div>)}
                  </div>
                )}
                <div className="pos-grid">
                  {posProcessedProducts.length === 0 ? (<div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '20px'}}>لا توجد منتجات متوفرة في هذا القسم.</div>) : (
                    posProcessedProducts.map(product => (
                      <div key={product.id} className="pos-card" onClick={() => addToAdminCart(product)}>
                        {product.stock <= 0 && <div className="pos-out">نفدت الكمية</div>}
                        <img src={product.image || 'https://via.placeholder.com/100'} alt=""/><h5>{product.name}</h5><span className="pos-price">{product.price} ر.س</span><span className="pos-stock">بالمستودع: {product.stock}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="pos-cart-section">
                <h3>{editingOrderId ? `تعديل ومراجعة طلب رقم #${editingOrderId}` : `سلة البيع المباشر`}</h3>
                <div className="pos-cart-items">
                  {adminCart.length === 0 && <div className="pos-empty">سلة الكاشير فارغة</div>}
                  {adminCart.map((item, index) => (<div key={index} className="pos-cart-row"><div className="pos-cart-info"><b>{item.name}</b><span>{item.price} ر.س</span></div><div className="pos-qty-controls"><button onClick={() => updateAdminCartQty(index, 1)}>+</button><span>{item.qty}</span><button onClick={() => updateAdminCartQty(index, -1)}>-</button></div></div>))}
                </div>
                <div className="pos-checkout-area">
                  <div className="vip-discount-box"><label>🎁 خصم إضافي (%):</label><input type="number" placeholder="0" value={vipDiscount} onChange={e => setVipDiscount(e.target.value)}/></div>
                  <div className="pos-totals">
                    {(() => {
                      const subtotal = adminCart.reduce((sum, item) => sum + (item.price * item.qty), 0); const discountValue = vipDiscount ? (subtotal * (Number(vipDiscount) / 100)) : 0; const finalTotal = subtotal - discountValue;
                      return (<><div className="p-row"><span>المجموع:</span> <span>{subtotal.toFixed(2)}</span></div>{vipDiscount && <div className="p-row discount"><span>قيمة الخصم:</span> <span>- {discountValue.toFixed(2)}</span></div>}<div className="p-row final"><span>المطلوب دفعه:</span> <span>{finalTotal.toFixed(2)} ر.س</span></div></>);
                    })()}
                  </div>
                  <button className="pos-checkout-btn" onClick={handleCheckoutPOS}>اعتماد البيع وخصم المخزون ✅</button>
                  {editingOrderId && (<button className="del-btn-sq" style={{width:'100%', marginTop:'10px'}} onClick={() => {setEditingOrderId(null); setAdminCart([]); setAdminView('orders');}}>إلغاء التعديل والعودة للطلبات</button>)}
                </div>
              </div>
            </div>
          )}

          {adminView === 'profile' && (<div className="panel-card fade-in"><h2>👤 إعدادات حسابي الشخصي</h2><div className="settings-grid"><div className="form-group"><label>اسم المستخدم الحالي</label><input value={currentUser.username} disabled style={{background: '#eee'}} /></div><div className="form-group"><label>تعيين رمز سري جديد 🔒</label><input type="password" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} /></div></div><button className="save-btn full-w-btn" onClick={handleChangeMyPassword}>حفظ وتحديث الرمز السري</button></div>)}
          
          {adminView === 'inventory' && (
            <div className="fade-in">
              {!invMainCat ? (<div className="panel-card"><h2>📦 جرد المخزون: اختيار القسم الرئيسي</h2><div className="folders-grid">{mainCategoriesList.map(cat => (<div key={cat.id} className="folder-card main" onClick={() => setInvMainCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>) : !invSubCat ? (<div className="panel-card"><button className="back-btn" onClick={() => setInvMainCat(null)}>🔙 رجوع للأقسام الرئيسية</button><h2>📦 الأقسام الفرعية لـ ({invMainCat.name})</h2><div className="folders-grid">{categories.filter(c => c.parent === invMainCat.name).map(cat => (<div key={cat.id} className="folder-card sub" onClick={() => setInvSubCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>) : (
                <div className="panel-card"><button className="back-btn" onClick={() => setInvSubCat(null)}>🔙 رجوع للأقسام الفرعية</button><div className="path-header">مسار المستودع: {invMainCat.name} ⬅️ {invSubCat.name}</div>
                  <table className="pro-table">
                    <thead><tr><th>اسم المنتج</th><th>متوفر بالمستودع</th><th>الكمية المباعة</th><th>إجراءات الجرد اليدوي السريع</th><th>آخر تحديث بواسطة</th></tr></thead>
                    <tbody>
                      {products.filter(p => p.category === invSubCat.name).map(product => (
                        <tr key={product.id}><td>{product.name}</td><td className="stk-td">{product.stock}</td><td className="sld-td">{product.sold || 0}</td>
                          <td className="act-td"><div className="bulk-action-wrapper"><input type="number" className="bulk-input" placeholder="أدخل الكمية..." value={invBulkInputs[product.id] || ''} onChange={(e) => setInvBulkInputs({...invBulkInputs, [product.id]: e.target.value})}/><div className="bulk-buttons"><button className="btn-minus-bulk" onClick={() => handleBulkInventoryUpdate(product, false)}>تسجيل مبيعات</button><button className="btn-plus-bulk" onClick={() => handleBulkInventoryUpdate(product, true)}>إضافة للمخزون</button></div></div></td>
                          <td className="mod-td">👤 {product.modified_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {adminView === 'categories' && (<div className="fade-in">{!activeMainCat ? (<div className="panel-card"><h2>1. إدارة الأقسام الرئيسية للمتجر</h2><div className="add-row mb-20"><input placeholder="اسم القسم الرئيسي الجديد..." value={newMainName} onChange={e => setNewMainName(e.target.value)}/><button className="add-btn" onClick={handleAddMainCategory}>إضافة قسم</button></div><div className="folders-grid">{mainCategoriesList.map(c => (<div key={c.id} className="folder-card main" onClick={() => setActiveMainCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => {e.stopPropagation(); handleDeleteCategory(c.id);}}>حذف القسم</button></div>))}</div></div>) : !activeSubCat ? (<div className="panel-card"><button className="back-btn" onClick={() => setActiveMainCat(null)}>🔙 رجوع للأقسام الرئيسية</button><h2>2. الأقسام الفرعية التابعة لـ ({activeMainCat.name})</h2><div className="add-row mb-20"><input placeholder="اسم القسم الفرعي الجديد..." value={newSubName} onChange={e => setNewSubName(e.target.value)}/><button className="add-btn" onClick={handleAddSubCategory}>إضافة قسم فرعي</button></div><div className="folders-grid">{categories.filter(c => c.parent === activeMainCat.name).map(c => (<div key={c.id} className="folder-card sub" onClick={() => setActiveSubCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => {e.stopPropagation(); handleDeleteCategory(c.id);}}>حذف القسم</button></div>))}</div></div>) : (<div className="panel-card"><button className="back-btn" onClick={() => {setActiveSubCat(null); setEditingItem(null);}}>🔙 رجوع للأقسام الفرعية</button><div className="path-header">إضافة منتجات في: {activeMainCat.name} ⬅️ {activeSubCat.name}</div><div className="product-entry-form"><div className="img-upload-box">{formData.image ? (<img src={formData.image} alt="prod"/>) : (<div className="img-ph">إرفاق صورة للمنتج</div>)}<label className="upload-label">استعراض الصور <input type="file" onChange={(e) => handleImageUpload(e, 'image', false)} style={{display:'none'}}/></label></div><div className="data-entry-box"><input className="f-input full" placeholder="اكتب اسم المنتج بدقة..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/><textarea className="f-input full" rows="3" placeholder="اكتب تفاصيل ومواصفات المنتج هنا..." value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}></textarea><div className="f-row"><input className="f-input" type="number" placeholder="السعر الحالي" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/><input className="f-input" type="number" placeholder="السعر القديم (اختياري)" value={formData.old_price} onChange={e => setFormData({...formData, old_price: e.target.value})}/><input className="f-input" type="number" placeholder="الكمية المتوفرة حالياً" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}/></div><div className="f-toggles"><button className={`t-btn ${formData.is_sale ? 'active' : ''}`} onClick={() => setFormData({...formData, is_sale: !formData.is_sale})}>🔥 تحديد كعرض خاص</button><button className={`t-btn ${formData.out_of_stock ? 'active-out' : ''}`} onClick={() => setFormData({...formData, out_of_stock: !formData.out_of_stock})}>🚫 إيقاف البيع (نفدت)</button><button className="save-btn" onClick={handleSaveProduct}>{editingItem ? 'تحديث بيانات المنتج' : 'حفظ المنتج الجديد'}</button></div></div></div><div className="mini-products-list mt-30">{products.filter(p => p.category === activeSubCat.name).map(product => (<div key={product.id} className="m-prod-row" onClick={() => {setEditingItem(product); setFormData(product);}}><img src={product.image || 'https://via.placeholder.com/50'} alt=""/><b>{product.name}</b><span className="mod-span">بواسطة: {product.modified_by}</span><span style={{color:'var(--green)', fontWeight:'bold'}}>{product.price} ر.س</span><button className="del-btn-sq" onClick={(e) => {e.stopPropagation(); handleDeleteProduct(product.id);}}>حذف نهائي</button></div>))}</div></div>)}</div>)}
          
          {adminView === 'workers' && (<div className="panel-card fade-in"><h2>👷‍♂️ دليل العمال والحرفيين</h2><div className="product-entry-form" style={{flexDirection: 'column'}}><div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}><div className="worker-images-upload" style={{flex: '0 0 200px'}}><div className="img-upload-box mb-20">{workerForm.image ? (<img src={workerForm.image} alt="worker"/>) : (<div className="img-ph">صورة العامل</div>)}<label className="upload-label">رفع صورة <input type="file" onChange={(e) => handleImageUpload(e, 'image', true)} style={{display:'none'}}/></label></div></div><div className="data-entry-box" style={{flex: '1'}}><div className="f-row"><input className="f-input" placeholder="اسم العامل..." value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})}/><input className="f-input" placeholder="رقم الجوال للتواصل..." value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}/></div><button className="save-btn" onClick={handleSaveWorker}>{editingWorker ? 'تحديث البيانات' : 'إضافة عامل جديد'}</button></div></div></div><div className="folders-grid mt-30">{workers.map(worker => (<div key={worker.id} className={`worker-admin-card`}><div className="w-info"><h4>{worker.name}</h4></div><button className="del-btn-sq" onClick={() => handleDeleteWorker(worker.id)}>حذف العامل</button></div>))}</div></div>)}

          {adminView === 'reports' && isManager && (<div className="panel-card fade-in"><h2>📊 التقارير المالية والإحصائيات</h2><div className="reports-split-container">{mainCategoriesList.map(mainCat => { const subCatNames = categories.filter(c => c.parent === mainCat.name).map(x => x.name); const myProducts = products.filter(p => subCatNames.includes(p.category)); const sectionProfit = myProducts.reduce((sum, item) => sum + ((Number(item.sold) || 0) * Number(item.price)), 0); return ( <div key={mainCat.id} className="report-main-section"><h3 className="r-header">قسم {mainCat.name} - إجمالي المبيعات: {sectionProfit} ر.س</h3><table className="pro-table"><thead><tr><th>اسم المنتج</th><th>الكمية المباعة</th><th>إجمالي الأرباح</th></tr></thead><tbody>{myProducts.map(product => (<tr key={product.id}><td>{product.name}</td><td>{product.sold || 0}</td><td className="profit-td">{(Number(product.sold) || 0) * Number(product.price)}</td></tr>))}</tbody></table></div> ) })}</div></div>)}

          {adminView === 'users' && isManager && (<div className="panel-card fade-in"><h2>👥 إدارة الموظفين والصلاحيات</h2><div className="add-row mb-20" style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px'}}><input placeholder="اسم الموظف الجديد..." value={newAdminForm.username} onChange={e => setNewAdminForm({...newAdminForm, username: e.target.value})}/><input placeholder="تعيين رمز سري للدخول..." type="password" value={newAdminForm.pin} onChange={e => setNewAdminForm({...newAdminForm, pin: e.target.value})}/><select value={newAdminForm.role} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})} style={{padding:'12px', borderRadius:'8px'}}><option value="موظف">صلاحية: موظف</option><option value="مدير">صلاحية: مدير عام</option></select><button className="add-btn" onClick={handleSaveAdmin}>{editingAdmin ? 'تحديث بيانات الموظف' : 'إضافة الموظف للنظام'}</button></div><table className="pro-table"><thead><tr><th>الاسم</th><th>نوع الصلاحية</th><th>الرمز السري</th><th>إجراءات التحكم</th></tr></thead><tbody>{admins.map(adminUser => (<tr key={adminUser.id}><td>{adminUser.username}</td><td><span className="sc-badge">{adminUser.role}</span></td><td style={{fontFamily: 'monospace', letterSpacing: showPin[adminUser.id] ? 'normal' : '2px'}}>{showPin[adminUser.id] ? adminUser.pin : '••••••'}<button onClick={() => togglePinVisibility(adminUser.id)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.1rem', marginLeft:'10px'}}>{showPin[adminUser.id] ? '🙈' : '👁️'}</button></td><td><button className="act-btn edit" style={{marginRight: '5px'}} onClick={() => { setEditingAdmin(adminUser); setNewAdminForm({ username: adminUser.username, pin: adminUser.pin, role: adminUser.role }); }}>تعديل البيانات</button>{adminUser.id !== currentUser.id && (<button className="del-btn-sq" onClick={() => handleDeleteAdmin(adminUser.id)}>حذف الموظف</button>)}</td></tr>))}</tbody></table></div>)}

          {adminView === 'settings' && isManager && (<div className="panel-card fade-in"><h2>⚙️ إعدادات المتجر العامة</h2><div className="settings-grid"><div className="form-group"><label>اسم المتجر (يظهر للعملاء)</label><input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/></div><div className="form-group"><label>رقم الواتساب للتواصل (مع مفتاح الدولة)</label><input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/></div></div><button className="save-btn full-w-btn" onClick={async () => { await fetch(`${API_URL}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); setAlert("✅ تم حفظ الإعدادات بنجاح");}}>حفظ وتطبيق الإعدادات</button></div>)}
        </main>
      </div>
    );
  }

  // =========================================================================
  // 💻 واجهة العميل (المتجر الحي) مع نظام الكميات المكتوب يدوياً الأنيق
  // =========================================================================
  let processedProducts = products;
  if (searchQuery) { processedProducts = processedProducts.filter(p => p.name.includes(searchQuery)); } 
  else { processedProducts = processedProducts.filter(p => p.category === clientSub); }

  return (
    <div className={`App client-theme ${showCart || selectedProduct || showWorkersHaraj ? 'no-scroll' : ''}`}>
      <header className="royal-header" style={{boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name || 'تشاطيب'} ⚡</div>
         <div className="search-bar-wrapper"><input placeholder="🔍 ابحث عن أي منتج تحتاجه..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{borderRadius:'20px', padding:'10px 15px'}} /></div>
         <button className="open-cart-large desktop-only" onClick={() => setShowCart(true)} style={{borderRadius:'20px'}}>🛒 سلة مشترياتك <span style={{background:'var(--gold)', color:'#000', padding:'2px 8px', borderRadius:'10px', marginLeft:'5px'}}>{cart.length}</span></button>
      </header>
      
      {!searchQuery && (
        <>
          <div className="client-main-bar">{mainCategoriesList.map(cat => (<button key={cat.id} className={clientMain === cat.name ? 'active' : ''} onClick={() => { setClientMain(cat.name); const subCategories = categories.filter(x => x.parent === cat.name); if (subCategories.length > 0) { setClientSub(subCategories[0].name); } else { setClientSub(''); } }}>{cat.name}</button>))}</div>
          {categories.filter(c => c.parent === clientMain).length > 0 && (<div className="client-sub-bar">{categories.filter(c => c.parent === clientMain).map(subCat => (<button key={subCat.id} className={clientSub === subCat.name ? 'active' : ''} onClick={() => setClientSub(subCat.name)}>{subCat.name}</button>))}</div>)}
        </>
      )}
      
      <div className="gallery-container">
        {processedProducts.length === 0 ? (<div className="empty-state"><h3>عذراً، لا توجد منتجات متاحة في هذا القسم حالياً.</h3></div>) : (
          <div className="p-grid-royal">
            {processedProducts.map(product => (
              <div key={product.id} className="royal-p-card" style={{borderRadius:'15px', overflow:'hidden', boxShadow:'0 5px 15px rgba(0,0,0,0.05)'}} onClick={() => setSelectedProduct(product)}>
                {product.out_of_stock && <div className="sold-tag">نفدت الكمية</div>}
                <div className="p-img-box"><img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} /></div>
                <div className="p-info-box" style={{padding:'15px'}}>
                  <h4 style={{fontSize:'1.1rem', marginBottom:'10px'}}>{product.name}</h4>
                  <div className="price-area" style={{marginBottom:'15px'}}><span className="now-price" style={{fontSize:'1.2rem', color:'var(--green)', fontWeight:'bold'}}>{product.price} ر.س</span></div>
                  
                  {/* 🌟 التحكم بالكمية والكتابة اليدوية الاحترافية (حتى قبل دخول السلة) */}
                  <div className="action-area" style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px'}}>
                    {!product.out_of_stock && (
                      <div className="qty-controls" onClick={e => e.stopPropagation()} style={{display:'flex', alignItems:'center', background:'#f5f6fa', borderRadius:'8px', padding:'5px'}}>
                        <button onClick={() => handleProductQuantityChange(product.id, 1)} style={{border:'none', background:'#fff', width:'30px', height:'30px', borderRadius:'5px', cursor:'pointer', fontSize:'1.2rem', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>+</button>
                        <input 
                          type="number" min="1" 
                          value={itemQtys[product.id] || 1} 
                          onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val > 0) setItemQtys(prev => ({ ...prev, [product.id]: val })); }}
                          style={{width: '40px', textAlign: 'center', fontWeight: 'bold', background: 'transparent', border: 'none', outline:'none', fontSize:'1.1rem'}}
                        />
                        <button onClick={() => handleProductQuantityChange(product.id, -1)} style={{border:'none', background:'#fff', width:'30px', height:'30px', borderRadius:'5px', cursor:'pointer', fontSize:'1.2rem', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>-</button>
                      </div>
                    )}
                    <button className={`add-btn-p ${product.out_of_stock ? 'disabled' : ''}`} disabled={product.out_of_stock} onClick={(e) => { e.stopPropagation(); if (!product.out_of_stock) { addToCart(product); } }} style={{flex:'1', background: product.out_of_stock ? '#ccc' : 'var(--navy)', color:'#fff', border:'none', padding:'10px', borderRadius:'8px', fontWeight:'bold', cursor: product.out_of_stock ? 'not-allowed' : 'pointer'}}>
                      {product.out_of_stock ? 'المنتج غير متوفر' : 'إضافة للسلة 🛒'}
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      {cart.length > 0 && (<div className="mobile-sticky-cart" onClick={() => setShowCart(true)}><div className="m-cart-info">🛒 في السلة: <b>{cart.length} منتج</b></div><div className="m-cart-total">{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س</div></div>)}

      {/* 🌟 النافذة المنبثقة الجميلة لتفاصيل المنتج */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content fade-in-up" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="modal-body-split">
              <div className="m-img-side"><img src={selectedProduct.image} alt={selectedProduct.name} /></div>
              <div className="m-details-side">
                <h2>{selectedProduct.name}</h2>
                <div className="m-price-box"><span className="m-now">{selectedProduct.price} ر.س</span></div>
                <div className="m-desc-box"><h3>مواصفات وتفاصيل المنتج:</h3><div className="m-desc">{selectedProduct.details || 'لا توجد تفاصيل إضافية مسجلة لهذا المنتج.'}</div></div>
                
                {!selectedProduct.out_of_stock && (
                  <div className="qty-controls" style={{display:'flex', alignItems:'center', background:'#f5f6fa', borderRadius:'8px', padding:'10px', marginBottom:'15px', justifyContent:'center'}}>
                    <button onClick={() => handleProductQuantityChange(selectedProduct.id, 1)} style={{border:'none', background:'#fff', width:'40px', height:'40px', borderRadius:'5px', cursor:'pointer', fontSize:'1.5rem', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>+</button>
                    <input type="number" min="1" value={itemQtys[selectedProduct.id] || 1} onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val > 0) setItemQtys(prev => ({ ...prev, [selectedProduct.id]: val })); }} style={{width: '60px', textAlign: 'center', fontWeight: 'bold', background: 'transparent', border: 'none', outline:'none', fontSize:'1.3rem'}}/>
                    <button onClick={() => handleProductQuantityChange(selectedProduct.id, -1)} style={{border:'none', background:'#fff', width:'40px', height:'40px', borderRadius:'5px', cursor:'pointer', fontSize:'1.5rem', boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>-</button>
                  </div>
                )}
                
                {!selectedProduct.out_of_stock ? (<button className="m-add-btn" onClick={() => addToCart(selectedProduct)} style={{width:'100%', padding:'15px', fontSize:'1.2rem', background:'var(--navy)', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'bold'}}>اعتماد الكمية وإضافة للسلة 🛒</button>) : (<button className="m-add-btn disabled" disabled style={{width:'100%', padding:'15px', fontSize:'1.2rem', background:'#ccc', border:'none', borderRadius:'10px', color:'#fff', fontWeight:'bold'}}>🚫 نفدت الكمية</button>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 سلة المشتريات الاحترافية (الكود الذي تراه في الصورة التي أرسلتها مع تحسين الاستجابة) */}
      {showCart && (
        <div className="cart-overlay open" style={{background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)'}}>
          <div className="cart-inner-container-large fade-in-up" style={{borderRadius:'20px 20px 0 0', overflow:'hidden', maxWidth:'600px'}}>
            <div className="cart-header-fixed" style={{background:'var(--navy)', color:'#fff', padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2 style={{margin:0, fontSize:'1.3rem'}}>سلة المشتريات الخاصة بك 🛒</h2>
              <button className="close-btn-x" onClick={() => setShowCart(false)} style={{color:'#fff', fontSize:'1.5rem', background:'none', border:'none', cursor:'pointer'}}>✕</button>
            </div>
            
            <div className="cart-products-scroll" style={{padding:'20px', background:'#f8f9fa'}}>
              {cart.length === 0 && (<div style={{textAlign:'center', padding:'40px 0', color:'#888'}}><h3>السلة فارغة حالياً</h3><p>تفضل بتصفح أقسام المتجر وأضف ما تحتاجه!</p></div>)}
              
              {cart.map((item, index) => (
                <div key={index} className="cart-product-row" style={{background:'#fff', borderRadius:'12px', padding:'15px', marginBottom:'15px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:'15px'}}>
                  <img src={item.image} alt="" style={{width:'60px', height:'60px', objectFit:'cover', borderRadius:'8px'}} />
                  <div style={{flex:'1'}}>
                    <div style={{fontWeight:'bold', fontSize:'1.1rem', marginBottom:'10px', color:'var(--navy)'}}>{item.name}</div>
                    
                    {/* 🌟 التحكم بالكمية داخل السلة (أزرار + كتابة يدوية دقيقة) */}
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <div style={{display:'flex', alignItems:'center', background:'#f5f6fa', borderRadius:'6px', padding:'3px'}}>
                        <button onClick={() => updateCartItemQuantity(index, 1)} style={{border:'none', background:'#fff', width:'30px', height:'30px', borderRadius:'4px', cursor:'pointer', fontSize:'1.2rem', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>+</button>
                        <input 
                          type="number" min="1" 
                          value={item.qty} 
                          onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val > 0) { const newCart = [...cart]; newCart[index].qty = val; setCart(newCart); } }}
                          style={{width: '40px', textAlign: 'center', fontWeight: 'bold', border: 'none', background:'transparent', outline:'none', fontSize:'1.1rem'}}
                        />
                        <button onClick={() => updateCartItemQuantity(index, -1)} style={{border:'none', background:'#fff', width:'30px', height:'30px', borderRadius:'4px', cursor:'pointer', fontSize:'1.2rem', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>-</button>
                      </div>
                      <span style={{color:'var(--green)', fontWeight:'bold', fontSize:'1.1rem'}}>{item.price * item.qty} ر.س</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {cart.length > 0 && (
                <div style={{background:'#fff', padding:'20px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', marginTop:'20px', border:'1px dashed #3498db'}}>
                  <h4 style={{color:'var(--navy)', marginBottom:'15px'}}>لتسهيل التواصل وتأكيد الطلب:</h4>
                  <input type="text" placeholder="الاسم الكريم (مثال: محمد عبدالله)" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{width:'100%', padding:'15px', borderRadius:'8px', border:'1px solid #ddd', marginBottom:'10px', fontSize:'1rem', fontFamily:'inherit'}}/>
                  <input type="tel" placeholder="رقم الجوال (مثال: 0500000000)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{width:'100%', padding:'15px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'1rem', fontFamily:'inherit'}}/>
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div style={{background:'#fff', padding:'20px', borderTop:'1px solid #eee', boxShadow:'0 -5px 15px rgba(0,0,0,0.05)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', fontSize:'1.2rem'}}>
                  <b style={{color:'var(--navy)'}}>الإجمالي المطلوب:</b>
                  <b style={{color:'var(--green)', fontSize:'1.5rem'}}>{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س</b>
                </div>
                {/* 🌟 الزر الأخضر المحمي الذي سيتفاعل معك فوراً */}
                <button onClick={handleCustomerSubmitOrder} style={{width:'100%', background:'#27ae60', color:'#fff', border:'none', padding:'15px', borderRadius:'10px', fontSize:'1.2rem', fontWeight:'bold', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'10px', boxShadow:'0 4px 10px rgba(39, 174, 96, 0.3)'}}>
                  إرسال الطلب واعتماده ✅
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;