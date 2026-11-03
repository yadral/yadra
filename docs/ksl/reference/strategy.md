# strategy

One named design choice (`role`, `description` required for L3).

**Imbrication :** [spec](spec.md) → [strategies](strategies.md) → **strategy**

| Block | Chain | Description |
|-------|-------|-------------|
| `strategy "<name>" { … }` | spec → strategies → strategy | this page |

## Example Usage

```ksl
strategy "FluentCaseTest" {
  role = "testing"
  description = "Given/When/Then under src/test."
}
```

## Argument Reference

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `description` | string | **yes** | How to apply this choice in the codebase. |
| `role` | string | no | `architecture`, `pattern`, `testing`, … |

Block label `"<name>"` is the strategy id (e.g. `Hexagonal`).

## Consumed by Yadra

T2 · B selects project SKILLS from name + role + description.
