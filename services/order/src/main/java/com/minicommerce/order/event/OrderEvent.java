package com.minicommerce.order.event;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.minicommerce.order.model.OrderStatus;
import com.minicommerce.order.model.SagaState;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = OrderCreatedEvent.class, name = "OrderCreated"),
    @JsonSubTypes.Type(value = InventoryReservedEvent.class, name = "InventoryReserved"),
    @JsonSubTypes.Type(value = InventoryReservationFailedEvent.class, name = "InventoryReservationFailed"),
    @JsonSubTypes.Type(value = PaymentProcessedEvent.class, name = "PaymentProcessed"),
    @JsonSubTypes.Type(value = PaymentFailedEvent.class, name = "PaymentFailed"),
    @JsonSubTypes.Type(value = OrderCompletedEvent.class, name = "OrderCompleted"),
    @JsonSubTypes.Type(value = OrderFailedEvent.class, name = "OrderFailed"),
    @JsonSubTypes.Type(value = InventoryReleasedEvent.class, name = "InventoryReleased")
})
public abstract class OrderEvent {
    protected UUID orderId;
    protected UUID userId;
    protected LocalDateTime timestamp;
    protected String eventType;
    
    public OrderEvent() {
        this.timestamp = LocalDateTime.now();
    }
    
    public OrderEvent(UUID orderId, UUID userId) {
        this();
        this.orderId = orderId;
        this.userId = userId;
    }
    
    // Getters and Setters
    public UUID getOrderId() {
        return orderId;
    }
    
    public void setOrderId(UUID orderId) {
        this.orderId = orderId;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public void setUserId(UUID userId) {
        this.userId = userId;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getEventType() {
        return eventType;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
}

// Order Created Event
class OrderCreatedEvent extends OrderEvent {
    private BigDecimal totalAmount;
    private List<OrderItemData> items;
    
    public OrderCreatedEvent() {
        super();
        this.eventType = "OrderCreated";
    }
    
    public OrderCreatedEvent(UUID orderId, UUID userId, BigDecimal totalAmount, List<OrderItemData> items) {
        super(orderId, userId);
        this.eventType = "OrderCreated";
        this.totalAmount = totalAmount;
        this.items = items;
    }
    
    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public List<OrderItemData> getItems() {
        return items;
    }
    
    public void setItems(List<OrderItemData> items) {
        this.items = items;
    }
}

// Inventory Reserved Event
class InventoryReservedEvent extends OrderEvent {
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

// Inventory Reservation Failed Event
class InventoryReservationFailedEvent extends OrderEvent {
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

// Payment Processed Event
class PaymentProcessedEvent extends OrderEvent {
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

// Payment Failed Event
class PaymentFailedEvent extends OrderEvent {
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

// Order Completed Event
class OrderCompletedEvent extends OrderEvent {
    private OrderStatus status;
    
    public OrderCompletedEvent() {
        super();
        this.eventType = "OrderCompleted";
    }
    
    public OrderCompletedEvent(UUID orderId, UUID userId, OrderStatus status) {
        super(orderId, userId);
        this.eventType = "OrderCompleted";
        this.status = status;
    }
    
    public OrderStatus getStatus() {
        return status;
    }
    
    public void setStatus(OrderStatus status) {
        this.status = status;
    }
}

// Order Failed Event
class OrderFailedEvent extends OrderEvent {
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

// Inventory Released Event
class InventoryReleasedEvent extends OrderEvent {
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

// Supporting data classes
class OrderItemData {
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

class ReservationData {
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
