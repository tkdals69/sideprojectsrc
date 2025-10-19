package com.minicommerce.order.service;

import com.minicommerce.order.event.*;
import com.minicommerce.order.model.Order;
import com.minicommerce.order.model.OrderStatus;
import com.minicommerce.order.model.SagaState;
import com.minicommerce.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class SagaOrchestrator {
    
    private static final Logger logger = LoggerFactory.getLogger(SagaOrchestrator.class);
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private WebClient.Builder webClientBuilder;
    
    private final WebClient inventoryClient;
    private final WebClient paymentClient;
    private final WebClient notificationClient;
    
    public SagaOrchestrator(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
        this.inventoryClient = webClientBuilder.baseUrl("http://inventory-service:8080").build();
        this.paymentClient = webClientBuilder.baseUrl("http://payment-service:8080").build();
        this.notificationClient = webClientBuilder.baseUrl("http://notification-service:8080").build();
    }
    
    /**
     * Start the order saga process
     */
    public void startOrderSaga(Order order) {
        logger.info("Starting order saga for order: {}", order.getId());
        
        try {
            // Step 1: Reserve inventory
            reserveInventory(order);
        } catch (Exception e) {
            logger.error("Failed to start order saga for order: {}", order.getId(), e);
            handleSagaFailure(order, "Failed to start saga: " + e.getMessage());
        }
    }
    
    /**
     * Handle inventory reserved event
     */
    public void handleInventoryReserved(InventoryReservedEvent event) {
        logger.info("Processing inventory reserved event for order: {}", event.getOrderId());
        
        Order order = orderRepository.findById(event.getOrderId())
            .orElseThrow(() -> new RuntimeException("Order not found: " + event.getOrderId()));
        
        try {
            // Step 2: Process payment
            processPayment(order);
        } catch (Exception e) {
            logger.error("Failed to process payment for order: {}", order.getId(), e);
            handleSagaFailure(order, "Payment processing failed: " + e.getMessage());
        }
    }
    
    /**
     * Handle inventory reservation failed event
     */
    public void handleInventoryReservationFailed(InventoryReservationFailedEvent event) {
        logger.info("Processing inventory reservation failed event for order: {}", event.getOrderId());
        
        Order order = orderRepository.findById(event.getOrderId())
            .orElseThrow(() -> new RuntimeException("Order not found: " + event.getOrderId()));
        
        handleSagaFailure(order, "Inventory reservation failed: " + event.getReason());
    }
    
    /**
     * Handle payment processed event
     */
    public void handlePaymentProcessed(PaymentProcessedEvent event) {
        logger.info("Processing payment processed event for order: {}", event.getOrderId());
        
        Order order = orderRepository.findById(event.getOrderId())
            .orElseThrow(() -> new RuntimeException("Order not found: " + event.getOrderId()));
        
        try {
            // Step 3: Confirm inventory reservation
            confirmInventoryReservation(order);
        } catch (Exception e) {
            logger.error("Failed to confirm inventory reservation for order: {}", order.getId(), e);
            handleSagaFailure(order, "Inventory confirmation failed: " + e.getMessage());
        }
    }
    
    /**
     * Handle payment failed event
     */
    public void handlePaymentFailed(PaymentFailedEvent event) {
        logger.info("Processing payment failed event for order: {}", event.getOrderId());
        
        Order order = orderRepository.findById(event.getOrderId())
            .orElseThrow(() -> new RuntimeException("Order not found: " + event.getOrderId()));
        
        // Compensate: Release inventory reservation
        compensateInventoryReservation(order);
    }
    
    /**
     * Handle order completed event
     */
    public void handleOrderCompleted(OrderCompletedEvent event) {
        logger.info("Processing order completed event for order: {}", event.getOrderId());
        
        Order order = orderRepository.findById(event.getOrderId())
            .orElseThrow(() -> new RuntimeException("Order not found: " + event.getOrderId()));
        
        // Send notification
        sendOrderNotification(order, "Order completed successfully");
        
        // Update saga state
        order.setSagaState(SagaState.COMPLETED);
        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);
        
        logger.info("Order saga completed successfully for order: {}", order.getId());
    }
    
    /**
     * Reserve inventory for the order
     */
    private void reserveInventory(Order order) {
        logger.info("Reserving inventory for order: {}", order.getId());
        
        // Prepare reservation request
        InventoryReservationRequest request = new InventoryReservationRequest();
        request.setOrderId(order.getId());
        request.setItems(order.getItems().stream()
            .map(item -> new InventoryItemRequest(
                item.getProductId(),
                item.getQuantity()
            ))
            .toList());
        
        // Call inventory service
        inventoryClient.post()
            .uri("/api/inventory/reserve")
            .body(Mono.just(request), InventoryReservationRequest.class)
            .retrieve()
            .bodyToMono(InventoryReservationResponse.class)
            .doOnSuccess(response -> {
                logger.info("Inventory reserved successfully for order: {}", order.getId());
                // Publish inventory reserved event
                publishEvent(new InventoryReservedEvent(
                    order.getId(),
                    order.getUserId(),
                    response.getReservationId(),
                    response.getReservations()
                ));
            })
            .doOnError(error -> {
                logger.error("Inventory reservation failed for order: {}", order.getId(), error);
                // Publish inventory reservation failed event
                publishEvent(new InventoryReservationFailedEvent(
                    order.getId(),
                    order.getUserId(),
                    error.getMessage()
                ));
            })
            .subscribe();
    }
    
    /**
     * Process payment for the order
     */
    private void processPayment(Order order) {
        logger.info("Processing payment for order: {}", order.getId());
        
        // Prepare payment request
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(order.getId());
        request.setAmount(order.getTotalAmount());
        request.setPaymentMethod("credit_card"); // Default payment method
        
        // Call payment service
        paymentClient.post()
            .uri("/api/payment/process")
            .body(Mono.just(request), PaymentRequest.class)
            .retrieve()
            .bodyToMono(PaymentResponse.class)
            .doOnSuccess(response -> {
                logger.info("Payment processed successfully for order: {}", order.getId());
                // Publish payment processed event
                publishEvent(new PaymentProcessedEvent(
                    order.getId(),
                    order.getUserId(),
                    response.getPaymentId(),
                    response.getAmount(),
                    response.getPaymentMethod()
                ));
            })
            .doOnError(error -> {
                logger.error("Payment processing failed for order: {}", order.getId(), error);
                // Publish payment failed event
                publishEvent(new PaymentFailedEvent(
                    order.getId(),
                    order.getUserId(),
                    error.getMessage()
                ));
            })
            .subscribe();
    }
    
    /**
     * Confirm inventory reservation
     */
    private void confirmInventoryReservation(Order order) {
        logger.info("Confirming inventory reservation for order: {}", order.getId());
        
        // Call inventory service to confirm reservation
        inventoryClient.post()
            .uri("/api/inventory/confirm")
            .body(Mono.just(new InventoryConfirmationRequest(order.getId())), InventoryConfirmationRequest.class)
            .retrieve()
            .bodyToMono(Void.class)
            .doOnSuccess(response -> {
                logger.info("Inventory reservation confirmed for order: {}", order.getId());
                // Publish order completed event
                publishEvent(new OrderCompletedEvent(
                    order.getId(),
                    order.getUserId(),
                    OrderStatus.COMPLETED
                ));
            })
            .doOnError(error -> {
                logger.error("Inventory confirmation failed for order: {}", order.getId(), error);
                handleSagaFailure(order, "Inventory confirmation failed: " + error.getMessage());
            })
            .subscribe();
    }
    
    /**
     * Compensate inventory reservation (release reserved inventory)
     */
    private void compensateInventoryReservation(Order order) {
        logger.info("Compensating inventory reservation for order: {}", order.getId());
        
        // Call inventory service to release reservation
        inventoryClient.post()
            .uri("/api/inventory/release")
            .body(Mono.just(new InventoryReleaseRequest(order.getId())), InventoryReleaseRequest.class)
            .retrieve()
            .bodyToMono(Void.class)
            .doOnSuccess(response -> {
                logger.info("Inventory reservation released for order: {}", order.getId());
                // Publish inventory released event
                publishEvent(new InventoryReleasedEvent(
                    order.getId(),
                    order.getUserId(),
                    UUID.randomUUID() // reservation ID
                ));
            })
            .doOnError(error -> {
                logger.error("Failed to release inventory reservation for order: {}", order.getId(), error);
            })
            .subscribe();
    }
    
    /**
     * Send notification
     */
    private void sendOrderNotification(Order order, String message) {
        logger.info("Sending notification for order: {}", order.getId());
        
        NotificationRequest request = new NotificationRequest();
        request.setUserId(order.getUserId());
        request.setOrderId(order.getId());
        request.setType("order_update");
        request.setMessage(message);
        
        notificationClient.post()
            .uri("/api/notify")
            .body(Mono.just(request), NotificationRequest.class)
            .retrieve()
            .bodyToMono(Void.class)
            .doOnSuccess(response -> {
                logger.info("Notification sent successfully for order: {}", order.getId());
            })
            .doOnError(error -> {
                logger.error("Failed to send notification for order: {}", order.getId(), error);
            })
            .subscribe();
    }
    
    /**
     * Handle saga failure
     */
    private void handleSagaFailure(Order order, String reason) {
        logger.error("Saga failed for order: {}, reason: {}", order.getId(), reason);
        
        // Update order status
        order.setStatus(OrderStatus.FAILED);
        order.setSagaState(SagaState.FAILED);
        orderRepository.save(order);
        
        // Publish order failed event
        publishEvent(new OrderFailedEvent(
            order.getId(),
            order.getUserId(),
            reason,
            SagaState.FAILED
        ));
        
        // Send failure notification
        sendOrderNotification(order, "Order failed: " + reason);
    }
    
    /**
     * Publish event (in a real implementation, this would use an event bus)
     */
    private void publishEvent(OrderEvent event) {
        // In a real implementation, this would publish to an event bus like Kafka
        // For now, we'll handle the event synchronously
        handleEvent(event);
    }
    
    /**
     * Handle event based on type
     */
    private void handleEvent(OrderEvent event) {
        switch (event.getEventType()) {
            case "InventoryReserved":
                handleInventoryReserved((InventoryReservedEvent) event);
                break;
            case "InventoryReservationFailed":
                handleInventoryReservationFailed((InventoryReservationFailedEvent) event);
                break;
            case "PaymentProcessed":
                handlePaymentProcessed((PaymentProcessedEvent) event);
                break;
            case "PaymentFailed":
                handlePaymentFailed((PaymentFailedEvent) event);
                break;
            case "OrderCompleted":
                handleOrderCompleted((OrderCompletedEvent) event);
                break;
            default:
                logger.warn("Unknown event type: {}", event.getEventType());
        }
    }
    
    // Request/Response classes
    public static class InventoryReservationRequest {
        private UUID orderId;
        private java.util.List<InventoryItemRequest> items;
        
        // Getters and setters
        public UUID getOrderId() { return orderId; }
        public void setOrderId(UUID orderId) { this.orderId = orderId; }
        public java.util.List<InventoryItemRequest> getItems() { return items; }
        public void setItems(java.util.List<InventoryItemRequest> items) { this.items = items; }
    }
    
    public static class InventoryItemRequest {
        private UUID productId;
        private Integer quantity;
        
        public InventoryItemRequest() {}
        public InventoryItemRequest(UUID productId, Integer quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }
        
        // Getters and setters
        public UUID getProductId() { return productId; }
        public void setProductId(UUID productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
    
    public static class InventoryReservationResponse {
        private UUID reservationId;
        private java.util.List<ReservationData> reservations;
        
        // Getters and setters
        public UUID getReservationId() { return reservationId; }
        public void setReservationId(UUID reservationId) { this.reservationId = reservationId; }
        public java.util.List<ReservationData> getReservations() { return reservations; }
        public void setReservations(java.util.List<ReservationData> reservations) { this.reservations = reservations; }
    }
    
    public static class InventoryConfirmationRequest {
        private UUID orderId;
        
        public InventoryConfirmationRequest() {}
        public InventoryConfirmationRequest(UUID orderId) { this.orderId = orderId; }
        
        public UUID getOrderId() { return orderId; }
        public void setOrderId(UUID orderId) { this.orderId = orderId; }
    }
    
    public static class InventoryReleaseRequest {
        private UUID orderId;
        
        public InventoryReleaseRequest() {}
        public InventoryReleaseRequest(UUID orderId) { this.orderId = orderId; }
        
        public UUID getOrderId() { return orderId; }
        public void setOrderId(UUID orderId) { this.orderId = orderId; }
    }
    
    public static class PaymentRequest {
        private UUID orderId;
        private java.math.BigDecimal amount;
        private String paymentMethod;
        
        // Getters and setters
        public UUID getOrderId() { return orderId; }
        public void setOrderId(UUID orderId) { this.orderId = orderId; }
        public java.math.BigDecimal getAmount() { return amount; }
        public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }
    
    public static class PaymentResponse {
        private UUID paymentId;
        private java.math.BigDecimal amount;
        private String paymentMethod;
        
        // Getters and setters
        public UUID getPaymentId() { return paymentId; }
        public void setPaymentId(UUID paymentId) { this.paymentId = paymentId; }
        public java.math.BigDecimal getAmount() { return amount; }
        public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }
    
    public static class NotificationRequest {
        private UUID userId;
        private UUID orderId;
        private String type;
        private String message;
        
        // Getters and setters
        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }
        public UUID getOrderId() { return orderId; }
        public void setOrderId(UUID orderId) { this.orderId = orderId; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
