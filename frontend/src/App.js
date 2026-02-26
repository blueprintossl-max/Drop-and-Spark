/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import './App.css';

// الرابط المعتمد للسيرفر (تأكد أن السيرفر يعمل على Render)
const API_URL = 'https://drop-and-spark-1.onrender.com';

function App() {
  // ==========================================
  // 1. التعريفات الأساسية (States)
  // ==========================================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [settings, setSettings] = useState({ phone: '', shop_name: '' });
  const [admins, setAdmins] = useState([]); 
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);

  // نظام الدخول والصلاحيات
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
  
  // المخزون والكاشير
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
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: '', details: '', manufacturer: '', image: '', is_sale: false, out_of_stock: false });
  const [editingItem, setEditingItem] = useState(null);
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', rating: '5.0', is_busy: false });
  const [editingWorker, setEditingWorker] = useState(null);
  const [newAdminForm, setNewAdminForm] = useState({ username: '', pin: '', role: 'موظف' });
  const [editingAdmin, setEditingAdmin] = useState(null); // لإدارة تعديل الموظف

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

  // ==========================================
  // 2. محرك جلب البيانات من السيرفر
  // ==========================================
  useEffect(() => { fetchAllData(); }, []); 
  useEffect(() => { if (alert) { const timer = setTimeout(() => { setAlert(null); }, 4500); return () => clearTimeout(timer); } }, [alert]);

  const fetchAllData = async () => {
    try {
      const [pRes, cRes, wRes, sRes, aRes, oRes] = await Promise.all([
        fetch(`${API_URL}/api/products`), 
        fetch(`${API_URL}/api/categories`), 
        fetch(`${API_URL}/api/workers`), 
        fetch(`${API_URL}/api/settings`), 
        fetch(`${API_URL}/api/admins`), 
        fetch(`${API_URL}/api/orders`)
      ]);
      
      const pData = await pRes.json();
      const cData = await cRes.json();
      const wData = await wRes.json();
      const sData = await sRes.json();
      const aData = await aRes.json();
      const oData = await oRes.json();

      setProducts(pData);
      setCategories(cData);
      setWorkers(wData);
      setSettings(sData);
      setAdmins(aData);
      setOrders(oData);
      
      // إعداد الأقسام الافتراضية لواجهة العميل
      const mainCategories = cData.filter(c => !c.parent);
      if (!isAdminPanel && mainCategories.length > 0 && !clientMain) {
         setClientMain(mainCategories[0].name);
         const subCategories = cData.filter(c => c.parent === mainCategories[0].name);
         if (subCategories.length > 0) setClientSub(subCategories[0].name);
      }
    } catch (error) { 
      console.error("Database connection error", error); 
    }
  };

  // ==========================================
  // 3. دوال العمليات الحيوية (Handlers) - تم الإصلاح والتحديث
  // ==========================================

  // --- نظام الدخول ---
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

  const handleChangeMyPassword = async () => {
    if (!newPasswordInput) return setAlert("⚠️ يرجى إدخال الرمز الجديد");
    try {
      const res = await fetch(`${API_URL}/api/admins/${currentUser.id}/pin`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ newPin: newPasswordInput }) 
      });
      if (res.ok) { 
        Swal.fire('نجاح', 'تم تغيير الرمز السري بنجاح!', 'success');
        setNewPasswordInput(''); 
        fetchAllData(); 
      }
    } catch (error) { setAlert("❌ حدث خطأ"); }
  };

  // --- إدارة المنتجات والأقسام ---
  const handleAddCategory = async (isSub = false) => {
    const name = isSub ? newSubName : newMainName;
    if (!name) return setAlert("⚠️ يرجى إدخال اسم القسم");
    const body = { name, icon: isSub ? '📂' : '📁', parent: isSub ? activeMainCat.name : '' };
    try {
      const res = await fetch(`${API_URL}/api/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        isSub ? setNewSubName('') : setNewMainName('');
        setAlert("✅ تم إضافة القسم");
        fetchAllData();
      }
    } catch(e) { setAlert("❌ خطأ في الإضافة"); }
  };

  const handleDeleteCategory = async (id) => {
    if(window.confirm("حذف هذا القسم سيؤثر على المنتجات داخله، هل أنت متأكد؟")) {
      await fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' });
      fetchAllData();
    }
  };

  // ✅ تم الإصلاح: حفظ المنتجات مع تحويل الأرقام وظهور الإشعار
  const handleSaveProduct = async () => {
    if (!formData.name || !activeSubCat) return Swal.fire('تنبيه', 'يرجى اختيار القسم وإدخال اسم المنتج', 'warning');
    
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/api/products/${editingItem.id}` : `${API_URL}/api/products`;
    
    // دمج الشركة المصنعة مع التفاصيل
    const fullDetails = formData.manufacturer ? `الشركة: ${formData.manufacturer}\n${formData.details}` : formData.details;

    // تحويل القيم إلى أرقام لتوافق قاعدة بيانات PostgreSQL
    const payload = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : 0,
      old_price: formData.old_price ? parseFloat(formData.old_price) : 0,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      details: fullDetails,
      category: activeSubCat.name,
      modified_by: currentUser.username
    };

    try {
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (res.ok) {
        Swal.fire('تم الحفظ!', 'تم حفظ المنتج في القسم الفرعي بنجاح وسيظهر للعملاء', 'success');
        setEditingItem(null);
        setFormData({ name: '', price: '', old_price: '', stock: '', details: '', manufacturer: '', image: '', is_sale: false, out_of_stock: false });
        fetchAllData();
      } else { Swal.fire('خطأ', 'فشل الحفظ في قاعدة البيانات', 'error'); }
    } catch (e) { Swal.fire('خطأ', 'مشكلة في الاتصال بالسيرفر', 'error'); }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) {
      await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
      fetchAllData();
    }
  };

  // ✅ تم الإصلاح: حفظ العمال وجعل الصورة اختيارية
  const handleSaveWorker = async () => {
    if (!workerForm.name || !workerForm.phone || !workerForm.region || !workerForm.city) {
      return Swal.fire('تنبيه', 'يرجى إكمال بيانات العامل الأساسية (الاسم، الجوال، المنطقة، المدينة)', 'warning');
    }
    const method = editingWorker ? 'PUT' : 'POST';
    const url = editingWorker ? `${API_URL}/api/workers/${editingWorker.id}` : `${API_URL}/api/workers`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workerForm, modified_by: currentUser.username })
      });
      if (res.ok) {
        Swal.fire('نجاح', 'تم حفظ بيانات العامل وتصنيفه بنجاح', 'success');
        setWorkerForm({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', rating: '5.0', is_busy: false });
        setEditingWorker(null);
        fetchAllData();
      } else { Swal.fire('خطأ', 'لم يتم الحفظ في السيرفر', 'error'); }
    } catch(e) { Swal.fire('خطأ', 'مشكلة في الاتصال', 'error'); }
  };

  const handleDeleteWorker = async (id) => {
    if (window.confirm("حذف هذا العامل؟")) {
      await fetch(`${API_URL}/api/workers/${id}`, { method: 'DELETE' });
      fetchAllData();
    }
  };

  // ✅ تم الإصلاح: إدارة الموظفين مع زر التعديل
  const handleSaveAdmin = async () => {
    if (!newAdminForm.username || !newAdminForm.pin) return Swal.fire('تنبيه', 'بيانات الموظف ناقصة (الاسم والرمز السري)', 'warning');
    const method = editingAdmin ? 'PUT' : 'POST';
    const url = editingAdmin ? `${API_URL}/api/admins/${editingAdmin.id}` : `${API_URL}/api/admins`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdminForm)
      });
      if (res.ok) {
        Swal.fire('تم!', editingAdmin ? 'تم تحديث بيانات الموظف بنجاح' : 'تم إضافة الموظف بالنظام', 'success');
        setNewAdminForm({ username: '', pin: '', role: 'موظف' });
        setEditingAdmin(null);
        fetchAllData();
      } else {
        Swal.fire('خطأ', 'هذا الاسم قد يكون مسجلاً مسبقاً', 'error');
      }
    } catch (e) { Swal.fire('خطأ', 'خطأ في الاتصال بالسيرفر', 'error'); }
  };

  const handleDeleteAdmin = async (id, role) => {
    // حماية المدير الأساسي
    if (role === 'مدير') {
      return Swal.fire('إجراء مرفوض', 'لا يمكنك حذف حساب يمتلك صلاحية "مدير" لحماية النظام!', 'error');
    }
    if (window.confirm("هل أنت متأكد من سحب صلاحيات هذا الموظف وحذفه؟")) {
      await fetch(`${API_URL}/api/admins/${id}`, { method: 'DELETE' });
      fetchAllData();
    }
  };

  // ✅ تم الإصلاح: إعدادات المتجر (إظهار الإشعار)
  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        Swal.fire('نجاح', 'تم تحديث اسم المتجر ورقم التواصل بنجاح ✅', 'success');
        fetchAllData();
      }
    } catch (e) { Swal.fire('خطأ', 'فشل حفظ الإعدادات', 'error'); }
  };

  // --- الجرد اليدوي والكاشير ---
  const handleBulkInventoryUpdate = async (product, isAdding) => {
    const qty = Number(invBulkInputs[product.id]);
    if (!qty || qty <= 0) return setAlert("⚠️ أدخل كمية صحيحة للتحديث");
    let newStock = Number(product.stock) + (isAdding ? qty : -qty);
    if (newStock < 0) return setAlert("❌ المخزون الحالي لا يكفي لخصم هذه الكمية");
    
    try {
      await fetch(`${API_URL}/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, stock: newStock, modified_by: currentUser.username })
      });
      setAlert("✅ تم تحديث المخزون");
      setInvBulkInputs({ ...invBulkInputs, [product.id]: '' });
      fetchAllData();
    } catch (e) { setAlert("❌ خطأ في التحديث"); }
  };

  const handleCheckoutPOS = async () => {
    if (adminCart.length === 0) return setAlert("⚠️ السلة فارغة");
    try {
      const res = await fetch(`${API_URL}/api/pos/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: adminCart, modified_by: currentUser.username })
      });
      if (res.ok) {
        if (editingOrderId) {
          await fetch(`${API_URL}/api/orders/${editingOrderId}/complete`, { method: 'PUT' });
        }
        Swal.fire('تم الاعتماد', 'تم خصم الكميات من المخزون وتسجيل الأرباح بنجاح', 'success');
        setAdminCart([]);
        setEditingOrderId(null);
        setAdminView('orders');
        fetchAllData();
      }
    } catch (error) { setAlert("❌ حدث خطأ في الخادم"); }
  };

  // --- معالجة ورفع الصور ---
  const handleImageUpload = (e, targetField) => {
    const file = e.target.files[0]; 
    if (!file) return;
    const reader = new FileReader(); 
    reader.readAsDataURL(file);
    reader.onload = (event) => { 
      const img = new Image(); 
      img.src = event.target.result;
      img.onload = () => { 
        const cvs = document.createElement('canvas'); 
        cvs.width = 500; 
        cvs.height = img.height * (500 / img.width); 
        const ctx = cvs.getContext('2d'); 
        ctx.drawImage(img, 0, 0, cvs.width, cvs.height); 
        const compressedImage = cvs.toDataURL('image/jpeg', 0.6);
        
        if (targetField === 'worker') {
          setWorkerForm({ ...workerForm, image: compressedImage });
        } else {
          setFormData({ ...formData, image: compressedImage });
        }
      };
    };
  };

  // --- سلة العميل والطلبات ---
  const addToCart = (product, isClient = true) => {
    const targetCart = isClient ? cart : adminCart;
    const setTargetCart = isClient ? setCart : setAdminCart;
    const qtyToAdd = isClient ? (itemQtys[product.id] || 1) : 1;

    const existingIndex = targetCart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) { 
      const newCart = [...targetCart]; 
      newCart[existingIndex].qty += qtyToAdd; 
      setTargetCart(newCart); 
    } else { 
      setTargetCart([...targetCart, { ...product, qty: qtyToAdd }]); 
    }
    
    if (isClient) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'تمت الإضافة للسلة 🛒', showConfirmButton: false, timer: 1500 });
      setItemQtys(prev => ({ ...prev, [product.id]: 1 }));
    }
  };

  const handleCustomerSubmitOrder = async () => {
    if (cart.length === 0) return Swal.fire('تنبيه', 'السلة فارغة', 'warning');
    if (!customerName || !customerPhone) return Swal.fire('تنبيه', 'الرجاء إدخال الاسم ورقم الجوال للتواصل', 'warning');
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    Swal.fire({ title: 'جاري إرسال الطلب...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: customerName, customer_phone: customerPhone, cart_data: cart, total: totalAmount })
      });
      if (res.ok) {
        Swal.fire('شكراً لك!', 'تم استلام طلبك بنجاح، سنتواصل معك قريباً.', 'success');
        setCart([]); setCustomerName(''); setCustomerPhone(''); setShowCart(false);
        fetchAllData();
      }
    } catch (e) { Swal.fire('خطأ', 'تأكد من الاتصال بالإنترنت', 'error'); }
  };

  const handleProductQuantityChange = (id, change) => { 
    setItemQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + change) })); 
  };


  // =========================================================================
  // 💻 4. واجهة الإدارة (Admin Dashboard)
  // =========================================================================
  if (isAdminPanel) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          <div className="login-box glass-effect">
            <h1 className="gradient-text-large">إدارة {settings.shop_name || 'تشاطيب'}</h1>
            <p className="sub-login">أدخل بيانات الاعتماد للوصول للوحة التحكم</p>
            <input className="login-input" type="text" placeholder="اسم المستخدم" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} />
            <input className="login-input" type="password" placeholder="الرمز السري" value={loginPin} onChange={e => setLoginPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}/>
            <button onClick={handleLogin}>دخول آمن 🗝️</button>
            <a href="/" className="login-back-link">العودة لواجهة المتجر 🏠</a>
          </div>
          {alert && <div className="toast-notification">{alert}</div>}
        </div>
      );
    }

    const pendingOrders = orders.filter(o => o.status === 'معلق');
    const completedOrders = orders.filter(o => o.status === 'مكتمل');
    const mainCategoriesList = categories.filter(c => !c.parent);
    const totalProfits = products.reduce((sum, p) => sum + ((Number(p.sold) || 0) * Number(p.price)), 0);

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ {settings.shop_name || 'الإدارة'}<div className="user-badge">👤 مرحباً: {currentUser.username}</div></div>
          <nav className="side-nav">
            <button className={adminView === 'orders' ? 'active' : ''} onClick={() => setAdminView('orders')}>📥 الطلبات الواردة {pendingOrders.length > 0 && <span className="notification-badge">{pendingOrders.length}</span>}</button>
            <button className={adminView === 'pos' ? 'active' : ''} onClick={() => { setAdminView('pos'); setEditingOrderId(null); setAdminCart([]); }}>🛒 نقطة البيع (الكاشير)</button>
            <button className={adminView === 'inventory' ? 'active' : ''} onClick={() => { setAdminView('inventory'); setInvMainCat(null); setInvSubCat(null); }}>📦 الجرد والمخزون</button>
            <button className={adminView === 'categories' ? 'active' : ''} onClick={() => setAdminView('categories')}>🗂️ المنتجات والأقسام</button>
            <button className={adminView === 'workers' ? 'active' : ''} onClick={() => setAdminView('workers')}>👷‍♂️ إدارة العمال</button>
            
            {isManager && (
              <>
                <button className={adminView === 'reports' ? 'active' : ''} onClick={() => setAdminView('reports')}>📊 التقارير المالية</button>
                <button className={adminView === 'users' ? 'active' : ''} onClick={() => setAdminView('users')}>👥 طاقم الموظفين</button>
                <button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>⚙️ إعدادات المتجر</button>
              </>
            )}
            
            <button className={adminView === 'profile' ? 'active' : ''} style={{marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)'}} onClick={() => setAdminView('profile')}>👤 حسابي</button>
          </nav>
          <div className="side-footer">
            <button className="logout-btn" onClick={() => { setIsAuthenticated(false); setCurrentUser(null); }}>تسجيل الخروج 🚪</button>
          </div>
        </aside>

        <main className="content-70">
          {/* Dashboard Summary Cards */}
          {isManager && adminView !== 'pos' && adminView !== 'orders' && (
            <div className="admin-top-dashboard">
              <div className="dash-card"><h4>المنتجات المسجلة</h4><h2>{products.length}</h2></div>
              <div className="dash-card"><h4>العمال المعتمدين</h4><h2>{workers.length}</h2></div>
              <div className="dash-card highlight-card"><h4>إجمالي الأرباح</h4><h2>{totalProfits} <span>ر.س</span></h2></div>
            </div>
          )}

          {/* 1. الطلبات الواردة */}
          {adminView === 'orders' && (
            <div className="fade-in">
              <div className="panel-card mb-20">
                <h2>📥 الطلبات المعلقة (تحتاج اعتماد)</h2>
                <table className="pro-table">
                  <thead><tr><th>رقم الطلب</th><th>بيانات العميل</th><th>وقت الطلب</th><th>الإجمالي</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {pendingOrders.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>لا توجد طلبات معلقة</td></tr>}
                    {pendingOrders.map(order => (
                      <tr key={order.id}>
                        <td style={{color:'var(--gold)', fontWeight:'bold'}}>#{order.id}</td>
                        <td>{order.customer_name} <br/><span style={{fontSize:'0.85rem', color:'#888'}}>{order.customer_phone}</span></td>
                        <td>{new Date(order.created_at).toLocaleString('ar-SA')}</td>
                        <td style={{color:'var(--green)'}}>{order.total} ر.س</td>
                        <td>
                          <button className="add-btn" style={{marginRight:'5px'}} onClick={() => { setAdminCart(order.cart_data); setEditingOrderId(order.id); setAdminView('pos'); }}>مراجعة بالكاشير ✏️</button>
                          <button className="del-btn-sq" onClick={async () => { if(window.confirm('إلغاء وحذف؟')){ await fetch(`${API_URL}/api/orders/${order.id}`, {method:'DELETE'}); fetchAllData(); }}}>إلغاء</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="panel-card">
                <h2>✅ الطلبات المكتملة حديثاً</h2>
                <table className="pro-table">
                  <thead><tr><th>رقم الطلب</th><th>العميل</th><th>الإجمالي</th></tr></thead>
                  <tbody>
                    {completedOrders.slice(0, 5).map(order => (
                      <tr key={order.id}><td>#{order.id}</td><td>{order.customer_name}</td><td style={{color:'var(--green)'}}>{order.total} ر.س</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. نقطة البيع (الكاشير) */}
          {adminView === 'pos' && (
            <div className="pos-container fade-in">
              <div className="pos-products-section">
                <input type="text" className="pos-search" placeholder="🔍 ابحث عن منتج للبيع السريع..." value={posSearch} onChange={e => setPosSearch(e.target.value)}/>
                <div className="pos-grid">
                  {products.filter(p => !posSearch || p.name.includes(posSearch)).map(product => (
                    <div key={product.id} className="pos-card" onClick={() => { if(product.stock > 0) addToCart(product, false); else setAlert("نفدت الكمية"); }}>
                      {product.stock <= 0 && <div className="pos-out">نفدت الكمية</div>}
                      <img src={product.image || 'https://via.placeholder.com/100'} alt=""/>
                      <h5>{product.name}</h5>
                      <span className="pos-price">{product.price} ر.س</span>
                      <span className="pos-stock">المخزون: {product.stock}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pos-cart-section">
                <h3>{editingOrderId ? `تعديل ومراجعة طلب #${editingOrderId}` : `سلة البيع المباشر (كاشير)`}</h3>
                <div className="pos-cart-items">
                  {adminCart.map((item, index) => (
                    <div key={index} className="pos-cart-row">
                      <div className="pos-cart-info"><b>{item.name}</b><span>{item.price} ر.س</span></div>
                      <div className="pos-qty-controls">
                        <button onClick={() => { const n = [...adminCart]; n[index].qty++; setAdminCart(n); }}>+</button>
                        <span>{item.qty}</span>
                        <button onClick={() => { const n = [...adminCart]; n[index].qty--; if(n[index].qty<=0) n.splice(index,1); setAdminCart(n); }}>-</button>
                      </div>
                    </div>
                  ))}
                  {adminCart.length === 0 && <div className="pos-empty">السلة فارغة</div>}
                </div>
                <div className="pos-checkout-area">
                  <div className="pos-totals">
                    <div className="p-row final">
                      <span>الإجمالي المطلوب:</span>
                      <span>{adminCart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س</span>
                    </div>
                  </div>
                  <button className="pos-checkout-btn" onClick={handleCheckoutPOS}>اعتماد وخصم المخزون ✅</button>
                  {editingOrderId && <button className="del-btn-sq" style={{width:'100%', marginTop:'10px'}} onClick={() => { setEditingOrderId(null); setAdminCart([]); setAdminView('orders'); }}>إلغاء التعديل والعودة</button>}
                </div>
              </div>
            </div>
          )}

          {/* 3. الجرد والمخزون اليدوي */}
          {adminView === 'inventory' && (
            <div className="fade-in">
              {!invMainCat ? (
                <div className="panel-card">
                  <h2>📦 الجرد: اختر القسم الرئيسي</h2>
                  <div className="folders-grid">
                    {mainCategoriesList.map(cat => (<div key={cat.id} className="folder-card main" onClick={() => setInvMainCat(cat)}><h3>{cat.name}</h3></div>))}
                  </div>
                </div>
              ) : !invSubCat ? (
                <div className="panel-card">
                  <button className="back-btn" onClick={() => setInvMainCat(null)}>🔙 رجوع للأقسام الرئيسية</button>
                  <h2>📦 جرد الأقسام الفرعية لـ ({invMainCat.name})</h2>
                  <div className="folders-grid">
                    {categories.filter(c => c.parent === invMainCat.name).map(cat => (<div key={cat.id} className="folder-card sub" onClick={() => setInvSubCat(cat)}><h3>{cat.name}</h3></div>))}
                  </div>
                </div>
              ) : (
                <div className="panel-card">
                  <button className="back-btn" onClick={() => setInvSubCat(null)}>🔙 رجوع</button>
                  <div className="path-header">مستودع ⬅️ {invMainCat.name} ⬅️ {invSubCat.name}</div>
                  <table className="pro-table">
                    <thead><tr><th>المنتج</th><th>المخزون الحالي</th><th>الكمية المباعة</th><th>تحديث المخزون يدوياً</th></tr></thead>
                    <tbody>
                      {products.filter(p => p.category === invSubCat.name).map(product => (
                        <tr key={product.id}>
                          <td>{product.name}</td><td className="stk-td">{product.stock}</td><td className="sld-td">{product.sold || 0}</td>
                          <td className="act-td">
                            <div className="bulk-action-wrapper">
                              <input type="number" className="bulk-input" placeholder="أدخل الكمية..." value={invBulkInputs[product.id] || ''} onChange={(e) => setInvBulkInputs({...invBulkInputs, [product.id]: e.target.value})}/>
                              <div className="bulk-buttons">
                                <button className="btn-plus-bulk" onClick={() => handleBulkInventoryUpdate(product, true)}>إضافة للمخزون (+)</button>
                                <button className="btn-minus-bulk" onClick={() => handleBulkInventoryUpdate(product, false)}>خصم تالف/مباع (-)</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. إدارة المنتجات والأقسام العميقة */}
          {adminView === 'categories' && (
            <div className="fade-in">
              {!activeMainCat ? (
                <div className="panel-card">
                  <h2>1. إدارة الأقسام الرئيسية (مثال: كهرباء، سباكة، بناء)</h2>
                  <div className="add-row mb-20">
                    <input placeholder="اسم القسم الرئيسي الجديد..." value={newMainName} onChange={e => setNewMainName(e.target.value)}/>
                    <button className="add-btn" onClick={() => handleAddCategory(false)}>إضافة قسم رئيسي 📁</button>
                  </div>
                  <div className="folders-grid">
                    {mainCategoriesList.map(c => (
                      <div key={c.id} className="folder-card main" onClick={() => setActiveMainCat(c)}>
                        <h3>{c.name}</h3>
                        <button className="del-btn-corner" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}>حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !activeSubCat ? (
                <div className="panel-card">
                  <button className="back-btn" onClick={() => setActiveMainCat(null)}>🔙 رجوع</button>
                  <h2>2. إدارة الأقسام الفرعية لـ ({activeMainCat.name}) (مثال: أفياش، كابلات)</h2>
                  <div className="add-row mb-20">
                    <input placeholder="اسم القسم الفرعي الجديد..." value={newSubName} onChange={e => setNewSubName(e.target.value)}/>
                    <button className="add-btn" onClick={() => handleAddCategory(true)}>إضافة قسم فرعي 📂</button>
                  </div>
                  <div className="folders-grid">
                    {categories.filter(c => c.parent === activeMainCat.name).map(c => (
                      <div key={c.id} className="folder-card sub" onClick={() => setActiveSubCat(c)}>
                        <h3>{c.name}</h3>
                        <button className="del-btn-corner" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}>حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="panel-card">
                  <button className="back-btn" onClick={() => { setActiveSubCat(null); setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: '', details: '', manufacturer: '', image: '', is_sale: false, out_of_stock: false }); }}>🔙 رجوع</button>
                  <div className="path-header">{activeMainCat.name} ⬅️ {activeSubCat.name}</div>
                  
                  <div className="product-entry-form">
                    <div className="img-upload-box">
                      {formData.image ? <img src={formData.image} alt="prod"/> : <div className="img-ph">صورة المنتج</div>}
                      <label className="upload-label">رفع صورة 📸 <input type="file" onChange={(e) => handleImageUpload(e, 'product')} style={{display:'none'}}/></label>
                    </div>
                    <div className="data-entry-box">
                      <input className="f-input full" placeholder="اسم المنتج (مثال: فيش ثلاثي باناسونيك)..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                      <div className="f-row">
                        <input className="f-input" type="number" placeholder="السعر الجديد (البيع)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/>
                        <input className="f-input" type="number" placeholder="السعر القديم (لإظهار التخفيض للعميل)" value={formData.old_price} onChange={e => setFormData({...formData, old_price: e.target.value})}/>
                        <input className="f-input" type="number" placeholder="كمية المخزون الافتتاحية" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}/>
                      </div>
                      <input className="f-input full" placeholder="الشركة المصنعة (ماركة المنتج)..." value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})}/>
                      <textarea className="f-input full" rows="3" placeholder="تفاصيل ومواصفات المنتج..." value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}></textarea>
                      <div className="f-toggles">
                        <button className={`t-btn ${formData.is_sale ? 'active-green' : ''}`} onClick={() => setFormData({...formData, is_sale: !formData.is_sale})}>🔥 تحديد كعرض خاص</button>
                        <button className={`t-btn ${formData.out_of_stock ? 'active-out' : ''}`} onClick={() => setFormData({...formData, out_of_stock: !formData.out_of_stock})}>🚫 تحديد كنفدت الكمية</button>
                        <button className="save-btn" onClick={handleSaveProduct}>{editingItem ? 'تحديث بيانات المنتج 🔄' : 'حفظ المنتج في المستودع ✅'}</button>
                      </div>
                    </div>
                  </div>

                  <div className="mini-products-list mt-30">
                    <h3 style={{color:'var(--navy)'}}>المنتجات المسجلة في هذا القسم:</h3>
                    {products.filter(p => p.category === activeSubCat.name).map(product => (
                      <div key={product.id} className="m-prod-row" onClick={() => { setEditingItem(product); setFormData(product); }}>
                        <img src={product.image || 'https://via.placeholder.com/50'} alt=""/>
                        <b>{product.name}</b>
                        <span style={{color:'var(--green)', fontWeight:'bold'}}>{product.price} ر.س</span>
                        {product.old_price && <span style={{color:'#999', textDecoration:'line-through', fontSize:'0.9rem'}}>{product.old_price} ر.س</span>}
                        <button className="del-btn-sq" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}>حذف ❌</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. إدارة العمال */}
          {adminView === 'workers' && (
            <div className="panel-card fade-in">
              <h2>👷‍♂️ إدارة عمال الصيانة (لتطبيق الحراج)</h2>
              <div className="product-entry-form" style={{flexDirection: 'column'}}>
                <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                  <div className="worker-images-upload" style={{flex: '0 0 150px'}}>
                    <div className="img-upload-box mb-20">
                      {workerForm.image ? <img src={workerForm.image} alt="worker"/> : <div className="img-ph">صورة (اختياري)</div>}
                      <label className="upload-label">رفع صورة <input type="file" onChange={(e) => handleImageUpload(e, 'worker')} style={{display:'none'}}/></label>
                    </div>
                  </div>
                  <div className="data-entry-box" style={{flex: '1'}}>
                    <div className="f-row">
                      <input className="f-input" placeholder="اسم العامل..." value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})}/>
                      <input className="f-input" placeholder="رقم الجوال (واتساب)..." value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}/>
                    </div>
                    <div className="f-row">
                      <input className="f-input" placeholder="المنطقة (مثال: جازان)" value={workerForm.region} onChange={e => setWorkerForm({...workerForm, region: e.target.value})}/>
                      <input className="f-input" placeholder="المحافظة/المدينة (مثال: العارضة)" value={workerForm.city} onChange={e => setWorkerForm({...workerForm, city: e.target.value})}/>
                    </div>
                    <input className="f-input" placeholder="المهنة (سباك، كهربائي، مليس...)" value={workerForm.profession} onChange={e => setWorkerForm({...workerForm, profession: e.target.value})}/>
                    <textarea className="f-input" placeholder="تفاصيل أو نبذة عن خبرة العامل..." value={workerForm.details} onChange={e => setWorkerForm({...workerForm, details: e.target.value})}></textarea>
                    <button className="save-btn" onClick={handleSaveWorker}>{editingWorker ? 'تحديث بيانات العامل' : 'إضافة عامل جديد 👷‍♂️'}</button>
                  </div>
                </div>
              </div>
              <div className="folders-grid mt-30">
                {workers.map(w => (
                  <div key={w.id} className="worker-admin-card" onClick={() => {setEditingWorker(w); setWorkerForm(w);}}>
                    <img src={w.image || 'https://via.placeholder.com/60'} alt=""/>
                    <div className="w-info">
                      <h4>{w.name}</h4>
                      <small>{w.profession} | {w.region} - {w.city}</small>
                    </div>
                    <button className="del-btn-sq" onClick={(e) => {e.stopPropagation(); handleDeleteWorker(w.id);}}>حذف ❌</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. التقارير المالية التفصيلية */}
          {adminView === 'reports' && isManager && (
            <div className="panel-card fade-in">
              <h2>📊 التقارير المالية المفصلة (حسب القسم)</h2>
              <div className="reports-split-container">
                {mainCategoriesList.map(mainCat => {
                  const subCatNames = categories.filter(c => c.parent === mainCat.name).map(x => x.name);
                  const myProducts = products.filter(p => subCatNames.includes(p.category) && (p.sold > 0));
                  const sectionProfit = myProducts.reduce((sum, item) => sum + (Number(item.sold) * Number(item.price)), 0);
                  
                  if (myProducts.length === 0) return null; // لا تعرض الأقسام الفارغة من المبيعات

                  return (
                    <div key={mainCat.id} className="report-main-section">
                      <h3 className="r-header">قسم: {mainCat.name} | إجمالي أرباح القسم: {sectionProfit} ر.س</h3>
                      <table className="pro-table">
                        <thead><tr><th>المنتج</th><th>القسم الفرعي</th><th>الكمية المباعة</th><th>إجمالي الأرباح</th></tr></thead>
                        <tbody>
                          {myProducts.map(p => (
                            <tr key={p.id}>
                              <td>{p.name}</td><td>{p.category}</td><td className="sld-td">{p.sold}</td><td className="profit-td">{p.sold * p.price} ر.س</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
                {products.filter(p => p.sold > 0).length === 0 && <div style={{textAlign:'center', padding:'30px'}}>لا توجد مبيعات مسجلة حتى الآن.</div>}
              </div>
            </div>
          )}

          {/* 7. إدارة طاقم الموظفين (إضافة وتعديل) */}
          {adminView === 'users' && isManager && (
            <div className="panel-card fade-in">
              <h2>👥 طاقم الإدارة والصلاحيات</h2>
              <div className="add-row mb-20" style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px'}}>
                <input placeholder="اسم الموظف..." value={newAdminForm.username} onChange={e => setNewAdminForm({...newAdminForm, username: e.target.value})}/>
                <input placeholder="الرمز السري..." type="text" value={newAdminForm.pin} onChange={e => setNewAdminForm({...newAdminForm, pin: e.target.value})}/>
                <select value={newAdminForm.role} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})} style={{padding:'12px', borderRadius:'8px'}}>
                  <option value="موظف">موظف (كاشير/جرد فقط)</option>
                  <option value="مدير">مدير (صلاحيات كاملة)</option>
                </select>
                <button className="add-btn" onClick={handleSaveAdmin}>{editingAdmin ? 'تحديث الموظف 🔄' : 'إضافة وتفعيل ➕'}</button>
                {editingAdmin && <button className="del-btn-sq" onClick={() => { setEditingAdmin(null); setNewAdminForm({ username: '', pin: '', role: 'موظف' }); }}>إلغاء التعديل</button>}
              </div>
              <table className="pro-table">
                <thead><tr><th>الاسم</th><th>الصلاحية</th><th>إجراء</th></tr></thead>
                <tbody>
                  {admins.map(adminUser => (
                    <tr key={adminUser.id}>
                      <td>{adminUser.username} {adminUser.id === currentUser.id ? '(أنت)' : ''}</td>
                      <td><span className="sc-badge">{adminUser.role}</span></td>
                      <td>
                        <button className="add-btn" style={{marginRight:'5px', background:'#3498db'}} onClick={() => { setEditingAdmin(adminUser); setNewAdminForm({ username: adminUser.username, pin: adminUser.pin, role: adminUser.role }); }}>تعديل ✏️</button>
                        <button className="del-btn-sq" onClick={() => handleDeleteAdmin(adminUser.id, adminUser.role)}>حذف ❌</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 8. إعدادات المتجر */}
          {adminView === 'settings' && isManager && (
            <div className="panel-card fade-in">
              <h2>⚙️ إعدادات المتجر العامة</h2>
              <div className="settings-grid">
                <div className="form-group"><label>الاسم التجاري للمحل:</label><input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/></div>
                <div className="form-group"><label>رقم واتساب للتواصل واستقبال الطلبات:</label><input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/></div>
              </div>
              <button className="save-btn full-w-btn" onClick={handleSaveSettings}>حفظ التعديلات وتطبيقها على المتجر ✅</button>
            </div>
          )}

          {/* 9. حسابي */}
          {adminView === 'profile' && (
            <div className="panel-card fade-in">
              <h2>👤 حسابي الشخصي</h2>
              <div className="settings-grid">
                <div className="form-group"><label>اسم المستخدم (لا يمكن تغييره)</label><input value={currentUser.username} disabled style={{background: '#eee'}} /></div>
                <div className="form-group"><label>تغيير الرمز السري 🔒</label><input type="password" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} placeholder="أدخل الرمز الجديد هنا..." /></div>
              </div>
              <button className="save-btn full-w-btn" onClick={handleChangeMyPassword}>حفظ الرمز السري الجديد</button>
            </div>
          )}

        </main>
      </div>
    );
  }

  // =========================================================================
  // 💻 5. واجهة العميل (Storefront) - متجر تشاطيب الحي
  // =========================================================================
  
  // معالجة فلاتر العميل للمنتجات
  let processedProducts = products;
  if (searchQuery) { 
    processedProducts = processedProducts.filter(p => p.name.includes(searchQuery) || (p.details && p.details.includes(searchQuery))); 
  } else { 
    processedProducts = processedProducts.filter(p => p.category === clientSub); 
  }

  // معالجة فلاتر العمال
  const uniqueRegions = [...new Set(workers.map(w => w.region))].filter(Boolean);
  const filteredCities = [...new Set(workers.filter(w => (!harajRegion || w.region === harajRegion)).map(w => w.city))].filter(Boolean);
  const visibleWorkers = workers.filter(w => (!harajRegion || w.region === harajRegion) && (!harajCity || w.city === harajCity));

  const mainCategoriesList = categories.filter(c => !c.parent);

  return (
    <div className={`App client-theme ${showCart || selectedProduct || showWorkersHaraj ? 'no-scroll' : ''}`}>
      {/* الشريط العلوي */}
      <header className="royal-header" style={{boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name || 'تشاطيب'} ⚡</div>
         <div className="search-bar-wrapper"><input placeholder="🔍 ابحث عن منتج، ماركة، أو تفاصيل..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{borderRadius:'20px', padding:'10px 15px'}} /></div>
         
         <div style={{display:'flex', gap:'10px'}}>
             <button className="open-cart-large desktop-only" onClick={() => setShowWorkersHaraj(true)} style={{borderRadius:'20px', border:'2px solid var(--navy)', color:'var(--navy)', background:'white'}}>👷‍♂️ حراج العمال</button>
             <button className="open-cart-large desktop-only" onClick={() => setShowCart(true)} style={{borderRadius:'20px'}}>🛒 السلة <span style={{background:'var(--gold)', color:'#000', padding:'2px 8px', borderRadius:'10px', marginLeft:'5px'}}>{cart.length}</span></button>
         </div>
      </header>
      
      {/* شريط الأقسام المزدوج */}
      {!searchQuery && (
        <>
          <div className="client-main-bar">
            {mainCategoriesList.map(cat => (
              <button key={cat.id} className={clientMain === cat.name ? 'active' : ''} onClick={() => { setClientMain(cat.name); const sub = categories.filter(x => x.parent === cat.name); if(sub.length > 0) setClientSub(sub[0].name); else setClientSub(''); }}>
                {cat.name}
              </button>
            ))}
          </div>
          {categories.filter(c => c.parent === clientMain).length > 0 && (
            <div className="client-sub-bar">
              {categories.filter(c => c.parent === clientMain).map(subCat => (
                <button key={subCat.id} className={clientSub === subCat.name ? 'active' : ''} onClick={() => setClientSub(subCat.name)}>
                  {subCat.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* شبكة المنتجات للعميل */}
      <div className="gallery-container">
        {processedProducts.length === 0 ? (
          <div className="empty-state"><h3>لا توجد منتجات هنا حالياً.</h3><p>جرب تصفح قسم آخر أو البحث باسم مختلف.</p></div>
        ) : (
          <div className="p-grid-royal">
            {processedProducts.map(product => (
              <div key={product.id} className="royal-p-card" onClick={() => setSelectedProduct(product)}>
                {product.is_sale && <div className="discount-badge">عرض خاص 🔥</div>}
                {product.out_of_stock && <div className="sold-tag">نفدت الكمية 🚫</div>}
                <div className="p-img-box"><img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} /></div>
                <div className="p-info-box">
                  <h4 style={{fontSize:'1.1rem', marginBottom:'10px', height:'40px', overflow:'hidden'}}>{product.name}</h4>
                  <div className="price-area">
                    <span className="now-price">{product.price} ر.س</span>
                    {product.old_price && <span className="old-price">{product.old_price} ر.س</span>}
                  </div>
                  <div className="action-area" style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px'}}>
                    {!product.out_of_stock && (
                      <div className="qty-controls" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleProductQuantityChange(product.id, 1)}>+</button>
                        <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>{itemQtys[product.id] || 1}</span>
                        <button onClick={() => handleProductQuantityChange(product.id, -1)}>-</button>
                      </div>
                    )}
                    <button className={`add-btn-p ${product.out_of_stock ? 'disabled' : ''}`} disabled={product.out_of_stock} onClick={(e) => { e.stopPropagation(); if (!product.out_of_stock) addToCart(product); }}>
                      {product.out_of_stock ? 'غير متوفر' : 'أضف 🛒'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* زر الواتساب العائم والأدوات السفلية للجوال */}
      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      {cart.length > 0 && (
        <div className="mobile-sticky-cart hide-desktop" onClick={() => setShowCart(true)}>
          <div className="m-cart-info">🛒 في السلة: <b>{cart.length}</b></div>
          <div className="m-cart-total">{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س</div>
        </div>
      )}

      {/* نافذة عرض تفاصيل المنتج */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content fade-in-up" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="modal-body-split">
              <div className="m-img-side">
                {selectedProduct.is_sale && <div className="m-discount">🔥 عرض خاص</div>}
                <img src={selectedProduct.image || 'https://via.placeholder.com/300'} alt={selectedProduct.name} />
              </div>
              <div className="m-details-side">
                <h2>{selectedProduct.name}</h2>
                <div className="m-price-box">
                  <span className="m-now">{selectedProduct.price} ر.س</span>
                  {selectedProduct.old_price && <span className="m-old">{selectedProduct.old_price} ر.س</span>}
                </div>
                <div className="m-desc-box">
                  <h3>المواصفات والتفاصيل:</h3>
                  <div className="m-desc">{selectedProduct.details || 'لا توجد تفاصيل إضافية مسجلة لهذا المنتج.'}</div>
                </div>
                {!selectedProduct.out_of_stock && (
                  <div className="qty-controls" style={{justifyContent:'center', padding:'15px', marginBottom:'15px'}}>
                    <button onClick={() => handleProductQuantityChange(selectedProduct.id, 1)}>+</button>
                    <span style={{fontSize:'1.5rem', fontWeight:'bold', margin:'0 15px'}}>{itemQtys[selectedProduct.id] || 1}</span>
                    <button onClick={() => handleProductQuantityChange(selectedProduct.id, -1)}>-</button>
                  </div>
                )}
                {!selectedProduct.out_of_stock ? (
                  <button className="m-add-btn" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>إضافة للسلة 🛒</button>
                ) : (
                  <button className="m-add-btn disabled" disabled>🚫 نفدت الكمية من المستودع</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* حراج العمال المنبثق */}
      {showWorkersHaraj && (
        <div className="cart-overlay open" style={{background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)'}}>
          <div className="cart-inner-container-large fade-in-up" style={{maxWidth:'800px'}}>
             <div className="cart-header-fixed">
                <h2>👷‍♂️ خدمات العمال والصيانة</h2>
                <button className="close-btn-x" onClick={() => setShowWorkersHaraj(false)}>✕</button>
             </div>
             {/* فلاتر المنطقة والمدينة */}
             <div className="workers-filters" style={{padding:'15px', background:'#f8f9fa', borderBottom:'1px solid #eee', display:'flex', gap:'10px'}}>
                <select value={harajRegion} onChange={e => {setHarajRegion(e.target.value); setHarajCity('');}} style={{flex:1, padding:'10px', borderRadius:'8px', border:'2px solid var(--gold)'}}>
                    <option value="">🔍 كل المناطق</option>
                    {uniqueRegions.map((r, i) => <option key={i} value={r}>{r}</option>)}
                </select>
                <select value={harajCity} onChange={e => setHarajCity(e.target.value)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'2px solid var(--gold)'}}>
                    <option value="">🏙️ كل المدن/المحافظات</option>
                    {filteredCities.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
             </div>
             <div className="cart-products-scroll" style={{background:'#fdfdfd'}}>
                 {visibleWorkers.length === 0 ? (
                     <div className="empty-state"><h3>لا يوجد عمال متاحين حالياً في هذا النطاق.</h3></div>
                 ) : (
                    <div className="workers-public-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:'20px'}}>
                        {visibleWorkers.map(worker => (
                            <div key={worker.id} className="worker-public-card" style={{background:'white', borderRadius:'15px', border:'1px solid #eee', overflow:'hidden', boxShadow:'0 3px 10px rgba(0,0,0,0.05)', textAlign:'center', paddingBottom:'15px'}}>
                                <div style={{height:'100px', background:'var(--navy)', position:'relative'}}>
                                    <div style={{width:'80px', height:'80px', borderRadius:'50%', border:'4px solid white', overflow:'hidden', margin:'0 auto', position:'relative', top:'50px', background:'#fff'}}>
                                        <img src={worker.image || 'https://via.placeholder.com/80'} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                                    </div>
                                </div>
                                <div style={{marginTop:'60px', padding:'0 15px'}}>
                                    <h3 style={{margin:'0 0 5px 0', color:'var(--navy)'}}>{worker.name}</h3>
                                    <span style={{background:'#eee', padding:'3px 10px', borderRadius:'15px', fontSize:'0.85rem', color:'#555'}}>{worker.profession}</span>
                                    <div style={{margin:'10px 0', fontSize:'0.9rem', color:'#777'}}>📍 {worker.region} - {worker.city}</div>
                                    <p style={{fontSize:'0.9rem', color:'#333', minHeight:'40px'}}>{worker.details}</p>
                                    <button onClick={() => window.open(`https://wa.me/${worker.phone}?text=مرحباً، رأيت إعلانك في متجر ${settings.shop_name} وأريد الاستفسار`)} style={{background:'#25d366', color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', width:'100%'}}>
                                        تواصل واتساب 💬
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
             </div>
          </div>
        </div>
      )}

      {/* سلة المشتريات للعميل */}
      {showCart && (
        <div className="cart-overlay open">
          <div className="cart-inner-container-large fade-in-up">
            <div className="cart-header-fixed">
              <h2>سلة المشتريات الخاصة بك 🛒</h2>
              <button className="close-btn-x" onClick={() => setShowCart(false)}>✕</button>
            </div>
            <div className="cart-products-scroll">
              {cart.length === 0 && <div className="empty-cart-msg">سلتك فارغة حالياً، تصفح المنتجات!</div>}
              {cart.map((item, index) => (
                <div key={index} className="cart-product-row">
                  <img src={item.image || 'https://via.placeholder.com/80'} alt="" className="cart-p-img" />
                  <div className="cart-p-details">
                    <div className="cart-p-title">{item.name}</div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div className="qty-controls-mini">
                        <button onClick={() => { const n = [...cart]; n[index].qty++; setCart(n); }}>+</button>
                        <span>{item.qty}</span>
                        <button onClick={() => { const n = [...cart]; n[index].qty--; if(n[index].qty<=0) n.splice(index,1); setCart(n); }}>-</button>
                      </div>
                      <span className="cart-item-total">{item.price * item.qty} ر.س</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {cart.length > 0 && (
                <div className="customer-info-box">
                  <h4 style={{marginTop:0, color:'var(--navy)'}}>📍 بيانات التواصل لتأكيد الطلب:</h4>
                  <input className="c-input" type="text" placeholder="الاسم الكريم" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  <input className="c-input" type="tel" placeholder="رقم الجوال (للاتصال أو الواتساب)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="cart-floating-action">
                <div className="total-gold-box">الإجمالي المطلوب: <span>{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س</span></div>
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