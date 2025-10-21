package com.minicommerce.order.dto;

import com.minicommerce.order.model.OrderItem;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class OrderItemDTO {
    private UUID id;
    private UUID productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private LocalDateTime createdAt;

    // Constructors
    public OrderItemDTO() {}

    public OrderItemDTO(OrderItem orderItem) {
        this.id = orderItem.getId();
        this.productId = orderItem.getProductId();
        this.productName = orderItem.getProductName();
        this.quantity = orderItem.getQuantity();
        this.unitPrice = orderItem.getUnitPrice();
        this.totalPrice = orderItem.getTotalPrice();
        this.createdAt = orderItem.getCreatedAt();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
