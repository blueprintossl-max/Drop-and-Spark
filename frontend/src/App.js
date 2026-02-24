/* eslint-disable */
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  // ==========================================
  // حالات النظام (States) - مفصلة لسهولة القراءة
  // ==========================================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '', shop_name: '', admin_pin: '' });
  
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // -- حالات شاشة الإدارة --
  const [adminView, setAdminView] = useState('workers'); 
  const [activeMainCat, setActiveMainCat] = useState(null);
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [newMainName, setNewMainName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  
  // نموذج إدخال المنتجات
  const [formData, setFormData] = useState({ 
    name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false 
  });
  const [editingItem, setEditingItem] = useState(null);
  
  // نموذج إدخال العمال (مع الإضافات الجديدة)
  const [workerForm, setWorkerForm] = useState({ 
    name: '', phone: '', details: '', image: '', region: '', city: '', 
    profession: '', portfolio_img: '', safety_details: '', rating: '5.0', is_busy: false 
  });
  const [editingWorker, setEditingWorker] = useState(null);

  // -- حالات شاشة العميل --
  const [showCart, setShowCart] = useState(false);
  const [showWorkersHaraj, setShowWorkersHaraj] = useState(false); 
  const [clientMain, setClientMain] = useState('');
  const [clientSub, setClientSub] = useState('');
  const [itemQtys, setItemQtys] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // فلاتر العميل وترتيب المنتجات
  const [harajRegion, setHarajRegion] = useState('');
  const [harajCity, setHarajCity] = useState('');
  const [sortOption, setSortOption] = useState('default'); // Default, PriceLow, PriceHigh

  const isAdmin = window.location.pathname.includes('/admin');

  // ==========================================
  // دوال جلب البيانات
  // ==========================================
  useEffect(() => { 
    fetchAllData(); 
  }, []); 

  useEffect(() => { 
    if (alert) { 
      const timer = setTimeout(() => setAlert(null), 4000); 
      return () => clearTimeout(timer); 
    } 
  }, [alert]);

  const fetchAllData = async () => {
    try {
      const pRes = await fetch(`${API_URL}/products`);
      const cRes = await fetch(`${API_URL}/categories`);
      const wRes = await fetch(`${API_URL}/workers`);
      const sRes = await fetch(`${API_URL}/settings`);
      
      const catsData = await cRes.json();
      
      setProducts(await pRes.json());
      setCategories(catsData);
      setWorkers(await wRes.json());
      setSettings(await sRes.json());
      
      // تعيين القسم الافتراضي للعميل
      if (!isAdmin && catsData.length > 0 && !clientMain) {
         const mainCategories = catsData.filter(c => !c.parent);
         if (mainCategories.length > 0) {
           setClientMain(mainCategories[0].name);
           const subCategories = catsData.filter(c => c.parent === mainCategories[0].name);
           if (subCategories.length > 0) {
             setClientSub(subCategories[0].name);
           }
         }
      }
    } catch (error) { 
      console.error("Data Fetch Error:", error); 
    }
  };

  // ==========================================
  // دوال إدارة العمال والمقاولين
  // ==========================================
  const handleSaveWorker = async () => {
    if (!workerForm.name || !workerForm.phone) {
      setAlert("⚠️ يرجى إدخال اسم العامل ورقم الجوال كحد أدنى");
      return;
    }
    
    if (workerForm.region && !workerForm.city) {
      setAlert("⚠️ يرجى كتابة اسم المحافظة بما أنك اخترت المنطقة");
      return;
    }
    
    const method = editingWorker ? 'PUT' : 'POST';
    const url = editingWorker ? `${API_URL}/workers/${editingWorker.id}` : `${API_URL}/workers`;
    
    // الاحتفاظ بحالة الإخفاء إذا كان تعديلاً
    const bodyPayload = editingWorker ? { ...workerForm, hidden: editingWorker.hidden } : workerForm;
    
    try {
      const response = await fetch(url, { 
        method: method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(bodyPayload) 
      });
      
      if (!response.ok) {
        throw new Error('فشل الحفظ في قاعدة البيانات');
      }
      
      setAlert("✅ تم حفظ العامل في الحراج بنجاح!");
      setWorkerForm({ 
        name: '', phone: '', details: '', image: '', region: '', city: '', 
        profession: '', portfolio_img: '', safety_details: '', rating: '5.0', is_busy: false 
      });
      setEditingWorker(null);
      fetchAllData();
      
    } catch (error) { 
      setAlert("❌ حدث خطأ، يرجى المحاولة مرة أخرى."); 
      console.error(error);
    }
  };

  const handleToggleWorker = async (worker) => {
    try {
      await fetch(`${API_URL}/workers/${worker.id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...worker, hidden: !worker.hidden }) 
      });
      fetchAllData();
    } catch (error) {
      setAlert("❌ فشل تحديث حالة العامل");
    }
  };

  const handleDeleteWorker = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العامل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) { 
      try {
        await fetch(`${API_URL}/workers/${id}`, { method: 'DELETE' }); 
        setAlert("🗑️ تم الحذف بنجاح");
        fetchAllData(); 
      } catch (error) {
        setAlert("❌ فشل الحذف");
      }
    }
  };

  // معالجة الصور
  const handleImageUpload = (e, targetField, isWorker = false) => {
    const file = e.target.files[0]; 
    if (!file) return;
    
    const reader = new FileReader(); 
    reader.readAsDataURL(file);
    
    reader.onload = (event) => { 
      if (isWorker) {
        setWorkerForm({ ...workerForm, [targetField]: event.target.result });
      } else {
        const img = new Image(); 
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas'); 
          canvas.width = 500; 
          canvas.height = img.height * (500 / img.width);
          const ctx = canvas.getContext('2d'); 
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setFormData({ ...formData, [targetField]: canvas.toDataURL('image/jpeg', 0.6) });
        };
      }
    };
  };

  const handleClientContactWorker = async (worker) => {
    try {
      await fetch(`${API_URL}/workers/${worker.id}/click`, { method: 'PUT' });
    } catch (e) {
      console.log("Failed to track click");
    }
    window.open(`https://wa.me/${worker.phone}?text=مرحباً، أريد الاستفسار عن خدماتك عبر منصة ${settings.shop_name}`);
    setTimeout(fetchAllData, 1000);
  };

  // ==========================================
  // دوال المنتجات والأقسام
  // ==========================================
  const handleAddMainCategory = async () => {
    if (!newMainName) {
      setAlert("⚠️ يرجى كتابة اسم القسم");
      return;
    }
    await fetch(`${API_URL}/categories`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ name: newMainName, icon: '📁', parent: '' }) 
    });
    setNewMainName(''); 
    fetchAllData();
  };

  const handleAddSubCategory = async () => {
    if (!newSubName) {
      setAlert("⚠️ يرجى كتابة اسم القسم الفرعي");
      return;
    }
    await fetch(`${API_URL}/categories`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ name: newSubName, icon: '📂', parent: activeMainCat.name }) 
    });
    setNewSubName(''); 
    fetchAllData();
  };

  const handleDeleteCategory = async (id) => { 
    if (window.confirm("تحذير: سيتم حذف هذا القسم. هل أنت متأكد؟")) { 
      await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' }); 
      fetchAllData(); 
      setActiveSubCat(null); 
    } 
  };

  const handleSaveProduct = async () => {
    if (!formData.name) {
      setAlert("⚠️ يرجى إدخال اسم المنتج");
      return;
    }
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    const productPayload = { ...formData, category: activeSubCat.name };
    
    await fetch(url, { 
      method: method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(productPayload) 
    });
    
    setAlert("✅ تم حفظ المنتج بنجاح"); 
    setEditingItem(null); 
    setFormData({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false }); 
    fetchAllData();
  };

  const handleDeleteProduct = async (id) => { 
    if (window.confirm("هل أنت متأكد من حذف المنتج نهائياً؟")) { 
      await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }); 
      fetchAllData(); 
    } 
  };

  const updateInventoryFast = async (product, change) => {
    let newStock = Number(product.stock) + change; 
    let newSold = Number(product.sold || 0);
    
    if (newStock < 0) newStock = 0; 
    if (change < 0 && Number(product.stock) > 0) newSold += Math.abs(change);
    
    await fetch(`${API_URL}/products/${product.id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ ...product, stock: newStock, sold: newSold }) 
    }); 
    fetchAllData();
  };

  // ==========================================
  // دوال سلة المشتريات
  // ==========================================
  const addToCart = (product, qty = 1) => {
    const customQty = itemQtys[product.id] || qty;
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingIndex >= 0) { 
      const newCart = [...cart]; 
      newCart[existingIndex].qty += customQty; 
      setCart(newCart); 
    } else { 
      setCart([...cart, { ...product, qty: customQty }]); 
    }
    
    setAlert(`✅ تمت إضافة ${customQty} إلى السلة`); 
    setItemQtys(prev => ({ ...prev, [product.id]: 1 })); 
    setSelectedProduct(null); 
  };

  const updateCartItemQuantity = (index, change) => {
    const newCart = [...cart]; 
    newCart[index].qty += change;
    if (newCart[index].qty <= 0) {
      newCart.splice(index, 1); 
    }
    setCart(newCart);
  };

  const handleProductQuantityChange = (id, change) => { 
    setItemQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + change) })); 
  };

  const calculateDiscountPercentage = (oldPrice, newPrice) => { 
    if (!oldPrice || oldPrice <= newPrice) return null; 
    return Math.round(((oldPrice - newPrice) / oldPrice) * 100); 
  };

  // متغيرات عامة
  const mainCategoriesList = categories.filter(c => !c.parent);

  // حساب إحصائيات الإدارة العلوية (Dashboard Stats)
  const totalSystemProducts = products.length;
  const totalSystemWorkers = workers.length;
  const totalSystemProfits = products.reduce((sum, p) => sum + ((Number(p.sold) || 0) * Number(p.price)), 0);

  // =========================================================================
  // 💻 واجهة الإدارة الشاملة (Admin ERP Panel)
  // =========================================================================
  if (isAdmin) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          <div className="login-box glass-effect">
            <h1 className="gradient-text-large">الإدارة المركزية</h1>
            <p className="sub-login">يرجى إدخال الرقم السري للوصول للنظام</p>
            <input 
              className="login-input" 
              type="password" 
              placeholder="الرمز السري..." 
              value={pinInput} 
              onChange={e => setPinInput(e.target.value)} 
            />
            <button onClick={() => { 
              if (pinInput === settings.admin_pin) {
                setIsAuthenticated(true);
              } else {
                setAlert("❌ رمز الدخول خاطئ!");
              }
            }}>
              دخول آمن 🗝️
            </button>
            <a href="/" className="login-back-link">العودة للمتجر 🏠</a>
          </div>
          {alert && <div className="toast-notification">{alert}</div>}
        </div>
      );
    }

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        
        {/* الشريط الجانبي (القائمة) */}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ لوحة التحكم</div>
          
          <nav className="side-nav">
            <button className={adminView === 'workers' ? 'active' : ''} onClick={() => setAdminView('workers')}>
              👷‍♂️ إدارة حراج العمال
            </button>
            <button className={adminView === 'categories' ? 'active' : ''} onClick={() => {setAdminView('categories'); setActiveMainCat(null); setActiveSubCat(null); setEditingItem(null);}}>
              🗂️ إدارة الأقسام والمنتجات
            </button>
            <button className={adminView === 'inventory' ? 'active' : ''} onClick={() => setAdminView('inventory')}>
              📦 إدارة المخزون السريع
            </button>
            <button className={adminView === 'reports' ? 'active' : ''} onClick={() => setAdminView('reports')}>
              📊 التقارير والأرباح
            </button>
            <button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>
              ⚙️ إعدادات المتجر
            </button>
          </nav>
          
          <div className="side-footer">
            <a href="/">🌐 فتح صفحة العملاء</a>
          </div>
        </aside>

        {/* مساحة العمل الرئيسية */}
        <main className="content-70">
          
          {/* شريط الإحصائيات العلوي (ميزة جديدة) */}
          <div className="admin-top-dashboard">
            <div className="dash-card">
              <h4>المنتجات المسجلة</h4>
              <h2>{totalSystemProducts} <span>منتج</span></h2>
            </div>
            <div className="dash-card">
              <h4>العمال والمقاولين</h4>
              <h2>{totalSystemWorkers} <span>عامل</span></h2>
            </div>
            <div className="dash-card highlight-card">
              <h4>إجمالي أرباح المبيعات</h4>
              <h2>{totalSystemProfits} <span>ر.س</span></h2>
            </div>
          </div>

          {/* ==================== 1. حراج العمال ==================== */}
          {adminView === 'workers' && (
            <div className="panel-card fade-in">
              <h2>👷‍♂️ إدارة حراج العمال (إضافة عامل جديد)</h2>
              
              <div className="product-entry-form" style={{flexDirection: 'column'}}>
                <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                  
                  {/* قسم صور العامل */}
                  <div className="worker-images-upload" style={{flex: '0 0 200px'}}>
                    <div className="img-upload-box mb-20">
                      {workerForm.image ? <img src={workerForm.image} alt="worker"/> : <div className="img-ph">الصورة (اختياري)</div>}
                      <label className="upload-label">
                        صورة شخصية 
                        <input type="file" onChange={(e) => handleImageUpload(e, 'image', true)} style={{display:'none'}}/>
                      </label>
                    </div>
                    <div className="img-upload-box">
                      {workerForm.portfolio_img ? <img src={workerForm.portfolio_img} alt="portfolio"/> : <div className="img-ph" style={{background:'#e8f4f8'}}>أعمال سابقة</div>}
                      <label className="upload-label">
                        صور أعماله 
                        <input type="file" onChange={(e) => handleImageUpload(e, 'portfolio_img', true)} style={{display:'none'}}/>
                      </label>
                    </div>
                  </div>
                  
                  {/* قسم بيانات العامل */}
                  <div className="data-entry-box" style={{flex: '1'}}>
                    <div className="f-row">
                      <input 
                        className="f-input" 
                        placeholder="اسم العامل رباعي (مطلوب)..." 
                        value={workerForm.name} 
                        onChange={e => setWorkerForm({...workerForm, name: e.target.value})}
                      />
                      <input 
                        className="f-input" 
                        placeholder="المهنة (اختياري: سباك، كهربائي)..." 
                        value={workerForm.profession} 
                        onChange={e => setWorkerForm({...workerForm, profession: e.target.value})}
                      />
                    </div>
                    
                    <div className="f-row">
                      <input 
                        className="f-input" 
                        placeholder="رقم الجوال (مطلوب للتواصل)..." 
                        value={workerForm.phone} 
                        onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}
                      />
                      <select 
                        className="f-input" 
                        value={workerForm.region} 
                        onChange={e => setWorkerForm({...workerForm, region: e.target.value})}
                      >
                        <option value="">-- المنطقة --</option>
                        <option value="الرياض">الرياض</option>
                        <option value="مكة المكرمة">مكة المكرمة</option>
                        <option value="المدينة المنورة">المدينة المنورة</option>
                        <option value="الشرقية">الشرقية</option>
                        <option value="القصيم">القصيم</option>
                        <option value="عسير">عسير</option>
                        <option value="تبوك">تبوك</option>
                        <option value="حائل">حائل</option>
                        <option value="الحدود الشمالية">الحدود الشمالية</option>
                        <option value="جازان">جازان</option>
                        <option value="نجران">نجران</option>
                        <option value="الباحة">الباحة</option>
                        <option value="الجوف">الجوف</option>
                      </select>
                      <input 
                        className="f-input" 
                        placeholder="اسم المحافظة أو المدينة..." 
                        value={workerForm.city} 
                        onChange={e => setWorkerForm({...workerForm, city: e.target.value})}
                      />
                    </div>

                    <div className="f-row">
                      <input 
                        className="f-input" 
                        type="number"
                        placeholder="التقييم (مثال: 4.8) - اختياري" 
                        value={workerForm.rating} 
                        step="0.1" max="5" min="1"
                        onChange={e => setWorkerForm({...workerForm, rating: e.target.value})}
                      />
                      <button 
                        className={`t-btn ${workerForm.is_busy ? 'active-out' : 'active-green'}`} 
                        onClick={() => setWorkerForm({...workerForm, is_busy: !workerForm.is_busy})}
                      >
                        {workerForm.is_busy ? '🔴 حالة العامل: مشغول حالياً' : '🟢 حالة العامل: متاح الآن'}
                      </button>
                    </div>

                    <textarea 
                      className="f-input full" 
                      rows="2" 
                      placeholder="نبذة عن العامل وخبراته..." 
                      value={workerForm.details} 
                      onChange={e => setWorkerForm({...workerForm, details: e.target.value})}
                    ></textarea>
                    
                    <textarea 
                      className="f-input full" 
                      rows="2" 
                      placeholder="أدوات السلامة والسيفتي المتبعة..." 
                      value={workerForm.safety_details} 
                      onChange={e => setWorkerForm({...workerForm, safety_details: e.target.value})}
                    ></textarea>
                    
                    <button className="save-btn" onClick={handleSaveWorker}>
                      {editingWorker ? 'تحديث بيانات العامل 💾' : 'إضافة عامل جديد للمنصة ➕'}
                    </button>
                  </div>
                </div>
              </div>
              
              <h3 className="mt-30">سجل العمال والفنيين:</h3>
              <div className="folders-grid">
                {workers.map(worker => (
                  <div key={worker.id} className={`worker-admin-card ${worker.hidden ? 'dimmed' : ''}`} style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                    
                    <div style={{display: 'flex', gap: '15px', width: '100%'}}>
                      {worker.image ? (
                        <img src={worker.image} alt={worker.name} />
                      ) : (
                        <div className="default-avatar-small">👷‍♂️</div>
                      )}
                      
                      <div className="w-info">
                        <h4>
                          {worker.name} 
                          <span style={{color:'var(--gold)', fontSize:'0.9rem', marginRight:'5px'}}>({worker.profession})</span>
                        </h4>
                        <p className="w-loc">📍 {worker.region} - {worker.city}</p>
                        <p style={{fontSize:'0.9rem'}}>
                          ⭐️ {worker.rating} | {worker.is_busy ? '🔴 مشغول' : '🟢 متاح'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="worker-stats-bar">
                      📊 تم التواصل معه عبر التطبيق: <b>{worker.contact_clicks || 0}</b> مرة
                    </div>

                    <div className="w-actions" style={{width: '100%', marginTop: '10px', justifyContent: 'center'}}>
                      <button className="act-btn edit" onClick={() => {
                        setEditingWorker(worker); 
                        setWorkerForm(worker);
                      }}>✏️ تعديل</button>
                      
                      <button className="act-btn hide" onClick={() => handleToggleWorker(worker)}>
                        {worker.hidden ? '👁️ إظهار' : '🚫 إخفاء'}
                      </button>
                      
                      <button className="act-btn del" onClick={() => handleDeleteWorker(worker.id)}>
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 2. الإعدادات ==================== */}
          {adminView === 'settings' && (
            <div className="panel-card fade-in">
              <h2>⚙️ إعدادات النظام وتحديث المتجر</h2>
              <div className="settings-grid">
                <div className="form-group">
                  <label>اسم المتجر (يظهر في الأعلى)</label>
                  <input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/>
                </div>
                <div className="form-group">
                  <label>رقم جوال الإدارة لاستقبال الطلبات (واتساب)</label>
                  <input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/>
                </div>
                <div className="form-group">
                  <label>الرقم السري للوحة الإدارة</label>
                  <input value={settings.admin_pin} onChange={e => setSettings({...settings, admin_pin: e.target.value})}/>
                </div>
              </div>
              <button className="save-btn full-w-btn" onClick={async () => {
                await fetch(`${API_URL}/settings`, {
                  method: 'PUT', 
                  headers: { 'Content-Type': 'application/json' }, 
                  body: JSON.stringify(settings)
                }); 
                setAlert("✅ تم حفظ الإعدادات بنجاح");
              }}>حفظ التعديلات 💾</button>
            </div>
          )}
          
          {/* ==================== 3. الأقسام والمنتجات ==================== */}
          {adminView === 'categories' && (
            <div className="fade-in">
              
              {/* المستوى 1: الأقسام الرئيسية */}
              {!activeMainCat ? (
                <div className="panel-card">
                  <h2>1. إضافة الأقسام الرئيسية (مثال: كهرباء، سباكة)</h2>
                  <div className="add-row mb-20">
                    <input 
                      placeholder="اسم القسم الرئيسي..." 
                      value={newMainName} 
                      onChange={e => setNewMainName(e.target.value)}
                    />
                    <button className="add-btn" onClick={handleAddMainCategory}>إضافة قسم ➕</button>
                  </div>
                  
                  <div className="folders-grid">
                    {mainCategoriesList.map(category => (
                      <div key={category.id} className="folder-card main" onClick={() => setActiveMainCat(category)}>
                        <h3>{category.name}</h3>
                        <button className="del-btn-corner" onClick={(e) => {
                          e.stopPropagation(); 
                          handleDeleteCategory(category.id);
                        }}>حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : 
              
              {/* المستوى 2: الأقسام الفرعية */}
              !activeSubCat ? (
                <div className="panel-card">
                  <button className="back-btn" onClick={() => setActiveMainCat(null)}>🔙 رجوع للأقسام الرئيسية</button>
                  <h2>2. الأقسام الفرعية التابعة لقسم ({activeMainCat.name})</h2>
                  
                  <div className="add-row mb-20">
                    <input 
                      placeholder="اسم القسم الفرعي (مثال: أفياش)..." 
                      value={newSubName} 
                      onChange={e => setNewSubName(e.target.value)}
                    />
                    <button className="add-btn" onClick={handleAddSubCategory}>إضافة قسم ➕</button>
                  </div>
                  
                  <div className="folders-grid">
                    {categories.filter(c => c.parent === activeMainCat.name).map(category => (
                      <div key={category.id} className="folder-card sub" onClick={() => setActiveSubCat(category)}>
                        <h3>{category.name}</h3>
                        <button className="del-btn-corner" onClick={(e) => {
                          e.stopPropagation(); 
                          handleDeleteCategory(category.id);
                        }}>حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : 
              
              {/* المستوى 3: المنتجات */}
              (
                <div className="panel-card">
                  <button className="back-btn" onClick={() => {
                    setActiveSubCat(null); 
                    setEditingItem(null); 
                    setFormData({name:'', price:'', old_price:'', stock:'', details:'', image:'', is_sale:false, out_of_stock:false});
                  }}>🔙 رجوع للأقسام الفرعية</button>
                  
                  <div className="path-header">مسار الإضافة: {activeMainCat.name} ⬅️ {activeSubCat.name}</div>
                  
                  <div className="product-entry-form">
                    <div className="img-upload-box">
                      {formData.image ? <img src={formData.image} alt="prod"/> : <div className="img-ph">صورة المنتج</div>}
                      <label className="upload-label">
                        اختيار صورة 
                        <input type="file" onChange={(e) => handleImageUpload(e, 'image', false)} style={{display:'none'}}/>
                      </label>
                    </div>
                    
                    <div className="data-entry-box">
                      <input 
                        className="f-input full" 
                        placeholder="اسم المنتج بالكامل..." 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                      
                      <textarea 
                        className="f-input full" 
                        rows="3" 
                        placeholder="تفاصيل ومواصفات المنتج لكي تظهر للعميل في النافذة المنبثقة..." 
                        value={formData.details} 
                        onChange={e => setFormData({...formData, details: e.target.value})}
                      ></textarea>
                      
                      <div className="f-row">
                        <input 
                          className="f-input" 
                          type="number" 
                          placeholder="السعر الحالي (ر.س)" 
                          value={formData.price} 
                          onChange={e => setFormData({...formData, price: e.target.value})}
                        />
                        <input 
                          className="f-input" 
                          type="number" 
                          placeholder="السعر القديم (لإظهار نسبة الخصم)" 
                          value={formData.old_price} 
                          onChange={e => setFormData({...formData, old_price: e.target.value})}
                        />
                        <input 
                          className="f-input" 
                          type="number" 
                          placeholder="الكمية المتوفرة حالياً" 
                          value={formData.stock} 
                          onChange={e => setFormData({...formData, stock: e.target.value})}
                        />
                      </div>
                      
                      <div className="f-toggles">
                        <button 
                          className={`t-btn ${formData.is_sale ? 'active' : ''}`} 
                          onClick={() => setFormData({...formData, is_sale: !formData.is_sale})}
                        >🔥 يشمل عرض خاص</button>
                        <button 
                          className={`t-btn ${formData.out_of_stock ? 'active-out' : ''}`} 
                          onClick={() => setFormData({...formData, out_of_stock: !formData.out_of_stock})}
                        >🚫 نفدت الكمية</button>
                        <button className="save-btn" onClick={handleSaveProduct}>
                          {editingItem ? 'تحديث بيانات المنتج 💾' : 'حفظ المنتج للمتجر 📦'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mini-products-list mt-30">
                    <h3 style={{color:'var(--navy)'}}>المنتجات الحالية في هذا القسم:</h3>
                    {products.filter(p => p.category === activeSubCat.name).map(product => (
                      <div key={product.id} className="m-prod-row" onClick={() => {
                        setEditingItem(product); 
                        setFormData(product);
                      }}>
                        <img src={product.image || 'https://via.placeholder.com/50'} alt=""/>
                        <b>{product.name}</b>
                        <span style={{color:'var(--green)', fontWeight:'bold'}}>{product.price} ر.س</span>
                        <button className="del-btn-sq" onClick={(e) => {
                          e.stopPropagation(); 
                          handleDeleteProduct(product.id);
                        }}>حذف 🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* ==================== 4. الجرد والمخزون ==================== */}
          {adminView === 'inventory' && (
            <div className="panel-card fade-in">
              <h2>📦 إدارة المخزون والمبيعات السريعة</h2>
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>اسم المنتج</th>
                    <th>المخزون المتبقي</th>
                    <th>الكمية المباعة</th>
                    <th>إجراء سريع للصندوق</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td className="stk-td">{product.stock}</td>
                      <td className="sld-td">{product.sold || 0}</td>
                      <td className="act-td">
                        <button className="btn-minus" onClick={() => updateInventoryFast(product, -1)}>-1 (تسجيل بيع)</button>
                        <button className="btn-plus" onClick={() => updateInventoryFast(product, 1)}>+1 (تزويد المستودع)</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* ==================== 5. التقارير المالية المفصولة ==================== */}
          {adminView === 'reports' && (
            <div className="panel-card fade-in">
              <h2>📊 التقارير المالية الذكية (مفصولة بالأقسام)</h2>
              
              <div className="reports-split-container">
                {mainCategoriesList.map(mainCat => {
                  
                  const subCategoryNames = categories.filter(c => c.parent === mainCat.name).map(x => x.name);
                  const myProducts = products.filter(p => subCategoryNames.includes(p.category));
                  
                  const sectionProfit = myProducts.reduce((sum, item) => sum + ((Number(item.sold) || 0) * Number(item.price)), 0);
                  const sectionSoldQty = myProducts.reduce((sum, item) => sum + (Number(item.sold) || 0), 0);

                  return (
                    <div key={mainCat.id} className="report-main-section">
                      <h3 className="r-header">تقرير المبيعات لقسم: {mainCat.name}</h3>
                      
                      <div className="report-kpi-grid">
                        <div className="kpi-box light-blue">
                           <h4>إجمالي الأرباح المحققة</h4>
                           <h2>{sectionProfit} ر.س</h2>
                        </div>
                        <div className="kpi-box light-gold">
                           <h4>عدد القطع المباعة</h4>
                           <h2>{sectionSoldQty} قطعة</h2>
                        </div>
                      </div>

                      <table className="pro-table">
                        <thead>
                          <tr>
                            <th>المنتج</th>
                            <th>القسم الفرعي</th>
                            <th>المتبقي</th>
                            <th>المباع</th>
                            <th>أرباح المنتج</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myProducts.length === 0 && (
                            <tr><td colSpan="5" style={{textAlign:'center', color:'#888'}}>لا توجد بيانات مسجلة لهذا القسم بعد.</td></tr>
                          )}
                          {myProducts.map(product => (
                            <tr key={product.id}>
                              <td>{product.name}</td>
                              <td><span className="sc-badge">{product.category}</span></td>
                              <td className="stk-td">{product.stock}</td>
                              <td className="sld-td">{product.sold || 0}</td>
                              <td className="profit-td">{(Number(product.sold) || 0) * Number(product.price)} ر.س</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================================
  // 💻 واجهة العميل (Storefront) - المليئة بالميزات
  // =========================================================================
  
  // ترتيب المنتجات للعميل
  let processedProducts = products;
  
  if (searchQuery) {
    processedProducts = processedProducts.filter(p => p.name.includes(searchQuery));
  } else {
    processedProducts = processedProducts.filter(p => p.category === clientSub);
  }

  if (sortOption === 'priceLow') {
    processedProducts.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortOption === 'priceHigh') {
    processedProducts.sort((a, b) => Number(b.price) - Number(a.price));
  }

  // فلترة العمال (إجبارية وذكية)
  const availableWorkers = workers.filter(w => !w.hidden);
  const availableRegionsList = [...new Set(availableWorkers.map(w => w.region).filter(Boolean))];
  const availableCitiesList = harajRegion ? [...new Set(availableWorkers.filter(w => w.region === harajRegion).map(w => w.city).filter(Boolean))] : [];
  
  // حجب العمال حتى يتم اختيار المنطقة والمحافظة
  const filteredWorkersList = availableWorkers.filter(w => {
    if (!harajRegion || !harajCity) return false; 
    return w.region === harajRegion && w.city === harajCity;
  });

  return (
    <div className={`App client-theme ${showCart || selectedProduct || showWorkersHaraj ? 'no-scroll' : ''}`}>
      
      {/* الشريط العلوي للعميل */}
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         
         <div className="search-bar-wrapper">
           <input 
             placeholder="🔍 ابحث عن اسم المنتج هنا..." 
             value={searchQuery} 
             onChange={e => setSearchQuery(e.target.value)} 
           />
         </div>
         
         <button className="worker-haraj-btn" onClick={() => {
           setShowWorkersHaraj(true); 
           setHarajRegion(''); 
           setHarajCity('');
         }}>
           👷‍♂️ <span className="hide-mobile">حراج العمال</span>
         </button>
         
         <button className="open-cart-large desktop-only" onClick={() => setShowCart(true)}>
           🛒 السلة <span>{cart.length}</span>
         </button>
      </header>
      
      {/* شريط الأقسام للعميل */}
      {!searchQuery && (
        <>
          <div className="client-main-bar">
            {mainCategoriesList.map(cat => (
              <button 
                key={cat.id} 
                className={clientMain === cat.name ? 'active' : ''} 
                onClick={() => { 
                  setClientMain(cat.name); 
                  const subCategories = categories.filter(x => x.parent === cat.name); 
                  if (subCategories.length > 0) setClientSub(subCategories[0].name); 
                  else setClientSub(''); 
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          {categories.filter(c => c.parent === clientMain).length > 0 && (
            <div className="client-sub-bar">
              {categories.filter(c => c.parent === clientMain).map(subCat => (
                <button 
                  key={subCat.id} 
                  className={clientSub === subCat.name ? 'active' : ''} 
                  onClick={() => setClientSub(subCat.name)}
                >
                  {subCat.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* مساحة العرض الرئيسية */}
      <div className="gallery-container">
        
        {/* شريط الترتيب (ميزة جديدة) */}
        <div className="store-toolbar">
          {searchQuery ? <h2 className="search-title">نتائج البحث:</h2> : <div></div>}
          <div className="sort-dropdown">
            <label>ترتيب حسب:</label>
            <select value={sortOption} onChange={e => setSortOption(e.target.value)}>
              <option value="default">الافتراضي</option>
              <option value="priceLow">السعر: من الأرخص للأغلى</option>
              <option value="priceHigh">السعر: من الأغلى للأرخص</option>
            </select>
          </div>
        </div>
        
        {processedProducts.length === 0 ? (
          <div className="empty-state">
            <div style={{fontSize:'4rem', marginBottom:'15px'}}>🧐</div>
            <h3>لم نتمكن من إيجاد شيء هنا. يتم تحديث المنتجات باستمرار!</h3>
          </div>
        ) : (
          <div className="p-grid-royal">
            {processedProducts.map(product => {
              const discountPercentage = calculateDiscountPercentage(product.old_price, product.price);
              const isStockLow = Number(product.stock) > 0 && Number(product.stock) <= 3;
              const isBestSeller = Number(product.sold) >= 5; // ميزة الوسام التلقائي
              
              return (
                <div key={product.id} className="royal-p-card" onClick={() => setSelectedProduct(product)}>
                  
                  {product.out_of_stock && <div className="sold-tag">نفدت الكمية</div>}
                  {product.is_sale && <div className="fire-inline">🔥 عرض خاص</div>}
                  {discountPercentage && <div className="discount-badge">خصم {discountPercentage}%</div>}
                  
                  {/* وسام الأكثر مبيعاً */}
                  {isBestSeller && !product.out_of_stock && <div className="best-seller-badge">👑 الأكثر مبيعاً</div>}
                  
                  <div className="p-img-box"><img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} /></div>
                  
                  <div className="p-info-box">
                    <h4>{product.name}</h4>
                    <div className="price-area">
                      <span className="now-price">{product.price} ر.س</span>
                      {Number(product.old_price) > 0 && <del className="old-price">{product.old_price}</del>}
                    </div>
                    
                    {isStockLow && !product.out_of_stock && (
                      <div className="low-stock-alert">⏳ سارع بالطلب! باقي {product.stock} فقط</div>
                    )}
                    
                    <div className="action-area">
                      {!product.out_of_stock && (
                        <div className="qty-controls" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleProductQuantityChange(product.id, 1)}>+</button>
                          <span>{itemQtys[product.id] || 1}</span>
                          <button onClick={() => handleProductQuantityChange(product.id, -1)}>-</button>
                        </div>
                      )}
                      
                      <button 
                        className={`add-btn-p ${product.out_of_stock ? 'disabled' : ''}`} 
                        disabled={product.out_of_stock} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!product.out_of_stock) addToCart(product); 
                        }}
                      >
                        {product.out_of_stock ? 'غير متوفر حالياً' : 'أضف للسلة 🛒'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      
      {/* شريط السلة للموبايل */}
      {cart.length > 0 && (
        <div className="mobile-sticky-cart" onClick={() => setShowCart(true)}>
          <div className="m-cart-info">🛒 في السلة: <b>{cart.length}</b> منتجات</div>
          <div className="m-cart-total">{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س</div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🌟 نافذة حراج العمال للعميل (Modal) */}
      {/* ========================================================= */}
      {showWorkersHaraj && (
        <div className="product-modal-overlay" onClick={() => setShowWorkersHaraj(false)}>
          <div className="worker-haraj-modal fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="haraj-header">
              <h2>👷‍♂️ حراج العمال والفنيين</h2>
              <button onClick={() => setShowWorkersHaraj(false)}>✕</button>
            </div>
            
            <div className="haraj-filters">
              <select value={harajRegion} onChange={e => { setHarajRegion(e.target.value); setHarajCity(''); }}>
                <option value="">🌍 1. اختر منطقتك أولاً...</option>
                {availableRegionsList.map(region => <option key={region} value={region}>{region}</option>)}
              </select>
              <select value={harajCity} onChange={e => setHarajCity(e.target.value)} disabled={!harajRegion}>
                <option value="">🏙️ 2. ثم اختر المحافظة لإظهار العمال...</option>
                {availableCitiesList.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <div className="workers-list-client">
              {!harajRegion ? (
                <div className="empty-msg">
                  <span style={{fontSize:'3rem'}}>🗺️</span>
                  <p>الرجاء تحديد منطقتك من القائمة أعلاه لنعرض لك العمال المتاحين بالقرب منك.</p>
                </div>
              ) : !harajCity ? (
                <div className="empty-msg">
                  <span style={{fontSize:'3rem'}}>📍</span>
                  <p>الآن، الرجاء تحديد المحافظة أو المدينة لتضييق نطاق البحث.</p>
                </div>
              ) : filteredWorkersList.length === 0 ? (
                <div className="empty-msg">
                  <span style={{fontSize:'3rem'}}>👷‍♂️</span>
                  <p>عذراً، لا يتوفر عمال في هذه المحافظة حالياً. يمكنك تجربة محافظة أخرى قريبة.</p>
                </div>
              ) : (
                filteredWorkersList.map(worker => (
                  <div key={worker.id} className="worker-client-card" style={{flexDirection: 'column'}}>
                    <div style={{display:'flex', gap:'15px', width:'100%', alignItems:'center'}}>
                      
                      {worker.image ? (
                        <img src={worker.image} alt={worker.name} />
                      ) : (
                        <div className="default-avatar">👷‍♂️</div>
                      )}
                      
                      <div className="wc-info">
                        <h3>
                          {worker.name} 
                          <span style={{fontSize:'0.9rem', color:'var(--gold)', marginRight: '5px'}}>
                            ({worker.profession || 'عامل فني'})
                          </span>
                        </h3>
                        <p className="w-loc">📍 يتواجد في: {worker.region} - {worker.city}</p>
                        
                        {/* حالة العامل وتقييمه */}
                        <div className="w-status-row">
                           <span className="w-rating">⭐️ {worker.rating}</span>
                           <span className={`w-avail ${worker.is_busy ? 'busy' : 'free'}`}>
                             {worker.is_busy ? '🔴 مشغول حالياً' : '🟢 متاح للعمل'}
                           </span>
                        </div>
                        
                        {worker.details && <p className="w-details-text">{worker.details}</p>}
                      </div>
                    </div>
                    
                    {worker.safety_details && (
                      <div className="safety-box">
                        🛡️ <b>إجراءات السلامة والأمان:</b> {worker.safety_details}
                      </div>
                    )}
                    
                    {worker.portfolio_img && (
                      <div className="portfolio-box">
                        <b>🖼️ من أعماله السابقة:</b>
                        <img src={worker.portfolio_img} alt="أعمال سابقة" className="pf-img" />
                      </div>
                    )}

                    <button 
                      className="wa-contact-btn" 
                      onClick={() => handleClientContactWorker(worker)}
                    >
                      طلب وتواصل مباشر عبر الواتساب 💬
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🌟 نافذة تفاصيل المنتج للعميل (Modal) */}
      {/* ========================================================= */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content fade-in-up" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="modal-body-split">
              
              <div className="m-img-side">
                {calculateDiscountPercentage(selectedProduct.old_price, selectedProduct.price) && (
                  <div className="m-discount">خصم {calculateDiscountPercentage(selectedProduct.old_price, selectedProduct.price)}%</div>
                )}
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>
              
              <div className="m-details-side">
                <h2>{selectedProduct.name}</h2>
                
                <div className="m-price-box">
                  <span className="m-now">{selectedProduct.price} ر.س</span>
                  {Number(selectedProduct.old_price) > 0 && <del className="m-old">{selectedProduct.old_price} ر.س</del>}
                </div>
                
                <div className="m-desc-box">
                  <h3>التفاصيل والمواصفات:</h3>
                  <div className="m-desc">
                    {selectedProduct.details ? selectedProduct.details : 'لا توجد تفاصيل إضافية مسجلة لهذا المنتج حتى الآن.'}
                  </div>
                </div>
                
                {!selectedProduct.out_of_stock ? (
                  <button className="m-add-btn" onClick={() => addToCart(selectedProduct)}>
                    إضافة للسلة وإكمال التسوق 🛒
                  </button>
                ) : (
                  <button className="m-add-btn disabled" disabled>
                    🚫 عذراً، الكمية نفدت من المخزن
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ========================================================= */}
      {/* 🛒 سلة المشتريات */}
      {/* ========================================================= */}
      {showCart && (
        <div className={`cart-overlay open`}>
          <div className="cart-inner-container">
            
            <div className="cart-header-fixed">
              <h2>سلة المشتريات</h2>
              <button className="close-btn-x" onClick={() => setShowCart(false)}>✕</button>
            </div>
            
            <div className="cart-products-scroll">
              {cart.length === 0 && <p className="empty-cart-msg">سلتك فارغة حالياً 🛒</p>}
              
              {cart.map((item, index) => (
                <div key={index} className="cart-product-row">
                  <img src={item.image} alt="" className="cart-p-img" />
                  
                  <div className="cart-p-details">
                    <div className="cart-p-title">{item.name}</div>
                    <div className="qty-controls-mini">
                      <button onClick={() => updateCartItemQuantity(index, 1)}>+</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateCartItemQuantity(index, -1)}>-</button>
                    </div>
                  </div>
                  
                  <div className="cart-item-total">{item.price * item.qty} ر.س</div>
                </div>
              ))}
            </div>
            
            <div className="cart-action-fixed">
              <div className="total-gold-box">
                الإجمالي المطلوب: <span>{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)}</span> ر.س
              </div>
              <div className="cart-buttons-row">
                <button className="btn-continue-shopping" onClick={() => setShowCart(false)}>عودة للتسوق</button>
                <button className="btn-wa-confirm" onClick={() => {
                  let message = `*طلب جديد من المتجر* 🛒\n\n`; 
                  cart.forEach(c => {
                    message += `▪️ ${c.name}\n   الكمية: ${c.qty} | سعر الوحدة: ${c.price} ر.س\n`;
                  }); 
                  message += `\n*الإجمالي النهائي: ${cart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س*`;
                  window.open(`https://wa.me/${settings.phone}?text=${encodeURIComponent(message)}`);
                }}>
                  تأكيد الطلب (واتساب) ✅
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;