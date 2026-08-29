# 📦 APEX B2B Retail Order & Admin Management System (Java Spring Boot)

A production-ready, full-stack B2B field sales and order fulfillment platform developed in **Java 17/21+ (Spring Boot 3, Spring Data JPA, H2 Database, Maven)** with a responsive, mobile-first Web frontend.

---

## 🌟 Two Core Endpoints & Capabilities

### 1. 📱 Endpoint 1: Field Sales Mobile App (`/` -> Field App View)
Designed for **20 field sales employees** visiting smaller retail/kirana stores:
- **Employee Login**: 20 pre-seeded field reps (`EMP001` - `EMP020`, default PIN `1234`).
- **Retail Shop Selection & Onboarding**:
  - Filter and select retail shop from the assigned route.
  - **"+ New Shop"** instant registration modal to register new shops on the go (Shop Name, Owner Name, Contact Phone, Address, Market Territory, GSTIN).
- **Pre-defined Product Catalog**:
  - Filter products by categories: *Snacks & Biscuits*, *Beverages & Drinks*, *Staples & Cooking*, *Dairy & Breakfast*, *Personal Care & Hygiene*, *Household & Cleaning*.
  - Live stock indicators, wholesale packaging units (e.g. *Carton of 48*, *Case of 24*, *Box of 30*), and unit rates.
  - Fast `+` / `-` quantity stepper.
- **Cart & Order Placement**:
  - Floating sticky bottom cart counter and subtotal.
  - Slide-over drawer with itemized summary, payment terms selection (*Cash on Delivery*, *7 Days Credit*, *UPI / Instant Pay*), delivery instructions, tax calculation (5% GST), and instant order placement.
  - Order confirmation screen with instant Order ID generation.
- **My Placed Orders**:
  - Employee order history tracking live status (`PENDING`, `SHIPPED`, `DONE`).

---

### 2. 🖥️ Endpoint 2: Admin Operations & Fulfillment Portal (`/` -> Admin Portal View)
Designed for central warehouse operations & administrative managers:
- **Real-Time Fulfillment Pipeline**:
  - Filter orders by status: `All`, `⏳ Pending`, `🚚 Shipped`, `✅ Done / Delivered`.
  - Search orders by Order Number, Shop Name, or Field Agent.
  - **🚚 Mark Shipped**: One-click dispatch action with timestamp recording.
  - **✅ Mark Done / Delivered**: Completes delivery cycle.
- **🖨️ Bill & Invoice Printing**:
  - Built-in invoice generator supporting both:
    1. **Standard A4 Professional Tax Invoice** (Corporate header, GSTIN, Bill To, itemized table, SGST/CGST breakdown, signature block).
    2. **80mm Thermal POS Receipt Slip** (Compact thermal receipt format with store details, items, tax, and thank-you note).
  - Triggers browser `window.print()` / PDF export via print CSS rules.
- **📊 Analytics & Leaderboards**:
  - Real-time KPIs: Total Revenue, Total Orders, Pending Dispatch, Shipped, Delivered.
  - **Top 5 Field Reps Leaderboard** (ranked by revenue and order count among the 20 reps).
  - **Top Selling Products** ranking.
- **📦 Master Data Management**:
  - Product Catalog Master (view SKUs, wholesale prices, packaging units, stock levels).
  - Registered Retail Shops Directory.
  - 20 Field Sales Reps Directory with assigned market territories.

---

## 🚀 Quick Start Guide

### Prerequisites
- Java JDK 17 or higher
- Maven 3.8+

### Run with One Command:
```bash
./start.sh
```

Or manually:
```bash
mvn spring-boot:run
```

### Access URLs:
- **Web Application**: [http://localhost:8080](http://localhost:8080)
- **Embedded H2 Database Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
  - JDBC URL: `jdbc:h2:file:./data/retaildb`
  - User: `sa`
  - Password: *(blank)*

---

## 🔑 Pre-seeded Accounts & Credentials

| Role | Username / Code | Password | Purpose |
|---|---|---|---|
| **Admin** | `admin` / `ADM001` | `admin123` | Central fulfillment, status changes, bill printing, master data |
| **Field Rep 1** | `emp001` / `EMP001` | `1234` | Rahul Sharma (Central Market & Connaught Hub) |
| **Field Rep 2** | `emp002` / `EMP002` | `1234` | Priya Patel (North City & Civil Lines) |
| **Field Reps 3–20** | `emp003`..`emp020` / `EMP003`..`EMP020` | `1234` | Field representatives across all city territories |

*(Note: The top-right dropdown includes a **Quick Demo Switcher** to switch between any agent or admin in 1 click!)*

---

## 🏗️ Project Architecture

```
retail-order-system/
├── pom.xml                                      # Maven configuration
├── start.sh                                     # Startup runner
├── src/
│   ├── main/
│   │   ├── java/com/retail/order/
│   │   │   ├── RetailOrderApplication.java      # Main Spring Boot Application
│   │   │   ├── config/DataInitializer.java      # Seeds 20 employees, 16 shops, 30 products, sample orders
│   │   │   ├── controller/                      # REST Controllers (Auth, Orders, Products, Shops, Analytics)
│   │   │   ├── dto/                             # Request/Response Data Transfer Objects
│   │   │   ├── model/                           # JPA Entities (Order, OrderItem, Shop, Product, User, OrderStatus)
│   │   │   ├── repository/                      # Spring Data JPA Repositories
│   │   │   └── service/                         # Business logic services
│   │   └── resources/
│   │       ├── application.properties           # Server & H2 Database properties
│   │       └── static/
│   │           ├── index.html                   # Responsive Web Application UI
│   │           ├── app.js                       # Frontend Controller
│   │           └── styles.css                   # Tailwind + Custom + Print CSS
│   └── test/
│       └── java/com/retail/order/RetailOrderApplicationTests.java  # Automated Integration Tests
```
