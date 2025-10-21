package com.minicommerce.order.event;

import com.minicommerce.order.model.SagaState;

import java.time.LocalDateTime;
import java.util.UUID;

public class OrderFailedEvent extends OrderEvent {
    private String reason;
    private SagaState sagaState;
    
    public OrderFailedEvent() {
        super();
        this.eventType = "OrderFailed";
    }
    
    public OrderFailedEvent(UUID orderId, UUID userId, String reason, SagaState sagaState) {
        super(orderId, userId);
        this.eventType = "OrderFailed";
        this.reason = reason;
        this.sagaState = sagaState;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public SagaState getSagaState() {
        return sagaState;
    }
    
    public void setSagaState(SagaState sagaState) {
        this.sagaState = sagaState;
    }
}

