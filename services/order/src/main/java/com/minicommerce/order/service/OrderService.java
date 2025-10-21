package com.minicommerce.order.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.minicommerce.order.model.Order;
import com.minicommerce.order.model.OrderItem;
import com.minicommerce.order.model.OrderStatus;
import com.minicommerce.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class OrderService {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    
    @Autowired
    private OrderRepository orderRepository;
    
    // @Autowired
    // private SagaOrchestrator sagaOrchestrator;
    
    /**
     * Create a new order and start the saga process
     */
    public Order createOrder(CreateOrderRequest request) {
        logger.info("Creating order for user: {}", request.getUserId());
        
        // Create order
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setTotalAmount(request.getTotalAmount() != null ? request.getTotalAmount() : BigDecimal.ZERO);
        order.setShippingAddress(request.getShippingAddress());
        order.setBillingAddress(request.getBillingAddress());
        order.setStatus(OrderStatus.pending);
        
        // Add order items
        for (OrderItemRequest itemRequest : request.getItems()) {
            OrderItem item = new OrderItem(
                itemRequest.getProductId(),
                itemRequest.getProductName(),
                itemRequest.getQuantity(),
                itemRequest.getUnitPrice()
            );
            order.addItem(item);
        }
        
        // Save order
        Order savedOrder = orderRepository.save(order);
        
        // Flush to ensure all items are persisted
        orderRepository.flush();
        
        logger.info("Order created with ID: {}", savedOrder.getId());
        
        // Send notification
        sendOrderNotification(savedOrder);
        
        // Start saga process
        // sagaOrchestrator.startOrderSaga(savedOrder);
        
        // Return the order with items loaded
        return orderRepository.findWithItemsById(savedOrder.getId()).orElse(savedOrder);
    }
    
    /**
     * Send order notification
     */
    private void sendOrderNotification(Order order) {
        try {
            // HTTP client to send notification
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            
            String notificationUrl = "http://mini-commerce-notification:3007/api/notify/";
            String requestBody = String.format(
                "{\"user_id\":\"%s\",\"order_id\":\"%s\",\"type\":\"order_created\",\"title\":\"주문이 생성되었습니다\",\"message\":\"주문번호: %s가 성공적으로 생성되었습니다.\",\"channel\":\"email\",\"status\":\"pending\"}",
                order.getUserId(),
                order.getId(),
                order.getId()
            );
            
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create(notificationUrl))
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(requestBody))
                .build();
                
            client.sendAsync(request, java.net.http.HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> {
                    logger.info("Notification sent successfully for order: {}", order.getId());
                })
                .exceptionally(throwable -> {
                    logger.error("Failed to send notification for order: {}", order.getId(), throwable);
                    return null;
                });
                
        } catch (Exception e) {
            logger.error("Error sending notification for order: {}", order.getId(), e);
        }
    }

    /**
     * Get order by ID
     */
    @Transactional(readOnly = true)
    public Optional<Order> getOrderById(UUID orderId) {
        return orderRepository.findWithItemsById(orderId);
    }
    
    /**
     * Get orders by user ID
     */
    @Transactional(readOnly = true)
    public List<Order> getOrdersByUserId(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    /**
     * Update order status
     */
    public Order updateOrderStatus(UUID orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        
        order.setStatus(status);
        return orderRepository.save(order);
    }
    
    /**
     * Cancel order
     */
    public Order cancelOrder(UUID orderId, String reason) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        
        if (order.getStatus() == OrderStatus.completed) {
            throw new RuntimeException("Cannot cancel completed order");
        }
        
        order.setStatus(OrderStatus.cancelled);
        Order savedOrder = orderRepository.save(order);
        
        logger.info("Order cancelled: {}, reason: {}", orderId, reason);
        return savedOrder;
    }
    
    /**
     * Get order statistics
     */
    @Transactional(readOnly = true)
    public OrderStatistics getOrderStatistics() {
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(OrderStatus.pending);
        long completedOrders = orderRepository.countByStatus(OrderStatus.completed);
        long failedOrders = orderRepository.countByStatus(OrderStatus.failed);
        
        return new OrderStatistics(totalOrders, pendingOrders, completedOrders, failedOrders);
    }
    
    // Request/Response classes
    public static class CreateOrderRequest {
        @JsonProperty("user_id")
        private UUID userId;
        private BigDecimal totalAmount;
        @JsonProperty("shipping_address")
        private String shippingAddress;
        @JsonProperty("billing_address")
        private String billingAddress;
        private List<OrderItemRequest> items;
        
        // Getters and setters
        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public String getShippingAddress() { return shippingAddress; }
        public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }
        public String getBillingAddress() { return billingAddress; }
        public void setBillingAddress(String billingAddress) { this.billingAddress = billingAddress; }
        public List<OrderItemRequest> getItems() { return items; }
        public void setItems(List<OrderItemRequest> items) { this.items = items; }
    }
    
    public static class OrderItemRequest {
        @JsonProperty("product_id")
        private UUID productId;
        @JsonProperty("product_name")
        private String productName;
        private Integer quantity;
        @JsonProperty("unit_price")
        private BigDecimal unitPrice;
        
        // Getters and setters
        public UUID getProductId() { return productId; }
        public void setProductId(UUID productId) { this.productId = productId; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    }
    
    public static class OrderStatistics {
        private long totalOrders;
        private long pendingOrders;
        private long completedOrders;
        private long failedOrders;
        
        public OrderStatistics() {}
        public OrderStatistics(long totalOrders, long pendingOrders, long completedOrders, long failedOrders) {
            this.totalOrders = totalOrders;
            this.pendingOrders = pendingOrders;
            this.completedOrders = completedOrders;
            this.failedOrders = failedOrders;
        }
        
        // Getters and setters
        public long getTotalOrders() { return totalOrders; }
        public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }
        public long getPendingOrders() { return pendingOrders; }
        public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }
        public long getCompletedOrders() { return completedOrders; }
        public void setCompletedOrders(long completedOrders) { this.completedOrders = completedOrders; }
        public long getFailedOrders() { return failedOrders; }
        public void setFailedOrders(long failedOrders) { this.failedOrders = failedOrders; }
    }
}
