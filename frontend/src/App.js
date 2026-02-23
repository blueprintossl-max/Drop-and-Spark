import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '', shop_name: 'قطرة وشرارة', admin_pin: '123456' });
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // 🛠️ نظام المجلدات للإدارة
  const [adminMode, setAdminMode] = useState('folders'); // folders, reports
  const [activeMainFolder, setActiveMainFolder] = useState(null); // القسم الرئيسي المفتوح
  const [activeSubFolder, setActiveSubFolder] = useState(null);   // القسم الفرعي المفتوح
  
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: 0, image: '', is_sale: false, out_of_stock: false });
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('⚡'); 
  
  // واجهة العميل
  const [showCart, setShowCart] = useState(false);
  const [clientMainCat, setClientMainCat] = useState('');
  const [clientSubCat, setClientSubCat] = useState('');
  const [itemQtys, setItemQtys] = useState({});

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => { fetchProducts(); fetchSettings(); fetchCategories(); }, []); 
  useEffect(() => { if (alert) { const timer = setTimeout(() => setAlert(null), 3000); return () => clearTimeout(timer); } }, [alert]);

  const fetchProducts = () => fetch(`${API_URL}/products`).then(r => r.json()).then(setProducts);
  const fetchSettings = () => fetch(`${API_URL}/settings`).then(r => r.json()).then(setSettings);
  const fetchCategories = () => fetch(`${API_URL}/categories`).then(r => r.json()).then(data => {
    setCategories(data);
    const mainCats = data.filter(c => !c.parent);
    // ضبط الواجهة للعميل للقسم الأول تلقائياً
    if(!isAdmin && mainCats.length > 0 && !clientMainCat) {
       setClientMainCat(mainCats[0].name);
       const subCats = data.filter(c => c.parent === mainCats[0].name);
       if(subCats.length > 0) setClientSubCat(subCats[0].name);
    }
  });

  const handleAddCategory = async (isMain) => {
    if(!newCatName.trim()) return setAlert("⚠️ يرجى كتابة اسم القسم");
    const parent = isMain ? '' : activeMainFolder.name;
    const res = await fetch(`${API_URL}/categories`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: newCatName, icon: newCatIcon, parent }) });
    if(res.ok) { setNewCatName(''); setAlert("✅ تم إضافة القسم"); fetchCategories(); } else { setAlert("❌ القسم موجود مسبقاً"); }
  };

  const handleDeleteCategory = async (id) => {
    if(window.confirm("حذف هذا المجلد؟")) {
      await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
      setAlert("🗑️ تم الحذف"); fetchCategories();
      setActiveSubFolder(null); // الرجوع خطوة للخلف
    }
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("حذف المنتج نهائياً؟")) {
      await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      setAlert("🗑️ تم حذف المنتج"); fetchProducts();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setAlert("⏳ جاري رفع الصورة...");
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas'); const scaleSize = 500 / img.width;
        canvas.width = 500; canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData({ ...formData, image: canvas.toDataURL('image/jpeg', 0.6) }); setAlert("✅ الصورة جاهزة");
      };
    };
  };

  const handleSaveProduct = async () => {
    // إجبار حفظ المنتج في المجلد الفرعي المفتوح حالياً (بدون قائمة منسدلة)
    const finalData = { ...formData, category: activeSubFolder.name }; 
    const res = await fetch(`${API_URL}/products`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(finalData) });
    if (res.ok) { 
      setAlert("✅ تم الحفظ داخل القسم"); 
      setFormData({ name: '', price: '', old_price: '', stock: 0, image: '', is_sale: false, out_of_stock: false });
      fetchProducts();
    }
  };

  const addToCart = (product) => {
    const qty = itemQtys[product.id] || 1;
    const index = cart.findIndex(item => item.id === product.id);
    if (index >= 0) { const newCart = [...cart]; newCart[index].qty += qty; setCart(newCart); } 
    else { setCart([...cart, { ...product, qty }]); }
    setAlert(`✅ أضفت ${qty} للسلة`);
    setItemQtys(prev => ({ ...prev, [product.id]: 1 })); 
  };

  const updateCartQty = (index, change) => {
    const newCart = [...cart]; newCart[index].qty += change;
    if (newCart[index].qty <= 0) newCart.splice(index, 1); setCart(newCart);
  };

  // --- دوال الأقسام للتصفية ---
  const mainCategories = categories.filter(c => !c.parent);
  const adminSubCategories = activeMainFolder ? categories.filter(c => c.parent === activeMainFolder.name) : [];
  const clientSubCategories = clientMainCat ? categories.filter(c => c.parent === clientMainCat) : [];
  const currentFolderProducts = activeSubFolder ? products.filter(p => p.category === activeSubFolder.name) : [];

  // ==========================================
  // 1. الإدارة المتطورة بنظام المجلدات
  // ==========================================
  if (isAdmin) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          {alert && <div className="toast-notification">{alert}</div>}
          <div className="login-box">
            <h1 className="gradient-text-large">الإدارة المركزية</h1>
            <input type="password" placeholder="أدخل الرقم السري..." value={pinInput} onChange={e => setPinInput(e.target.value)} />
            <button onClick={() => { if (pinInput === settings.admin_pin) setIsAuthenticated(true); else setAlert("❌ رمز خاطئ!"); }}>دخول 🗝️</button>
            <a href="/">العودة للمتجر 🏠</a>
          </div>
        </div>
      );
    }

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        
        {/* شريط الأدوات العلوي (مسار المجلدات - Breadcrumbs) */}
        <div className="admin-header">
           <div className="breadcrumbs">
             <button onClick={() => {setActiveMainFolder(null); setActiveSubFolder(null); setAdminMode('folders');}}>📁 الإدارة الرئيسية</button>
             {activeMainFolder && <><span className="separator">/</span> <button onClick={() => setActiveSubFolder(null)}>{activeMainFolder.icon} {activeMainFolder.name}</button></>}
             {activeSubFolder && <><span className="separator">/</span> <span className="current-path">{activeSubFolder.icon} {activeSubFolder.name}</span></>}
           </div>
           <button className="reports-btn" onClick={() => {setAdminMode('reports'); setActiveMainFolder(null); setActiveSubFolder(null);}}>📊 التقارير المالية</button>
        </div>

        <div className="admin-workspace">
          
          {/* شاشة 1: المجلدات الرئيسية */}
          {adminMode === 'folders' && !activeMainFolder && (
            <div className="folder-stage fade-in">
              <h2 className="stage-title">المجلدات الرئيسية (الكهرباء، السباكة...)</h2>
              <div className="folders-grid">
                {mainCategories.map(c => (
                  <div key={c.id} className="big-folder" onClick={() => setActiveMainFolder(c)}>
                    <div className="folder-icon-large">{c.icon}</div>
                    <h3>{c.name}</h3>
                    <button className="del-folder-btn" onClick={(e) => {e.stopPropagation(); handleDeleteCategory(c.id);}}>حذف</button>
                  </div>
                ))}
              </div>
              <div className="add-folder-box">
                <h4>➕ إنشاء مجلد رئيسي جديد</h4>
                <div className="add-row">
                  <select value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)}><option value="⚡">⚡</option><option value="💧">💧</option><option value="🛠️">🛠️</option></select>
                  <input placeholder="اسم القسم الرئيسي..." value={newCatName} onChange={e=>setNewCatName(e.target.value)} />
                  <button onClick={() => handleAddCategory(true)}>إضافة</button>
                </div>
              </div>
            </div>
          )}

          {/* شاشة 2: المجلدات الفرعية داخل القسم الرئيسي */}
          {adminMode === 'folders' && activeMainFolder && !activeSubFolder && (
            <div className="folder-stage fade-in">
              <h2 className="stage-title">الأقسام الفرعية داخل ({activeMainFolder.name})</h2>
              <div className="folders-grid">
                {adminSubCategories.length === 0 && <p className="empty-msg">لا توجد أقسام فرعية هنا. قم بإضافة واحد من الأسفل.</p>}
                {adminSubCategories.map(c => (
                  <div key={c.id} className="big-folder sub-folder" onClick={() => setActiveSubFolder(c)}>
                    <div className="folder-icon-large">{c.icon}</div>
                    <h3>{c.name}</h3>
                    <button className="del-folder-btn" onClick={(e) => {e.stopPropagation(); handleDeleteCategory(c.id);}}>حذف</button>
                  </div>
                ))}
              </div>
              <div className="add-folder-box sub">
                <h4>➕ إنشاء مجلد فرعي داخل ({activeMainFolder.name})</h4>
                <div className="add-row">
                  <select value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)}><option value="🔌">🔌</option><option value="💡">💡</option><option value="🚿">🚿</option></select>
                  <input placeholder="اسم القسم الفرعي (أفياش، إنارة...)" value={newCatName} onChange={e=>setNewCatName(e.target.value)} />
                  <button onClick={() => handleAddCategory(false)}>إضافة</button>
                </div>
              </div>
            </div>
          )}

          {/* شاشة 3: إضافة المنتجات داخل المجلد الفرعي (التصميم المدمج No-Scroll) */}
          {adminMode === 'folders' && activeSubFolder && (
            <div className="workspace-split fade-in">
              
              {/* القسم الأيمن: نموذج الإدخال المدمج (صورة + بيانات) */}
              <div className="entry-form-panel">
                <h2 className="panel-title">➕ إضافة منتج لـ ({activeSubFolder.name})</h2>
                
                <div className="compact-form">
                  <div className="image-side">
                    {formData.image ? <img src={formData.image} alt="Upload" /> : <div className="img-placeholder">📷 صورة المنتج</div>}
                    <label className="upload-btn">رفع صورة <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}}/></label>
                  </div>
                  
                  <div className="inputs-side">
                    <input className="full-w" placeholder="اسم المنتج..." value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                    <div className="row-2">
                      <input type="number" placeholder="السعر الحالي" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                      <input type="number" placeholder="السعر القديم (للعروض)" value={formData.old_price} onChange={e=>setFormData({...formData, old_price:e.target.value})}/>
                    </div>
                    <input className="full-w" type="number" placeholder="المخزون المتوفر بالكرتون/القطعة" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})}/>
                    
                    <div className="toggles-row">
                      <button className={`t-btn ${formData.is_sale?'sale-on':''}`} onClick={()=>setFormData({...formData, is_sale:!formData.is_sale})}>🔥 يشمل العرض</button>
                      <button className={`t-btn ${formData.out_of_stock?'stock-out':''}`} onClick={()=>setFormData({...formData, out_of_stock:!formData.out_of_stock})}>🚫 غير متوفر</button>
                    </div>
                    <button className="save-btn" onClick={handleSaveProduct}>حفظ ورفع للمتجر 📦</button>
                  </div>
                </div>
              </div>

              {/* القسم الأيسر: المنتجات الموجودة حالياً في هذا المجلد لإدارتها */}
              <div className="products-list-panel">
                <h2 className="panel-title">📋 منتجات ({activeSubFolder.name}) الحالية</h2>
                <div className="compact-list">
                  {currentFolderProducts.length === 0 && <p className="empty-msg">المجلد فارغ.</p>}
                  {currentFolderProducts.map(p => (
                    <div key={p.id} className="mini-product-card">
                      <img src={p.image} alt=""/>
                      <div className="meta"><b>{p.name}</b><span>{p.price} ريال | المخزون: {p.stock}</span></div>
                      <button className="del-btn-small" onClick={() => handleDeleteProduct(p.id)}>🗑️</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* شاشة التقارير */}
          {adminMode === 'reports' && (
            <div className="folder-stage fade-in">
              <h2 className="stage-title">📊 التقارير المالية</h2>
              <div className="stats-grid">
                  <div className="stat-card blue"><h3>إجمالي قيمة البضاعة</h3><p>{products.reduce((a,b)=>a+(Number(b.price)*Number(b.stock)),0)} ريال</p></div>
                  <div className="stat-card green"><h3>إجمالي القطع المتوفرة</h3><p>{products.reduce((a,b)=>a+Number(b.stock),0)} قطعة</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. واجهة العميل (المتجر)
  // ==========================================
  const clientProducts = products.filter(p => p.category === clientSubCat);

  return (
    <div className={`App client-theme ${showCart ? 'no-scroll' : ''}`}>
      {alert && <div className="toast-notification">{alert}</div>}
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <button className="open-cart-large" onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>
      
      {/* 1. شريط الأقسام الرئيسية للعميل */}
      <div className="client-main-bar">
        {mainCategories.map(c => (
          <button key={c.id} className={clientMainCat===c.name?'active':''} onClick={()=>{
            setClientMainCat(c.name);
            const sub = categories.filter(subC => subC.parent === c.name);
            if(sub.length > 0) setClientSubCat(sub[0].name); else setClientSubCat('');
          }}>{c.icon} {c.name}</button>
        ))}
      </div>

      {/* 2. شريط الأقسام الفرعية (تحت الرئيسي) */}
      {clientSubCategories.length > 0 && (
        <div className="client-sub-bar">
          {clientSubCategories.map(sc => (
             <button key={sc.id} className={clientSubCat===sc.name?'active':''} onClick={()=>setClientSubCat(sc.name)}>{sc.name}</button>
          ))}
        </div>
      )}
      
      {/* 3. المنتجات الخاصة بالقسم الفرعي المختار */}
      <div className="gallery-container">
        {!clientMainCat ? (
           <div className="coming-soon-card"><h2>مرحباً بك!</h2><h3>اختر قسماً من الأعلى للبدء 🚀</h3></div>
        ) : clientProducts.length === 0 ? (
          <div className="coming-soon-card"><div className="glass-icon">⏳</div><h2 className="gradient-text">قريباً جداً!</h2><h3>نعمل على توفير المنتجات في هذا القسم..</h3></div>
        ) : (
          <div className="p-grid-royal">
            {clientProducts.map(p => (
              <div key={p.id} className="royal-p-card">
                {p.out_of_stock && <div className="sold-tag">نفدت</div>}
                {p.is_sale && <div className="fire-inline">🔥 عرض</div>}
                <div className="p-img-box"><img src={p.image} alt="" /></div>
                <div className="p-info-box">
                  <h4>{p.name}</h4>
                  <div className="price-area"><span className="now-price">{p.price} ريال</span>{Number(p.old_price) > 0 && <del className="old-price">{p.old_price}</del>}</div>
                  {!p.out_of_stock ? (
                    <div className="action-area">
                      <div className="qty-controls"><button onClick={() => handleQtyChange(p.id, 1)}>+</button><span>{itemQtys[p.id] || 1}</span><button onClick={() => handleQtyChange(p.id, -1)}>-</button></div>
                      <button className="add-btn-p" onClick={() => addToCart(p)}>أضف 🛒</button>
                    </div>
                  ) : <button className="add-btn-p disabled" disabled>غير متوفر</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      
      {/* السلة */}
      <div className={`cart-overlay ${showCart ? 'open' : ''}`}>
         <div className="cart-inner-container">
            <div className="cart-header-fixed"><h2>🛍️ سلتك</h2><button className="close-btn-x" onClick={() => setShowCart(false)}>❌</button></div>
            <div className="cart-products-scroll">
               {cart.map((item, i) => (
                 <div key={i} className="cart-product-row">
                   <img src={item.image} alt="" className="cart-p-img" />
                   <div className="cart-p-details"><div>{item.name}</div><div className="qty-controls"><button onClick={() => updateCartQty(i, 1)}>+</button><span>{item.qty}</span><button onClick={() => updateCartQty(i, -1)}>-</button></div></div>
                   <div className="cart-item-total">{item.price * item.qty}</div>
                 </div>
               ))}
            </div>
            <div className="cart-action-fixed">
              <div className="total-gold-box">الإجمالي: <span>{cart.reduce((a,b)=>a+(Number(b.price)*b.qty),0)}</span> ريال</div>
              <div className="cart-buttons-row">
                <button className="btn-continue-shopping" onClick={() => setShowCart(false)}>🛍️ عودة</button>
                <button className="btn-wa-confirm" onClick={() => window.open(`https://wa.me/${settings.phone}?text=طلب جديد...`)}>تأكيد ✅</button>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default App;