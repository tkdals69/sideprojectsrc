package com.minicommerce.order.model;

public enum SagaState {
    orchestrating,
    compensating,
    completed,
    failed
}
