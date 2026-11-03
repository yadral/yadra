# messaging

Kafka, RabbitMQ, SQS, …

**Imbrication :** [spec](spec.md) → **messaging** → kafka / rabbit / sqs

| Block | Chain | Description |
|-------|-------|-------------|
| `messaging { … }` | spec → messaging → broker | this page |
| `kafka { … }` (etc.) | spec → messaging → kafka | below |

## Example Usage

```ksl
messaging {
  kafka {
    topic = "orders.checkout.completed"
    role = "producer"
  }
}
```

## broker

| Argument | Type | Description |
|----------|------|-------------|
| `topic`, `exchange`, `queue` | string | Channel id. |
| `role`, `description`, `in_config` | | Semantics and config. |
