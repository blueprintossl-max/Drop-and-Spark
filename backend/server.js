async function initDb() {
  try {
    // 1. بناء جميع جداول النظام الأساسية لضمان عدم وجود أي نقص أو انهيار
    await sql`CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, username VARCHAR(255) UNIQUE, pin VARCHAR(255), role VARCHAR(50))`;
    await sql`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255), price NUMERIC, old_price NUMERIC, stock INT, sold INT, details TEXT, image TEXT, category VARCHAR(255), is_sale BOOLEAN, out_of_stock BOOLEAN, modified_by VARCHAR(255))`;
    await sql`CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name VARCHAR(255), icon VARCHAR(50), parent VARCHAR(255))`;
    await sql`CREATE TABLE IF NOT EXISTS workers (id SERIAL PRIMARY KEY, name VARCHAR(255), phone VARCHAR(255), details TEXT, image TEXT, region VARCHAR(255), city VARCHAR(255), profession VARCHAR(255), portfolio_img TEXT, safety_details TEXT, rating VARCHAR(50), is_busy BOOLEAN, hidden BOOLEAN, modified_by VARCHAR(255))`;
    await sql`CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, phone VARCHAR(255), email VARCHAR(255), shop_name VARCHAR(255))`;
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(255),
        cart_data JSONB NOT NULL,
        total NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'معلق',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 2. الحل الجذري للدخول: التحقق من وجود حساب المدير، وإذا لم يوجد يتم إضافته تلقائياً
    const adminsCount = await sql`SELECT COUNT(*) FROM admins`;
    if (Number(adminsCount[0].count) === 0) {
      await sql`INSERT INTO admins (username, pin, role) VALUES ('adeeb', '0000', 'مدير')`;
      console.log("✅ تم إنشاء حساب المدير الجذري بنجاح");
    }

    // 3. تهيئة إعدادات المتجر إذا كانت فارغة
    const settingsCount = await sql`SELECT COUNT(*) FROM settings`;
    if (Number(settingsCount[0].count) === 0) {
      await sql`INSERT INTO settings (shop_name, phone) VALUES ('تشاطيب', '966500000000')`;
    }

    console.log("✅ تمت تهيئة قاعدة البيانات وبناء جميع الجداول بنجاح تام");
  } catch (e) {
    console.error("❌ خطأ في بناء قاعدة البيانات الجذري:", e.message);
  }
}