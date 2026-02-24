/* eslint-disable */
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '', shop_name: '' });
  const [admins, setAdmins] = useState([]); 
  
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  
  const [adminView, setAdminView] = useState('inventory'); 
  const [activeMainCat, setActiveMainCat] = useState(null);
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [newMainName, setNewMainName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  
  const [invMainCat, setInvMainCat] = useState(null);
  const [invSubCat, setInvSubCat] = useState(null);

  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false });
  const [editingItem, setEditingItem] = useState(null);
  
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', portfolio_img: '', safety_details: '', rating: '5.0', is_busy: false });
  const [editingWorker, setEditingWorker] = useState(null);
  
  const [newAdminForm, setNewAdminForm] = useState({ username: '', pin: '', role: 'موظف' });

  const [showCart, setShowCart] = useState(false);
  const [showWorkersHaraj, setShowWorkersHaraj] = useState(false); 
  const [clientMain, setClientMain] = useState('');
  const [clientSub, setClientSub] = useState('');
  const [itemQtys, setItemQtys] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [harajRegion, setHarajRegion] = useState('');
  const [harajCity, setHarajCity] = useState('');
  const [sortOption, setSortOption] = useState('default');

  const isAdminPanel = window.location.pathname.includes('/admin');

  useEffect(() => { fetchAllData(); }, []); 
  useEffect(() => { if (alert) { const timer = setTimeout(() => { setAlert(null); }, 4000); return () => clearTimeout(timer); } }, [alert]);

  const fetchAllData = async () => {
    try {
      const [pRes, cRes, wRes, sRes, aRes] = await Promise.all([
        fetch(`${API_URL}/products`), fetch(`${API_URL}/categories`), fetch(`${API_URL}/workers`), fetch(`${API_URL}/settings`), fetch(`${API_URL}/admins`)
      ]);
      const catsData = await cRes.json();
      setProducts(await pRes.json());
      setCategories(catsData);
      setWorkers(await wRes.json());
      setSettings(await sRes.json());
      setAdmins(await aRes.json());
      
      if (!isAdminPanel && catsData.length > 0 && !clientMain) {
         const mainCategories = catsData.filter(c => !c.parent);
         if (mainCategories.length > 0) {
           setClientMain(mainCategories[0].name);
           const subCategories = catsData.filter(c => c.parent === mainCategories[0].name);
           if (subCategories.length > 0) { setClientSub(subCategories[0].name); }
         }
      }
    } catch (error) { console.error("Data Fetch Error:", error); }
  };

  const handleLogin = () => {
    const user = admins.find(a => a.username === loginUsername && a.pin === loginPin);
    if (user) { setCurrentUser(user); setIsAuthenticated(true); setAlert(`✅ مرحباً بك يا ${user.username}`); } 
    else { setAlert("❌ اسم المستخدم أو الرمز السري خاطئ"); }
  };

  const handleAddAdmin = async () => {
    if (!newAdminForm.username || !newAdminForm.pin) return setAlert("⚠️ يرجى إدخال اسم الموظف والرمز");
    try {
      const res = await fetch(`${API_URL}/admins`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAdminForm) });
      if (res.ok) { setAlert("✅ تم إضافة الموظف"); setNewAdminForm({ username: '', pin: '', role: 'موظف' }); fetchAllData(); } 
      else { setAlert("❌ اسم الموظف مسجل مسبقاً"); }
    } catch (e) { console.error(e); }
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm("حذف الموظف؟")) { await fetch(`${API_URL}/admins/${id}`, { method: 'DELETE' }); setAlert("🗑️ تم حذف الموظف"); fetchAllData(); }
  };

  const handleSaveProduct = async () => {
    if (!formData.name) return setAlert("⚠️ يرجى إدخال اسم المنتج");
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    const payload = { ...formData, category: activeSubCat.name, modified_by: currentUser.username };
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setAlert("✅ تم حفظ المنتج"); setEditingItem(null); setFormData({ name: '', price: '', old_price: '', stock: '', details: '', image: '', is_sale: false, out_of_stock: false }); fetchAllData();
  };

  const updateInventoryFast = async (product, change) => {
    let newStock = Number(product.stock) + change; let newSold = Number(product.sold || 0);
    if (newStock < 0) newStock = 0; if (change < 0 && Number(product.stock) > 0) newSold += Math.abs(change);
    await fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...product, stock: newStock, sold: newSold, modified_by: currentUser.username }) }); 
    fetchAllData();
  };

  const handleDeleteProduct = async (id) => { if (window.confirm("حذف المنتج؟")) { await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }); setAlert("🗑️ تم حذف المنتج"); fetchAllData(); } };
  const handleAddMainCategory = async () => { if (!newMainName) return; await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newMainName, icon: '📁', parent: '' }) }); setNewMainName(''); fetchAllData(); };
  const handleAddSubCategory = async () => { if (!newSubName) return; await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSubName, icon: '📂', parent: activeMainCat.name }) }); setNewSubName(''); fetchAllData(); };
  const handleDeleteCategory = async (id) => { if (window.confirm("حذف القسم؟")) { await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' }); fetchAllData(); setActiveSubCat(null); setInvSubCat(null); } };

  const handleSaveWorker = async () => {
    if (!workerForm.name || !workerForm.phone) return setAlert("⚠️ يرجى إدخال اسم العامل ورقم الجوال");
    if (workerForm.region && !workerForm.city) return setAlert("⚠️ يرجى كتابة المحافظة");
    const method = editingWorker ? 'PUT' : 'POST';
    const url = editingWorker ? `${API_URL}/workers/${editingWorker.id}` : `${API_URL}/workers`;
    const payload = editingWorker ? { ...workerForm, hidden: editingWorker.hidden, modified_by: currentUser.username } : { ...workerForm, modified_by: currentUser.username };
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setAlert("✅ تم حفظ العامل!"); setWorkerForm({ name: '', phone: '', details: '', image: '', region: '', city: '', profession: '', portfolio_img: '', safety_details: '', rating: '5.0', is_busy: false }); setEditingWorker(null); fetchAllData(); }
  };

  const handleToggleWorker = async (w) => { await fetch(`${API_URL}/workers/${w.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...w, hidden: !w.hidden, modified_by: currentUser.username }) }); fetchAllData(); };
  const handleDeleteWorker = async (id) => { if (window.confirm("حذف العامل؟")) { await fetch(`${API_URL}/workers/${id}`, { method: 'DELETE' }); fetchAllData(); } };
  const handleClientContactWorker = async (w) => { await fetch(`${API_URL}/workers/${w.id}/click`, { method: 'PUT' }); window.open(`https://wa.me/${w.phone}?text=مرحباً، أريد الاستفسار عن خدماتك عبر منصة ${settings.shop_name}`); setTimeout(fetchAllData, 1500); };

  const handleImageUpload = (e, targetField, isWorker = false) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => { 
      if (isWorker) setWorkerForm({ ...workerForm, [targetField]: event.target.result });
      else {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => {
          const cvs = document.createElement('canvas'); cvs.width = 500; cvs.height = img.height * (500 / img.width);
          const ctx = cvs.getContext('2d'); ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
          setFormData({ ...formData, [targetField]: cvs.toDataURL('image/jpeg', 0.6) });
        };
      }
    };
  };

  const addToCart = (product, qty = 1) => {
    const customQty = itemQtys[product.id] || qty;
    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) { const newCart = [...cart]; newCart[existingIndex].qty += customQty; setCart(newCart); } 
    else { setCart([...cart, { ...product, qty: customQty }]); }
    setAlert(`✅ أضفت ${customQty} للسلة`); setItemQtys(prev => ({ ...prev, [product.id]: 1 })); setSelectedProduct(null); 
  };
  const updateCartItemQuantity = (index, change) => { const newCart = [...cart]; newCart[index].qty += change; if (newCart[index].qty <= 0) { newCart.splice(index, 1); } setCart(newCart); };
  const handleProductQuantityChange = (id, change) => { setItemQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + change) })); };
  const calculateDiscountPercentage = (oldPrice, newPrice) => { if (!oldPrice || oldPrice <= newPrice) return null; return Math.round(((oldPrice - newPrice) / oldPrice) * 100); };

  const mainCategoriesList = categories.filter(c => !c.parent);
  const totalSystemProducts = products.length;
  const totalSystemWorkers = workers.length;
  const totalSystemProfits = products.reduce((sum, p) => sum + ((Number(p.sold) || 0) * Number(p.price)), 0);

  if (isAdminPanel) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          <div className="login-box glass-effect">
            <h1 className="gradient-text-large">نظام الإدارة</h1>
            <p className="sub-login">اختر حساب الموظف للوصول لصلاحياتك</p>
            <select className="login-input" value={loginUsername} onChange={e => setLoginUsername(e.target.value)}>
              <option value="">-- اختر حسابك --</option>
              {admins.map(a => <option key={a.id} value={a.username}>{a.username} ({a.role})</option>)}
            </select>
            <input className="login-input" type="password" placeholder="أدخل الرمز السري..." value={loginPin} onChange={e => setLoginPin(e.target.value)} />
            <button onClick={handleLogin}>تسجيل الدخول 🗝️</button>
            <a href="/" className="login-back-link">العودة للواجهة الرئيسية 🏠</a>
          </div>
          {alert && <div className="toast-notification">{alert}</div>}
        </div>
      );
    }

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ الإدارة<div className="user-badge">👤 {currentUser.username} | {currentUser.role}</div></div>
          <nav className="side-nav">
            <button className={adminView === 'inventory' ? 'active' : ''} onClick={() => {setAdminView('inventory'); setInvMainCat(null); setInvSubCat(null);}}>📦 المخزون الهرمي</button>
            <button className={adminView === 'categories' ? 'active' : ''} onClick={() => {setAdminView('categories'); setActiveMainCat(null); setActiveSubCat(null); setEditingItem(null);}}>🗂️ المنتجات والأقسام</button>
            <button className={adminView === 'workers' ? 'active' : ''} onClick={() => setAdminView('workers')}>👷‍♂️ حراج العمال</button>
            <button className={adminView === 'reports' ? 'active' : ''} onClick={() => setAdminView('reports')}>📊 التقارير والأرباح</button>
            {currentUser.role === 'مدير' && <button className={adminView === 'users' ? 'active' : ''} onClick={() => setAdminView('users')}>👥 الموظفين والصلاحيات</button>}
            {currentUser.role === 'مدير' && <button className={adminView === 'settings' ? 'active' : ''} onClick={() => setAdminView('settings')}>⚙️ إعدادات المتجر</button>}
          </nav>
          <div className="side-footer"><button className="logout-btn" onClick={() => {setIsAuthenticated(false); setCurrentUser(null); setLoginPin('');}}>تسجيل الخروج 🚪</button></div>
        </aside>

        <main className="content-70">
          <div className="admin-top-dashboard">
            <div className="dash-card"><h4>المنتجات المسجلة</h4><h2>{totalSystemProducts}</h2></div>
            <div className="dash-card"><h4>العمال والمقاولين</h4><h2>{totalSystemWorkers}</h2></div>
            <div className="dash-card highlight-card"><h4>إجمالي أرباح المبيعات</h4><h2>{totalSystemProfits} <span>ر.س</span></h2></div>
          </div>

          {adminView === 'inventory' && (
            <div className="fade-in">
              {!invMainCat ? (
                <div className="panel-card"><h2>📦 الجرد: القسم الرئيسي</h2><div className="folders-grid">{mainCategoriesList.map(cat => (<div key={cat.id} className="folder-card main" onClick={() => setInvMainCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>
              ) : !invSubCat ? (
                <div className="panel-card"><button className="back-btn" onClick={() => setInvMainCat(null)}>🔙 رجوع</button><h2>📦 الجرد: القسم الفرعي لـ ({invMainCat.name})</h2><div className="folders-grid">{categories.filter(c => c.parent === invMainCat.name).map(cat => (<div key={cat.id} className="folder-card sub" onClick={() => setInvSubCat(cat)}><h3>{cat.name}</h3></div>))}</div></div>
              ) : (
                <div className="panel-card"><button className="back-btn" onClick={() => setInvSubCat(null)}>🔙 رجوع</button><div className="path-header">مستودع: {invMainCat.name} ⬅️ {invSubCat.name}</div>
                  <table className="pro-table"><thead><tr><th>المنتج</th><th>الكمية</th><th>المباع</th><th>إجراء سريع</th><th>بواسطة</th></tr></thead>
                    <tbody>
                      {products.filter(p => p.category === invSubCat.name).length === 0 && (<tr><td colSpan="5" style={{textAlign:'center'}}>المستودع فارغ</td></tr>)}
                      {products.filter(p => p.category === invSubCat.name).map(product => (
                        <tr key={product.id}><td>{product.name}</td><td className="stk-td">{product.stock}</td><td className="sld-td">{product.sold || 0}</td>
                          <td className="act-td"><button className="btn-minus" onClick={() => updateInventoryFast(product, -1)}>-1 بيع</button><button className="btn-plus" onClick={() => updateInventoryFast(product, 1)}>+1 تزويد</button></td>
                          <td className="mod-td">👤 {product.modified_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {adminView === 'categories' && (
            <div className="fade-in">
              {!activeMainCat ? (
                <div className="panel-card"><h2>1. الأقسام الرئيسية</h2><div className="add-row mb-20"><input placeholder="قسم رئيسي..." value={newMainName} onChange={e => setNewMainName(e.target.value)}/><button className="add-btn" onClick={handleAddMainCategory}>إضافة</button></div><div className="folders-grid">{mainCategoriesList.map(c => (<div key={c.id} className="folder-card main" onClick={() => setActiveMainCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => {e.stopPropagation(); handleDeleteCategory(c.id);}}>حذف</button></div>))}</div></div>
              ) : !activeSubCat ? (
                <div className="panel-card"><button className="back-btn" onClick={() => setActiveMainCat(null)}>🔙 رجوع</button><h2>2. الفرعية لـ ({activeMainCat.name})</h2><div className="add-row mb-20"><input placeholder="قسم فرعي..." value={newSubName} onChange={e => setNewSubName(e.target.value)}/><button className="add-btn" onClick={handleAddSubCategory}>إضافة</button></div><div className="folders-grid">{categories.filter(c => c.parent === activeMainCat.name).map(c => (<div key={c.id} className="folder-card sub" onClick={() => setActiveSubCat(c)}><h3>{c.name}</h3><button className="del-btn-corner" onClick={(e) => {e.stopPropagation(); handleDeleteCategory(c.id);}}>حذف</button></div>))}</div></div>
              ) : (
                <div className="panel-card"><button className="back-btn" onClick={() => {setActiveSubCat(null); setEditingItem(null);}}>🔙 رجوع</button><div className="path-header">{activeMainCat.name} ⬅️ {activeSubCat.name}</div>
                  <div className="product-entry-form"><div className="img-upload-box">{formData.image ? (<img src={formData.image} alt="prod"/>) : (<div className="img-ph">صورة المنتج</div>)}<label className="upload-label">اختر صورة <input type="file" onChange={(e) => handleImageUpload(e, 'image', false)} style={{display:'none'}}/></label></div>
                    <div className="data-entry-box">
                      <input className="f-input full" placeholder="اسم المنتج..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                      <textarea className="f-input full" rows="3" placeholder="التفاصيل..." value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}></textarea>
                      <div className="f-row"><input className="f-input" type="number" placeholder="السعر" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/><input className="f-input" type="number" placeholder="السعر القديم" value={formData.old_price} onChange={e => setFormData({...formData, old_price: e.target.value})}/><input className="f-input" type="number" placeholder="الكمية" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})}/></div>
                      <div className="f-toggles"><button className={`t-btn ${formData.is_sale ? 'active' : ''}`} onClick={() => setFormData({...formData, is_sale: !formData.is_sale})}>🔥 عرض خاص</button><button className={`t-btn ${formData.out_of_stock ? 'active-out' : ''}`} onClick={() => setFormData({...formData, out_of_stock: !formData.out_of_stock})}>🚫 نفدت</button><button className="save-btn" onClick={handleSaveProduct}>{editingItem ? 'تحديث' : 'حفظ'}</button></div>
                    </div>
                  </div>
                  <div className="mini-products-list mt-30">
                    {products.filter(p => p.category === activeSubCat.name).map(product => (
                      <div key={product.id} className="m-prod-row" onClick={() => {setEditingItem(product); setFormData(product);}}><img src={product.image || 'https://via.placeholder.com/50'} alt=""/><b>{product.name}</b><span className="mod-span">بواسطة: {product.modified_by}</span><span style={{color:'var(--green)', fontWeight:'bold'}}>{product.price} ر.س</span><button className="del-btn-sq" onClick={(e) => {e.stopPropagation(); handleDeleteProduct(product.id);}}>حذف</button></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {adminView === 'workers' && (
            <div className="panel-card fade-in"><h2>👷‍♂️ إضافة وإدارة العمال</h2>
              <div className="product-entry-form" style={{flexDirection: 'column'}}><div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                  <div className="worker-images-upload" style={{flex: '0 0 200px'}}><div className="img-upload-box mb-20">{workerForm.image ? (<img src={workerForm.image} alt="worker"/>) : (<div className="img-ph">صورة</div>)}<label className="upload-label">رفع صورة <input type="file" onChange={(e) => handleImageUpload(e, 'image', true)} style={{display:'none'}}/></label></div><div className="img-upload-box">{workerForm.portfolio_img ? (<img src={workerForm.portfolio_img} alt="portfolio"/>) : (<div className="img-ph" style={{background:'#e8f4f8'}}>أعماله</div>)}<label className="upload-label">رفع أعماله <input type="file" onChange={(e) => handleImageUpload(e, 'portfolio_img', true)} style={{display:'none'}}/></label></div></div>
                  <div className="data-entry-box" style={{flex: '1'}}>
                    <div className="f-row"><input className="f-input" placeholder="اسم العامل..." value={workerForm.name} onChange={e => setWorkerForm({...workerForm, name: e.target.value})}/><input className="f-input" placeholder="المهنة..." value={workerForm.profession} onChange={e => setWorkerForm({...workerForm, profession: e.target.value})}/></div>
                    <div className="f-row"><input className="f-input" placeholder="رقم الجوال..." value={workerForm.phone} onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}/>
                      <select className="f-input" value={workerForm.region} onChange={e => setWorkerForm({...workerForm, region: e.target.value})}><option value="">-- المنطقة --</option><option value="الرياض">الرياض</option><option value="مكة المكرمة">مكة المكرمة</option><option value="المدينة المنورة">المدينة المنورة</option><option value="الشرقية">الشرقية</option><option value="القصيم">القصيم</option><option value="عسير">عسير</option><option value="تبوك">تبوك</option><option value="حائل">حائل</option><option value="الحدود الشمالية">الحدود الشمالية</option><option value="جازان">جازان</option><option value="نجران">نجران</option><option value="الباحة">الباحة</option><option value="الجوف">الجوف</option></select>
                      <input className="f-input" placeholder="المحافظة..." value={workerForm.city} onChange={e => setWorkerForm({...workerForm, city: e.target.value})}/>
                    </div>
                    <div className="f-row"><input className="f-input" type="number" placeholder="التقييم" value={workerForm.rating} step="0.1" max="5" min="1" onChange={e => setWorkerForm({...workerForm, rating: e.target.value})}/><button className={`t-btn ${workerForm.is_busy ? 'active-out' : 'active-green'}`} onClick={() => setWorkerForm({...workerForm, is_busy: !workerForm.is_busy})}>{workerForm.is_busy ? '🔴 مشغول' : '🟢 متاح'}</button></div>
                    <textarea className="f-input full" rows="2" placeholder="نبذة عن العامل..." value={workerForm.details} onChange={e => setWorkerForm({...workerForm, details: e.target.value})}></textarea>
                    <textarea className="f-input full" rows="2" placeholder="السيفتي والأمان..." value={workerForm.safety_details} onChange={e => setWorkerForm({...workerForm, safety_details: e.target.value})}></textarea>
                    <button className="save-btn" onClick={handleSaveWorker}>{editingWorker ? 'تحديث العامل' : 'إضافة عامل جديد'}</button>
                  </div>
                </div>
              </div>
              <div className="folders-grid mt-30">
                {workers.map(worker => (
                  <div key={worker.id} className={`worker-admin-card ${worker.hidden ? 'dimmed' : ''}`} style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                    <div style={{display: 'flex', gap: '15px', width: '100%'}}>
                      {worker.image ? (<img src={worker.image} alt={worker.name} />) : (<div className="default-avatar-small">👷‍♂️</div>)}
                      <div className="w-info"><h4>{worker.name} <span style={{color:'var(--gold)', fontSize:'0.9rem'}}>({worker.profession})</span></h4><p className="w-loc">📍 {worker.region} - {worker.city}</p><p style={{fontSize:'0.9rem'}}>⭐️ {worker.rating} | {worker.is_busy ? '🔴 مشغول' : '🟢 متاح'} | 👤 {worker.modified_by}</p></div>
                    </div>
                    <div className="worker-stats-bar">📊 تم الطلب: <b>{worker.contact_clicks || 0}</b> مرة</div>
                    <div className="w-actions" style={{width: '100%', marginTop: '10px', justifyContent: 'center'}}><button className="act-btn edit" onClick={() => {setEditingWorker(worker); setWorkerForm(worker);}}>✏️ تعديل</button><button className="act-btn hide" onClick={() => handleToggleWorker(worker)}>{worker.hidden ? '👁 إظهار' : '🚫 إخفاء'}</button><button className="act-btn del" onClick={() => handleDeleteWorker(worker.id)}>🗑️ حذف</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminView === 'reports' && (
            <div className="panel-card fade-in"><h2>📊 التقارير المالية</h2>
              <div className="reports-split-container">
                {mainCategoriesList.map(mainCat => {
                  const subCatNames = categories.filter(c => c.parent === mainCat.name).map(x => x.name);
                  const myProducts = products.filter(p => subCatNames.includes(p.category));
                  const sectionProfit = myProducts.reduce((sum, item) => sum + ((Number(item.sold) || 0) * Number(item.price)), 0);
                  const sectionSoldQty = myProducts.reduce((sum, item) => sum + (Number(item.sold) || 0), 0);
                  return (
                    <div key={mainCat.id} className="report-main-section"><h3 className="r-header">تقرير: {mainCat.name}</h3><div style={{display:'flex', gap:'20px', marginBottom:'20px'}}><div className="kpi-box light-blue"><h4>أرباح القسم</h4><h2>{sectionProfit} ر.س</h2></div><div className="kpi-box light-gold"><h4>القطع المباعة</h4><h2>{sectionSoldQty}</h2></div></div>
                      <table className="pro-table"><thead><tr><th>المنتج</th><th>الفرعي</th><th>المتبقي</th><th>المباع</th><th>أرباح</th><th>تعديل بواسطة</th></tr></thead>
                        <tbody>
                          {myProducts.length === 0 && (<tr><td colSpan="6" style={{textAlign:'center'}}>لا يوجد مبيعات</td></tr>)}
                          {myProducts.map(product => (<tr key={product.id}><td>{product.name}</td><td><span className="sc-badge">{product.category}</span></td><td className="stk-td">{product.stock}</td><td className="sld-td">{product.sold || 0}</td><td className="profit-td">{(Number(product.sold) || 0) * Number(product.price)}</td><td className="mod-td">{product.modified_by}</td></tr>))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {adminView === 'users' && currentUser.role === 'مدير' && (
            <div className="panel-card fade-in"><h2>👥 إدارة الموظفين</h2>
              <div className="add-row mb-20" style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px'}}>
                <input placeholder="اسم الموظف..." value={newAdminForm.username} onChange={e => setNewAdminForm({...newAdminForm, username: e.target.value})}/>
                <input placeholder="الرمز السري..." type="password" value={newAdminForm.pin} onChange={e => setNewAdminForm({...newAdminForm, pin: e.target.value})}/>
                <select value={newAdminForm.role} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})} style={{padding:'12px', borderRadius:'8px'}}><option value="موظف">موظف (مخزون ومنتجات)</option><option value="مدير">مدير (كافة الصلاحيات)</option></select>
                <button className="add-btn" onClick={handleAddAdmin}>إضافة موظف</button>
              </div>
              <table className="pro-table"><thead><tr><th>اسم الموظف</th><th>الصلاحية</th><th>إجراء</th></tr></thead>
                <tbody>
                  {admins.map(adminUser => (<tr key={adminUser.id}><td>{adminUser.username}</td><td><span className="sc-badge">{adminUser.role}</span></td><td>{adminUser.username !== 'المدير العام' ? (<button className="del-btn-sq" onClick={() => handleDeleteAdmin(adminUser.id)}>حذف</button>) : (<span style={{color: '#888', fontSize: '0.8rem'}}>أساسي</span>)}</td></tr>))}
                </tbody>
              </table>
            </div>
          )}

          {adminView === 'settings' && currentUser.role === 'مدير' && (
            <div className="panel-card fade-in"><h2>⚙️ إعدادات المتجر</h2><div className="settings-grid"><div className="form-group"><label>اسم المتجر</label><input value={settings.shop_name} onChange={e => setSettings({...settings, shop_name: e.target.value})}/></div><div className="form-group"><label>رقم واتساب الطلبات</label><input value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})}/></div></div><button className="save-btn full-w-btn" onClick={async () => { await fetch(`${API_URL}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); setAlert("✅ تم الحفظ");}}>حفظ</button></div>
          )}
        </main>
      </div>
    );
  }

  let processedProducts = products;
  if (searchQuery) { processedProducts = processedProducts.filter(p => p.name.includes(searchQuery)); } 
  else { processedProducts = processedProducts.filter(p => p.category === clientSub); }
  if (sortOption === 'priceLow') { processedProducts.sort((a, b) => Number(a.price) - Number(b.price)); } 
  else if (sortOption === 'priceHigh') { processedProducts.sort((a, b) => Number(b.price) - Number(a.price)); }

  const availableWorkers = workers.filter(w => !w.hidden);
  const availableRegionsList = [...new Set(availableWorkers.map(w => w.region).filter(Boolean))];
  const availableCitiesList = harajRegion ? [...new Set(availableWorkers.filter(w => w.region === harajRegion).map(w => w.city).filter(Boolean))] : [];
  const filteredWorkersList = availableWorkers.filter(w => { if (!harajRegion || !harajCity) return false; return w.region === harajRegion && w.city === harajCity; });

  return (
    <div className={`App client-theme ${showCart || selectedProduct || showWorkersHaraj ? 'no-scroll' : ''}`}>
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <div className="search-bar-wrapper"><input placeholder="🔍 ابحث عن أي منتج..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
         <button className="worker-haraj-btn" onClick={() => {setShowWorkersHaraj(true); setHarajRegion(''); setHarajCity('');}}>👷‍♂️ <span className="hide-mobile">العمال</span></button>
         <button className="open-cart-large desktop-only" onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>
      
      {!searchQuery && (
        <>
          <div className="client-main-bar">{mainCategoriesList.map(cat => (<button key={cat.id} className={clientMain === cat.name ? 'active' : ''} onClick={() => { setClientMain(cat.name); const subCategories = categories.filter(x => x.parent === cat.name); if (subCategories.length > 0) { setClientSub(subCategories[0].name); } else { setClientSub(''); } }}>{cat.name}</button>))}</div>
          {categories.filter(c => c.parent === clientMain).length > 0 && (<div className="client-sub-bar">{categories.filter(c => c.parent === clientMain).map(subCat => (<button key={subCat.id} className={clientSub === subCat.name ? 'active' : ''} onClick={() => setClientSub(subCat.name)}>{subCat.name}</button>))}</div>)}
        </>
      )}
      
      <div className="gallery-container">
        <div className="store-toolbar">
          {searchQuery ? (<h2 className="search-title">نتائج البحث:</h2>) : (<div></div>)}
          <div className="sort-dropdown"><label>ترتيب المنتجات:</label><select value={sortOption} onChange={e => setSortOption(e.target.value)}><option value="default">الافتراضي</option><option value="priceLow">السعر: أرخص للأغلى</option><option value="priceHigh">السعر: أغلى للأرخص</option></select></div>
        </div>
        
        {processedProducts.length === 0 ? (
          <div className="empty-state"><div style={{fontSize:'4rem', marginBottom:'15px'}}>🧐</div><h3>لم نتمكن من إيجاد منتجات هنا.</h3></div>
        ) : (
          <div className="p-grid-royal">
            {processedProducts.map(product => {
              const discountPercentage = calculateDiscountPercentage(product.old_price, product.price);
              const isStockLow = Number(product.stock) > 0 && Number(product.stock) <= 3;
              const isBestSeller = Number(product.sold) >= 5; 
              
              return (
                <div key={product.id} className="royal-p-card" onClick={() => setSelectedProduct(product)}>
                  {product.out_of_stock && <div className="sold-tag">نفدت الكمية</div>}
                  {product.is_sale && <div className="fire-inline">🔥 عرض خاص</div>}
                  {discountPercentage && <div className="discount-badge">خصم {discountPercentage}%</div>}
                  {isBestSeller && !product.out_of_stock && <div className="best-seller-badge">👑 الأكثر مبيعاً</div>}
                  <div className="p-img-box"><img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} /></div>
                  <div className="p-info-box">
                    <h4>{product.name}</h4>
                    <div className="price-area"><span className="now-price">{product.price} ر.س</span>{Number(product.old_price) > 0 && <del className="old-price">{product.old_price}</del>}</div>
                    {isStockLow && !product.out_of_stock && (<div className="low-stock-alert">⏳ سارع بالطلب! باقي {product.stock} فقط</div>)}
                    <div className="action-area">
                      {!product.out_of_stock && (<div className="qty-controls" onClick={e => e.stopPropagation()}><button onClick={() => handleProductQuantityChange(product.id, 1)}>+</button><span>{itemQtys[product.id] || 1}</span><button onClick={() => handleProductQuantityChange(product.id, -1)}>-</button></div>)}
                      <button className={`add-btn-p ${product.out_of_stock ? 'disabled' : ''}`} disabled={product.out_of_stock} onClick={(e) => { e.stopPropagation(); if (!product.out_of_stock) { addToCart(product); } }}>{product.out_of_stock ? 'غير متوفر' : 'أضف للسلة 🛒'}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      {cart.length > 0 && (<div className="mobile-sticky-cart" onClick={() => setShowCart(true)}><div className="m-cart-info">🛒 في السلة: <b>{cart.length}</b></div><div className="m-cart-total">{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س</div></div>)}

      {showWorkersHaraj && (
        <div className="product-modal-overlay" onClick={() => setShowWorkersHaraj(false)}>
          <div className="worker-haraj-modal fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="haraj-header"><h2>👷‍♂️ حراج العمال</h2><button onClick={() => setShowWorkersHaraj(false)}>✕</button></div>
            <div className="haraj-filters">
              <select value={harajRegion} onChange={e => { setHarajRegion(e.target.value); setHarajCity(''); }}><option value="">🌍 1. اختر منطقتك...</option>{availableRegionsList.map(region => (<option key={region} value={region}>{region}</option>))}</select>
              <select value={harajCity} onChange={e => setHarajCity(e.target.value)} disabled={!harajRegion}><option value="">🏙️ 2. اختر المحافظة...</option>{availableCitiesList.map(city => (<option key={city} value={city}>{city}</option>))}</select>
            </div>
            <div className="workers-list-client">
              {!harajRegion ? (<div className="empty-msg"><span style={{fontSize:'3rem'}}>🗺️</span><p>الرجاء تحديد المنطقة.</p></div>) : !harajCity ? (<div className="empty-msg"><span style={{fontSize:'3rem'}}>📍</span><p>الرجاء تحديد المحافظة.</p></div>) : filteredWorkersList.length === 0 ? (<div className="empty-msg"><span style={{fontSize:'3rem'}}>👷‍♂️</span><p>لا يتوفر عمال في هذه المحافظة.</p></div>) : (
                filteredWorkersList.map(worker => (
                  <div key={worker.id} className="worker-client-card" style={{flexDirection: 'column'}}>
                    <div style={{display:'flex', gap:'15px', width:'100%', alignItems:'center'}}>
                      {worker.image ? (<img src={worker.image} alt={worker.name} />) : (<div className="default-avatar">👷‍♂️</div>)}
                      <div className="wc-info">
                        <h3>{worker.name} <span style={{fontSize:'0.9rem', color:'var(--gold)', marginRight: '5px'}}>({worker.profession})</span></h3>
                        <p className="w-loc">📍 يتواجد في: {worker.region} - {worker.city}</p>
                        <div className="w-status-row"><span className="w-rating">⭐️ {worker.rating}</span><span className={`w-avail ${worker.is_busy ? 'busy' : 'free'}`}>{worker.is_busy ? '🔴 مشغول' : '🟢 متاح'}</span></div>
                        {worker.details && (<p className="w-details-text">{worker.details}</p>)}
                      </div>
                    </div>
                    {worker.safety_details && (<div className="safety-box">🛡️ <b>السلامة:</b> {worker.safety_details}</div>)}
                    {worker.portfolio_img && (<div className="portfolio-box"><b>🖼️ أعماله السابقة:</b><img src={worker.portfolio_img} alt="أعمال" className="pf-img" /></div>)}
                    <button className="wa-contact-btn" onClick={() => handleClientContactWorker(worker)}>طلب وتواصل (واتساب) 💬</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal-content fade-in-up" onClick={e => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="modal-body-split">
              <div className="m-img-side">
                {calculateDiscountPercentage(selectedProduct.old_price, selectedProduct.price) && (<div className="m-discount">خصم {calculateDiscountPercentage(selectedProduct.old_price, selectedProduct.price)}%</div>)}
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>
              <div className="m-details-side">
                <h2>{selectedProduct.name}</h2>
                <div className="m-price-box"><span className="m-now">{selectedProduct.price} ر.س</span>{Number(selectedProduct.old_price) > 0 && (<del className="m-old">{selectedProduct.old_price} ر.س</del>)}</div>
                <div className="m-desc-box"><h3>المواصفات:</h3><div className="m-desc">{selectedProduct.details || 'لا توجد تفاصيل.'}</div></div>
                {!selectedProduct.out_of_stock ? (<button className="m-add-btn" onClick={() => addToCart(selectedProduct)}>إضافة للسلة 🛒</button>) : (<button className="m-add-btn disabled" disabled>🚫 نفدت</button>)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showCart && (
        <div className={`cart-overlay open`}>
          <div className="cart-inner-container">
            <div className="cart-header-fixed"><h2>سلة المشتريات</h2><button className="close-btn-x" onClick={() => setShowCart(false)}>✕</button></div>
            <div className="cart-products-scroll">
              {cart.length === 0 && (<p className="empty-cart-msg">سلتك فارغة</p>)}
              {cart.map((item, index) => (
                <div key={index} className="cart-product-row">
                  <img src={item.image} alt="" className="cart-p-img" />
                  <div className="cart-p-details">
                    <div className="cart-p-title">{item.name}</div>
                    <div className="qty-controls-mini"><button onClick={() => updateCartItemQuantity(index, 1)}>+</button><span>{item.qty}</span><button onClick={() => updateCartItemQuantity(index, -1)}>-</button></div>
                  </div>
                  <div className="cart-item-total">{item.price * item.qty} ر.س</div>
                </div>
              ))}
            </div>
            <div className="cart-action-fixed">
              <div className="total-gold-box">الإجمالي: <span>{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)}</span> ر.س</div>
              <div className="cart-buttons-row">
                <button className="btn-continue-shopping" onClick={() => setShowCart(false)}>العودة للتسوق</button>
                <button className="btn-wa-confirm" onClick={() => {
                    let message = `*طلب جديد* 🛒\n\n`; cart.forEach(c => { message += `▪️ ${c.name}\n   الكمية: ${c.qty} | السعر: ${c.price} ر.س\n`; }); message += `\n*الإجمالي: ${cart.reduce((sum, item) => sum + (item.price * item.qty), 0)} ر.س*`;
                    window.open(`https://wa.me/${settings.phone}?text=${encodeURIComponent(message)}`);
                  }}>تأكيد الطلب ✅</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;