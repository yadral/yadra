# openapi

OpenAPI lifecycle. Alias: `contract`.

**Imbrication :** [spec](spec.md) → **openapi**

| Block | Chain | Description |
|-------|-------|-------------|
| `openapi { … }` | spec → openapi | this page |

## Example Usage

```ksl
openapi {
  ref = "docs/openapi/service-v1.yaml"
  action = "update"
  version = "1.2.0"
}
```

## Argument Reference

| Argument | Type | Description |
|----------|------|-------------|
| `ref`, `path`, `url` | string | OpenAPI location. |
| `action`, `version`, `breaking_changes`, `description` | | Lifecycle intent. |
