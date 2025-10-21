package com.minicommerce.order.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class OrderCreatedEvent extends OrderEvent {
    private BigDecimal totalAmount;
    private List<OrderItemData> items;
    
    public OrderCreatedEvent() {
        super();
        this.eventType = "OrderCreated";
    }
    
    public OrderCreatedEvent(UUID orderId, UUID userId, BigDecimal totalAmount, List<OrderItemData> items) {
        super(orderId, userId);
        this.eventType = "OrderCreated";
        this.totalAmount = totalAmount;
        this.items = items;
    }
    
    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public List<OrderItemData> getItems() {
        return items;
    }
    
    public void setItems(List<OrderItemData> items) {
        this.items = items;
    }
}

