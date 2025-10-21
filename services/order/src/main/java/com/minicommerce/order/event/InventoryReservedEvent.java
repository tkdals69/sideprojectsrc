package com.minicommerce.order.event;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class InventoryReservedEvent extends OrderEvent {
    private UUID reservationId;
    private List<ReservationData> reservations;
    
    public InventoryReservedEvent() {
        super();
        this.eventType = "InventoryReserved";
    }
    
    public InventoryReservedEvent(UUID orderId, UUID userId, UUID reservationId, List<ReservationData> reservations) {
        super(orderId, userId);
        this.eventType = "InventoryReserved";
        this.reservationId = reservationId;
        this.reservations = reservations;
    }
    
    public UUID getReservationId() {
        return reservationId;
    }
    
    public void setReservationId(UUID reservationId) {
        this.reservationId = reservationId;
    }
    
    public List<ReservationData> getReservations() {
        return reservations;
    }
    
    public void setReservations(List<ReservationData> reservations) {
        this.reservations = reservations;
    }
}

