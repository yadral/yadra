# usecases

Given / when / then for `"tests"` ∈ [outputs](outputs.md).

**Imbrication :** [spec](spec.md) → **usecases** → usecase

| Block | Chain | Description |
|-------|-------|-------------|
| `usecases { … }` | spec → usecases → usecase | this page |
| `usecase "<title>" { … }` | spec → usecases → usecase | below |

## Example Usage

```ksl
usecases {
  usecase "Happy path checkout" {
    given = "Valid cart"
    when = "POST /checkout"
    then = [ "Order created" ]
  }
}
```

## usecase

| Argument | Type | Description |
|----------|------|-------------|
| `given` / `context`, `when` / `scenario`, `then` / `expected` | string or list | Scenario steps. |
