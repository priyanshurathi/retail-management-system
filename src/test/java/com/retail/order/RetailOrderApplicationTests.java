package com.retail.order;

import com.retail.order.dto.LoginRequest;
import com.retail.order.dto.LoginResponse;
import com.retail.order.dto.OrderCreateRequest;
import com.retail.order.dto.OrderItemRequest;
import com.retail.order.dto.OrderStatusUpdateRequest;
import com.retail.order.dto.ShopCreateRequest;
import com.retail.order.model.*;
import com.retail.order.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RetailOrderApplicationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private ShopService shopService;

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private AnalyticsService analyticsService;

    @Test
    void testContextLoadsAndSeeding() {
        // Test Auth
        LoginResponse adminLogin = authService.login(new LoginRequest("admin", "1234"));
        assertTrue(adminLogin.isSuccess());
        assertEquals(UserRole.ADMIN, adminLogin.getUser().getRole());

        // Test Field Employee login
        LoginResponse empLogin = authService.login(new LoginRequest("EMP001", "1234"));
        assertTrue(empLogin.isSuccess());
        assertEquals("Rahul Sharma", empLogin.getUser().getFullName());

        // Verify 20 Employees seeded
        List<User> employees = authService.getAllEmployees();
        assertTrue(employees.size() >= 20);

        // Verify Products & Shops
        List<Product> products = productService.getAllProducts();
        assertTrue(products.size() >= 25);

        List<Shop> shops = shopService.getAllShops();
        assertTrue(shops.size() >= 15);

        // Test creating a new shop
        ShopCreateRequest newShopReq = new ShopCreateRequest();
        newShopReq.setName("Om Sai Superstore");
        newShopReq.setOwnerName("Sanjay Verma");
        newShopReq.setPhone("+91 9988776655");
        newShopReq.setAddress("Shop 10, Metro Road");
        newShopReq.setTerritory("Central Market");
        Shop createdShop = shopService.createShop(newShopReq);
        assertNotNull(createdShop.getId());
        assertEquals("Om Sai Superstore", createdShop.getName());

        // Test Field Agent placing an order
        OrderCreateRequest orderReq = new OrderCreateRequest();
        orderReq.setShopId(createdShop.getId());
        orderReq.setEmployeeId(empLogin.getUser().getId());
        orderReq.setPaymentMethod("Cash on Delivery");
        orderReq.setNotes("First test trial order");
        orderReq.setItems(List.of(
                new OrderItemRequest(products.get(0).getId(), 3),
                new OrderItemRequest(products.get(1).getId(), 2)
        ));

        Order placedOrder = orderService.createOrder(orderReq);
        assertNotNull(placedOrder.getId());
        assertNotNull(placedOrder.getOrderNumber());
        assertEquals(OrderStatus.PENDING, placedOrder.getStatus());
        assertTrue(placedOrder.getGrandTotal().doubleValue() > 0);

        // Test Admin marking as Shipped
        Order shippedOrder = orderService.updateOrderStatus(placedOrder.getId(), new OrderStatusUpdateRequest(OrderStatus.SHIPPED));
        assertEquals(OrderStatus.SHIPPED, shippedOrder.getStatus());
        assertNotNull(shippedOrder.getShippedAt());

        // Test Admin marking as Done
        Order doneOrder = orderService.updateOrderStatus(placedOrder.getId(), new OrderStatusUpdateRequest(OrderStatus.DONE));
        assertEquals(OrderStatus.DONE, doneOrder.getStatus());
        assertNotNull(doneOrder.getCompletedAt());

        // Test Invoice generation
        Map<String, Object> invoice = orderService.getInvoiceData(placedOrder.getId());
        assertNotNull(invoice.get("invoiceNumber"));
        assertNotNull(invoice.get("companyGst"));

        // Test Analytics Dashboard
        var dash = analyticsService.getDashboardSummary();
        assertTrue(dash.getTotalOrders() > 0);
        assertTrue(dash.getTotalRevenue().doubleValue() > 0);
        assertFalse(dash.getTopEmployees().isEmpty());
    }
}
