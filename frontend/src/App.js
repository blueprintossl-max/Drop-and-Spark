import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCat, setAdminCat] = useState('الكل');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', stock: 0, category: 'كهرباء ⚡', image: '', is_sale: false, out_of_stock: false });

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => {
    fetchProducts();
    if (alert) setTimeout(() => setAlert(null), 3000); // التنبيه يختفي تلقائياً بعد 3 ثواني
  }, [alert]);

  const fetchProducts = () => fetch(API_URL).then(r => r.json()).then(setProducts);

  const addToCart = (product, qty) => {
    const count = parseInt(qty) || 1;
    setCart([...cart, { ...product, cartQty: count }]);
    setAlert(`✅ أضفنا ${count} من ${product.name} للسلة`);
  };

  const handleWhatsApp = () => {
    let msg = `*طلب شراء - متجر قطرة وشرارة* 💧⚡\n\n`;
    cart.forEach(i => msg += `- ${i.name} (كمية: ${i.cartQty}) | السعر: ${i.price} ريال\n`);
    msg += `\n*الإجمالي: ${cart.reduce((a,b)=>a+(b.price*b.cartQty), 0)} ريال*`;
    window.open(`https://wa.me/9665XXXXXXXX?text=${encodeURIComponent(msg)}`);
  };

  if (isAdmin) {
    const filtered = products.filter(p => p.name.includes(adminSearch) && (adminCat === 'الكل' || p.category === adminCat));
    return (
      <div className="admin-root">
        <aside className="sidebar-fixed">
          <div className="admin-header-box">⚙️ الإدارة الملكية</div>
          <div className="admin-tools">
            <div className="cat-nav">
              <button onClick={() => setAdminCat('كهرباء ⚡')} className={adminCat==='كهرباء ⚡'?'active':''}>⚡ كهرباء</button>
              <button onClick={() => setAdminCat('سباكة 💧')} className={adminCat==='سباكة 💧'?'active':''}>💧 سباكة</button>
              <button onClick={() => setAdminCat('الكل')} className={adminCat==='الكل'?'active':''}>🌐 الكل</button>
            </div>
            <input className="search-in" placeholder="🔎 ابحث لتعديل منتج..." onChange={e => setAdminSearch(e.target.value)} />
          </div>
          <div className="admin-list-scroll">
            {filtered.map(p => (
              <div key={p.id} className="admin-item-row" onClick={() => {setEditingItem(p); setFormData(p);}}>
                <img src={p.image} className="row-img" alt="" />
                <div className="row-text">
                  <p className="row-n">{p.name}</p>
                  <p className="row-s">المخزون: <strong>{p.stock}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="main-editor">
          <div className="editor-card">
            <h2>{editingItem ? '✏️ تعديل صنف مختار' : '➕ إضافة صنف جديد'}</h2>
            <div className="grid-inputs">
              <div className="field"><label>الاسم</label><input value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
              <div className="field"><label>السعر</label><input type="number" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})}/></div>
              <div className="field"><label>سعر الخصم</label><input type="number" value={formData.old_price} onChange={e=>setFormData({...formData, old_price:e.target.value})}/></div>
              <div className="field"><label>المخزون</label><input type="number" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})}/></div>
            </div>
            <div className="check-btns">
              <button className={formData.is_sale ? 'on' : ''} onClick={()=>setFormData({...formData, is_sale:!formData.is_sale})}>🔥 عرض خاص</button>
              <button className={formData.out_of_stock ? 'on' : ''} onClick={()=>setFormData({...formData, out_of_stock:!formData.out_of_stock})}>🚫 نفذ</button>
            </div>
            <button className="save-final" onClick={async () => {
              const m = editingItem ? 'PUT' : 'POST';
              const u = editingItem ? `${API_URL}/${editingItem.id}` : API_URL;
              await fetch(u, { method: m, headers: {'Content-Type':'application/json'}, body: JSON.stringify(formData)});
              setAlert("✅ تم التحديث بنجاح"); fetchProducts();
            }}>حفظ التغييرات في المستودع 📦</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="App client-layout">
      {alert && <div className="floating-alert">{alert}</div>}
      <header className="royal-bar">
        <div className="brand-logo">💧 مَتجر قَطرة وشرارة ⚡</div>
        <button className="open-cart-btn" onClick={() => setShowCart(true)}>🛒 السلة <span>{cart.length}</span></button>
      </header>

      <div className="store-grid">
        {products.map(p => (
          <div key={p.id} className="product-card">
            {p.is_sale && <div className="sale-fire">🔥 عرض ناري</div>}
            {p.out_of_stock && <div className="sold-out-tag">نفذت الكمية</div>}
            <div className="p-img"><img src={p.image} alt="" /></div>
            <div className="p-data">
              <h3>{p.name}</h3>
              <div className="p-prices">{p.price} ريال {p.old_price && <del>{p.old_price}</del>}</div>
              {!p.out_of_stock && (
                <div className="buy-control">
                  <input type="number" id={`q-${p.id}`} defaultValue="1" min="1" />
                  <button onClick={() => addToCart(p, document.getElementById(`q-${p.id}`).value)}>أضف 🛒</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={`cart-side-panel ${showCart ? 'open' : ''}`}>
        <div className="cart-inner">
          <button className="close-cart-x" onClick={() => setShowCart(false)}>إغلاق ❌</button>
          <h2>🛍️ مشترياتك</h2>
          {cart.map((item, i) => (
            <div key={i} className="cart-line">
              <span>{item.name}</span>
              <span>{item.cartQty} قطعة</span>
              <span>{item.price * item.cartQty} ريال</span>
            </div>
          ))}
          <div className="total-box">الإجمالي: {cart.reduce((a,b)=>a+(b.price*b.cartQty),0)} ريال</div>
          <button className="wa-confirm" onClick={handleWhatsApp}>تأكيد الطلب واتساب ✅</button>
        </div>
      </div>
    </div>
  );
}

export default App;