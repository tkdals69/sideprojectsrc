package com.minicommerce.order.model;

public enum SagaState {
    ORCHESTRATING,
    COMPENSATING,
    COMPLETED,
    FAILED
}
