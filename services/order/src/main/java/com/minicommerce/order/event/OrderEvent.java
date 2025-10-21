package com.minicommerce.order.event;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.minicommerce.order.model.OrderStatus;
import com.minicommerce.order.model.SagaState;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = OrderCreatedEvent.class, name = "OrderCreated"),
    @JsonSubTypes.Type(value = InventoryReservedEvent.class, name = "InventoryReserved"),
    @JsonSubTypes.Type(value = InventoryReservationFailedEvent.class, name = "InventoryReservationFailed"),
    @JsonSubTypes.Type(value = PaymentProcessedEvent.class, name = "PaymentProcessed"),
    @JsonSubTypes.Type(value = PaymentFailedEvent.class, name = "PaymentFailed"),
    @JsonSubTypes.Type(value = OrderCompletedEvent.class, name = "OrderCompleted"),
    @JsonSubTypes.Type(value = OrderFailedEvent.class, name = "OrderFailed"),
    @JsonSubTypes.Type(value = InventoryReleasedEvent.class, name = "InventoryReleased")
})
public abstract class OrderEvent {
    protected UUID orderId;
    protected UUID userId;
    protected LocalDateTime timestamp;
    protected String eventType;
    
    public OrderEvent() {
        this.timestamp = LocalDateTime.now();
    }
    
    public OrderEvent(UUID orderId, UUID userId) {
        this();
        this.orderId = orderId;
        this.userId = userId;
    }
    
    // Getters and Setters
    public UUID getOrderId() {
        return orderId;
    }
    
    public void setOrderId(UUID orderId) {
        this.orderId = orderId;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public void setUserId(UUID userId) {
        this.userId = userId;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getEventType() {
        return eventType;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
}

