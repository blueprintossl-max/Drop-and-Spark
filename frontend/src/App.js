/* eslint-disable */
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  // ==========================================
  // حالات النظام (States)
  // ==========================================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '', shop_name: '', admin_pin: '' });
  
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // -- الإدارة --
  const [adminView, setAdminView] = useState('workers'); 
  const [activeMainCat, setActiveMainCat] = useState(null);
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [newMainName, setNewMainName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false 
  });
  const [editingItem, setEditingItem] = useState(null);
  
  // -- مدخلات العمال --
  const [workerForm, setWorkerForm] = useState({ 
    name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', portfolio_img: '', safety_details: '' 
  });
  const [editingWorker, setEditingWorker] = useState(null);

  // -- العميل --
  const [showCart, setShowCart] = useState(false);
  const [showWorkersHaraj, setShowWorkersHaraj] = useState(false); 
  const [clientMain, setClientMain] = useState('');
  const [clientSub, setClientSub] = useState('');
  const [itemQtys, setItemQtys] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [harajRegion, setHarajRegion] = useState('');
  const [harajCity, setHarajCity] = useState('');

  const isAdmin = window.location.pathname.includes('/admin');

  // ==========================================
  // تحميل البيانات
  // ==========================================
  useEffect(() => { fetchAllData(); }, []); 
  useEffect(() => { if (alert) { const t = setTimeout(() => setAlert(null), 3500); return () => clearTimeout(t); } }, [alert]);

  const fetchAllData = async () => {
    try {
      const [pRes, cRes, wRes, sRes] = await Promise.all([
        fetch(`${API_URL}/products`), 
        fetch(`${API_URL}/categories`), 
        fetch(`${API_URL}/workers`), 
        fetch(`${API_URL}/settings`)
      ]);
      
      const cats = await cRes.json();
      setProducts(await pRes.json());
      setCategories(cats);
      setWorkers(await wRes.json());
      setSettings(await sRes.json());
      
      if (!isAdmin && cats.length > 0 && !clientMain) {
         const mains = cats.filter(c => !c.parent);
         if (mains.length > 0) {
           setClientMain(mains[0].name);
           const subs = cats.filter(c => c.parent === mains[0].name);
           if (subs.length > 0) setClientSub(subs[0].name);
         }
      }
    } catch (e) { console.error("خطأ في الاتصال بالسيرفر:", e); }
  };

  // ==========================================
  // دوال العمال وحراج الفنيين
  // ==========================================
  const handleSaveWorker = async () => {
    // الصور والتفاصيل غير الزامية أبداً!
    if (!workerForm.name || !workerForm.phone) {
      return setAlert("⚠️ يرجى إدخال اسم العامل ورقم الجوال كحد أدنى");
    }
    // التأكد من إدخال المحافظة إذا اختار المنطقة لكي لا يضيع العامل
    if (workerForm.region && !workerForm.city) {
      return setAlert("⚠️ يرجى كتابة اسم المحافظة بما أنك اخترت المنطقة");
    }
    
    const method = editingWorker ? 'PUT' : 'POST';
    const url = editingWorker ? `${API_URL}/workers/${editingWorker.id}` : `${API_URL}/workers`;
    const body = editingWorker ? { ...workerForm, hidden: editingWorker.hidden } : workerForm;
    
    try {
      const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (!res.ok) {
        setAlert(`❌ فشل الحفظ. يرجى تحديث قاعدة البيانات.`);
        return;
      }
      setAlert("✅ تم حفظ العامل في الحراج بنجاح!");
      setWorkerForm({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', portfolio_img: '', safety_details: '' });
      setEditingWorker(null);
      fetchAllData();
    } catch (e) { setAlert("❌ خطأ في الاتصال"); }
  };

  const handleToggleWorker = async (w) => {
    await fetch(`${API_URL}/workers/${w.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...w, hidden: !w.hidden }) });
    fetchAllData();
  };

  const handleDeleteWorker = async (id) => {
    if(window.confirm("حذف هذا العامل نهائياً؟")) { 
      await fetch(`${API_URL}/workers/${id}`, { method: 'DELETE' }); 
      fetchAllData(); 
    }
  };

  const handleWorkerProfileImage = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (ev) => { setWorkerForm({ ...workerForm, image: ev.target.result }); };
  };

  const handleWorkerPortfolioImage = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (ev) => { setWorkerForm({ ...workerForm, portfolio_img: ev.target.result }); };
  };

  const handleClientContactWorker = async (w) => {
    await fetch(`${API_URL}/workers/${w.id}/click`, { method: 'PUT' });
    window.open(`https://wa.me/${w.phone}?text=مرحباً، أريد الاستفسار عن خدماتك عبر منصة ${settings.shop_name}`);
    setTimeout(fetchAllData, 1000);
  };

  // ==========================================
  // دوال الأقسام والمنتجات
  // ==========================================
  const handleAddMain = async () => {
    if (!newMainName) return setAlert("اسم القسم مطلوب");
    await fetch(`${API_URL}/categories`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: newMainName, icon: '📁', parent: '' }) });
    setNewMainName(''); fetchAllData();
  };

  const handleAddSub = async () => {
    if (!newSubName) return setAlert("اسم القسم الفرعي مطلوب");
    await fetch(`${API_URL}/categories`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: newSubName, icon: '📂', parent: activeMainCat.name }) });
    setNewSubName(''); fetchAllData();
  };

  const handleDeleteCat = async (id) => { 
    if(window.confirm("تحذير: سيتم حذف القسم. هل أنت متأكد؟")) { await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' }); fetchAllData(); setActiveSubCat(null); } 
  };

  const handleSaveProduct = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...formData, category: activeSubCat.name }) });
    setAlert("✅ تم الحفظ بنجاح"); setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false }); fetchAllData();
  };

  const handleDeleteProduct = async (id) => { if(window.confirm("حذف المنتج نهائياً؟")) { await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }); fetchAllData(); } };

  const updateInventory = async (p, change) => {
    let newStock = Number(p.stock) + change; let newSold = Number(p.sold || 0);
    if (newStock < 0) newStock = 0; if (change < 0 && Number(p.stock) > 0) newSold += Math.abs(change);
    await fetch(`${API_URL}/products/${p.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...p, stock: newStock, sold: newSold }) }); fetchAllData();
  };

  const handleProductImage = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const img = new Image(); img.src = ev.target.result;
      img.onload = () => {
        const cvs = document.createElement('canvas'); cvs.width = 500; cvs.height = img.height * (500 / img.width);
        const ctx = cvs.getContext('2d'); ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
        setFormData({ ...formData, image: cvs.toDataURL('image/jpeg', 0.6) });
      };
    };
  };

  // ==========================================
  // سلة المشتريات
  // ==========================================
  const addToCart = (product, qty = 1) => {
    const customQty = itemQtys[product.id] || qty;
    const idx = cart.findIndex(i => i.id === product.id);
    if (idx >= 0) { const newC = [...cart]; newC[idx].qty += customQty; setCart(newC); } else { setCart([...cart, { ...product, qty: customQty }]); }
    setAlert(`✅ تمت إضافة ${customQty} إلى السلة`); setItemQtys(prev => ({ ...prev, [product.id]: 1 })); setSelectedProduct(null); 
  };
  const updateCartQty = (idx, change) => {
    const newCart = [...cart]; newCart[idx].qty += change;
    if (newCart[idx].qty <= 0) newCart.splice(idx, 1); setCart(newCart);
  };
  const handleQtyChange = (id, change) => { setItemQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + change) })); };
  const calcDiscount = (oldP, newP) => { if (!oldP || oldP <= newP) return null; return Math.round(((oldP - newP) / oldP) * 100); };

  const mainCats = categories.filter(c => !c.parent);

  // =========================================================================
  // 💻 واجهة الإدارة (Admin Panel) 
  // =========================================================================
  if (isAdmin) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          <div className="login-box glass-effect">
            <h1 className="gradient-text-large">الإدارة المركزية</h1>
            <p className="sub-login">يرجى إدخال الرقم السري للنظام</p>
            <input className="login-input" type="password" placeholder="أدخل الرمز هنا..." value={pinInput} onChange={e => setPinInput(e.target.value)} />
            <button onClick={() => { if (pinInput === settings.admin_pin) setIsAuthenticated(true); else setAlert("❌ رمز الدخول خاطئ!"); }}>دخول 🗝️</button>
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
          <div className="side-logo">⚙️ التحكم</div>
          <nav className="side-nav">
            <button className={adminView === 'workers' ? 'active' : ''} onClick={() => setAdminView('workers')}>👷‍♂️ إدارة العمال والمقاولين</button>
            <button className={adminView === 'categories' ? 'active' : ''} onClick={() => {setAdminView('categories'); setActiveMainCat(null); setActiveSubCat(null);}}>🗂️ المنتجات والأقسام</button>
            <button className={adminView === 'inventory' ? 'active' : ''} onClick={() => setAdminView('inventory')}>📦 إدارة المخزون والمبيعات</button>
            <button className={adminView === 'reports' ? 'active' : ''} onClick={() => setAdminView('reports')}>📊 التقارير المفصّلة</button>
            <button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>⚙️ إعدادات المتجر</button>
          </nav>
          <div className="side-footer"><a href="/">🌐 الذهاب للمتجر</a></div>
        </aside>

        <main className="content-70">
          
          {/* ==================== 1. حراج العمال ==================== */}
          {adminView === 'workers' && (
            <div className="panel-card fade-in">
              <h2>👷‍♂️ إدارة حراج العمال (إضافة عامل جديد)</h2>
              <div className="product-entry-form" style={{flexDirection: 'column'}}>
                <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                  <div className="worker-images-upload" style={{flex: '0 0 200px'}}>
                    <div className="img-upload-box mb-20">
                      {workerForm.image ? <img src={workerForm.image} alt="worker"/> : <div className="img-ph">الصورة (اختياري)</div>}
                      <label className="upload-label">رفع شخصية <input type="file" onChange={handleWorkerProfileImage} style={{display:'none'}}/></label>
                    </div>
                    <div className="img-upload-box">
                      {workerForm.portfolio_img ? <img src={workerForm.portfolio_img} alt="portfolio"/> : <div className="img-ph" style={{background:'#e8f4f8'}}>أعمال سابقة (اختياري)</div>}
                      <label className="upload-label">رفع أعمال سابقة <input type="file" onChange={handleWorkerPortfolioImage} style={{display:'none'}}/></label>
                    </div>
                  </div>
                  
                  <div className="data-entry-box" style={{flex: '1'}}>
                    <div className="f-row">
                      <input className="f-input" placeholder="اسم العامل رباعي (مطلوب)..." value={workerForm.name} onChange={e=>setWorkerForm({...workerForm, name:e.target.value})}/>
                      <input className="f-input" placeholder="المهنة (اختياري: سباك، كهربائي)..." value={workerForm.profession} onChange={e=>setWorkerForm({...workerForm, profession:e.target.value})}/>
                    </div>
                    <div className="f-row">
                      <input className="f-input" placeholder="رقم الجوال (مطلوب)..." value={workerForm.phone} onChange={e=>setWorkerForm({...workerForm, phone:e.target.value})}/>
                      <select className="f-input" value={workerForm.region} onChange={e=>setWorkerForm({...workerForm, region:e.target.value})}>
                        <option value="">-- المنطقة --</option>
                        <option value="الرياض">الرياض</option><option value="مكة المكرمة">مكة المكرمة</option><option value="المدينة المنورة">المدينة المنورة</option><option value="الشرقية">الشرقية</option><option value="القصيم">القصيم</option><option value="عسير">عسير</option><option value="تبوك">تبوك</option><option value="حائل">حائل</option><option value="الحدود الشمالية">الحدود الشمالية</option><option value="جازان">جازان</option><option value="نجران">نجران</option><option value="الباحة">الباحة</option><option value="الجوف">الجوف</option>
                      </select>
                      <input className="f-input" placeholder="اسم المحافظة (المدينة)..." value={workerForm.city} onChange={e=>setWorkerForm({...workerForm, city:e.target.value})}/>
                    </div>
                    <textarea className="f-input full" rows="2" placeholder="نبذة عن العامل (اختياري)..." value={workerForm.details} onChange={e=>setWorkerForm({...workerForm, details:e.target.value})}></textarea>
                    <textarea className="f-input full" rows="2" placeholder="تفاصيل السلامة (اختياري)..." value={workerForm.safety_details} onChange={e=>setWorkerForm({...workerForm, safety_details:e.target.value})}></textarea>
                    <button className="save-btn" onClick={handleSaveWorker}>{editingWorker ? 'تحديث البيانات' : 'حفظ العامل'}</button>
                  </div>
                </div>
              </div>
              
              <h3 className="mt-30">العمال المسجلين:</h3>
              <div className="folders-grid">
                {workers.map(w => (
                  <div key={w.id} className={`worker-admin-card ${w.hidden ? 'dimmed' : ''}`} style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                    <div style={{display: 'flex', gap: '15px', width: '100%'}}>
                      {/* عرض أيقونة افتراضية إذا لم تكن هناك صورة */}
                      {w.image ? <img src={w.image} alt={w.name} /> : <div className="default-avatar-small">👷‍♂️</div>}
                      <div className="w-info">
                        <h4>{w.name} <span style={{color:'var(--gold)', fontSize:'0.9rem'}}>({w.profession})</span></h4>
                        <p className="w-loc">📍 {w.region} - {w.city}</p>
                        <p>📞 {w.phone}</p>
                      </div>
                    </div>
                    <div className="worker-stats-bar">📊 تم التواصل معه عبر التطبيق: <b>{w.contact_clicks || 0}</b> مرة</div>
                    <div className="w-actions" style={{width: '100%', marginTop: '10px', justifyContent: 'center'}}>
                      <button className="act-btn edit" onClick={()=>{setEditingWorker(w); setWorkerForm(w);}}>✏️ تعديل</button>
                      <button className="act-btn hide" onClick={()=>handleToggleWorker(w)}>{w.hidden ? '👁️ إظهار' : '🚫 إخفاء'}</button>
                      <button className="act-btn del" onClick={()=>handleDeleteWorker(w.id)}>🗑️ حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 2. الإعدادات ==================== */}
          {adminView === 'settings' && (
            <div className="panel-card fade-in">
              <h2>⚙️ إعدادات النظام</h2>
              <div className="settings-grid">
                <div className="form-group"><label>اسم المتجر</label><input value={settings.shop_name} onChange={e=>setSettings({...settings, shop_name:e.target.value})}/></div>
                <div className="form-group"><label>رقم الجوال (واتساب)</label><input value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})}/></div>
                <div className="form-group"><label>الرقم السري للإدارة</label><input value={settings.admin_pin} onChange={e=>setSettings({...settings, admin_pin:e.target.value})}/></div>
              </div>
              <button className="save-btn" onClick={async()=>{
                await fetch(`${API_URL}/settings`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(settings)}); 
                setAlert("✅ تم الحفظ الإعدادات بنجاح");
              }}>حفظ الإعدادات 💾</button>
            </div>
          )}
          
          {/* ==================== 3. الأقسام والمنتجات ==================== */}
          {adminView === 'categories' && (
            <div className="fade-in">
              {!activeMainCat ? (
                <div className="panel-card">
                  <h2>1. الأقسام الرئيسية</h2>
                  <div className="add-row mb-20"><input placeholder="اسم القسم الرئيسي..." value={newMainName} onChange={e=>setNewMainName(e.target.value)}/><button className="add-btn" onClick={handleAddMain}>إضافة</button></div>
                  <div className="folders-grid">{mainCats.map(c => (<div key={c.id} className="folder-card main" onClick={()=>setActiveMainCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e)=>{e.stopPropagation(); handleDeleteCat(c.id);}}>حذف</button></div>))}</div>
                </div>
              ) : !activeSubCat ? (
                <div className="panel-card">
                  <button className="back-btn" onClick={()=>setActiveMainCat(null)}>🔙 رجوع</button>
                  <h2>2. الأقسام الفرعية داخل ({activeMainCat.name})</h2>
                  <div className="add-row mb-20"><input placeholder="اسم القسم الفرعي..." value={newSubName} onChange={e=>setNewSubName(e.target.value)}/><button className="add-btn" onClick={handleAddSub}>إضافة</button></div>
                  <div className="folders-grid">{categories.filter(c => c.parent === activeMainCat.name).map(c => (<div key={c.id} className="folder-card sub" onClick={()=>setActiveSubCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e)=>{e.stopPropagation(); handleDeleteCat(c.id);}}>حذف</button></div>))}</div>
                </div>
              ) : (
                <div className="panel-card">
                  <button className="back-btn" onClick={()=>{setActiveSubCat(null); setEditingItem(null); setFormData({name:'', price:'', old_price:'', stock:'', details:'', image:'', is_sale:false, out_of_stock:false});}}>🔙 رجوع</button>
                  <div className="path-header">{activeMainCat.name} ⬅️ {activeSubCat.name}</div>
                  <div className="product-entry-form">
                    <div className="img-upload-box">
                      {formData.image ? <img src={formData.image} alt="prod"/> : <div className="img-ph">صورة المنتج</div>}
                      <label className="upload-label">رفع صورة <input type="file" onChange={handleProductImage} style={{display:'none'}}/></label>
                    </div>
                    <div className="data-entry-box">
                      <input className="f-input" placeholder="اسم المنتج..." value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                      <textarea className="f-input" rows="3" placeholder="تفاصيل ومميزات المنتج للعميل..." value={formData.details} onChange={e=>setFormData({...formData, details:e.target.value})}></textarea>
                      <div className="f-row">
                        <input className="f-input" type="number" placeholder="السعر" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                        <input className="f-input" type="number" placeholder="سعر قديم" value={formData.old_price} onChange={e=>setFormData({...formData, old_price:e.target.value})}/>
                        <input className="f-input" type="number" placeholder="الكمية" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})}/>
                      </div>
                      <div className="f-toggles">
                        <button className={`t-btn ${formData.is_sale ? 'active' : ''}`} onClick={()=>setFormData({...formData, is_sale:!formData.is_sale})}>🔥 يشمل العرض</button>
                        <button className={`t-btn ${formData.out_of_stock ? 'active-out' : ''}`} onClick={()=>setFormData({...formData, out_of_stock:!formData.out_of_stock})}>🚫 نفدت الكمية</button>
                        <button className="save-btn" onClick={handleSaveProduct}>{editingItem ? 'تحديث المنتج' : 'حفظ المنتج'}</button>
                      </div>
                    </div>
                  </div>
                  <div className="mini-products-list mt-30">
                    <h3 style={{color:'var(--navy)'}}>المنتجات المسجلة هنا:</h3>
                    {products.filter(p => p.category === activeSubCat.name).map(p => (
                      <div key={p.id} className="m-prod-row" onClick={()=>{setEditingItem(p); setFormData(p);}}>
                        <img src={p.image} alt=""/><b>{p.name}</b>
                        <span style={{color:'var(--green)', fontWeight:'bold'}}>{p.price} ر.س</span>
                        <button className="del-btn-sq" onClick={(e)=>{e.stopPropagation(); handleDeleteProduct(p.id);}}>حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* ==================== 4. المخزون والتقارير ==================== */}
          {adminView === 'inventory' && (
            <div className="panel-card fade-in">
              <h2>📦 إدارة المخزون والمبيعات</h2>
              <table className="pro-table">
                <thead><tr><th>المنتج</th><th>المتبقي</th><th>المباع</th><th>تعديل للصندوق</th></tr></thead>
                <tbody>{products.map(p => (<tr key={p.id}><td>{p.name}</td><td className="stk-td">{p.stock}</td><td className="sld-td">{p.sold || 0}</td><td className="act-td"><button className="btn-minus" onClick={()=>updateInventory(p, -1)}>-1 بيع</button><button className="btn-plus" onClick={()=>updateInventory(p, 1)}>+1 تزويد</button></td></tr>))}</tbody>
              </table>
            </div>
          )}
          
          {adminView === 'reports' && (
            <div className="panel-card fade-in">
              <h2>📊 تقارير الأقسام المالية</h2>
              <div className="reports-split-container">
                {mainCats.map(m => {
                  const subNames = categories.filter(c => c.parent === m.name).map(x => x.name);
                  const myProducts = products.filter(p => subNames.includes(p.category));
                  const sectionProfit = myProducts.reduce((a,b) => a + ((Number(b.sold)||0) * Number(b.price)), 0);
                  const sectionSold = myProducts.reduce((a,b) => a + (Number(b.sold)||0), 0);
                  return (
                    <div key={m.id} className="report-main-section">
                      <h3 className="r-header">تقرير: {m.name}</h3>
                      <div style={{display:'flex', gap:'20px', marginBottom:'20px'}}><div style={{background:'#e8f4f8', padding:'15px', borderRadius:'10px', flex:1, textAlign:'center'}}><h4 style={{margin:0, color:'var(--navy)'}}>إجمالي أرباح القسم</h4><h2 style={{margin:'10px 0 0 0', color:'var(--green)'}}>{sectionProfit} ر.س</h2></div><div style={{background:'#fff3cd', padding:'15px', borderRadius:'10px', flex:1, textAlign:'center'}}><h4 style={{margin:0, color:'var(--navy)'}}>القطع المباعة</h4><h2 style={{margin:'10px 0 0 0', color:'var(--gold)'}}>{sectionSold} قطعة</h2></div></div>
                      <table className="pro-table">
                        <thead><tr><th>المنتج</th><th>الفرعي</th><th>الموجود</th><th>المباع</th><th>الأرباح</th></tr></thead>
                        <tbody>{myProducts.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>لا توجد بيانات</td></tr>}{myProducts.map(p => (<tr key={p.id}><td>{p.name}</td><td><span className="sc-badge">{p.category}</span></td><td className="stk-td">{p.stock}</td><td className="sld-td">{p.sold || 0}</td><td className="profit-td">{(p.sold || 0) * p.price} ر.س</td></tr>))}</tbody>
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
  // 💻 واجهة العميل (Storefront) - الفلترة الصارمة والذكية
  // =========================================================================
  const searchResults = products.filter(p => p.name.includes(searchQuery));
  const displayProducts = searchQuery ? searchResults : products.filter(p => p.category === clientSub);

  // 🌟 نظام فلترة العمال الصارم (إجباري اختيار المنطقة ثم المحافظة)
  const visibleWorkers = workers.filter(w => !w.hidden);
  const availableRegions = [...new Set(visibleWorkers.map(w => w.region).filter(Boolean))];
  const availableCities = harajRegion ? [...new Set(visibleWorkers.filter(w => w.region === harajRegion).map(w => w.city).filter(Boolean))] : [];
  
  // لا يظهر العمال إلا إذا تطابقت المنطقة والمحافظة مع اختيار العميل
  const filteredWorkers = visibleWorkers.filter(w => {
    if (!harajRegion || !harajCity) return false; 
    return w.region === harajRegion && w.city === harajCity;
  });

  return (
    <div className={`App client-theme ${showCart || selectedProduct || showWorkersHaraj ? 'no-scroll' : ''}`}>
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <div className="search-bar-wrapper"><input placeholder="🔍 ابحث عن أي منتج..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
         <button className="worker-haraj-btn" onClick={() => {setShowWorkersHaraj(true); setHarajRegion(''); setHarajCity('');}} title="حراج العمال">👷‍♂️ <span className="hide-mobile">العمال</span></button>
         <button className="open-cart-large desktop-only" onClick={() => setShowCart(true)}>🛒 <span>{cart.length}</span></button>
      </header>
      
      {!searchQuery && (
        <>
          <div className="client-main-bar">{mainCats.map(c => (<button key={c.id} className={clientMain === c.name ? 'active' : ''} onClick={() => { setClientMain(c.name); const subs = categories.filter(x => x.parent === c.name); if (subs.length > 0) setClientSub(subs[0].name); else setClientSub(''); }}>{c.name}</button>))}</div>
          {categories.filter(c => c.parent === clientMain).length > 0 && (<div className="client-sub-bar">{categories.filter(c => c.parent === clientMain).map(s => (<button key={s.id} className={clientSub === s.name ? 'active' : ''} onClick={() => setClientSub(s.name)}>{s.name}</button>))}</div>)}
        </>
      )}
      
      <div className="gallery-container">
        {searchQuery && <h2 className="search-title">نتائج البحث:</h2>}
        {displayProducts.length === 0 ? (
          <div className="empty-state"><div style={{fontSize:'4rem', marginBottom:'15px'}}>🧐</div><h3>لم نتمكن من إيجاد شيء هنا.</h3></div>
        ) : (
          <div className="p-grid-royal">
            {displayProducts.map(p => {
              const discount = calcDiscount(p.old_price, p.price);
              const isLowStock = Number(p.stock) > 0 && Number(p.stock) <= 3;
              return (
                <div key={p.id} className="royal-p-card" onClick={() => setSelectedProduct(p)}>
                  {p.out_of_stock && <div className="sold-tag">نفدت الكمية</div>}
                  {p.is_sale && <div className="fire-inline">🔥 عرض خاص</div>}
                  {discount && <div className="discount-badge">خصم {discount}%</div>}
                  <div className="p-img-box"><img src={p.image} alt={p.name} /></div>
                  <div className="p-info-box">
                    <h4>{p.name}</h4>
                    <div className="price-area"><span className="now-price">{p.price} ر.س</span>{Number(p.old_price) > 0 && <del className="old-price">{p.old_price}</del>}</div>
                    {isLowStock && !p.out_of_stock && <div className="low-stock-alert">باقي {p.stock} فقط</div>}
                    <div className="action-area">
                      {!p.out_of_stock && (<div className="qty-controls" onClick={e => e.stopPropagation()}><button onClick={() => handleQtyChange(p.id, 1)}>+</button><span>{itemQtys[p.id] || 1}</span><button onClick={() => handleQtyChange(p.id, -1)}>-</button></div>)}
                      <button className={`add-btn-p ${p.out_of_stock ? 'disabled' : ''}`} disabled={p.out_of_stock} onClick={(e) => { e.stopPropagation(); if (!p.out_of_stock) addToCart(p); }}>{p.out_of_stock ? 'غير متوفر' : 'أضف للسلة 🛒'}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      {cart.length > 0 && (<div className="mobile-sticky-cart" onClick={() => setShowCart(true)}><div className="m-cart-info">🛒 السلة: <b>{cart.length}</b> عناصر</div><div className="m-cart-total">{cart.reduce((a,b) => a + (b.price * b.qty), 0)} ر.س</div></div>)}

      {/* ========================================================= */}
      {/* 🌟 نافذة حراج العمال للعميل (فلترة إجبارية ودقيقة) 🌟 */}
      {/* ========================================================= */}
      {showWorkersHaraj && (
        <div className="product-modal-overlay" onClick={() => setShowWorkersHaraj(false)}>
          <div className="worker-haraj-modal fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="haraj-header"><h2>👷‍♂️ حراج العمال والمقاولين</h2><button onClick={() => setShowWorkersHaraj(false)}>✕</button></div>
            
            <div className="haraj-filters">
              <select value={harajRegion} onChange={e => { setHarajRegion(e.target.value); setHarajCity(''); }}>
                <option value="">🌍 1. اختر المنطقة أولاً...</option>
                {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={harajCity} onChange={e => setHarajCity(e.target.value)} disabled={!harajRegion}>
                <option value="">🏙️ 2. ثم اختر المحافظة...</option>
                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="workers-list-client">
              {!harajRegion ? (
                <div className="empty-msg"><span style={{fontSize:'3rem'}}>🌍</span><p>الرجاء اختيار منطقتك من الأعلى لعرض المحافظات.</p></div>
              ) : !harajCity ? (
                <div className="empty-msg"><span style={{fontSize:'3rem'}}>🏙️</span><p>ممتاز، الآن الرجاء تحديد المحافظة لعرض العمال المتاحين لديك.</p></div>
              ) : filteredWorkers.length === 0 ? (
                <div className="empty-msg"><span style={{fontSize:'3rem'}}>👷‍♂️</span><p>عذراً، لا يوجد عمال متاحين في هذه المحافظة حالياً.</p></div>
              ) : (
                filteredWorkers.map(w => (
                  <div key={w.id} className="worker-client-card" style={{flexDirection: 'column'}}>
                    <div style={{display:'flex', gap:'15px', width:'100%', alignItems:'center'}}>
                      {w.image ? <img src={w.image} alt={w.name} /> : <div className="default-avatar">👷‍♂️</div>}
                      <div className="wc-info">
                        <h3>{w.name} <span style={{fontSize:'0.9rem', color:'var(--gold)'}}>({w.profession || 'عامل'})</span></h3>
                        <p className="w-loc">📍 {w.region} - {w.city}</p>
                        {w.details && <p style={{margin:0, color:'#555'}}>{w.details}</p>}
                      </div>
                    </div>
                    {w.safety_details && (<div className="safety-box">🛡️ <b>إجراءات السلامة:</b> {w.safety_details}</div>)}
                    {w.portfolio_img && (<div className="portfolio-box"><b>🖼️ أعماله السابقة:</b><img src={w.portfolio_img} alt="portfolio" className="pf-img" /></div>)}
                    <button className="wa-contact-btn" onClick={() => handleClientContactWorker(w)}>تواصل مباشر عبر الواتساب 💬</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🌟 نافذة تفاصيل المنتج */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content fade-in-up" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="modal-body-split">
              <div className="m-img-side">
                {calcDiscount(selectedProduct.old_price, selectedProduct.price) && (<div className="m-discount">خصم {calcDiscount(selectedProduct.old_price, selectedProduct.price)}%</div>)}
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>
              <div className="m-details-side">
                <h2>{selectedProduct.name}</h2>
                <div className="m-price-box"><span className="m-now">{selectedProduct.price} ر.س</span>{Number(selectedProduct.old_price) > 0 && <del className="m-old">{selectedProduct.old_price} ر.س</del>}</div>
                <div className="m-desc-box"><h3>التفاصيل والمميزات:</h3><div className="m-desc">{selectedProduct.details || 'لا توجد تفاصيل إضافية لهذا المنتج.'}</div></div>
                {!selectedProduct.out_of_stock ? (<button className="m-add-btn" onClick={() => addToCart(selectedProduct)}>إضافة للسلة 🛒</button>) : (<button className="m-add-btn disabled" disabled>🚫 نفدت الكمية</button>)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 🛒 السلة */}
      {showCart && (
        <div className={`cart-overlay open`}>
          <div className="cart-inner-container">
            <div className="cart-header-fixed"><h2>سلة المشتريات</h2><button className="close-btn-x" onClick={() => setShowCart(false)}>✕</button></div>
            <div className="cart-products-scroll">
              {cart.length === 0 && <p style={{textAlign:'center', marginTop:'50px', fontSize:'1.2rem'}}>سلتك فارغة</p>}
              {cart.map((item, i) => (
                <div key={i} className="cart-product-row">
                  <img src={item.image} alt="" className="cart-p-img" />
                  <div className="cart-p-details">
                    <div style={{fontWeight:'bold', color:'var(--navy)', marginBottom:'5px'}}>{item.name}</div>
                    <div className="qty-controls-mini"><button onClick={() => updateCartQty(i, 1)}>+</button><span>{item.qty}</span><button onClick={() => updateCartQty(i, -1)}>-</button></div>
                  </div>
                  <div className="cart-item-total">{item.price * item.qty} ر.س</div>
                </div>
              ))}
            </div>
            <div className="cart-action-fixed">
              <div className="total-gold-box">الإجمالي: <span>{cart.reduce((a,b) => a + (b.price * b.qty), 0)}</span> ر.س</div>
              <div className="cart-buttons-row">
                <button className="btn-continue-shopping" onClick={() => setShowCart(false)}>تسوق</button>
                <button className="btn-wa-confirm" onClick={() => {
                  let msg = `*طلب جديد* 🛒\n\n`; cart.forEach(c => msg += `▪️ ${c.name} (${c.qty})\n`); msg += `\n*الإجمالي: ${cart.reduce((a,b)=>a+(b.price*b.qty),0)} ر.س*`;
                  window.open(`https://wa.me/${settings.phone}?text=${encodeURIComponent(msg)}`);
                }}>تأكيد (واتساب) ✅</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;