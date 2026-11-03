# project

Root, service, or library. File: `*.project.ksl`.

## Example Usage

```ksl
project "order-service" {
  kind = "service"
  meta { name = "Order Service" }
  repo { path = "services/order-service" }
  stack { runtime = "kotlin" framework = "spring-boot-3" }
  communications {
    service "inventory" { protocol = "rest" client = "inventory-client" }
  }
}
```

## Imbrication

| Block | Chain | Description |
|-------|-------|-------------|
| `project "…" { … }` | *(this file)* | this page |
| `meta { … }` | project → [meta](meta.md) | [meta](meta.md) |
| `repo { … }` | project → [repo](repo.md) | [repo](repo.md) |
| `stack { … }` | project → [stack](stack.md) | [stack](stack.md) |
| `dependencies { … }` | project → dependencies | below |
| `communications { … }` | project → communications → service | below |
| `docs { … }` | project → docs | below |
| `e2e { … }` | project → e2e | below |

## dependencies

`libs`, `test_fixtures`, `plugins`, `parent_build`, `parent_pom`, `bom`, …

## communications → service

```ksl
communications {
  service "<name>" {
    protocol = "rest"
    client = "…"
    in_config = true
  }
}
```

## docs (project defaults)

`swagger`, `redoc`, `confluence_space`, `path` — service-wide; feature docs: [spec-docs](spec-docs.md).

## e2e (project defaults)

`framework`, `path` — service-wide; feature e2e: [spec-e2e](spec-e2e.md).

## Top-level arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `kind` | string | **yes** | `root`, `service`, `lib`. |
| `version`, `parent`, `modules` | | no | Version, parent project, module catalogue. |

T2 entry is [spec](spec.md), not project.
