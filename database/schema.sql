-- جدول المستخدمين (العملاء والإدارة)
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer', -- customer, admin, contractor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول تصنيفات الأدوات الكهربائية
CREATE TABLE Categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- مثلاً: أدوات يدوية، كابلات، إضاءة
    description TEXT
);

-- جدول المنتجات (الأدوات الكهربائية)
CREATE TABLE Products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES Categories(id),
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    voltage VARCHAR(20), -- الجهد الكهربائي (مثال: 220V)
    wattage VARCHAR(20), -- القدرة بالواط (مثال: 1500W)
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);