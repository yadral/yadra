# spec

Vertical **feature** in a domain module. File: `*.spec.ksl`. **T2 entry** after seal.

## Example Usage

```ksl
ksl 1.0

spec "order-checkout" {
  module = "checkout"
  meta { name = "Order Checkout" }
  intention { """…""" }
  outputs { kinds = ["code", "data", "tests"] }
  strategies {
    strategy "Hexagonal" { role = "architecture" description = "…" }
  }
  budget { max_repair_loops = 5 }
}
```

## Imbrication

Each row: block syntax → **chain** (parent to child) → page where it is described.

| Block | Chain | Description |
|-------|-------|-------------|
| `spec "…" { … }` | *(this file)* | this page |
| `meta { … }` | spec → [meta](meta.md) | [meta](meta.md) |
| `intention { … }` | spec → [intention](intention.md) | [intention](intention.md) |
| `scope { … }` | spec → [scope](scope.md) | [scope](scope.md) |
| `flows { … }` | spec → [flows](flows.md) → flow | [flows](flows.md) |
| `openapi { … }` | spec → [openapi](openapi.md) | [openapi](openapi.md) |
| `integrations { … }` | spec → [integrations](integrations.md) → api | [integrations](integrations.md) |
| `messaging { … }` | spec → [messaging](messaging.md) → kafka / rabbit / sqs | [messaging](messaging.md) |
| `data { … }` | spec → [data](data.md) → postgres / … | [data](data.md) |
| `usecases { … }` | spec → [usecases](usecases.md) → usecase | [usecases](usecases.md) |
| `outputs { … }` | spec → [outputs](outputs.md) → docs / e2e | [outputs](outputs.md) |
| `docs { … }` | spec → [spec-docs](spec-docs.md) | [spec-docs](spec-docs.md) |
| `e2e { … }` | spec → [spec-e2e](spec-e2e.md) | [spec-e2e](spec-e2e.md) |
| `strategies { … }` | spec → [strategies](strategies.md) → [strategy](strategy.md) | [strategies](strategies.md) |
| `budget { … }` | spec → [budget](budget.md) | [budget](budget.md) |
| `references { … }` | spec → [references](references.md) | [references](references.md) |

Sibling document: [module](module.md) in the same folder.

## Top-level arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `module` | string | **yes** | Domain id — must match [module](module.md) and folder name. |
| `related_specs` | list(string) | no | Other spec files in the same domain. |

## Consumed by Yadra

T1: validate / seal. T2: `yadra plan` (A). Kind **`code`** → structure via catalogue [`*.strategy.ksl`](../../../yadra/strategies/ksl/README.md) (no [`.code.ksl`](code-ksl.md)).
