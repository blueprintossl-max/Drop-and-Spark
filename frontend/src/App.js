import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark-1.onrender.com/api/products';
const MY_WHATSAPP = "9665XXXXXXXX"; // ضَع رقمك هنا بالصيغة الدولية

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isAdminView, setIsAdminView] = useState('add');
  const [formData, setFormData] = useState({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
  const [showCart, setShowCart] = useState(false);

  const isAdmin = window.location.pathname.includes('/admin');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProducts(data);
    } catch (e) { console.log("تحقق من السيرفر.."); }
  };

  // وظائف السلة
  const addToCart = (product) => {
    setCart([...cart, product]);
    alert(`✅ تم إضافة ${product.name} للسلة`);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const sendToWhatsApp = () => {
    const total = cart.reduce((a, b) => a + Number(b.price), 0);
    let message = `*طلب جديد من متجر قطرة وشرارة* 💧⚡\n\n`;
    cart.forEach((item, i) => {
      message += `${i+1}- ${item.name} (${item.price} ريال)\n`;
    });
    message += `\n*الإجمالي: ${total} ريال*`;
    window.open(`https://wa.me/${MY_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, image: reader.result });
    if (file) reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price || !formData.image) return alert("⚠️ أكمل البيانات");
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      alert("🚀 تم الحفظ بنجاح");
      setFormData({ name: '', price: '', image: '', category: 'كهرباء ⚡' });
      fetchProducts();
    }
  };

  // عرض الإدارة
  if (isAdmin) {
    return (
      <div className="App admin-theme">
        <header className="royal-header">
          <div className="logo">💧 <span>مَتجر</span> قَطرة وشرارة ⚡</div>
          <nav>
            <button onClick={() => setIsAdminView('add')}>➕ إضافة</button>
            <button onClick={() => setIsAdminView('reports')}>📊 تقارير</button>
            <a href="/" className="exit-link">🏠 خروج</a>
          </nav>
        </header>
        <div className="admin-body">
          {isAdminView === 'add' ? (
            <div className="admin-card">
              <h2>📦 توريد بضاعة جديدة</h2>
              <input placeholder="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="السعر" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              <label className="upload-box">
                {formData.image ? "✅ الصورة جاهزة" : "📤 رفع صورة المنتج"}
                <input type="file" accept="image/*" onChange={handleFileUpload} />
              </label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>كهرباء ⚡</option>
                <option>سباكة 💧</option>
              </select>
              <button onClick={handleAdd} className="gold-btn">حفظ في المخزن</button>
            </div>
          ) : (
            <div className="reports-card">
              <h2>📊 ملخص المستودع</h2>
              <p>إجمالي القطع: {products.length}</p>
              <p>قيمة المخزون: {products.reduce((a,b)=>a+Number(b.price),0)} ريال</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // عرض العميل
  return (
    <div className="App client-theme">
      <header className="royal-header">
        <div className="logo">💧 <span>مَتجر</span> قَطرة وشرارة ⚡</div>
        <button className="cart-icon" onClick={() => setShowCart(true)}>🛒 <span>{cart.length}</span></button>
      </header>

      <main className="store-front">
        <div className="product-grid">
          {products.map(p => (
            <div key={p.id} className="item-card">
              <div className="img-wrapper"><img src={p.image} alt={p.name} /></div>
              <div className="item-details">
                <h4>{p.name}</h4>
                <p className="price">{p.price} ريال</p>
                <button className="buy-btn" onClick={() => addToCart(p)}>إضافة للسلة 🛒</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showCart && (
        <div className="cart-modal">
          <div className="modal-content">
            <h3>🛍️ سلة المشتريات</h3>
            {cart.length === 0 ? <p>السلة فارغة..</p> : (
              <>
                {cart.map((item, idx) => (
                  <div key={idx} className="cart-item">
                    <span>{item.name}</span>
                    <span>{item.price} ريال</span>
                    <button onClick={() => removeFromCart(idx)}>❌</button>
                  </div>
                ))}
                <div className="total">الإجمالي: {cart.reduce((a,b)=>a+Number(b.price),0)} ريال</div>
                <button className="wa-btn" onClick={sendToWhatsApp}>إرسال الطلب لواتساب ✅</button>
              </>
            )}
            <button className="close-btn" onClick={() => setShowCart(false)}>إغلاق</button>
          </div>
        </div>
      )}
      <footer className="royal-footer">جميع الحقوق محفوظة لمتجر قطرة وشرارة 2026</footer>
    </div>
  );
}

export default App;