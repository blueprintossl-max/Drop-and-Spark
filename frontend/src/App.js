import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api';

function App() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ phone: '', email: '', shop_name: 'قطرة وشرارة', admin_pin: '123456' });
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  
  // تأثير نبض السلة
  const [bumpCart, setBumpCart] = useState(false);
  
  // حالات الإدارة
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [adminView, setAdminView] = useState('inventory');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCat, setAdminCat] = useState('الكل');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: 0, category: 'كهرباء ⚡', image: '', is_sale: false, out_of_stock: false });
  
  // حالات العميل
  const [showCart, setShowCart] = useState(false);
  const [clientCat, setClientCat] = useState('الكل');
  const [itemQtys, setItemQtys] = useState({});

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => {
    fetchProducts(); fetchSettings();
    if (alert) setTimeout(() => setAlert(null), 3000);
  }, [alert]);

  const fetchProducts = () => fetch(`${API_URL}/products`).then(r => r.json()).then(setProducts);
  const fetchSettings = () => fetch(`${API_URL}/settings`).then(r => r.json()).then(setSettings);

  const handleSave = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData) });
    if (res.ok) { 
      setAlert("✅ تم حفظ التعديلات"); setEditingItem(null); 
      setFormData({ name: '', price: '', old_price: '', stock: 0, category: 'كهرباء ⚡', image: '', is_sale: false, out_of_stock: false });
      fetchProducts();
    }
  };

  const quickStockUpdate = async (product, change) => {
    const newStock = Math.max(0, Number(product.stock) + change);
    const updatedProduct = { ...product, stock: newStock };
    await fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updatedProduct) });
    fetchProducts();
  };

  const handleQtyChange = (id, change) => {
    setItemQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + change) }));
  };

  const addToCart = (product) => {
    const qtyToAdd = itemQtys[product.id] || 1;
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].qty += qtyToAdd;
      setCart(newCart);
    } else { setCart([...cart, { ...product, qty: qtyToAdd }]); }
    
    setAlert(`✅ تم إضافة ${qtyToAdd} قطعة للسلة`);
    setItemQtys(prev => ({ ...prev, [product.id]: 1 }));
    
    // تفعيل النبض
    setBumpCart(true);
    setTimeout(() => setBumpCart(false), 300);
  };

  const updateCartItemQty = (index, change) => {
    const newCart = [...cart];
    newCart[index].qty += change;
    if (newCart[index].qty <= 0) newCart.splice(index, 1);
    setCart(newCart);
  };

  // ------------------------- واجهة الإدارة -------------------------
  if (isAdmin) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          {alert && <div className="toast-notification">{alert}</div>}
          <div className="login-box">
            <h2>🔒 الإدارة الملكية</h2>
            <p>يُرجى إدخال الرقم السري للوصول للمستودع</p>
            <input type="password" placeholder="أدخل الرقم السري..." value={pinInput} onChange={e => setPinInput(e.target.value)} />
            <button onClick={() => {
              if (pinInput === settings.admin_pin) { setIsAuthenticated(true); setAlert("✅ تم تسجيل الدخول بنجاح"); } 
              else { setAlert("❌ الرقم السري غير صحيح!"); }
            }}>فتح القفل 🗝️</button>
            <a href="/">العودة للمتجر 🏠</a>
          </div>
        </div>
      );
    }

    const filteredAdmin = products.filter(p => p.name.includes(adminSearch) && (adminCat === 'الكل' || p.category === adminCat));
    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ إدارة {settings.shop_name}</div>
          <div className="side-tools">
             <div className="cat-pills-admin">
               <button onClick={() => setAdminCat('كهرباء ⚡')} className={adminCat==='كهرباء ⚡'?'active':''}>⚡</button>
               <button onClick={() => setAdminCat('سباكة 💧')} className={adminCat==='سباكة 💧'?'active':''}>💧</button>
               <button onClick={() => setAdminCat('الكل')} className={adminCat==='الكل'?'active':''}>🌐</button>
             </div>
             <input className="side-search" placeholder="🔍 ابحث عن صنف..." onChange={e => setAdminSearch(e.target.value)} />
          </div>
          <nav className="side-nav">
            <button onClick={() => setAdminView('inventory')} className={adminView==='inventory'?'active':''}>📦 المستودع</button>
            <button onClick={() => setAdminView('reports')} className={adminView==='reports'?'active':''}>📊 التقارير</button>
            <button onClick={() => setAdminView('settings')} className={adminView==='settings'?'active':''}>🛠️ الإعدادات</button>
            <a href="/" className="exit-btn">🏠 المتجر</a>
          </nav>
          <div className="side-inventory-list">
             {filteredAdmin.map(p => (
               <div key={p.id} className="p-row-card">
                  <div className="p-row-clickable" onClick={() => {setEditingItem(p); setFormData(p);}}>
                    <img src={p.image} className="mini-thumb" alt="" />
                    <div className="mini-meta">
                      <span>{p.name}</span>
                      <small className={p.stock <= 3 ? 'danger-text' : ''}>مخزون: {p.stock}</small>
                    </div>
                  </div>
                  <div className="quick-stock-btns">
                    <button onClick={() => quickStockUpdate(p, 1)} className="q-plus">+</button>
                    <button onClick={() => quickStockUpdate(p, -1)} className="q-minus">-</button>
                  </div>
               </div>
             ))}
          </div>
        </aside>

        <main className="content-70">
          {adminView === 'reports' ? (
            <div className="reports-view">
               <h2 className="gold-text">📊 التقرير المالي والجرد</h2>
               <div className="stats-grid">
                  <div className="stat-card"><h3>قيمة البضاعة</h3><p>{products.reduce((a,b)=>a+(Number(b.price)*Number(b.stock)),0)} ريال</p></div>
                  <div className="stat-card"><h3>إجمالي القطع</h3><p>{products.reduce((a,b)=>a+Number(b.stock),0)}</p></div>
               </div>
            </div>
          ) : adminView === 'settings' ? (
            <div className="card-ui">
              <h2 className="gold-text">🛠️ إعدادات النظام وتغيير الرمز</h2>
              <div className="form-group"><label>اسم المتجر</label><input value={settings.shop_name} onChange={e=>setSettings({...settings, shop_name:e.target.value})} /></div>
              <div className="form-group"><label>رقم الواتساب للطلبات</label><input value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})} /></div>
              <div className="form-group"><label>الرقم السري للدخول (PIN)</label><input type="password" value={settings.admin_pin} onChange={e=>setSettings({...settings, admin_pin:e.target.value})} /></div>
              <button className="gold-btn-action" onClick={async () => {
                await fetch(`${API_URL}/settings`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(settings)});
                setAlert("✅ تم حفظ الإعدادات بنجاح");
              }}>حفظ الإعدادات 💾</button>
            </div>
          ) : (
            <div className="card-ui">
              <h2 className="gold-text">{editingItem ? '✏️ تعديل صنف مختار' : '➕ إضافة صنف جديد'}</h2>
              <div className="form-grid-3">
                 <input placeholder="الاسم" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/>
                 <input placeholder="السعر" type="number" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/>
                 <input placeholder="السعر القديم (اختياري)" type="number" value={formData.old_price} onChange={e=>setFormData({...formData, old_price:e.target.value})}/>
                 <input placeholder="المخزون" type="number" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})}/>
                 <select value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                    <option>كهرباء ⚡</option><option>سباكة 💧</option>
                 </select>
              </div>
              <div className="btn-toggle-row">
                 <button className={`t-btn sale ${formData.is_sale?'on':''}`} onClick={()=>{setFormData({...formData, is_sale:!formData.is_sale}); setAlert("🔥 تم تعديل حالة العرض");}}>🔥 عرض ناري</button>
                 <button className={`t-btn stock ${formData.out_of_stock?'on':''}`} onClick={()=>{setFormData({...formData, out_of_stock:!formData.out_of_stock}); setAlert("🚫 تم تعديل حالة التوفر");}}>🚫 نفد</button>
              </div>
              <button className="btn-save-final" onClick={handleSave}>حفظ في المستودع الملكي 📦</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ------------------------- واجهة العميل -------------------------
  const filteredClient = products.filter(p => clientCat === 'الكل' || p.category === clientCat);

  return (
    <div className={`App client-theme ${showCart ? 'no-scroll' : ''}`}>
      {alert && <div className="toast-notification">{alert}</div>}
      
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <button className={`open-cart-large desktop-only ${bumpCart ? 'bump' : ''}`} onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>

      <div className="client-category-bar">
        <button className={clientCat==='الكل'?'active':''} onClick={()=>setClientCat('الكل')}>🌐 الكل</button>
        <button className={clientCat==='كهرباء ⚡'?'active':''} onClick={()=>setClientCat('كهرباء ⚡')}>⚡ كهرباء</button>
        <button className={clientCat==='سباكة 💧'?'active':''} onClick={()=>setClientCat('سباكة 💧')}>💧 سباكة</button>
      </div>

      <div className="gallery-container">
        <div className="p-grid-royal">
          {filteredClient.map(p => (
            <div key={p.id} className="royal-p-card">
              {p.out_of_stock && <div className="sold-tag">نفدت الكمية</div>}
              <div className="p-img-box"><img src={p.image} alt="" /></div>
              
              <div className="p-info-box">
                <h4>{p.name}</h4>
                <div className="price-area">
                  <span className="now-price">{p.price} ريال</span>
                  {Number(p.old_price) > 0 && <del className="old-price">{p.old_price} ريال</del>}
                </div>
                {p.is_sale && <div className="fire-inline">🔥 عرض خاص</div>}

                {!p.out_of_stock ? (
                  <div className="action-area">
                    <div className="qty-controls">
                      <button onClick={() => handleQtyChange(p.id, 1)} className="qty-btn">+</button>
                      <span className="qty-display">{itemQtys[p.id] || 1}</span>
                      <button onClick={() => handleQtyChange(p.id, -1)} className="qty-btn">-</button>
                    </div>
                    <button className="add-btn-p" onClick={() => addToCart(p)}>إضافة للسلة 🛒</button>
                  </div>
                ) : (
                  <div className="action-area"><button className="add-btn-p disabled" disabled>غير متوفر</button></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* زر السلة العائم للموبايل مع النبض */}
      <button className={`floating-cart-btn mobile-only ${bumpCart ? 'bump' : ''}`} onClick={() => setShowCart(true)}>
        🛒 <span className="float-badge">{cart.length}</span>
      </button>

      {/* السلة الذكية والواضحة */}
      <div className={`cart-overlay ${showCart ? 'open' : ''}`}>
         <div className="cart-inner-container">
            <div className="cart-header-fixed">
              <h2>🛍️ سلة المشتريات</h2>
              <button className="close-btn-x" onClick={() => setShowCart(false)}>❌</button>
            </div>
            
            <div className="cart-products-scroll">
               {cart.length === 0 ? (
                 <div className="empty-cart-msg"><div className="empty-icon">🛒</div><p>سلتك فارغة بانتظار منتجاتنا الرائعة!</p></div>
               ) : (
                 cart.map((item, i) => (
                   <div key={i} className="cart-product-row">
                     <img src={item.image} alt="" className="cart-p-img" />
                     <div className="cart-p-details">
                       <div className="cart-item-name">{item.name}</div>
                       <span className="cart-item-price">{item.price} ريال للقطعة</span>
                       <div className="mini-qty-controls">
                         <button onClick={() => updateCartItemQty(i, 1)}>+</button>
                         <span>{item.qty}</span>
                         <button onClick={() => updateCartItemQty(i, -1)}>-</button>
                       </div>
                     </div>
                     <div className="cart-item-total">{item.price * item.qty} ريال</div>
                   </div>
                 ))
               )}
            </div>

            {/* منطقة الدفع الثابتة والمشعة بالأزرار الكبيرة */}
            <div className="cart-action-fixed">
              <div className="total-gold-box">الإجمالي: <span>{cart.reduce((a,b)=>a+(Number(b.price)*b.qty),0)}</span> ريال</div>
              <div className="cart-buttons-row">
                <button className="btn-continue-shopping" onClick={() => setShowCart(false)}>🛍️ إكمال التسوق</button>
                <button className="btn-wa-confirm" disabled={cart.length === 0} onClick={() => {
                    let msg = `*طلب جديد - ${settings.shop_name}* 💧⚡\n\n`;
                    cart.forEach(i => msg += `- ${i.name} [الكمية: ${i.qty}] | ${i.price * i.qty} ريال\n`);
                    msg += `\n*الإجمالي: ${cart.reduce((a,b)=>a+(Number(b.price)*b.qty),0)} ريال*`;
                    window.open(`https://wa.me/${settings.phone}?text=${encodeURIComponent(msg)}`);
                  }}>تأكيد الطلب ✅</button>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default App;