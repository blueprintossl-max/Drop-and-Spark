import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '', shop_name: 'قطرة وشرارة', admin_pin: '123456' });
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  const [bumpCart, setBumpCart] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // 🛠️ متغيرات الأقسام المتفرعة
  const [adminView, setAdminView] = useState('inventory'); // inventory, subcategories, settings, reports
  const [adminMainCat, setAdminMainCat] = useState(''); // القسم الأب
  const [adminSubCat, setAdminSubCat] = useState('');   // القسم الابن
  const [adminSearch, setAdminSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: 0, category: '', image: '', is_sale: false, out_of_stock: false });
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('⚡'); 
  
  const [showCart, setShowCart] = useState(false);
  const [clientMainCat, setClientMainCat] = useState('الكل');
  const [clientSubCat, setClientSubCat] = useState('الكل');
  const [itemQtys, setItemQtys] = useState({});

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => {
    fetchProducts(); fetchSettings(); fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (alert) { const timer = setTimeout(() => setAlert(null), 3000); return () => clearTimeout(timer); }
  }, [alert]);

  const fetchProducts = () => fetch(`${API_URL}/products`).then(r => r.json()).then(setProducts);
  const fetchSettings = () => fetch(`${API_URL}/settings`).then(r => r.json()).then(setSettings);
  const fetchCategories = () => fetch(`${API_URL}/categories`).then(r => r.json()).then(data => {
    setCategories(data);
    const mainCats = data.filter(c => !c.parent);
    if(mainCats.length > 0 && !adminMainCat) setAdminMainCat(mainCats[0].name);
  });

  const handleAddMainCategory = async () => {
    if(!newCatName.trim()) return setAlert("⚠️ يرجى كتابة اسم القسم الرئيسي");
    const res = await fetch(`${API_URL}/categories`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: newCatName, icon: newCatIcon, parent: '' }) });
    if(res.ok) { setNewCatName(''); setAlert("✅ تم إضافة القسم الرئيسي"); fetchCategories(); } else { setAlert("❌ القسم موجود"); }
  };

  const handleAddSubCategory = async () => {
    if(!newCatName.trim()) return setAlert("⚠️ يرجى كتابة اسم القسم الفرعي");
    const res = await fetch(`${API_URL}/categories`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: newCatName, icon: newCatIcon, parent: adminMainCat }) });
    if(res.ok) { setNewCatName(''); setAlert("✅ تم إضافة القسم الفرعي"); fetchCategories(); } else { setAlert("❌ القسم موجود"); }
  };

  const handleDeleteCategory = async (id) => {
    await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
    setAlert("🗑️ تم حذف القسم"); fetchCategories();
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) {
      await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      setAlert("🗑️ تم حذف المنتج بنجاح"); fetchProducts();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAlert("⏳ جاري معالجة الصورة...");
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500; const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH; canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData({ ...formData, image: canvas.toDataURL('image/jpeg', 0.6) });
        setAlert("✅ الصورة جاهزة");
      };
    };
  };

  const handleSave = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    const finalData = { ...formData, category: adminSubCat }; // ربط المنتج بالقسم الفرعي إجبارياً
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(finalData) });
    if (res.ok) { 
      setAlert("✅ تم حفظ الصنف بنجاح"); setEditingItem(null); 
      setFormData({ name: '', price: '', old_price: '', stock: 0, category: adminSubCat, image: '', is_sale: false, out_of_stock: false });
      fetchProducts();
    }
  };

  const quickStockUpdate = async (product, change) => {
    const newStock = Math.max(0, Number(product.stock) + change);
    await fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...product, stock: newStock }) });
    fetchProducts();
  };

  const handleQtyChange = (id, change) => setItemQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + change) }));

  const addToCart = (product) => {
    const qtyToAdd = itemQtys[product.id] || 1;
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    if (existingItemIndex >= 0) {
      const newCart = [...cart]; newCart[existingItemIndex].qty += qtyToAdd; setCart(newCart);
    } else { setCart([...cart, { ...product, qty: qtyToAdd }]); }
    setAlert(`✅ أضفت ${qtyToAdd} للسلة`);
    setItemQtys(prev => ({ ...prev, [product.id]: 1 })); 
    setBumpCart(true); setTimeout(() => setBumpCart(false), 300);
  };

  const updateCartItemQty = (index, change) => {
    const newCart = [...cart]; newCart[index].qty += change;
    if (newCart[index].qty <= 0) newCart.splice(index, 1); setCart(newCart);
  };

  // --- فلاتر الأقسام ---
  const mainCategories = categories.filter(c => !c.parent);
  const adminSubCategories = categories.filter(c => c.parent === adminMainCat);
  const clientSubCategories = categories.filter(c => c.parent === clientMainCat);

  if (isAdmin) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          {alert && <div className="toast-notification">{alert}</div>}
          <div className="login-box">
            <h1 className="gradient-text-large">الإدارة</h1>
            <p className="sub-login">أهلاً بك يا مدير النظام</p>
            <input type="password" placeholder="الرقم السري..." value={pinInput} onChange={e => setPinInput(e.target.value)} />
            <button onClick={() => { if (pinInput === settings.admin_pin) setIsAuthenticated(true); else setAlert("❌ رمز خاطئ!"); }}>دخول 🗝️</button>
            <a href="/">🏠 العودة للمتجر</a>
          </div>
        </div>
      );
    }

    // المنتجات تظهر في القائمة الجانبية بناءً على القسم الفرعي المختار
    const filteredAdminProducts = products.filter(p => p.name.includes(adminSearch) && (adminSubCat === '' || p.category === adminSubCat));

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ الأقسام الرئيسية</div>
          <div className="side-tools">
             <div className="cat-pills-admin main-cats-pills">
               {mainCategories.map(c => (
                 <button key={c.id} onClick={() => {
                   setAdminMainCat(c.name); 
                   setAdminSubCat(''); // تفريغ القسم الفرعي عند تغيير الرئيسي
                   setAdminView('subcategories');
                 }} className={adminMainCat===c.name?'active':''}>{c.icon} {c.name}</button>
               ))}
             </div>
             <input className="side-search" placeholder="🔍 ابحث في منتجات القسم..." onChange={e => setAdminSearch(e.target.value)} />
          </div>
          <nav className="side-nav">
            <button onClick={() => setAdminView('subcategories')} className={adminView==='subcategories'?'active':''}>🗂️ إدارة الأقسام</button>
            <button onClick={() => setAdminView('reports')} className={adminView==='reports'?'active':''}>📊 التقارير السريعة</button>
            <button onClick={() => setAdminView('settings')} className={adminView==='settings'?'active':''}>🛠️ إعدادات النظام</button>
            <a href="/" className="exit-btn">🏠 مشاهدة المتجر</a>
          </nav>
          
          <div className="side-inventory-list compact-list">
             {filteredAdminProducts.map(p => (
               <div key={p.id} className="p-row-card compact-card">
                  <div className="p-row-clickable" onClick={() => {setEditingItem(p); setFormData(p); setAdminView('inventory');}}>
                    <img src={p.image} className="mini-thumb" alt="" />
                    <div className="mini-meta"><span>{p.name}</span><small>مخزون: {p.stock} | السعر: {p.price}</small></div>
                  </div>
                  <div className="quick-stock-btns-row">
                    <button onClick={() => quickStockUpdate(p, 1)}>+</button>
                    <button onClick={() => quickStockUpdate(p, -1)}>-</button>
                    <button className="del-p-btn" onClick={() => handleDeleteProduct(p.id)}>🗑️</button>
                  </div>
               </div>
             ))}
          </div>
        </aside>

        <main className="content-70 no-scroll-main">
          {adminView === 'subcategories' ? (
            <div className="card-ui animated-fade fit-screen">
              <h2 className="gradient-text">🗂️ الأقسام (رئيسية وفرعية)</h2>
              
              <div className="split-forms">
                {/* إضافة قسم رئيسي */}
                <div className="form-box">
                  <h3>أضف قسم رئيسي جديد</h3>
                  <div className="add-cat-row compact">
                    <select className="icon-select" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)}>
                      <option value="⚡">⚡ كهرباء</option><option value="💧">💧 سباكة</option><option value="💡">💡 إضاءة</option>
                      <option value="🔌">🔌 أفياش</option><option value="🚿">🚿 خلاطات</option><option value="🛠️">🛠️ أدوات</option>
                      <option value="📁">📁 عام</option>
                    </select>
                    <input className="name-input" placeholder="اسم رئيسي..." value={newCatName} onChange={e=>setNewCatName(e.target.value)} />
                    <button className="gold-btn-action small-btn" onClick={handleAddMainCategory}>➕</button>
                  </div>
                </div>

                {/* إضافة قسم فرعي للقسم الرئيسي المختار */}
                {adminMainCat && (
                  <div className="form-box">
                    <h3>أضف قسم فرعي داخل ({adminMainCat})</h3>
                    <div className="add-cat-row compact">
                      <select className="icon-select" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)}>
                         <option value="🔌">🔌</option><option value="💡">💡</option><option value="🚿">🚿</option><option value="📁">📁</option>
                      </select>
                      <input className="name-input" placeholder="اسم فرعي (مثال: مفاتيح)..." value={newCatName} onChange={e=>setNewCatName(e.target.value)} />
                      <button className="gold-btn-action small-btn" onClick={handleAddSubCategory}>➕</button>
                    </div>
                  </div>
                )}
              </div>

              {/* قائمة الأقسام الفرعية التابعة للرئيسي */}
              {adminMainCat && (
                <div className="sub-cat-grid">
                  <h3 className="full-w">الأقسام الفرعية لـ ({adminMainCat}): اضغط على أي قسم لفتحه وإضافة المنتجات</h3>
                  {adminSubCategories.length === 0 ? <p>لا توجد أقسام فرعية. أضف واحداً لتبدأ!</p> : null}
                  {adminSubCategories.map(c => (
                    <div key={c.id} className="sub-cat-card" onClick={() => { setAdminSubCat(c.name); setAdminView('inventory'); }}>
                      <span className="sc-name">{c.icon} {c.name}</span>
                      <button className="del-sc-btn" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}>حذف</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : adminView === 'reports' ? (
            <div className="card-ui animated-fade fit-screen">
               <h2 className="gradient-text">📊 التقارير والمخزون</h2>
               <div className="stats-grid compact-stats">
                  <div className="stat-card blue-glow"><h3>إجمالي القيمة</h3><p>{products.reduce((a,b)=>a+(Number(b.price)*Number(b.stock)),0)}</p></div>
                  <div className="stat-card green-glow"><h3>القطع المتوفرة</h3><p>{products.reduce((a,b)=>a+Number(b.stock),0)}</p></div>
               </div>
            </div>
            
          ) : adminView === 'settings' ? (
            <div className="card-ui animated-fade fit-screen">
              <h2 className="gradient-text">⚙️ لوحة النظام (الإعدادات المخفية)</h2>
              <div className="system-status-box">
                 <h3>حالة المتجر: ممتاز 🟢</h3>
                 <p>النظام يعمل بأحدث إصدار. لا توجد إجراءات مطلوبة حالياً.</p>
                 <p>عدد الأقسام الرئيسية: {mainCategories.length}</p>
                 <p>إجمالي المنتجات المسجلة: {products.length}</p>
              </div>
            </div>

          ) : (
            <div className="card-ui animated-fade fit-screen">
              <div className="form-header-row">
                <h2 className="gradient-text">{editingItem ? '✏️ تعديل صنف' : `➕ منتج جديد في (${adminSubCat || 'يرجى اختيار قسم فرعي'})`}</h2>
                {adminSubCat && <span className="current-path-badge">{adminMainCat} / {adminSubCat}</span>}
              </div>
              
              {/* 🛠️ التصميم المدمج (الصورة بجوار المدخلات) لمنع النزول لأسفل 🛠️ */}
              {adminSubCat ? (
                <div className="compact-form-layout">
                  <div className="image-col">
                    <div className="image-upload-section compact-img">
                      {formData.image ? <img src={formData.image} alt="Preview" className="preview-img-compact" /> : <div className="img-placeholder">📷 صورة المنتج</div>}
                      <label className="custom-file-upload small">
                        📤 رفع <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                  
                  <div className="inputs-col">
                    <div className="form-grid-2">
                      <div className="form-group"><input placeholder="اسم المنتج..." value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
                      <div className="form-group"><input type="number" placeholder="المخزون المتوفر..." value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})}/></div>
                      <div className="form-group"><input type="number" placeholder="السعر الحالي..." value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/></div>
                      <div className="form-group"><input type="number" placeholder="السعر القديم (للعروض)..." value={formData.old_price} onChange={e=>setFormData({...formData, old_price:e.target.value})}/></div>
                    </div>
                    
                    <div className="btn-toggle-row compact-toggles">
                      <button className={`t-btn sale ${formData.is_sale?'on':''}`} onClick={()=>setFormData({...formData, is_sale:!formData.is_sale})}>🔥 عرض خاص</button>
                      <button className={`t-btn stock ${formData.out_of_stock?'on':''}`} onClick={()=>setFormData({...formData, out_of_stock:!formData.out_of_stock})}>🚫 نفد</button>
                      <button className="btn-save-final" onClick={handleSave}>حفظ 📦</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state-msg">👈 يرجى اختيار قسم فرعي من القائمة لتبدأ بإضافة المنتجات إليه.</div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================================
  // 💻 واجهة العميل (تصميم المتجر)
  // =========================================================================
  const filteredClientProducts = products.filter(p => clientSubCat === 'الكل' ? (clientMainCat === 'الكل' || p.category === clientSubCat) : p.category === clientSubCat);

  return (
    <div className={`App client-theme ${showCart ? 'no-scroll' : ''}`}>
      {alert && <div className="toast-notification">{alert}</div>}
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <button className={`open-cart-large desktop-only ${bumpCart ? 'bump' : ''}`} onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>
      
      {/* شريط الأقسام الرئيسية للعميل */}
      <div className="client-category-bar">
        <button className={clientMainCat==='الكل'?'active':''} onClick={()=>{setClientMainCat('الكل'); setClientSubCat('الكل');}}>🌐 الكل</button>
        {mainCategories.map(c => (
          <button key={c.id} className={clientMainCat===c.name?'active':''} onClick={()=>{setClientMainCat(c.name); setClientSubCat('الكل');}}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* شريط الأقسام الفرعية (يظهر فقط إذا اختار العميل قسماً رئيسياً) */}
      {clientMainCat !== 'الكل' && clientSubCategories.length > 0 && (
        <div className="sub-category-bar">
          <button className={clientSubCat==='الكل'?'active':''} onClick={()=>setClientSubCat('الكل')}>جميع الـ {clientMainCat}</button>
          {clientSubCategories.map(sc => (
             <button key={sc.id} className={clientSubCat===sc.name?'active':''} onClick={()=>setClientSubCat(sc.name)}>{sc.name}</button>
          ))}
        </div>
      )}
      
      <div className="gallery-container">
        {filteredClientProducts.length === 0 ? (
          <div className="coming-soon-card"><div className="glass-icon">⏳</div><h2 className="gradient-text">قريباً جداً!</h2><h3>نعمل على توفير أحدث المنتجات في هذا القسم.. ترقبونا 🚀</h3></div>
        ) : (
          <div className="p-grid-royal">
            {filteredClientProducts.map(p => (
              <div key={p.id} className="royal-p-card">
                {p.out_of_stock && <div className="sold-tag">نفدت</div>}
                {p.is_sale && <div className="fire-inline mobile-fire">🔥 عرض</div>}
                <div className="p-img-box"><img src={p.image} alt="" /></div>
                <div className="p-info-box">
                  <h4>{p.name}</h4>
                  <div className="price-area"><span className="now-price">{p.price} ريال</span>{Number(p.old_price) > 0 && <del className="old-price">{p.old_price}</del>}</div>
                  {!p.out_of_stock ? (
                    <div className="action-area">
                      <div className="qty-controls"><button onClick={() => handleQtyChange(p.id, 1)} className="qty-btn">+</button><span className="qty-display">{itemQtys[p.id] || 1}</span><button onClick={() => handleQtyChange(p.id, -1)} className="qty-btn">-</button></div>
                      <button className="add-btn-p" onClick={() => addToCart(p)}>أضف 🛒</button>
                    </div>
                  ) : <button className="add-btn-p disabled" disabled>غير متوفر</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="floating-cart-btn" onClick={() => setShowCart(true)}>🛒 <span className="float-badge">{cart.length}</span></button>
      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      
      <div className={`cart-overlay ${showCart ? 'open' : ''}`}>
         <div className="cart-inner-container">
            <div className="cart-header-fixed"><h2>🛍️ سلتك</h2><button className="close-btn-x" onClick={() => setShowCart(false)}>❌</button></div>
            <div className="cart-products-scroll">
               {cart.map((item, i) => (
                 <div key={i} className="cart-product-row">
                   <img src={item.image} alt="" className="cart-p-img" />
                   <div className="cart-p-details"><div>{item.name}</div><div className="mini-qty-controls"><button onClick={() => updateCartItemQty(i, 1)}>+</button><span>{item.qty}</span><button onClick={() => updateCartItemQty(i, -1)}>-</button></div></div>
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