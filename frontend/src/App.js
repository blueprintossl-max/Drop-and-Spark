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
  
  // ==========================================
  // نظام الإدارة والمجلدات
  // ==========================================
  const [adminMode, setAdminMode] = useState('folders'); // folders, reports
  const [activeMainFolder, setActiveMainFolder] = useState(null); 
  const [activeSubFolder, setActiveSubFolder] = useState(null);   
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: 0, image: '', is_sale: false, out_of_stock: false });
  
  // 🛠️ التعديل الأهم: فصل متغيرات القسم الرئيسي عن الفرعي لمنع التداخل 🛠️
  const [newMainCatName, setNewMainCatName] = useState('');
  const [newMainCatIcon, setNewMainCatIcon] = useState('⚡'); 
  
  const [newSubCatName, setNewSubCatName] = useState('');
  const [newSubCatIcon, setNewSubCatIcon] = useState('🔌'); 
  
  // ==========================================
  // واجهة العميل
  // ==========================================
  const [showCart, setShowCart] = useState(false);
  const [clientMainCat, setClientMainCat] = useState('');
  const [clientSubCat, setClientSubCat] = useState('');
  const [itemQtys, setItemQtys] = useState({});

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => {
    fetchProducts();
    fetchSettings();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchProducts = async () => {
    const r = await fetch(`${API_URL}/products`);
    const data = await r.json();
    setProducts(data);
  };

  const fetchSettings = async () => {
    const r = await fetch(`${API_URL}/settings`);
    const data = await r.json();
    setSettings(data);
  };

  const fetchCategories = async () => {
    const r = await fetch(`${API_URL}/categories`);
    const data = await r.json();
    setCategories(data);
    
    // إعداد واجهة العميل عند فتح الموقع
    if (!isAdmin && data.length > 0 && !clientMainCat) {
       const mainCats = data.filter(c => !c.parent);
       if (mainCats.length > 0) {
         setClientMainCat(mainCats[0].name);
         const subCats = data.filter(c => c.parent === mainCats[0].name);
         if (subCats.length > 0) {
           setClientSubCat(subCats[0].name);
         }
       }
    }
  };

  // 🛠️ دالة إضافة قسم رئيسي (تستخدم متغيرات Main)
  const handleAddMainCategory = async () => {
    if (!newMainCatName.trim()) {
      return setAlert("⚠️ يرجى كتابة اسم القسم الرئيسي");
    }
    const res = await fetch(`${API_URL}/categories`, { 
      method: 'POST', 
      headers: {'Content-Type':'application/json'}, 
      body: JSON.stringify({ name: newMainCatName, icon: newMainCatIcon, parent: '' }) 
    });
    if (res.ok) { 
      setNewMainCatName(''); 
      setNewMainCatIcon('⚡');
      setAlert("✅ تم إضافة القسم الرئيسي بنجاح"); 
      fetchCategories(); 
    } else { 
      setAlert("❌ هذا القسم موجود مسبقاً"); 
    }
  };

  // 🛠️ دالة إضافة قسم فرعي (تستخدم متغيرات Sub)
  const handleAddSubCategory = async () => {
    if (!newSubCatName.trim()) {
      return setAlert("⚠️ يرجى كتابة اسم القسم الفرعي");
    }
    const res = await fetch(`${API_URL}/categories`, { 
      method: 'POST', 
      headers: {'Content-Type':'application/json'}, 
      body: JSON.stringify({ name: newSubCatName, icon: newSubCatIcon, parent: activeMainFolder.name }) 
    });
    if (res.ok) { 
      setNewSubCatName(''); 
      setNewSubCatIcon('🔌');
      setAlert("✅ تم إضافة القسم الفرعي بنجاح"); 
      fetchCategories(); 
    } else { 
      setAlert("❌ هذا القسم موجود مسبقاً"); 
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المجلد بالكامل؟")) {
      await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
      setAlert("🗑️ تم الحذف بنجاح"); 
      fetchCategories();
      setActiveSubFolder(null); // الرجوع خطوة للخلف
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج نهائياً من المتجر؟")) {
      await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      setAlert("🗑️ تم حذف المنتج نهائياً"); 
      fetchProducts();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; 
    if (!file) return;
    setAlert("⏳ جاري رفع وتجهيز الصورة...");
    const reader = new FileReader(); 
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); 
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas'); 
        const scaleSize = 500 / img.width;
        canvas.width = 500; 
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d'); 
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData({ ...formData, image: canvas.toDataURL('image/jpeg', 0.6) }); 
        setAlert("✅ الصورة جاهزة");
      };
    };
  };

  const handleSaveProduct = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/products/${editingItem.id}` : `${API_URL}/products`;
    
    // ربط المنتج بالقسم الفرعي المفتوح حالياً بشكل إجباري
    const finalData = { ...formData, category: activeSubFolder.name }; 
    
    const res = await fetch(url, { 
      method, 
      headers: {'Content-Type':'application/json'}, 
      body: JSON.stringify(finalData) 
    });
    
    if (res.ok) { 
      setAlert("✅ تم الحفظ داخل القسم بنجاح"); 
      setEditingItem(null);
      setFormData({ name: '', price: '', old_price: '', stock: 0, image: '', is_sale: false, out_of_stock: false });
      fetchProducts();
    }
  };

  const addToCart = (product) => {
    const qty = itemQtys[product.id] || 1;
    const index = cart.findIndex(item => item.id === product.id);
    if (index >= 0) { 
      const newCart = [...cart]; 
      newCart[index].qty += qty; 
      setCart(newCart); 
    } else { 
      setCart([...cart, { ...product, qty }]); 
    }
    setAlert(`✅ أضفت ${qty} للسلة`);
    setItemQtys(prev => ({ ...prev, [product.id]: 1 })); 
    setBumpCart(true); 
    setTimeout(() => setBumpCart(false), 300);
  };

  const updateCartQty = (index, change) => {
    const newCart = [...cart]; 
    newCart[index].qty += change;
    if (newCart[index].qty <= 0) newCart.splice(index, 1); 
    setCart(newCart);
  };

  // ==========================================
  // فلاتر المجلدات (الرئيسي والفرعي)
  // ==========================================
  const mainCategories = categories.filter(c => !c.parent);
  const adminSubCategories = activeMainFolder ? categories.filter(c => c.parent === activeMainFolder.name) : [];
  const clientSubCategories = clientMainCat ? categories.filter(c => c.parent === clientMainCat) : [];
  const currentFolderProducts = activeSubFolder ? products.filter(p => p.category === activeSubFolder.name) : [];

  // ==========================================
  // 1. الإدارة المتطورة الفاخرة
  // ==========================================
  if (isAdmin) {
    if (!isAuthenticated) {
      return (
        <div className="login-screen">
          {alert && <div className="toast-notification">{alert}</div>}
          <div className="login-box">
            <h1 className="gradient-text-large">الإدارة</h1>
            <p className="sub-login">أهلاً بك يا مدير النظام المحترف</p>
            <input 
              className="login-input"
              type="password" 
              placeholder="الرقم السري..." 
              value={pinInput} 
              onChange={e => setPinInput(e.target.value)} 
            />
            <button onClick={() => { 
              if (pinInput === settings.admin_pin) setIsAuthenticated(true); 
              else setAlert("❌ رمز الدخول غير صحيح!"); 
            }}>
              دخول 🗝️
            </button>
            <a href="/">العودة للمتجر 🏠</a>
          </div>
        </div>
      );
    }

    return (
      <div className="admin-root">
        {alert && <div className="toast-notification">{alert}</div>}
        
        {/* شريط الأدوات العلوي */}
        <div className="admin-header">
           <div className="breadcrumbs">
             <button onClick={() => {
               setActiveMainFolder(null); 
               setActiveSubFolder(null); 
               setAdminMode('folders');
             }}>
               📁 الإدارة الرئيسية
             </button>
             
             {activeMainFolder && (
               <>
                 <span className="separator">/</span> 
                 <button onClick={() => setActiveSubFolder(null)}>
                   {activeMainFolder.icon} {activeMainFolder.name}
                 </button>
               </>
             )}
             
             {activeSubFolder && (
               <>
                 <span className="separator">/</span> 
                 <span className="current-path">{activeSubFolder.icon} {activeSubFolder.name}</span>
               </>
             )}
           </div>
           <button className="reports-btn" onClick={() => {
             setAdminMode('reports'); 
             setActiveMainFolder(null); 
             setActiveSubFolder(null);
           }}>
             📊 التقارير المالية
           </button>
        </div>

        <div className="admin-workspace">
          
          {/* شاشة 1: المجلدات الرئيسية */}
          {adminMode === 'folders' && !activeMainFolder && (
            <div className="folder-stage fade-in">
              <h2 className="stage-title">المجلدات الرئيسية</h2>
              <div className="folders-grid">
                {mainCategories.map(c => (
                  <div key={c.id} className="big-folder" onClick={() => setActiveMainFolder(c)}>
                    <div className="folder-icon-large">{c.icon}</div>
                    <h3>{c.name}</h3>
                    <button className="del-folder-btn" onClick={(e) => {
                      e.stopPropagation(); 
                      handleDeleteCategory(c.id);
                    }}>حذف</button>
                  </div>
                ))}
              </div>
              
              <div className="add-folder-box">
                <h4>➕ إنشاء مجلد رئيسي جديد (مثل: كهرباء، سباكة)</h4>
                <div className="add-row">
                  <select value={newMainCatIcon} onChange={e => setNewMainCatIcon(e.target.value)}>
                    <option value="⚡">⚡ كهرباء</option>
                    <option value="💧">💧 سباكة</option>
                    <option value="🛠️">🛠️ عام</option>
                  </select>
                  <input 
                    placeholder="اكتب اسم القسم الرئيسي هنا..." 
                    value={newMainCatName} 
                    onChange={e => setNewMainCatName(e.target.value)} 
                  />
                  <button onClick={handleAddMainCategory}>إضافة</button>
                </div>
              </div>
            </div>
          )}

          {/* شاشة 2: المجلدات الفرعية */}
          {adminMode === 'folders' && activeMainFolder && !activeSubFolder && (
            <div className="folder-stage fade-in">
              <h2 className="stage-title">الأقسام الفرعية داخل ({activeMainFolder.name})</h2>
              <div className="folders-grid">
                {adminSubCategories.length === 0 && <p className="empty-msg">المجلد فارغ. قم بإضافة قسم فرعي.</p>}
                {adminSubCategories.map(c => (
                  <div key={c.id} className="big-folder sub-folder" onClick={() => setActiveSubFolder(c)}>
                    <div className="folder-icon-large">{c.icon}</div>
                    <h3>{c.name}</h3>
                    <button className="del-folder-btn" onClick={(e) => {
                      e.stopPropagation(); 
                      handleDeleteCategory(c.id);
                    }}>حذف</button>
                  </div>
                ))}
              </div>
              
              <div className="add-folder-box sub">
                <h4>➕ إنشاء مجلد فرعي داخل ({activeMainFolder.name})</h4>
                <div className="add-row">
                  <select value={newSubCatIcon} onChange={e => setNewSubCatIcon(e.target.value)}>
                    <option value="🔌">🔌 أفياش</option>
                    <option value="💡">💡 إنارة</option>
                    <option value="🚿">🚿 خلاطات</option>
                    <option value="🔧">🔧 قطع</option>
                  </select>
                  <input 
                    placeholder="اسم القسم الفرعي (أفياش، إنارة، إلخ)..." 
                    value={newSubCatName} 
                    onChange={e => setNewSubCatName(e.target.value)} 
                  />
                  <button onClick={handleAddSubCategory}>إضافة</button>
                </div>
              </div>
            </div>
          )}

          {/* شاشة 3: إضافة المنتجات داخل المجلد الفرعي (التصميم المدمج) */}
          {adminMode === 'folders' && activeSubFolder && (
            <div className="workspace-split fade-in">
              
              <div className="entry-form-panel">
                <h2 className="panel-title">{editingItem ? '✏️ تعديل صنف' : `➕ إضافة منتج لـ (${activeSubFolder.name})`}</h2>
                
                <div className="compact-form">
                  <div className="image-side">
                    {formData.image ? (
                      <img src={formData.image} alt="Upload" />
                    ) : (
                      <div className="img-placeholder">📷 صورة المنتج</div>
                    )}
                    <label className="upload-btn">
                      رفع صورة <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}}/>
                    </label>
                  </div>
                  
                  <div className="inputs-side">
                    <input 
                      className="full-w" 
                      placeholder="اسم المنتج (مثال: مفتاح مفرد)..." 
                      value={formData.name} 
                      onChange={e=>setFormData({...formData, name:e.target.value})}
                    />
                    <div className="row-2">
                      <input 
                        type="number" 
                        placeholder="السعر الحالي" 
                        value={formData.price} 
                        onChange={e=>setFormData({...formData, price:e.target.value})}
                      />
                      <input 
                        type="number" 
                        placeholder="السعر القديم" 
                        value={formData.old_price} 
                        onChange={e=>setFormData({...formData, old_price:e.target.value})}
                      />
                    </div>
                    <input 
                      className="full-w" 
                      type="number" 
                      placeholder="المخزون المتوفر" 
                      value={formData.stock} 
                      onChange={e=>setFormData({...formData, stock:e.target.value})}
                    />
                    
                    <div className="toggles-row">
                      <button 
                        className={`t-btn ${formData.is_sale ? 'sale-on' : ''}`} 
                        onClick={() => setFormData({...formData, is_sale: !formData.is_sale})}
                      >🔥 يشمل العرض</button>
                      <button 
                        className={`t-btn ${formData.out_of_stock ? 'stock-out' : ''}`} 
                        onClick={() => setFormData({...formData, out_of_stock: !formData.out_of_stock})}
                      >🚫 نفدت الكمية</button>
                    </div>
                    
                    <button className="save-btn" onClick={handleSaveProduct}>حفظ في هذا القسم 📦</button>
                  </div>
                </div>
              </div>

              <div className="products-list-panel">
                <h2 className="panel-title">📋 منتجات ({activeSubFolder.name}) الحالية</h2>
                <div className="compact-list">
                  {currentFolderProducts.length === 0 && <p className="empty-msg">لا توجد منتجات هنا بعد.</p>}
                  {currentFolderProducts.map(p => (
                    <div key={p.id} className="mini-product-card" onClick={() => {setEditingItem(p); setFormData(p);}}>
                      <img src={p.image} alt=""/>
                      <div className="meta">
                        <b>{p.name}</b>
                        <span>السعر: {p.price} ريال | المخزون: {p.stock}</span>
                      </div>
                      <button className="del-btn-small" onClick={(e) => {
                        e.stopPropagation(); 
                        handleDeleteProduct(p.id);
                      }}>🗑️</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* شاشة التقارير */}
          {adminMode === 'reports' && (
            <div className="folder-stage fade-in">
              <h2 className="stage-title">📊 التقارير المالية السريعة</h2>
              <div className="stats-grid">
                  <div className="stat-card blue">
                    <h3>إجمالي قيمة البضاعة في المتجر</h3>
                    <p>{products.reduce((a,b)=>a+(Number(b.price)*Number(b.stock)),0)} ريال</p>
                  </div>
                  <div className="stat-card green">
                    <h3>إجمالي عدد القطع المتوفرة</h3>
                    <p>{products.reduce((a,b)=>a+Number(b.stock),0)} قطعة</p>
                  </div>
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
         <button className="open-cart-large" onClick={() => setShowCart(true)}>
           🛒 السلة <span>{cart.length}</span>
         </button>
      </header>
      
      {/* شريط الأقسام الرئيسية للعميل */}
      <div className="client-main-bar">
        {mainCategories.map(c => (
          <button 
            key={c.id} 
            className={clientMainCat === c.name ? 'active' : ''} 
            onClick={() => {
              setClientMainCat(c.name);
              const subCategories = categories.filter(subC => subC.parent === c.name);
              if (subCategories.length > 0) {
                setClientSubCat(subCategories[0].name);
              } else {
                setClientSubCat('');
              }
            }}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* شريط الأقسام الفرعية للعميل */}
      {clientSubCategories.length > 0 && (
        <div className="client-sub-bar">
          {clientSubCategories.map(sc => (
             <button 
               key={sc.id} 
               className={clientSubCat === sc.name ? 'active' : ''} 
               onClick={() => setClientSubCat(sc.name)}
             >
               {sc.name}
             </button>
          ))}
        </div>
      )}
      
      {/* المنتجات المعروضة */}
      <div className="gallery-container">
        {!clientMainCat ? (
           <div className="coming-soon-card">
             <h2>مرحباً بك!</h2>
             <h3>الرجاء اختيار قسم من الأعلى للبدء 🚀</h3>
           </div>
        ) : clientProducts.length === 0 ? (
          <div className="coming-soon-card">
            <div className="glass-icon">⏳</div>
            <h2 className="gradient-text">قريباً جداً!</h2>
            <h3>نعمل على توفير أحدث المنتجات في هذا القسم..</h3>
          </div>
        ) : (
          <div className="p-grid-royal">
            {clientProducts.map(p => (
              <div key={p.id} className="royal-p-card">
                {p.out_of_stock && <div className="sold-tag">نفدت</div>}
                {p.is_sale && <div className="fire-inline">🔥 عرض</div>}
                <div className="p-img-box"><img src={p.image} alt="" /></div>
                
                <div className="p-info-box">
                  <h4>{p.name}</h4>
                  <div className="price-area">
                    <span className="now-price">{p.price} ريال</span>
                    {Number(p.old_price) > 0 && <del className="old-price">{p.old_price}</del>}
                  </div>
                  
                  {!p.out_of_stock ? (
                    <div className="action-area">
                      <div className="qty-controls">
                        <button onClick={() => handleQtyChange(p.id, 1)}>+</button>
                        <span>{itemQtys[p.id] || 1}</span>
                        <button onClick={() => handleQtyChange(p.id, -1)}>-</button>
                      </div>
                      <button className="add-btn-p" onClick={() => addToCart(p)}>أضف 🛒</button>
                    </div>
                  ) : (
                    <button className="add-btn-p disabled" disabled>غير متوفر</button>
                  )}
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
            <div className="cart-header-fixed">
              <h2>🛍️ سلتك</h2>
              <button className="close-btn-x" onClick={() => setShowCart(false)}>❌</button>
            </div>
            
            <div className="cart-products-scroll">
               {cart.map((item, i) => (
                 <div key={i} className="cart-product-row">
                   <img src={item.image} alt="" className="cart-p-img" />
                   <div className="cart-p-details">
                     <div>{item.name}</div>
                     <div className="qty-controls" style={{margin: '5px 0', padding: 0}}>
                       <button onClick={() => updateCartQty(i, 1)}>+</button>
                       <span>{item.qty}</span>
                       <button onClick={() => updateCartQty(i, -1)}>-</button>
                     </div>
                   </div>
                   <div className="cart-item-total">{item.price * item.qty} ريال</div>
                 </div>
               ))}
            </div>
            
            <div className="cart-action-fixed">
              <div className="total-gold-box">الإجمالي: <span>{cart.reduce((a,b)=>a+(Number(b.price)*b.qty),0)}</span> ريال</div>
              <div className="cart-buttons-row">
                <button className="btn-continue-shopping" onClick={() => setShowCart(false)}>إكمال التسوق</button>
                <button className="btn-wa-confirm" onClick={() => window.open(`https://wa.me/${settings.phone}?text=طلب جديد...`)}>تأكيد الطلب ✅</button>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default App;