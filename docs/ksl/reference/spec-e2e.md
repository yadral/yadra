# e2e (spec)

End-to-end scenarios and test path.

**Imbrication :** [spec](spec.md) → **e2e** — or spec → [outputs](outputs.md) → e2e

| Block | Chain | Description |
|-------|-------|-------------|
| `e2e { … }` | spec → e2e | this page |
| `e2e { … }` in outputs | spec → outputs → e2e | [outputs](outputs.md) |

## Example Usage

```ksl
e2e {
  scenarios = [ "Guest checkout" ]
  path = "src/e2e/checkout"
  mock_externals = true
}
```

## Argument Reference

| Argument | Type | Description |
|----------|------|-------------|
| `scenarios`, `path`, `mock_externals` | | E2E generation hints. |

Project defaults: [project](project.md) `e2e { … }`.
