/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com';

const SAUDI_REGIONS = {
  'الرياض': ['الرياض', 'الخرج', 'الدوادمي', 'المجمعة', 'وادي الدواسر', 'الزلفي', 'عفيف', 'الدرعية'],
  'مكة المكرمة': ['مكة المكرمة', 'جدة', 'الطائف', 'القنفذة', 'الليث', 'رابغ', 'خليص', 'الخرمة'],
  'المدينة المنورة': ['المدينة المنورة', 'ينبع', 'العلا', 'مهد الذهب', 'بدر', 'خيبر'],
  'الشرقية': ['الدمام', 'الخبر', 'الظهران', 'الأحساء', 'حفر الباطن', 'الجبيل', 'القطيف', 'الخفجي'],
  'عسير': ['أبها', 'خميس مشيط', 'بيشة', 'محايل عسير', 'النماص', 'أحد رفيدة', 'تثليث'],
  'جازان': ['جيزان', 'صبيا', 'أبو عريش', 'صامطة', 'الدرب', 'العارضة', 'بيش', 'أحد المسارحة'],
  'القصيم': ['بريدة', 'عنيزة', 'الرس', 'البكيرية', 'البدائع', 'المذنب'],
  'تبوك': ['تبوك', 'تيماء', 'الوجه', 'أملج', 'حقل', 'ضباء'],
  'حائل': ['حائل', 'بقعاء', 'الغزالة', 'الشنان'],
  'نجران': ['نجران', 'شرورة', 'حبونا'],
  'الباحة': ['الباحة', 'بلجرشي', 'المندق', 'المخواة'],
  'الجوف': ['سكاكا', 'دومة الجندل', 'القريات', 'طبرجل'],
  'الحدود الشمالية': ['عرعر', 'طريف', 'رفحاء', 'العويقيلة']
};

function App() {
  const [products, setProducts] = useState([]); const [categories, setCategories] = useState([]); const [workers, setWorkers] = useState([]);
  const [settings, setSettings] = useState({ phone: '', shop_name: '' }); const [admins, setAdmins] = useState([]); const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]); const [alert, setAlert] = useState(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false); const [currentUser, setCurrentUser] = useState(null); 
  const [loginUsername, setLoginUsername] = useState(''); const [loginPin, setLoginPin] = useState(''); const [newPasswordInput, setNewPasswordInput] = useState('');
  const isManager = currentUser && currentUser.role && currentUser.role.trim() === 'مدير';

  const [adminView, setAdminView] = useState('orders'); const [activeMainCat, setActiveMainCat] = useState(null); const [activeSubCat, setActiveSubCat] = useState(null);
  const [newMainName, setNewMainName] = useState(''); const [newSubName, setNewSubName] = useState('');
  const [invMainCat, setInvMainCat] = useState(null); const [invSubCat, setInvSubCat] = useState(null); const [invBulkInputs, setInvBulkInputs] = useState({});
  const [adminCart, setAdminCart] = useState([]); const [posSearch, setPosSearch] = useState(''); const [editingOrderId, setEditingOrderId] = useState(null);

  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: '', details: '', manufacturer: '', image: '', is_sale: false, out_of_stock: false, color: '', warranty: '', badge: '' });
  const [editingItem, setEditingItem] = useState(null); const [workerForm, setWorkerForm] = useState({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '' });
  const [editingWorker, setEditingWorker] = useState(null); const [newAdminForm, setNewAdminForm] = useState({ username: '', pin: '', role: 'موظف' }); const [editingAdmin, setEditingAdmin] = useState(null);

  const [darkMode, setDarkMode] = useState(false); const [sortType, setSortType] = useState('default'); 
  const [showCart, setShowCart] = useState(false); const [checkoutStep, setCheckoutStep] = useState(1);
  const [customerName, setCustomerName] = useState(''); const [customerPhone, setCustomerPhone] = useState(''); const [customerLocation, setCustomerLocation] = useState(''); const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showWorkersHaraj, setShowWorkersHaraj] = useState(false); const [harajRegion, setHarajRegion] = useState(''); const [harajCity, setHarajCity] = useState('');
  const [clientMain, setClientMain] = useState(''); const [clientSub, setClientSub] = useState(''); const [itemQtys, setItemQtys] = useState({});
  const [searchQuery, setSearchQuery] = useState(''); const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [timeLeft, setTimeLeft] = useState(8500); const [prevOrderCount, setPrevOrderCount] = useState(0);

  const isAdminPanel = window.location.pathname.includes('/admin'); const FREE_SHIPPING_THRESHOLD = 500;

  useEffect(() => { fetchAllData(); const timer = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000); return () => clearInterval(timer); }, []); 
  
  useEffect(() => {
    if (orders.length > prevOrderCount && prevOrderCount !== 0 && isAdminPanel) { Swal.fire({toast:true, position:'top-end', icon:'info', title:'🔔 طلب جديد وصل!', showConfirmButton:false, timer:4000}); }
    setPrevOrderCount(orders.length);
  }, [orders]);

  const formatTime = (secs) => `${Math.floor(secs / 3600).toString().padStart(2,'0')}:${Math.floor((secs % 3600) / 60).toString().padStart(2,'0')}:${(secs % 60).toString().padStart(2,'0')}`;

  const fetchAllData = async () => {
    try {
      const [pRes, cRes, wRes, sRes, aRes, oRes] = await Promise.all([ fetch(`${API_URL}/api/products`), fetch(`${API_URL}/api/categories`), fetch(`${API_URL}/api/workers`), fetch(`${API_URL}/api/settings`), fetch(`${API_URL}/api/admins`), fetch(`${API_URL}/api/orders`) ]);
      const pData = await pRes.json(); const cData = await cRes.json(); const wData = await wRes.json(); const sData = await sRes.json(); const aData = await aRes.json(); const oData = await oRes.json();
      setProducts(pData); setCategories(cData); setWorkers(wData); setSettings(sData); setAdmins(aData); setOrders(oData);
      const mainCategories = cData.filter(c => !c.parent);
      if (!isAdminPanel && mainCategories.length > 0 && !clientMain) { setClientMain(mainCategories[0].name); const subCategories = cData.filter(c => c.parent === mainCategories[0].name); if (subCategories.length > 0) setClientSub(subCategories[0].name); }
    } catch (error) { console.error("DB Error"); }
  };

  const parseProductDetails = (detailsString) => { try { return JSON.parse(detailsString); } catch (e) { return { text: detailsString, color: '', warranty: '', badge: '', manufacturer: '' }; } };

  const handleLogin = async () => {
    if (!loginUsername || !loginPin) return Swal.fire({title:'تنبيه', text:'أدخل البيانات', icon:'warning', position:'center'});
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: loginUsername.trim(), pin: loginPin }) });
      const data = await response.json();
      if (data.success) { setCurrentUser(data.user); setIsAuthenticated(true); setAdminView('orders'); Swal.fire({toast:true, position:'top-end', icon:'success', title:'تم الدخول', showConfirmButton:false, timer:1500}); } 
      else { Swal.fire({title:'خطأ', text:'بيانات الدخول غير صحيحة', icon:'error', position:'center'}); }
    } catch (error) { Swal.fire({title:'خطأ', text:'مشكلة في الاتصال', icon:'error', position:'center'}); }
  };

  const handleChangeMyPassword = async () => {
    if (!newPasswordInput) return Swal.fire({title:'تنبيه', text:'أدخل الرمز الجديد', icon:'warning', position:'center'});
    try { const res = await fetch(`${API_URL}/api/admins/${currentUser.id}/pin`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPin: newPasswordInput }) }); if (res.ok) { Swal.fire({title:'نجاح', text:'تم تغيير رمزك السري', icon:'success', position:'center'}); setNewPasswordInput(''); fetchAllData(); } } catch (error) { Swal.fire({title:'خطأ', text:'حدث خطأ', icon:'error', position:'center'}); }
  };

  const handleAddCategory = async (isSub = false) => {
    const name = isSub ? newSubName : newMainName; if (!name) return Swal.fire({title:'تنبيه', text:'أدخل اسم القسم', icon:'warning', position:'center'});
    try { const res = await fetch(`${API_URL}/api/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, icon: isSub ? '📂' : '📁', parent: isSub ? activeMainCat.name : '' }) }); if (res.ok) { isSub ? setNewSubName('') : setNewMainName(''); fetchAllData(); } } catch(e) {}
  };

  const handleDeleteCategory = async (id) => { if(window.confirm("حذف هذا القسم؟")) { await fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' }); fetchAllData(); } };

  const handleSaveProduct = async () => {
    if (!formData.name || !activeSubCat) return Swal.fire({title:'تنبيه', text:'الاسم والقسم مطلوبان', icon:'warning', position:'center'});
    const advancedDetails = JSON.stringify({ text: formData.details || '', color: formData.color || '', warranty: formData.warranty || '', badge: formData.badge || '', manufacturer: formData.manufacturer || '' });
    const payload = { ...formData, price: formData.price ? parseFloat(formData.price) : 0, old_price: formData.old_price ? parseFloat(formData.old_price) : 0, stock: formData.stock ? parseInt(formData.stock) : 0, category: activeSubCat.name, details: advancedDetails, modified_by: currentUser.username };
    const method = editingItem ? 'PUT' : 'POST'; const url = editingItem ? `${API_URL}/api/products/${editingItem.id}` : `${API_URL}/api/products`;
    try { const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (res.ok) { Swal.fire({title:'نجاح', text:'تم حفظ المنتج', icon:'success', position:'center'}); setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: '', details: '', manufacturer: '', color: '', warranty: '', badge: '', image: '', is_sale: false, out_of_stock: false }); fetchAllData(); } } catch (e) { Swal.fire({title:'خطأ', text:'فشل الاتصال', icon:'error', position:'center'}); }
  };

  const handleDeleteProduct = async (id) => { if (window.confirm("حذف المنتج؟")) { await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' }); fetchAllData(); } };

  const handleSaveWorker = async () => {
    if (!workerForm.name || !workerForm.phone || !workerForm.region || !workerForm.city) return Swal.fire({title:'تنبيه', text:'أكمل البيانات الأساسية', icon:'warning', position:'center'});
    const method = editingWorker ? 'PUT' : 'POST'; const url = editingWorker ? `${API_URL}/api/workers/${editingWorker.id}` : `${API_URL}/api/workers`;
    const payload = { ...workerForm, portfolio_img: '', safety_details: '', rating: '5.0', is_busy: false, hidden: false, modified_by: currentUser.username };
    try { const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (res.ok) { Swal.fire({title:'نجاح', text:'تم حفظ العامل بامتياز', icon:'success', position:'center'}); setWorkerForm({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '' }); setEditingWorker(null); fetchAllData(); } else { Swal.fire({title:'خطأ', text:'السيرفر يرفض البيانات', icon:'error', position:'center'}); } } catch(e) { Swal.fire({title:'خطأ', text:'فشل الاتصال بالسيرفر', icon:'error', position:'center'}); }
  };

  const handleDeleteWorker = async (id) => { if (window.confirm("حذف العامل؟")) { await fetch(`${API_URL}/api/workers/${id}`, { method: 'DELETE' }); fetchAllData(); } };

  const handleSaveAdmin = async () => {
    if (!newAdminForm.username || !newAdminForm.pin) return Swal.fire({title:'تنبيه', text:'البيانات ناقصة', icon:'warning', position:'center'});
    const method = editingAdmin ? 'PUT' : 'POST'; const url = editingAdmin ? `${API_URL}/api/admins/${editingAdmin.id}` : `${API_URL}/api/admins`;
    try { const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAdminForm) }); if (res.ok) { Swal.fire({title:'نجاح', text:'تم حفظ الموظف', icon:'success', position:'center'}); setNewAdminForm({ username: '', pin: '', role: 'موظف' }); setEditingAdmin(null); fetchAllData(); } else { Swal.fire({title:'خطأ', text:'الاسم مسجل مسبقاً', icon:'error', position:'center'}); } } catch (e) { Swal.fire({title:'خطأ', text:'فشل الاتصال', icon:'error', position:'center'}); }
  };

  const handleDeleteAdmin = async (id, role) => { if (role === 'مدير') return Swal.fire({title:'مرفوض', text:'لا يمكن حذف المدير!', icon:'error', position:'center'}); if (window.confirm("حذف الموظف؟")) { await fetch(`${API_URL}/api/admins/${id}`, { method: 'DELETE' }); fetchAllData(); } };

  const handleSaveSettings = async () => { try { const res = await fetch(`${API_URL}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); if (res.ok) { Swal.fire({title:'نجاح', text:'تم التحديث ✅', icon:'success', position:'center'}); fetchAllData(); } } catch (e) {} };

  const handleBulkInventoryUpdate = async (product, isAdding) => {
    const qty = Number(invBulkInputs[product.id]); if (!qty || qty <= 0) return Swal.fire({title:'تنبيه', text:'أدخل كمية', icon:'warning', position:'center'});
    let newStock = Number(product.stock) + (isAdding ? qty : -qty); if (newStock < 0) return Swal.fire({title:'خطأ', text:'لا يكفي المخزون', icon:'error', position:'center'});
    try { const res = await fetch(`${API_URL}/api/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, stock: newStock, modified_by: currentUser.username }) }); if (res.ok) { Swal.fire({toast:true, position:'bottom-center', icon:'success', title:'تم تحديث الجرد', showConfirmButton:false, timer:1500}); setInvBulkInputs({ ...invBulkInputs, [product.id]: '' }); fetchAllData(); } } catch (e) {}
  };

  const handlePrintReceipt = (cartToPrint, total) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    const htmlContent = `<html dir="rtl"><head><style>body { font-family: 'Arial', sans-serif; width: 80mm; margin: 0 auto; padding: 10px; text-align: center; font-size: 14px; } table { width: 100%; text-align: right; border-collapse: collapse; margin: 15px 0; font-size: 12px; } th, td { border-bottom: 1px dashed #ccc; padding: 5px 0; } .header h2 { margin: 0; font-size: 20px; } .total { font-size: 18px; font-weight: bold; text-align: left; margin-top: 10px; border-top: 2px solid #000; padding-top: 10px; }</style></head><body><div class="header"><h2>${settings.shop_name}</h2><p>رقم التواصل: ${settings.phone}</p><p>التاريخ: ${new Date().toLocaleString('ar-SA')}</p></div><table><tr><th>الصنف</th><th>الكمية</th><th>السعر</th></tr>${cartToPrint.map(item => `<tr><td>${item.name}</td><td>${item.qty}</td><td>${item.price * item.qty}</td></tr>`).join('')}</table><div class="total">الإجمالي: ${total} ر.س</div><p style="margin-top: 20px;">شكراً لزيارتكم! ⚡</p></body></html>`;
    printWindow.document.write(htmlContent); printWindow.document.close(); setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleCheckoutPOS = async () => {
    if (adminCart.length === 0) return Swal.fire({title:'تنبيه', text:'السلة فارغة', icon:'warning', position:'center'});
    const total = adminCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    try {
      const res = await fetch(`${API_URL}/api/pos/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: adminCart, modified_by: currentUser.username }) });
      if (res.ok) {
        if (editingOrderId) await fetch(`${API_URL}/api/orders/${editingOrderId}/complete`, { method: 'PUT' });
        Swal.fire({ title: 'تم الاعتماد بنجاح!', icon: 'success', showCancelButton: true, confirmButtonText: 'طباعة الفاتورة 🧾', cancelButtonText: 'إغلاق', position:'center' }).then((result) => { if (result.isConfirmed) handlePrintReceipt(adminCart, total); setAdminCart([]); setEditingOrderId(null); setAdminView('orders'); fetchAllData(); });
      }
    } catch (error) { Swal.fire({title:'خطأ', text:'حدث خطأ بالخادم', icon:'error', position:'center'}); }
  };

  const handleImageUpload = (e, targetField) => {
    const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => { const img = new Image(); img.src = event.target.result; img.onload = () => { const cvs = document.createElement('canvas'); cvs.width = 500; cvs.height = img.height * (500 / img.width); const ctx = cvs.getContext('2d'); ctx.drawImage(img, 0, 0, cvs.width, cvs.height); const compressedImage = cvs.toDataURL('image/jpeg', 0.6); if (targetField === 'worker') setWorkerForm({ ...workerForm, image: compressedImage }); else setFormData({ ...formData, image: compressedImage }); }; };
  };

  const addToCart = (product, isClient = true) => {
    const targetCart = isClient ? cart : adminCart; const setTargetCart = isClient ? setCart : setAdminCart; const qtyToAdd = isClient ? (itemQtys[product.id] || 1) : 1;
    const existingIndex = targetCart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) { const newCart = [...targetCart]; newCart[existingIndex].qty += qtyToAdd; setTargetCart(newCart); } else { setTargetCart([...targetCart, { ...product, qty: qtyToAdd }]); }
    if (isClient) { Swal.fire({ toast: true, position: 'bottom-center', icon: 'success', title: 'تمت الإضافة للسلة 🛒', showConfirmButton: false, timer: 1500 }); setItemQtys(prev => ({ ...prev, [product.id]: 1 })); }
  };

  const handleCustomerSubmitOrder = async () => {
    if (!customerName || !customerPhone) return Swal.fire({title: 'تنبيه', text: 'الرجاء إدخال الاسم ورقم الجوال للتواصل', icon: 'warning', position: 'center'});
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    Swal.fire({ title: 'جاري إرسال الطلب...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const res = await fetch(`${API_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_name: customerName, customer_phone: `${customerPhone} | دفع: ${paymentMethod} | موقع: ${customerLocation}`, cart_data: cart, total: totalAmount }) });
      if (res.ok) {
        const orderId = 'TSH-' + Math.floor(1000 + Math.random() * 9000);
        Swal.fire({ title: '🎉 تم استلام طلبك بنجاح!', html: `رقم طلبك للمتابعة هو: <b style="color:var(--gold); font-size:1.5rem;">${orderId}</b><br><br>سنتواصل معك لتأكيد التوصيل. شكراً لثقتكم.`, icon: 'success', confirmButtonText: 'متابعة التسوق', position: 'center' });
        setCart([]); setCustomerName(''); setCustomerPhone(''); setCustomerLocation(''); setCheckoutStep(1); setShowCart(false); fetchAllData();
      }
    } catch (e) { Swal.fire({title:'خطأ', text:'تأكد من الاتصال بالإنترنت', icon:'error', position:'center'}); }
  };

  const handleRating = (type, name) => {
    Swal.fire({ title: `تقييم ${name}`, html: `<div style="font-size: 2.5rem; color: #f1c40f; cursor: pointer; display: flex; justify-content: center; gap: 10px;" id="star-container"><span class="star" data-val="1">☆</span><span class="star" data-val="2">☆</span><span class="star" data-val="3">☆</span><span class="star" data-val="4">☆</span><span class="star" data-val="5">☆</span></div><textarea id="rating-comment" placeholder="اكتب تجربتك هنا..." style="width: 90%; margin-top: 20px; padding: 15px; border-radius: 10px; border: 1px solid #ccc; font-family:inherit;"></textarea>`, didOpen: () => { const stars = document.querySelectorAll('.star'); let selectedValue = 0; stars.forEach(s => { s.addEventListener('click', (e) => { selectedValue = e.target.getAttribute('data-val'); stars.forEach(st => { st.innerHTML = st.getAttribute('data-val') <= selectedValue ? '⭐' : '☆'; }); }); }); }, showCancelButton: true, confirmButtonText: 'إرسال التقييم ✅', cancelButtonText: 'إلغاء' }).then((result) => { if (result.isConfirmed) { Swal.fire({title:'شكراً لك!', text:'تم استلام تقييمك بنجاح.', icon:'success', position:'center'}); } });
  };

  if (isAdminPanel) {
    if (!isAuthenticated) return ( <div className="login-screen"><div className="login-box glass-effect"><h1 className="gradient-text-large">إدارة {settings.shop_name || 'تشاطيب'}</h1><input className="login-input" type="text" placeholder="اسم المستخدم" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} /><input className="login-input" type="password" placeholder="الرمز السري" value={loginPin} onChange={e => setLoginPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}/><button onClick={handleLogin}>دخول آمن 🗝️</button><a href="/" className="login-back-link">العودة للمتجر 🏠</a></div></div> );
    const pendingOrders = orders.filter(o => o.status === 'معلق'); const completedOrders = orders.filter(o => o.status === 'مكتمل'); const mainCategoriesList = categories.filter(c => !c.parent); const totalProfits = products.reduce((sum, p) => sum + ((Number(p.sold) || 0) * Number(p.price)), 0);
    return (
      <div className="admin-root">
        <style>{`.pulsing-bell { animation: ring 2s infinite; display: inline-block; color: var(--red); font-size: 1.2rem; } .low-stock-dot { display: inline-block; width: 12px; height: 12px; background-color: var(--red); border-radius: 50%; animation: pulse 1s infinite; margin-right: 10px; } @keyframes ring { 0% { transform: rotate(0); } 10% { transform: rotate(15deg); } 20% { transform: rotate(-10deg); } 30% { transform: rotate(5deg); } 40% { transform: rotate(-5deg); } 50% { transform: rotate(0); } }`}</style>
        <aside className="sidebar-30"><div className="side-logo">⚙️ {settings.shop_name || 'الإدارة'}<div className="user-badge">👤 {currentUser.username}</div></div><nav className="side-nav"><button className={adminView === 'orders' ? 'active' : ''} onClick={() => setAdminView('orders')}>📥 الطلبات {pendingOrders.length > 0 && <span className="notification-badge"><span className="pulsing-bell">🔔</span> {pendingOrders.length}</span>}</button><button className={adminView === 'pos' ? 'active' : ''} onClick={() => { setAdminView('pos'); setEditingOrderId(null); setAdminCart([]); }}>🛒 الكاشير (POS)</button><button className={adminView === 'inventory' ? 'active' : ''} onClick={() => { setAdminView('inventory'); setInvMainCat(null); setInvSubCat(null); }}>📦 الجرد والمخزون</button><button className={adminView === 'categories' ? 'active' : ''} onClick={() => setAdminView('categories')}>🗂️ المنتجات والأقسام</button><button className={adminView === 'workers' ? 'active' : ''} onClick={() => setAdminView('workers')}>👷‍♂️ إدارة العمال</button>{isManager && (<><button className={adminView === 'reports' ? 'active' : ''} onClick={() => setAdminView('reports')}>📊 التقارير المالية</button><button className={adminView === 'users' ? 'active' : ''} onClick={() => setAdminView('users')}>👥 طاقم الموظفين</button><button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>⚙️ إعدادات المتجر</button></>)}<button className={adminView === 'profile' ? 'active' : ''} style={{marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)'}} onClick={() => setAdminView('profile')}>👤 حسابي</button></nav><div className="side-footer"><button className="logout-btn" onClick={() => { setIsAuthenticated(false); setCurrentUser(null); }}>خروج 🚪</button></div></aside>
        <main className="content-70">
          {isManager && adminView !== 'pos' && adminView !== 'orders' && (<div className="admin-top-dashboard"><div className="dash-card"><h4>المنتجات</h4><h2>{products.length}</h2></div><div className="dash-card"><h4>العمال</h4><h2>{workers.length}</h2></div><div className="dash-card highlight-card"><h4>الأرباح</h4><h2>{totalProfits} <span>ر.س</span></h2></div></div>)}
          {adminView === 'orders' && (<div className="fade-in"><div className="panel-card mb-20"><h2>📥 الطلبات المعلقة</h2><table className="pro-table"><thead><tr><th>رقم الطلب</th><th>العميل</th><th>الإجمالي</th><th>تحديث واتساب</th><th>إجراء</th></tr></thead><tbody>{pendingOrders.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>لا توجد طلبات معلقة</td></tr>}{pendingOrders.map(order => (<tr key={order.id}><td style={{color:'var(--gold)', fontWeight:'bold'}}>#{order.id} <br/><small>{new Date(order.created_at).toLocaleDateString('ar-SA')}</small></td><td>{order.customer_name} <br/><span style={{fontSize:'0.85rem', color:'#888'}}>{order.customer_phone}</span></td><td style={{color:'var(--green)', fontWeight:'bold'}}>{order.total} ر.س</td><td><button style={{background:'#f39c12', color:'#fff', border:'none', padding:'5px', borderRadius:'5px', cursor:'pointer', marginBottom:'5px', width:'100%'}} onClick={() => window.open(`https://wa.me/${order.customer_phone.split(' | ')[0]}?text=مرحباً ${order.customer_name}، جاري تجهيز طلبك 📦`)}>جاري التجهيز</button><button style={{background:'#27ae60', color:'#fff', border:'none', padding:'5px', borderRadius:'5px', cursor:'pointer', width:'100%'}} onClick={() => window.open(`https://wa.me/${order.customer_phone.split(' | ')[0]}?text=مرحباً ${order.customer_name}، طلبك في الطريق 🚚`)}>في الطريق</button></td><td><button className="add-btn" style={{marginRight:'5px', marginBottom:'5px'}} onClick={() => { setAdminCart(order.cart_data); setEditingOrderId(order.id); setAdminView('pos'); }}>مراجعة بالفاتورة</button><button className="del-btn-sq" onClick={async () => { if(window.confirm('إلغاء وحذف؟')){ await fetch(`${API_URL}/api/orders/${order.id}`, {method:'DELETE'}); fetchAllData(); }}}>إلغاء</button></td></tr>))}</tbody></table></div></div>)}
          {adminView === 'pos' && (<div className="pos-container fade-in"><div className="pos-products-section"><input type="text" className="pos-search" placeholder="🔍 ابحث للبيع (يدعم الباركود)..." value={posSearch} onChange={e => setPosSearch(e.target.value)}/><div className="pos-grid">{products.filter(p => !posSearch || p.name.includes(posSearch)).map(product => (<div key={product.id} className="pos-card" onClick={() => { if(product.stock > 0) addToCart(product, false); else Swal.fire({title:'نفدت الكمية',icon:'warning', position:'center'}); }}>{product.stock <= 0 && <div className="pos-out">نفدت</div>}<img src={product.image || 'https://via.placeholder.com/100'} alt=""/><h5 style={{height:'35px', overflow:'hidden'}}>{product.name}</h5><span className="pos-price" style={{color:'#e74c3c'}}>{product.price} ر.س</span><span className="pos-stock">المخزون: {product.stock}</span></div>))}</div></div><div className="pos-cart-section"><h3>{editingOrderId ? `تعديل طلب #${editingOrderId}` : `الكاشير`}</h3><div className="pos-cart-items">{adminCart.map((item, index) => (<div key={index} className="pos-cart-row"><div className="pos-cart-info"><b>{item.name}</b><span style={{color:'#e74c3c'}}>{item.price} ر.س</span></div><div className="pos-qty-controls"><button onClick={() => { const n = [...adminCart]; n[index].qty++; setAdminCart(n); }}>+</button><span>{item.qty}</span><button onClick={() => { const n = [...adminCart]; n[index].qty--; if(n[index].qty<=0) n.splice(index,1); setAdminCart(n); }}>-</button></div></div>))}{adminCart.length === 0 && <div className="pos-empty">السلة فارغة</div>}</div><div className="pos-checkout-area"><div className="pos-totals"><div className="p-row final"><span>المطلوب:</span><span style={{color:'#e74c3c'}}>{adminCart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س</span></div></div><button className="pos-checkout-btn" onClick={handleCheckoutPOS}>اعتماد وطباعة 🧾</button>{editingOrderId && <button className="del-btn-sq" style={{width:'100%', marginTop:'10px'}} onClick={() => { setEditingOrderId(null); setAdminCart([]); setAdminView('orders'); }}>العودة للطلبات</button>}</div></div></div>)}
          {adminView === 'inventory' && (<div className="fade-in">{!invMainCat ? (<div className="panel-card"><h2>📦 الجرد: اختر القسم الرئيسي</h2><div className="folders-grid">{mainCategoriesList.map(cat => (<div key={cat.id} className="folder-card main" onClick={() => setInvMainCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>) : !invSubCat ? (<div className="panel-card"><button className="back-btn" onClick={() => setInvMainCat(null)}>🔙 رجوع للأقسام الرئيسية</button><h2>📦 جرد ({invMainCat.name})</h2><div className="folders-grid">{categories.filter(c => c.parent === invMainCat.name).map(cat => (<div key={cat.id} className="folder-card sub" onClick={() => setInvSubCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>) : (<div className="panel-card"><button className="back-btn" onClick={() => setInvSubCat(null)}>🔙 رجوع</button><div className="path-header">مستودع ⬅️ {invMainCat.name} ⬅️ {invSubCat.name}</div><table className="pro-table"><thead><tr><th>المنتج</th><th>المخزون</th><th>المباع</th><th>تحديث يدوياً</th></tr></thead><tbody>{products.filter(p => p.category === invSubCat.name).map(product => (<tr key={product.id}><td>{product.name} {product.stock <= 5 && <span className="low-stock-dot" title="مخزون منخفض جداً"></span>}</td><td className="stk-td">{product.stock}</td><td className="sld-td">{product.sold || 0}</td><td className="act-td"><div className="bulk-action-wrapper"><input type="number" className="bulk-input" placeholder="الكمية..." value={invBulkInputs[product.id] || ''} onChange={(e) => setInvBulkInputs({...invBulkInputs, [product.id]: e.target.value})}/><div className="bulk-buttons"><button className="btn-plus-bulk" onClick={() => handleBulkInventoryUpdate(product, true)}>إضافة (+)</button><button className="btn-minus-bulk" onClick={() => handleBulkInventoryUpdate(product, false)}>خصم (-)</button></div></div></td></tr>))}</tbody></table></div>)}</div>)}
          {adminView === 'categories' && (<div className="fade-in">{!activeMainCat ? (<div className="panel-card"><h2>1. الأقسام الرئيسية</h2><div className="add-row mb-20"><input placeholder="اسم القسم الرئيسي..." value={newMainName} onChange={e => setNewMainName(e.target.value)}/><button className="add-btn" onClick={() => handleAddCategory(false)}>إضافة 📁</button></div><div className="folders-grid">{mainCategoriesList.map(c => (<div key={c.id} className="folder-card main" onClick={() => setActiveMainCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}>حذف</button></div>))}</div></div>) : !activeSubCat ? (<div className="panel-card"><button className="back-btn" onClick={() => setActiveMainCat(null)}>🔙 رجوع</button><h2>2. الأقسام الفرعية لـ ({activeMainCat.name})</h2><div className="add-row mb-20"><input placeholder="قسم فرعي جديد..." value={newSubName} onChange={e => setNewSubName(e.target.value)}/><button className="add-btn" onClick={() => handleAddCategory(true)}>إضافة 📂</button></div><div className="folders-grid">{categories.filter(c => c.parent === activeMainCat.name).map(c => (<div key={c.id} className="folder-card sub" onClick={() => setActiveSubCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}>حذف</button></div>))}</div></div>) : (<div className="panel-card"><button className="back-btn" onClick={() => { setActiveSubCat(null); setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: '', details: '', manufacturer: '', color: '', warranty: '', badge: '', image: '', is_sale: false, out_of_stock: false }); }}>🔙 رجوع</button><div className="path-header">{activeMainCat.name} ⬅️ {activeSubCat.name}</div><div className="product-entry-form"><div className="img-upload-box">{formData.image ? <img src={formData.image} alt="prod"/> : <div className="img-ph">صورة المنتج</div>}<label className="upload-label">رفع صورة 📸 <input type="file" onChange={(e) => handleImageUpload(e, 'product')} style={{display:'none'}}/></label></div><div className="data-entry-box"><input className="f-input full" placeholder="اسم المنتج..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/><div className="f-row"><input className="f-input" type="number" placeholder="السعر الجديد" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/><input className="f-input" type="number" placeholder="السعر القديم" value={formData.old_price} onChange={e => setFormData({...formData, old_price: e.target.value})}/><input className="f-input" type="number" placeholder="المخزون" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}/></div><div className="f-row mt-10"><input className="f-input" placeholder="اللون..." value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}/><input className="f-input" placeholder="الضمان (مثال: 10 سنوات)..." value={formData.warranty} onChange={e => setFormData({...formData, warranty: e.target.value})}/><select className="f-input" value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})}><option value="">بدون شارة</option><option value="best_seller">🏆 الأكثر مبيعاً</option><option value="new_arrival">✨ جديد</option><option value="high_quality">⭐ جودة عالية</option></select></div><input className="f-input full mt-10" placeholder="الشركة المصنعة..." value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})}/><textarea className="f-input full mt-10" rows="2" placeholder="مواصفات..." value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}></textarea><div className="f-toggles"><button className={`t-btn ${formData.is_sale ? 'active-green' : ''}`} onClick={() => setFormData({...formData, is_sale: !formData.is_sale})}>🔥 عرض خاص</button><button className={`t-btn ${formData.out_of_stock ? 'active-out' : ''}`} onClick={() => setFormData({...formData, out_of_stock: !formData.out_of_stock})}>🚫 نفدت الكمية</button><button className="save-btn" onClick={handleSaveProduct}>{editingItem ? 'تحديث المنتج 🔄' : 'حفظ بالمستودع ✅'}</button></div></div></div><div className="mini-products-list mt-30"><h3 style={{color:'var(--navy)'}}>المنتجات المسجلة:</h3>{products.filter(p => p.category === activeSubCat.name).map(product => { const parsed = parseProductDetails(product.details); return (<div key={product.id} className="m-prod-row" onClick={() => { setEditingItem(product); setFormData({ ...product, color: parsed.color||'', warranty: parsed.warranty||'', badge: parsed.badge||'', manufacturer: parsed.manufacturer||'', details: parsed.text||'' }); }}><img src={product.image || 'https://via.placeholder.com/50'} alt=""/><div style={{flex:1}}><b>{product.name}</b> <br/><small>{parsed.color && `لون: ${parsed.color} | `}{parsed.warranty && `ضمان: ${parsed.warranty}`}</small></div><span style={{color:'#e74c3c', fontWeight:'bold'}}>{product.price} ر.س</span><button className="del-btn-sq" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}>حذف ❌</button></div>) })}</div></div>)}</div>)}
          {adminView === 'workers' && (<div className="panel-card fade-in"><h2>👷‍♂️ إدارة العمال</h2><div className="product-entry-form" style={{flexDirection: 'column'}}><div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}><div className="worker-images-upload" style={{flex: '0 0 150px'}}><div className="img-upload-box mb-20">{workerForm.image ? <img src={workerForm.image} alt="worker"/> : <div className="img-ph">صورة (اختياري)</div>}<label className="upload-label">رفع صورة <input type="file" onChange={(e) => handleImageUpload(e, 'worker')} style={{display:'none'}}/></label></div></div><div className="data-entry-box" style={{flex: '1'}}><div className="f-row"><input className="f-input" placeholder="اسم العامل..." value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})}/><input className="f-input" placeholder="الجوال (واتساب)..." value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}/></div><div className="f-row"><select className="f-input" value={workerForm.region} onChange={e => setWorkerForm({...workerForm, region: e.target.value, city: ''})}><option value="">اختر المنطقة...</option>{Object.keys(SAUDI_REGIONS).map((r, i) => <option key={i} value={r}>{r}</option>)}</select><select className="f-input" value={workerForm.city} onChange={e => setWorkerForm({...workerForm, city: e.target.value})} disabled={!workerForm.region}><option value="">اختر المدينة...</option>{workerForm.region && SAUDI_REGIONS[workerForm.region].map((c, i) => <option key={i} value={c}>{c}</option>)}</select></div><input className="f-input" placeholder="المهنة..." value={workerForm.profession} onChange={e => setWorkerForm({...workerForm, profession: e.target.value})}/><textarea className="f-input" placeholder="نبذة..." value={workerForm.details} onChange={e => setWorkerForm({...workerForm, details: e.target.value})}></textarea><button className="save-btn" onClick={handleSaveWorker}>{editingWorker ? 'تحديث العامل 🔄' : 'إضافة عامل 👷‍♂️'}</button></div></div></div><div className="folders-grid mt-30">{workers.map(w => (<div key={w.id} className="worker-admin-card" onClick={() => {setEditingWorker(w); setWorkerForm(w);}}><img src={w.image || 'https://via.placeholder.com/60'} alt=""/><div className="w-info"><h4>{w.name}</h4><small>{w.profession} | {w.city}</small></div><button className="del-btn-sq" onClick={(e) => {e.stopPropagation(); handleDeleteWorker(w.id);}}>حذف</button></div>))}</div></div>)}
          {adminView === 'reports' && isManager && (<div className="panel-card fade-in"><h2>📊 التقارير المالية</h2><div className="reports-split-container">{mainCategoriesList.map(mainCat => { const subCatNames = categories.filter(c => c.parent === mainCat.name).map(x => x.name); const myProducts = products.filter(p => subCatNames.includes(p.category) && p.sold > 0); const sectionProfit = myProducts.reduce((sum, item) => sum + (Number(item.sold) * Number(item.price)), 0); if (myProducts.length === 0) return null; return (<div key={mainCat.id} className="report-main-section"><h3 className="r-header">{mainCat.name} | الأرباح: {sectionProfit} ر.س</h3><table className="pro-table"><thead><tr><th>المنتج</th><th>الفرعي</th><th>المباع</th><th>الأرباح</th></tr></thead><tbody>{myProducts.map(p => (<tr key={p.id}><td>{p.name}</td><td>{p.category}</td><td className="sld-td">{p.sold}</td><td className="profit-td" style={{color:'#e74c3c'}}>{p.sold * p.price} ر.س</td></tr>))}</tbody></table></div>) })}{products.filter(p => p.sold > 0).length === 0 && <div style={{textAlign:'center', padding:'30px', fontWeight:'bold', color:'var(--navy)'}}>لا توجد مبيعات.</div>}</div></div>)}
          {adminView === 'users' && isManager && (<div className="panel-card fade-in"><h2>👥 طاقم الإدارة</h2><div className="add-row mb-20" style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px'}}><input placeholder="الاسم..." value={newAdminForm.username} onChange={e => setNewAdminForm({...newAdminForm, username: e.target.value})}/><input placeholder="الرمز..." type="text" value={newAdminForm.pin} onChange={e => setNewAdminForm({...newAdminForm, pin: e.target.value})}/><select value={newAdminForm.role} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})} style={{padding:'12px', borderRadius:'8px'}}><option value="موظف">موظف</option><option value="مدير">مدير</option></select><button className="add-btn" onClick={handleSaveAdmin}>{editingAdmin ? 'تحديث 🔄' : 'إضافة ➕'}</button>{editingAdmin && <button className="del-btn-sq" onClick={() => {setEditingAdmin(null); setNewAdminForm({ username: '', pin: '', role: 'موظف' });}}>إلغاء</button>}</div><table className="pro-table"><thead><tr><th>الاسم</th><th>الصلاحية</th><th>إجراء</th></tr></thead><tbody>{admins.map(a => (<tr key={a.id}><td>{a.username} {a.id === currentUser.id ? '(أنت)' : ''}</td><td><span className="sc-badge">{a.role}</span></td><td><button className="add-btn" style={{marginRight:'5px', background:'#3498db'}} onClick={() => { setEditingAdmin(a); setNewAdminForm({ username: a.username, pin: a.pin, role: a.role }); }}>تعديل ✏️</button><button className="del-btn-sq" onClick={() => handleDeleteAdmin(a.id, a.role)}>حذف ❌</button></td></tr>))}</tbody></table></div>)}
          {adminView === 'settings' && isManager && (<div className="panel-card fade-in"><h2>⚙️ إعدادات المتجر</h2><div className="settings-grid"><div className="form-group"><label>اسم المتجر:</label><input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/></div><div className="form-group"><label>رقم واتساب:</label><input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/></div></div><button className="save-btn full-w-btn" onClick={handleSaveSettings}>حفظ التعديلات ✅</button></div>)}
          {adminView === 'profile' && (<div className="panel-card fade-in"><h2>👤 حسابي</h2><div className="settings-grid"><div className="form-group"><label>اسم المستخدم</label><input value={currentUser.username} disabled style={{background: '#eee'}} /></div><div className="form-group"><label>الرمز الجديد 🔒</label><input type="password" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} /></div></div><button className="save-btn full-w-btn" onClick={handleChangeMyPassword}>حفظ الرمز السري</button></div>)}
        </main>
      </div>
    );
  }

  // =========================================================================
  // 💻 5. واجهة العميل (Storefront) - الإصدار الفاخر V 5.2 (السلة العملاقة)
  // =========================================================================
  let processedProducts = products;
  if (searchQuery) { processedProducts = processedProducts.filter(p => p.name.includes(searchQuery) || (p.details && p.details.includes(searchQuery))); } 
  else if (clientSub) { processedProducts = processedProducts.filter(p => p.category === clientSub); } 
  else if (clientMain) { const subsOfMain = categories.filter(c => c.parent === clientMain).map(c => c.name); processedProducts = processedProducts.filter(p => subsOfMain.includes(p.category)); }
  if (sortType === 'price_asc') processedProducts.sort((a,b) => parseFloat(a.price) - parseFloat(b.price));
  if (sortType === 'price_desc') processedProducts.sort((a,b) => parseFloat(b.price) - parseFloat(a.price));
  if (sortType === 'offers') processedProducts = processedProducts.filter(p => p.is_sale);

  const visibleWorkers = workers.filter(w => (!harajRegion || w.region === harajRegion) && (!harajCity || w.city === harajCity));
  const mainCategoriesList = categories.filter(c => !c.parent);
  const cartTotalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - cartTotalAmount;
  const loyaltyPoints = Math.floor(cartTotalAmount / 100) * 5;

  return (
    <div className={`App client-theme ${showCart || selectedProduct || showWorkersHaraj ? 'no-scroll' : ''} ${darkMode ? 'dark-mode' : ''}`}>
      
      <style>{`
        .dark-mode { background-color: #121212 !important; color: #f1f1f1 !important; } .dark-mode .royal-header { background-color: #000 !important; border-bottom-color: var(--gold) !important; } .dark-mode .client-main-bar { background-color: #1a1a1a !important; } .dark-mode .client-sub-bar { background-color: #222 !important; border-bottom: 1px solid #333 !important; } .dark-mode .client-sub-bar button { color: #ccc; border-color: #555; } .dark-mode .client-sub-bar button.active { background-color: var(--gold); color: #000; } .dark-mode .royal-p-card { background-color: #1e1e1e !important; border-color: #333 !important; box-shadow: none; } .dark-mode .p-info-box h4 { color: #f1f1f1 !important; } .dark-mode .p-img-box { background-color: #fff; } 
        .blend-image { mix-blend-mode: multiply; object-fit: contain; width: 100%; height: 100%; padding: 0 !important; transform: scale(1.1); } .dark-mode .blend-image { mix-blend-mode: normal; transform: scale(1); } 
        .fire-anim { display: inline-block; animation: flame 0.8s infinite alternate; font-size: 1.5rem; margin-left: 5px; } @keyframes flame { 0% { transform: scale(1) rotate(-5deg); opacity: 0.8; text-shadow: 0 0 5px orange; } 100% { transform: scale(1.2) rotate(5deg); opacity: 1; text-shadow: 0 0 15px red; } }
        .trust-badge-card { position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.8); color: var(--gold); padding: 5px 12px; border-radius: 8px; font-size: 0.9rem; font-weight: bold; z-index: 10; border: 1px solid var(--gold); }
        .rating-stars { color: #f1c40f; font-size: 1.3rem; margin-top: 5px; cursor: pointer; }
        .marquee-container { background: #000; color: var(--gold); padding: 10px; font-weight: bold; font-size: 1rem; overflow: hidden; white-space: nowrap; border-top: 3px solid var(--gold); }
        .marquee-content { display: inline-block; animation: marquee 20s linear infinite; } @keyframes marquee { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        
        /* تصميم الشريط العلوي الجديد */
        .royal-header { display: flex; flex-direction: column; padding: 25px 30px !important; gap: 20px; }
        .header-row-1 { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .header-row-2 { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 15px; width: 100%; }
        .header-row-2 .open-cart-large { font-size: 1.15rem !important; padding: 12px 25px !important; border-radius: 30px !important; flex: 1; }
        
        /* 🛒 السلة العملاقة Mega Cart Button */
        .mega-cart-btn { background: #ffffff; color: var(--navy); border: 4px solid var(--navy); font-weight: 900; font-size: 2.2rem !important; padding: 15px 40px !important; border-radius: 40px !important; box-shadow: 0 10px 25px rgba(0,0,0,0.2); transition: all 0.3s ease; flex: 2; min-width: 60%; display: flex; justify-content: center; align-items: center; cursor: pointer; }
        .mega-cart-btn:hover { transform: scale(1.03); }
        .mega-cart-badge { background: #e74c3c; color: #fff; padding: 5px 20px; border-radius: 20px; margin-left: 15px; font-weight: 900; font-size: 1.8rem; display: inline-block; animation: pulse 2s infinite; }
        
        /* تعديلات السعر الأحمر الضخم */
        .now-price { font-size: 2.2rem !important; font-weight: 900 !important; color: #e74c3c !important; }
        .dark-mode .now-price, .dark-mode .m-now { color: #ff6b6b !important; }
        
        /* ثورة عرض المنتجات (Full Screen) */
        .p-grid-royal { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 30px; padding: 20px; }
        .royal-p-card { display: flex; flex-direction: column; border-radius: 25px; overflow: hidden; transition: 0.3s; }
        .p-img-box { height: 350px !important; }
        .p-info-box { padding: 25px !important; }
        .p-info-box h4 { font-size: 1.6rem !important; }
        .add-btn-p { font-size: 1.3rem !important; padding: 15px 30px !important; border-radius: 15px !important; }
        
        @media (max-width: 768px) {
          .royal-header { padding: 15px !important; gap: 15px; }
          .header-row-1 { flex-direction: column; gap: 15px; }
          .search-bar-wrapper { width: 100%; margin: 0 !important; }
          .search-bar-wrapper input { padding: 15px !important; font-size: 1.2rem !important; }
          .header-row-2 { flex-direction: column; }
          .header-row-2 .open-cart-large { width: 100%; font-size: 1.1rem !important; padding: 12px !important; }
          
          /* السلة العملاقة في الموبايل */
          .mega-cart-btn { width: 100%; font-size: 1.8rem !important; padding: 15px 20px !important; }
          .mega-cart-badge { font-size: 1.5rem; padding: 5px 15px; }
          
          .p-grid-royal { grid-template-columns: 1fr !important; padding: 15px; gap: 25px; }
          .p-img-box { height: 300px !important; }
          
          /* Bottom Sheets */
          .cart-overlay { align-items: flex-end !important; padding: 0 !important; }
          .cart-inner-container-large, .product-modal-content { width: 100% !important; margin: 0 !important; border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important; max-height: 90vh !important; padding: 20px !important; display: flex; flex-direction: column; overflow: hidden; }
          .modal-body-split { flex-direction: column !important; overflow-y: auto !important; padding-bottom: 80px !important; gap: 0 !important; }
          .m-img-side { height: 250px !important; margin-bottom: 15px !important; }
          .m-details-side { padding: 0 !important; }
          .m-now { font-size: 2.8rem !important; font-weight: bold !important; color: #e74c3c !important; }
          .sticky-mobile-buy { position: fixed; bottom: 0; left: 0; right: 0; background: var(--navy); padding: 15px 20px; z-index: 1000; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 -5px 15px rgba(0,0,0,0.3); border-top-left-radius: 20px; border-top-right-radius: 20px; }
        }
      `}</style>

      {/* الشريط العلوي مع السلة العملاقة */}
      <header className="royal-header" style={{boxShadow: '0 5px 20px rgba(0,0,0,0.15)'}}>
         <div className="header-row-1">
             <div className="logo-box" style={{fontSize: '2rem'}}>💧 <span>مَتجر</span> {settings.shop_name || 'تشاطيب'} ⚡</div>
             <div className="search-bar-wrapper" style={{flex:1, margin:'0 40px'}}><input placeholder="🔍 ابحث عن منتج، ماركة، أو مواصفات..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{borderRadius:'30px', padding:'15px 25px', width:'100%', fontSize:'1.2rem', border:'2px solid var(--gold)'}} /></div>
             <button onClick={() => setDarkMode(!darkMode)} style={{background:'transparent', border:'none', fontSize:'2.2rem', cursor:'pointer'}}>{darkMode ? '☀️' : '🌙'}</button>
         </div>
         <div className="header-row-2">
             <button className="open-cart-large" onClick={() => handleRating('store', settings.shop_name || 'المتجر')} style={{border:'2px solid var(--gold)', color:'var(--gold)', background:'transparent', fontWeight:'bold'}}>⭐ قيمنا</button>
             <button className="open-cart-large" onClick={() => setShowWorkersHaraj(true)} style={{border:'2px solid var(--navy)', color:'var(--navy)', background:'white', fontWeight:'bold'}}>👷‍♂️ العمال</button>
             {/* 🛒 زر السلة العملاق */}
             <button className="mega-cart-btn" onClick={() => {setShowCart(true); setCheckoutStep(1);}}>
                🛒 السلة <span className="mega-cart-badge">{cart.length}</span>
             </button>
         </div>
      </header>
      
      {!searchQuery && (
        <>
          <div className="client-main-bar" style={{padding:'15px'}}><button className={!clientMain ? 'active' : ''} onClick={() => {setClientMain(''); setClientSub('');}} style={{fontSize:'1.1rem', padding:'10px 20px'}}>الكل</button>{mainCategoriesList.map(cat => (<button key={cat.id} className={clientMain === cat.name ? 'active' : ''} onClick={() => { setClientMain(cat.name); const sub = categories.filter(x => x.parent === cat.name); if(sub.length > 0) setClientSub(sub[0].name); else setClientSub(''); }} style={{fontSize:'1.1rem', padding:'10px 20px'}}>{cat.name}</button>))}</div>
          {clientMain && categories.filter(c => c.parent === clientMain).length > 0 && (<div className="client-sub-bar" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 20px'}}><div style={{display:'flex', gap:'15px', overflowX:'auto', flex:1}}>{categories.filter(c => c.parent === clientMain).map(subCat => (<button key={subCat.id} className={clientSub === subCat.name ? 'active' : ''} onClick={() => setClientSub(subCat.name)} style={{fontSize:'1.1rem'}}>{subCat.name}</button>))}</div><select style={{padding:'8px 15px', borderRadius:'15px', border:'2px solid var(--gold)', background:'transparent', color:'var(--navy)', fontWeight:'bold', fontSize:'1.1rem'}} value={sortType} onChange={e => setSortType(e.target.value)}><option value="default">الترتيب الافتراضي 🔃</option><option value="price_asc">الأقل سعراً ⬇️</option><option value="price_desc">الأعلى سعراً ⬆️</option><option value="offers">العروض الخاصة 🔥</option></select></div>)}
        </>
      )}
      
      <div className="gallery-container" style={{paddingBottom: '80px', backgroundColor: darkMode ? '#121212' : '#f0f2f5'}}>
        {processedProducts.length === 0 ? (<div className="empty-state"><h3 style={{color: darkMode?'#fff':'#333', fontSize:'1.5rem'}}>لا توجد منتجات هنا.</h3></div>) : (
          <div className="p-grid-royal">
            {processedProducts.map(product => {
              const parsedInfo = parseProductDetails(product.details);
              return (
              <div key={product.id} className="royal-p-card" onClick={() => setSelectedProduct(product)}>
                {product.is_sale && <div className="discount-badge" style={{display:'flex', alignItems:'center', fontSize:'1.1rem', padding:'8px 15px', borderRadius:'15px'}}>ينتهي خلال {formatTime(timeLeft)} <span className="fire-anim">🔥</span></div>}
                {parsedInfo.badge === 'best_seller' && <div className="trust-badge-card">🏆 الأكثر مبيعاً</div>}{parsedInfo.badge === 'new_arrival' && <div className="trust-badge-card">✨ جديد</div>}{parsedInfo.badge === 'high_quality' && <div className="trust-badge-card">⭐ جودة عالية</div>}
                {product.out_of_stock && <div className="sold-tag" style={{fontSize:'1.2rem', padding:'10px 20px'}}>نفدت الكمية 🚫</div>}
                <div className="p-img-box" style={{padding:0, backgroundColor: darkMode?'#fff':'transparent'}}><img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} className="blend-image"/></div>
                <div className="p-info-box">
                  <h4 style={{marginBottom:'10px'}}>{product.name}</h4>
                  <div style={{fontSize:'1rem', color:'#888', marginBottom:'10px', minHeight:'20px'}}>{parsedInfo.color && <span style={{display:'inline-block', border:'1px solid #ddd', padding:'4px 8px', borderRadius:'8px', marginRight:'8px'}}>اللون: <b style={{color: darkMode?'#fff':'#000'}}>{parsedInfo.color}</b></span>}{parsedInfo.warranty && <span style={{display:'inline-block', border:'1px solid #ddd', padding:'4px 8px', borderRadius:'8px'}}>ضمان <b style={{color: darkMode?'#fff':'#000'}}>{parsedInfo.warranty}</b></span>}</div>
                  <div className="rating-stars" onClick={(e) => { e.stopPropagation(); handleRating('product', product.name); }}>⭐⭐⭐⭐⭐</div>
                  <div className="price-area" style={{marginTop:'15px', display:'flex', alignItems:'center'}}>
                     <span className="now-price" style={{color: '#e74c3c'}}>{product.price} ر.س</span>
                     {product.is_sale && <span className="fire-anim">🔥</span>}
                     {product.old_price > 0 && <span className="old-price" style={{marginLeft:'15px', fontSize:'1.2rem'}}>{product.old_price} ر.س</span>}
                  </div>
                  <div className="action-area" style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'15px', marginTop:'20px'}}>
                    {!product.out_of_stock && (<div className="qty-controls" onClick={e => e.stopPropagation()} style={{padding:'10px', borderRadius:'15px'}}><button onClick={() => handleProductQuantityChange(product.id, 1)} style={{fontSize:'1.5rem'}}>+</button><span style={{fontWeight:'bold', fontSize:'1.4rem', margin:'0 15px'}}>{itemQtys[product.id] || 1}</span><button onClick={() => handleProductQuantityChange(product.id, -1)} style={{fontSize:'1.5rem'}}>-</button></div>)}
                    <button className={`add-btn-p ${product.out_of_stock ? 'disabled' : ''}`} disabled={product.out_of_stock} onClick={(e) => { e.stopPropagation(); if (!product.out_of_stock) addToCart(product); }} style={{flex:1}}>{product.out_of_stock ? 'نفدت' : 'أضف للسلة 🛒'}</button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      <div className="marquee-container" style={{position:'fixed', bottom:0, width:'100%', zIndex:998}}>
         <div className="marquee-content">⭐⭐⭐⭐⭐ مقاول الرياض: جودة ممتازة وسرعة في التوصيل &nbsp;&nbsp;&nbsp;&nbsp; ⭐⭐⭐⭐⭐ أبو فهد: أسعار منافسة للأفياش والمفاتيح &nbsp;&nbsp;&nbsp;&nbsp; ⭐⭐⭐⭐⭐ المهندس علي: تعامل راقي وأنصح بهم لمشاريع التشطيب.</div>
      </div>
      <button className="floating-wa-btn" style={{bottom:'60px', width:'70px', height:'70px', fontSize:'2rem'}} onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>

      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content fade-in-up" onClick={e => e.stopPropagation()} style={{backgroundColor: darkMode ? '#1e1e1e':'#fff', color: darkMode?'#fff':'#000'}}>
            <button className="modal-close-x" onClick={() => setSelectedProduct(null)} style={{zIndex:100, fontSize:'1.5rem', width:'40px', height:'40px'}}>✕</button>
            <div className="modal-body-split">
              <div className="m-img-side" style={{backgroundColor: darkMode?'#fff':'#fdfdfd'}}>{selectedProduct.is_sale && <div className="m-discount">ينتهي {formatTime(timeLeft)} <span className="fire-anim">🔥</span></div>}<img src={selectedProduct.image || 'https://via.placeholder.com/300'} alt="" className="blend-image" /></div>
              <div className="m-details-side">
                <h2 style={{color: darkMode?'var(--gold)':'var(--navy)', margin:'10px 0', fontSize:'2rem'}}>{selectedProduct.name}</h2>
                <div className="rating-stars" onClick={() => handleRating('product', selectedProduct.name)} style={{fontSize:'1.5rem'}}>⭐⭐⭐⭐⭐ <span style={{fontSize:'1rem', color:'#888', textDecoration:'underline'}}>(أضف تقييمك)</span></div>
                <div className="m-price-box" style={{marginTop:'15px', marginBottom:'20px'}}><span className="m-now" style={{fontSize:'2.5rem', color:'#e74c3c'}}>{selectedProduct.price} ر.س</span>{selectedProduct.old_price > 0 && <span className="m-old" style={{fontSize:'1.5rem'}}>{selectedProduct.old_price} ر.س</span>}</div>
                <div style={{display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap'}}>{parseProductDetails(selectedProduct.details).warranty && <span style={{background:'rgba(52, 152, 219, 0.1)', color:'#3498db', padding:'5px 12px', borderRadius:'10px', fontWeight:'bold', fontSize:'1.1rem'}}>🛡️ ضمان {parseProductDetails(selectedProduct.details).warranty}</span>}{parseProductDetails(selectedProduct.details).color && <span style={{background:'rgba(155, 89, 182, 0.1)', color:'#9b59b6', padding:'5px 12px', borderRadius:'10px', fontWeight:'bold', fontSize:'1.1rem'}}>🎨 اللون: {parseProductDetails(selectedProduct.details).color}</span>}{parseProductDetails(selectedProduct.details).manufacturer && <span style={{background:'rgba(46, 204, 113, 0.1)', color:'#27ae60', padding:'5px 12px', borderRadius:'10px', fontWeight:'bold', fontSize:'1.1rem'}}>🏭 {parseProductDetails(selectedProduct.details).manufacturer}</span>}</div>
                <div className="m-desc-box" style={{marginBottom:'0'}}><h3 style={{color: darkMode?'#ddd':'var(--navy)', margin:'10px 0', fontSize:'1.3rem'}}>المواصفات:</h3><div className="m-desc" style={{backgroundColor: darkMode?'#333':'#f9f9f9', color: darkMode?'#fff':'#555', padding:'15px', fontSize:'1.1rem', borderRadius:'15px', lineHeight:'1.8'}}>{parseProductDetails(selectedProduct.details).text || 'لا يوجد تفاصيل.'}</div></div>
                <button style={{background:'transparent', color:'var(--navy)', border:'2px solid var(--navy)', padding:'12px', borderRadius:'15px', fontWeight:'bold', marginTop:'20px', cursor:'pointer', display:'block', width:'100%', fontSize:'1.2rem'}} onClick={() => window.open(`https://wa.me/?text=مرحباً، وش رأيك في هذا المنتج: ${selectedProduct.name} بسعر ${selectedProduct.price} ريال من متجر ${settings.shop_name}؟`)}>مشاركة للاستشارة 📤</button>
              </div>
            </div>
            <div className="sticky-mobile-buy hide-desktop">
              <div className="qty-controls" style={{background:'rgba(255,255,255,0.1)', color:'#fff', padding:'8px 15px', borderRadius:'15px'}}><button onClick={() => handleProductQuantityChange(selectedProduct.id, 1)} style={{color:'#fff', fontSize:'1.8rem'}}>+</button><span style={{fontSize:'1.5rem', fontWeight:'bold', margin:'0 15px', color:'#fff'}}>{itemQtys[selectedProduct.id] || 1}</span><button onClick={() => handleProductQuantityChange(selectedProduct.id, -1)} style={{color:'#fff', fontSize:'1.8rem'}}>-</button></div>
              {!selectedProduct.out_of_stock ? (<button style={{background:'var(--gold)', color:'#000', border:'none', padding:'15px 30px', borderRadius:'15px', fontWeight:'bold', fontSize:'1.4rem'}} onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>أضف للسلة 🛒</button>) : (<button style={{background:'#555', color:'#fff', border:'none', padding:'15px', borderRadius:'15px'}} disabled>نفدت</button>)}
            </div>
          </div>
        </div>
      )}

      {showWorkersHaraj && (
        <div className="cart-overlay open" style={{background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)'}}>
          <div className="cart-inner-container-large fade-in-up" style={{maxWidth:'900px', backgroundColor: darkMode ? '#1e1e1e':'#fff'}}>
             <div className="cart-header-fixed" style={{padding:'20px'}}><h2>👷‍♂️ حراج العمال والصيانة</h2><button className="close-btn-x" onClick={() => setShowWorkersHaraj(false)} style={{width:'40px', height:'40px', fontSize:'1.5rem'}}>✕</button></div>
             <div className="workers-filters" style={{padding:'20px', background: darkMode?'#222':'#f8f9fa', borderBottom:'1px solid #eee', display:'flex', gap:'15px', flexWrap:'wrap'}}><select value={harajRegion} onChange={e => {setHarajRegion(e.target.value); setHarajCity('');}} style={{flex:1, padding:'15px', borderRadius:'15px', border:'2px solid var(--gold)', fontSize:'1.1rem'}}><option value="">🔍 كل مناطق المملكة</option>{Object.keys(SAUDI_REGIONS).map((r, i) => <option key={i} value={r}>{r}</option>)}</select><select value={harajCity} onChange={e => setHarajCity(e.target.value)} style={{flex:1, padding:'15px', borderRadius:'15px', border:'2px solid var(--gold)', fontSize:'1.1rem'}} disabled={!harajRegion}><option value="">🏙️ المحافظات</option>{harajRegion && SAUDI_REGIONS[harajRegion].map((c, i) => <option key={i} value={c}>{c}</option>)}</select></div>
             <div className="cart-products-scroll" style={{background: darkMode?'#121212':'#fdfdfd', padding:'20px'}}>
                 {visibleWorkers.length === 0 ? (<div className="empty-state"><h3 style={{color:darkMode?'#fff':'#333', fontSize:'1.5rem'}}>لا يوجد عمال متاحين.</h3></div>) : (
                    <div className="workers-public-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'25px'}}>
                        {visibleWorkers.map(worker => (
                            <div key={worker.id} className="worker-public-card" style={{background: darkMode?'#222':'white', borderRadius:'20px', border: darkMode?'1px solid #444':'1px solid #eee', overflow:'hidden', boxShadow:'0 5px 15px rgba(0,0,0,0.08)', textAlign:'center', paddingBottom:'20px'}}>
                                <div style={{height:'100px', background:'var(--navy)', position:'relative'}}><div style={{width:'90px', height:'90px', borderRadius:'50%', border:'4px solid var(--gold)', overflow:'hidden', margin:'0 auto', position:'relative', top:'50px', background:'#fff'}}><img src={worker.image || 'https://via.placeholder.com/80'} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/></div></div>
                                <div style={{marginTop:'55px', padding:'0 20px', color: darkMode?'#fff':'#000'}}>
                                    <h3 style={{margin:'0 0 10px 0', fontSize:'1.4rem'}}>{worker.name}</h3><span style={{background: darkMode?'#444':'#eee', padding:'5px 15px', borderRadius:'20px', fontSize:'1rem', fontWeight:'bold'}}>{worker.profession}</span>
                                    <div className="rating-stars" onClick={() => handleRating('worker', worker.name)} style={{marginTop:'15px', fontSize:'1.3rem'}}>⭐⭐⭐⭐⭐ <span style={{fontSize:'0.9rem', color:'#888'}}>(قيّم)</span></div>
                                    <div style={{margin:'10px 0', fontSize:'1.1rem', color: darkMode?'#aaa':'#777'}}>📍 {worker.region} - {worker.city}</div><p style={{fontSize:'1rem', minHeight:'50px', margin:'10px 0', lineHeight:'1.6'}}>{worker.details}</p>
                                    <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                                      <button onClick={() => window.open(`https://wa.me/${worker.phone}?text=مرحباً، رأيت إعلانك وأريد الاستفسار`)} style={{background:'#25d366', color:'white', border:'none', padding:'12px', borderRadius:'15px', fontWeight:'bold', cursor:'pointer', flex:1, fontSize:'1.1rem'}}>واتساب 💬</button>
                                      <button style={{background:'transparent', color:'var(--navy)', border:'1px solid var(--navy)', padding:'12px', borderRadius:'15px', fontWeight:'bold', cursor:'pointer', flex:1, fontSize:'1.1rem'}}>معرض أعمالي 📸</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
             </div>
          </div>
        </div>
      )}

      {/* 🛒 السلة ذات المرحلتين */}
      {showCart && (
        <div className="cart-overlay open">
          <div className="cart-inner-container-large fade-in-up" style={{backgroundColor: darkMode?'#1e1e1e':'#fff', color: darkMode?'#fff':'#000'}}>
            <div className="cart-header-fixed" style={{padding:'20px'}}>
              <h2 style={{margin:0, fontSize:'1.8rem'}}>{checkoutStep === 1 ? 'سلة المشتريات 🛒' : 'إتمام الطلب 💳'}</h2>
              <button className="close-btn-x" onClick={() => {setShowCart(false); setCheckoutStep(1);}} style={{width:'40px', height:'40px', fontSize:'1.5rem'}}>✕</button>
            </div>
            
            {checkoutStep === 1 ? (
              <>
                {cartTotalAmount > 0 && remainingForFreeShipping > 0 && (<div style={{background:'#fff3cd', color:'#856404', padding:'15px', textAlign:'center', fontWeight:'bold', fontSize:'1.1rem'}}>أضف منتجات بقيمة {remainingForFreeShipping} ر.س لتوصيل مجاني! 🚚</div>)}
                {cartTotalAmount > 0 && remainingForFreeShipping <= 0 && (<div style={{background:'#d4edda', color:'#155724', padding:'15px', textAlign:'center', fontWeight:'bold', fontSize:'1.1rem'}}>حصلت على توصيل مجاني 🚚✨</div>)}
                {cartTotalAmount > 0 && (<div style={{background: darkMode?'#333':'#e8f4f8', color: darkMode?'var(--gold)':'var(--navy)', padding:'10px', textAlign:'center', fontWeight:'bold', fontSize:'1rem'}}>🎁 ستكسب {loyaltyPoints} نقطة ولاء!</div>)}

                <div className="cart-products-scroll" style={{backgroundColor: darkMode?'#121212':'#fdfdfd', padding:'20px'}}>
                  {cart.length === 0 && <div className="empty-cart-msg" style={{fontSize:'1.5rem'}}>سلتك فارغة.</div>}
                  {cart.map((item, index) => (
                    <div key={index} className="cart-product-row" style={{backgroundColor: darkMode?'#222':'#fff', borderColor: darkMode?'#444':'#eee', padding:'15px', marginBottom:'15px', borderRadius:'15px'}}>
                      <img src={item.image || 'https://via.placeholder.com/80'} alt="" className="cart-p-img blend-image" style={{backgroundColor:'#fff', width:'80px', height:'80px'}} />
                      <div className="cart-p-details" style={{paddingRight:'15px'}}>
                        <div className="cart-p-title" style={{color: darkMode?'#fff':'var(--navy)', fontSize:'1.2rem', marginBottom:'10px'}}>{item.name}</div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <div className="qty-controls-mini" style={{transform:'scale(1.1)'}}><button onClick={() => { const n = [...cart]; n[index].qty++; setCart(n); }}>+</button><span>{item.qty}</span><button onClick={() => { const n = [...cart]; n[index].qty--; if(n[index].qty<=0) n.splice(index,1); setCart(n); }}>-</button></div>
                          <span className="cart-item-total" style={{fontSize:'1.3rem', fontWeight:'bold', color:'#e74c3c'}}>{item.price * item.qty} ر.س</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && (
                  <div className="cart-floating-action" style={{backgroundColor: darkMode?'#1a1a1a':'#fff', borderColor: darkMode?'#333':'#eee', padding:'20px'}}>
                    <div className="total-gold-box" style={{color: darkMode?'#fff':'var(--navy)', fontSize:'1.5rem', marginBottom:'15px'}}>الإجمالي: <span style={{color:'#e74c3c'}}>{cartTotalAmount} ر.س</span></div>
                    <button className="btn-wa-confirm-giant" style={{background:'var(--navy)', padding:'15px', fontSize:'1.3rem', borderRadius:'15px'}} onClick={() => setCheckoutStep(2)}>متابعة لإتمام الطلب 💳</button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="cart-products-scroll" style={{backgroundColor: darkMode?'#121212':'#fdfdfd', padding:'25px'}}>
                   <button style={{background:'transparent', color:'var(--navy)', border:'2px solid var(--navy)', padding:'10px 20px', borderRadius:'15px', fontWeight:'bold', cursor:'pointer', marginBottom:'25px', fontSize:'1.1rem'}} onClick={() => setCheckoutStep(1)}>🔙 العودة للسلة</button>
                   <div className="customer-info-box" style={{backgroundColor: darkMode?'#2a2a2a':'#e8f4f8', borderColor: darkMode?'#555':'#3498db', marginTop:0, padding:'25px', borderRadius:'20px'}}>
                     <h3 style={{marginTop:0, color: darkMode?'var(--gold)':'var(--navy)', fontSize:'1.4rem', marginBottom:'20px'}}>📍 بيانات التوصيل والدفع:</h3>
                     <input className="c-input" type="text" placeholder="الاسم الثلاثي (إجباري)" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{backgroundColor: darkMode?'#444':'#fff', color: darkMode?'#fff':'#000', padding:'15px', marginBottom:'15px', fontSize:'1.1rem', borderRadius:'10px'}} />
                     <input className="c-input" type="tel" placeholder="رقم الجوال (إجباري)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{backgroundColor: darkMode?'#444':'#fff', color: darkMode?'#fff':'#000', padding:'15px', marginBottom:'15px', fontSize:'1.1rem', borderRadius:'10px'}} />
                     <input className="c-input" type="text" placeholder="رابط موقع التوصيل Google Maps (اختياري)" value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} style={{backgroundColor: darkMode?'#444':'#fff', color: darkMode?'#fff':'#000', padding:'15px', marginBottom:'15px', fontSize:'1.1rem', borderRadius:'10px'}} />
                     <h4 style={{color: darkMode?'#ddd':'#555', margin:'20px 0 10px 0', fontSize:'1.2rem'}}>طريقة الدفع المفضلة:</h4>
                     <select className="c-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{backgroundColor: darkMode?'#444':'#fff', color: darkMode?'#fff':'#000', padding:'15px', fontSize:'1.1rem', borderRadius:'10px'}}>
                       <option value="cash">💵 الدفع عند الاستلام</option>
                       <option value="bank">🏦 تحويل بنكي</option>
                     </select>
                   </div>
                </div>
                <div className="cart-floating-action" style={{backgroundColor: darkMode?'#1a1a1a':'#fff', borderColor: darkMode?'#333':'#eee', padding:'20px'}}>
                  <div className="total-gold-box" style={{color: darkMode?'#fff':'var(--navy)', fontSize:'1.5rem', marginBottom:'15px'}}>المطلوب دفعه: <span style={{color:'#e74c3c'}}>{cartTotalAmount} ر.س</span></div>
                  <button className="btn-wa-confirm-giant" style={{padding:'15px', fontSize:'1.3rem', borderRadius:'15px'}} onClick={handleCustomerSubmitOrder}>تأكيد وإرسال الطلب ✅</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;