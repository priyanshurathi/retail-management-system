package com.retail.order.config;

import com.retail.order.model.*;
import com.retail.order.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public DataInitializer(UserRepository userRepository,
                           ShopRepository shopRepository,
                           ProductRepository productRepository,
                           OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            // Update admin password to 1234 if already initialized
            userRepository.findByUsername("admin").ifPresent(admin -> {
                admin.setPassword("1234");
                userRepository.save(admin);
            });
            return;
        }

        // 1. Seed Admin with PIN 1234
        User admin = new User("admin", "1234", "Operations Admin", UserRole.ADMIN, "ADM001", "+91 99000 00000", "Headquarters");
        userRepository.save(admin);

        // 2. Seed 20 Field Employees
        String[][] employeeData = {
                {"emp001", "Rahul Sharma", "EMP001", "+91 98111 00001", "Central Market & Connaught Hub"},
                {"emp002", "Priya Patel", "EMP002", "+91 98111 00002", "North City & Civil Lines"},
                {"emp003", "Amit Kumar", "EMP003", "+91 98111 00003", "West End Retail Corridor"},
                {"emp004", "Sneha Gupta", "EMP004", "+91 98111 00004", "South Plaza & Commercial Sector"},
                {"emp005", "Vikram Singh", "EMP005", "+91 98111 00005", "East Industrial District"},
                {"emp006", "Ananya Roy", "EMP006", "+91 98111 00006", "Old Town Traditional Bazaar"},
                {"emp007", "Rajesh Verma", "EMP007", "+91 98111 00007", "Metro Line Station Shops"},
                {"emp008", "Pooja Joshi", "EMP008", "+91 98111 00008", "Tech Park & Cyber Hub"},
                {"emp009", "Deepak Nair", "EMP009", "+91 98111 00009", "Coastal Zone & Port Market"},
                {"emp010", "Kavita Reddy", "EMP010", "+91 98111 00010", "Green Park Residential Sector"},
                {"emp011", "Suresh Menon", "EMP011", "+91 98111 00011", "Hill View & Valley Shops"},
                {"emp012", "Neha Choudhary", "EMP012", "+91 98111 00012", "Riverside Market Link"},
                {"emp013", "Manoj Tiwari", "EMP013", "+91 98111 00013", "Commercial Complex Block A"},
                {"emp014", "Sunita Das", "EMP014", "+91 98111 00014", "West Gate Junction"},
                {"emp015", "Rohit Saxena", "EMP015", "+91 98111 00015", "Highway Logistics Corridor"},
                {"emp016", "Meera Iyer", "EMP016", "+91 98111 00016", "Lakeview Promenade Market"},
                {"emp017", "Sanjay Mishra", "EMP017", "+91 98111 00017", "City Center Ring Road"},
                {"emp018", "Divya Kapoor", "EMP018", "+91 98111 00018", "North Gate Suburbs"},
                {"emp019", "Alok Singhal", "EMP019", "+91 98111 00019", "South Extension & Arcade"},
                {"emp020", "Ritu Deshmukh", "EMP020", "+91 98111 00020", "University Town & Hostel Zone"}
        };

        List<User> savedEmployees = new ArrayList<>();
        for (String[] row : employeeData) {
            User emp = new User(row[0], "1234", row[1], UserRole.EMPLOYEE, row[2], row[3], row[4]);
            savedEmployees.add(userRepository.save(emp));
        }

        // 3. Seed 16 Retail Shops
        String[][] shopData = {
                {"Gupta Kirana & Provisions", "Ramesh Gupta", "+91 98200 11223", "Shop 14, Main Market, Connaught Hub", "Central Market & Connaught Hub", "guptakirana@gmail.com", "07AAAAA0000A1Z5"},
                {"Sharma Daily Needs", "Sunil Sharma", "+91 98200 22334", "Plot 88, Sector 12, Civil Lines", "North City & Civil Lines", "sharmadaily@gmail.com", "07BBBBB1111B1Z6"},
                {"Mahalaxmi Supermart", "Kishore Patel", "+91 98200 33445", "B-12, Western High Road", "West End Retail Corridor", "mahalaxmi.retail@gmail.com", "07CCCCC2222C1Z7"},
                {"City Corner Grocery", "Anil Agarwal", "+91 98200 44556", "Ground Floor, South Plaza Arcade", "South Plaza & Commercial Sector", "citycorner@yahoo.com", "07DDDDD3333D1Z8"},
                {"Shree Ganesh Provision Store", "Mahesh Shinde", "+91 98200 55667", "Shop 5, Chandni Bazaar Road", "Old Town Traditional Bazaar", "ganeshprovisions@gmail.com", "07EEEEE4444E1Z9"},
                {"Apki Apni Dukan", "Vijay Sethi", "+91 98200 66778", "Tower 3 Arcade, Cyber Gateway", "Tech Park & Cyber Hub", "apkidukan@outlook.com", "07FFFFF5555F1Z0"},
                {"Sunrise Minimart", "Pradeep Rao", "+91 98200 77889", "Block C, Green Park Main Market", "Green Park Residential Sector", "sunriseminimart@gmail.com", "07GGGGG6666G1Z1"},
                {"Evergreen Grocers", "Harish Mehta", "+91 98200 88990", "Metro Station Gate 2 Complex", "Metro Line Station Shops", "evergreengrocers@gmail.com", "07HHHHH7777H1Z2"},
                {"Balaji Traders", "Narayan Swamy", "+91 98200 99001", "Harbor View Road, Dockyard Colony", "Coastal Zone & Port Market", "balajitraders@rediffmail.com", "07IIIII8888I1Z3"},
                {"Royal Provision Mart", "Sanjay Chopra", "+91 98201 00112", "Shop 21, Commercial Hub Complex", "Commercial Complex Block A", "royalprovisions@gmail.com", "07JJJJJ9999J1Z4"},
                {"New India Superstore", "Bhavesh Shah", "+91 98201 11223", "West Gate Circle, Ring Road", "West Gate Junction", "newindiastore@gmail.com", "07KKKKK0000K1Z5"},
                {"Krishna Retailers", "Gopal Joshi", "+91 98201 22334", "National Highway Toll Plaza Complex", "Highway Logistics Corridor", "krishnaretail@gmail.com", "07LLLLL1111L1Z6"},
                {"Metro Supermart", "Arvind Jain", "+91 98201 33445", "Lake Promenade Commercial Wing", "Lakeview Promenade Market", "metrosupermart@gmail.com", "07MMMMM2222M1Z7"},
                {"Quick Mart Express", "Tarun Goyal", "+91 98201 44556", "Central Ring Road Flyover Junction", "City Center Ring Road", "quickmartexpress@gmail.com", "07NNNNN3333N1Z8"},
                {"Heritage Grocery & Spices", "Mohan Lal", "+91 98201 55667", "North Gate Junction, Old Fort Road", "North Gate Suburbs", "heritagegrocers@gmail.com", "07OOOOO4444O1Z9"},
                {"Saraswati General Store", "Santosh Pandey", "+91 98201 66778", "University South Gate, College Road", "University Town & Hostel Zone", "saraswatistore@gmail.com", "07PPPPP5555P1Z0"}
        };

        List<Shop> savedShops = new ArrayList<>();
        for (String[] row : shopData) {
            Shop shop = new Shop(row[0], row[1], row[2], row[3], row[4], row[5], row[6]);
            savedShops.add(shopRepository.save(shop));
        }

        // 4. Seed 30 Products
        Object[][] productData = {
                // Snacks & Biscuits
                {"SNK-001", "Parle-G Gold Glucose Biscuit", "Snacks & Biscuits", "Box of 24 Packs", new BigDecimal("240.00"), 150, 2, "🍪", "Classic energy biscuits in wholesale master pack"},
                {"SNK-002", "Britannia Good Day Butter Cookies", "Snacks & Biscuits", "Box of 30 Packs", new BigDecimal("450.00"), 120, 2, "🍪", "Rich butter crunchy cookies wholesale carton"},
                {"SNK-003", "Lay's Magic Masala Potato Chips", "Snacks & Biscuits", "Carton of 48 Packs", new BigDecimal("720.00"), 90, 1, "🥔", "Spicy Indian magic masala potato chips 30g pack"},
                {"SNK-004", "Kurkure Masala Munch", "Snacks & Biscuits", "Carton of 48 Packs", new BigDecimal("720.00"), 110, 1, "🌽", "Crispy spiced corn puffs popular snack pack"},
                {"SNK-005", "Cadbury Oreo Vanilla Creme", "Snacks & Biscuits", "Box of 24 Packs", new BigDecimal("480.00"), 85, 2, "🍫", "Chocolate sandwich biscuit with smooth vanilla creme"},
                {"SNK-006", "Haldiram's Nagpur Aloo Bhujia 400g", "Snacks & Biscuits", "Case of 12 Packs", new BigDecimal("960.00"), 75, 1, "🥨", "Traditional savoury spicy potato & gram flour crisps"},

                // Beverages & Drinks
                {"BEV-001", "Coca-Cola Original 250ml Can", "Beverages & Drinks", "Case of 24 Cans", new BigDecimal("840.00"), 140, 2, "🥤", "Sparkling refreshing cola drink chilled cans"},
                {"BEV-002", "Frooti Fresh Mango Drink 200ml", "Beverages & Drinks", "Tetra Pack of 30", new BigDecimal("540.00"), 160, 2, "🧃", "Juicy mango drink tetra pack popular with retailers"},
                {"BEV-003", "Red Bull Energy Drink 250ml", "Beverages & Drinks", "Pack of 24 Cans", new BigDecimal("2400.00"), 50, 1, "⚡", "Premium energy drink wholesale crate"},
                {"BEV-004", "Tata Tea Premium Leaf 500g", "Beverages & Drinks", "Carton of 12 Packs", new BigDecimal("2160.00"), 65, 1, "🍵", "Desh ki Chai blended premium black tea leaves"},
                {"BEV-005", "Nescafe Classic Instant Coffee 50g", "Beverages & Drinks", "Jar Pack of 12", new BigDecimal("1680.00"), 80, 1, "☕", "Rich aroma pure soluble coffee glass jars"},
                {"BEV-006", "Bisleri Packaged Drinking Water 1L", "Beverages & Drinks", "Crate of 12 Bottles", new BigDecimal("180.00"), 200, 3, "💧", "Mineral purified water wholesale crate"},

                // Staples & Cooking
                {"STP-001", "Fortune Sunlite Refined Oil 1L", "Staples & Cooking", "Carton of 12 Pouches", new BigDecimal("1560.00"), 100, 1, "🛢️", "Refined sunflower cooking oil pouch carton"},
                {"STP-002", "India Gate Basmati Rice Feast 5kg", "Staples & Cooking", "Bag of 4 Units", new BigDecimal("1800.00"), 70, 1, "🍚", "Long grain fragrant premium basmati rice"},
                {"STP-003", "Aashirvaad Shudh Chakki Atta 10kg", "Staples & Cooking", "Bag of 2 Units", new BigDecimal("780.00"), 90, 1, "🌾", "100% whole wheat whole flour sacks"},
                {"STP-004", "Tata Salt Vacuum Evaporated 1kg", "Staples & Cooking", "Sack of 25 Packs", new BigDecimal("550.00"), 120, 2, "🧂", "Iodized refined cooking salt master sack"},
                {"STP-005", "MDH Deggi Mirch Powder 100g", "Staples & Cooking", "Pack of 10 Boxes", new BigDecimal("650.00"), 95, 1, "🌶️", "Rich red color mild spicy chilli blend"},
                {"STP-006", "Catch Super Garam Masala 100g", "Staples & Cooking", "Pack of 10 Boxes", new BigDecimal("750.00"), 80, 1, "🌿", "Authentic roasted spice mix for savory curries"},

                // Dairy & Breakfast
                {"DAR-001", "Amul Butter Pasteurised 500g", "Dairy & Breakfast", "Box of 20 Packs", new BigDecimal("4900.00"), 45, 1, "🧈", "Pure dairy cream butter wholesale refrigerated pack"},
                {"DAR-002", "Kellogg's Corn Flakes Original 475g", "Dairy & Breakfast", "Case of 12 Packs", new BigDecimal("2040.00"), 60, 1, "🥣", "Crispy toasted whole grain breakfast cereal"},
                {"DAR-003", "Quaker Whole Rolled Oats 1kg", "Dairy & Breakfast", "Pack of 8 Pouches", new BigDecimal("1440.00"), 55, 1, "🥣", "100% natural wholegrain dietary fiber oats"},
                {"DAR-004", "Kissan Fresh Tomato Ketchup 1kg", "Dairy & Breakfast", "Case of 12 Bottles", new BigDecimal("1440.00"), 70, 1, "🍅", "Sweet tangy tomato ketchup squeezy bottles"},
                {"DAR-005", "Nutella Hazelnut Cocoa Spread 350g", "Dairy & Breakfast", "Case of 6 Jars", new BigDecimal("1920.00"), 40, 1, "🍫", "Creamy chocolate hazelnut breakfast spread"},

                // Personal Care & Hygiene
                {"PER-001", "Dettol Original Bath Soap 125g", "Personal Care & Hygiene", "Bundle of 16 Bars", new BigDecimal("720.00"), 110, 2, "🧼", "Antibacterial trusted germ protection soap"},
                {"PER-002", "Colgate Strong Teeth Toothpaste 150g", "Personal Care & Hygiene", "Carton of 24 Tubes", new BigDecimal("1680.00"), 95, 1, "🪥", "Calcium boosted cavity protection toothpaste"},
                {"PER-003", "Head & Shoulders Shampoo 180ml", "Personal Care & Hygiene", "Pack of 12 Bottles", new BigDecimal("1920.00"), 60, 1, "🧴", "Smooth & silky anti-dandruff daily shampoo"},
                {"PER-004", "Lifebuoy Total Handwash Refill 750ml", "Personal Care & Hygiene", "Box of 8 Pouches", new BigDecimal("880.00"), 85, 1, "🧴", "Fast acting antibacterial handwash liquid"},
                {"PER-005", "Nivea Soft Light Moisturizer 200ml", "Personal Care & Hygiene", "Pack of 6 Jars", new BigDecimal("1500.00"), 50, 1, "✨", "Non-greasy nourishing skin cream with Vitamin E"},

                // Household & Cleaning
                {"HOU-001", "Surf Excel Easy Wash Detergent 1kg", "Household & Cleaning", "Bag of 10 Packs", new BigDecimal("1350.00"), 90, 1, "🧺", "Advanced stain removal washing powder"},
                {"HOU-002", "Vim Lemon Dishwash Liquid 500ml", "Household & Cleaning", "Pack of 12 Bottles", new BigDecimal("1080.00"), 105, 1, "🍋", "Concentrated grease removal lemon dish gel"},
                {"HOU-003", "Harpic Power Plus Toilet Cleaner 1L", "Household & Cleaning", "Case of 12 Bottles", new BigDecimal("1920.00"), 80, 1, "🚽", "Triple action disinfectant toilet cleaner"},
                {"HOU-004", "Godrej aer Pocket Bathroom Fragrance", "Household & Cleaning", "Pack of 12 Units", new BigDecimal("660.00"), 130, 2, "🌸", "Long lasting fresh bathroom fragrance gel pockets"}
        };

        List<Product> savedProducts = new ArrayList<>();
        for (Object[] row : productData) {
            Product p = new Product(
                    (String) row[0],
                    (String) row[1],
                    (String) row[2],
                    (String) row[3],
                    (BigDecimal) row[4],
                    (Integer) row[5],
                    (Integer) row[6],
                    (String) row[7],
                    (String) row[8]
            );
            savedProducts.add(productRepository.save(p));
        }

        // 5. Seed Initial Sample Orders (Pending, Shipped, Done)
        createSampleOrder("ORD-20260829-0101", savedShops.get(0), savedEmployees.get(0), OrderStatus.DONE, "Cash on Delivery", "Delivered on morning route", List.of(
                new Object[]{savedProducts.get(0), 3},
                new Object[]{savedProducts.get(2), 2},
                new Object[]{savedProducts.get(6), 4}
        ), LocalDateTime.now().minusHours(28), LocalDateTime.now().minusHours(24), LocalDateTime.now().minusHours(20));

        createSampleOrder("ORD-20260829-0102", savedShops.get(1), savedEmployees.get(1), OrderStatus.DONE, "7 Days Credit", "Shop credit verified", List.of(
                new Object[]{savedProducts.get(12), 2},
                new Object[]{savedProducts.get(13), 2},
                new Object[]{savedProducts.get(14), 3}
        ), LocalDateTime.now().minusHours(20), LocalDateTime.now().minusHours(16), LocalDateTime.now().minusHours(12));

        createSampleOrder("ORD-20260829-0103", savedShops.get(2), savedEmployees.get(2), OrderStatus.SHIPPED, "UPI / Instant", "Dispatch van #4 out for delivery", List.of(
                new Object[]{savedProducts.get(1), 4},
                new Object[]{savedProducts.get(7), 3},
                new Object[]{savedProducts.get(23), 2}
        ), LocalDateTime.now().minusHours(10), LocalDateTime.now().minusHours(3), null);

        createSampleOrder("ORD-20260829-0104", savedShops.get(3), savedEmployees.get(3), OrderStatus.SHIPPED, "Cash on Delivery", "Keep change ready at shop", List.of(
                new Object[]{savedProducts.get(18), 2},
                new Object[]{savedProducts.get(28), 3},
                new Object[]{savedProducts.get(29), 2}
        ), LocalDateTime.now().minusHours(6), LocalDateTime.now().minusHours(2), null);

        createSampleOrder("ORD-20260829-0105", savedShops.get(4), savedEmployees.get(4), OrderStatus.PENDING, "Cash on Delivery", "Urgent stock requirement for festival", List.of(
                new Object[]{savedProducts.get(4), 5},
                new Object[]{savedProducts.get(8), 2},
                new Object[]{savedProducts.get(10), 3}
        ), LocalDateTime.now().minusHours(2), null, null);

        createSampleOrder("ORD-20260829-0106", savedShops.get(5), savedEmployees.get(0), OrderStatus.PENDING, "7 Days Credit", "Regular weekly order", List.of(
                new Object[]{savedProducts.get(3), 4},
                new Object[]{savedProducts.get(9), 2},
                new Object[]{savedProducts.get(15), 5}
        ), LocalDateTime.now().minusMinutes(45), null, null);
    }

    private void createSampleOrder(String orderNumber, Shop shop, User employee, OrderStatus status,
                                   String paymentMethod, String notes, List<Object[]> items,
                                   LocalDateTime created, LocalDateTime shipped, LocalDateTime completed) {
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (Object[] item : items) {
            Product prod = (Product) item[0];
            int qty = (Integer) item[1];
            BigDecimal itemTotal = prod.getPrice().multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(itemTotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(prod);
            orderItem.setProductName(prod.getName());
            orderItem.setUnitPrice(prod.getPrice());
            orderItem.setQuantity(qty);
            orderItem.setSubtotal(itemTotal);
            orderItems.add(orderItem);
        }

        BigDecimal taxAmount = subtotal.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setShop(shop);
        order.setEmployee(employee);
        order.setStatus(status);
        order.setPaymentMethod(paymentMethod);
        order.setNotes(notes);
        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setTaxAmount(taxAmount);
        order.setGrandTotal(grandTotal);
        order.setCreatedAt(created);
        order.setUpdatedAt(created);
        order.setShippedAt(shipped);
        order.setCompletedAt(completed);

        for (OrderItem oi : orderItems) {
            order.addItem(oi);
        }

        orderRepository.save(order);
    }
}
