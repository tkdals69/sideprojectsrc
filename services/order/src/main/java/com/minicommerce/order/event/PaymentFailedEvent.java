package com.minicommerce.order.event;

import java.time.LocalDateTime;
import java.util.UUID;

public class PaymentFailedEvent extends OrderEvent {
    private String reason;
    
    public PaymentFailedEvent() {
        super();
        this.eventType = "PaymentFailed";
    }
    
    public PaymentFailedEvent(UUID orderId, UUID userId, String reason) {
        super(orderId, userId);
        this.eventType = "PaymentFailed";
        this.reason = reason;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
}

