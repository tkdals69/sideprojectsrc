package com.minicommerce.order.event;

import java.time.LocalDateTime;
import java.util.UUID;

public class InventoryReservationFailedEvent extends OrderEvent {
    private String reason;
    
    public InventoryReservationFailedEvent() {
        super();
        this.eventType = "InventoryReservationFailed";
    }
    
    public InventoryReservationFailedEvent(UUID orderId, UUID userId, String reason) {
        super(orderId, userId);
        this.eventType = "InventoryReservationFailed";
        this.reason = reason;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
}

