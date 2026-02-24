/* eslint-disable */
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
  
  // الإدارة
  const [adminView, setAdminView] = useState('categories'); 
  const [activeMainCat, setActiveMainCat] = useState(null);
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [newMainName, setNewMainName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  // 🌟 ميزة 5: إضافة `details` للمنتج
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false });
  const [editingItem, setEditingItem] = useState(null);

  // العميل
  const [showCart, setShowCart] = useState(false);
  const [clientMain, setClientMain] = useState('');
  const [clientSub, setClientSub] = useState('');
  const [itemQtys, setItemQtys] = useState({});
  // 🌟 ميزة 4: محرك بحث ذكي
  const [searchQuery, setSearchQuery] = useState('');
  // 🌟 ميزة 1: نافذة تفاصيل المنتج
  const [selectedProduct, setSelectedProduct] = useState(null);

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => { fetchProducts(); fetchSettings(); fetchCategories(); }, []); 
  useEffect(() => { if (alert) { const t = setTimeout(() => setAlert(null), 3000); return () => clearTimeout(t); } }, [alert]);

  const fetchProducts = async () => { try { setProducts(await (await fetch(`${API_URL}/products`)).json()); } catch (e) {} };
  const fetchSettings = async () => { try { setSettings(await (await fetch(`${API_URL}/settings`)).json()); } catch (e) {} };
  const fetchCategories = async () => {
    try {
      const data = await (await fetch(`${API_URL}/categories`)).json();
      setCategories(data);
      if (!isAdmin && data.length > 0 && !clientMain) {
         const mains = data.filter(c => !c.parent);
         if (mains.length > 0) {
           setClientMain(mains[0].name);
           const subs = data.filter(c => c.parent === mains[0].name);
           if (subs.length > 0) setClientSub(subs[0].name);
         }
      }
    } catch (e) {}
  };

  // دوال الإدارة
  const handleAddMain = async () => {
    if (!newMainName) return setAlert("اكتب اسم القسم الرئيسي");
    await fetch(`${API_URL}/categories`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: newMainName, icon: '📁', parent: '' }) });
    setNewMainName(''); setAlert("✅ تمت الإضافة"); fetchCategories();
  };

  const handleAddSub = async () => {
    if (!newSubName) return setAlert("اكتب اسم القسم الفرعي");
    await fetch(`${API_URL}/categories`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: newSubName, icon: '📂', parent: activeMainCat.name }) });
    setNewSubName(''); setAlert("✅ تمت الإضافة"); fetchCategories();
  };

  const handleDeleteCat = async (id) => {
    if(window.confirm("حذف القسم؟")) { await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' }); setAlert("🗑️ تم الحذف"); fetchCategories(); setActiveSubCat(null); }
  };

  const handleSaveProduct = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    const finalData = { ...formData, category: activeSubCat.name }; 
    await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(finalData) });
    setAlert("✅ تم الحفظ"); setEditingItem(null);
    setFormData({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false });
    fetchProducts();
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("حذف المنتج؟")) { await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }); fetchProducts(); }
  };

  const updateInventory = async (p, change) => {
    let newStock = Number(p.stock) + change;
    let newSold = Number(p.sold || 0);
    if (newStock < 0) newStock = 0;
    if (change < 0 && Number(p.stock) > 0) newSold += Math.abs(change);
    await fetch(`${API_URL}/products/${p.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...p, stock: newStock, sold: newSold }) });
    fetchProducts();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setAlert("⏳ جاري المعالجة...");
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const img = new Image(); img.src = ev.target.result;
      img.onload = () => {
        const cvs = document.createElement('canvas'); cvs.width = 500; cvs.height = img.height * (500/img.width);
        const ctx = cvs.getContext('2d'); ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
        setFormData({ ...formData, image: cvs.toDataURL('image/jpeg', 0.6) }); setAlert("✅ الصورة جاهزة");
      };
    };
  };

  const addToCart = (product, customQty = null) => {
    const qty = customQty || (itemQtys[product.id] || 1);
    const index = cart.findIndex(item => item.id === product.id);
    if (index >= 0) { const newCart = [...cart]; newCart[index].qty += qty; setCart(newCart); } 
    else { setCart([...cart, { ...product, qty }]); }
    setAlert(`✅ أضفت ${qty} للسلة`); setItemQtys(prev => ({ ...prev, [product.id]: 1 })); 
    setSelectedProduct(null); // إغلاق النافذة بعد الإضافة
  };

  const updateCartQty = (idx, change) => {
    const newCart = [...cart]; newCart[idx].qty += change;
    if (newCart[idx].qty <= 0) newCart.splice(idx, 1); setCart(newCart);
  };

  // 🌟 ميزة 2: حساب نسبة الخصم
  const calcDiscount = (oldP, newP) => {
    if (!oldP || oldP <= newP) return null;
    return Math.round(((oldP - newP) / oldP) * 100);
  };

  const mainCats = categories.filter(c => !c.parent);

  if (isAdmin) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          <div className="login-box glass-effect">
            <h1 className="gradient-text-large">الإدارة المركزية</h1>
            <p className="sub-login">يرجى إدخال الرمز السري</p>
            <input className="login-input" type="password" placeholder="الرقم السري..." value={pinInput} onChange={e => setPinInput(e.target.value)} />
            <button onClick={() => { if(pinInput===settings.admin_pin) setIsAuthenticated(true); else setAlert("❌ رمز خاطئ!"); }}>دخول 🗝️</button>
            <a href="/">العودة للمتجر 🏠</a>
          </div>
          {alert && <div className="toast-notification">{alert}</div>}
        </div>
      );
    }

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ لوحة التحكم</div>
          <nav className="side-nav">
            <button className={adminView==='categories'?'active':''} onClick={()=>{setAdminView('categories'); setActiveMainCat(null); setActiveSubCat(null); setEditingItem(null);}}>🗂️ إدارة الأقسام والمنتجات</button>
            <button className={adminView==='inventory'?'active':''} onClick={()=>setAdminView('inventory')}>📦 إدارة المخزون السريع</button>
            <button className={adminView==='reports'?'active':''} onClick={()=>setAdminView('reports')}>📊 التقارير (كهرباء/سباكة)</button>
            <button className={adminView==='settings'?'active':''} onClick={()=>setAdminView('settings')}>⚙️ إعدادات المتجر</button>
          </nav>
          <div className="side-footer"><a href="/">🌐 فتح المتجر كعميل</a></div>
        </aside>

        <main className="content-70">
          {/* إعدادات */}
          {adminView === 'settings' && (
            <div className="panel-card fade-in">
              <h2>⚙️ إعدادات المتجر</h2>
              <div className="settings-grid">
                <div className="form-group"><label>اسم المتجر</label><input value={settings.shop_name} onChange={e=>setSettings({...settings, shop_name:e.target.value})} /></div>
                <div className="form-group"><label>رقم الواتساب</label><input value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})} /></div>
                <div className="form-group"><label>الرقم السري للإدارة</label><input value={settings.admin_pin} onChange={e=>setSettings({...settings, admin_pin:e.target.value})} /></div>
              </div>
              <button className="save-btn full-w-btn" onClick={async () => {
                await fetch(`${API_URL}/settings`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(settings)});
                setAlert("✅ تم الحفظ");
              }}>حفظ الإعدادات 💾</button>
            </div>
          )}

          {/* الأقسام والمنتجات */}
          {adminView === 'categories' && (
            <div className="fade-in">
              {!activeMainCat && (
                <div className="panel-card">
                  <h2>الخطوة 1: الأقسام الرئيسية (مثال: كهرباء، سباكة)</h2>
                  <div className="add-row mb-20"><input placeholder="قسم رئيسي جديد..." value={newMainName} onChange={e=>setNewMainName(e.target.value)} /><button className="add-btn" onClick={handleAddMain}>إضافة</button></div>
                  <div className="folders-grid">
                    {mainCats.map(c => (<div key={c.id} className="folder-card main" onClick={()=>setActiveMainCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e)=>{e.stopPropagation(); handleDeleteCat(c.id);}}>حذف</button></div>))}
                  </div>
                </div>
              )}

              {activeMainCat && !activeSubCat && (
                <div className="panel-card">
                  <button className="back-btn" onClick={()=>setActiveMainCat(null)}>🔙 رجوع للمجلدات</button>
                  <h2>الخطوة 2: الأقسام الفرعية لـ ({activeMainCat.name})</h2>
                  <div className="add-row mb-20"><input placeholder="قسم فرعي (مثال: مفاتيح وأفياش)..." value={newSubName} onChange={e=>setNewSubName(e.target.value)} /><button className="add-btn" onClick={handleAddSub}>إضافة</button></div>
                  <div className="folders-grid">
                    {categories.filter(c=>c.parent===activeMainCat.name).map(c => (<div key={c.id} className="folder-card sub" onClick={()=>setActiveSubCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e)=>{e.stopPropagation(); handleDeleteCat(c.id);}}>حذف</button></div>))}
                  </div>
                </div>
              )}

              {activeSubCat && (
                <div className="panel-card">
                  <button className="back-btn" onClick={()=>{setActiveSubCat(null); setEditingItem(null); setFormData({name:'', price:'', old_price:'', stock:'', details:'', image:'', is_sale:false, out_of_stock:false});}}>🔙 رجوع</button>
                  <div className="path-header">{activeMainCat.name} ⬅️ {activeSubCat.name}</div>
                  
                  <div className="product-entry-form">
                    <div className="img-upload-box">
                      {formData.image ? <img src={formData.image} alt="product"/> : <div className="img-ph">صورة المنتج</div>}
                      <label className="upload-label">رفع صورة <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}}/></label>
                    </div>
                    <div className="data-entry-box">
                      <input className="f-input full" placeholder="اسم المنتج..." value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                      
                      {/* 🌟 ميزة 5: مربع التفاصيل */}
                      <textarea className="f-input full" rows="3" placeholder="تفاصيل المنتج (الوصف والمميزات لعرضها للعميل)..." value={formData.details} onChange={e=>setFormData({...formData, details:e.target.value})}></textarea>
                      
                      <div className="f-row">
                        <input className="f-input" type="number" placeholder="السعر" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                        <input className="f-input" type="number" placeholder="السعر القديم" value={formData.old_price} onChange={e=>setFormData({...formData, old_price:e.target.value})}/>
                        <input className="f-input" type="number" placeholder="الكمية" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})}/>
                      </div>
                      <div className="f-toggles">
                        <button className={`t-btn ${formData.is_sale?'active':''}`} onClick={()=>setFormData({...formData, is_sale:!formData.is_sale})}>🔥 عرض خاص</button>
                        <button className={`t-btn ${formData.out_of_stock?'active-out':''}`} onClick={()=>setFormData({...formData, out_of_stock:!formData.out_of_stock})}>🚫 غير متوفر</button>
                        <button className="save-btn" onClick={handleSaveProduct}>{editingItem ? 'تحديث المنتج' : 'حفظ المنتج'}</button>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="mt-30">منتجات القسم:</h3>
                  <div className="mini-products-list">
                    {products.filter(p=>p.category===activeSubCat.name).map(p=>(
                      <div key={p.id} className="m-prod-row" onClick={()=>{setEditingItem(p); setFormData(p);}}>
                        <img src={p.image} alt=""/> <b>{p.name}</b> <span>السعر: {p.price} | مخزون: {p.stock}</span>
                        <button className="del-btn-sq" onClick={(e)=>{e.stopPropagation(); handleDeleteProduct(p.id);}}>🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* المخزون السريع */}
          {adminView === 'inventory' && (
            <div className="panel-card fade-in">
              <h2>📦 إدارة المخزون السريع</h2>
              <table className="pro-table">
                <thead><tr><th>المنتج</th><th>القسم</th><th>الكمية المتبقية</th><th>المباع</th><th>إجراء (بيع/تزويد)</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td><td>{p.category}</td><td className="stk-td">{p.stock}</td><td className="sld-td">{p.sold||0}</td>
                      <td className="act-td"><button className="btn-minus" onClick={()=>updateInventory(p, -1)}>-1</button><button className="btn-plus" onClick={()=>updateInventory(p, 1)}>+1</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 🌟 ميزة 6: التقارير المفصولة (كهرباء وسباكة أو أي قسم رئيسي) */}
          {adminView === 'reports' && (
            <div className="panel-card fade-in">
              <h2>📊 التقارير المقسمة</h2>
              {mainCats.length === 0 ? <p>لا توجد أقسام رئيسية للتقارير.</p> : null}
              
              <div className="reports-split-container">
                {mainCats.map(main => {
                  // جلب كل الأقسام الفرعية التابعة لهذا القسم الرئيسي
                  const subCatNames = categories.filter(c => c.parent === main.name).map(c => c.name);
                  // جلب كل المنتجات التي تقع ضمن هذه الأقسام الفرعية
                  const mainProds = products.filter(p => subCatNames.includes(p.category));
                  
                  const totalStock = mainProds.reduce((a,b)=>a+Number(b.stock),0);
                  const totalSold = mainProds.reduce((a,b)=>a+Number(b.sold||0),0);
                  const actualProfit = mainProds.reduce((a,b)=>a+(Number(b.sold||0)*Number(b.price)),0);

                  return (
                    <div key={main.id} className="report-main-section">
                      <h3 className="r-header">{main.icon} تقرير قسم ({main.name}) الشامل</h3>
                      <div className="report-kpi-grid">
                         <div className="kpi green"><span>أرباح المباع</span><h3>{actualProfit} ريال</h3></div>
                         <div className="kpi orange"><span>إجمالي المباع</span><h3>{totalSold} قطعة</h3></div>
                         <div className="kpi blue"><span>الكمية الموجودة (المخزون)</span><h3>{totalStock} قطعة</h3></div>
                      </div>
                      
                      <div className="table-wrapper">
                        <table className="pro-table mt-20">
                          <thead><tr><th>المنتج</th><th>القسم الفرعي</th><th>الكمية الموجودة</th><th>المباع</th><th>سعر البيع</th><th>أرباح المنتج</th></tr></thead>
                          <tbody>
                            {mainProds.map(p => (
                              <tr key={p.id}>
                                <td>{p.name}</td><td><span className="sc-badge">{p.category}</span></td>
                                <td className="stk-td">{p.stock}</td><td className="sld-td">{p.sold||0}</td>
                                <td>{p.price}</td><td className="profit-td">{Number(p.sold||0)*Number(p.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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

  // ==========================================
  // 💻 واجهة العميل (المتجر)
  // ==========================================
  const searchResults = products.filter(p => p.name.includes(searchQuery));
  const displayProducts = searchQuery ? searchResults : products.filter(p => p.category === clientSub);

  return (
    <div className={`App client-theme ${(showCart || selectedProduct) ? 'no-scroll' : ''}`}>
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         {/* 🌟 ميزة 4: محرك البحث الحي */}
         <div className="search-bar-wrapper">
            <input type="text" placeholder="🔍 ابحث عن أي منتج هنا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
         </div>
         <button className="open-cart-large desktop-only" onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>
      
      {!searchQuery && (
        <>
          <div className="client-main-bar">
            {mainCats.map(c => (<button key={c.id} className={clientMain === c.name ? 'active' : ''} onClick={() => { setClientMain(c.name); const subs = categories.filter(subC => subC.parent === c.name); if (subs.length > 0) setClientSub(subs[0].name); else setClientSub(''); }}>{c.name}</button>))}
          </div>
          {categories.filter(c => c.parent === clientMain).length > 0 && (
            <div className="client-sub-bar">
              {categories.filter(c => c.parent === clientMain).map(sc => (<button key={sc.id} className={clientSub === sc.name ? 'active' : ''} onClick={() => setClientSub(sc.name)}>{sc.name}</button>))}
            </div>
          )}
        </>
      )}
      
      <div className="gallery-container">
        {searchQuery && <h2 className="search-title">نتائج البحث عن: "{searchQuery}"</h2>}
        
        {displayProducts.length === 0 ? (
          <div className="empty-state"><h3>لم نتمكن من العثور على منتجات 🧐</h3></div>
        ) : (
          <div className="p-grid-royal">
            {displayProducts.map(p => {
              const discount = calcDiscount(p.old_price, p.price);
              const isLowStock = Number(p.stock) > 0 && Number(p.stock) <= 3;

              return (
                // 🌟 ميزة 9: التفاعل عند المرور وفتح النافذة
                <div key={p.id} className="royal-p-card" onClick={() => setSelectedProduct(p)}>
                  {p.out_of_stock && <div className="sold-tag">نفدت الكمية</div>}
                  {p.is_sale && <div className="fire-inline">🔥 عرض</div>}
                  
                  {/* 🌟 ميزة 2: شريط نسبة الخصم */}
                  {discount && <div className="discount-badge">خصم {discount}%</div>}
                  
                  <div className="p-img-box"><img src={p.image} alt="" /></div>
                  <div className="p-info-box">
                    <h4>{p.name}</h4>
                    <div className="price-area">
                       <span className="now-price">{p.price} ر.س</span>
                       {Number(p.old_price) > 0 && <del className="old-price">{p.old_price}</del>}
                    </div>
                    
                    {/* 🌟 ميزة 3: تحذير نفاذ المخزون */}
                    {isLowStock && !p.out_of_stock && <div className="low-stock-alert">سارع! باقي {p.stock} حبات فقط</div>}

                    <button className="add-btn-p" onClick={(e) => { e.stopPropagation(); if(!p.out_of_stock) addToCart(p); }} disabled={p.out_of_stock}>
                      {p.out_of_stock ? 'غير متوفر' : 'أضف للسلة 🛒'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      
      {/* 🌟 ميزة 7: شريط السلة السفلي الدائم للجوال */}
      {cart.length > 0 && (
        <div className="mobile-sticky-cart" onClick={() => setShowCart(true)}>
          <div className="m-cart-info">🛒 <b>{cart.length} منتجات</b> في السلة</div>
          <div className="m-cart-total">{cart.reduce((a,b)=>a+(Number(b.price)*b.qty),0)} ر.س</div>
        </div>
      )}

      {/* 🌟 ميزة 1: النافذة المنبثقة لتفاصيل المنتج (المحاكية للصورة المرفقة) */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content fade-in-up" onClick={e => e.stopPropagation()}>
             <button className="modal-close-x" onClick={() => setSelectedProduct(null)}>✕</button>
             
             <div className="modal-body-split">
               <div className="m-img-side">
                 {calcDiscount(selectedProduct.old_price, selectedProduct.price) && <div className="m-discount">خصم {calcDiscount(selectedProduct.old_price, selectedProduct.price)}%</div>}
                 <img src={selectedProduct.image} alt={selectedProduct.name} />
               </div>
               
               <div className="m-details-side">
                 <h2>{selectedProduct.name}</h2>
                 <div className="m-price-box">
                   <span className="m-now">{selectedProduct.price} ر.س</span>
                   {Number(selectedProduct.old_price) > 0 && <del className="m-old">{selectedProduct.old_price} ر.س</del>}
                 </div>
                 
                 <div className="m-desc-box">
                   <h3>تفاصيل ومميزات المنتج:</h3>
                   <p>{selectedProduct.details || 'لا توجد تفاصيل إضافية مسجلة لهذا المنتج.'}</p>
                 </div>

                 {!selectedProduct.out_of_stock ? (
                   <button className="m-add-btn" onClick={() => addToCart(selectedProduct)}>🛒 إضافة للسلة الآن</button>
                 ) : (
                   <button className="m-add-btn disabled" disabled>🚫 نفدت الكمية</button>
                 )}
               </div>
             </div>
          </div>
        </div>
      )}

      {/* السلة */}
      <div className={`cart-overlay ${showCart ? 'open' : ''}`}>
         <div className="cart-inner-container">
            <div className="cart-header-fixed"><h2>🛍️ سلتك</h2><button className="close-btn-x" onClick={() => setShowCart(false)}>❌</button></div>
            <div className="cart-products-scroll">
               {cart.length === 0 && <p style={{textAlign:'center', padding:'20px'}}>السلة فارغة</p>}
               {cart.map((item, i) => (
                 <div key={i} className="cart-product-row">
                   <img src={item.image} alt="" className="cart-p-img" />
                   <div className="cart-p-details">
                     <div>{item.name}</div>
                     <div className="qty-controls-mini">
                       <button onClick={() => updateCartQty(i, 1)}>+</button>
                       <span>{item.qty}</span>
                       <button onClick={() => updateCartQty(i, -1)}>-</button>
                     </div>
                   </div>
                   <div className="cart-item-total">{item.price * item.qty} ر.س</div>
                 </div>
               ))}
            </div>
            <div className="cart-action-fixed">
              <div className="total-gold-box">الإجمالي: <span>{cart.reduce((a,b)=>a+(Number(b.price)*b.qty),0)}</span> ر.س</div>
              <div className="cart-buttons-row">
                <button className="btn-continue-shopping" onClick={() => setShowCart(false)}>إكمال التسوق</button>
                {/* 🌟 ميزة 8: تنسيق الواتساب كفاتورة */}
                <button className="btn-wa-confirm" disabled={cart.length===0} onClick={() => {
                   let msg = `*طلب جديد من المتجر* 🛒\n\n`;
                   cart.forEach(c => msg += `▪️ ${c.name}\n   الكمية: ${c.qty} × ${c.price} ر.س\n`);
                   msg += `\n*الإجمالي: ${cart.reduce((a,b)=>a+(Number(b.price)*b.qty),0)} ر.س*`;
                   window.open(`https://wa.me/${settings.phone}?text=${encodeURIComponent(msg)}`);
                }}>تأكيد الطلب عبر واتساب ✅</button>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default App;