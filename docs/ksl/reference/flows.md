# flows

Diagram / URL references. Alias container: `flow`.

**Imbrication :** [spec](spec.md) → **flows** → flow

| Block | Chain | Description |
|-------|-------|-------------|
| `flows { … }` | spec → flows → flow | this page |
| `flow "<label>" { … }` | spec → flows → flow | below |

## Example Usage

```ksl
flows {
  flow "Checkout sequence" {
    ref = "docs/diagrams/checkout.png"
    description = "Happy path"
  }
}
```

## flow

| Argument | Type | Description |
|----------|------|-------------|
| `ref`, `url`, `path`, `description` | string | Asset and caption. |
