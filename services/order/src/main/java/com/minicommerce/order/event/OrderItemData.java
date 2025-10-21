package com.minicommerce.order.event;

import java.math.BigDecimal;
import java.util.UUID;

public class OrderItemData {
    private UUID productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    
    // Constructors, getters, setters
    public OrderItemData() {}
    
    public OrderItemData(UUID productId, String productName, Integer quantity, BigDecimal unitPrice, BigDecimal totalPrice) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
    }
    
    // Getters and Setters
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    
    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
}

