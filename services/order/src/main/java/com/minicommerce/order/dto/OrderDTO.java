package com.minicommerce.order.dto;

import com.minicommerce.order.model.Order;
import com.minicommerce.order.model.OrderItem;
import com.minicommerce.order.model.OrderStatus;
import com.minicommerce.order.model.SagaState;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class OrderDTO {
    private UUID id;
    private UUID userId;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private SagaState sagaState;
    private String shippingAddress;
    private String billingAddress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemDTO> items;

    // Constructors
    public OrderDTO() {}

    public OrderDTO(Order order) {
        this.id = order.getId();
        this.userId = order.getUserId();
        this.status = order.getStatus();
        this.totalAmount = order.getTotalAmount();
        this.sagaState = order.getSagaState();
        this.shippingAddress = order.getShippingAddress();
        this.billingAddress = order.getBillingAddress();
        this.createdAt = order.getCreatedAt();
        this.updatedAt = order.getUpdatedAt();
        this.items = order.getItems().stream()
                .map(OrderItemDTO::new)
                .collect(Collectors.toList());
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public SagaState getSagaState() {
        return sagaState;
    }

    public void setSagaState(SagaState sagaState) {
        this.sagaState = sagaState;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getBillingAddress() {
        return billingAddress;
    }

    public void setBillingAddress(String billingAddress) {
        this.billingAddress = billingAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }
}
