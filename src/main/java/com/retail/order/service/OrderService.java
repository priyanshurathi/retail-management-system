package com.retail.order.service;

import com.retail.order.dto.OrderCreateRequest;
import com.retail.order.dto.OrderItemRequest;
import com.retail.order.dto.OrderStatusUpdateRequest;
import com.retail.order.model.*;
import com.retail.order.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        ShopRepository shopRepository,
                        UserRepository userRepository,
                        ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public List<Order> getAllOrders(OrderStatus status, Long employeeId, Long shopId) {
        if (status != null) {
            return orderRepository.findByStatusOrderByCreatedAtDesc(status);
        }
        if (employeeId != null) {
            return orderRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        }
        if (shopId != null) {
            return orderRepository.findByShopIdOrderByCreatedAtDesc(shopId);
        }
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Optional<Order> getOrderByNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber);
    }

    @Transactional
    public Order createOrder(OrderCreateRequest request) {
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new IllegalArgumentException("Shop not found with ID: " + request.getShopId()));

        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + request.getEmployeeId()));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }

        // Generate unique order number, e.g. ORD-20260829-1048
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        int randomSuffix = new Random().nextInt(900) + 100;
        String orderNumber = "ORD-" + timestamp + "-" + randomSuffix;

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> itemsToSave = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                continue;
            }
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + itemReq.getProductId()));

            BigDecimal itemSubtotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemSubtotal);

            // Deduct stock if available
            int newStock = Math.max(0, product.getStockQuantity() - itemReq.getQuantity());
            product.setStockQuantity(newStock);
            productRepository.save(product);

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setUnitPrice(product.getPrice());
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setSubtotal(itemSubtotal);
            itemsToSave.add(orderItem);
        }

        // Tax calculation (5% standard GST / B2B distribution tax)
        BigDecimal taxRate = new BigDecimal("0.05");
        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setShop(shop);
        order.setEmployee(employee);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "Cash on Delivery");
        order.setNotes(request.getNotes());
        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setTaxAmount(taxAmount);
        order.setGrandTotal(grandTotal);

        for (OrderItem item : itemsToSave) {
            order.addItem(item);
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        OrderStatus newStatus = request.getStatus();
        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());

        if (newStatus == OrderStatus.SHIPPED && order.getShippedAt() == null) {
            order.setShippedAt(LocalDateTime.now());
        } else if (newStatus == OrderStatus.DONE) {
            if (order.getShippedAt() == null) {
                order.setShippedAt(LocalDateTime.now());
            }
            order.setCompletedAt(LocalDateTime.now());
        }

        return orderRepository.save(order);
    }

    public Map<String, Object> getInvoiceData(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        Map<String, Object> invoice = new HashMap<>();
        invoice.put("order", order);
        invoice.put("companyName", "Apex Retail Distributors Ltd.");
        invoice.put("companyAddress", "Plot 42, Metro Logistics Hub, Sector 18, Commercial Zone");
        invoice.put("companyPhone", "+91 98765 43210 / +91 11 2345 6789");
        invoice.put("companyEmail", "orders@apexretaildist.com");
        invoice.put("companyGst", "27AABCA1234F1Z8");
        invoice.put("invoiceNumber", "INV-" + order.getOrderNumber().replace("ORD-", ""));
        invoice.put("invoiceDate", order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")));
        invoice.put("printedAt", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")));

        return invoice;
    }
}
