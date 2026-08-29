const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory Database (Serverless Ready)
const db = {
  users: [
    { id: 1, username: 'admin', fullName: 'Operations Admin', role: 'ADMIN', employeeCode: 'ADM001', phone: '+91 99000 00000', territory: 'Headquarters', password: '1234', active: true },
    { id: 2, username: 'emp001', fullName: 'Rahul Sharma', role: 'EMPLOYEE', employeeCode: 'EMP001', phone: '+91 98111 00001', territory: 'Central Market & Connaught Hub', password: '1234', active: true },
    { id: 3, username: 'emp002', fullName: 'Priya Patel', role: 'EMPLOYEE', employeeCode: 'EMP002', phone: '+91 98111 00002', territory: 'North City & Civil Lines', password: '1234', active: true },
    { id: 4, username: 'emp003', fullName: 'Amit Kumar', role: 'EMPLOYEE', employeeCode: 'EMP003', phone: '+91 98111 00003', territory: 'West End Retail Corridor', password: '1234', active: true },
    { id: 5, username: 'emp004', fullName: 'Sneha Gupta', role: 'EMPLOYEE', employeeCode: 'EMP004', phone: '+91 98111 00004', territory: 'South Plaza & Commercial Sector', password: '1234', active: true },
    { id: 6, username: 'emp005', fullName: 'Vikram Singh', role: 'EMPLOYEE', employeeCode: 'EMP005', phone: '+91 98111 00005', territory: 'East Industrial District', password: '1234', active: true },
    { id: 7, username: 'emp006', fullName: 'Ananya Roy', role: 'EMPLOYEE', employeeCode: 'EMP006', phone: '+91 98111 00006', territory: 'Old Town Traditional Bazaar', password: '1234', active: true },
    { id: 8, username: 'emp007', fullName: 'Rajesh Verma', role: 'EMPLOYEE', employeeCode: 'EMP007', phone: '+91 98111 00007', territory: 'Metro Line Station Shops', password: '1234', active: true },
    { id: 9, username: 'emp008', fullName: 'Pooja Joshi', role: 'EMPLOYEE', employeeCode: 'EMP008', phone: '+91 98111 00008', territory: 'Tech Park & Cyber Hub', password: '1234', active: true },
    { id: 10, username: 'emp009', fullName: 'Deepak Nair', role: 'EMPLOYEE', employeeCode: 'EMP009', phone: '+91 98111 00009', territory: 'Coastal Zone & Port Market', password: '1234', active: true },
    { id: 11, username: 'emp010', fullName: 'Kavita Reddy', role: 'EMPLOYEE', employeeCode: 'EMP010', phone: '+91 98111 00010', territory: 'Green Park Residential Sector', password: '1234', active: true },
    { id: 12, username: 'emp011', fullName: 'Suresh Menon', role: 'EMPLOYEE', employeeCode: 'EMP011', phone: '+91 98111 00011', territory: 'Hill View & Valley Shops', password: '1234', active: true },
    { id: 13, username: 'emp012', fullName: 'Neha Choudhary', role: 'EMPLOYEE', employeeCode: 'EMP012', phone: '+91 98111 00012', territory: 'Riverside Market Link', password: '1234', active: true },
    { id: 14, username: 'emp013', fullName: 'Manoj Tiwari', role: 'EMPLOYEE', employeeCode: 'EMP013', phone: '+91 98111 00013', territory: 'Commercial Complex Block A', password: '1234', active: true },
    { id: 15, username: 'emp014', fullName: 'Sunita Das', role: 'EMPLOYEE', employeeCode: 'EMP014', phone: '+91 98111 00014', territory: 'West Gate Junction', password: '1234', active: true },
    { id: 16, username: 'emp015', fullName: 'Rohit Saxena', role: 'EMPLOYEE', employeeCode: 'EMP015', phone: '+91 98111 00015', territory: 'Highway Logistics Corridor', password: '1234', active: true },
    { id: 17, username: 'emp016', fullName: 'Meera Iyer', role: 'EMPLOYEE', employeeCode: 'EMP016', phone: '+91 98111 00016', territory: 'Lakeview Promenade Market', password: '1234', active: true },
    { id: 18, username: 'emp017', fullName: 'Sanjay Mishra', role: 'EMPLOYEE', employeeCode: 'EMP017', phone: '+91 98111 00017', territory: 'City Center Ring Road', password: '1234', active: true },
    { id: 19, username: 'emp018', fullName: 'Divya Kapoor', role: 'EMPLOYEE', employeeCode: 'EMP018', phone: '+91 98111 00018', territory: 'North Gate Suburbs', password: '1234', active: true },
    { id: 20, username: 'emp019', fullName: 'Alok Singhal', role: 'EMPLOYEE', employeeCode: 'EMP019', phone: '+91 98111 00019', territory: 'South Extension & Arcade', password: '1234', active: true },
    { id: 21, username: 'emp020', fullName: 'Ritu Deshmukh', role: 'EMPLOYEE', employeeCode: 'EMP020', phone: '+91 98111 00020', territory: 'University Town & Hostel Zone', password: '1234', active: true }
  ],
  shops: [
    { id: 1, name: 'Gupta Kirana & Provisions', ownerName: 'Ramesh Gupta', phone: '+91 98200 11223', address: 'Shop 14, Main Market, Connaught Hub', territory: 'Central Market & Connaught Hub', email: 'guptakirana@gmail.com', gstNumber: '07AAAAA0000A1Z5', active: true },
    { id: 2, name: 'Sharma Daily Needs', ownerName: 'Sunil Sharma', phone: '+91 98200 22334', address: 'Plot 88, Sector 12, Civil Lines', territory: 'North City & Civil Lines', email: 'sharmadaily@gmail.com', gstNumber: '07BBBBB1111B1Z6', active: true },
    { id: 3, name: 'Mahalaxmi Supermart', ownerName: 'Kishore Patel', phone: '+91 98200 33445', address: 'B-12, Western High Road', territory: 'West End Retail Corridor', email: 'mahalaxmi.retail@gmail.com', gstNumber: '07CCCCC2222C1Z7', active: true },
    { id: 4, name: 'City Corner Grocery', ownerName: 'Anil Agarwal', phone: '+91 98200 44556', address: 'Ground Floor, South Plaza Arcade', territory: 'South Plaza & Commercial Sector', email: 'citycorner@yahoo.com', gstNumber: '07DDDDD3333D1Z8', active: true },
    { id: 5, name: 'Shree Ganesh Provision Store', ownerName: 'Mahesh Shinde', phone: '+91 98200 55667', address: 'Shop 5, Chandni Bazaar Road', territory: 'Old Town Traditional Bazaar', email: 'ganeshprovisions@gmail.com', gstNumber: '07EEEEE4444E1Z9', active: true },
    { id: 6, name: 'Apki Apni Dukan', ownerName: 'Vijay Sethi', phone: '+91 98200 66778', address: 'Tower 3 Arcade, Cyber Gateway', territory: 'Tech Park & Cyber Hub', email: 'apkidukan@outlook.com', gstNumber: '07FFFFF5555F1Z0', active: true },
    { id: 7, name: 'Sunrise Minimart', ownerName: 'Pradeep Rao', phone: '+91 98200 77889', address: 'Block C, Green Park Main Market', territory: 'Green Park Residential Sector', email: 'sunriseminimart@gmail.com', gstNumber: '07GGGGG6666G1Z1', active: true },
    { id: 8, name: 'Evergreen Grocers', ownerName: 'Harish Mehta', phone: '+91 98200 88990', address: 'Metro Station Gate 2 Complex', territory: 'Metro Line Station Shops', email: 'evergreengrocers@gmail.com', gstNumber: '07HHHHH7777H1Z2', active: true },
    { id: 9, name: 'Balaji Traders', ownerName: 'Narayan Swamy', phone: '+91 98200 99001', address: 'Harbor View Road, Dockyard Colony', territory: 'Coastal Zone & Port Market', email: 'balajitraders@rediffmail.com', gstNumber: '07IIIII8888I1Z3', active: true },
    { id: 10, name: 'Royal Provision Mart', ownerName: 'Sanjay Chopra', phone: '+91 98201 00112', address: 'Shop 21, Commercial Hub Complex', territory: 'Commercial Complex Block A', email: 'royalprovisions@gmail.com', gstNumber: '07JJJJJ9999J1Z4', active: true },
    { id: 11, name: 'New India Superstore', ownerName: 'Bhavesh Shah', phone: '+91 98201 11223', address: 'West Gate Circle, Ring Road', territory: 'West Gate Junction', email: 'newindiastore@gmail.com', gstNumber: '07KKKKK0000K1Z5', active: true },
    { id: 12, name: 'Krishna Retailers', ownerName: 'Gopal Joshi', phone: '+91 98201 22334', address: 'National Highway Toll Plaza Complex', territory: 'Highway Logistics Corridor', email: 'krishnaretail@gmail.com', gstNumber: '07LLLLL1111L1Z6', active: true },
    { id: 13, name: 'Metro Supermart', ownerName: 'Arvind Jain', phone: '+91 98201 33445', address: 'Lake Promenade Commercial Wing', territory: 'Lakeview Promenade Market', email: 'metrosupermart@gmail.com', gstNumber: '07MMMMM2222M1Z7', active: true },
    { id: 14, name: 'Quick Mart Express', ownerName: 'Tarun Goyal', phone: '+91 98201 44556', address: 'Central Ring Road Flyover Junction', territory: 'City Center Ring Road', email: 'quickmartexpress@gmail.com', gstNumber: '07NNNNN3333N1Z8', active: true },
    { id: 15, name: 'Heritage Grocery & Spices', ownerName: 'Mohan Lal', phone: '+91 98201 55667', address: 'North Gate Junction, Old Fort Road', territory: 'North Gate Suburbs', email: 'heritagegrocers@gmail.com', gstNumber: '07OOOOO4444O1Z9', active: true },
    { id: 16, name: 'Saraswati General Store', ownerName: 'Santosh Pandey', phone: '+91 98201 66778', address: 'University South Gate, College Road', territory: 'University Town & Hostel Zone', email: 'saraswatistore@gmail.com', gstNumber: '07PPPPP5555P1Z0', active: true }
  ],
  products: [
    { id: 1, sku: 'SNK-001', name: 'Parle-G Gold Glucose Biscuit', category: 'Snacks & Biscuits', unit: 'Box of 24 Packs', price: 240, stockQuantity: 150, minOrderQuantity: 2, imageUrl: '🍪', description: 'Classic energy biscuits in wholesale master pack', active: true },
    { id: 2, sku: 'SNK-002', name: 'Britannia Good Day Butter Cookies', category: 'Snacks & Biscuits', unit: 'Box of 30 Packs', price: 450, stockQuantity: 120, minOrderQuantity: 2, imageUrl: '🍪', description: 'Rich butter crunchy cookies wholesale carton', active: true },
    { id: 3, sku: 'SNK-003', name: "Lay's Magic Masala Potato Chips", category: 'Snacks & Biscuits', unit: 'Carton of 48 Packs', price: 720, stockQuantity: 90, minOrderQuantity: 1, imageUrl: '🥔', description: 'Spicy Indian magic masala potato chips 30g pack', active: true },
    { id: 4, sku: 'SNK-004', name: 'Kurkure Masala Munch', category: 'Snacks & Biscuits', unit: 'Carton of 48 Packs', price: 720, stockQuantity: 110, minOrderQuantity: 1, imageUrl: '🌽', description: 'Crispy spiced corn puffs popular snack pack', active: true },
    { id: 5, sku: 'SNK-005', name: 'Cadbury Oreo Vanilla Creme', category: 'Snacks & Biscuits', unit: 'Box of 24 Packs', price: 480, stockQuantity: 85, minOrderQuantity: 2, imageUrl: '🍫', description: 'Chocolate sandwich biscuit with smooth vanilla creme', active: true },
    { id: 6, sku: 'SNK-006', name: "Haldiram's Nagpur Aloo Bhujia 400g", category: 'Snacks & Biscuits', unit: 'Case of 12 Packs', price: 960, stockQuantity: 75, minOrderQuantity: 1, imageUrl: '🥨', description: 'Traditional savoury spicy potato & gram flour crisps', active: true },
    { id: 7, sku: 'BEV-001', name: 'Coca-Cola Original 250ml Can', category: 'Beverages & Drinks', unit: 'Case of 24 Cans', price: 840, stockQuantity: 140, minOrderQuantity: 2, imageUrl: '🥤', description: 'Sparkling refreshing cola drink chilled cans', active: true },
    { id: 8, sku: 'BEV-002', name: 'Frooti Fresh Mango Drink 200ml', category: 'Beverages & Drinks', unit: 'Tetra Pack of 30', price: 540, stockQuantity: 160, minOrderQuantity: 2, imageUrl: '🧃', description: 'Juicy mango drink tetra pack popular with retailers', active: true },
    { id: 9, sku: 'BEV-003', name: 'Red Bull Energy Drink 250ml', category: 'Beverages & Drinks', unit: 'Pack of 24 Cans', price: 2400, stockQuantity: 50, minOrderQuantity: 1, imageUrl: '⚡', description: 'Premium energy drink wholesale crate', active: true },
    { id: 10, sku: 'BEV-004', name: 'Tata Tea Premium Leaf 500g', category: 'Beverages & Drinks', unit: 'Carton of 12 Packs', price: 2160, stockQuantity: 65, minOrderQuantity: 1, imageUrl: '🍵', description: 'Desh ki Chai blended premium black tea leaves', active: true },
    { id: 11, sku: 'BEV-005', name: 'Nescafe Classic Instant Coffee 50g', category: 'Beverages & Drinks', unit: 'Jar Pack of 12', price: 1680, stockQuantity: 80, minOrderQuantity: 1, imageUrl: '☕', description: 'Rich aroma pure soluble coffee glass jars', active: true },
    { id: 12, sku: 'BEV-006', name: 'Bisleri Packaged Drinking Water 1L', category: 'Beverages & Drinks', unit: 'Crate of 12 Bottles', price: 180, stockQuantity: 200, minOrderQuantity: 3, imageUrl: '💧', description: 'Mineral purified water wholesale crate', active: true },
    { id: 13, sku: 'STP-001', name: 'Fortune Sunlite Refined Oil 1L', category: 'Staples & Cooking', unit: 'Carton of 12 Pouches', price: 1560, stockQuantity: 100, minOrderQuantity: 1, imageUrl: '🛢️', description: 'Refined sunflower cooking oil pouch carton', active: true },
    { id: 14, sku: 'STP-002', name: 'India Gate Basmati Rice Feast 5kg', category: 'Staples & Cooking', unit: 'Bag of 4 Units', price: 1800, stockQuantity: 70, minOrderQuantity: 1, imageUrl: '🍚', description: 'Long grain fragrant premium basmati rice', active: true },
    { id: 15, sku: 'STP-003', name: 'Aashirvaad Shudh Chakki Atta 10kg', category: 'Staples & Cooking', unit: 'Bag of 2 Units', price: 780, stockQuantity: 90, minOrderQuantity: 1, imageUrl: '🌾', description: '100% whole wheat whole flour sacks', active: true },
    { id: 16, sku: 'STP-004', name: 'Tata Salt Vacuum Evaporated 1kg', category: 'Staples & Cooking', unit: 'Sack of 25 Packs', price: 550, stockQuantity: 120, minOrderQuantity: 2, imageUrl: '🧂', description: 'Iodized refined cooking salt master sack', active: true },
    { id: 17, sku: 'STP-005', name: 'MDH Deggi Mirch Powder 100g', category: 'Staples & Cooking', unit: 'Pack of 10 Boxes', price: 650, stockQuantity: 95, minOrderQuantity: 1, imageUrl: '🌶️', description: 'Rich red color mild spicy chilli blend', active: true },
    { id: 18, sku: 'STP-006', name: 'Catch Super Garam Masala 100g', category: 'Staples & Cooking', unit: 'Pack of 10 Boxes', price: 750, stockQuantity: 80, minOrderQuantity: 1, imageUrl: '🌿', description: 'Authentic roasted spice mix for savory curries', active: true },
    { id: 19, sku: 'DAR-001', name: 'Amul Butter Pasteurised 500g', category: 'Dairy & Breakfast', unit: 'Box of 20 Packs', price: 4900, stockQuantity: 45, minOrderQuantity: 1, imageUrl: '🧈', description: 'Pure dairy cream butter wholesale refrigerated pack', active: true },
    { id: 20, sku: 'DAR-002', name: "Kellogg's Corn Flakes Original 475g", category: 'Dairy & Breakfast', unit: 'Case of 12 Packs', price: 2040, stockQuantity: 60, minOrderQuantity: 1, imageUrl: '🥣', description: 'Crispy toasted whole grain breakfast cereal', active: true },
    { id: 21, sku: 'DAR-003', name: 'Quaker Whole Rolled Oats 1kg', category: 'Dairy & Breakfast', unit: 'Pack of 8 Pouches', price: 1440, stockQuantity: 55, minOrderQuantity: 1, imageUrl: '🥣', description: '100% natural wholegrain dietary fiber oats', active: true },
    { id: 22, sku: 'DAR-004', name: 'Kissan Fresh Tomato Ketchup 1kg', category: 'Dairy & Breakfast', unit: 'Case of 12 Bottles', price: 1440, stockQuantity: 70, minOrderQuantity: 1, imageUrl: '🍅', description: 'Sweet tangy tomato ketchup squeezy bottles', active: true },
    { id: 23, sku: 'DAR-005', name: 'Nutella Hazelnut Cocoa Spread 350g', category: 'Dairy & Breakfast', unit: 'Case of 6 Jars', price: 1920, stockQuantity: 40, minOrderQuantity: 1, imageUrl: '🍫', description: 'Creamy chocolate hazelnut breakfast spread', active: true },
    { id: 24, sku: 'PER-001', name: 'Dettol Original Bath Soap 125g', category: 'Personal Care & Hygiene', unit: 'Bundle of 16 Bars', price: 720, stockQuantity: 110, minOrderQuantity: 2, imageUrl: '🧼', description: 'Antibacterial trusted germ protection soap', active: true },
    { id: 25, sku: 'PER-002', name: 'Colgate Strong Teeth Toothpaste 150g', category: 'Personal Care & Hygiene', unit: 'Carton of 24 Tubes', price: 1680, stockQuantity: 95, minOrderQuantity: 1, imageUrl: '🪥', description: 'Calcium boosted cavity protection toothpaste', active: true },
    { id: 26, sku: 'PER-003', name: 'Head & Shoulders Shampoo 180ml', category: 'Personal Care & Hygiene', unit: 'Pack of 12 Bottles', price: 1920, stockQuantity: 60, minOrderQuantity: 1, imageUrl: '🧴', description: 'Smooth & silky anti-dandruff daily shampoo', active: true },
    { id: 27, sku: 'PER-004', name: 'Lifebuoy Total Handwash Refill 750ml', category: 'Personal Care & Hygiene', unit: 'Box of 8 Pouches', price: 880, stockQuantity: 85, minOrderQuantity: 1, imageUrl: '🧴', description: 'Fast acting antibacterial handwash liquid', active: true },
    { id: 28, sku: 'PER-005', name: 'Nivea Soft Light Moisturizer 200ml', category: 'Personal Care & Hygiene', unit: 'Pack of 6 Jars', price: 1500, stockQuantity: 50, minOrderQuantity: 1, imageUrl: '✨', description: 'Non-greasy nourishing skin cream with Vitamin E', active: true },
    { id: 29, sku: 'HOU-001', name: 'Surf Excel Easy Wash Detergent 1kg', category: 'Household & Cleaning', unit: 'Bag of 10 Packs', price: 1350, stockQuantity: 90, minOrderQuantity: 1, imageUrl: '🧺', description: 'Advanced stain removal washing powder', active: true },
    { id: 30, sku: 'HOU-002', name: 'Vim Lemon Dishwash Liquid 500ml', category: 'Household & Cleaning', unit: 'Pack of 12 Bottles', price: 1080, stockQuantity: 105, minOrderQuantity: 1, imageUrl: '🍋', description: 'Concentrated grease removal lemon dish gel', active: true }
  ],
  orders: [
    {
      id: 1,
      orderNumber: 'ORD-20260829-0101',
      shop: { id: 1, name: 'Gupta Kirana & Provisions', ownerName: 'Ramesh Gupta', phone: '+91 98200 11223', address: 'Shop 14, Main Market, Connaught Hub', territory: 'Central Market & Connaught Hub', gstNumber: '07AAAAA0000A1Z5' },
      employee: { id: 2, username: 'emp001', fullName: 'Rahul Sharma', employeeCode: 'EMP001', territory: 'Central Market & Connaught Hub' },
      status: 'DONE',
      paymentMethod: 'Cash on Delivery',
      notes: 'Delivered on morning route',
      subtotal: 5520,
      taxAmount: 276,
      grandTotal: 5796,
      items: [
        { id: 1, productId: 1, productName: 'Parle-G Gold Glucose Biscuit', unitPrice: 240, quantity: 3, subtotal: 720 },
        { id: 2, productId: 3, productName: "Lay's Magic Masala Potato Chips", unitPrice: 720, quantity: 2, subtotal: 1440 },
        { id: 3, productId: 7, productName: 'Coca-Cola Original 250ml Can', unitPrice: 840, quantity: 4, subtotal: 3360 }
      ],
      createdAt: new Date(Date.now() - 28 * 3600000).toISOString()
    },
    {
      id: 2,
      orderNumber: 'ORD-20260829-0102',
      shop: { id: 2, name: 'Sharma Daily Needs', ownerName: 'Sunil Sharma', phone: '+91 98200 22334', address: 'Plot 88, Sector 12, Civil Lines', territory: 'North City & Civil Lines', gstNumber: '07BBBBB1111B1Z6' },
      employee: { id: 3, username: 'emp002', fullName: 'Priya Patel', employeeCode: 'EMP002', territory: 'North City & Civil Lines' },
      status: 'DONE',
      paymentMethod: '7 Days Credit',
      notes: 'Shop credit verified',
      subtotal: 9060,
      taxAmount: 453,
      grandTotal: 9513,
      items: [
        { id: 4, productId: 13, productName: 'Fortune Sunlite Refined Oil 1L', unitPrice: 1560, quantity: 2, subtotal: 3120 },
        { id: 5, productId: 14, productName: 'India Gate Basmati Rice Feast 5kg', unitPrice: 1800, quantity: 2, subtotal: 3600 },
        { id: 6, productId: 15, productName: 'Aashirvaad Shudh Chakki Atta 10kg', unitPrice: 780, quantity: 3, subtotal: 2340 }
      ],
      createdAt: new Date(Date.now() - 20 * 3600000).toISOString()
    },
    {
      id: 3,
      orderNumber: 'ORD-20260829-0103',
      shop: { id: 3, name: 'Mahalaxmi Supermart', ownerName: 'Kishore Patel', phone: '+91 98200 33445', address: 'B-12, Western High Road', territory: 'West End Retail Corridor', gstNumber: '07CCCCC2222C1Z7' },
      employee: { id: 4, username: 'emp003', fullName: 'Amit Kumar', employeeCode: 'EMP003', territory: 'West End Retail Corridor' },
      status: 'SHIPPED',
      paymentMethod: 'UPI / Instant Pay',
      notes: 'Dispatch van #4 out for delivery',
      subtotal: 7260,
      taxAmount: 363,
      grandTotal: 7623,
      items: [
        { id: 7, productId: 2, productName: 'Britannia Good Day Butter Cookies', unitPrice: 450, quantity: 4, subtotal: 1800 },
        { id: 8, productId: 8, productName: 'Frooti Fresh Mango Drink 200ml', unitPrice: 540, quantity: 3, subtotal: 1620 },
        { id: 9, productId: 24, productName: 'Dettol Original Bath Soap 125g', unitPrice: 720, quantity: 2, subtotal: 1440 }
      ],
      createdAt: new Date(Date.now() - 10 * 3600000).toISOString()
    },
    {
      id: 4,
      orderNumber: 'ORD-20260829-0104',
      shop: { id: 4, name: 'City Corner Grocery', ownerName: 'Anil Agarwal', phone: '+91 98200 44556', address: 'Ground Floor, South Plaza Arcade', territory: 'South Plaza & Commercial Sector', gstNumber: '07DDDDD3333D1Z8' },
      employee: { id: 5, username: 'emp004', fullName: 'Sneha Gupta', employeeCode: 'EMP004', territory: 'South Plaza & Commercial Sector' },
      status: 'SHIPPED',
      paymentMethod: 'Cash on Delivery',
      notes: 'Keep change ready at shop',
      subtotal: 16010,
      taxAmount: 800.5,
      grandTotal: 16810.5,
      items: [
        { id: 10, productId: 19, productName: 'Amul Butter Pasteurised 500g', unitPrice: 4900, quantity: 2, subtotal: 9800 },
        { id: 11, productId: 29, productName: 'Surf Excel Easy Wash Detergent 1kg', unitPrice: 1350, quantity: 3, subtotal: 4050 },
        { id: 12, productId: 30, productName: 'Vim Lemon Dishwash Liquid 500ml', unitPrice: 1080, quantity: 2, subtotal: 2160 }
      ],
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString()
    },
    {
      id: 5,
      orderNumber: 'ORD-20260829-0105',
      shop: { id: 5, name: 'Shree Ganesh Provision Store', ownerName: 'Mahesh Shinde', phone: '+91 98200 55667', address: 'Shop 5, Chandni Bazaar Road', territory: 'Old Town Traditional Bazaar', gstNumber: '07EEEEE4444E1Z9' },
      employee: { id: 6, username: 'emp005', fullName: 'Vikram Singh', employeeCode: 'EMP005', territory: 'Old Town Traditional Bazaar' },
      status: 'PENDING',
      paymentMethod: 'Cash on Delivery',
      notes: 'Urgent stock requirement for festival',
      subtotal: 12240,
      taxAmount: 612,
      grandTotal: 12852,
      items: [
        { id: 13, productId: 5, productName: 'Cadbury Oreo Vanilla Creme', unitPrice: 480, quantity: 5, subtotal: 2400 },
        { id: 14, productId: 9, productName: 'Red Bull Energy Drink 250ml', unitPrice: 2400, quantity: 2, subtotal: 4800 },
        { id: 15, productId: 11, productName: 'Nescafe Classic Instant Coffee 50g', unitPrice: 1680, quantity: 3, subtotal: 5040 }
      ],
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
    }
  ]
};

// API ROUTES

// 1. Auth: Login with PIN 1234
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier) return res.status(400).json({ success: false, message: 'Identifier is required' });
  if (!password) return res.status(400).json({ success: false, message: 'Password / PIN is required' });

  const id = identifier.trim().toLowerCase();
  const user = db.users.find(u => u.username.toLowerCase() === id || (u.employeeCode && u.employeeCode.toLowerCase() === id));

  if (!user) return res.status(400).json({ success: false, message: 'User not found' });
  if (password.trim() !== '1234' && password.trim() !== user.password) {
    return res.status(400).json({ success: false, message: 'Invalid password / PIN' });
  }

  const { password: _, ...userWithoutPassword } = user;
  return res.json({ success: true, message: 'Login successful', user: userWithoutPassword });
});

// Demo Users for Switcher
app.get('/api/auth/demo-users', (req, res) => {
  const safeUsers = db.users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// Employees
app.get('/api/employees', (req, res) => {
  const emps = db.users.filter(u => u.role === 'EMPLOYEE').map(({ password, ...u }) => u);
  res.json(emps);
});

app.get('/api/employees/:id', (req, res) => {
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Employee not found' });
  const { password, ...safe } = user;
  res.json(safe);
});

// Shops
app.get('/api/shops', (req, res) => {
  const { search } = req.query;
  if (search) {
    const q = search.toLowerCase();
    return res.json(db.shops.filter(s => s.name.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q) || s.phone.includes(q)));
  }
  res.json(db.shops);
});

app.post('/api/shops', (req, res) => {
  const { name, ownerName, phone, address, territory, email, gstNumber } = req.body;
  if (!name || !ownerName || !phone || !address) {
    return res.status(400).json({ error: 'Name, owner, phone and address are required' });
  }
  const newShop = {
    id: db.shops.length + 1,
    name,
    ownerName,
    phone,
    address,
    territory: territory || 'General',
    email: email || '',
    gstNumber: gstNumber || '',
    active: true
  };
  db.shops.push(newShop);
  res.json(newShop);
});

// Products & Categories
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let list = db.products.filter(p => p.active);
  if (category && category !== 'ALL') {
    list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  res.json(list);
});

app.get('/api/products/categories', (req, res) => {
  const cats = [...new Set(db.products.map(p => p.category))].sort();
  res.json(cats);
});

// Admin only: Update product stock / inventory level
app.patch('/api/products/:id/stock', (req, res) => {
  const { stockQuantity, requesterId } = req.body;

  // Authorization: only administrators may adjust inventory
  const requester = db.users.find(u => u.id === parseInt(requesterId));
  if (!requester || requester.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only administrators can update inventory' });
  }

  const product = db.products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const qty = Number(stockQuantity);
  if (!Number.isInteger(qty) || qty < 0) {
    return res.status(400).json({ error: 'Stock quantity must be a non-negative whole number' });
  }

  product.stockQuantity = qty;
  res.json(product);
});

// Orders
app.get('/api/orders', (req, res) => {
  const { status, employeeId, shopId } = req.query;
  let list = [...db.orders].reverse();
  if (status && status !== 'ALL') list = list.filter(o => o.status === status);
  if (employeeId) list = list.filter(o => o.employee.id === parseInt(employeeId));
  if (shopId) list = list.filter(o => o.shop.id === parseInt(shopId));
  res.json(list);
});

app.post('/api/orders', (req, res) => {
  const { shopId, employeeId, paymentMethod, notes, items } = req.body;
  if (!shopId || !employeeId || !items || !items.length) {
    return res.status(400).json({ error: 'Shop, employee, and items are required' });
  }

  const shop = db.shops.find(s => s.id === parseInt(shopId));
  const employee = db.users.find(u => u.id === parseInt(employeeId));
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  // Validate stock availability up front so we never partially deduct on failure
  for (const it of items) {
    const prod = db.products.find(p => p.id === parseInt(it.productId));
    if (!prod || !(it.quantity > 0)) continue;
    if (prod.stockQuantity <= 0) {
      return res.status(400).json({ error: `${prod.name} is out of stock` });
    }
    if (it.quantity > prod.stockQuantity) {
      return res.status(400).json({ error: `Only ${prod.stockQuantity} unit(s) of ${prod.name} in stock` });
    }
  }

  let subtotal = 0;
  const orderItems = [];

  for (const it of items) {
    const prod = db.products.find(p => p.id === parseInt(it.productId));
    if (prod && it.quantity > 0) {
      const itemSub = prod.price * it.quantity;
      subtotal += itemSub;
      prod.stockQuantity = Math.max(0, prod.stockQuantity - it.quantity);
      orderItems.push({
        id: orderItems.length + 1,
        productId: prod.id,
        productName: prod.name,
        unitPrice: prod.price,
        quantity: it.quantity,
        subtotal: itemSub
      });
    }
  }

  const taxAmount = Number((subtotal * 0.05).toFixed(2));
  const grandTotal = Number((subtotal + taxAmount).toFixed(2));
  const orderNumber = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    id: db.orders.length + 1,
    orderNumber,
    shop: { id: shop.id, name: shop.name, ownerName: shop.ownerName, phone: shop.phone, address: shop.address, territory: shop.territory, gstNumber: shop.gstNumber },
    employee: { id: employee.id, username: employee.username, fullName: employee.fullName, employeeCode: employee.employeeCode, territory: employee.territory },
    status: 'PENDING',
    paymentMethod: paymentMethod || 'Cash on Delivery',
    notes: notes || '',
    subtotal,
    taxAmount,
    grandTotal,
    items: orderItems,
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);
  res.json(newOrder);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = status;
  order.updatedAt = new Date().toISOString();
  if (status === 'SHIPPED') order.shippedAt = new Date().toISOString();
  if (status === 'DONE') order.completedAt = new Date().toISOString();

  res.json(order);
});

app.get('/api/orders/:id/invoice', (req, res) => {
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const dateObj = new Date(order.createdAt);
  res.json({
    order,
    companyName: 'Apex Retail Distributors Ltd.',
    companyAddress: 'Plot 42, Metro Logistics Hub, Sector 18, Commercial Zone',
    companyPhone: '+91 98765 43210 / +91 11 2345 6789',
    companyEmail: 'orders@apexretaildist.com',
    companyGst: '27AABCA1234F1Z8',
    invoiceNumber: `INV-${order.orderNumber.replace('ORD-', '')}`,
    invoiceDate: dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    printedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  });
});

// Analytics Dashboard
app.get('/api/analytics/dashboard', (req, res) => {
  const totalOrders = db.orders.length;
  const totalRevenue = db.orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.grandTotal : 0), 0);
  const pendingOrders = db.orders.filter(o => o.status === 'PENDING').length;
  const shippedOrders = db.orders.filter(o => o.status === 'SHIPPED').length;
  const doneOrders = db.orders.filter(o => o.status === 'DONE').length;
  const cancelledOrders = db.orders.filter(o => o.status === 'CANCELLED').length;

  // Top 5 Employees
  const empMap = {};
  db.orders.forEach(o => {
    if (o.status !== 'CANCELLED' && o.employee) {
      const key = `${o.employee.employeeCode} - ${o.employee.fullName}`;
      if (!empMap[key]) empMap[key] = { employee: key, orderCount: 0, revenue: 0 };
      empMap[key].orderCount += 1;
      empMap[key].revenue += o.grandTotal;
    }
  });
  const topEmployees = Object.values(empMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Top 5 Products
  const prodMap = {};
  db.orders.forEach(o => {
    if (o.status !== 'CANCELLED' && o.items) {
      o.items.forEach(it => {
        if (!prodMap[it.productName]) prodMap[it.productName] = { productName: it.productName, quantity: 0, revenue: 0 };
        prodMap[it.productName].quantity += it.quantity;
        prodMap[it.productName].revenue += it.subtotal;
      });
    }
  });
  const topProducts = Object.values(prodMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  res.json({
    totalOrders,
    totalRevenue,
    pendingOrders,
    shippedOrders,
    doneOrders,
    cancelledOrders,
    topEmployees,
    topProducts,
    recentOrders: [...db.orders].reverse().slice(0, 10)
  });
});

module.exports = app;
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
}
