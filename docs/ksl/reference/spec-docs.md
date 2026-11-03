# docs (spec)

Swagger, Redoc, Confluence, Jira sync.

**Imbrication :** [spec](spec.md) → **docs** — or spec → [outputs](outputs.md) → docs

| Block | Chain | Description |
|-------|-------|-------------|
| `docs { … }` | spec → docs | this page |
| `docs { … }` in outputs | spec → outputs → docs | [outputs](outputs.md) |

## Example Usage

```ksl
docs {
  swagger = "/swagger-ui"
  redoc = "/redoc"
  update_jira = true
}
```

## Argument Reference

| Argument | Type | Description |
|----------|------|-------------|
| `swagger`, `redoc`, `confluence`, `path`, `title`, `update_jira` | | Doc targets. |

Project defaults: [project](project.md) `docs { … }`.
