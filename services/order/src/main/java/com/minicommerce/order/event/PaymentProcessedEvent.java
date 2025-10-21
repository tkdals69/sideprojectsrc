package com.minicommerce.order.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class PaymentProcessedEvent extends OrderEvent {
    private UUID paymentId;
    private BigDecimal amount;
    private String paymentMethod;
    
    public PaymentProcessedEvent() {
        super();
        this.eventType = "PaymentProcessed";
    }
    
    public PaymentProcessedEvent(UUID orderId, UUID userId, UUID paymentId, BigDecimal amount, String paymentMethod) {
        super(orderId, userId);
        this.eventType = "PaymentProcessed";
        this.paymentId = paymentId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }
    
    public UUID getPaymentId() {
        return paymentId;
    }
    
    public void setPaymentId(UUID paymentId) {
        this.paymentId = paymentId;
    }
    
    public BigDecimal getAmount() {
        return amount;
    }
    
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
    
    public String getPaymentMethod() {
        return paymentMethod;
    }
    
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}

