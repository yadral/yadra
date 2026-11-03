# meta

Shared metadata on project, module, and spec.

**Imbrication :** [project](project.md) → meta · [module](module.md) → meta · [spec](spec.md) → meta

| Block | Chain | Description |
|-------|-------|-------------|
| `meta { … }` | project → meta | this page |
| `meta { … }` | module → meta | this page |
| `meta { … }` | spec → meta | this page |

## Example Usage

```ksl
meta {
  name = "Order Checkout"
  description = "Checkout feature"
  labels = [ "checkout" ]
  target_service = "order-service"
}
```

## Argument Reference

| Argument | Type | Description |
|----------|------|-------------|
| `name`, `description`, `labels`, `target_service`, `version` | | Human-facing metadata. |
