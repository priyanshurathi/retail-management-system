package com.retail.order.repository;

import com.retail.order.model.Order;
import com.retail.order.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findAllByOrderByCreatedAtDesc();
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
    List<Order> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<Order> findByShopIdOrderByCreatedAtDesc(Long shopId);
    Optional<Order> findByOrderNumber(String orderNumber);
    long countByStatus(OrderStatus status);
}
