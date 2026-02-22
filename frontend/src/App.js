import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://drop-and-spark.onrender.com/api/products';

// 🔑 كلمة المرور الخاصة بك (يمكنك تغييرها لأي رقم أو كلمة تريدها)
const ADMIN_PASSWORD = "123"; 

function App() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('كهرباء ⚡');
  
  // 🛡️ حالة جديدة لمعرفة هل المستخدم الحالي هو المدير أم زائر عادي (الافتراضي: زائر)
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("❌ خطأ في جلب البيانات:", err));
  }, []);

  const addProduct = async () => {
    if (!name || !price) return alert("⚠️ الرجاء إكمال اسم المنتج والسعر");
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, category })
      });
      
      const data = await res.json();

      if (res.ok) {
        setProducts([data, ...products]);
        setName(''); 
        setPrice('');
        alert("✅ تمت إضافة المنتج للمخزن بنجاح!");
      } else {
        alert(`❌ فشل الحفظ: ${data.error}`);
      }
    } catch (err) {
      alert("تعذر الاتصال بالخادم.");
    }
  };

  // 🚪 دالة تسجيل الدخول والخروج للمدير
  const handleAdminLogin = () => {
    if (isAdmin) {
      // إذا كان مديراً بالفعل وضغط على الزر، نقوم بتسجيل خروجه
      setIsAdmin(false);
      return;
    }
    
    // إذا كان زائراً، نطلب منه كلمة المرور
    const pass = prompt("🔒 الرجاء إدخال كلمة المرور للوصول إلى لوحة تحكم المدير:");
    if (pass === ADMIN_PASSWORD) {
      setIsAdmin(true);
    } else if (pass !== null) { // إذا لم يضغط على "إلغاء"
      alert("❌ كلمة المرور خاطئة! غير مصرح لك بالدخول.");
    }
  };

  return (
    <div className="App" style={{ direction: 'rtl', padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      
      {/* --- قسم العنوان (يحتوي على زر القفل المخفي) --- */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>متجر 💧 قطرة و⚡ شرارة</h1>
        <button 
          onClick={handleAdminLogin} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '25px' }}
          title="دخول المدير"
        >
          {isAdmin ? '🚪' : '🔒'}
        </button>
      </header>
      
      {/* --- لوحة تحكم المدير (تظهر فقط إذا كان isAdmin يساوي true) --- */}
      {isAdmin && (
        <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '10px', border: '2px dashed #ffc107', marginBottom: '30px' }}>
          <h3 style={{ color: '#856404', marginTop: 0 }}>🛠️ لوحة تحكم المدير (إضافة منتج جديد)</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input placeholder="اسم المنتج" value={name} onChange={e => setName(e.target.value)} style={{ padding: '8px' }} />
            <input placeholder="السعر" type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: '8px', width: '100px' }} />
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '8px' }}>
              <option value="كهرباء ⚡">أدوات كهرباء ⚡</option>
              <option value="سباكة 💧">أدوات سباكة 💧</option>
            </select>
            <button onClick={addProduct} style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
              إضافة للمخزن 🚀
            </button>
          </div>
        </div>
      )}
      
      {/* --- قسم عرض البضائع (يظهر للجميع دائماً) --- */}
      <h2>📦 بضائع المتجر الحالية</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
        {products.map((p, i) => (
          <div key={i} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', minWidth: '150px', background: '#f9f9f9', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{p.name}</h3>
            <p style={{ fontWeight: 'bold', color: '#007bff', fontSize: '18px', margin: '5px 0' }}>{p.price} ريال</p>
            <p style={{ color: '#666', margin: 0 }}>{p.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
