import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';
const WHATSAPP_NUM = "9665XXXXXXXX"; // ضع رقمك هنا

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('الكل');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', old_price: '', image: '', category: 'كهرباء ⚡', is_sale: false });
  const [showCart, setShowCart] = useState(false);

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setProducts(data);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, image: reader.result });
    if (file) reader.readAsDataURL(file);
  };

  const saveProduct = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `${API_URL}/${editingItem.id}` : API_URL;
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert(editingItem ? "✅ تم تحديث بيانات المنتج" : "🚀 تم إضافة المنتج للمخزن");
      setEditingItem(null);
      setFormData({ name: '', price: '', old_price: '', image: '', category: 'كهرباء ⚡', is_sale: false });
      fetchProducts();
    }
  };

  const editProduct = (p) => {
    setEditingItem(p);
    setFormData(p);
    window.scrollTo(0,0);
  };

  const addToCart = (p) => { setCart([...cart, p]); alert(`تمت إضافة ${p.name}`); };

  const sendOrder = () => {
    let msg = `*طلب جديد من مَتجر قطرة وشرارة* 💧⚡\n\n`;
    cart.forEach((item, i) => msg += `${i+1}- ${item.name} | ${item.price} ريال\n`);
    msg += `\n*الإجمالي: ${cart.reduce((a,b)=>a+Number(b.price),0)} ريال*`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (isAdmin) {
    return (
      <div className="App admin-page">
        <header className="admin-header">
          <h1>⚙️ الإدارة الملكية</h1>
          <a href="/" className="exit-btn">خروج للمتجر</a>
        </header>

        <div className="admin-content">
          <div className="admin-form">
            <h2>{editingItem ? '✏️ تعديل المنتج' : '📦 إضافة منتج جديد'}</h2>
            <input placeholder="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <div className="price-row">
              <input placeholder="السعر الجديد" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              <input placeholder="السعر القديم (اختياري)" type="number" value={formData.old_price} onChange={e => setFormData({...formData, old_price: e.target.value})} />
            </div>
            <label className={`sale-toggle ${formData.is_sale ? 'active' : ''}`}>
              🔥 تفعيل شعار العرض الخاص
              <input type="checkbox" checked={formData.is_sale} onChange={e => setFormData({...formData, is_sale: e.target.checked})} />
            </label>
            <label className="upload-btn">
               {formData.image ? "🖼️ تم رفع الصورة" : "📤 ارفع صورة القطعة"}
              <input type="file" accept="image/*" onChange={handleFileUpload} />
            </label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option>كهرباء ⚡</option>
              <option>سباكة 💧</option>
            </select>
            <button onClick={saveProduct} className="save-btn">{editingItem ? 'تحديث البيانات' : 'حفظ في المستودع'}</button>
            {editingItem && <button onClick={() => {setEditingItem(null); setFormData({name:'',price:'',old_price:'',image:'',category:'كهرباء ⚡',is_sale:false})}} className="cancel-btn">إلغاء التعديل</button>}
          </div>

          <div className="inventory-list">
            <h2>📊 المنتجات الحالية ({products.length})</h2>
            <div className="admin-grid">
              {products.map(p => (
                <div key={p.id} className="admin-card">
                  <img src={p.image} alt="" />
                  <div className="admin-info">
                    <p>{p.name}</p>
                    <div className="btns">
                      <button onClick={() => editProduct(p)}>✏️</button>
                      <button onClick={async () => {if(window.confirm('حذف؟')){await fetch(`${API_URL}/${p.id}`,{method:'DELETE'}); fetchProducts();}}}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App client-page">
      <header className="hero">
        <div className="brand">
          <p className="pre-title">مَتجر</p>
          <h1 className="main-title">💧 قَطرة وشرارة ⚡</h1>
        </div>
        <button className="cart-trigger" onClick={() => setShowCart(true)}>🛒 السلة ({cart.length})</button>
      </header>

      <div className="cat-filter">
        {['الكل', 'كهرباء ⚡', 'سباكة 💧'].map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)} className={activeTab === cat ? 'active' : ''}>{cat}</button>
        ))}
      </div>

      <div className="container">
        <div className="store-grid">
          {products.filter(p => activeTab === 'الكل' || p.category === activeTab).map(p => (
            <div key={p.id} className="product-card">
              {p.is_sale && <div className="fire-tag">🔥 عرض خاص</div>}
              <div className="img-box"><img src={p.image} alt={p.name} /></div>
              <div className="details">
                <h3>{p.name}</h3>
                <div className="price-box">
                  <span className="current-price">{p.price} ريال</span>
                  {p.old_price && <span className="old-price">{p.old_price} ريال</span>}
                </div>
                <button className="add-to-cart" onClick={() => addToCart(p)}>إضافة للسلة 🛒</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCart && (
        <div className="cart-overlay">
          <div className="cart-panel">
            <h2>🛒 سلة المشتريات</h2>
            {cart.map((item, i) => (
              <div key={i} className="cart-item">
                <span>{item.name}</span>
                <span>{item.price} ريال</span>
              </div>
            ))}
            <div className="cart-total">الإجمالي: {cart.reduce((a,b)=>a+Number(b.price),0)} ريال</div>
            <button className="wa-order" onClick={sendOrder}>إتمام الطلب عبر واتساب ✅</button>
            <button className="close-cart" onClick={() => setShowCart(false)}>إغلاق</button>
          </div>
        </div>
      )}

      <footer className="footer-royal">
        <p>مؤسسة قطرة وشرارة للتجارة 🇸🇦 2026</p>
        <button onClick={() => window.open('https://maps.google.com')}>📍 موقعنا على الخريطة</button>
      </footer>
    </div>
  );
}

export default App;