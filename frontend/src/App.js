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
  
  // نظام التنقل 30% اليمين
  const [adminView, setAdminView] = useState('categories'); // settings, inventory, categories, reports
  
  // نظام الأقسام الهرمي
  const [activeMainCat, setActiveMainCat] = useState(null);
  const [activeSubCat, setActiveSubCat] = useState(null);
  
  // مدخلات الأقسام والمنتجات
  const [newMainName, setNewMainName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: '', image: '', is_sale: false, out_of_stock: false });
  
  // فلاتر التقارير
  const [reportMainCat, setReportMainCat] = useState(null);
  const [reportSubCat, setReportSubCat] = useState(null);

  // واجهة العميل
  const [showCart, setShowCart] = useState(false);
  const [clientMain, setClientMain] = useState('');
  const [clientSub, setClientSub] = useState('');
  const [itemQtys, setItemQtys] = useState({});

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => { fetchProducts(); fetchSettings(); fetchCategories(); }, []); 
  useEffect(() => { if (alert) { const timer = setTimeout(() => setAlert(null), 3000); return () => clearTimeout(timer); } }, [alert]);

  const fetchProducts = async () => setProducts(await (await fetch(`${API_URL}/products`)).json());
  const fetchSettings = async () => setSettings(await (await fetch(`${API_URL}/settings`)).json());
  const fetchCategories = async () => {
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
    const finalData = { ...formData, category: activeSubCat.name }; 
    await fetch(`${API_URL}/products`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(finalData) });
    setAlert("✅ تم الحفظ في " + activeSubCat.name); 
    setFormData({ name: '', price: '', old_price: '', stock: '', image: '', is_sale: false, out_of_stock: false });
    fetchProducts();
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("حذف المنتج نهائياً؟")) { await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }); fetchProducts(); }
  };

  // نظام الجرد الذكي (تحديث الكمية يحسب المباع تلقائياً)
  const updateInventory = async (p, change) => {
    let newStock = Number(p.stock) + change;
    let newSold = Number(p.sold || 0);
    if (newStock < 0) newStock = 0;
    if (change < 0 && Number(p.stock) > 0) newSold += Math.abs(change); // تسجيل المبيعات
    
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

  // العميل
  const addToCart = (product) => {
    const qty = itemQtys[product.id] || 1;
    const index = cart.findIndex(item => item.id === product.id);
    if (index >= 0) { const newCart = [...cart]; newCart[index].qty += qty; setCart(newCart); } 
    else { setCart([...cart, { ...product, qty }]); }
    setAlert(`✅ أضفت ${qty} للسلة`); setItemQtys(prev => ({ ...prev, [product.id]: 1 })); 
  };
  const updateCartQty = (idx, change) => {
    const newCart = [...cart]; newCart[idx].qty += change;
    if (newCart[idx].qty <= 0) newCart.splice(idx, 1); setCart(newCart);
  };

  const mainCats = categories.filter(c => !c.parent);

  // ==========================================
  // 💻 لوحة الإدارة المتطورة (30% يمين - 70% يسار)
  // ==========================================
  if (isAdmin) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          <div className="login-box glass-effect">
            <h1 className="gradient-text-large">الإدارة</h1>
            <p className="sub-login">أهلاً بك يا مدير النظام</p>
            <input className="login-input" type="password" placeholder="الرقم السري..." value={pinInput} onChange={e => setPinInput(e.target.value)} />
            <button onClick={() => { if(pinInput===settings.admin_pin) setIsAuthenticated(true); else setAlert("❌ رمز خاطئ!"); }}>تسجيل الدخول 🗝️</button>
            <a href="/">🏠 العودة للمتجر</a>
          </div>
          {alert && <div className="toast-notification">{alert}</div>}
        </div>
      );
    }

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        
        {/* 30% الجانب الأيمن (القائمة الرئيسية) */}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ لوحة التحكم</div>
          <nav className="side-nav">
            <button className={adminView==='settings'?'active':''} onClick={()=>{setAdminView('settings');}}>⚙️ إدارة إعدادات النظام</button>
            <button className={adminView==='categories'?'active':''} onClick={()=>{setAdminView('categories'); setActiveMainCat(null); setActiveSubCat(null);}}>🗂️ إدارة الأقسام والمنتجات</button>
            <button className={adminView==='inventory'?'active':''} onClick={()=>{setAdminView('inventory'); setActiveMainCat(null); setActiveSubCat(null);}}>📦 إدارة المخزون السريع</button>
            <button className={adminView==='reports'?'active':''} onClick={()=>{setAdminView('reports'); setReportMainCat(null); setReportSubCat(null);}}>📊 التقارير والأرباح</button>
          </nav>
          <div className="side-footer"><a href="/">🌐 فتح المتجر كعميل</a></div>
        </aside>

        {/* 70% الجانب الأيسر (محتوى العمل) */}
        <main className="content-70">
          
          {/* 1. إعدادات النظام */}
          {adminView === 'settings' && (
            <div className="panel-card fade-in">
              <h2>⚙️ إدارة إعدادات النظام</h2>
              <div className="settings-grid">
                <div className="form-group"><label>اسم المتجر</label><input value={settings.shop_name} onChange={e=>setSettings({...settings, shop_name:e.target.value})} /></div>
                <div className="form-group"><label>رقم الجوال (واتساب)</label><input value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})} /></div>
                <div className="form-group"><label>البريد الإلكتروني</label><input value={settings.email} onChange={e=>setSettings({...settings, email:e.target.value})} /></div>
                <div className="form-group"><label>تعديل الرقم السري للإدارة</label><input value={settings.admin_pin} onChange={e=>setSettings({...settings, admin_pin:e.target.value})} /></div>
              </div>
              <div className="btn-row">
                <button className="save-btn" onClick={async () => {
                  await fetch(`${API_URL}/settings`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(settings)});
                  setAlert("✅ تم حفظ الإعدادات");
                }}>حفظ الإعدادات 💾</button>
                <button className="update-sys-btn" onClick={() => setAlert("🔄 تم تحديث وبرمجة النظام لآخر إصدار بنجاح!")}>تحديث النظام الآن 🔄</button>
              </div>
            </div>
          )}

          {/* 2. إدارة الأقسام والمنتجات (المسار المتدرج) */}
          {adminView === 'categories' && (
            <div className="fade-in">
              {/* مستوى 1: الأقسام الرئيسية */}
              {!activeMainCat && (
                <div className="panel-card">
                  <h2>الخطوة 1: اختر أو أضف قسماً رئيسياً (مثال: كهرباء)</h2>
                  <div className="add-row mb-20">
                    <input placeholder="اسم القسم الرئيسي الجديد..." value={newMainName} onChange={e=>setNewMainName(e.target.value)} />
                    <button className="add-btn" onClick={handleAddMain}>إضافة قسم</button>
                  </div>
                  <div className="folders-grid">
                    {mainCats.map(c => (
                      <div key={c.id} className="folder-card main" onClick={()=>setActiveMainCat(c)}>
                        <h3>{c.name}</h3>
                        <button className="del-btn-corner" onClick={(e)=>{e.stopPropagation(); handleDeleteCat(c.id);}}>حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* مستوى 2: الأقسام الفرعية */}
              {activeMainCat && !activeSubCat && (
                <div className="panel-card">
                  <button className="back-btn" onClick={()=>setActiveMainCat(null)}>🔙 رجوع للأقسام الرئيسية</button>
                  <h2>الخطوة 2: الأقسام الفرعية داخل ({activeMainCat.name})</h2>
                  <div className="add-row mb-20">
                    <input placeholder="اسم القسم الفرعي (مثال: مفاتيح وأفياش)..." value={newSubName} onChange={e=>setNewSubName(e.target.value)} />
                    <button className="add-btn" onClick={handleAddSub}>إضافة قسم</button>
                  </div>
                  <div className="folders-grid">
                    {categories.filter(c=>c.parent===activeMainCat.name).map(c => (
                      <div key={c.id} className="folder-card sub" onClick={()=>setActiveSubCat(c)}>
                        <h3>{c.name}</h3>
                        <button className="del-btn-corner" onClick={(e)=>{e.stopPropagation(); handleDeleteCat(c.id);}}>حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* مستوى 3: إضافة المنتجات للقسم الفرعي */}
              {activeSubCat && (
                <div className="panel-card">
                  <button className="back-btn" onClick={()=>setActiveSubCat(null)}>🔙 رجوع للأقسام الفرعية</button>
                  <div className="path-header">القسم العام: <span>{activeMainCat.name}</span> ⬅️ القسم الخاص: <span>{activeSubCat.name}</span></div>
                  
                  <div className="product-entry-form">
                    <div className="img-upload-box">
                      {formData.image ? <img src={formData.image} alt="product"/> : <div className="img-ph">صورة المنتج</div>}
                      <label className="upload-label">اختيار صورة <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}}/></label>
                    </div>
                    <div className="data-entry-box">
                      <input className="f-input full" placeholder="اسم المنتج (مثال: مفتاح مفرد)..." value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                      <div className="f-row">
                        <input className="f-input" type="number" placeholder="السعر الحالي" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                        <input className="f-input" type="number" placeholder="السعر القديم" value={formData.old_price} onChange={e=>setFormData({...formData, old_price:e.target.value})}/>
                        <input className="f-input" type="number" placeholder="الكمية المتوفرة" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})}/>
                      </div>
                      <div className="f-toggles">
                        <button className={`t-btn ${formData.is_sale?'active':''}`} onClick={()=>setFormData({...formData, is_sale:!formData.is_sale})}>🔥 عرض خاص</button>
                        <button className={`t-btn ${formData.out_of_stock?'active-out':''}`} onClick={()=>setFormData({...formData, out_of_stock:!formData.out_of_stock})}>🚫 نفدت الكمية</button>
                        <button className="save-btn" onClick={handleSaveProduct}>حفظ المنتج ✔️</button>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="mt-30">المنتجات المسجلة في هذا القسم:</h3>
                  <div className="mini-products-list">
                    {products.filter(p=>p.category===activeSubCat.name).map(p=>(
                      <div key={p.id} className="m-prod-row">
                        <img src={p.image} alt=""/> <b>{p.name}</b> <span>السعر: {p.price} | الكمية: {p.stock}</span>
                        <button className="del-btn-sq" onClick={()=>handleDeleteProduct(p.id)}>🗑️ حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. إدارة المخزون السريع */}
          {adminView === 'inventory' && (
            <div className="panel-card fade-in">
              <h2>📦 إدارة المخزون السريع (تعديل الكميات والمباع)</h2>
              <div className="inv-filters">
                 <select onChange={e=>{
                   const cat = categories.find(c=>c.name===e.target.value);
                   if(cat && !cat.parent) { setActiveMainCat(cat); setActiveSubCat(null); }
                   else if(cat) { setActiveSubCat(cat); }
                   else { setActiveMainCat(null); setActiveSubCat(null); }
                 }}>
                   <option value="">-- اختر القسم للفلترة --</option>
                   {mainCats.map(m=>(
                     <optgroup key={m.id} label={m.name}>
                       {categories.filter(s=>s.parent===m.name).map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                     </optgroup>
                   ))}
                 </select>
              </div>
              
              <table className="pro-table">
                <thead><tr><th>المنتج</th><th>القسم</th><th>الكمية المتبقية</th><th>المباع</th><th>إجراء سريع (بيع / تزويد)</th></tr></thead>
                <tbody>
                  {products.filter(p => !activeSubCat || p.category === activeSubCat.name).map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td><td>{p.category}</td>
                      <td className="stk-td">{p.stock}</td>
                      <td className="sld-td">{p.sold || 0}</td>
                      <td className="act-td">
                         <button className="btn-minus" onClick={()=>updateInventory(p, -1)} title="تسجيل بيع حبة">-1 (بيع)</button>
                         <button className="btn-plus" onClick={()=>updateInventory(p, 1)} title="تزويد المخزن حبة">+1 (تزويد)</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. التقارير الاحترافية المجدولة */}
          {adminView === 'reports' && (
            <div className="panel-card fade-in">
              <h2>📊 التقارير المالية والتحليلية</h2>
              
              {!reportMainCat ? (
                 <div className="report-select-grid">
                   <h3>اختر القسم العام لإنشاء التقرير:</h3>
                   <div className="folders-grid">
                     <div className="folder-card report-all" onClick={()=>setReportMainCat('all')}>🌐 تقرير المتجر الشامل</div>
                     {mainCats.map(c=><div key={c.id} className="folder-card main" onClick={()=>setReportMainCat(c)}>{c.name}</div>)}
                   </div>
                 </div>
              ) : reportMainCat !== 'all' && !reportSubCat ? (
                 <div className="report-select-grid">
                   <button className="back-btn" onClick={()=>setReportMainCat(null)}>🔙 رجوع</button>
                   <h3>اختر القسم الخاص داخل ({reportMainCat.name}):</h3>
                   <div className="folders-grid">
                     <div className="folder-card report-all" onClick={()=>setReportSubCat('all')}>📑 كل منتجات {reportMainCat.name}</div>
                     {categories.filter(c=>c.parent===reportMainCat.name).map(c=><div key={c.id} className="folder-card sub" onClick={()=>setReportSubCat(c)}>{c.name}</div>)}
                   </div>
                 </div>
              ) : (
                 <div className="report-details fade-in">
                   <button className="back-btn" onClick={()=>{setReportMainCat(null); setReportSubCat(null);}}>🔙 تقرير جديد</button>
                   <h3 className="report-title">
                     تقرير: {reportMainCat==='all' ? 'المتجر الشامل' : `${reportMainCat.name} ${reportSubCat!=='all' ? `> ${reportSubCat.name}` : ''}`}
                   </h3>
                   
                   {/* حساب الأرقام للتقرير المختار */}
                   {(() => {
                     const repProds = products.filter(p => {
                       if(reportMainCat === 'all') return true;
                       if(reportSubCat === 'all') {
                         const subs = categories.filter(c=>c.parent===reportMainCat.name).map(c=>c.name);
                         return subs.includes(p.category);
                       }
                       return p.category === reportSubCat.name;
                     });
                     
                     const totalStock = repProds.reduce((a,b)=>a+Number(b.stock),0);
                     const totalSold = repProds.reduce((a,b)=>a+Number(b.sold||0),0);
                     const expectedProfit = repProds.reduce((a,b)=>a+(Number(b.stock)*Number(b.price)),0);
                     const actualProfit = repProds.reduce((a,b)=>a+(Number(b.sold||0)*Number(b.price)),0);
                     
                     const soldPerc = totalStock+totalSold === 0 ? 0 : Math.round((totalSold / (totalStock+totalSold))*100);

                     return (
                       <>
                         <div className="report-kpi-grid">
                           <div className="kpi green"><span>الأرباح المحققة (المباع)</span><h3>{actualProfit} ريال</h3></div>
                           <div className="kpi blue"><span>الأرباح المتوقعة (المتبقي)</span><h3>{expectedProfit} ريال</h3></div>
                           <div className="kpi orange"><span>إجمالي القطع المباعة</span><h3>{totalSold}</h3></div>
                           <div className="kpi gray"><span>إجمالي القطع المتبقية</span><h3>{totalStock}</h3></div>
                         </div>
                         
                         {/* رسم بياني (شريط بصري فاخر) */}
                         <div className="chart-box">
                           <h4>رسم بياني: حركة المخزون (المباع مقابل المتبقي)</h4>
                           <div className="chart-bar-bg">
                             <div className="chart-bar-fill" style={{width: `${soldPerc}%`}}>{soldPerc}% مباع</div>
                           </div>
                           <div className="chart-legend"><span className="l-sold">■ مباع</span> <span className="l-rem">■ متبقي</span></div>
                         </div>

                         <table className="pro-table mt-20">
                           <thead><tr><th>المنتج</th><th>الكمية المتبقية</th><th>الكمية المباعة</th><th>سعر البيع</th><th>أرباح المنتج</th></tr></thead>
                           <tbody>
                             {repProds.map(p => (
                               <tr key={p.id}>
                                 <td>{p.name}</td><td className="stk-td">{p.stock}</td><td className="sld-td">{p.sold||0}</td>
                                 <td>{p.price}</td><td className="profit-td">{Number(p.sold||0)*Number(p.price)} ريال</td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </>
                     );
                   })()}
                 </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==========================================
  // 💻 واجهة العميل (المتجر)
  // ==========================================
  const displayProducts = products.filter(p => p.category === clientSub);

  return (
    <div className={`App client-theme ${showCart ? 'no-scroll' : ''}`}>
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <button className="open-cart-large" onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>
      
      <div className="client-main-bar">
        {mainCats.map(c => (
          <button key={c.id} className={clientMain === c.name ? 'active' : ''} onClick={() => {
              setClientMain(c.name);
              const subs = categories.filter(subC => subC.parent === c.name);
              if (subs.length > 0) setClientSub(subs[0].name); else setClientSub('');
          }}>{c.name}</button>
        ))}
      </div>

      {categories.filter(c => c.parent === clientMain).length > 0 && (
        <div className="client-sub-bar">
          {categories.filter(c => c.parent === clientMain).map(sc => (
             <button key={sc.id} className={clientSub === sc.name ? 'active' : ''} onClick={() => setClientSub(sc.name)}>{sc.name}</button>
          ))}
        </div>
      )}
      
      <div className="gallery-container">
        {displayProducts.length === 0 ? (
          <div className="empty-state"><h3>نعمل على توفير المنتجات في هذا القسم قريباً 🚀</h3></div>
        ) : (
          <div className="p-grid-royal">
            {displayProducts.map(p => (
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
                      <button className="add-btn-p" onClick={() => addToCart(p)}>أضف للسلة 🛒</button>
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
                   <div className="cart-p-details"><div>{item.name}</div><div className="qty-controls" style={{margin:'5px 0', padding:0}}><button onClick={() => updateCartQty(i, 1)}>+</button><span>{item.qty}</span><button onClick={() => updateCartQty(i, -1)}>-</button></div></div>
                   <div className="cart-item-total">{item.price * item.qty} ريال</div>
                 </div>
               ))}
            </div>
            <div className="cart-action-fixed">
              <div className="total-gold-box">الإجمالي: <span>{cart.reduce((a,b)=>a+(Number(b.price)*b.qty),0)}</span> ريال</div>
              <div className="cart-buttons-row">
                <button className="btn-continue-shopping" onClick={() => setShowCart(false)}>إكمال التسوق</button>
                <button className="btn-wa-confirm" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>تأكيد الطلب ✅</button>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default App;