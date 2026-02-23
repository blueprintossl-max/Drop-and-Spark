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
  const [adminView, setAdminView] = useState('inventory'); 
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCat, setAdminCat] = useState('الكل');
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: 0, category: '', image: '', is_sale: false, out_of_stock: false });
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁'); 
  
  const [showCart, setShowCart] = useState(false);
  const [clientCat, setClientCat] = useState('الكل');
  const [itemQtys, setItemQtys] = useState({});

  const isAdmin = window.location.pathname.includes('/admin');

 useEffect(() => {
    fetchProducts(); fetchSettings(); fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchProducts = () => fetch(`${API_URL}/products`).then(r => r.json()).then(setProducts);
  const fetchSettings = () => fetch(`${API_URL}/settings`).then(r => r.json()).then(setSettings);
  const fetchCategories = () => fetch(`${API_URL}/categories`).then(r => r.json()).then(data => {
    setCategories(data);
    if(data.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: data[0].name }));
    }
  });

  const handleAddCategory = async () => {
    if(!newCatName.trim()) return;
    await fetch(`${API_URL}/categories`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: newCatName, icon: newCatIcon }) });
    setNewCatName(''); setNewCatIcon('📁'); setAlert("✅ تم إضافة القسم بنجاح"); fetchCategories();
  };

  const handleDeleteCategory = async (id) => {
    await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
    setAlert("🗑️ تم حذف القسم"); fetchCategories();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAlert("⏳ جاري معالجة الصورة...");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData({ ...formData, image: canvas.toDataURL('image/jpeg', 0.6) });
        setAlert("✅ الصورة جاهزة");
      };
    };
  };

  const handleSave = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData) });
    if (res.ok) { 
      setAlert("✅ تم حفظ الصنف بنجاح"); 
      setEditingItem(null); 
      const currentActiveCategory = adminCat !== 'الكل' ? adminCat : (categories.length > 0 ? categories[0].name : '');
      setFormData({ name: '', price: '', old_price: '', stock: 0, category: currentActiveCategory, image: '', is_sale: false, out_of_stock: false });
      fetchProducts();
    }
  };

  const quickCategoryChange = async (product, newCategory) => {
    const updated = { ...product, category: newCategory };
    await fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updated) });
    setAlert(`✅ تم نقل المنتج إلى قسم ${newCategory}`);
    fetchProducts();
  };

  const quickStockUpdate = async (product, change) => {
    const newStock = Math.max(0, Number(product.stock) + change);
    await fetch(`${API_URL}/products/${product.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...product, stock: newStock }) });
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
    setAlert(`✅ أضفت ${qtyToAdd} للسلة`);
    setItemQtys(prev => ({ ...prev, [product.id]: 1 })); 
    setBumpCart(true); setTimeout(() => setBumpCart(false), 300);
  };

  const updateCartItemQty = (index, change) => {
    const newCart = [...cart];
    newCart[index].qty += change;
    if (newCart[index].qty <= 0) newCart.splice(index, 1);
    setCart(newCart);
  };

  if (isAdmin) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          {alert && <div className="toast-notification">{alert}</div>}
          <div className="login-box">
            {/* تم حذف كلمة "الملكية" نهائياً هنا */}
            <h1 className="gradient-text-large">الإدارة</h1>
            <p className="sub-login">أهلاً بك يا مدير النظام، يرجى إدخال الرمز</p>
            <input type="password" placeholder="الرقم السري..." value={pinInput} onChange={e => setPinInput(e.target.value)} />
            <button onClick={() => {
              if (pinInput === settings.admin_pin) setIsAuthenticated(true); else setAlert("❌ رمز خاطئ!");
            }}>دخول إلى الإدارة 🗝️</button>
            <a href="/">🏠 العودة للمتجر</a>
          </div>
        </div>
      );
    }

    const filteredAdmin = products.filter(p => p.name.includes(adminSearch) && (adminCat === 'الكل' || p.category === adminCat));
    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        
        <aside className="sidebar-30">
          <div className="side-logo">⚙️ الإدارة</div>
          <div className="side-tools">
             <div className="cat-pills-admin">
               <button onClick={() => {
                 setAdminCat('الكل');
                 if(categories.length > 0) setFormData(prev => ({ ...prev, category: categories[0].name }));
                 setEditingItem(null); setAdminView('inventory');
               }} className={adminCat==='الكل'?'active':''}>🌐 الكل</button>
               
               {categories.map(c => (
                 <button key={c.id} onClick={() => {
                   setAdminCat(c.name);
                   setFormData(prev => ({ ...prev, category: c.name }));
                   setEditingItem(null); setAdminView('inventory');
                 }} className={adminCat===c.name?'active':''}>{c.icon || '📁'} {c.name}</button>
               ))}
             </div>
             <input className="side-search" placeholder="🔍 ابحث في المنتجات..." onChange={e => setAdminSearch(e.target.value)} />
          </div>
          <nav className="side-nav">
            <button onClick={() => setAdminView('inventory')} className={adminView==='inventory'?'active':''}>📦 المنتجات</button>
            <button onClick={() => setAdminView('categories')} className={adminView==='categories'?'active':''}>🗂️ الأقسام</button>
            <button onClick={() => setAdminView('reports')} className={adminView==='reports'?'active':''}>📊 التقارير</button>
            <button onClick={() => setAdminView('settings')} className={adminView==='settings'?'active':''}>🛠️ الإعدادات</button>
            <a href="/" className="exit-btn">🏠 مشاهدة المتجر</a>
          </nav>
          
          <div className="side-inventory-list">
             {filteredAdmin.map(p => (
               <div key={p.id} className="p-row-card">
                  <div className="p-row-clickable" onClick={() => {setEditingItem(p); setFormData(p); setAdminView('inventory');}}>
                    <img src={p.image} className="mini-thumb" alt="" />
                    <div className="mini-meta"><span>{p.name}</span><small>مخزون: {p.stock}</small></div>
                  </div>
                  <div className="transfer-box">
                    <select className="category-transfer" value={p.category} onChange={(e) => quickCategoryChange(p, e.target.value)}>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="quick-stock-btns-row">
                      <button onClick={() => quickStockUpdate(p, 1)}>+</button>
                      <button onClick={() => quickStockUpdate(p, -1)}>-</button>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </aside>

        <main className="content-70">
          {adminView === 'categories' ? (
            <div className="card-ui animated-fade">
              <h2 className="gradient-text">🗂️ إدارة الأقسام</h2>
              <div className="form-group add-cat-row">
                <input className="icon-input" placeholder="⚡" value={newCatIcon} onChange={e=>setNewCatIcon(e.target.value)} maxLength="2"/>
                <input className="name-input" placeholder="اسم القسم الجديد" value={newCatName} onChange={e=>setNewCatName(e.target.value)} />
                <button className="gold-btn-action" onClick={handleAddCategory}>إضافة ➕</button>
              </div>
              <div className="cat-manage-list">
                {categories.map(c => (
                  <div key={c.id} className="cat-manage-item">
                    <span>{c.icon} {c.name}</span>
                    <button className="delete-btn" onClick={() => handleDeleteCategory(c.id)}>حذف ❌</button>
                  </div>
                ))}
              </div>
            </div>
          ) : adminView === 'reports' ? (
            <div className="reports-view animated-fade">
               <h2 className="gradient-text">📊 تقارير الجرد والمخازن</h2>
               <div className="stats-grid">
                  <div className="stat-card blue-glow"><h3>قيمة البضاعة الكلية</h3><p>{products.reduce((a,b)=>a+(Number(b.price)*Number(b.stock)),0)} ريال</p></div>
                  <div className="stat-card green-glow"><h3>عدد القطع الإجمالي</h3><p>{products.reduce((a,b)=>a+Number(b.stock),0)} قطعة</p></div>
               </div>
               <div className="table-responsive">
                 <table className="report-table">
                   <thead>
                     <tr><th>المنتج</th><th>القسم</th><th>السعر</th><th>المخزون</th><th>الإجمالي</th></tr>
                   </thead>
                   <tbody>
                     {products.map(p => (
                       <tr key={p.id}>
                         <td>{p.name}</td>
                         <td><span className="td-badge">{p.category}</span></td>
                         <td>{p.price}</td>
                         <td className={p.stock <= 3 ? 'td-danger' : 'td-safe'}>{p.stock}</td>
                         <td className="td-total">{Number(p.price)*Number(p.stock)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          ) : (
            <div className="card-ui animated-fade">
              <h2 className="gradient-text">{editingItem ? '✏️ تعديل صنف' : `➕ منتج جديد (${adminCat})`}</h2>
              <div className="image-upload-section">
                {formData.image && <img src={formData.image} alt="Preview" className="preview-img" />}
                <label className="custom-file-upload">📤 التقط أو ارفع صورة <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} /></label>
              </div>
              <div className="form-grid-3">
                 <div className="form-group"><label>الاسم</label><input value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
                 <div className="form-group"><label>القسم</label>
                   <select value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                   </select>
                 </div>
                 <div className="form-group"><label>السعر الحالي</label><input type="number" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/></div>
                 <div className="form-group"><label>السعر القديم</label><input type="number" value={formData.old_price} onChange={e=>setFormData({...formData, old_price:e.target.value})}/></div>
                 <div className="form-group"><label>المخزون</label><input type="number" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})}/></div>
              </div>
              <div className="btn-toggle-row">
                 <button className={`t-btn sale ${formData.is_sale?'on':''}`} onClick={()=>setFormData({...formData, is_sale:!formData.is_sale})}>🔥 عرض خاص</button>
                 <button className={`t-btn stock ${formData.out_of_stock?'on':''}`} onClick={()=>setFormData({...formData, out_of_stock:!formData.out_of_stock})}>🚫 نفد</button>
              </div>
              <button className="btn-save-final" onClick={handleSave}>حفظ في المستودع 📦</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={`App client-theme ${showCart ? 'no-scroll' : ''}`}>
      {alert && <div className="toast-notification">{alert}</div>}
      <header className="royal-header">
         <div className="logo-box">💧 <span>مَتجر</span> {settings.shop_name} ⚡</div>
         <button className={`open-cart-large desktop-only ${bumpCart ? 'bump' : ''}`} onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>
      <div className="client-category-bar">
        <button className={clientCat==='الكل'?'active':''} onClick={()=>setClientCat('الكل')}>🌐 الكل</button>
        {categories.map(c => <button key={c.id} className={clientCat===c.name?'active':''} onClick={()=>setClientCat(c.name)}>{c.icon} {c.name}</button>)}
      </div>
      <div className="gallery-container">
        <div className="p-grid-royal">
          {products.filter(p => clientCat === 'الكل' || p.category === clientCat).map(p => (
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
      </div>
      <button className="floating-cart-btn" onClick={() => setShowCart(true)}>🛒 <span className="float-badge">{cart.length}</span></button>
      <button className="floating-wa-btn" onClick={() => window.open(`https://wa.me/${settings.phone}`)}>💬</button>
      {/* سلة المشتريات المحدثة */}
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