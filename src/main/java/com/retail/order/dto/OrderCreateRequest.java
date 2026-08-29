package com.retail.order.dto;

import java.util.ArrayList;
import java.util.List;

public class OrderCreateRequest {
    private Long shopId;
    private Long employeeId;
    private String paymentMethod;
    private String notes;
    private List<OrderItemRequest> items = new ArrayList<>();

    public OrderCreateRequest() {}

    public Long getShopId() { return shopId; }
    public void setShopId(Long shopId) { this.shopId = shopId; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}
