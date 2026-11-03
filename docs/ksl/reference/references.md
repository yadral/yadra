# references

Jira, ADR, external links. Alias: `ref`.

**Imbrication :** [spec](spec.md) → **references**

| Block | Chain | Description |
|-------|-------|-------------|
| `references { … }` | spec → references | this page |

## Example Usage

```ksl
references {
  jira = "ORD-1234"
  adr = "docs/adr/001-checkout.md"
}
```

## Argument Reference

Arbitrary keys → URL, ticket, or path (`jira`, `adr`, …).

Used with `update_jira` in [spec-docs](spec-docs.md).
