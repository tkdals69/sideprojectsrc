package com.minicommerce.order.event;

import java.time.LocalDateTime;
import java.util.UUID;

public class InventoryReleasedEvent extends OrderEvent {
    private UUID reservationId;
    
    public InventoryReleasedEvent() {
        super();
        this.eventType = "InventoryReleased";
    }
    
    public InventoryReleasedEvent(UUID orderId, UUID userId, UUID reservationId) {
        super(orderId, userId);
        this.eventType = "InventoryReleased";
        this.reservationId = reservationId;
    }
    
    public UUID getReservationId() {
        return reservationId;
    }
    
    public void setReservationId(UUID reservationId) {
        this.reservationId = reservationId;
    }
}

