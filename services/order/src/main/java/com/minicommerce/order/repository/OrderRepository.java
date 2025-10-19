package com.minicommerce.order.repository;

import com.minicommerce.order.model.Order;
import com.minicommerce.order.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    
    /**
     * Find orders by user ID ordered by creation date (newest first)
     */
    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    /**
     * Count orders by status
     */
    long countByStatus(OrderStatus status);
    
    /**
     * Find orders by status
     */
    List<Order> findByStatus(OrderStatus status);
    
    /**
     * Find orders by user ID and status
     */
    List<Order> findByUserIdAndStatus(UUID userId, OrderStatus status);
    
    /**
     * Get total revenue from completed orders
     */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = :status")
    Double getTotalRevenueByStatus(@Param("status") OrderStatus status);
    
    /**
     * Get order count by user ID
     */
    long countByUserId(UUID userId);
    
    /**
     * Find recent orders (last N days)
     */
    @Query("SELECT o FROM Order o WHERE o.createdAt >= CURRENT_DATE - :days")
    List<Order> findRecentOrders(@Param("days") int days);
}
