# repo

Repository path on [project](project.md).

**Imbrication :** [project](project.md) → **repo**

| Block | Chain | Description |
|-------|-------|-------------|
| `repo { … }` | project → repo | this page |

## Example Usage

```ksl
repo {
  path = "services/order-service"
  vcs = "git"
}
```

## Argument Reference

| Argument | Type | Description |
|----------|------|-------------|
| `path`, `vcs`, `remote`, `branch` | string | Repo location and VCS. |
