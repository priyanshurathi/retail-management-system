package com.retail.order.dto;

import com.retail.order.model.Order;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardSummaryDto {
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long pendingOrders;
    private long shippedOrders;
    private long doneOrders;
    private long cancelledOrders;
    private List<Map<String, Object>> topEmployees;
    private List<Map<String, Object>> topProducts;
    private List<Order> recentOrders;

    public DashboardSummaryDto() {}

    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public long getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }

    public long getShippedOrders() { return shippedOrders; }
    public void setShippedOrders(long shippedOrders) { this.shippedOrders = shippedOrders; }

    public long getDoneOrders() { return doneOrders; }
    public void setDoneOrders(long doneOrders) { this.doneOrders = doneOrders; }

    public long getCancelledOrders() { return cancelledOrders; }
    public void setCancelledOrders(long cancelledOrders) { this.cancelledOrders = cancelledOrders; }

    public List<Map<String, Object>> getTopEmployees() { return topEmployees; }
    public void setTopEmployees(List<Map<String, Object>> topEmployees) { this.topEmployees = topEmployees; }

    public List<Map<String, Object>> getTopProducts() { return topProducts; }
    public void setTopProducts(List<Map<String, Object>> topProducts) { this.topProducts = topProducts; }

    public List<Order> getRecentOrders() { return recentOrders; }
    public void setRecentOrders(List<Order> recentOrders) { this.recentOrders = recentOrders; }
}
