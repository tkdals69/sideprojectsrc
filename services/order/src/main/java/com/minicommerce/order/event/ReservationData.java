package com.minicommerce.order.event;

import java.util.UUID;

public class ReservationData {
    private UUID productId;
    private Integer quantity;
    private String status;
    
    public ReservationData() {}
    
    public ReservationData(UUID productId, Integer quantity, String status) {
        this.productId = productId;
        this.quantity = quantity;
        this.status = status;
    }
    
    // Getters and Setters
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

