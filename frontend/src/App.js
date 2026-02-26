/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com';

// 🗺️ قاعدة بيانات مناطق ومحافظات المملكة العربية السعودية
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
  const [posSearch, setPosSearch] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);

  // النماذج (Forms) مع الحقول الجديدة (الضمان، اللون، الشارة)
  const [formData, setFormData] = useState({ 
    name: '', price: '', old_price: '', stock: '', 
    details: '', manufacturer: '', image: '', is_sale: false, out_of_stock: false,
    color: '', warranty: '', badge: '' 
  });
  const [editingItem, setEditingItem] = useState(null);
  
  const [workerForm, setWorkerForm] = useState({ 
    name: '', phone: '', details: '', image: '', region: '', city: '', profession: '' 
  });
  const [editingWorker, setEditingWorker] = useState(null);
  
  const [newAdminForm, setNewAdminForm] = useState({ username: '', pin: '', role: 'موظف' });
  const [editingAdmin, setEditingAdmin] = useState(null);

  // واجهة العميل (Storefront) والوضع الليلي
  const [darkMode, setDarkMode] = useState(false);
  const [sortType, setSortType] = useState('default');
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
  const FREE_SHIPPING_THRESHOLD = 500; // شحن مجاني للمشتريات فوق 500 ريال

  // ==========================================
  // 2. محرك جلب البيانات من السيرفر
  // ==========================================
  useEffect(() => { fetchAllData(); }, []); 

  const fetchAllData = async () => {
    try {
      const [pRes, cRes, wRes, sRes, aRes, oRes] = await Promise.all([
        fetch(`${API_URL}/api/products`), fetch(`${API_URL}/api/categories`), 
        fetch(`${API_URL}/api/workers`), fetch(`${API_URL}/api/settings`), 
        fetch(`${API_URL}/api/admins`), fetch(`${API_URL}/api/orders`)
      ]);
      
      const pData = await pRes.json();
      const cData = await cRes.json();
      const wData = await wRes.json();
      const sData = await sRes.json();
      const aData = await aRes.json();
      const oData = await oRes.json();

      setProducts(pData); setCategories(cData); setWorkers(wData); 
      setSettings(sData); setAdmins(aData); setOrders(oData);
      
      const mainCategories = cData.filter(c => !c.parent);
      if (!isAdminPanel && mainCategories.length > 0 && !clientMain) {
         setClientMain(mainCategories[0].name);
         const subCategories = cData.filter(c => c.parent === mainCategories[0].name);
         if (subCategories.length > 0) setClientSub(subCategories[0].name);
      }
    } catch (error) { console.error("Database connection error", error); }
  };

  // دالة ذكية لتحليل تفاصيل المنتج (JSON Parsing)
  const parseProductDetails = (detailsString) => {
    try {
      return JSON.parse(detailsString);
    } catch (e) {
      return { text: detailsString, color: '', warranty: '', badge: '', manufacturer: '' };
    }
  };

  // ==========================================
  // 3. دوال العمليات الحيوية (المصححة)
  // ==========================================

  const handleLogin = async () => {
    if (!loginUsername || !loginPin) return Swal.fire('تنبيه', 'يرجى إدخال اسم المستخدم والرمز السري', 'warning');
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), pin: loginPin })
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user); setIsAuthenticated(true);
        setAdminView('orders'); Swal.fire({toast:true, position:'top-end', icon:'success', title:'تم الدخول', showConfirmButton:false, timer:1500});
      } else { Swal.fire('خطأ', 'بيانات الدخول غير صحيحة', 'error'); }
    } catch (error) { Swal.fire('خطأ', 'مشكلة في الاتصال بالسيرفر', 'error'); }
  };

  const handleChangeMyPassword = async () => {
    if (!newPasswordInput) return Swal.fire('تنبيه', 'يرجى إدخال الرمز الجديد', 'warning');
    try {
      const res = await fetch(`${API_URL}/api/admins/${currentUser.id}/pin`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPin: newPasswordInput }) 
      });
      if (res.ok) { Swal.fire('نجاح', 'تم تغيير رمزك السري بنجاح!', 'success'); setNewPasswordInput(''); fetchAllData(); }
    } catch (error) { Swal.fire('خطأ', 'حدث خطأ أثناء التغيير', 'error'); }
  };

  const handleAddCategory = async (isSub = false) => {
    const name = isSub ? newSubName : newMainName;
    if (!name) return Swal.fire('تنبيه', 'يرجى إدخال اسم القسم', 'warning');
    const body = { name, icon: isSub ? '📂' : '📁', parent: isSub ? activeMainCat.name : '' };
    try {
      const res = await fetch(`${API_URL}/api/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { isSub ? setNewSubName('') : setNewMainName(''); Swal.fire('نجاح', 'تم إضافة القسم', 'success'); fetchAllData(); }
    } catch(e) { Swal.fire('خطأ', 'خطأ في الإضافة', 'error'); }
  };

  const handleDeleteCategory = async (id) => {
    if(window.confirm("حذف هذا القسم سيؤثر على المنتجات داخله، هل أنت متأكد؟")) {
      await fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' }); fetchAllData();
    }
  };

  // ✅ حفظ المنتجات (بنية JSON قوية للضمان واللون)
  const handleSaveProduct = async () => {
    if (!formData.name || !activeSubCat) return Swal.fire('تنبيه', 'الاسم والقسم مطلوبان', 'warning');
    
    // تجميع التفاصيل الإضافية في كائن JSON لحفظه بشكل سليم
    const advancedDetails = JSON.stringify({
      text: formData.details || '',
      color: formData.color || '',
      warranty: formData.warranty || '',
      badge: formData.badge || '',
      manufacturer: formData.manufacturer || ''
    });

    const payload = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : 0,
      old_price: formData.old_price ? parseFloat(formData.old_price) : 0,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      category: activeSubCat.name,
      details: advancedDetails,
      modified_by: currentUser.username
    };

    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/api/products/${editingItem.id}` : `${API_URL}/api/products`;
    
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        Swal.fire('تم الحفظ!', 'تم حفظ المنتج بنجاح وسيظهر الآن للعملاء', 'success');
        setEditingItem(null);
        setFormData({ name: '', price: '', old_price: '', stock: '', details: '', manufacturer: '', color: '', warranty: '', badge: '', image: '', is_sale: false, out_of_stock: false });
        fetchAllData();
      } else { Swal.fire('خطأ', 'فشل الحفظ في قاعدة البيانات', 'error'); }
    } catch (e) { Swal.fire('خطأ', 'فشل الاتصال بالسيرفر', 'error'); }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("حذف هذا المنتج نهائياً؟")) {
      await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' }); fetchAllData();
    }
  };

  // ✅ حفظ العمال (بدون إجبار الصورة)
  const handleSaveWorker = async () => {
    if (!workerForm.name || !workerForm.phone || !workerForm.region || !workerForm.city) {
      return Swal.fire('تنبيه', 'الاسم، الجوال، المنطقة، والمدينة إجبارية', 'warning');
    }
    const method = editingWorker ? 'PUT' : 'POST';
    const url = editingWorker ? `${API_URL}/api/workers/${editingWorker.id}` : `${API_URL}/api/workers`;
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...workerForm, modified_by: currentUser.username }) });
      if (res.ok) {
        Swal.fire('نجاح', 'تم حفظ بيانات العامل بنجاح', 'success');
        setWorkerForm({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '' });
        setEditingWorker(null); fetchAllData();
      } else { Swal.fire('خطأ', 'لم يتم الحفظ', 'error'); }
    } catch(e) { Swal.fire('خطأ', 'مشكلة في الاتصال', 'error'); }
  };

  const handleDeleteWorker = async (id) => {
    if (window.confirm("حذف هذا العامل؟")) { await fetch(`${API_URL}/api/workers/${id}`, { method: 'DELETE' }); fetchAllData(); }
  };

  // ✅ إدارة الموظفين
  const handleSaveAdmin = async () => {
    if (!newAdminForm.username || !newAdminForm.pin) return Swal.fire('تنبيه', 'اسم الموظف والرمز السري مطلوبان', 'warning');
    const method = editingAdmin ? 'PUT' : 'POST';
    const url = editingAdmin ? `${API_URL}/api/admins/${editingAdmin.id}` : `${API_URL}/api/admins`;
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAdminForm) });
      if (res.ok) {
        Swal.fire('تم!', editingAdmin ? 'تم تحديث بيانات الموظف' : 'تم إضافة الموظف بنجاح', 'success');
        setNewAdminForm({ username: '', pin: '', role: 'موظف' }); setEditingAdmin(null); fetchAllData();
      } else { Swal.fire('خطأ', 'الاسم مسجل مسبقاً', 'error'); }
    } catch (e) { Swal.fire('خطأ', 'خطأ في الاتصال', 'error'); }
  };

  const handleDeleteAdmin = async (id, role) => {
    if (role === 'مدير') return Swal.fire('مرفوض', 'لا يمكن حذف حساب يمتلك صلاحية "مدير" لحماية النظام!', 'error');
    if (window.confirm("حذف هذا الموظف وسحب صلاحياته؟")) {
      await fetch(`${API_URL}/api/admins/${id}`, { method: 'DELETE' }); fetchAllData();
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      if (res.ok) { Swal.fire('نجاح', 'تم تحديث الإعدادات بنجاح ✅', 'success'); fetchAllData(); }
    } catch (e) { Swal.fire('خطأ', 'خطأ في الحفظ', 'error'); }
  };

  // ✅ الجرد والتحديث اليدوي
  const handleBulkInventoryUpdate = async (product, isAdding) => {
    const qty = Number(invBulkInputs[product.id]);
    if (!qty || qty <= 0) return Swal.fire('تنبيه', 'أدخل كمية صحيحة للتحديث', 'warning');
    let newStock = Number(product.stock) + (isAdding ? qty : -qty);
    if (newStock < 0) return Swal.fire('خطأ', 'المخزون الحالي لا يكفي لخصم هذه الكمية', 'error');
    
    try {
      const res = await fetch(`${API_URL}/api/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, stock: newStock, modified_by: currentUser.username }) });
      if (res.ok) { Swal.fire({toast:true, position:'top-end', icon:'success', title:'تم التحديث', showConfirmButton:false, timer:1500}); setInvBulkInputs({ ...invBulkInputs, [product.id]: '' }); fetchAllData(); }
    } catch (e) {}
  };

  // 🧾 طباعة الفاتورة للكاشير
  const handlePrintReceipt = (cartToPrint, total) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    const htmlContent = `
      <html dir="rtl">
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; width: 80mm; margin: 0 auto; padding: 10px; color: #000; text-align: center; font-size: 14px; }
            table { width: 100%; text-align: right; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
            th, td { border-bottom: 1px dashed #ccc; padding: 5px 0; }
            .header h2 { margin: 0; font-size: 20px; }
            .total { font-size: 18px; font-weight: bold; text-align: left; margin-top: 10px; border-top: 2px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings.shop_name}</h2>
            <p>رقم التواصل: ${settings.phone}</p>
            <p>التاريخ: ${new Date().toLocaleString('ar-SA')}</p>
          </div>
          <table>
            <tr><th>الصنف</th><th>الكمية</th><th>السعر</th></tr>
            ${cartToPrint.map(item => `<tr><td>${item.name}</td><td>${item.qty}</td><td>${item.price * item.qty}</td></tr>`).join('')}
          </table>
          <div class="total">الإجمالي: ${total} ر.س</div>
          <p style="margin-top: 20px;">شكراً لزيارتكم! ⚡</p>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleCheckoutPOS = async () => {
    if (adminCart.length === 0) return Swal.fire('تنبيه', 'السلة فارغة', 'warning');
    const total = adminCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    try {
      const res = await fetch(`${API_URL}/api/pos/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: adminCart, modified_by: currentUser.username }) });
      if (res.ok) {
        if (editingOrderId) await fetch(`${API_URL}/api/orders/${editingOrderId}/complete`, { method: 'PUT' });
        
        Swal.fire({
          title: 'تم الاعتماد بنجاح!',
          text: 'تم خصم الكميات من المخزون وتسجيل العملية.',
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'طـبـاعـة الفـاتـورة 🧾',
          cancelButtonText: 'إغلاق'
        }).then((result) => {
          if (result.isConfirmed) handlePrintReceipt(adminCart, total);
          setAdminCart([]); setEditingOrderId(null); setAdminView('orders'); fetchAllData();
        });
      }
    } catch (error) { Swal.fire('خطأ', 'حدث خطأ في الخادم', 'error'); }
  };

  const handleImageUpload = (e, targetField) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => { 
      const img = new Image(); img.src = event.target.result;
      img.onload = () => { 
        const cvs = document.createElement('canvas'); cvs.width = 500; cvs.height = img.height * (500 / img.width); 
        const ctx = cvs.getContext('2d'); ctx.drawImage(img, 0, 0, cvs.width, cvs.height); 
        const compressedImage = cvs.toDataURL('image/jpeg', 0.6);
        if (targetField === 'worker') setWorkerForm({ ...workerForm, image: compressedImage });
        else setFormData({ ...formData, image: compressedImage });
      };
    };
  };

  const addToCart = (product, isClient = true) => {
    const targetCart = isClient ? cart : adminCart;
    const setTargetCart = isClient ? setCart : setAdminCart;
    const qtyToAdd = isClient ? (itemQtys[product.id] || 1) : 1;
    const existingIndex = targetCart.findIndex(item => item.id === product.id);
    
    if (existingIndex >= 0) { 
      const newCart = [...targetCart]; newCart[existingIndex].qty += qtyToAdd; setTargetCart(newCart); 
    } else { setTargetCart([...targetCart, { ...product, qty: qtyToAdd }]); }
    
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: customerName, customer_phone: customerPhone, cart_data: cart, total: totalAmount })
      });
      if (res.ok) {
        Swal.fire({
          title: 'شكراً لك! 🎉',
          text: 'تم استلام طلبك بنجاح، فريقنا سيتواصل معك في أقرب وقت لترتيب التوصيل.',
          icon: 'success',
          confirmButtonText: 'متابعة التسوق'
        });
        setCart([]); setCustomerName(''); setCustomerPhone(''); setShowCart(false); fetchAllData();
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
        </div>
      );
    }

    const pendingOrders = orders.filter(o => o.status === 'معلق');
    const completedOrders = orders.filter(o => o.status === 'مكتمل');
    const mainCategoriesList = categories.filter(c => !c.parent);
    const totalProfits = products.reduce((sum, p) => sum + ((Number(p.sold) || 0) * Number(p.price)), 0);

    return (
      <div className="admin-root">
        {/* CSS مخصص للإدارة */}
        <style>{`
          .pulsing-bell { animation: ring 2s infinite; display: inline-block; transform-origin: top center; color: var(--red); }
          .low-stock-dot { display: inline-block; width: 12px; height: 12px; background-color: var(--red); border-radius: 50%; animation: pulse 1s infinite; margin-left: 10px; }
          @keyframes ring { 0% { transform: rotate(0); } 10% { transform: rotate(15deg); } 20% { transform: rotate(-10deg); } 30% { transform: rotate(5deg); } 40% { transform: rotate(-5deg); } 50% { transform: rotate(0); } }
        `}</style>
        
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ {settings.shop_name || 'الإدارة'}<div className="user-badge">👤 مرحباً: {currentUser.username}</div></div>
          <nav className="side-nav">
            <button className={adminView === 'orders' ? 'active' : ''} onClick={() => setAdminView('orders')}>
              📥 الطلبات الواردة 
              {pendingOrders.length > 0 && <span className="notification-badge"><span className="pulsing-bell">🔔</span> {pendingOrders.length}</span>}
            </button>
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
          <div className="side-footer"><button className="logout-btn" onClick={() => { setIsAuthenticated(false); setCurrentUser(null); }}>تسجيل الخروج 🚪</button></div>
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
                  <thead><tr><th>رقم الطلب</th><th>بيانات العميل</th><th>الإجمالي</th><th>إجراء سريع (واتساب)</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {pendingOrders.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>لا توجد طلبات معلقة حالياً</td></tr>}
                    {pendingOrders.map(order => (
                      <tr key={order.id}>
                        <td style={{color:'var(--gold)', fontWeight:'bold'}}>#{order.id} <br/><small>{new Date(order.created_at).toLocaleDateString('ar-SA')}</small></td>
                        <td>{order.customer_name} <br/><span style={{fontSize:'0.85rem', color:'#888'}}>{order.customer_phone}</span></td>
                        <td style={{color:'var(--green)', fontWeight:'bold'}}>{order.total} ر.س</td>
                        <td>
                          <button style={{background:'#f39c12', color:'#fff', border:'none', padding:'5px', borderRadius:'5px', cursor:'pointer', marginBottom:'5px', width:'100%'}} 
                            onClick={() => window.open(`https://wa.me/${order.customer_phone}?text=مرحباً ${order.customer_name}، جاري تجهيز طلبك رقم #${order.id} 📦`)}>إبلاغ: جاري التجهيز</button>
                          <button style={{background:'#27ae60', color:'#fff', border:'none', padding:'5px', borderRadius:'5px', cursor:'pointer', width:'100%'}}
                            onClick={() => window.open(`https://wa.me/${order.customer_phone}?text=مرحباً ${order.customer_name}، طلبك رقم #${order.id} في الطريق إليك 🚚`)}>إبلاغ: في الطريق</button>
                        </td>
                        <td>
                          <button className="add-btn" style={{marginRight:'5px'}} onClick={() => { setAdminCart(order.cart_data); setEditingOrderId(order.id); setAdminView('pos'); }}>مراجعة ✏️</button>
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
                  <tbody>{completedOrders.slice(0, 5).map(order => (<tr key={order.id}><td>#{order.id}</td><td>{order.customer_name}</td><td style={{color:'var(--green)'}}>{order.total} ر.س</td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. الكاشير POS */}
          {adminView === 'pos' && (
            <div className="pos-container fade-in">
              <div className="pos-products-section">
                <input type="text" className="pos-search" placeholder="🔍 ابحث عن منتج للبيع السريع..." value={posSearch} onChange={e => setPosSearch(e.target.value)}/>
                <div className="pos-grid">
                  {products.filter(p => !posSearch || p.name.includes(posSearch)).map(product => (
                    <div key={product.id} className="pos-card" onClick={() => { if(product.stock > 0) addToCart(product, false); else Swal.fire('تنبيه','نفدت الكمية','warning'); }}>
                      {product.stock <= 0 && <div className="pos-out">نفدت الكمية</div>}
                      <img src={product.image || 'https://via.placeholder.com/100'} alt=""/>
                      <h5 style={{height:'35px', overflow:'hidden'}}>{product.name}</h5>
                      <span className="pos-price">{product.price} ر.س</span>
                      <span className="pos-stock">المخزون: {product.stock}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pos-cart-section">
                <h3>{editingOrderId ? `تعديل ومراجعة طلب #${editingOrderId}` : `سلة البيع (كاشير)`}</h3>
                <div className="pos-cart-items">
                  {adminCart.map((item, index) => (
                    <div key={index} className="pos-cart-row">
                      <div className="pos-cart-info"><b>{item.name}</b><span>{item.price} ر.س</span></div>
                      <div className="pos-qty-controls">
                        <button onClick={() => { const n = [...adminCart]; n[index].qty++; setAdminCart(n); }}>+</button><span>{item.qty}</span>
                        <button onClick={() => { const n = [...adminCart]; n[index].qty--; if(n[index].qty<=0) n.splice(index,1); setAdminCart(n); }}>-</button>
                      </div>
                    </div>
                  ))}
                  {adminCart.length === 0 && <div className="pos-empty">السلة فارغة</div>}
                </div>
                <div className="pos-checkout-area">
                  <div className="pos-totals"><div className="p-row final"><span>المطلوب:</span><span>{adminCart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س</span></div></div>
                  <button className="pos-checkout-btn" onClick={handleCheckoutPOS}>اعتماد البيع وخصم المخزون ✅</button>
                  {editingOrderId && <button className="del-btn-sq" style={{width:'100%', marginTop:'10px'}} onClick={() => { setEditingOrderId(null); setAdminCart([]); setAdminView('orders'); }}>إلغاء التعديل والعودة</button>}
                </div>
              </div>
            </div>
          )}

          {/* 3. الجرد والمخزون */}
          {adminView === 'inventory' && (
            <div className="fade-in">
              {!invMainCat ? (
                <div className="panel-card"><h2>📦 الجرد: اختر القسم الرئيسي</h2><div className="folders-grid">{mainCategoriesList.map(cat => (<div key={cat.id} className="folder-card main" onClick={() => setInvMainCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>
              ) : !invSubCat ? (
                <div className="panel-card"><button className="back-btn" onClick={() => setInvMainCat(null)}>🔙 رجوع</button><h2>📦 جرد الأقسام الفرعية لـ ({invMainCat.name})</h2><div className="folders-grid">{categories.filter(c => c.parent === invMainCat.name).map(cat => (<div key={cat.id} className="folder-card sub" onClick={() => setInvSubCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>
              ) : (
                <div className="panel-card"><button className="back-btn" onClick={() => setInvSubCat(null)}>🔙 رجوع</button><div className="path-header">مستودع ⬅️ {invMainCat.name} ⬅️ {invSubCat.name}</div>
                  <table className="pro-table">
                    <thead><tr><th>المنتج</th><th>المخزون الحالي</th><th>الكمية المباعة</th><th>تحديث يدوياً</th></tr></thead>
                    <tbody>
                      {products.filter(p => p.category === invSubCat.name).map(product => (
                        <tr key={product.id}>
                          <td>{product.name} {product.stock <= 5 && <span className="low-stock-dot" title="مخزون منخفض جداً"></span>}</td>
                          <td className="stk-td">{product.stock}</td><td className="sld-td">{product.sold || 0}</td>
                          <td className="act-td">
                            <div className="bulk-action-wrapper"><input type="number" className="bulk-input" placeholder="الكمية..." value={invBulkInputs[product.id] || ''} onChange={(e) => setInvBulkInputs({...invBulkInputs, [product.id]: e.target.value})}/><div className="bulk-buttons"><button className="btn-plus-bulk" onClick={() => handleBulkInventoryUpdate(product, true)}>إضافة (+)</button><button className="btn-minus-bulk" onClick={() => handleBulkInventoryUpdate(product, false)}>خصم (-)</button></div></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. المنتجات والأقسام العميقة + الخصائص الجديدة */}
          {adminView === 'categories' && (
            <div className="fade-in">
              {!activeMainCat ? (
                <div className="panel-card">
                  <h2>1. الأقسام الرئيسية (مثال: كهرباء، سباكة)</h2>
                  <div className="add-row mb-20"><input placeholder="اسم القسم الرئيسي..." value={newMainName} onChange={e => setNewMainName(e.target.value)}/><button className="add-btn" onClick={() => handleAddCategory(false)}>إضافة 📁</button></div>
                  <div className="folders-grid">{mainCategoriesList.map(c => (<div key={c.id} className="folder-card main" onClick={() => setActiveMainCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}>حذف</button></div>))}</div>
                </div>
              ) : !activeSubCat ? (
                <div className="panel-card"><button className="back-btn" onClick={() => setActiveMainCat(null)}>🔙 رجوع</button>
                  <h2>2. الأقسام الفرعية لـ ({activeMainCat.name})</h2>
                  <div className="add-row mb-20"><input placeholder="قسم فرعي جديد..." value={newSubName} onChange={e => setNewSubName(e.target.value)}/><button className="add-btn" onClick={() => handleAddCategory(true)}>إضافة 📂</button></div>
                  <div className="folders-grid">{categories.filter(c => c.parent === activeMainCat.name).map(c => (<div key={c.id} className="folder-card sub" onClick={() => setActiveSubCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}>حذف</button></div>))}</div>
                </div>
              ) : (
                <div className="panel-card"><button className="back-btn" onClick={() => { setActiveSubCat(null); setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: '', details: '', manufacturer: '', color: '', warranty: '', badge: '', image: '', is_sale: false, out_of_stock: false }); }}>🔙 رجوع للأقسام</button>
                  <div className="path-header">{activeMainCat.name} ⬅️ {activeSubCat.name}</div>
                  
                  <div className="product-entry-form">
                    <div className="img-upload-box">
                      {formData.image ? <img src={formData.image} alt="prod"/> : <div className="img-ph">صورة المنتج</div>}
                      <label className="upload-label">رفع صورة 📸 <input type="file" onChange={(e) => handleImageUpload(e, 'product')} style={{display:'none'}}/></label>
                    </div>
                    <div className="data-entry-box">
                      <input className="f-input full" placeholder="اسم المنتج (مثال: فيش ثلاثي)..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                      <div className="f-row">
                        <input className="f-input" type="number" placeholder="السعر الجديد (البيع)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/>
                        <input className="f-input" type="number" placeholder="السعر القديم (يظهر مشطوب للعميل)" value={formData.old_price} onChange={e => setFormData({...formData, old_price: e.target.value})}/>
                        <input className="f-input" type="number" placeholder="كمية المخزون (الافتتاحية)" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}/>
                      </div>
                      <div className="f-row mt-10">
                        <input className="f-input" placeholder="اللون (مثال: ذهبي، أبيض)..." value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}/>
                        <input className="f-input" placeholder="مدة الضمان (مثال: 10 سنوات)..." value={formData.warranty} onChange={e => setFormData({...formData, warranty: e.target.value})}/>
                        <select className="f-input" value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})}>
                           <option value="">بدون شارة تميز</option>
                           <option value="best_seller">🏆 الأكثر مبيعاً</option>
                           <option value="new_arrival">✨ منتج جديد</option>
                           <option value="high_quality">⭐ جودة عالية</option>
                        </select>
                      </div>
                      <input className="f-input full mt-10" placeholder="الشركة المصنعة (ماركة المنتج)..." value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})}/>
                      <textarea className="f-input full mt-10" rows="2" placeholder="مواصفات إضافية للمنتج..." value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}></textarea>
                      <div className="f-toggles">
                        <button className={`t-btn ${formData.is_sale ? 'active-green' : ''}`} onClick={() => setFormData({...formData, is_sale: !formData.is_sale})}>🔥 تحديد كعرض خاص</button>
                        <button className={`t-btn ${formData.out_of_stock ? 'active-out' : ''}`} onClick={() => setFormData({...formData, out_of_stock: !formData.out_of_stock})}>🚫 تحديد كنفدت الكمية</button>
                        <button className="save-btn" onClick={handleSaveProduct}>{editingItem ? 'تحديث بيانات المنتج 🔄' : 'حفظ المنتج بالمستودع ✅'}</button>
                      </div>
                    </div>
                  </div>

                  <div className="mini-products-list mt-30">
                    <h3 style={{color:'var(--navy)'}}>المنتجات المسجلة في هذا القسم:</h3>
                    {products.filter(p => p.category === activeSubCat.name).map(product => {
                      const parsed = parseProductDetails(product.details);
                      return (
                        <div key={product.id} className="m-prod-row" onClick={() => { 
                           setEditingItem(product); 
                           setFormData({ ...product, color: parsed.color||'', warranty: parsed.warranty||'', badge: parsed.badge||'', manufacturer: parsed.manufacturer||'', details: parsed.text||'' }); 
                        }}>
                          <img src={product.image || 'https://via.placeholder.com/50'} alt=""/>
                          <div style={{flex:1}}><b>{product.name}</b> <br/><small>{parsed.color && `لون: ${parsed.color} | `}{parsed.warranty && `ضمان: ${parsed.warranty}`}</small></div>
                          <span style={{color:'var(--green)', fontWeight:'bold'}}>{product.price} ر.س</span>
                          <button className="del-btn-sq" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}>حذف ❌</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. العمال */}
          {adminView === 'workers' && (
            <div className="panel-card fade-in"><h2>👷‍♂️ إدارة العمال (تطبيق الحراج)</h2>
              <div className="product-entry-form" style={{flexDirection: 'column'}}><div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}><div className="worker-images-upload" style={{flex: '0 0 150px'}}><div className="img-upload-box mb-20">{workerForm.image ? <img src={workerForm.image} alt="worker"/> : <div className="img-ph">صورة (اختياري)</div>}<label className="upload-label">رفع صورة <input type="file" onChange={(e) => handleImageUpload(e, 'worker')} style={{display:'none'}}/></label></div></div>
              <div className="data-entry-box" style={{flex: '1'}}>
                <div className="f-row"><input className="f-input" placeholder="اسم العامل..." value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})}/><input className="f-input" placeholder="الجوال (واتساب)..." value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}/></div>
                <div className="f-row">
                  <select className="f-input" value={workerForm.region} onChange={e => setWorkerForm({...workerForm, region: e.target.value, city: ''})}>
                    <option value="">اختر المنطقة...</option>{Object.keys(SAUDI_REGIONS).map((r, i) => <option key={i} value={r}>{r}</option>)}
                  </select>
                  <select className="f-input" value={workerForm.city} onChange={e => setWorkerForm({...workerForm, city: e.target.value})} disabled={!workerForm.region}>
                    <option value="">اختر المحافظة/المدينة...</option>{workerForm.region && SAUDI_REGIONS[workerForm.region].map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                </div>
                <input className="f-input" placeholder="المهنة (مثال: سباك ممتاز)..." value={workerForm.profession} onChange={e => setWorkerForm({...workerForm, profession: e.target.value})}/>
                <textarea className="f-input" placeholder="نبذة عن خبرة العامل..." value={workerForm.details} onChange={e => setWorkerForm({...workerForm, details: e.target.value})}></textarea>
                <button className="save-btn" onClick={handleSaveWorker}>{editingWorker ? 'تحديث العامل 🔄' : 'إضافة عامل 👷‍♂️'}</button>
              </div></div></div>
              <div className="folders-grid mt-30">{workers.map(w => (<div key={w.id} className="worker-admin-card" onClick={() => {setEditingWorker(w); setWorkerForm(w);}}><img src={w.image || 'https://via.placeholder.com/60'} alt=""/><div className="w-info"><h4>{w.name}</h4><small>{w.profession} | {w.city}</small></div><button className="del-btn-sq" onClick={(e) => {e.stopPropagation(); handleDeleteWorker(w.id);}}>حذف</button></div>))}</div>
            </div>
          )}

          {/* 6. التقارير */}
          {adminView === 'reports' && isManager && (
            <div className="panel-card fade-in"><h2>📊 التقارير المالية (مفصلة)</h2>
              <div className="reports-split-container">
                {mainCategoriesList.map(mainCat => {
                  const subCatNames = categories.filter(c => c.parent === mainCat.name).map(x => x.name);
                  const myProducts = products.filter(p => subCatNames.includes(p.category) && p.sold > 0);
                  const sectionProfit = myProducts.reduce((sum, item) => sum + (Number(item.sold) * Number(item.price)), 0);
                  if (myProducts.length === 0) return null;
                  return (
                    <div key={mainCat.id} className="report-main-section"><h3 className="r-header">{mainCat.name} | إجمالي الأرباح: {sectionProfit} ر.س</h3>
                      <table className="pro-table"><thead><tr><th>المنتج</th><th>القسم الفرعي</th><th>المباع</th><th>إجمالي الأرباح</th></tr></thead><tbody>{myProducts.map(p => (<tr key={p.id}><td>{p.name}</td><td>{p.category}</td><td className="sld-td">{p.sold}</td><td className="profit-td">{p.sold * p.price} ر.س</td></tr>))}</tbody></table>
                    </div>
                  )
                })}
                {products.filter(p => p.sold > 0).length === 0 && <div style={{textAlign:'center', padding:'30px', fontWeight:'bold', color:'var(--navy)'}}>لا توجد مبيعات مسجلة حتى الآن.</div>}
              </div>
            </div>
          )}

          {/* 7. طاقم الموظفين */}
          {adminView === 'users' && isManager && (
            <div className="panel-card fade-in"><h2>👥 طاقم الإدارة</h2>
              <div className="add-row mb-20" style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px'}}>
                <input placeholder="الاسم..." value={newAdminForm.username} onChange={e => setNewAdminForm({...newAdminForm, username: e.target.value})}/>
                <input placeholder="الرمز السري..." type="text" value={newAdminForm.pin} onChange={e => setNewAdminForm({...newAdminForm, pin: e.target.value})}/>
                <select value={newAdminForm.role} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})} style={{padding:'12px', borderRadius:'8px'}}><option value="موظف">موظف (كاشير وجرد)</option><option value="مدير">مدير (صلاحيات كاملة)</option></select>
                <button className="add-btn" onClick={handleSaveAdmin}>{editingAdmin ? 'تحديث الموظف 🔄' : 'إضافة وتفعيل ➕'}</button>
                {editingAdmin && <button className="del-btn-sq" onClick={() => {setEditingAdmin(null); setNewAdminForm({ username: '', pin: '', role: 'موظف' });}}>إلغاء التعديل</button>}
              </div>
              <table className="pro-table"><thead><tr><th>الاسم</th><th>الصلاحية</th><th>إجراء</th></tr></thead>
                <tbody>{admins.map(a => (<tr key={a.id}><td>{a.username} {a.id === currentUser.id ? '(أنت)' : ''}</td><td><span className="sc-badge">{a.role}</span></td><td><button className="add-btn" style={{marginRight:'5px', background:'#3498db'}} onClick={() => { setEditingAdmin(a); setNewAdminForm({ username: a.username, pin: a.pin, role: a.role }); }}>تعديل ✏️</button><button className="del-btn-sq" onClick={() => handleDeleteAdmin(a.id, a.role)}>حذف ❌</button></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* 8. الإعدادات */}
          {adminView === 'settings' && isManager && (
            <div className="panel-card fade-in"><h2>⚙️ إعدادات المتجر العامة</h2>
              <div className="settings-grid"><div className="form-group"><label>الاسم التجاري للمحل:</label><input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/></div><div className="form-group"><label>رقم واتساب للتواصل واستقبال الطلبات:</label><input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/></div></div>
              <button className="save-btn full-w-btn" onClick={handleSaveSettings}>حفظ التعديلات وتطبيقها على المتجر ✅</button>
            </div>
          )}
          {adminView === 'profile' && (
            <div className="panel-card fade-in"><h2>👤 حسابي الشخصي</h2>
              <div className="settings-grid"><div className="form-group"><label>اسم المستخدم (لا يمكن تغييره)</label><input value={currentUser.username} disabled style={{background: '#eee'}} /></div><div className="form-group"><label>تغيير الرمز السري 🔒</label><input type="password" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} placeholder="أدخل الرمز الجديد هنا..." /></div></div>
              <button className="save-btn full-w-btn" onClick={handleChangeMyPassword}>حفظ الرمز السري الجديد</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================================
  // 💻 5. واجهة العميل (Storefront) - الإصدار الفاخر
  // =========================================================================
  
  let processedProducts = products;
  if (searchQuery) { 
    processedProducts = processedProducts.filter(p => p.name.includes(searchQuery) || (p.details && p.details.includes(searchQuery))); 
  } else if (clientSub) { 
    processedProducts = processedProducts.filter(p => p.category === clientSub); 
  } else if (clientMain) {
    const subsOfMain = categories.filter(c => c.parent === clientMain).map(c => c.name);
    processedProducts = processedProducts.filter(p => subsOfMain.includes(p.category));
  }

  // تطبيق فلتر الترتيب
  if (sortType === 'price_asc') processedProducts.sort((a,b) => parseFloat(a.price) - parseFloat(b.price));
  if (sortType === 'price_desc') processedProducts.sort((a,b) => parseFloat(b.price) - parseFloat(a.price));
  if (sortType === 'offers') processedProducts = processedProducts.filter(p => p.is_sale);

  const visibleWorkers = workers.filter(w => (!harajRegion || w.region === harajRegion) && (!harajCity || w.city === harajCity));
  const mainCategoriesList = categories.filter(c => !c.parent);
  const cartTotalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - cartTotalAmount;

  return (
    <div className={`App client-theme ${showCart || selectedProduct || showWorkersHaraj ? 'no-scroll' : ''} ${darkMode ? 'dark-mode' : ''}`}>
      
      {/* CSS للوضع الليلي والصور المفرغة */}
      <style>{`
        .dark-mode { background-color: #121212 !important; color: #f1f1f1 !important; }
        .dark-mode .royal-header { background-color: #000 !important; border-bottom-color: var(--gold) !important; }
        .dark-mode .client-main-bar { background-color: #1a1a1a !important; }
        .dark-mode .client-sub-bar { background-color: #222 !important; border-bottom: 1px solid #333 !important; }
        .dark-mode .client-sub-bar button { color: #ccc; border-color: #555; }
        .dark-mode .client-sub-bar button.active { background-color: var(--gold); color: #000; }
        .dark-mode .royal-p-card { background-color: #1e1e1e !important; border-color: #333 !important; box-shadow: none; }
        .dark-mode .p-info-box h4 { color: #f1f1f1 !important; }
        .dark-mode .p-img-box { background-color: #fff; } /* نحتفظ بخلفية بيضاء للصورة لتعمل خاصية الدمج أو نفرغها */
        
        /* سحر تفريغ خلفية الصورة (إزالة المربع الأبيض) */
        .blend-image { mix-blend-mode: multiply; object-fit: contain; width: 100%; height: 100%; padding: 0 !important; }
        .dark-mode .blend-image { mix-blend-mode: normal; } /* في الوضع الليلي نتركها طبيعية لتظهر */
        
        /* حركة النار 100% */
        .fire-anim { display: inline-block; animation: flame 0.8s infinite alternate; font-size: 1.2rem; }
        @keyframes flame { 0% { transform: scale(1) rotate(-5deg); opacity: 0.8; text-shadow: 0 0 5px orange; } 100% { transform: scale(1.2) rotate(5deg); opacity: 1; text-shadow: 0 0 15px red; } }
        
        .quote-btn-top { background: linear-gradient(45deg, #f39c12, #d35400); color: white; border: none; padding: 8px 15px; border-radius: 20px; font-weight: bold; cursor: pointer; animation: pulse 2s infinite; }
        .trust-badge-card { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: var(--gold); padding: 3px 8px; border-radius: 5px; font-size: 0.75rem; font-weight: bold; z-index: 10; border: 1px solid var(--gold); }
      `}</style>

      {/* الشريط العلوي */}
      <header className="royal-header" style={{boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name || 'تشاطيب'} ⚡</div>
         <div className="search-bar-wrapper"><input placeholder="🔍 ابحث عن منتج، ماركة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{borderRadius:'20px', padding:'10px 15px'}} /></div>
         
         <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
             <button className="quote-btn-top desktop-only" onClick={() => window.open(`https://wa.me/${settings.phone}?text=مرحباً، لدي مشروع كامل وأريد تسعيرة خاصة للطلبات التالية:`)}>طلب تسعيرة مشروع 🏗️</button>
             <button className="open-cart-large desktop-only" onClick={() => setShowWorkersHaraj(true)} style={{borderRadius:'20px', border:'2px solid var(--navy)', color:'var(--navy)', background:'white'}}>👷‍♂️ حراج العمال</button>
             <button className="open-cart-large desktop-only" onClick={() => setShowCart(true)} style={{borderRadius:'20px'}}>🛒 السلة <span style={{background:'var(--gold)', color:'#000', padding:'2px 8px', borderRadius:'10px', marginLeft:'5px'}}>{cart.length}</span></button>
             <button onClick={() => setDarkMode(!darkMode)} style={{background:'transparent', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>{darkMode ? '☀️' : '🌙'}</button>
         </div>
      </header>
      
      {/* شريط الأقسام والترتيب */}
      {!searchQuery && (
        <>
          <div className="client-main-bar">
            <button className={!clientMain ? 'active' : ''} onClick={() => {setClientMain(''); setClientSub('');}}>الكل</button>
            {mainCategoriesList.map(cat => (
              <button key={cat.id} className={clientMain === cat.name ? 'active' : ''} onClick={() => { setClientMain(cat.name); const sub = categories.filter(x => x.parent === cat.name); if(sub.length > 0) setClientSub(sub[0].name); else setClientSub(''); }}>{cat.name}</button>
            ))}
          </div>
          {clientMain && categories.filter(c => c.parent === clientMain).length > 0 && (
            <div className="client-sub-bar" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', gap:'10px', overflowX:'auto', flex:1}}>
                {categories.filter(c => c.parent === clientMain).map(subCat => (
                  <button key={subCat.id} className={clientSub === subCat.name ? 'active' : ''} onClick={() => setClientSub(subCat.name)}>{subCat.name}</button>
                ))}
              </div>
              <select style={{padding:'5px 10px', borderRadius:'10px', border:'1px solid var(--gold)', background:'transparent', color:'var(--navy)', fontWeight:'bold'}} value={sortType} onChange={e => setSortType(e.target.value)}>
                <option value="default">الترتيب الافتراضي 🔃</option>
                <option value="price_asc">الأقل سعراً ⬇️</option>
                <option value="price_desc">الأعلى سعراً ⬆️</option>
                <option value="offers">العروض الخاصة 🔥</option>
              </select>
            </div>
          )}
        </>
      )}
      
      {/* شبكة المنتجات للعميل */}
      <div className="gallery-container">
        {processedProducts.length === 0 ? (
          <div className="empty-state"><h3 style={{color: darkMode?'#fff':'#333'}}>لا توجد منتجات هنا حالياً.</h3></div>
        ) : (
          <div className="p-grid-royal">
            {processedProducts.map(product => {
              const parsedInfo = parseProductDetails(product.details);
              return (
              <div key={product.id} className="royal-p-card" onClick={() => setSelectedProduct(product)}>
                {product.is_sale && <div className="discount-badge" style={{display:'flex', alignItems:'center', gap:'5px'}}>عرض <span className="fire-anim">🔥</span></div>}
                {parsedInfo.badge === 'best_seller' && <div className="trust-badge-card">🏆 الأكثر مبيعاً</div>}
                {parsedInfo.badge === 'new_arrival' && <div className="trust-badge-card">✨ جديد</div>}
                {parsedInfo.badge === 'high_quality' && <div className="trust-badge-card">⭐ جودة عالية</div>}
                {product.out_of_stock && <div className="sold-tag">نفدت الكمية 🚫</div>}
                
                {/* تم إزالة الخلفية البيضاء باستخدام blend-image وتصفير الحواف */}
                <div className="p-img-box" style={{padding:0, backgroundColor: darkMode?'#fff':'transparent'}}><img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} className="blend-image"/></div>
                
                <div className="p-info-box">
                  <h4 style={{fontSize:'1.1rem', marginBottom:'5px', height:'40px', overflow:'hidden'}}>{product.name}</h4>
                  <div style={{fontSize:'0.8rem', color:'#888', marginBottom:'10px', minHeight:'18px'}}>
                    {parsedInfo.color && <span style={{display:'inline-block', border:'1px solid #ddd', padding:'2px 6px', borderRadius:'5px', marginRight:'5px'}}>اللون: <b>{parsedInfo.color}</b></span>}
                    {parsedInfo.warranty && <span style={{display:'inline-block', border:'1px solid #ddd', padding:'2px 6px', borderRadius:'5px'}}>ضمان <b>{parsedInfo.warranty}</b></span>}
                  </div>
                  <div className="price-area">
                    <span className="now-price">{product.price} ر.س</span>
                    {product.old_price > 0 && <span className="old-price">{product.old_price} ر.س</span>}
                    {product.is_sale && <span className="fire-anim" style={{float:'left'}}>🔥</span>}
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
            )})}
          </div>
        )}
      </div>

      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      {cart.length > 0 && (
        <div className="mobile-sticky-cart hide-desktop" onClick={() => setShowCart(true)}>
          <div className="m-cart-info">🛒 في السلة: <b>{cart.length}</b></div>
          <div className="m-cart-total">{cartTotalAmount} ر.س</div>
        </div>
      )}

      {/* نافذة عرض تفاصيل المنتج */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content fade-in-up" onClick={e => e.stopPropagation()} style={{backgroundColor: darkMode ? '#1e1e1e':'#fff', color: darkMode?'#fff':'#000'}}>
            <button className="modal-close-x" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="modal-body-split">
              <div className="m-img-side" style={{backgroundColor: darkMode?'#fff':'#fdfdfd'}}>
                {selectedProduct.is_sale && <div className="m-discount">🔥 عرض <span className="fire-anim">🔥</span></div>}
                <img src={selectedProduct.image || 'https://via.placeholder.com/300'} alt={selectedProduct.name} className="blend-image" />
              </div>
              <div className="m-details-side">
                <h2 style={{color: darkMode?'var(--gold)':'var(--navy)'}}>{selectedProduct.name}</h2>
                <div className="m-price-box">
                  <span className="m-now">{selectedProduct.price} ر.س</span>
                  {selectedProduct.old_price > 0 && <span className="m-old">{selectedProduct.old_price} ر.س</span>}
                </div>
                
                {/* شارات المنتج */}
                <div style={{display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap'}}>
                   {parseProductDetails(selectedProduct.details).warranty && <span style={{background:'rgba(52, 152, 219, 0.1)', color:'#3498db', padding:'5px 10px', borderRadius:'8px', fontWeight:'bold'}}>🛡️ ضمان {parseProductDetails(selectedProduct.details).warranty}</span>}
                   {parseProductDetails(selectedProduct.details).color && <span style={{background:'rgba(155, 89, 182, 0.1)', color:'#9b59b6', padding:'5px 10px', borderRadius:'8px', fontWeight:'bold'}}>🎨 اللون: {parseProductDetails(selectedProduct.details).color}</span>}
                   {parseProductDetails(selectedProduct.details).manufacturer && <span style={{background:'rgba(46, 204, 113, 0.1)', color:'#27ae60', padding:'5px 10px', borderRadius:'8px', fontWeight:'bold'}}>🏭 {parseProductDetails(selectedProduct.details).manufacturer}</span>}
                </div>

                <div className="m-desc-box">
                  <h3 style={{color: darkMode?'#ddd':'var(--navy)'}}>المواصفات:</h3>
                  <div className="m-desc" style={{backgroundColor: darkMode?'#333':'#f9f9f9', color: darkMode?'#fff':'#555'}}>{parseProductDetails(selectedProduct.details).text || 'لا توجد تفاصيل إضافية مسجلة لهذا المنتج.'}</div>
                </div>
                
                {/* زر مشاركة للمقاول */}
                <button style={{background:'transparent', color:'var(--navy)', border:'2px solid var(--navy)', padding:'10px', borderRadius:'10px', fontWeight:'bold', marginBottom:'15px', cursor:'pointer', display:'block', width:'100%'}} 
                  onClick={() => window.open(`https://wa.me/?text=مرحباً، وش رأيك في هذا المنتج: ${selectedProduct.name} بسعر ${selectedProduct.price} ريال من متجر ${settings.shop_name}؟`)}>
                  مشاركة المنتج للاستشارة 📤
                </button>

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

      {/* حراج العمال */}
      {showWorkersHaraj && (
        <div className="cart-overlay open" style={{background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)'}}>
          <div className="cart-inner-container-large fade-in-up" style={{maxWidth:'800px', backgroundColor: darkMode ? '#1e1e1e':'#fff'}}>
             <div className="cart-header-fixed">
                <h2>👷‍♂️ خدمات العمال والصيانة</h2>
                <button className="close-btn-x" onClick={() => setShowWorkersHaraj(false)}>✕</button>
             </div>
             <div className="workers-filters" style={{padding:'15px', background: darkMode?'#222':'#f8f9fa', borderBottom:'1px solid #eee', display:'flex', gap:'10px', flexWrap:'wrap'}}>
                <select value={harajRegion} onChange={e => {setHarajRegion(e.target.value); setHarajCity('');}} style={{flex:1, padding:'10px', borderRadius:'8px', border:'2px solid var(--gold)'}}>
                    <option value="">🔍 كل مناطق المملكة</option>
                    {Object.keys(SAUDI_REGIONS).map((r, i) => <option key={i} value={r}>{r}</option>)}
                </select>
                <select value={harajCity} onChange={e => setHarajCity(e.target.value)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'2px solid var(--gold)'}} disabled={!harajRegion}>
                    <option value="">🏙️ كل المحافظات والمدن</option>
                    {harajRegion && SAUDI_REGIONS[harajRegion].map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
             </div>
             <div className="cart-products-scroll" style={{background: darkMode?'#121212':'#fdfdfd'}}>
                 {visibleWorkers.length === 0 ? (
                     <div className="empty-state"><h3 style={{color:darkMode?'#fff':'#333'}}>لا يوجد عمال متاحين حالياً في هذا النطاق.</h3></div>
                 ) : (
                    <div className="workers-public-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:'20px'}}>
                        {visibleWorkers.map(worker => (
                            <div key={worker.id} className="worker-public-card" style={{background: darkMode?'#222':'white', borderRadius:'15px', border: darkMode?'1px solid #444':'1px solid #eee', overflow:'hidden', boxShadow:'0 3px 10px rgba(0,0,0,0.05)', textAlign:'center', paddingBottom:'15px'}}>
                                <div style={{height:'100px', background:'var(--navy)', position:'relative'}}>
                                    <div style={{width:'80px', height:'80px', borderRadius:'50%', border:'4px solid var(--gold)', overflow:'hidden', margin:'0 auto', position:'relative', top:'50px', background:'#fff'}}>
                                        <img src={worker.image || 'https://via.placeholder.com/80'} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                                    </div>
                                </div>
                                <div style={{marginTop:'60px', padding:'0 15px', color: darkMode?'#fff':'#000'}}>
                                    <h3 style={{margin:'0 0 5px 0'}}>{worker.name}</h3>
                                    <span style={{background: darkMode?'#444':'#eee', padding:'3px 10px', borderRadius:'15px', fontSize:'0.85rem'}}>{worker.profession}</span>
                                    <div style={{margin:'10px 0', fontSize:'0.9rem', color: darkMode?'#aaa':'#777'}}>📍 {worker.region} - {worker.city}</div>
                                    <p style={{fontSize:'0.9rem', minHeight:'40px'}}>{worker.details}</p>
                                    <button onClick={() => window.open(`https://wa.me/${worker.phone}?text=مرحباً، رأيت إعلانك في متجر ${settings.shop_name} وأريد الاستفسار عن خدماتك`)} style={{background:'#25d366', color:'white', border:'none', padding:'10px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', width:'100%'}}>
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

      {/* سلة المشتريات */}
      {showCart && (
        <div className="cart-overlay open">
          <div className="cart-inner-container-large fade-in-up" style={{backgroundColor: darkMode?'#1e1e1e':'#fff', color: darkMode?'#fff':'#000'}}>
            <div className="cart-header-fixed">
              <h2>سلة المشتريات الخاصة بك 🛒</h2>
              <button className="close-btn-x" onClick={() => setShowCart(false)}>✕</button>
            </div>
            
            {/* شريط محفز الشراء */}
            {cartTotalAmount > 0 && remainingForFreeShipping > 0 && (
              <div style={{background:'#fff3cd', color:'#856404', padding:'10px', textAlign:'center', fontWeight:'bold', fontSize:'0.9rem'}}>
                أضف منتجات بقيمة {remainingForFreeShipping} ر.س للحصول على توصيل مجاني! 🚚
              </div>
            )}
            {cartTotalAmount > 0 && remainingForFreeShipping <= 0 && (
              <div style={{background:'#d4edda', color:'#155724', padding:'10px', textAlign:'center', fontWeight:'bold', fontSize:'0.9rem'}}>
                مبروك! لقد حصلت على توصيل مجاني 🚚✨
              </div>
            )}

            <div className="cart-products-scroll" style={{backgroundColor: darkMode?'#121212':'#fdfdfd'}}>
              {cart.length === 0 && <div className="empty-cart-msg">سلتك فارغة حالياً، تصفح منتجاتنا المميزة!</div>}
              {cart.map((item, index) => (
                <div key={index} className="cart-product-row" style={{backgroundColor: darkMode?'#222':'#fff', borderColor: darkMode?'#444':'#eee'}}>
                  <img src={item.image || 'https://via.placeholder.com/80'} alt="" className="cart-p-img blend-image" style={{backgroundColor:'#fff'}} />
                  <div className="cart-p-details">
                    <div className="cart-p-title" style={{color: darkMode?'#fff':'var(--navy)'}}>{item.name}</div>
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
                <div className="customer-info-box" style={{backgroundColor: darkMode?'#2a2a2a':'#e8f4f8', borderColor: darkMode?'#555':'#3498db'}}>
                  <h4 style={{marginTop:0, color: darkMode?'var(--gold)':'var(--navy)'}}>📍 بيانات التواصل لتأكيد الطلب:</h4>
                  <input className="c-input" type="text" placeholder="الاسم الكريم" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{backgroundColor: darkMode?'#444':'#fff', color: darkMode?'#fff':'#000'}} />
                  <input className="c-input" type="tel" placeholder="رقم الجوال (للاتصال أو الواتساب)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{backgroundColor: darkMode?'#444':'#fff', color: darkMode?'#fff':'#000'}} />
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="cart-floating-action" style={{backgroundColor: darkMode?'#1a1a1a':'#fff', borderColor: darkMode?'#333':'#eee'}}>
                <div className="total-gold-box" style={{color: darkMode?'#fff':'var(--navy)'}}>الإجمالي المطلوب: <span>{cartTotalAmount} ر.س</span></div>
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