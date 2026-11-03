# budget

T2 compile–repair limits for the whole spec.

**Imbrication :** [spec](spec.md) → **budget**

| Block | Chain | Description |
|-------|-------|-------------|
| `budget { … }` | spec → budget | this page |

## Example Usage

```ksl
budget {
  max_repair_loops = 5
  max_iterations = 8
}
```

## Argument Reference

| Argument | Type | Description |
|----------|------|-------------|
| `max_repair_loops` | integer | Max repair cycles after gate failure. |
| `max_iterations` | integer | Max compile iterations. |

## Consumed by Yadra

`yadra plan --format json`, `yadra execute` (sandbox repair loop).
