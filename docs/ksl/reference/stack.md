# stack

Technology stack on [project](project.md).

**Imbrication :** [project](project.md) → **stack**

| Block | Chain | Description |
|-------|-------|-------------|
| `stack { … }` | project → stack | this page |

## Example Usage

```ksl
stack {
  runtime = "kotlin"
  framework = "spring-boot-3"
  data = [ "postgres" ]
}
```

## Argument Reference

| Argument | Type | Description |
|----------|------|-------------|
| `build`, `runtime`, `framework`, `data`, `infra` | | Generators and allowed engines. |

Feature-level persistence: [data](data.md) on [spec](spec.md).
