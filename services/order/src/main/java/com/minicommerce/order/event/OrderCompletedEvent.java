package com.minicommerce.order.event;

import com.minicommerce.order.model.OrderStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public class OrderCompletedEvent extends OrderEvent {
    private OrderStatus status;
    
    public OrderCompletedEvent() {
        super();
        this.eventType = "OrderCompleted";
    }
    
    public OrderCompletedEvent(UUID orderId, UUID userId, OrderStatus status) {
        super(orderId, userId);
        this.eventType = "OrderCompleted";
        this.status = status;
    }
    
    public OrderStatus getStatus() {
        return status;
    }
    
    public void setStatus(OrderStatus status) {
        this.status = status;
    }
}

