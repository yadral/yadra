# scope

Included / excluded boundaries.

**Imbrication :** [spec](spec.md) → **scope**

| Block | Chain | Description |
|-------|-------|-------------|
| `scope { … }` | spec → scope | this page |

## Example Usage

```ksl
scope {
  included = [ "Payment authorization" ]
  excluded = [ "Refunds" ]
}
```

## Argument Reference

| Argument | Type | Description |
|----------|------|-------------|
| `included`, `excluded` | list or string | In / out of scope. |
