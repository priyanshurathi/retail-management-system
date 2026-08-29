package com.retail.order.service;

import com.retail.order.dto.DashboardSummaryDto;
import com.retail.order.model.Order;
import com.retail.order.model.OrderStatus;
import com.retail.order.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final OrderRepository orderRepository;

    public AnalyticsService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public DashboardSummaryDto getDashboardSummary() {
        List<Order> allOrders = orderRepository.findAllByOrderByCreatedAtDesc();

        DashboardSummaryDto dto = new DashboardSummaryDto();
        dto.setTotalOrders(allOrders.size());

        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getGrandTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalRevenue(totalRevenue);

        long pending = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count();
        long shipped = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.SHIPPED).count();
        long done = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.DONE).count();
        long cancelled = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count();

        dto.setPendingOrders(pending);
        dto.setShippedOrders(shipped);
        dto.setDoneOrders(done);
        dto.setCancelledOrders(cancelled);

        // Top 5 Sales Reps by order count and total revenue
        Map<String, List<Order>> ordersByEmployee = allOrders.stream()
                .filter(o -> o.getEmployee() != null && o.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(o -> o.getEmployee().getEmployeeCode() + " - " + o.getEmployee().getFullName()));

        List<Map<String, Object>> topEmployees = ordersByEmployee.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("employee", entry.getKey());
                    map.put("orderCount", entry.getValue().size());
                    BigDecimal empRevenue = entry.getValue().stream()
                            .map(Order::getGrandTotal)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    map.put("revenue", empRevenue);
                    return map;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue")))
                .limit(5)
                .collect(Collectors.toList());
        dto.setTopEmployees(topEmployees);

        // Top selling products
        Map<String, Integer> productQuantities = new HashMap<>();
        Map<String, BigDecimal> productRevenues = new HashMap<>();

        allOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED && o.getItems() != null)
                .flatMap(o -> o.getItems().stream())
                .forEach(item -> {
                    String name = item.getProductName();
                    productQuantities.put(name, productQuantities.getOrDefault(name, 0) + item.getQuantity());
                    BigDecimal currentRev = productRevenues.getOrDefault(name, BigDecimal.ZERO);
                    productRevenues.put(name, currentRev.add(item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO));
                });

        List<Map<String, Object>> topProducts = productQuantities.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("productName", entry.getKey());
                    map.put("quantity", entry.getValue());
                    map.put("revenue", productRevenues.getOrDefault(entry.getKey(), BigDecimal.ZERO));
                    return map;
                })
                .sorted((a, b) -> ((Integer) b.get("quantity")).compareTo((Integer) a.get("quantity")))
                .limit(5)
                .collect(Collectors.toList());
        dto.setTopProducts(topProducts);

        // Recent 10 orders
        dto.setRecentOrders(allOrders.stream().limit(10).collect(Collectors.toList()));

        return dto;
    }
}
