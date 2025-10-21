package com.minicommerce.order.controller;

import com.minicommerce.order.dto.OrderDTO;
import com.minicommerce.order.model.Order;
import com.minicommerce.order.model.OrderStatus;
import com.minicommerce.order.service.OrderService;
import com.minicommerce.order.service.OrderService.CreateOrderRequest;
import com.minicommerce.order.service.OrderService.OrderStatistics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    
    @Autowired
    private OrderService orderService;
    
    /**
     * Create a new order
     */
    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        try {
            logger.info("Creating order for user: {}", request.getUserId());
            Order order = orderService.createOrder(request);
            logger.info("Order created successfully with ID: {}", order.getId());
            OrderDTO orderDTO = new OrderDTO(order);
            return ResponseEntity.status(HttpStatus.CREATED).body(orderDTO);
        } catch (Exception e) {
            logger.error("Failed to create order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get order by ID
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDTO> getOrder(@PathVariable UUID orderId) {
        try {
            Optional<Order> order = orderService.getOrderById(orderId);
            if (order.isPresent()) {
                OrderDTO orderDTO = new OrderDTO(order.get());
                return ResponseEntity.ok(orderDTO);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Failed to get order: {}", orderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get orders by user ID
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByUser(@PathVariable UUID userId) {
        try {
            List<Order> orders = orderService.getOrdersByUserId(userId);
            List<OrderDTO> orderDTOs = orders.stream()
                    .map(OrderDTO::new)
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(orderDTOs);
        } catch (Exception e) {
            logger.error("Failed to get orders for user: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Update order status
     */
    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestParam OrderStatus status) {
        try {
            Order order = orderService.updateOrderStatus(orderId, status);
            OrderDTO orderDTO = new OrderDTO(order);
            return ResponseEntity.ok(orderDTO);
        } catch (RuntimeException e) {
            logger.error("Failed to update order status: {}", orderId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to update order status: {}", orderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Cancel order
     */
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<OrderDTO> cancelOrder(
            @PathVariable UUID orderId,
            @RequestParam(required = false) String reason) {
        try {
            Order order = orderService.cancelOrder(orderId, reason);
            OrderDTO orderDTO = new OrderDTO(order);
            return ResponseEntity.ok(orderDTO);
        } catch (RuntimeException e) {
            logger.error("Failed to cancel order: {}", orderId, e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Failed to cancel order: {}", orderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get order statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<OrderStatistics> getOrderStatistics() {
        try {
            OrderStatistics statistics = orderService.getOrderStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            logger.error("Failed to get order statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Object> healthCheck() {
        return ResponseEntity.ok().body(new Object() {
            public String status = "healthy";
            public String service = "order-service";
            public long timestamp = System.currentTimeMillis();
        });
    }
}
