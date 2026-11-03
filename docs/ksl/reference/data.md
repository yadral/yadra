# data

Persistence / analytics targets when `"data"` ∈ [outputs](outputs.md).

**Imbrication :** [spec](spec.md) → **data** → postgres / mysql / s3 / …

| Block | Chain | Description |
|-------|-------|-------------|
| `data { … }` | spec → data → engine | this page |
| `postgres { … }` (etc.) | spec → data → postgres | below |

## Example Usage

```ksl
data {
  postgres {
    schema = "checkout"
    database = "order_service"
    description = "Orders and Flyway migrations."
  }
}
```

## engine (postgres, s3, …)

| Argument | Type | Description |
|----------|------|-------------|
| `schema`, `database`, `bucket`, `dataset`, … | | Engine-specific. |
| `description`, `in_config` | | Intent and config binding. |

Allowed engines also listed on project [stack](stack.md) `data = [ … ]`.
